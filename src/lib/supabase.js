import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://avszyktedjcgpicksujr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_z3orMM9Hw7qC-SUuJPQiPw_sdw6KWfU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
