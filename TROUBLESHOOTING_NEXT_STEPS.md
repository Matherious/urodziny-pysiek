# Stan Projektu "URODZINY" - Troubleshooting i Następne Kroki
**Data:** 17 Grudnia 2025
**Ostatnia Aktualizacja:** Implementacja "Full Control" w Panelu Admina

## 1. Ostatnio Wdrożone Zmiany (Admin Full Control)

### A. Zarządzanie Gośćmi (Delete)
*   **Funkcja:** Dodano możliwość usuwania gości z poziomu listy.
*   **Backend:** Zaktualizowano `prisma/schema.prisma` dodając `onDelete: Cascade` do relacji `invitedBy`. Dzięki temu usunięcie gościa, który zaprosił "Frienda", usuwa również tego Frienda (zapobiega to błędom spójności danych).
*   **Frontend:** Dodano ikonę kosza w tabeli gości w `admin-client.tsx`.

### B. Blokada RSVP (Lock)
*   **Funkcja:** Administrator może zablokować możliwość zmiany RSVP dla wszystkich gości.
*   **Backend:** Dodano pole `isRsvpLocked` (Boolean) do modelu `EventSettings`.
*   **Frontend (Admin):** Dodano przełącznik "Lock RSVP" w zakładce Settings.
*   **Frontend (Guest):** W `dashboard-client.tsx` dodano logikę sprawdzającą tę flagę. Jeśli jest aktywna (`true`):
    *   Wyświetla się żółty komunikat "RSVP modifications are currently disabled".
    *   Wszystkie pola formularza (Switch, Inputy dla +1) są zablokowane (`disabled`).
    *   Próba wysłania formularza (jeśli ktoś ominie disabled) jest blokowana w funkcji `handleRSVPSubmit` z komunikatem błędu.

### C. Generowanie Zaproszeń (+1)
*   **Status:** **DO PRZETESTOWANIA JUTRO.**
*   **Problem:** Użytkownik zgłaszał, że "Generate Code nie działa" i "+1 nie działa".
*   **Naprawa:** Przepisano formularz w `admin-client.tsx`:
    *   Zmieniono standardowe `action={handleGenerate}` na pełną obsługę `onSubmit={onGenerateSubmit}` po stronie klienta.
    *   Daje to lepszą kontrolę nad walidacją i błędami.
    *   Poprawiono wizualnie sekcję przełącznika "+1", aby była wyraźniejsza.
    *   Upewniono się, że `Switch` ma atrybut `name="plusOneAllowed"`, co jest kluczowe dla `FormData`.

## 2. Znane Problemy i Ostrzeżenia Lintera
*   **TypeScript:** Mogą występować błędy lintera (np. `Property 'isRsvpLocked' does not exist...`) w edytorze. Są one zazwyczaj "fałszywe" (phantom errors), wynikające z tego, że edytor nie odświeżył typów wygenerowanych przez Prismę. `npx prisma generate` zostało uruchomione i build przechodzi poprawnie.

## 3. Plan na "Jutro" (Next Steps)

1.  **Test Generowania Zaproszeń:**
    *   Wejść w panel admina.
    *   Kliknąć "Generate Invite".
    *   Wpisać imię, upewnić się, że "+1" jest włączone.
    *   Kliknąć "Generate Code".
    *   Potwierdzić, że gość pojawił się na liście i ma status "+1: Yes".

2.  **Test Blokady RSVP:**
    *   Włączyć "Lock RSVP" w ustawieniach admina.
    *   Otworzyć Dashboard gościa (np. w trybie incognito lub innej przeglądarce).
    *   Potwierdzić, że nie da się zmienić statusu obecności.

3.  **Implementacja Powiadomień (SMS/Email):**
    *   To jest kolejny duży moduł do zrobienia.

## 4. Kluczowe Pliki

*   `src/app/admin/admin-client.tsx` - Główny widok admina (Goście, Ustawienia).
*   `src/app/dashboard/dashboard-client.tsx` - Widok gościa (RSVP).
*   `src/app/actions/admin.ts` - Server Actions dla admina (generowanie, usuwanie).
*   `src/app/actions/settings.ts` - Server Actions dla ustawień (blokada RSVP).
*   `prisma/schema.prisma` - Definicja bazy danych.

## 5. Komendy Pomocnicze

Uruchomienie projektu:
```bash
npm run dev -- -p 3002
```

Odświeżenie bazy danych (gdyby coś się "rozjechało"):
```bash
npx prisma generate
```
