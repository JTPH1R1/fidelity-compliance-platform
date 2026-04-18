// =============================================================================
// Supabase Configuration
// Get these values from: Supabase Dashboard → Project Settings → API
// =============================================================================

const SUPABASE_CONFIG = {
  url:     'https://YOUR_PROhttps://hruxxxybcadlcaxjljpw.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydXh4eHliY2FkbGNheGpsanB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTM3MjYsImV4cCI6MjA5MjA4OTcyNn0.L9Go0H7fNwc2fPFUm8qajihXQTXQhIzdAxT3HLWlcm8'
};

// Returns true when Supabase is properly configured and initialized
function DB_READY() {
  return (
    typeof supabase !== 'undefined' &&
    typeof DB !== 'undefined' &&
    DB._client !== null &&
    typeof SUPABASE_CONFIG !== 'undefined' &&
    SUPABASE_CONFIG.url &&
    !SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID')
  );
}
