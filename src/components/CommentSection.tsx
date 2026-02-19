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

  const userComment = comments.find(c => c.user_id === user?.id);

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/recipes/comments/${recipeId}`);
        const data = await response.json();
        if (data.success) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [recipeId]);

  // Load existing comment into form
  useEffect(() => {
    if (userComment) {
      setContent(userComment.content);
      setCharCount(userComment.content.length);
    }
  }, [userComment]);

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

      {/* Comment Form */}
      <div className="comment-form-container">
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="form-group">
            <label htmlFor="comment-input" className="form-label">
              {user ? 'Your Comment' : 'Sign in to comment'}
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
              <button
                type="submit"
                className={`submit-btn ${submitting ? 'loading' : ''}`}
                disabled={submitting || !user || !content.trim()}
              >
                {submitting ? 'Posting...' : userComment ? 'Update Comment' : 'Post Comment'}
              </button>
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
