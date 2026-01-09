# Plan Wdrożenia Powiadomień (SMS + Email)

## Cel
Wprowadzenie systemu powiadomień dla gości:
1.  **Email**: Potwierdzenia RSVP, "Save the Date".
2.  **SMS**: Szybkie info o zmianach, przypomnienie dzień przed.

## Wymagania (User Review Required)
> [!IMPORTANT]
> **Koszty**: SMSy kosztują. Email (przez Gmail/SMTP) jest zazwyczaj darmowy w małej skali.
> **SMSAPI**: Sugeruję polskiego dostawcę (SMSAPI.pl) ze względu na łatwość i fakt, że to polski projekt ("Urodziny"). Wymagane założenie konta.
> **Gmail**: Wymagane wygenerowanie "Hasła do aplikacji" (App Password).

## Proponowane Zmiany

### 1. Konfiguracja (.env)
Będziemy potrzebować nowych zmiennych:
```env
# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=twoj.email@gmail.com
SMTP_PASS=twoje-haslo-aplikacji

# SMS (SMSAPI)
SMSAPI_TOKEN=twoj-token-z-smsapi
```

### 2. Nowa Biblioteka (`src/lib/notifications.ts`)
Stworzę centralny plik do obsługi wysyłki.
- Funkcja `sendEmail({ to, subject, html })`
- Funkcja `sendSMS({ to, message })` (używając fetch do API SMSAPI)

### 3. Integracja z RSVP
Edycja pliku `src/app/actions/rsvp.ts`:
- Po udanym zapisaniu RSVP -> wyślij maila z potwierdzeniem.

### 4. Panel Admina
Dodanie prostego formularza "Wyślij wiadomość do wszystkich" (opcjonalnie, w przyszłym kroku).

## Plan Weryfikacji

### Automated / Manual Test
1.  Stworzę skrypt testowy `scripts/test-notifications.ts`, który spróbuje wysłać maila/smsa na Twój numer/email (podany w .env).
2.  Uruchomimy go poleceniem: `npx tsx scripts/test-notifications.ts`.
