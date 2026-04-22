
-- ============ TIMESTAMPS HELPER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_preset_id UUID,
  accent_color TEXT DEFAULT 'oklch(0.7 0.2 320)',
  output_format TEXT DEFAULT 'mp4',
  output_resolution TEXT DEFAULT '1080p',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ LUTS ============
CREATE TABLE public.luts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.luts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own luts" ON public.luts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own luts" ON public.luts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own luts" ON public.luts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own luts" ON public.luts FOR DELETE USING (auth.uid() = user_id);

-- ============ ASSETS (reference images) ============
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('face','outfit','car','scene','actor','other')),
  tags TEXT[] DEFAULT '{}',
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- ============ PRESETS ============
CREATE TABLE public.presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  -- Face enhancement
  face_model TEXT DEFAULT 'gfpgan' CHECK (face_model IN ('gfpgan','codeformer','none')),
  face_strength NUMERIC DEFAULT 0.7,
  background_upscale BOOLEAN DEFAULT false,
  -- Color / LUT
  lut_id UUID REFERENCES public.luts(id) ON DELETE SET NULL,
  saturation NUMERIC DEFAULT 0,
  contrast NUMERIC DEFAULT 0,
  warmth NUMERIC DEFAULT 0,
  sharpness NUMERIC DEFAULT 0,
  skin_smoothing NUMERIC DEFAULT 0,
  -- Scene / identity
  face_ref_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  outfit_prompt TEXT,
  scene_prompt TEXT,
  reference_asset_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own presets" ON public.presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own presets" ON public.presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own presets" ON public.presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own presets" ON public.presets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_presets_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_preset_fk
  FOREIGN KEY (default_preset_id) REFERENCES public.presets(id) ON DELETE SET NULL;

-- ============ JOBS ============
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id UUID REFERENCES public.presets(id) ON DELETE SET NULL,
  preset_snapshot JSONB,
  source_filename TEXT NOT NULL,
  input_path TEXT NOT NULL,
  output_path TEXT,
  thumbnail_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploading','processing','done','failed','cancelled')),
  progress NUMERIC DEFAULT 0,
  duration_seconds NUMERIC,
  replicate_prediction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX idx_jobs_user_created ON public.jobs(user_id, created_at DESC);

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('videos-input',  'videos-input',  false),
  ('videos-output', 'videos-output', false),
  ('thumbnails',    'thumbnails',    true),
  ('assets',        'assets',        true),
  ('luts',          'luts',          false);

-- Storage policies (path layout: {user_id}/...)
CREATE POLICY "videos-input read own" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos-input' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "videos-input write own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos-input' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "videos-input update own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos-input' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "videos-input delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos-input' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "videos-output read own" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos-output' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "videos-output write own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos-output' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "videos-output update own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos-output' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "videos-output delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos-output' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "thumbnails public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "thumbnails write own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "thumbnails update own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "thumbnails delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "assets public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');
CREATE POLICY "assets write own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "assets update own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "assets delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "luts read own" ON storage.objects
  FOR SELECT USING (bucket_id = 'luts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "luts write own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'luts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "luts update own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'luts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "luts delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'luts' AND auth.uid()::text = (storage.foldername(name))[1]);
