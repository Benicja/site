import { supabase } from './supabase';

export interface Album {
  google_album_id: string;
  title: string;
  cover_image_url: string;
  album_url: string;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  google_photo_id: string;
  album_id: string;
  image_url: string;
  created_at: string;
}

export async function getAlbums() {
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*')
    .order('title', { ascending: false }); // Works well with YY/MM format
  
  if (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
  return data as Album[];
}

export async function getAlbumById(albumId: string) {
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*')
    .eq('google_album_id', albumId)
    .single();
  
  if (error) {
    console.error('Error fetching album:', error);
    return null;
  }
  return data as Album;
}

export async function getPhotosByAlbumId(albumId: string) {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('album_id', albumId);
  
  if (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
  return data as Photo[];
}
