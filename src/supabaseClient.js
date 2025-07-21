import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://hvgyzhmqyunnquarpbhh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Z3l6aG1xeXVubnF1YXJwYmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1Mzk0NjcsImV4cCI6MjA2ODExNTQ2N30.qdPl4YKFpVc_oDGYTk3LT3aoFwFWfUCJzt5VFgss9UE";

export const supabase = createClient(supabaseUrl, supabaseKey);


window.supabase = supabase;