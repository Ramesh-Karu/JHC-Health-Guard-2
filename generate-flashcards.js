const fs = require('fs');

const subjects = [
  {
    topic: "Math",
    generate: () => {
      const ops = ['+', '-', '*'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b, answer;
      if (op === '+') {
        a = Math.floor(Math.random() * 100);
        b = Math.floor(Math.random() * 100);
        answer = a + b;
      } else if (op === '-') {
        a = Math.floor(Math.random() * 100);
        b = Math.floor(Math.random() * a); // ensure positive
        answer = a - b;
      } else {
        a = Math.floor(Math.random() * 12);
        b = Math.floor(Math.random() * 12);
        answer = a * b;
      }
      
      const question = `What is ${a} ${op} ${b}?`;
      const options = [
        answer.toString(),
        (answer + Math.floor(Math.random() * 5 + 1)).toString(),
        (answer - Math.floor(Math.random() * 5 + 1)).toString(),
        (answer + Math.floor(Math.random() * 10 + 6)).toString()
      ].sort(() => Math.random() - 0.5);
      
      return {
        question,
        options,
        correctAnswer: options.indexOf(answer.toString()),
        explanation: `The correct answer is ${answer}.`
      };
    }
  },
  {
    topic: "Science",
    questions: [
      { q: "What is the powerhouse of the cell?", a: "Mitochondria", w: ["Nucleus", "Ribosome", "Endoplasmic Reticulum"] },
      { q: "What planet is known as the Red Planet?", a: "Mars", w: ["Venus", "Jupiter", "Saturn"] },
      { q: "What is the hardest natural substance on Earth?", a: "Diamond", w: ["Gold", "Iron", "Quartz"] },
      { q: "What gas do plants absorb from the atmosphere?", a: "Carbon Dioxide", w: ["Oxygen", "Nitrogen", "Hydrogen"] },
      { q: "What is the chemical symbol for water?", a: "H2O", w: ["CO2", "O2", "NaCl"] }
    ]
  },
  {
    topic: "Geography",
    questions: [
      { q: "What is the capital of France?", a: "Paris", w: ["London", "Berlin", "Madrid"] },
      { q: "Which is the largest ocean on Earth?", a: "Pacific Ocean", w: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
      { q: "What is the longest river in the world?", a: "Nile", w: ["Amazon", "Yangtze", "Mississippi"] },
      { q: "Which country has the largest population?", a: "India", w: ["China", "USA", "Indonesia"] },
      { q: "Mount Everest is located in which mountain range?", a: "Himalayas", w: ["Andes", "Alps", "Rockies"] }
    ]
  },
  {
    topic: "History",
    questions: [
      { q: "Who was the first President of the United States?", a: "George Washington", w: ["Thomas Jefferson", "Abraham Lincoln", "John Adams"] },
      { q: "In what year did World War II end?", a: "1945", w: ["1918", "1939", "1965"] },
      { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci", w: ["Vincent van Gogh", "Pablo Picasso", "Claude Monet"] },
      { q: "What ancient civilization built the pyramids?", a: "Egyptians", w: ["Romans", "Greeks", "Mayans"] },
      { q: "Who discovered America in 1492?", a: "Christopher Columbus", w: ["Leif Erikson", "Ferdinand Magellan", "James Cook"] }
    ]
  }
];

const allQuestions = [];

// Generate 1000 questions
for (let i = 0; i < 1000; i++) {
  const isMath = Math.random() < 0.5; // 50% math, 50% other
  if (isMath) {
    const mathGen = subjects.find(s => s.topic === "Math");
    allQuestions.push({ id: `q_${i}`, ...mathGen.generate() });
  } else {
    const otherSubjects = subjects.filter(s => s.topic !== "Math");
    const subject = otherSubjects[Math.floor(Math.random() * otherSubjects.length)];
    const qTemplate = subject.questions[Math.floor(Math.random() * subject.questions.length)];
    
    const options = [qTemplate.a, ...qTemplate.w].sort(() => Math.random() - 0.5);
    allQuestions.push({
      id: `q_${i}`,
      question: qTemplate.q,
      options,
      correctAnswer: options.indexOf(qTemplate.a),
      explanation: `The correct answer is ${qTemplate.a}.`
    });
  }
}

fs.writeFileSync('src/data/flashcards.json', JSON.stringify(allQuestions, null, 2));
console.log('Generated 1000 questions in src/data/flashcards.json');
