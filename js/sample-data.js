/**
 * sample-data.js
 * Laddas in i index.html och admin.html för att fylla i
 * exempelövningar om inga övningar finns sedan tidigare.
 */

(function seedSampleData() {
  const existing = getExercises();
  if (existing.length > 0) return; // Fyll inte i om data redan finns

  const samples = [
    {
      id: 'sample-1',
      title: 'Multiplikation 1–5',
      subject: 'matematik',
      ageGroups: [8, 9],
      description: 'Öva på multiplikationstabellen för talen 1 till 5.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1', type: 'multiple_choice',
          question: 'Vad är 3 × 4?',
          options: ['9', '12', '15', '7'],
          correctAnswer: 1,
        },
        {
          id: 'q2', type: 'multiple_choice',
          question: 'Vad är 5 × 5?',
          options: ['20', '30', '25', '15'],
          correctAnswer: 2,
        },
        {
          id: 'q3', type: 'text_input',
          question: 'Vad är 2 × 7?',
          correctAnswer: '14',
        },
        {
          id: 'q4', type: 'multiple_choice',
          question: 'Vad är 4 × 3?',
          options: ['8', '12', '16', '10'],
          correctAnswer: 1,
        },
        {
          id: 'q5', type: 'text_input',
          question: 'Vad är 5 × 3?',
          correctAnswer: '15',
        },
      ],
    },
    {
      id: 'sample-2',
      title: 'Svenska – Ordklasser',
      subject: 'svenska',
      ageGroups: [9, 10],
      description: 'Testa dina kunskaper om substantiv, verb och adjektiv.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1', type: 'multiple_choice',
          question: 'Vilket ord är ett substantiv?',
          options: ['Springa', 'Hund', 'Snabb', 'Men'],
          correctAnswer: 1,
        },
        {
          id: 'q2', type: 'multiple_choice',
          question: 'Vilket ord är ett verb?',
          options: ['Blomma', 'Stor', 'Hoppa', 'Eller'],
          correctAnswer: 2,
        },
        {
          id: 'q3', type: 'multiple_choice',
          question: 'Vilket ord är ett adjektiv?',
          options: ['Skriva', 'Skola', 'Glad', 'Aldrig'],
          correctAnswer: 2,
        },
        {
          id: 'q4', type: 'text_input',
          question: 'Vad kallas ord som beskriver hur någon eller något är? (En ordklass)',
          correctAnswer: 'adjektiv',
        },
      ],
    },
    {
      id: 'sample-3',
      title: 'Engelska – Färger och siffror',
      subject: 'engelska',
      ageGroups: [8, 9, 10],
      description: 'Lär dig färger och siffror på engelska!',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1', type: 'multiple_choice',
          question: 'Vad betyder "blue" på svenska?',
          options: ['Röd', 'Grön', 'Blå', 'Gul'],
          correctAnswer: 2,
        },
        {
          id: 'q2', type: 'text_input',
          question: 'Hur säger man "tre" på engelska?',
          correctAnswer: 'three',
        },
        {
          id: 'q3', type: 'multiple_choice',
          question: 'Vad betyder "yellow"?',
          options: ['Orange', 'Gul', 'Lila', 'Svart'],
          correctAnswer: 1,
        },
        {
          id: 'q4', type: 'text_input',
          question: 'Hur säger man "röd" på engelska?',
          correctAnswer: 'red',
        },
        {
          id: 'q5', type: 'multiple_choice',
          question: 'Vad betyder "eight"?',
          options: ['Sex', 'Sju', 'Åtta', 'Nio'],
          correctAnswer: 2,
        },
      ],
    },
    {
      id: 'sample-4',
      title: 'NO – Solsystemet',
      subject: 'no',
      ageGroups: [9, 10],
      description: 'Hur mycket vet du om vårt solsystem?',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1', type: 'multiple_choice',
          question: 'Vilken är den närmaste planeten till solen?',
          options: ['Venus', 'Mars', 'Merkurius', 'Jorden'],
          correctAnswer: 2,
        },
        {
          id: 'q2', type: 'text_input',
          question: 'Vad heter den stjärna som Jorden kretsar runt?',
          correctAnswer: 'solen',
        },
        {
          id: 'q3', type: 'multiple_choice',
          question: 'Hur många planeter finns det i solsystemet?',
          options: ['7', '8', '9', '10'],
          correctAnswer: 1,
        },
        {
          id: 'q4', type: 'multiple_choice',
          question: 'Vilken är den största planeten i solsystemet?',
          options: ['Saturnus', 'Uranus', 'Jupiter', 'Neptunus'],
          correctAnswer: 2,
        },
      ],
    },
    {
      id: 'sample-5',
      title: 'Matematik – Addition och subtraktion',
      subject: 'matematik',
      ageGroups: [8],
      description: 'Öva på att addera och subtrahera tal upp till 100.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1', type: 'text_input',
          question: 'Vad är 25 + 37?',
          correctAnswer: '62',
        },
        {
          id: 'q2', type: 'multiple_choice',
          question: 'Vad är 80 - 45?',
          options: ['25', '35', '45', '30'],
          correctAnswer: 1,
        },
        {
          id: 'q3', type: 'text_input',
          question: 'Vad är 14 + 28?',
          correctAnswer: '42',
        },
        {
          id: 'q4', type: 'multiple_choice',
          question: 'Vad är 100 - 63?',
          options: ['47', '37', '27', '57'],
          correctAnswer: 1,
        },
      ],
    },
  ];

  const data = { password: 'studie123', exercises: samples };
  localStorage.setItem('studiehub_v1', JSON.stringify(data));
})();
