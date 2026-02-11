import type { APIRoute } from 'astro';
import { getGoogleClient, isEmailApproved, createUserSession, SESSION_COOKIE } from '../../lib/auth';
import { OAuth2RequestError } from 'arctic';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('oauth_state')?.value;
  const storedVerifier = cookies.get('oauth_code_verifier')?.value;
  const isLinkingPhotos = cookies.get('link_photos_mode')?.value === 'true';
  
  // Validate request integrity
  if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
    console.error('Auth Validation Failed:', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasStoredState: !!storedState, 
      hasStoredVerifier: !!storedVerifier,
      stateMatch: state === storedState 
    });
    return new Response('Invalid request parameters', { status: 400 });
  }
  
  try {
    // Exchange code for tokens using the stored verifier
    const google = getGoogleClient(url.origin);
    const tokens = await google.validateAuthorizationCode(code, storedVerifier);
    
    // Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`
      }
    });
    
    if (!userInfoResponse.ok) {
      return new Response('Failed to fetch user info', { status: 500 });
    }
    
    const userInfo: { email: string; id: string; verified_email: boolean } = await userInfoResponse.json();
    
    // If we are in "Link Photos" mode, save the refresh token to site config
    if (isLinkingPhotos) {
      const refreshToken = tokens.hasRefreshToken() ? tokens.refreshToken() : undefined;
      if (!refreshToken) {
        return new Response('No refresh token received. Try removing the app from Google account security and linking again.', { status: 400 });
      }

      const { supabaseAdmin } = await import('../../lib/supabase');
      const { error: configError } = await supabaseAdmin
        .from('site_config')
        .upsert({
          id: 'current',
          photos_refresh_token: refreshToken,
          source_email: userInfo.email,
          updated_at: new Date().toISOString()
        });

      if (configError) throw configError;

      // Clean up and redirect back to gallery
      cookies.delete('oauth_state', { path: '/' });
      cookies.delete('oauth_code_verifier', { path: '/' });
      cookies.delete('link_photos_mode', { path: '/' });
      return redirect('/gallery?linked=success');
    }

    // Check if email is approved
    const approved = await isEmailApproved(userInfo.email);
    
    if (!approved) {
      // Redirect to access request page with email
      return redirect(`/gallery/request-access?email=${encodeURIComponent(userInfo.email)}`);
    }
    
    // Create session
    const sessionId = await createUserSession(
      userInfo.email,
      userInfo.id,
      tokens.accessToken(),
      tokens.hasRefreshToken() ? tokens.refreshToken() : undefined
    );
    
    // Set session cookie
    cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: false, // Set to false for local development to ensure it's sent over HTTP
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });
    
    // Clean up OAuth cookies
    cookies.delete('oauth_state', { path: '/' });
    cookies.delete('oauth_code_verifier', { path: '/' });
    
    // Redirect to gallery
    return redirect('/gallery');
    
  } catch (error) {
    console.error('OAuth error Details:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String((error as any).message);
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    if (error instanceof OAuth2RequestError) {
      console.error('OAuth2 Error:', error.message, error.description);
      return new Response(`Invalid authorization code: ${error.message}`, { status: 400 });
    }
    
    return new Response(`Internal server error: ${errorMessage}`, { status: 500 });
  }
};
