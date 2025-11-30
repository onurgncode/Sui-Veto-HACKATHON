# Railway Deployment Guide

## 🚀 Hızlı Başlangıç

### 1. Railway'de Proje Oluşturma

1. [Railway.app](https://railway.app) hesabı oluşturun/giriş yapın
2. "New Project" butonuna tıklayın
3. "Deploy from GitHub repo" seçin
4. `sui-veto` repository'nizi seçin
5. **Root Directory ayarlama (İKİ YÖNTEM):**

   **Yöntem 1: Service'i yeniden oluştur (ÖNERİLEN)**
   - Mevcut service'i silin (Settings > Delete Service)
   - "New Service" → "GitHub Repo" seçin
   - Repo'yu seçin
   - Service oluşturulurken "Configure" butonuna tıklayın
   - "Root Directory" alanına `Backend` yazın
   - Service'i oluşturun

   **Yöntem 2: railway.json ile (Alternatif)**
   - Proje root'una `railway.json` dosyası ekledik
   - Bu dosya Railway'e Backend klasörünü kullanmasını söyler
   - Service Settings > Source'da "railway.json" dosyasının okunduğundan emin olun

### 2. Environment Variables Ayarlama

Railway Dashboard > Your Project > Variables sekmesine gidin ve şu değişkenleri ekleyin:

#### Zorunlu Variables

```bash
# Network & Sui
NODE_ENV=production
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
PACKAGE_ID=0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90

# Server
PORT=3000
CORS_ORIGIN=*

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

#### Opsiyonel Variables (Eğer kullanıyorsanız)

```bash
# Surflux (Event Streaming)
SURFLUX_API_KEY=fc664ac9-caa6-4123-96ca-e564c569d910
SURFLUX_FLUX_STREAM_NAME=gulf-menhaden
SURFLUX_API_URL=https://api.surflux.dev

# Walrus (Storage)
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_API_URL=https://aggregator.walrus-testnet.walrus.space

# Enoki (Sponsored Transactions)
ENOKI_API_KEY=your-enoki-api-key
```

### 3. Deploy

Railway otomatik olarak:
- Dockerfile'ı kullanarak build eder
- `npm ci --only=production` ile dependencies yükler
- `npm run build` ile TypeScript compile eder
- `npm start` ile server'ı başlatır

### 4. Domain/URL Alma

Deploy tamamlandıktan sonra:
1. Railway Dashboard > Settings > Generate Domain
2. Veya Custom Domain ekleyin
3. URL'i kopyalayın (örn: `https://your-app.railway.app`)

### 5. CORS_ORIGIN Güncelleme

Frontend Walrus site URL'inizi aldıktan sonra:
1. Railway Dashboard > Variables
2. `CORS_ORIGIN` değerini güncelleyin:
   ```
   CORS_ORIGIN=https://your-walrus-site-url.wal.app
   ```
   Veya testnet portal URL'i:
   ```
   CORS_ORIGIN=http://29b21vx9myf5l5amypmuyrhuh3i2g18z3u0sw7do6lq04g1tpk.localhost:3000
   ```

## 📝 Notlar

- Railway free tier'da 500 saat/ay ücretsiz kullanım var
- Otomatik deploy: Her `git push` sonrası deploy olur
- Logs: Railway Dashboard > Deployments > View Logs
- Health Check: `https://your-app.railway.app/health`

## 🔧 Troubleshooting

### Build Hatası
- `npm ci` başarısız olursa: `package-lock.json` dosyasını kontrol edin
- TypeScript hataları: Build loglarına bakın

### Runtime Hatası
- Environment variables eksik olabilir
- Port 3000'in açık olduğundan emin olun
- Logs'a bakın: Railway Dashboard > Logs

### CORS Hatası
- `CORS_ORIGIN` değerini frontend URL'inizle güncelleyin
- Wildcard (`*`) kullanıyorsanız credentials çalışmayabilir

