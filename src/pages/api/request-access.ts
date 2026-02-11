import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, fullName, message } = await request.json();
    
    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: 'Email and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate unique request token
    const requestToken = crypto.randomUUID();
    
    // Check if request already exists
    const { data: existingRequest } = await supabaseAdmin
      .from('access_requests')
      .select('id, status')
      .eq('email', email)
      .single();
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return new Response(JSON.stringify({ 
          error: 'You already have a pending request' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (existingRequest.status === 'approved') {
        return new Response(JSON.stringify({ 
          error: 'Your access has already been approved. Try signing in.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Create access request
    const { error } = await supabaseAdmin
      .from('access_requests')
      .insert({
        email,
        full_name: fullName,
        message,
        request_token: requestToken,
        status: 'pending'
      });
    
    if (error) throw error;
    
    // TODO: Send email notification to admin
    // For now, just return success
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Request submitted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Access request error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to submit request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
