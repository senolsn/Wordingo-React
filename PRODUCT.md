# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Birincil kullanıcılar, İngilizce öğrenen veya sınavlara (YDS, YÖKDİL, TOEFL, IELTS) hazırlanan Türkçe anadilli öğrenciler ve bireysel öğrenicilerdir. Seviyelerine uygun kelime dağarcığını geliştirmek, zorlandıkları kelimeleri tespit edip pekiştirmek ve seviyelerine göre hedeflenmiş pratik yapmak amacıyla uygulamayı kullanırlar.

## Product Purpose

Wordingo, Türk öğrencilerin İngilizce kelime dağarcığını yapay zeka desteğiyle kişiselleştirilmiş, seviyeye uygun (CEFR A1-C2) ve interaktif bir quiz deneyimiyle hızla geliştirmesini sağlar. Başarı; öğrencinin pasif kelime bilgisini aktif kelime bilgisine dönüştürmesi ve zorlandığı kelimeleri aşarak kelime gruplarını hatasız tamamlamasıdır.

## Positioning

Geleneksel ve statik flashcard uygulamalarından farklı olarak, Gemini AI kullanarak seçilen konu ve CEFR seviyesine göre dinamik kelime grubu üretir; quiz modunda ise rastgele kelimeler yerine anlam ve seviye bağlamına uygun akıllı yanıltıcı seçenekler (distractors) oluşturur. Supabase entegrasyonuyla tüm kelimeler ve ilerleme bulutta güvenle senkronize edilir.

## Operating Context

- **Ortam:** Masaüstü ve mobil web tarayıcıları.
- **Kullanım Rutini:** Düzenli günlük çalışma seansları, sınav hazırlık tekrarları veya kısa mobil pratik molaları.
- **İş Akışları:**
  - Konu ve seviyeye göre yapay zekayla tek tıkla kelime seti oluşturma.
  - Manuel kelime ekleme, düzenleme ve Excel üzerinden toplu içe/dışa aktarma.
  - Çift yönlü quiz çözme (TR→EN ve EN→TR).
  - Hata sayacı (`wrong_count`) ve mükemmel tamamlama (`perfect_completion_count`) ile eksikleri takip etme.

## Capabilities and Constraints

- **Yetenekler:**
  - Kullanıcı kimlik doğrulama (E-posta/Şifre ile Supabase Auth).
  - Kelime grupları CRUD işlemleri ve CEFR seviye etiketleme (A1, A2, B1, B2, C1, C2).
  - Gemini 2.5 Flash destekli dinamik kelime seti oluşturma.
  - Yapay zeka destekli akıllı çeldiricilerle çoktan seçmeli interaktif quiz.
  - Excel (.xlsx) formatında kelime listesi içe/dışa aktarımı.
  - Bulut tabanlı veri senkronizasyonu (Supabase veritabanı).
- **Kısıtlar:**
  - AI özellikleri için geçerli bir `GEMINI_API_KEY` gereklidir.
  - İstemci tarafında çalışan React 19 SPA mimarisi.

## Brand Commitments

- **İsim:** Wordingo (AI Vocabulary Master).
- **Ton & Ses:** Teşvik edici, modern, odaklanmış, net ve eğitici.

## Evidence on Hand

- Çalışır durumda React 19 + TypeScript + Vite kaynak kodları ([App.tsx](file:///d:/source/Wordingo-React/App.tsx), [components/](file:///d:/source/Wordingo-React/components/)).
- Supabase veri modeli (`word_groups`, `words` ilişkisel tabloları).
- Entegre Google GenAI servisi ([services/geminiService.ts](file:///d:/source/Wordingo-React/services/geminiService.ts)).

## Product Principles

1. **Pedagojik Doğruluk:** Kelimeler ve Türkçe karşılıkları CEFR seviyesine uygun, doğal ve doğru olmalıdır.
2. **Akıllı Çeldiricilerle Gerçekçi Ölçüm:** Quiz seçenekleri rastgele kelimelerden değil, öğrencinin dikkatini ve kavrayışını ölçen bağlamsal yanıltıcılardan oluşmalıdır.
3. **Kayıpsız ve Kesintisiz Senkronizasyon:** Öğrencinin oluşturduğu listeler ve başarı istatistikleri cihazlar arasında anında senkronize olmalıdır.
4. **Esnek Çalışma Özgürlüğü:** Hem yapay zeka ile anında liste üretimi hem de Excel veya manuel veri girişiyle tam kontrol sağlanmalıdır.

## Accessibility & Inclusion

- Hem mobil dokunmatik ekranlar hem de masaüstü klavye kullanımıyla tam uyumlu responsive arayüz.
- Uzun çalışma seansları için okunabilirliği yüksek renk kontrastları ve net tipografi hiyerarşisi.
