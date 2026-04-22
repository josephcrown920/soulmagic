-- LoRAs table
CREATE TABLE public.loras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'face', -- 'face' | 'style' | 'video'
  trigger_word TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'training' | 'ready' | 'failed'
  progress NUMERIC DEFAULT 0,
  training_image_paths TEXT[] DEFAULT '{}',
  training_steps INTEGER DEFAULT 1000,
  replicate_training_id TEXT,
  replicate_model_owner TEXT,
  replicate_model_name TEXT,
  replicate_version_id TEXT,
  weights_url TEXT,
  preview_path TEXT,
  error_message TEXT,
  base_model TEXT DEFAULT 'flux-dev',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.loras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own loras" ON public.loras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own loras" ON public.loras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own loras" ON public.loras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own loras" ON public.loras FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_loras_updated_at
BEFORE UPDATE ON public.loras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generated images table
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lora_id UUID,
  prompt TEXT NOT NULL,
  file_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own gen images" ON public.generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gen images" ON public.generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own gen images" ON public.generated_images FOR DELETE USING (auth.uid() = user_id);

-- Add lora_id to presets
ALTER TABLE public.presets ADD COLUMN lora_id UUID;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('lora-training', 'lora-training', false),
  ('generated-images', 'generated-images', false);

-- Storage policies for lora-training
CREATE POLICY "Users view own lora training files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lora-training' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own lora training files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lora-training' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own lora training files"
ON storage.objects FOR DELETE
USING (bucket_id = 'lora-training' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for generated-images
CREATE POLICY "Users view own generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users insert own generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own generated images"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);