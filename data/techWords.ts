import { CuratedWord } from '../types';

export const TECH_WORDS: CuratedWord[] = [
  {
    id: 'tch-1',
    word: 'algorithm',
    tr: 'algoritma, çözüm adımları',
    type: 'noun',
    example: 'Search engines use sophisticated ranking algorithms to index relevant web pages.',
    exampleTr: 'Arama motorları ilgili web sayfalarını dizine eklemek için karmaşık sıralama algoritmaları kullanır.'
  },
  {
    id: 'tch-2',
    word: 'repository',
    tr: 'kod deposu, repo',
    type: 'noun',
    example: 'We pushed the latest feature branch to the GitHub repository for team code review.',
    exampleTr: 'Ekip kod incelemesi için en son özellik dalını GitHub kod deposuna gönderdik.'
  },
  {
    id: 'tch-3',
    word: 'latency',
    tr: 'gecikme süresi, yanıt süresi',
    type: 'noun',
    example: 'Edge computing significantly reduces network latency for real-time multiplayer gaming.',
    exampleTr: 'Uç bilişim (edge computing), gerçek zamanlı çok oyunculu oyunlar için ağ gecikme süresini önemli ölçüde azaltır.'
  },
  {
    id: 'tch-4',
    word: 'deploy',
    tr: 'canlıya almak, yayına almak',
    type: 'verb',
    example: 'Our CI/CD automated pipeline can deploy new code to production within three minutes.',
    exampleTr: 'Otomatik CI/CD hattımız yeni kodu üç dakika içinde canlıya alabilir.'
  },
  {
    id: 'tch-5',
    word: 'asynchronous',
    tr: 'eşzamansız, asenkron',
    type: 'adj',
    example: 'JavaScript uses asynchronous promises and async/await to handle API requests without blocking.',
    exampleTr: 'JavaScript, arayüzü kilitlemeden API isteklerini işlemek için asenkron promise ve async/await yapılarını kullanır.'
  },
  {
    id: 'tch-6',
    word: 'redundancy',
    tr: 'yedeklilik, fazlalık (güvenlik için)',
    type: 'noun',
    example: 'Cloud architectures implement multi-region data redundancy to survive hardware outages.',
    exampleTr: 'Bulut mimarileri, donanım kesintilerine dayanabilmek için çok bölgeli veri yedekliliği uygular.'
  },
  {
    id: 'tch-7',
    word: 'vulnerability',
    tr: 'güvenlik açığı, zafiyet',
    type: 'noun',
    example: 'The security patch addressed a critical SQL injection vulnerability in the auth endpoint.',
    exampleTr: 'Güvenlik yaması, kimlik doğrulama uç noktasındaki kritik bir SQL enjeksiyonu zafiyetini giderdi.'
  },
  {
    id: 'tch-8',
    word: 'scalability',
    tr: 'ölçeklenebilirlik',
    type: 'noun',
    example: 'Microservices architecture improved our system scalability during Black Friday traffic surges.',
    exampleTr: 'Mikroservis mimarisi, Efsane Cuma trafik patlamaları sırasında sistemimizin ölçeklenebilirliğini artırdı.'
  },
  {
    id: 'tch-9',
    word: 'refactor',
    tr: 'kodu yeniden düzenlemek / iyileştirmek',
    type: 'verb/noun',
    example: 'We decided to refactor the monolithic legacy codebase into clean, decoupled React hooks.',
    exampleTr: 'Eski monolitik kod tabanını temiz ve bağımsız React kancalarına (hooks) yeniden düzenlemeye karar verdik.'
  },
  {
    id: 'tch-10',
    word: 'dependency',
    tr: 'bağımlılık (kütüphane/paket)',
    type: 'noun',
    example: 'Make sure to run package audit regularly to detect outdated third-party dependencies.',
    exampleTr: 'Eski üçüncü taraf bağımlılıklarını tespit etmek için paket denetimini düzenli çalıştırdığınızdan emin olun.'
  },
  {
    id: 'tch-11',
    word: 'caching',
    tr: 'önbelleğe alma',
    type: 'noun',
    example: 'Implementing Redis caching lowered our database read queries by over seventy percent.',
    exampleTr: 'Redis önbelleğe alma uygulamak, veri tabanı okuma sorgularımızı yüzde yetmişin üzerinde azalttı.'
  },
  {
    id: 'tch-12',
    word: 'bandwidth',
    tr: 'bant genişliği, veri aktarım kapasitesi',
    type: 'noun',
    example: 'High-definition video streaming consumes substantial network bandwidth.',
    exampleTr: 'Yüksek çözünürlüklü video akışı önemli miktarda ağ bant genişliği tüketir.'
  },
  {
    id: 'tch-13',
    word: 'compiler',
    tr: 'derleyici',
    type: 'noun',
    example: 'The TypeScript compiler transforms modern typed code into browser-compatible JavaScript.',
    exampleTr: 'TypeScript derleyicisi, modern tipli kodları tarayıcıyla uyumlu JavaScript’e dönüştürür.'
  },
  {
    id: 'tch-14',
    word: 'endpoint',
    tr: 'uç nokta, API adresi',
    type: 'noun',
    example: 'The authentication endpoint returns a signed JSON Web Token upon successful credential check.',
    exampleTr: 'Kimlik doğrulama uç noktası, başarılı kullanıcı kontrolünün ardından imzalı bir JWT döndürür.'
  },
  {
    id: 'tch-15',
    word: 'concurrency',
    tr: 'eşzamanlılık, aynı anda işlem yapabilme',
    type: 'noun',
    example: 'Go routines excel at handling high concurrency with lightweight OS thread management.',
    exampleTr: 'Go rutinleri, hafif işletim sistemi iş parçacığı yönetimi ile yüksek eşzamanlılığı işlemede mükemmeldir.'
  },
  {
    id: 'tch-16',
    word: 'deprecated',
    tr: 'kullanımdan kaldırılmış / eskimiş',
    type: 'adj',
    example: 'The old REST endpoint is deprecated and will be decommissioned in the next major release.',
    exampleTr: 'Eski REST uç noktası kullanımdan kaldırılmıştır ve bir sonraki ana sürümde tamamen devreden çıkarılacaktır.'
  },
  {
    id: 'tch-17',
    word: 'throughput',
    tr: 'işlem hacmi, birim zamandaki veri akışı',
    type: 'noun',
    example: 'Optimizing our database indexes boosted query throughput by three hundred percent.',
    exampleTr: 'Veri tabanı indekslerimizi optimize etmek, sorgu işlem hacmini yüzde üç yüz artırdı.'
  },
  {
    id: 'tch-18',
    word: 'payload',
    tr: 'veri yükü, taşınan veri',
    type: 'noun',
    example: 'Keep HTTP request payloads compact by stripping unnecessary nested attributes.',
    exampleTr: 'Gereksiz iç içe öznitelikleri ayıklayarak HTTP istek veri yüklerini kompakt tutun.'
  },
  {
    id: 'tch-19',
    word: 'framework',
    tr: 'yazılım çatısı / altyapısı',
    type: 'noun',
    example: 'React and Vue are leading front-end component frameworks for building single-page apps.',
    exampleTr: 'React ve Vue, tek sayfalık uygulamalar geliştirmek için önde gelen ön yüz bileşen çatılarıdır.'
  },
  {
    id: 'tch-20',
    word: 'sandbox',
    tr: 'yalıtılmış ortam, korumalı alan',
    type: 'noun',
    example: 'Untrusted user scripts must always execute inside a strictly isolated sandbox.',
    exampleTr: 'Güvenilmeyen kullanıcı betikleri her zaman sıkıca yalıtılmış bir korumalı alanda çalıştırılmalıdır.'
  },
  {
    id: 'tch-21',
    word: 'immutable',
    tr: 'değiştirilemez, sabit',
    type: 'adj',
    example: 'Functional programming promotes immutable state to prevent accidental side effects.',
    exampleTr: 'Fonksiyonel programlama, kazara oluşabilecek yan etkileri önlemek için değiştirilemez durumu teşvik eder.'
  },
  {
    id: 'tch-22',
    word: 'runtime',
    tr: 'çalışma zamanı',
    type: 'noun',
    example: 'Node.js is an open-source cross-platform JavaScript runtime environment.',
    exampleTr: 'Node.js, açık kaynaklı ve platformlar arası bir JavaScript çalışma zamanı ortamıdır.'
  },
  {
    id: 'tch-23',
    word: 'bottleneck',
    tr: 'performans darboğazı',
    type: 'noun',
    example: 'Profiling the application revealed that unindexed database joins were the main bottleneck.',
    exampleTr: 'Uygulamayı profillemek, indekslenmemiş veri tabanı birleştirmelerinin ana darboğaz olduğunu ortaya koydu.'
  },
  {
    id: 'tch-24',
    word: 'encryption',
    tr: 'şifreleme, kriptolama',
    type: 'noun',
    example: 'End-to-end encryption ensures that only the communicating users can read the sent messages.',
    exampleTr: 'Uçtan uca şifreleme, gönderilen mesajları yalnızca iletişim kuran kullanıcıların okuyabilmesini sağlar.'
  },
  {
    id: 'tch-25',
    word: 'tokenization',
    tr: 'jetonlaştırma, simgeleştirme',
    type: 'noun',
    example: 'Large language models process text by breaking down raw strings into numerical tokens.',
    exampleTr: 'Büyük dil modelleri, ham metin dizilerini sayısal jetonlara (token) bölerek işler.'
  },
  {
    id: 'tch-26',
    word: 'parameter',
    tr: 'parametre, değişken girdi',
    type: 'noun',
    example: 'This neural network architecture has over seven billion trainable parameters.',
    exampleTr: 'Bu yapay sinir ağı mimarisinde yedi milyarın üzerinde eğitilebilir parametre bulunmaktadır.'
  },
  {
    id: 'tch-27',
    word: 'webhook',
    tr: 'olay tetikleyici bildirim URL’i',
    type: 'noun',
    example: 'Stripe sends an automated webhook to our server as soon as a customer payment succeeds.',
    exampleTr: 'Stripe, bir müşteri ödemesi başarılı olur olmaz sunucumuza otomatik bir webhook bildirimi gönderir.'
  },
  {
    id: 'tch-28',
    word: 'benchmark',
    tr: 'performans testi, kıyaslama ölçütü',
    type: 'noun/verb',
    example: 'We ran stress-test benchmarks to compare the performance of PostgreSQL and MongoDB.',
    exampleTr: 'PostgreSQL ve MongoDB’nin performansını kıyaslamak için stres testi kıyaslamaları çalıştırdık.'
  },
  {
    id: 'tch-29',
    word: 'middleware',
    tr: 'ara katman yazılımı',
    type: 'noun',
    example: 'Authentication middleware intercepts incoming requests before they reach the route controller.',
    exampleTr: 'Kimlik doğrulama ara katmanı, gelen istekleri rota denetleyicisine ulaşmadan önce yakalar.'
  },
  {
    id: 'tch-30',
    word: 'parse',
    tr: 'ayrıştırmak, yapılandırmak',
    type: 'verb',
    example: 'The browser needs to parse the incoming HTML document before constructing the DOM tree.',
    exampleTr: 'Tarayıcı, DOM ağacını oluşturmadan önce gelen HTML belgesini ayrıştırmak zorundadır.'
  },
  {
    id: 'tch-31',
    word: 'inheritance',
    tr: 'kalıtım, miras alma',
    type: 'noun',
    example: 'Object-oriented programming utilizes class inheritance to share methods across hierarchies.',
    exampleTr: 'Nesne yönelimli programlama, hiyerarşiler arasında metotları paylaşmak için sınıf kalıtımını kullanır.'
  },
  {
    id: 'tch-32',
    word: 'rollback',
    tr: 'eski sürüme geri alma / dönme',
    type: 'noun/verb',
    example: 'When the migration failed, the database transaction initiated an automatic rollback.',
    exampleTr: 'Veri tabanı geçişi başarısız olduğunda, işlem otomatik bir geri alma (rollback) başlattı.'
  },
  {
    id: 'tch-33',
    word: 'deadlock',
    tr: 'kilitlenme, çıkmaz (iş parçacıkları)',
    type: 'noun',
    example: 'Two competing transactions attempted to lock the same row, triggering a database deadlock.',
    exampleTr: 'Birbirleriyle yarışan iki işlem aynı satırı kilitlemeye çalışarak bir veri tabanı kilitlenmesini tetikledi.'
  },
  {
    id: 'tch-34',
    word: 'serialization',
    tr: 'serileştirme, veriyi aktarılabilir formata çevirme',
    type: 'noun',
    example: 'JSON stringification is a common technique for state serialization across network calls.',
    exampleTr: 'JSON dizesine dönüştürme, ağ çağrıları boyunca durum serileştirmesi için yaygın bir tekniktir.'
  },
  {
    id: 'tch-35',
    word: 'garbage collection',
    tr: 'çöp toplama, bellek temizleme',
    type: 'noun',
    example: 'Automatic garbage collection frees up memory allocated to objects that are no longer referenced.',
    exampleTr: 'Otomatik çöp toplama, artık referans verilmeyen nesnelere ayrılmış belleği serbest bırakır.'
  }
];
