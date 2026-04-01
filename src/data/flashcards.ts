export interface Flashcard {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Note: Generating 1000 questions at once exceeds AI output limits. 
// Here are 50 high-quality health and wellness questions to start. 
// You can easily add more to this array following the same structure!
export const flashcards: Flashcard[] = [
  {
    id: "q1",
    question: "How many hours of sleep is recommended for teenagers per night?",
    options: ["5-6 hours", "7-8 hours", "8-10 hours", "10-12 hours"],
    correctIndex: 2,
    explanation: "Teenagers need 8-10 hours of sleep per night to support their rapid physical and mental development."
  },
  {
    id: "q2",
    question: "Which vitamin is primarily produced by the body when exposed to sunlight?",
    options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    correctIndex: 3,
    explanation: "Vitamin D is synthesized in the skin in response to sunlight and is crucial for bone health."
  },
  {
    id: "q3",
    question: "What is the recommended daily water intake for an average adult?",
    options: ["1-2 cups", "3-4 cups", "8-10 cups", "15-20 cups"],
    correctIndex: 2,
    explanation: "While it varies by individual, 8-10 cups (about 2-2.5 liters) is generally recommended for daily hydration."
  },
  {
    id: "q4",
    question: "Which macronutrient is the body's primary source of energy?",
    options: ["Proteins", "Carbohydrates", "Fats", "Vitamins"],
    correctIndex: 1,
    explanation: "Carbohydrates are broken down into glucose, which is the main energy source for the body's cells, tissues, and organs."
  },
  {
    id: "q5",
    question: "What is a healthy way to manage stress?",
    options: ["Ignoring the problem", "Deep breathing exercises", "Sleeping all day", "Drinking excessive caffeine"],
    correctIndex: 1,
    explanation: "Deep breathing exercises activate the parasympathetic nervous system, helping to calm the body and reduce stress."
  },
  {
    id: "q6",
    question: "How many minutes of moderate physical activity should adults aim for per week?",
    options: ["60 minutes", "150 minutes", "300 minutes", "500 minutes"],
    correctIndex: 1,
    explanation: "The WHO recommends at least 150 minutes of moderate-intensity aerobic physical activity throughout the week."
  },
  {
    id: "q7",
    question: "Which of these is a complex carbohydrate?",
    options: ["Table sugar", "White bread", "Oatmeal", "Soda"],
    correctIndex: 2,
    explanation: "Oatmeal is a complex carbohydrate, meaning it contains longer chains of sugar molecules that take longer to digest, providing sustained energy."
  },
  {
    id: "q8",
    question: "What does SPF stand for in sunscreen?",
    options: ["Sun Protection Factor", "Skin Protection Formula", "Sun Prevention Factor", "Skin Preservation Formula"],
    correctIndex: 0,
    explanation: "SPF stands for Sun Protection Factor, which measures how well a sunscreen protects against UVB rays."
  },
  {
    id: "q9",
    question: "Which mineral is essential for carrying oxygen in the blood?",
    options: ["Calcium", "Potassium", "Iron", "Zinc"],
    correctIndex: 2,
    explanation: "Iron is a key component of hemoglobin, the protein in red blood cells that carries oxygen from the lungs to the rest of the body."
  },
  {
    id: "q10",
    question: "What is the term for the body's natural 24-hour sleep-wake cycle?",
    options: ["REM cycle", "Circadian rhythm", "Homeostasis", "Metabolism"],
    correctIndex: 1,
    explanation: "The circadian rhythm is the internal process that regulates the sleep-wake cycle and repeats roughly every 24 hours."
  },
  {
    id: "q11",
    question: "Which of the following is considered a 'good' fat?",
    options: ["Trans fat", "Saturated fat", "Monounsaturated fat", "Hydrogenated fat"],
    correctIndex: 2,
    explanation: "Monounsaturated fats (found in olive oil, avocados, and nuts) can help reduce bad cholesterol levels and lower the risk of heart disease."
  },
  {
    id: "q12",
    question: "What is the most effective way to prevent the spread of common infections?",
    options: ["Taking antibiotics daily", "Washing hands frequently", "Holding your breath around others", "Only drinking bottled water"],
    correctIndex: 1,
    explanation: "Frequent and thorough handwashing with soap and water is the most effective way to prevent the spread of many infectious diseases."
  },
  {
    id: "q13",
    question: "Which nutrient is essential for building and repairing muscle tissue?",
    options: ["Carbohydrates", "Fats", "Protein", "Fiber"],
    correctIndex: 2,
    explanation: "Proteins are made of amino acids, which are the building blocks used to repair and grow muscle tissue."
  },
  {
    id: "q14",
    question: "What is mindfulness?",
    options: ["Having a full mind", "Ignoring your surroundings", "Focusing on the present moment without judgment", "Multitasking efficiently"],
    correctIndex: 2,
    explanation: "Mindfulness is the psychological process of purposely bringing one's attention to experiences occurring in the present moment."
  },
  {
    id: "q15",
    question: "Which of these activities is best for improving cardiovascular health?",
    options: ["Weightlifting", "Yoga", "Running", "Stretching"],
    correctIndex: 2,
    explanation: "Running is an aerobic exercise that increases heart rate and improves the efficiency of the cardiovascular system."
  },
  {
    id: "q16",
    question: "What percentage of the human body is made up of water?",
    options: ["30-40%", "50-65%", "75-85%", "90-95%"],
    correctIndex: 1,
    explanation: "Up to 60-65% of the adult human body is water, which is vital for all bodily functions."
  },
  {
    id: "q17",
    question: "Which food is the best source of dietary fiber?",
    options: ["Chicken breast", "White rice", "Lentils", "Cheese"],
    correctIndex: 2,
    explanation: "Lentils and other legumes are excellent sources of dietary fiber, which aids in digestion and helps maintain steady blood sugar levels."
  },
  {
    id: "q18",
    question: "What is the recommended screen time limit before bed to improve sleep quality?",
    options: ["No limit", "Stop 10 minutes before", "Stop 1-2 hours before", "Stop 5 hours before"],
    correctIndex: 2,
    explanation: "Stopping screen time 1-2 hours before bed helps reduce blue light exposure, which can interfere with the production of the sleep hormone melatonin."
  },
  {
    id: "q19",
    question: "Which of these is a symptom of dehydration?",
    options: ["Clear urine", "Excessive sweating", "Dark yellow urine", "High energy levels"],
    correctIndex: 2,
    explanation: "Dark yellow urine is a common indicator that your body needs more water. Clear or pale yellow urine usually indicates good hydration."
  },
  {
    id: "q20",
    question: "What is the purpose of a warm-up before exercising?",
    options: ["To burn maximum calories", "To prepare muscles and prevent injury", "To cool down the body", "To build muscle mass quickly"],
    correctIndex: 1,
    explanation: "A warm-up gradually increases heart rate and blood flow to muscles, preparing them for activity and reducing the risk of injury."
  },
  {
    id: "q21",
    question: "Which vitamin is crucial for a healthy immune system?",
    options: ["Vitamin C", "Vitamin K", "Vitamin B1", "Vitamin B2"],
    correctIndex: 0,
    explanation: "Vitamin C is an antioxidant that helps protect cells and supports the immune system in fighting off infections."
  },
  {
    id: "q22",
    question: "What is the main benefit of stretching?",
    options: ["Building muscle strength", "Improving flexibility and range of motion", "Losing weight", "Increasing heart rate"],
    correctIndex: 1,
    explanation: "Stretching keeps the muscles flexible, strong, and healthy, which is needed to maintain a range of motion in the joints."
  },
  {
    id: "q23",
    question: "Which of these is a healthy coping mechanism for anxiety?",
    options: ["Isolating yourself", "Journaling your thoughts", "Overeating", "Avoiding all stressful situations"],
    correctIndex: 1,
    explanation: "Journaling can help you process emotions, identify triggers, and reduce anxiety by getting thoughts out of your head and onto paper."
  },
  {
    id: "q24",
    question: "What does BMI stand for?",
    options: ["Body Mass Indicator", "Body Muscle Index", "Body Mass Index", "Basic Metabolic Indicator"],
    correctIndex: 2,
    explanation: "BMI stands for Body Mass Index, a measure of body fat based on height and weight."
  },
  {
    id: "q25",
    question: "Which of these foods is rich in Omega-3 fatty acids?",
    options: ["Beef", "Salmon", "Chicken", "Pork"],
    correctIndex: 1,
    explanation: "Fatty fish like salmon are excellent sources of Omega-3 fatty acids, which are important for brain and heart health."
  },
  {
    id: "q26",
    question: "What is the primary function of the respiratory system?",
    options: ["Pumping blood", "Digesting food", "Exchanging oxygen and carbon dioxide", "Filtering toxins"],
    correctIndex: 2,
    explanation: "The respiratory system's main job is to move fresh air into your body while removing waste gases like carbon dioxide."
  },
  {
    id: "q27",
    question: "Which of the following is a sign of good mental health?",
    options: ["Never feeling sad", "Being able to bounce back from adversity", "Working 80 hours a week", "Hiding your emotions"],
    correctIndex: 1,
    explanation: "Resilience, or the ability to bounce back from stress and adversity, is a key indicator of good mental health."
  },
  {
    id: "q28",
    question: "What is the recommended daily sodium intake for most adults?",
    options: ["Less than 1,000 mg", "Less than 2,300 mg", "Less than 5,000 mg", "Less than 10,000 mg"],
    correctIndex: 1,
    explanation: "The American Heart Association recommends no more than 2,300 milligrams (mg) a day, moving toward an ideal limit of no more than 1,500 mg per day for most adults."
  },
  {
    id: "q29",
    question: "Which exercise is considered a 'weight-bearing' exercise?",
    options: ["Swimming", "Cycling", "Walking", "Rowing"],
    correctIndex: 2,
    explanation: "Weight-bearing exercises force you to work against gravity. Walking, jogging, and dancing are examples that help build bone density."
  },
  {
    id: "q30",
    question: "What is the main cause of cavities?",
    options: ["Drinking too much water", "Eating spicy food", "Plaque buildup from sugar and bacteria", "Brushing teeth too often"],
    correctIndex: 2,
    explanation: "Cavities are caused by tooth decay, which happens when bacteria in your mouth produce acids that eat away at a tooth's enamel, often fueled by sugar."
  },
  {
    id: "q31",
    question: "Which of these is a benefit of regular meditation?",
    options: ["Increased stress", "Reduced focus", "Lower blood pressure", "Higher cholesterol"],
    correctIndex: 2,
    explanation: "Regular meditation can help lower blood pressure, reduce stress, and improve overall emotional well-being."
  },
  {
    id: "q32",
    question: "What is the 'danger zone' temperature range where bacteria grow fastest in food?",
    options: ["0°F - 32°F", "40°F - 140°F", "150°F - 200°F", "212°F and above"],
    correctIndex: 1,
    explanation: "Bacteria grow most rapidly in the range of temperatures between 40 °F and 140 °F, doubling in number in as little as 20 minutes."
  },
  {
    id: "q33",
    question: "Which nutrient is most important for healthy vision?",
    options: ["Vitamin A", "Calcium", "Iron", "Vitamin D"],
    correctIndex: 0,
    explanation: "Vitamin A plays a crucial role in vision by maintaining a clear cornea and is a component of rhodopsin, a protein in your eyes that allows you to see in low light."
  },
  {
    id: "q34",
    question: "What is a common physical symptom of a panic attack?",
    options: ["Slow heart rate", "Extreme hunger", "Rapid heartbeat and shortness of breath", "Feeling very cold"],
    correctIndex: 2,
    explanation: "Panic attacks often cause severe physical symptoms like a racing heart, shortness of breath, dizziness, and chest pain."
  },
  {
    id: "q35",
    question: "Which of these is a complete protein source?",
    options: ["Rice", "Beans", "Quinoa", "Nuts"],
    correctIndex: 2,
    explanation: "Quinoa is one of the few plant foods that contain all nine essential amino acids, making it a complete protein."
  },
  {
    id: "q36",
    question: "What is the best way to treat a minor burn?",
    options: ["Apply ice directly", "Pop any blisters", "Run cool water over it", "Apply butter or oil"],
    correctIndex: 2,
    explanation: "Running cool (not ice cold) water over a minor burn for 10-15 minutes helps cool the skin and prevent further tissue damage."
  },
  {
    id: "q37",
    question: "How does regular exercise affect sleep?",
    options: ["It causes insomnia", "It helps you fall asleep faster and deepens sleep", "It has no effect on sleep", "It makes you wake up frequently"],
    correctIndex: 1,
    explanation: "Regular physical activity can help you fall asleep faster, get better sleep, and deepen your sleep."
  },
  {
    id: "q38",
    question: "Which organ is primarily responsible for detoxifying the blood?",
    options: ["Heart", "Lungs", "Liver", "Stomach"],
    correctIndex: 2,
    explanation: "The liver filters all of the blood in the body and breaks down poisonous substances, such as alcohol and drugs."
  },
  {
    id: "q39",
    question: "What is the recommended duration for washing your hands?",
    options: ["5 seconds", "10 seconds", "20 seconds", "60 seconds"],
    correctIndex: 2,
    explanation: "The CDC recommends scrubbing your hands for at least 20 seconds to effectively remove germs."
  },
  {
    id: "q40",
    question: "Which of these is a healthy alternative to sugary drinks?",
    options: ["Diet soda", "Energy drinks", "Fruit juice with added sugar", "Water infused with fresh fruit"],
    correctIndex: 3,
    explanation: "Water infused with fresh fruit provides flavor without the added sugars or artificial sweeteners found in many other beverages."
  },
  {
    id: "q41",
    question: "What is the main purpose of endorphins?",
    options: ["To digest food", "To act as natural painkillers and mood elevators", "To build muscle", "To regulate body temperature"],
    correctIndex: 1,
    explanation: "Endorphins are chemicals produced by the body to relieve stress and pain. They are often released during exercise, leading to a 'runner's high'."
  },
  {
    id: "q42",
    question: "Which of these habits can negatively impact posture?",
    options: ["Sitting up straight", "Looking down at a phone for long periods", "Doing core exercises", "Using an ergonomic chair"],
    correctIndex: 1,
    explanation: "Constantly looking down at a phone can cause 'text neck,' leading to strain on the spine and poor posture."
  },
  {
    id: "q43",
    question: "What is the role of calcium in the body?",
    options: ["Providing energy", "Building and maintaining strong bones", "Fighting infections", "Carrying oxygen"],
    correctIndex: 1,
    explanation: "Calcium is a mineral most often associated with healthy bones and teeth, although it also plays an important role in blood clotting and muscle contraction."
  },
  {
    id: "q44",
    question: "Which of the following is a sign of a healthy relationship?",
    options: ["Constant jealousy", "Lack of communication", "Mutual respect and trust", "Controlling behavior"],
    correctIndex: 2,
    explanation: "Healthy relationships are built on a foundation of mutual respect, trust, open communication, and equality."
  },
  {
    id: "q45",
    question: "What is the best way to protect your hearing when listening to music with headphones?",
    options: ["Keep the volume at maximum", "Listen for hours without a break", "Follow the 60/60 rule (60% volume for 60 minutes max)", "Only use one earbud"],
    correctIndex: 2,
    explanation: "The 60/60 rule suggests listening to music at no more than 60% of the maximum volume for no more than 60 minutes a day to protect hearing."
  },
  {
    id: "q46",
    question: "Which of these is a symptom of low blood sugar (hypoglycemia)?",
    options: ["Extreme thirst", "Frequent urination", "Shakiness and dizziness", "Dry mouth"],
    correctIndex: 2,
    explanation: "Symptoms of low blood sugar include shakiness, dizziness, sweating, hunger, and irritability."
  },
  {
    id: "q47",
    question: "What is the benefit of eating foods rich in antioxidants?",
    options: ["They increase cholesterol", "They protect cells from damage caused by free radicals", "They cause weight gain", "They reduce muscle mass"],
    correctIndex: 1,
    explanation: "Antioxidants are substances that may protect your cells against free radicals, which may play a role in heart disease, cancer and other diseases."
  },
  {
    id: "q48",
    question: "Which of these is a recommended practice for good dental hygiene?",
    options: ["Brushing once a week", "Flossing daily", "Using a hard-bristled toothbrush", "Avoiding the dentist"],
    correctIndex: 1,
    explanation: "Flossing daily removes plaque and food particles from between the teeth and under the gumline, where a toothbrush can't reach."
  },
  {
    id: "q49",
    question: "What is the primary cause of sunburn?",
    options: ["Heat from the sun", "Ultraviolet (UV) radiation", "Visible light", "Infrared radiation"],
    correctIndex: 1,
    explanation: "Sunburn is an inflammatory response in the skin triggered by damage from ultraviolet (UV) radiation from the sun."
  },
  {
    id: "q50",
    question: "Which of these strategies helps improve focus and productivity?",
    options: ["Multitasking constantly", "Taking short, regular breaks (like the Pomodoro technique)", "Working for 8 hours straight", "Keeping your phone on your desk with notifications on"],
    correctIndex: 1,
    explanation: "Techniques like Pomodoro (working for 25 minutes, then taking a 5-minute break) help maintain focus and prevent mental fatigue."
  }
];
