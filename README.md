<div align="center">

# 🌟 Wordingo
### AI Destekli Modern Kelime & Dil Öğrenme Platformu (PWA)

Türk öğrencilerin ve dil öğrenicilerinin İngilizce kelime dağarcığını **Google Gemini AI** desteğiyle kişiselleştiren, **CEFR standartlarında (A1-C2)** seviyelendirilmiş ve akıllı çeldiricili interaktif quizlerle hızla geliştiren modern bir **Progressive Web App (PWA)**.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready_%26_Offline-FF5722?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Deploy](https://img.shields.io/badge/GitHub_Actions-Auto_Deploy-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/)

</div>

---

## 📌 Projenin Amacı ve Vizyonu

Geleneksel kelime ezberleme araçları statik, sıkıcı ve bağlamdan yoksundur. **Wordingo**, İngilizce öğrenen veya sınavlara (**YDS, YÖKDİL, TOEFL, IELTS**) hazırlanan öğrencilerin pasif kelime bilgilerini kalıcı ve aktif kelime bilgisine dönüştürmeyi amaçlar:

- **Pedagojik Doğruluk:** Kelimeler ve Türkçe karşılıkları CEFR seviyelerine (A1, A2, B1, B2, C1, C2) göre titizlikle dengelenir.
- **Akıllı Çeldiricilerle Gerçekçi Ölçüm:** Quizlerde rastgele kelimeler yerine öğrencinin kavrayışını ve dikkatini ölçen, yapay zeka tarafından bağlama uygun üretilmiş akıllı yanıltıcı şıklar sunulur.
- **Kişiselleştirilmiş Hata Takibi:** Yanlış yapılan kelimeler hafıza havuzunda toplanır; sıfır hatayla tamamlanan desteler ise özel başarı rozetleriyle (⭐) ödüllendirilir.

---

## ✨ Öne Çıkan Özellikler

### 🤖 1. Gemini AI ile Dinamik Deste Oluşturma
- Herhangi bir konu (örn. *"İş Görüşmesi"*, *"Tıp ve Sağlık"*, *"Akademik Makale"*) ve CEFR seviyesi (A1-C2) seçildiğinde **Google Gemini 2.5 Flash** saniyeler içinde kelimeleri, anlamlarını ve örnek kullanım bağlamlarını üretir.

### 🧠 2. Çift Yönlü & Akıllı Çeldiricili Quiz
- **EN ➔ TR** ve **TR ➔ EN** çift yönlü pratik imkânı.
- Yapay zeka destekli akıllı çeldiriciler: Yanlış seçenekler alakasız sözcükler değil, aynı seviye ve anlam alanından seçilmiş yanıltıcı alternatiflerdir.
- Mobil cihazlara ve dokunmatik ekranlara özel pürüzsüz animasyonlar ve seçim deneyimi.

### 📱 3. Tam Donanımlı PWA (Progressive Web App)
- **Ana Ekrana Ekleme (Add to Home Screen):** iOS Safari ve Android Chrome üzerinden tek dokunuşla yerel uygulama gibi kurulabilir.
- **Çevrimdışı (Offline) Destek:** Workbox altyapısıyla statik varlıklar önbelleğe alınır, internet kesintilerinde bile kesintisiz açılır.
- **Sessiz Otomatik Güncelleme:** Projede yeni bir commit/deploy yapıldığında kullanıcıyı zorlamadan, arka planda en güncel sürüme otomatik geçer.

### ☁️ 4. Supabase ile Bulut Senkronizasyonu
- E-posta ve şifre ile güvenli kullanıcı kimlik doğrulaması (**Supabase Auth**).
- Tüm desteler, kelimeler ve quiz istatistikleri bulutta saklanır; telefon, tablet ve bilgisayar arasında anında eşitlenir.

### 📊 5. Performans ve Başarı İstatistikleri
- **Kusursuz Tamamlama:** Desteyi 0 hatayla bitiren kullanıcılara yıldız rozetleri (⭐) verilir.
- **Hata Takibi:** Yanlış cevaplanan kelimeler kelime kartlarında ve quiz sonunda detaylı olarak gösterilir.

### 📁 6. Excel (XLSX) İçe / Dışa Aktarımı
- Kendi hazırladığınız kelime listelerini Excel formatında sisteme yükleyebilir, mevcut destelerinizi tek tıkla dışa aktarabilirsiniz.

### 🎨 7. Modern & Ergonomik UI/UX
- Mobil öncelikli (Mobile-First) responsive tasarım.
- Açık / Koyu tema (Dark Mode) desteği.
- CEFR seviyelerine göre renk kodlamalı squircle rozetler.

---

## 🛠️ Teknoloji Yığını

| Alan | Teknolojiler |
| :--- | :--- |
| **Frontend Kütüphanesi** | React 19, TypeScript, JSX |
| **Stil & Arayüz** | Tailwind CSS, Lucide React Icons |
| **Derleme & Paketleme** | Vite 6, vite-plugin-pwa, Workbox |
| **Yapay Zeka (AI)** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Veritabanı & Auth** | Supabase (PostgreSQL, Row Level Security, Auth) |
| **CI / CD & Dağıtım** | GitHub Actions, GitHub Pages |

---

## 🚀 Yerel Geliştirme (Local Setup)

### Gereksinimler
- **Node.js** (v18.0.0 veya üzeri)
- **npm** veya **pnpm**
- Geçerli bir **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/) üzerinden ücretsiz temin edilebilir)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullanici-adi/Wordingo-React.git
cd Wordingo-React
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Tanımlayın
Kök dizindeki `.env.example` dosyasını `.env.local` olarak kopyalayın:
```bash
cp .env.example .env.local
```

`.env.local` içeriğini kendi API anahtarlarınızla düzenleyin:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

### 5. Üretim Derlemesi (Build)
```bash
npm run build
npm run preview
```

---

## 📱 PWA Olarak Telefona Yükleme Rehberi

Wordingo, herhangi bir uygulama mağazasına ihtiyaç duymadan doğrudan web tarayıcınızdan telefonunuza kurulabilir:

### 🍎 iOS (iPhone / iPad - Safari)
1. Safari tarayıcısında uygulamayı açın.
2. Ekranın altındaki **Paylaş (Share)** butonuna tıklayın.
3. Menüden **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin ve onaylayın.

### 🤖 Android (Google Chrome)
1. Chrome tarayıcısında uygulamayı açın.
2. Sağ üstteki **üç nokta (⋮)** menüsüne tıklayın.
3. **"Uygulamayı Yükle"** veya **"Ana Ekrana Ekle"** seçeneğini seçin.

> [!TIP]
> Projeye yeni bir güncelleme geldiğinde uygulamayı silip yeniden yüklemenize gerek yoktur. Service Worker yeni sürümü arka planda otomatik indirir ve bir sonraki açılışta güncel hali devreye alır.

---

## 📂 Proje Dizin Yapısı

```text
Wordingo-React/
├── .agent/                  # Proje için özel agent yetenekleri ve tasarım yönergeleri
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Pages otomatik dağıtım iş akışı
├── components/
│   ├── Auth.tsx             # Supabase kullanıcı giriş/kayıt arayüzü
│   ├── DeckDetailsModal.tsx # Deste detay ve kelime listesi modalı
│   ├── LanguageBadge.tsx    # Dil yönü ve seviye rozet bileşeni
│   ├── Quiz.tsx             # Akıllı çeldiricili çoktan seçmeli quiz motoru
│   ├── WordGroupEditor.tsx  # Deste ve kelime düzenleme ekranı
│   └── WordGroupManager.tsx # Ana sayfa deste listesi ve filtreleme yöneticisi
├── lib/
│   └── supabaseClient.ts    # Supabase istemci yapılandırması
├── services/
│   └── geminiService.ts     # Google Gemini AI deste ve quiz üretim servisi
├── types/
│   └── index.ts             # TypeScript arayüz ve veri modelleri
├── index.html               # Uygulama ana HTML şablonu
├── vite.config.ts           # Vite ve PWA eklenti yapılandırması
├── tailwind.config.js       # Tailwind CSS tasarım ayarları
└── package.json             # Bağımlılıklar ve npm scriptleri
```

---

## 🗄️ Veri Modeli (Supabase PostgreSQL)

Uygulama iki temel ilişkisel tablo üzerinde çalışır:

1. **`word_groups`**: Kelime destelerinin başlığı, CEFR seviyesi (`A1`-`C2`), ait olduğu kullanıcı (`user_id`) ve kusursuz tamamlanma sayısı (`perfect_completion_count`).
2. **`words`**: Desteye bağlı kelimeler (`group_id`), İngilizce kelime, Türkçe karşılığı, örnek cümle, telaffuz ve hata sayısı (`wrong_count`).

Her iki tabloda da **Row Level Security (RLS)** kuralları aktiftir; böylece kullanıcılar yalnızca kendi destelerini ve kelimelerini görüntüleyip değiştirebilirler.

---

## 🚀 CI / CD & Canlıya Dağıtım

Proje `main` dalına her `git push` yapıldığında:
1. GitHub Actions otomatik olarak tetiklenir (`.github/workflows/deploy.yml`).
2. Node.js 20 ortamında bağımlılıklar kurulur ve `npm run build` ile PWA derlemesi alınır.
3. Oluşan `dist/` klasörü **GitHub Pages** üzerine otomatik olarak yayınlanır.

---

## 📄 Lisans

Bu proje kişisel ve eğitim amaçlı geliştirilmiş modern bir web uygulamasıdır. Detaylar için depo yöneticisi ile iletişime geçebilirsiniz.
