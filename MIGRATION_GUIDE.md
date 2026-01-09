# Instrukcja Przeniesienia Projektu "Urodziny" na macOS

Ta instrukcja pomoże Ci przenieść Twój projekt Next.js na nowy komputer z systemem macOS.

## 1. Przygotowanie Środowiska na Macu

Zanim skopiujesz pliki, upewnij się, że masz zainstalowane niezbędne narzędzia na nowym komputerze.

### Instalacja Node.js
Najlepiej zainstalować Node.js za pomocą **Homebrew** (jeśli nie masz Homebrew, zainstaluj go ze strony [brew.sh](https://brew.sh)).

Otwórz Terminal na Macu i wpisz:
```bash
brew install node
```

Sprawdź czy działa:
```bash
node -v
npm -v
```

### Kod Edytor
Zalecam zainstalowanie [Visual Studio Code](https://code.visualstudio.com/), jeśli jeszcze go nie masz.

## 2. Kopiowanie Plików

Skopiuj folder `urodziny gemini` na nowy komputer.

> [!IMPORTANT]
> **Nie kopiuj** folderów `node_modules` oraz `.next`. Są one bardzo duże i zostaną wygenerowane na nowo na Macu.

**Lista rzeczy do skopiowania:**
- Folder `src`
- Folder `public`
- Folder `prisma`
- Plik `package.json`
- Plik `package-lock.json`
- Plik `next.config.ts`
- Plik `tsconfig.json`
- Pliki konfiguracyjne (np. `.eslintrc.json`, `tailwind.config.ts` etc.)
- **Plik `.env`** (bardzo ważne! zawiera zmienne środowiskowe z konfiguracją).
  > **Uwaga:** Doszły nowe zmienne do powiadomień! Dopiszesz je na Macu:
  > ```env
  > SMTP_HOST=smtp.gmail.com
  > SMTP_USER=...
  > SMTP_PASS=...
  > SMSAPI_TOKEN=...
  > ```
- **Plik `dev.db`** (jeśli chcesz zachować obecnych gości i dane. Jeśli chcesz czystą bazę, możesz go pominąć).

### 2a. Jeśli skopiowałeś WSZYSTKO (razem z node_modules)

Jeśli przez przypadek lub dla wygody skopiowałeś cały folder razem z `node_modules` i `.next`, **musisz je usunąć** przed uruchomieniem. Są one skompilowane pod Linuxa i nie zadziałają na Macu.

Wykonaj te komendy w folderze projektu na Macu:

```bash
# Usuń folder buildu (to jest ukryty folder z kropką na początku)
# Jeśli go nie widzisz lub cmd zgłasza błąd "nie ma takiego pliku", to OK - po prostu go nie ma.
rm -rf .next

# Usuń folder z bibliotekami
rm -rf node_modules

# WAŻNE: Nie usuwaj pliku next.config.ts!
```

Teraz masz "czysty" projekt i możesz przejść do punktu 3.

## 2b. Jak przesłać pliki przez sieć lokalną? (Dla Agenta i Użytkownika)

Stworzyłem spakowane archiwum `urodziny_backup.zip`, które zawiera wszystkie potrzebne pliki (bez zbędnych śmieci).

**Na starym komputerze (Linux):**
1. Otwórz terminal w folderze, gdzie jest plik `.zip`.
2. Uruchom serwer Python:
   ```bash
   python3 -m http.server 8000
   ```
3. Sprawdź IP tego komputera (np. wpisując `ip a` lub `hostname -I`).

**Na nowym komputerze (Mac):**
1. Otwórz przeglądarkę (Safari/Chrome).
2. Wpisz adres: `http://[IP-STAREGO-KOMPUTERA]:8000`.
3. Kliknij w plik `urodziny_backup.zip`, aby go pobrać.
4. Rozpakuj plik i wejdź do folderu terminalem.

## 3. Instalacja Zależności

1. Otwórz Terminal na Macu.
2. Przejdź do folderu z projektem:
   ```bash
   cd sciezka/do/twojego/projektu
   ```
   (Możesz wpisać `cd ` i przeciągnąć folder do terminala).
3. Zainstaluj biblioteki:
   ```bash
   npm install
   ```

## 4. Konfiguracja Bazy Danych

Jeśli skopiowałeś plik `dev.db`, ten krok jest opcjonalny. Jeśli zaczynasz z "czystą" bazą:

1. Wygeneruj klienta Prisma:
   ```bash
   npx prisma generate
   ```
2. Stwórz strukturę bazy danych:
   ```bash
   npx prisma db push
   ```

## 5. Uruchomienie Projektu

Aby uruchomić projekt w trybie deweloperskim:

```bash
npm run dev
```

Serwer wystartuje standardowo na porcie 3000 (`http://localhost:3000`).

### Zmiana Portu na 3001
Jeśli chcesz uruchomić na porcie 3001 (zgodnie z wcześniejszym planem):

```bash
npm run dev -- -p 3001
```
Lub edytuj plik `package.json` i zmień linijkę `"dev": "next dev"` na `"dev": "next dev -p 3001"`.

## 6. Weryfikacja

Wejdź na `http://localhost:3000` (lub 3001) i sprawdź czy:
- Strona główna się ładuje.
- Możesz się zalogować kodem (jeśli masz dane w bazie).
- Panel admina działa.

Powodzenia! 🚀
