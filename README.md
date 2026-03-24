# tancownia
Aplikacja webowa do publikowania ofert zajęć tanecznych

**Tańcownia** to kompleksowa platforma internetowa (stworzona w ramach mojej pracy inżynierskiej), która łączy tancerzy ze szkołami tańca w całej Polsce. Aplikacja pozwala na intuicyjne wyszukiwanie zajęć, przeglądanie profili szkół oraz zarządzanie grafikiem.

🌐 **https://tancownia.vercel.app/**

<div align="center">
  <img src="https://github.com/user-attachments/assets/9333ac44-394c-46ba-bb18-8d4c0bbe64be" width="500" alt="Screen z telefonu - Strona Główna">
</div>
<br><br>
<div align="center">
  <img width="1142" height="872" alt="Zrzut ekranu 2026-03-24 143057" src="https://github.com/user-attachments/assets/64ebd869-c891-4739-b377-e9c3a3bce328" />
</div>

## Główne funkcjonalności
* **Zaawansowana wyszukiwarka i filtry:** Wyszukiwanie szkół i zajęć po stylu tańca, poziomie zaawansowania, wieku, dniu tygodnia czy akceptowanych kartach partnerskich (MultiSport, Medicover itp.).
* **Geolokacja i mapy:** Integracja z API Nominatim (OpenStreetMap) pozwalająca na wyszukiwanie zajęć w promieniu +50km od wybranej miejscowości.
* **Profile Szkół i Instruktorów:** Dedykowane podstrony z galerią zdjęć, grafikiem zajęć (podział na sale i dni), cennikiem oraz danymi kontaktowymi.
* **System Opinii:** Możliwość oceniania szkół przez zalogowanych użytkowników (tancerzy).
* **Panele zarządzania (Role-based access):** Osobne panele dla właścicieli szkół (zarządzanie grafikiem, salami, cennikiem, kadrą) oraz zwykłych użytkowników.
* **Responsive Web Design (RWD):** Aplikacja w pełni dostosowana do urządzeń mobilnych (off-canvas menu dla filtrów, elastyczne siatki, karuzele).

## 🛠️ Technologie

Projekt został podzielony na nowoczesny frontend i backend REST API.

**Frontend:**
* React.js
* Vite (Build tool)
* React Router DOM (routing)
* Context API (zarządzanie stanem i autoryzacją)
* Axios
* JWT Decode

**Backend:**
* Python / Django
* Django REST Framework (DRF)
* JWT Authentication (SimpleJWT)
* Zewnętrzne API: Nominatim (Geokodowanie OpenStreetMap)

## 🚀 Uruchomienie lokalne
```
git clone https://github.com/TwojNick/tancownia.git
cd tancownia

python -m venv venv
source venv/Scripts/activate  # Windows
# lub: source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

cd tancownia_frontend
npm install
npm run dev
```
