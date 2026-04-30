import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnpdndlbgrroftillrwy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WhMAeyI25mAj9qv7_Yyo6w_GShiTyCw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
