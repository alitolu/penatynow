# 🏆 PenaltyNow Project Map

Kurallar ;
Türkçe cevap vereceksin
1- Mevcutta dosyalar var yeni dosya oluşturulmaz  , mevcut dosyalar üzerinden devam edilecek.
2- Stil bileşenleri UI.tsx de birlecek ve tek olacak
3- React uygulamsı olacak
4 -Style.css sadık kalınacak herhangi bir degisiklik yapılmayacak
/textures/logo.png sadık kalınacak
/textures/ball.png sadık kalınacak

Örnek Uygulama : https://cdn-factory.marketjs.com/en/3d-penalty-kick/index.html

Örnek Sahne Görseli : /sahneGorseli.png

## 1. Proje Yapısı
/src/

  ├── components/
  │   ├── Game.tsx        (Ana oyun motoru ve 3D sahne)
  │   ├── UI.tsx          (Kullanıcı arayüzü ve PowerBar)
  │   ├── Stadium.tsx     (Saha ve kale birleştirilmiş)
  │   ├── Ball.tsx        (Top fiziği ve kontrolü)
  │   ├── Goalkeeper.tsx  (Kaleci AI ve hareketleri)
  │   ├── GameMenu.tsx    (Oyun menüsü)
  │   ├── GoalPlane.tsx   (Gol çizgisi)
  │   └── ConfigEditor.tsx (Ayarlar paneli)
  ├── App.tsx             (Ana uygulama)
  └── index.tsx           (Giriş noktası)
      style.css 

Başlangıç Adımları:
Game.tsx'te üç.js sahnesini kur
Stadium.tsx'te  Saha çizgileri, çim dokusu ve genel stadyum ortamını oluşturur
Ball.tsx'te top fiziğini ayarla
Goalkeeper.tsx'te kaleci hareketlerini ekle  public/models/Goalkeeper.glb kullan ve animasyon başlat
UI.tsx'te güç göstergesini ve skoru göster
GameMenu.tsx'te oyun menüsünü hazırla

// Temel oyun döngüsü
1. Oyuncu "Başlat" butonuna basar
2. Top penaltı noktasına yerleştirilir
3. Güç göstergesi aktif olur , Fifa ve Pes gibi bir 3d ok göstergesi belirir ve kale yönünü algılar
4. Oyuncu boşluk tuşuna basılı tutar (güç)
5. Tuş bırakıldığında top hareket eder
6. Kaleci AI harekete geçer
7. Gol veya kurtarış sonucu gösterilir
8. Skor güncellenir
9. Yeni atış için hazırlanılır

Kontroller:
Fifa/Pes Gibi
BOŞLUK: Güç toplama/şut
Klavye Ok tuşları Yön belirleme
ESC: Menü
R: Yeniden başlat

