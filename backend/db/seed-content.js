/**
 * Studie-hubb — Innehållsfrö
 * Seedar databasen med 40+ övningar för svenska barn ålder 7–10 (åk 2–4).
 * Körs automatiskt vid första start om inga övningar finns.
 */

const db = require('./database');

function seedContent() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM exercises').get();
  if (existing.c > 0) return;

  console.log('  📚 Seedar innehållsbibliotek...');

  const insertEx = db.prepare(`
    INSERT INTO exercises (title, subject, description, difficulty, is_procedural, age_min, age_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQ = db.prepare(`
    INSERT INTO questions (exercise_id, type, question_text, options_json, correct_answer, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertT = db.prepare(`
    INSERT INTO question_templates (exercise_id, template_text, variables_json, answer_formula, difficulty)
    VALUES (?, ?, ?, ?, ?)
  `);

  function ex(title, subject, description, difficulty, age_min, age_max, is_procedural = 0) {
    const r = insertEx.run(title, subject, description, difficulty, is_procedural, age_min, age_max);
    return r.lastInsertRowid;
  }

  function mc(exId, text, options, correctIndex, order = 0) {
    insertQ.run(exId, 'multiple_choice', text, JSON.stringify(options), String(correctIndex), order);
  }

  function txt(exId, text, answer, order = 0) {
    insertQ.run(exId, 'text_input', text, null, String(answer), order);
  }

  function tpl(exId, templateText, variables, formula, difficulty = 1) {
    insertT.run(exId, templateText, JSON.stringify(variables), formula, difficulty);
  }

  const seed = db.transaction(() => {

    // ============================================================
    // MATEMATIK
    // ============================================================

    let id = ex('Addition till 20', 'matematik',
      'Öva på att addera tal upp till 20. Perfekt för att bygga upp din beräkningskänsla!',
      1, 7, 9);
    mc(id, 'Vad är 8 + 7?', ['13', '15', '16', '14'], 1, 0);
    mc(id, 'Vad är 6 + 9?', ['14', '13', '15', '16'], 2, 1);
    mc(id, 'Vad är 4 + 8?', ['11', '12', '10', '13'], 1, 2);
    txt(id, 'Vad är 7 + 6?', '13', 3);
    txt(id, 'Vad är 9 + 9?', '18', 4);
    mc(id, 'Vad är 5 + 8?', ['12', '14', '13', '11'], 2, 5);
    txt(id, 'Vad är 7 + 7?', '14', 6);
    mc(id, 'Vad är 3 + 9?', ['11', '13', '12', '10'], 2, 7);

    id = ex('Subtraktion till 20', 'matematik',
      'Öva på att subtrahera tal. Hur snabbt kan du räkna?',
      1, 7, 9);
    mc(id, 'Vad är 15 - 6?', ['7', '8', '9', '10'], 2, 0);
    mc(id, 'Vad är 12 - 5?', ['6', '7', '8', '5'], 1, 1);
    txt(id, 'Vad är 20 - 13?', '7', 2);
    txt(id, 'Vad är 17 - 9?', '8', 3);
    mc(id, 'Vad är 14 - 7?', ['6', '8', '7', '9'], 2, 4);
    txt(id, 'Vad är 18 - 6?', '12', 5);
    mc(id, 'Vad är 11 - 4?', ['5', '6', '8', '7'], 3, 6);
    txt(id, 'Vad är 16 - 8?', '8', 7);

    id = ex('Multiplikationstabellen: 2:an och 3:an', 'matematik',
      'Kan du multiplikationstabellen för 2 och 3? Öva och bli proffs!',
      2, 8, 10);
    txt(id, 'Vad är 2 × 7?', '14', 0);
    mc(id, 'Vad är 3 × 6?', ['15', '16', '17', '18'], 3, 1);
    txt(id, 'Vad är 2 × 9?', '18', 2);
    mc(id, 'Vad är 3 × 4?', ['10', '11', '12', '13'], 2, 3);
    txt(id, 'Vad är 2 × 5?', '10', 4);
    txt(id, 'Vad är 3 × 8?', '24', 5);
    mc(id, 'Vad är 2 × 8?', ['14', '15', '16', '17'], 2, 6);
    txt(id, 'Vad är 3 × 9?', '27', 7);

    id = ex('Multiplikationstabellen: 4:an och 5:an', 'matematik',
      'Nu testar vi 4:an och 5:an! Klarar du alla?',
      2, 8, 10);
    txt(id, 'Vad är 4 × 6?', '24', 0);
    mc(id, 'Vad är 5 × 7?', ['30', '35', '40', '25'], 1, 1);
    txt(id, 'Vad är 4 × 8?', '32', 2);
    mc(id, 'Vad är 5 × 9?', ['40', '45', '50', '35'], 1, 3);
    txt(id, 'Vad är 4 × 7?', '28', 4);
    txt(id, 'Vad är 5 × 6?', '30', 5);
    mc(id, 'Vad är 4 × 9?', ['32', '36', '40', '28'], 1, 6);
    txt(id, 'Vad är 5 × 8?', '40', 7);

    id = ex('Multiplikationstabellen: 6, 7, 8 och 9', 'matematik',
      'De svårare tabellerna! Öva tills du kan dem utan att tveka.',
      3, 9, 11);
    txt(id, 'Vad är 6 × 7?', '42', 0);
    mc(id, 'Vad är 8 × 9?', ['63', '72', '81', '64'], 1, 1);
    txt(id, 'Vad är 7 × 7?', '49', 2);
    mc(id, 'Vad är 6 × 9?', ['48', '54', '56', '63'], 1, 3);
    txt(id, 'Vad är 8 × 7?', '56', 4);
    mc(id, 'Vad är 9 × 9?', ['72', '81', '90', '63'], 1, 5);
    txt(id, 'Vad är 6 × 8?', '48', 6);
    txt(id, 'Vad är 7 × 9?', '63', 7);

    id = ex('Division med 2, 3 och 4', 'matematik',
      'Division är att dela upp i lika stora delar. Klarar du det?',
      2, 8, 10);
    txt(id, 'Vad är 12 ÷ 3?', '4', 0);
    mc(id, 'Vad är 16 ÷ 4?', ['3', '4', '5', '6'], 1, 1);
    txt(id, 'Vad är 18 ÷ 2?', '9', 2);
    mc(id, 'Vad är 24 ÷ 3?', ['6', '7', '8', '9'], 2, 3);
    txt(id, 'Vad är 20 ÷ 4?', '5', 4);
    mc(id, 'Vad är 14 ÷ 2?', ['6', '7', '8', '5'], 1, 5);

    id = ex('Hälften och dubbelt', 'matematik',
      'Lär dig beräkna hälften och dubbelt av ett tal.',
      1, 7, 9);
    mc(id, 'Vad är hälften av 10?', ['4', '5', '6', '8'], 1, 0);
    txt(id, 'Vad är dubbelt av 7?', '14', 1);
    mc(id, 'Vad är hälften av 16?', ['6', '7', '8', '9'], 2, 2);
    txt(id, 'Vad är dubbelt av 9?', '18', 3);
    mc(id, 'Vad är hälften av 20?', ['8', '9', '10', '12'], 2, 4);
    txt(id, 'Vad är dubbelt av 12?', '24', 5);

    id = ex('Geometriska former', 'matematik',
      'Kan du namnen på alla geometriska former? Låt oss ta reda på det!',
      1, 7, 9);
    mc(id, 'En form med 3 sidor och 3 hörn kallas...', ['Kvadrat', 'Rektangel', 'Triangel', 'Cirkel'], 2, 0);
    mc(id, 'En form med 4 lika långa sidor kallas...', ['Rektangel', 'Kvadrat', 'Triangel', 'Oval'], 1, 1);
    mc(id, 'En helt rund form utan hörn kallas...', ['Oval', 'Cirkel', 'Ellips', 'Halvcirkel'], 1, 2);
    mc(id, 'Hur många sidor har en hexagon?', ['5', '6', '7', '8'], 1, 3);
    mc(id, 'En rektangel har alltid...', ['4 lika långa sidor', '2 par av lika långa sidor', '3 sidor', '5 hörn'], 1, 4);
    mc(id, 'Hur många hörn har en pentagon?', ['4', '6', '5', '3'], 2, 5);

    id = ex('Klockan — hela och halva timmar', 'matematik',
      'Kan du läsa av klockan? Öva på hela och halva timmar!',
      2, 7, 9);
    mc(id, 'Klockan visar 3:00. Vad är klockan?', ['Tre i tre', 'Tre', 'Halv tre', 'Kvart i tre'], 1, 0);
    mc(id, 'Vad betyder "halv fyra"?', ['04:30', '03:30', '04:00', '03:00'], 1, 1);
    mc(id, 'Klockan 14:00 på dygnet kallas också...', ['Klockan 2 på morgonen', 'Klockan 2 på eftermiddagen', 'Klockan 12', 'Klockan 4'], 1, 2);
    mc(id, 'Hur många timmar är ett dygn?', ['12', '24', '48', '36'], 1, 3);
    mc(id, 'Om klockan är halv nio, hur lång tid är det till klockan 9?', ['30 minuter', '15 minuter', '45 minuter', '1 timme'], 0, 4);
    mc(id, 'Hur många minuter är en halvtimme?', ['15', '25', '30', '45'], 2, 5);

    id = ex('Udda och jämna tal', 'matematik',
      'Lär dig skilja på udda och jämna tal!',
      1, 7, 9);
    mc(id, 'Vilket tal är jämnt?', ['7', '13', '8', '15'], 2, 0);
    mc(id, 'Vilket tal är udda?', ['12', '9', '20', '6'], 1, 1);
    mc(id, 'Är talet 24 jämnt eller udda?', ['Udda', 'Jämnt', 'Varken eller', 'Kan inte avgöras'], 1, 2);
    mc(id, 'Vilket av dessa tal är INTE jämnt?', ['10', '16', '22', '17'], 3, 3);
    mc(id, 'Vad händer när du adderar två jämna tal?', ['Du får alltid ett udda tal', 'Du får alltid ett jämnt tal', 'Det beror på talen', 'Du vet aldrig'], 1, 4);
    mc(id, 'Vilket tal är nästa jämna tal efter 18?', ['19', '20', '21', '22'], 1, 5);

    // Procedural math templates
    id = ex('Blandad addition och subtraktion', 'matematik',
      'Slumpmässiga additions- och subtraktionsuppgifter som aldrig tar slut!',
      1, 7, 9, 1);
    tpl(id, 'Vad är {a} + {b}?', { a: [1, 15], b: [1, 15] }, 'a + b', 1);
    tpl(id, 'Vad är {a} - {b}?', { a: [10, 20], b: [1, 9] }, 'a - b', 1);

    id = ex('Multiplikationsövningar', 'matematik',
      'Oändliga multiplikationsuppgifter. Öva tills du kan tabellerna utantill!',
      2, 8, 10, 1);
    tpl(id, 'Vad är {a} × {b}?', { a: [2, 9], b: [2, 9] }, 'a * b', 2);

    // ============================================================
    // SVENSKA
    // ============================================================

    id = ex('Vokaler och konsonanter', 'svenska',
      'Lär dig skilja på vokaler och konsonanter i det svenska alfabetet!',
      1, 7, 9);
    mc(id, 'Vilka är vokalerna i det svenska alfabetet?', ['b, c, d, f', 'a, e, i, o, u, y, å, ä, ö', 'a, b, c, d, e', 'a, e, i, o'], 1, 0);
    mc(id, 'Är bokstaven "M" en vokal eller konsonant?', ['Vokal', 'Konsonant', 'Varken eller', 'Beror på ordet'], 1, 1);
    mc(id, 'Hur många vokaler finns det i det svenska alfabetet?', ['5', '7', '9', '6'], 2, 2);
    mc(id, 'Vilket ord börjar med en vokal?', ['Bok', 'Hund', 'Äpple', 'Mask'], 2, 3);
    mc(id, 'Är bokstaven "Y" en vokal?', ['Nej', 'Ja', 'Ibland', 'Aldrig'], 1, 4);
    mc(id, 'Hur många konsonanter börjar ordet "strand" med?', ['1', '2', '3', '4'], 2, 5);

    id = ex('Stor bokstav — regler', 'svenska',
      'När ska man skriva med stor bokstav? Öva på reglerna!',
      1, 7, 9);
    mc(id, 'Vilket av dessa ord ska ALLTID skrivas med stor bokstav?', ['hund', 'Stockholm', 'bil', 'hus'], 1, 0);
    mc(id, 'Varför skriver man stor bokstav i början av en mening?', ['Det ser snyggare ut', 'Det är en grammatikregel i svenska', 'Alla gör det', 'Ingen vet'], 1, 1);
    mc(id, 'Vilket ord behöver stor bokstav?', ['fredag', 'klass', 'emma', 'katt'], 2, 2);
    mc(id, 'Ska veckodagar skrivas med stor bokstav?', ['Ja alltid', 'Nej, inte i vanlig text', 'Bara Måndag', 'Bara på loven'], 1, 3);
    mc(id, 'I vilken av dessa meningar är stor bokstav rätt använt?', ['Min hund heter rex.', 'Min hund heter Rex.', 'Min Hund heter rex.', 'min hund heter Rex.'], 1, 4);

    id = ex('Substantiv — namnord', 'svenska',
      'Substantiv är namn på saker, platser, djur och personer. Kan du hitta dem?',
      2, 8, 10);
    mc(id, 'Vilket ord är ett substantiv?', ['Springer', 'Snabb', 'Boll', 'Och'], 2, 0);
    mc(id, 'Hur många substantiv finns i meningen: "Den lilla hunden springer i parken."?', ['1', '2', '3', '4'], 1, 1);
    mc(id, 'Vilket alternativ innehåller BARA substantiv?', ['Löper, hoppar, simmar', 'Stor, liten, röd', 'Bok, skola, lärare', 'I, på, under'], 2, 2);
    mc(id, 'Kan ett djurnamn vara ett substantiv?', ['Nej', 'Ja', 'Ibland', 'Aldrig'], 1, 3);
    mc(id, 'Vilken ordklass hör "glädje" till?', ['Verb', 'Adjektiv', 'Substantiv', 'Adverb'], 2, 4);
    mc(id, 'Vilket av dessa är ett egennamn (ett slags substantiv)?', ['Springer', 'Sverige', 'Grön', 'Snabbt'], 1, 5);

    id = ex('Verb — göringsord', 'svenska',
      'Verb beskriver vad vi gör eller vad som händer. Hitta dem!',
      2, 8, 10);
    mc(id, 'Vilket ord är ett verb?', ['Hund', 'Stor', 'Springer', 'Under'], 2, 0);
    mc(id, 'Verb kallas också...', ['Namnord', 'Göringsord', 'Beskrivningsord', 'Satsord'], 1, 1);
    mc(id, 'Vilket alternativ innehåller BARA verb?', ['Söta, roliga, stora', 'Springer, hoppar, sjunger', 'Bok, boll, bil', 'Men, och, eller'], 1, 2);
    mc(id, 'Vilket är infinitivformen av "sprang"?', ['Springer', 'Springa', 'Sprungit', 'Sprang'], 1, 3);
    mc(id, 'Hitta verbet i meningen: "Flickan läste en bok."', ['Flickan', 'läste', 'en', 'bok'], 1, 4);
    mc(id, 'Vilket ord är ett verb?', ['Blå', 'Bord', 'Äta', 'Snabbt'], 2, 5);

    id = ex('Adjektiv — beskrivningsord', 'svenska',
      'Adjektiv beskriver hur något ser ut, känns eller låter!',
      2, 8, 10);
    mc(id, 'Vilket ord är ett adjektiv?', ['Löper', 'Snabb', 'Katt', 'Och'], 1, 0);
    mc(id, 'Adjektiv kallas också...', ['Göringsord', 'Namnord', 'Beskrivningsord', 'Räkneord'], 2, 1);
    mc(id, 'Vilket alternativ innehåller BARA adjektiv?', ['Springer, hoppar', 'Stor, liten, vacker', 'Hund, katt, fågel', 'I, på, till'], 1, 2);
    mc(id, 'I meningen "Den röda bollen är stor" — hur många adjektiv finns det?', ['1', '2', '3', '0'], 1, 3);
    mc(id, 'Vilket ord kan beskriva hur en blomma ser ut?', ['Springer', 'Blomma', 'Vacker', 'Snabbt'], 2, 4);

    id = ex('Rim och ordpar', 'svenska',
      'Hitta ord som rimmar! Roligt och viktigt för läsning.',
      1, 7, 9);
    mc(id, 'Vilket ord rimmar på "hund"?', ['Katt', 'Rund', 'Stor', 'Blå'], 1, 0);
    mc(id, 'Vilket ord rimmar på "boll"?', ['Stor', 'Koll', 'Liten', 'Röd'], 1, 1);
    mc(id, 'Vilket ord rimmar på "dag"?', ['Natt', 'Tag', 'Morgon', 'Kväll'], 1, 2);
    mc(id, 'Vilket ord rimmar på "sol"?', ['Moln', 'Regn', 'Kol', 'Vind'], 2, 3);
    mc(id, 'Vilket ord rimmar på "barn"?', ['Vuxen', 'Garn', 'Skola', 'Lek'], 1, 4);
    mc(id, 'Vilket ord rimmar på "bok"?', ['Tidning', 'Penna', 'Kok', 'Läsa'], 2, 5);

    id = ex('Sammansatta ord', 'svenska',
      'Sammansatta ord bildas av två ord som sätts ihop. Kan du lista ut dem?',
      2, 8, 10);
    mc(id, 'Vilket ord är ett sammansatt ord?', ['Hund', 'Springer', 'Hundkoppel', 'Stor'], 2, 0);
    mc(id, 'Vad är sammansatt av "mjölk" och "choklad"?', ['Mjölkchoklad', 'Chokladmjölk', 'Mjölkläsk', 'Glassmjölk'], 0, 1);
    txt(id, 'Sätt ihop "sol" och "sken" till ett ord:', 'solsken', 2);
    mc(id, 'Vilket ord är sammansatt av "bil" och "väg"?', ['Vägbil', 'Bilväg', 'Bilspår', 'Körväg'], 1, 3);
    txt(id, 'Sätt ihop "foto" och "boll" till ett ord:', 'fotboll', 4);
    mc(id, 'Av vilka två ord är "snögubbe" sammansatt?', ['Snö + gubbe', 'Snög + ubbe', 'S + nögubbe', 'Snög + gubbe'], 0, 5);

    id = ex('Synonymer', 'svenska',
      'Synonymer är ord som betyder ungefär samma sak. Bygg ditt ordförråd!',
      3, 9, 11);
    mc(id, 'Vad är en synonym till "stor"?', ['Liten', 'Enorm', 'Smal', 'Tunn'], 1, 0);
    mc(id, 'Vad är en synonym till "snabb"?', ['Långsam', 'Seg', 'Snabb', 'Hastig'], 3, 1);
    mc(id, 'Vad är en synonym till "glad"?', ['Ledsen', 'Lycklig', 'Trött', 'Arg'], 1, 2);
    mc(id, 'Vad är en synonym till "prata"?', ['Tiga', 'Tänka', 'Tala', 'Lyssna'], 2, 3);
    mc(id, 'Vad är en synonym till "titta"?', ['Höra', 'Se', 'Känna', 'Smaka'], 1, 4);
    mc(id, 'Vad är en synonym till "häftig"?', ['Tråkig', 'Cool', 'Vanlig', 'Liten'], 1, 5);

    // ============================================================
    // ENGELSKA
    // ============================================================

    id = ex('Färger på engelska', 'engelska',
      'Learn the colours in English! Lär dig färgerna på engelska.',
      1, 7, 9);
    mc(id, 'Hur säger man "röd" på engelska?', ['Blue', 'Green', 'Red', 'Yellow'], 2, 0);
    mc(id, 'Vad betyder "blue" på svenska?', ['Röd', 'Grön', 'Blå', 'Gul'], 2, 1);
    mc(id, 'Hur säger man "grön" på engelska?', ['Green', 'Grey', 'Brown', 'Gold'], 0, 2);
    mc(id, 'Vad betyder "yellow"?', ['Orange', 'Gul', 'Grön', 'Vit'], 1, 3);
    mc(id, 'Hur säger man "vit" på engelska?', ['Black', 'Grey', 'White', 'Silver'], 2, 4);
    mc(id, 'Vad är "lila" på engelska?', ['Pink', 'Purple', 'Violet', 'Lilac'], 1, 5);
    mc(id, 'Hur säger man "orange" på engelska?', ['Orange', 'Peach', 'Amber', 'Coral'], 0, 6);
    mc(id, 'Vad betyder "black"?', ['Grå', 'Vit', 'Brun', 'Svart'], 3, 7);

    id = ex('Siffror 1–20 på engelska', 'engelska',
      'Count in English! Räkna på engelska från 1 till 20.',
      1, 7, 9);
    mc(id, 'Hur säger man "5" på engelska?', ['Four', 'Six', 'Five', 'Seven'], 2, 0);
    mc(id, 'Vad är "thirteen" på svenska?', ['12', '13', '14', '15'], 1, 1);
    mc(id, 'Hur säger man "9" på engelska?', ['Eight', 'Ten', 'Nine', 'Eleven'], 2, 2);
    mc(id, 'Vad är "seventeen"?', ['15', '16', '17', '18'], 2, 3);
    mc(id, 'Hur säger man "12" på engelska?', ['Eleven', 'Twelve', 'Thirteen', 'Ten'], 1, 4);
    mc(id, 'Vad är "twenty" på svenska?', ['18', '19', '20', '21'], 2, 5);
    mc(id, 'Hur säger man "1" på engelska?', ['One', 'Two', 'Three', 'Four'], 0, 6);
    mc(id, 'Vad är "fifteen" på svenska?', ['13', '14', '15', '16'], 2, 7);

    id = ex('Djur på engelska', 'engelska',
      'What animals can you name in English? Lär dig djurnamn!',
      2, 8, 10);
    mc(id, 'Vad heter "hund" på engelska?', ['Cat', 'Dog', 'Bird', 'Fish'], 1, 0);
    mc(id, 'Vad betyder "cat" på svenska?', ['Hund', 'Katt', 'Häst', 'Kanin'], 1, 1);
    mc(id, 'Hur säger man "häst" på engelska?', ['Cow', 'Pig', 'Horse', 'Sheep'], 2, 2);
    mc(id, 'Vad betyder "rabbit" på svenska?', ['Räv', 'Ekorre', 'Kanin', 'Hare'], 2, 3);
    mc(id, 'Hur säger man "fisk" på engelska?', ['Bird', 'Fish', 'Frog', 'Snake'], 1, 4);
    mc(id, 'Vad är "owl" på svenska?', ['Korp', 'Kaja', 'Uggla', 'Duva'], 2, 5);
    mc(id, 'Hur säger man "fjäril" på engelska?', ['Bee', 'Ant', 'Butterfly', 'Spider'], 2, 6);
    mc(id, 'Vad betyder "elephant" på svenska?', ['Lejon', 'Tiger', 'Giraff', 'Elefant'], 3, 7);

    id = ex('Kroppen på engelska', 'engelska',
      'Learn the body parts in English! Vad heter kroppens delar?',
      2, 8, 10);
    mc(id, 'Vad heter "huvud" på engelska?', ['Hand', 'Head', 'Heart', 'Heel'], 1, 0);
    mc(id, 'Vad betyder "eye" på svenska?', ['Öra', 'Näsa', 'Öga', 'Mun'], 2, 1);
    mc(id, 'Hur säger man "hand" på engelska?', ['Foot', 'Arm', 'Hand', 'Leg'], 2, 2);
    mc(id, 'Vad betyder "nose" på svenska?', ['Öga', 'Mun', 'Öra', 'Näsa'], 3, 3);
    mc(id, 'Hur säger man "ben" (kroppsdel) på engelska?', ['Back', 'Leg', 'Knee', 'Lip'], 1, 4);
    mc(id, 'Vad betyder "shoulder"?', ['Fot', 'Knä', 'Axel', 'Armbåge'], 2, 5);

    id = ex('Dagar och månader på engelska', 'engelska',
      'Days and months in English! Lär dig veckodagarna och månaderna.',
      2, 8, 10);
    mc(id, 'Vad heter "måndag" på engelska?', ['Sunday', 'Monday', 'Tuesday', 'Wednesday'], 1, 0);
    mc(id, 'Vad betyder "Friday"?', ['Onsdag', 'Torsdag', 'Fredag', 'Lördag'], 2, 1);
    mc(id, 'Hur säger man "januari" på engelska?', ['January', 'June', 'July', 'March'], 0, 2);
    mc(id, 'Vad är "December" på svenska?', ['Oktober', 'November', 'December', 'Januari'], 2, 3);
    mc(id, 'Hur säger man "sommar" (juni–aug) på engelska?', ['Spring', 'Autumn', 'Summer', 'Winter'], 2, 4);
    mc(id, 'Vad heter "söndag" på engelska?', ['Saturday', 'Sunday', 'Monday', 'Friday'], 1, 5);

    id = ex('Enkla fraser och hälsningar', 'engelska',
      'Learn basic greetings and phrases! Öva på vanliga fraser.',
      1, 7, 9);
    mc(id, 'Hur säger man "hej" på engelska?', ['Bye', 'Hello', 'Please', 'Thanks'], 1, 0);
    mc(id, 'Vad betyder "Thank you"?', ['Förlåt', 'Tack', 'Hej', 'Adjö'], 1, 1);
    mc(id, 'Hur säger man "hur mår du?" på engelska?', ['Who are you?', 'How are you?', 'Where are you?', 'What are you?'], 1, 2);
    mc(id, 'Vad betyder "I\'m fine"?', ['Jag är trött', 'Jag är ledsen', 'Jag mår bra', 'Jag är hungry'], 2, 3);
    mc(id, 'Hur säger man "förlåt" på engelska?', ['Please', 'Thanks', 'Sorry', 'Hello'], 2, 4);
    mc(id, 'Vad betyder "Goodbye"?', ['Hej', 'Tack', 'Adjö', 'Välkommen'], 2, 5);

    // ============================================================
    // NO — NATUR OCH OMVÄRLD
    // ============================================================

    id = ex('Årstiderna', 'no',
      'Lär dig om de fyra årstiderna och vad som händer i naturen!',
      1, 7, 9);
    mc(id, 'Vilken årstid kommer efter vintern?', ['Sommar', 'Höst', 'Vår', 'November'], 2, 0);
    mc(id, 'Under vilken årstid faller löven från träden?', ['Vinter', 'Vår', 'Sommar', 'Höst'], 3, 1);
    mc(id, 'Vilken månad hör till vintern?', ['Maj', 'Juli', 'Januari', 'September'], 2, 2);
    mc(id, 'Vad händer med björnen på vintern?', ['Den flyger söderut', 'Den lägger sig i ide', 'Den äter extra mycket', 'Den byter päls'], 1, 3);
    mc(id, 'Under vilken årstid är dagarna som längst?', ['Vinter', 'Höst', 'Vår', 'Sommar'], 3, 4);
    mc(id, 'Vad kallas det när snön smälter och blommorna börjar blomma?', ['Höst', 'Vinter', 'Vår', 'Solsken'], 2, 5);

    id = ex('Djur och deras ungar', 'no',
      'Vet du vad de unga djuren kallas? Testa dina kunskaper!',
      1, 7, 9);
    mc(id, 'Vad kallas en ung hund?', ['Kattunge', 'Valp', 'Killing', 'Föl'], 1, 0);
    mc(id, 'Vad kallas en ung katt?', ['Kattunge', 'Valp', 'Kattbarn', 'Kittel'], 0, 1);
    mc(id, 'Vad kallas ett ungt får?', ['Gris', 'Lamm', 'Kalv', 'Föl'], 1, 2);
    mc(id, 'Vad kallas ett ungt nötkreatur (ko)?', ['Lamm', 'Föl', 'Kalv', 'Killing'], 2, 3);
    mc(id, 'Vad kallas ett ungt lejon?', ['Unge', 'Valp', 'Lejonunge', 'Kattunge'], 2, 4);
    mc(id, 'Vad kallas en ung häst?', ['Fåle', 'Föl', 'Ponnying', 'Hingst'], 1, 5);
    mc(id, 'Vad kallas ett ungt svin?', ['Spädgris', 'Smågris', 'Grisbarn', 'Kultinge'], 1, 6);
    mc(id, 'Ägg kläcks av fåglar. Vad kallas en ung fågel?', ['Kyckling', 'Fågelunge', 'Pip', 'Äggkläckt'], 1, 7);

    id = ex('Kroppen — yttre delar', 'no',
      'Lär dig om kroppens delar och vad de heter!',
      1, 7, 9);
    mc(id, 'Vilket organ ser vi med?', ['Öronen', 'Ögonen', 'Näsan', 'Munnen'], 1, 0);
    mc(id, 'Med vilket organ hör vi?', ['Ögonen', 'Näsan', 'Öronen', 'Händerna'], 2, 1);
    mc(id, 'Hur många fingrar har en människa totalt?', ['8', '9', '10', '12'], 2, 2);
    mc(id, 'Vad är pekfingret?', ['Det längsta fingret', 'Fingret bredvid tummen', 'Det minsta fingret', 'Ringfingret'], 1, 3);
    mc(id, 'Vad skyddar skallen?', ['Hjärnan', 'Hjärtat', 'Magen', 'Lungorna'], 0, 4);
    mc(id, 'Hur många ben har en människa?', ['1', '2', '3', '4'], 1, 5);

    id = ex('Rymden och planeterna', 'no',
      'Utforska rymden! Lär dig om vårt solsystem och planeterna.',
      2, 8, 10);
    mc(id, 'Vilken planet är närmast solen?', ['Venus', 'Merkurius', 'Mars', 'Jorden'], 1, 0);
    mc(id, 'På vilken planet bor vi?', ['Mars', 'Venus', 'Saturnus', 'Jorden'], 3, 1);
    mc(id, 'Vilken planet är störst i solsystemet?', ['Saturnus', 'Uranus', 'Jupiter', 'Neptunus'], 2, 2);
    mc(id, 'Vad är Månens relation till Jorden?', ['En planet', 'En asteroid', 'En satellit', 'En stjärna'], 2, 3);
    mc(id, 'Hur lång tid tar det för Jorden att gå runt solen?', ['30 dagar', '365 dagar', '24 timmar', '7 dagar'], 1, 4);
    mc(id, 'Vilken planet är känd för sina ringar?', ['Jupiter', 'Uranus', 'Saturnus', 'Mars'], 2, 5);

    id = ex('Väder och klimat', 'no',
      'Lär dig om olika väder och vad de beror på!',
      2, 8, 10);
    mc(id, 'Vad mäter en termometer?', ['Luftfuktighet', 'Temperatur', 'Lufttryck', 'Vindhastighet'], 1, 0);
    mc(id, 'Vad kallas det när vatten faller från molnen?', ['Snö', 'Regn', 'Hagel', 'Alla dessa kan falla'], 3, 1);
    mc(id, 'Vad är en orkan?', ['Lätt vind', 'Moln utan regn', 'Extremt stark vind', 'Åska utan blixt'], 2, 2);
    mc(id, 'Vad orsakar åska och blixt?', ['Sol och vind', 'Elektricitet i molnen', 'Kall luft från havet', 'Högt lufttryck'], 1, 3);
    mc(id, 'Vad kallas det när det bildas rimfrost?', ['Snö som fastnar', 'Is som bildas av fukt i luften', 'Fruset regn', 'Hagelkorn'], 1, 4);

    // ============================================================
    // SO — SAMHÄLLSORIENTERING
    // ============================================================

    id = ex('Världsdelar', 'so',
      'Hur många världsdelar finns det och vad heter de? Lär dig om vår värld!',
      2, 8, 10);
    mc(id, 'Hur många världsdelar finns det?', ['5', '6', '7', '8'], 2, 0);
    mc(id, 'Vilken är den största världsdelen?', ['Europa', 'Afrika', 'Asien', 'Amerika'], 2, 1);
    mc(id, 'I vilken världsdel ligger Sverige?', ['Asien', 'Afrika', 'Europa', 'Nordamerika'], 2, 2);
    mc(id, 'Vad heter världsdelen där Brasilien ligger?', ['Nordamerika', 'Afrika', 'Sydamerika', 'Oceanien'], 2, 3);
    mc(id, 'Vilken är den minsta världsdelen?', ['Europa', 'Australien/Oceanien', 'Antarktis', 'Asien'], 1, 4);
    mc(id, 'I vilken världsdel ligger Egypten?', ['Asien', 'Europa', 'Afrika', 'Sydamerika'], 2, 5);

    id = ex('Sveriges grannländer och geografi', 'so',
      'Lär dig om Sverige och våra grannländer!',
      2, 8, 10);
    mc(id, 'Vilka länder gränsar till Sverige?', ['Danmark och Norge', 'Norge och Finland', 'Danmark, Norge och Finland', 'Finland och Ryssland'], 2, 0);
    mc(id, 'Vad heter Sveriges huvudstad?', ['Göteborg', 'Malmö', 'Uppsala', 'Stockholm'], 3, 1);
    mc(id, 'Vilken är Sveriges längsta flod?', ['Göta älv', 'Dalälven', 'Klarälven', 'Torneälven'], 1, 2);
    mc(id, 'Vad heter det hav som ligger väster om Sverige?', ['Östersjön', 'Nordsjön', 'Atlanten', 'Skagerrak och Kattegatt'], 3, 3);
    mc(id, 'Vilket landskap ligger längst i norr i Sverige?', ['Dalarna', 'Lappland', 'Härjedalen', 'Jämtland'], 1, 4);
    mc(id, 'Vilken stad är Sveriges näst största?', ['Malmö', 'Uppsala', 'Göteborg', 'Linköping'], 2, 5);

    id = ex('Yrken och arbetsplatser', 'so',
      'Lär dig om olika yrken och var de arbetar!',
      1, 7, 9);
    mc(id, 'Var arbetar en läkare?', ['Skola', 'Sjukhus', 'Bibliotek', 'Brandstation'], 1, 0);
    mc(id, 'Vad gör en brandman?', ['Lagar mat', 'Undervisar', 'Släcker bränder', 'Kör bussar'], 2, 1);
    mc(id, 'Var arbetar en bibliotekarie?', ['Sjukhus', 'Skola', 'Bibliotek', 'Affär'], 2, 2);
    mc(id, 'Vad kallas den som flyger ett flygplan?', ['Kapten', 'Pilot', 'Styrman', 'Flygare'], 1, 3);
    mc(id, 'Vad gör en kock?', ['Lagar mat', 'Reparerar bilar', 'Undervisar', 'Bygger hus'], 0, 4);
    mc(id, 'Var arbetar en veterinär?', ['Humansjukhus', 'Djursjukhus', 'Skola', 'Apotek'], 1, 5);

    id = ex('Svenska högtider och traditioner', 'so',
      'Lär dig om de högtider vi firar i Sverige och vad de innebär!',
      1, 7, 9);
    mc(id, 'Vilken högtid firas den 24-26 december?', ['Påsk', 'Midsommar', 'Jul', 'Lucia'], 2, 0);
    mc(id, 'Vad gör man på midsommar?', ['Tänder ljus', 'Dansar runt midsommarstången', 'Äter påskägg', 'Ger presenter'], 1, 1);
    mc(id, 'Den 13 december firas...', ['Jul', 'Lucia', 'Valborg', 'Alla hjärtans dag'], 1, 2);
    mc(id, 'Vad är typiskt för påskfirande i Sverige?', ['Snöar alltid', 'Barn klär ut sig till påskkärringar', 'Man tänder eldar', 'Man äter julskinka'], 1, 3);
    mc(id, 'När firas Valborg?', ['30 april', '1 maj', '6 juni', '24 december'], 0, 4);
    mc(id, 'Vad är Sveriges nationaldag?', ['30 april', '25 december', '6 juni', '13 december'], 2, 5);

    // ============================================================
    // TEKNIK
    // ============================================================

    id = ex('Material och egenskaper', 'teknik',
      'Lär dig om olika material och deras egenskaper!',
      1, 7, 9);
    mc(id, 'Vilket material leder el?', ['Plast', 'Gummi', 'Trä', 'Metall'], 3, 0);
    mc(id, 'Vilket material flyter på vatten?', ['Sten', 'Järn', 'Trä', 'Glas'], 2, 1);
    mc(id, 'Vilket material är genomskinligt?', ['Trä', 'Metall', 'Glas', 'Betong'], 2, 2);
    mc(id, 'Vad är en bra isolator (leder inte el)?', ['Koppar', 'Aluminium', 'Gummi', 'Stål'], 2, 3);
    mc(id, 'Vilket material är starkast?', ['Papper', 'Gummi', 'Stål', 'Tyg'], 2, 4);
    mc(id, 'Vad händer när metall hettas upp?', ['Det krymper', 'Det utvidgas', 'Det löses upp', 'Inget händer'], 1, 5);

    id = ex('Enkla maskiner', 'teknik',
      'Lär dig om de enkla maskiner som gör arbetet lättare!',
      2, 8, 10);
    mc(id, 'En lutande plan (ramp) gör det lättare att...', ['Lyfta tunga saker', 'Skära', 'Hålla fast saker', 'Flytta vatten'], 0, 0);
    mc(id, 'Vad kallas en stång som vippar på ett stöd och gör lyft lättare?', ['Skruv', 'Kil', 'Hävstång', 'Block'], 2, 1);
    mc(id, 'Ett hjul med en axel används för att...', ['Skära material', 'Lyfta och sänka saker', 'Haka fast saker', 'Leda el'], 1, 2);
    mc(id, 'Vad är en skruv?', ['En kil som vrider sig', 'En sorts hävstång', 'Ett lutande block', 'Ett rörligt hjul'], 0, 3);
    mc(id, 'Saxar och knivar är exempel på...', ['Hävstänger', 'Kilar', 'Block', 'Hjul'], 1, 4);
    mc(id, 'Vad är syftet med ett block (talja)?', ['Ändra riktning på kraft och minska lyftkraft', 'Öka hastighet', 'Lagra energi', 'Mäta tyngd'], 0, 5);

    id = ex('Säkerhet på nätet', 'teknik',
      'Lär dig hur du är säker när du använder internet!',
      2, 8, 10);
    mc(id, 'Vad ska du ALDRIG dela med okända på internet?', ['Ditt favoritprogram', 'Din hemadress', 'Din favoritfärg', 'Ditt favoritspel'], 1, 0);
    mc(id, 'Om du får ett konstigt meddelande från en okänd, vad gör du?', ['Svarar och ber om mer info', 'Berättar för en vuxen', 'Ignorerar det och fortsätter', 'Skickar tillbaka en bild'], 1, 1);
    mc(id, 'Vad är ett bra lösenord?', ['Ditt namn', '123456', 'En blandning av bokstäver, siffror och tecken', 'Din födelsedag'], 2, 2);
    mc(id, 'Vad ska du göra om du ser något otäckt på nätet?', ['Dela det med kompisar', 'Berätta för en vuxen', 'Låtsas som ingenting', 'Spara det'], 1, 3);
    mc(id, 'Hur länge bör du sitta vid skärmen i ett sträck?', ['Hela dagen', 'Minst 4 timmar', 'Ta pauser varje timme', 'Aldrig under en timme'], 2, 4);

  }); // end transaction

  seed();
  console.log('  ✅ Innehållsbibliotek seedat!');
}

module.exports = { seedContent };
