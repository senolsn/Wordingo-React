import { createClient } from '@supabase/supabase-js';

// Kullanıcı tarafından sağlanan Supabase bağlantı bilgileri.
// Normalde bu bilgiler process.env üzerinden okunur ancak editör ortamında
// doğrudan çalışması için buraya tanımlanmıştır.

// Supabase bağlantı bilgileri.
// 'sb_publishable_' ile başlayan keyler tarayıcı tarafında güvenle kullanılabilir.
// Öncelikli olarak VITE_ env değişkenlerinden okunur, tanımlı değilse varsayılan değerleri kullanır.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dwzdtjsngoxsyzndkmkr.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OpWSRWTnrGEu_PxGybE6hg_aMhUQM4T';

export const supabase = createClient(supabaseUrl, supabaseKey);