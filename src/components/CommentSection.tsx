import React, { useState, useEffect } from 'react';
import type { Comment } from '../lib/supabase';

interface User {
  id: string;
  user_email: string;
  user_name?: string;
  user_avatar?: string;
}

interface Props {
  recipeId: string;
  user: User | null;
  isAdmin?: boolean;
}

export default function CommentSection({ recipeId, user, isAdmin = false }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({});
  const [userHearts, setUserHearts] = useState<Record<string, boolean>>({});
  const [heartingId, setHeartingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const userComment = comments.find(c => c.user_id === user?.id);

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const [commentsRes, heartsRes] = await Promise.all([
          fetch(`/api/recipes/comments/${recipeId}`),
          fetch(`/api/recipes/comments/hearts/${recipeId}`),
        ]);

        const commentsData = await commentsRes.json();
        const heartsData = await heartsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments);
        }

        if (heartsData.success) {
          setHeartCounts(heartsData.hearts);
          
          // Restore user's hearts from the server
          if (user && heartsData.heartsByUser) {
            const userHeartsObj: Record<string, boolean> = {};
            
            // Check which comments this user has hearted
            for (const [commentId, userIds] of Object.entries(heartsData.heartsByUser)) {
              if (Array.isArray(userIds) && userIds.includes(user.id)) {
                userHeartsObj[commentId] = true;
              }
            }
            
            setUserHearts(userHeartsObj);
          } else {
            setUserHearts({});
          }
        }
      } catch (err) {
        console.error('Failed to fetch comments or hearts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [recipeId, user?.id]);

  // Load existing comment into form
  useEffect(() => {
    if (userComment && editingId !== userComment.id) {
      setContent(userComment.content);
      setCharCount(userComment.content.length);
    }
  }, [userComment?.id, editingId]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setContent(text);
      setCharCount(text.length);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login';
      return;
    }

    // Validate content
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/recipes/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe_id: recipeId,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to post comment');
        return;
      }

      // Update comments list
      if (userComment) {
        // Update existing comment
        setComments(comments.map(c => c.id === userComment.id ? data.comment : c));
      } else {
        // Add new comment
        setComments([data.comment, ...comments]);
      }

      setContent('');
      setCharCount(0);
      setEditingId(null);
    } catch (err) {
      setError('Failed to post comment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    setDeletingId(commentId);

    try {
      const response = await fetch(`/api/recipes/comments/delete/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete comment');
        return;
      }

      setComments(comments.filter(c => c.id !== commentId));
      if (userComment?.id === commentId) {
        setContent('');
        setCharCount(0);
      }
    } catch (err) {
      setError('Failed to delete comment');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleHeart = async (commentId: string) => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setHeartingId(commentId);
    const isHearted = !!userHearts[commentId];

    // Optimistic update - immediately update UI
    const newUserHearts = { ...userHearts };
    if (isHearted) {
      delete newUserHearts[commentId];
      setHeartCounts(prev => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] || 0) - 1),
      }));
    } else {
      newUserHearts[commentId] = true;
      setHeartCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + 1,
      }));
    }
    setUserHearts(newUserHearts);

    try {
      const response = await fetch('/api/recipes/comments/heart', {
        method: isHearted ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        const data = await response.json();
        const revertHearts = { ...newUserHearts };
        if (isHearted) {
          revertHearts[commentId] = true;
        } else {
          delete revertHearts[commentId];
        }
        setUserHearts(revertHearts);
        setHeartCounts(prev => ({
          ...prev,
          [commentId]: isHearted ? (prev[commentId] || 0) + 1 : Math.max(0, (prev[commentId] || 0) - 1),
        }));
        return;
      }
    } catch (err) {
      console.error('Failed to heart/unheart comment:', err);
      // Revert optimistic update on error
      const revertHearts = { ...newUserHearts };
      if (isHearted) {
        revertHearts[commentId] = true;
      } else {
        delete revertHearts[commentId];
      }
      setUserHearts(revertHearts);
      setHeartCounts(prev => ({
        ...prev,
        [commentId]: isHearted ? (prev[commentId] || 0) + 1 : Math.max(0, (prev[commentId] || 0) - 1),
      }));
    } finally {
      setHeartingId(null);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingId(comment.id);
    setContent(comment.content);
    setCharCount(comment.content.length);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setContent('');
    setCharCount(0);
  };

  if (loading) {
    return (
      <section className="comment-section">
        <h2 className="comment-title">Comments</h2>
        <div className="comment-loading">Loading comments...</div>
      </section>
    );
  }

  return (
    <section className="comment-section">
      <h2 className="comment-title">Comments</h2>

      {/* Comment Form - Only show if no existing comment or editing */}
      {(!userComment || editingId === userComment.id) && (
        <div className="comment-form-container">
          <form onSubmit={handleSubmit} className="comment-form">
            <div className="form-group">
              <label htmlFor="comment-input" className="form-label">
                {editingId ? 'Edit Your Comment' : user ? 'Your Comment' : 'Sign in to comment'}
              </label>
              <textarea
                id="comment-input"
                className="comment-input"
                placeholder={user ? 'Share your thoughts about this recipe...' : 'Sign in to share your thoughts...'}
                value={content}
                onChange={handleContentChange}
                disabled={!user || submitting}
                rows={3}
              />
              <div className="form-footer">
                <span className={`char-count ${charCount > 475 ? 'warning' : ''}`}>
                  {charCount}/500
                </span>
                <div className="form-buttons">
                  <button
                    type="submit"
                    className={`submit-btn ${submitting ? 'loading' : ''}`}
                    disabled={submitting || !user || !content.trim()}
                  >
                    {submitting ? 'Posting...' : editingId ? 'Update Comment' : 'Post Comment'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleEditCancel}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
          </form>

          {!user && (
            <button
              onClick={() => (window.location.href = '/auth/login')}
              className="login-prompt"
            >
              Sign in with Google to comment
            </button>
          )}
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="commenter-info">
                  {comment.user_image && (
                    <img
                      src={comment.user_image}
                      alt={comment.user_name}
                      className="commenter-avatar"
                    />
                  )}
                  <div className="commenter-details">
                    <p className="commenter-name">{comment.user_name}</p>
                    <p className="comment-date">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="comment-action-buttons">
                  <button
                    onClick={() => handleHeart(comment.id)}
                    disabled={heartingId === comment.id}
                    className={`heart-btn ${userHearts[comment.id] ? 'hearted' : ''}`}
                    title={userHearts[comment.id] ? 'Unlike' : 'Like'}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="heart-icon">
                      <path d="M12 20.364l-7.682-7.682a4.5 4.5 0 016.364-6.364L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364z" />
                    </svg>
                    <span className="heart-count">{heartCounts[comment.id] || 0}</span>
                  </button>

                  {/* Edit button for owner */}
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleEditStart(comment)}
                      disabled={editingId === comment.id}
                      className="edit-btn"
                      title="Edit comment"
                    >
                      ✎
                    </button>
                  )}

                  {/* Delete button for owner or admin */}
                  {(user?.id === comment.user_id || isAdmin) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="delete-btn"
                      title="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <p className="comment-content">{comment.content}</p>

              {comment.updated_at !== comment.created_at && (
                <p className="comment-edited">Edited</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
