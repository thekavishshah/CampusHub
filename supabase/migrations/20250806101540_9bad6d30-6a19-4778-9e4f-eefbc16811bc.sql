-- Create matches table for roommate matching
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  matched_user_id UUID NOT NULL,
  roommate_post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, matched_user_id, roommate_post_id)
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own matches"
ON public.matches
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create matches"
ON public.matches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create swipes table to track who swiped on whom
CREATE TABLE public.swipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  swiped_user_id UUID NOT NULL,
  roommate_post_id UUID NOT NULL,
  is_like BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, swiped_user_id, roommate_post_id)
);

-- Enable RLS
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own swipes"
ON public.swipes
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = swiped_user_id);

CREATE POLICY "Users can create swipes"
ON public.swipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);