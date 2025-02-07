# 🏆 PenaltyNow Project Map

## Proje Kuralları
1. Mevcut dosyalar üzerinden devam edilecek, yeni dosya oluşturulmayacak
2. Stil bileşenleri `UI.tsx`'de birleştirilecek
3. React uygulaması olarak geliştirilecek
4. `style.css`'ye sadık kalınacak
5. `/textures/logo.png` ve `/textures/ball.png` değiştirilmeyecek

## Referans Örnekler
- Örnek Uygulama: https://cdn-factory.marketjs.com/en/3d-penalty-kick/index.html
- Sahne Görseli: `/sahneGorseli.png`

## 1. Proje Yapısı
```
/src/
├── components/
│   ├── Game.tsx          # Ana oyun motoru ve 3D sahne
│   ├── UI.tsx            # Kullanıcı arayüzü ve PowerBar
│   ├── Stadium.tsx       # Saha ve kale entegrasyonu
│   ├── Ball.tsx          # Top fiziği ve kontrolü
│   ├── Goalkeeper.tsx    # Kaleci AI ve hareketleri
│   ├── GameMenu.tsx      # Oyun menüsü
│   ├── GoalPlane.tsx     # Gol çizgisi
│   └── ConfigEditor.tsx  # Ayarlar paneli
├── App.tsx               # Ana uygulama
└── index.tsx             # Giriş noktası
    style.css 
```

## 2. Geliştirme Adımları

### Teknik Kurulum
- Three.js sahnesini `Game.tsx`'te kur
- Stadyum çizgilerini ve çim dokusunu `Stadium.tsx`'te oluştur
- Top fiziğini `Ball.tsx`'te ayarla
- Kaleci hareketlerini `Goalkeeper.tsx`'te ekle
  - `public/models/Goalkeeper.glb` modelini kullan
  - Animasyonları başlat
- Güç göstergesini ve skoru `UI.tsx`'te göster
- Oyun menüsünü `GameMenu.tsx`'te hazırla

### Oyun Döngüsü
1. Oyuncu "Başlat" butonuna basar
2. Top penaltı noktasına yerleştirilir
3. Güç göstergesi aktif olur
   - FIFA ve PES benzeri 3D ok göstergesi
   - Kale yönünü algılama
4. Oyuncu boşluk tuşuna basılı tutar (güç toplama)
5. Tuş bırakıldığında top hareket eder
6. Kaleci AI harekete geçer
7. Gol veya kurtarış sonucu gösterilir
8. Skor güncellenir
9. Yeni atış için hazırlanılır

## 3. Kontrol Mekanizmaları
- Fare/Dokunmatik: Top atış yönü seçimi
- Boşluk Tuşu: Güç toplama
- Enter/Tıklama: Atış

## 4. Performans ve Optimizasyon
- WebGL performansını optimize et
- Hafif 3D modeller kullan
- Gereksiz render'ları önle

## 5. Gelecek Geliştirmeler
- Çoklu oyuncu modu
- Farklı zorluk seviyeleri
- Detaylı istatistik sistemi
