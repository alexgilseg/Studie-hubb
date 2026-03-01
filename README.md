# 📚 Studiehubb

Ett enkelt, webbaserat studieverktyg för barn i åldrarna 8–10 år.
Skapa egna övningar, sortera på ämne och åldersgrupp – och låt barnen öva direkt i webbläsaren!

---

## Funktioner

### För barn (elevvyn)
- Filtrera övningar per ålder (8, 9, 10 år) och ämne
- Gör frågesporter med flervalsfrågor eller fritextsvar
- Få direkt återkoppling och ett slutbetyg med uppmuntring
- Roliga emoji-reaktioner beroende på resultat

### För förälder (adminpanelen)
- Lösenordsskyddad adminpanel
- Skapa, redigera och ta bort övningar
- Lägg till flervalsfrågor (med valfritt antal alternativ) eller fritextfrågor
- Filtrera övningslistan per ämne och ålder
- Byt lösenord

### Ämnen som stöds
| Ämne | Ikon |
|------|------|
| Matematik | 📐 |
| Svenska | 📝 |
| Engelska | 🇬🇧 |
| NO (Naturvetenskap) | 🔬 |
| SO (Samhällsorienterning) | 🌍 |
| Teknik | ⚙️ |

---

## Kom igång

### Kör lokalt (ingen installation krävs!)

1. Klona repot:
   ```bash
   git clone https://github.com/alexgilseg/Studie-hubb.git
   cd Studie-hubb
   ```

2. Öppna `index.html` i din webbläsare.
   - På Mac: dubbelklicka på filen i Finder
   - På Windows: högerklicka → Öppna med → Chrome/Edge/Firefox

3. Klart! Övningarna sparas lokalt i webbläsarens minne (localStorage).

### Adminpanelen

Öppna `admin.html` i webbläsaren, eller klicka på **"🔒 Adminpanel"** i elevvyn.

**Standardlösenord:** `studie123`

> Tips: Byt lösenord direkt under Inställningar-fliken!

---

## Projektstruktur

```
Studie-hubb/
├── index.html          # Elevvy (för barnen)
├── admin.html          # Adminpanel (för dig)
├── css/
│   └── style.css       # All CSS-styling
└── js/
    ├── storage.js      # Datalagring (localStorage)
    ├── sample-data.js  # Exempelövningar (laddas första gången)
    ├── app.js          # Logik för elevvyn
    └── admin.js        # Logik för adminpanelen
```

---

## Datalagring

All data sparas i webbläsarens **localStorage** under nyckeln `studiehub_v1`.
Det betyder att:
- Datan finns kvar även om du stänger webbläsaren
- Datan är **kopplad till webbläsaren och datorn** – inte synkad automatiskt
- Om du vill flytta data till en annan dator, exportera via DevTools (F12 → Application → Local Storage)

---

## Fortsätta utveckla

Vill du bygga vidare? Här är några idéer:
- [ ] Exportera/importera övningar som JSON-fil
- [ ] Stöd för bilder i frågor
- [ ] Statistik – se hur barnen klarar sig över tid
- [ ] Enkel backend (Node.js + JSON-fil) för delad data
- [ ] PWA – installera som app på surfplatta

---

## Teknologi

Ren HTML, CSS och JavaScript – inga ramverk, inga installationer.
Fungerar i alla moderna webbläsare (Chrome, Firefox, Edge, Safari).
