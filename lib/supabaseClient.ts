import { createClient } from '@supabase/supabase-js';

// Kullanıcı tarafından sağlanan Supabase bağlantı bilgileri.
// Normalde bu bilgiler process.env üzerinden okunur ancak editör ortamında
// doğrudan çalışması için buraya tanımlanmıştır.

const supabaseUrl = 'https://dwzdtjsngoxsyzndkmkr.supabase.co';
// 'sb_publishable_' ile başlayan keyler tarayıcı tarafında güvenle kullanılabilir.
const supabaseKey = 'sb_publishable_OpWSRWTnrGEu_PxGybE6hg_aMhUQM4T';

export const supabase = createClient(supabaseUrl, supabaseKey);