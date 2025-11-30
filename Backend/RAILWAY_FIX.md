# Railway Build Hatası Çözümü

## ❌ Hata
```
Error creating build plan with Railpack
```

## 🔍 Sorun
Railway otomatik olarak Railpack (otomatik build sistemi) kullanmaya çalışıyor, Dockerfile'ı kullanmıyor.

## ✅ Çözüm Adımları

### 1. Railway Settings'te Builder'ı Ayarla

1. Railway Dashboard'da **"Sui-Veto-HACKATHON"** service'ine git
2. **Settings** sekmesine tıkla
3. **Build** bölümünü bul
4. **Builder** dropdown'ından **"Dockerfile"** seç
5. **Dockerfile Path**: `Backend/Dockerfile` yaz (veya boş bırak)
6. **Save** butonuna tıkla

### 2. Environment Variable Ekle (Alternatif/İlave)

Eğer Settings'te builder ayarı görünmüyorsa:

1. **Variables** sekmesine git
2. Yeni variable ekle:
   - **Name**: `RAILWAY_DOCKERFILE_PATH`
   - **Value**: `Backend/Dockerfile`
3. **Add** butonuna tıkla

### 3. railway.json Dosyası

Proje root'unda `railway.json` dosyası var ve şu şekilde:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Backend/Dockerfile",
    "dockerContext": "Backend"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Bu dosya Railway'e Dockerfile kullanmasını söyler.

### 4. Değişiklikleri Commit Et

```bash
git add railway.json
git commit -m "Fix Railway Dockerfile configuration"
git push
```

### 5. Yeniden Deploy

Railway otomatik olarak yeniden deploy edecek. Eğer olmazsa:
- **Deployments** sekmesine git
- **Redeploy** butonuna tıkla

## 🔧 Alternatif Çözüm: Service'i Yeniden Oluştur

Eğer yukarıdaki adımlar çalışmazsa:

1. Mevcut service'i sil (Settings > Delete Service)
2. **New Service** → **GitHub Repo** seç
3. Repo'yu seç
4. Service oluşturulurken:
   - **Builder**: Dockerfile seç
   - **Root Directory**: `Backend` yaz (eğer görünüyorsa)
5. Service'i oluştur

## 📝 Kontrol Listesi

- [ ] Settings > Build > Builder: Dockerfile seçildi
- [ ] Variables > RAILWAY_DOCKERFILE_PATH: `Backend/Dockerfile` eklendi
- [ ] railway.json dosyası proje root'unda var
- [ ] Değişiklikler commit edildi ve push edildi
- [ ] Yeniden deploy edildi

## 🐛 Hala Çalışmıyorsa

1. **Logs** sekmesine bak ve hata mesajını kontrol et
2. Dockerfile'ın doğru yerde olduğundan emin ol (`Backend/Dockerfile`)
3. Dockerfile içeriğini kontrol et (TypeScript build için devDependencies gerekli)

## 📚 Kaynaklar

- [Railway Dockerfile Docs](https://docs.railway.com/deploy/dockerfiles)
- [Railway Build Configuration](https://docs.railway.com/guides/build-configuration)
- [Railway Monorepo Guide](https://docs.railway.com/guides/monorepo)

