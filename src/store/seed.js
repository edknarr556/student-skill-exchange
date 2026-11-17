/**
 * Realistic sample data for the prototype. This is written to LocalStorage on
 * first run (and whenever the user resets the demo). `CURRENT_USER_ID` is the
 * signed-in student — everything is viewed from their perspective.
 */

export const CURRENT_USER_ID = 'u-me';
export const DATA_VERSION = 4;

// Days used for availability + scheduling helpers
export const SUBJECTS = [
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Writing & English',
  'Languages',
  'Design',
  'Business',
];

export const AVAILABILITY = ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible'];

function daysFromNow(n, hour = 15, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}
function hoursAgo(n) {
  return new Date(Date.now() - n * 3600 * 1000).toISOString();
}
function minsAgo(n) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

export function buildSeed() {
  const students = [
    {
      id: CURRENT_USER_ID,
      name: 'Jordan Reyes',
      avatar: null,
      color: '#1e3a8a',
      major: 'Computer Science',
      year: 'Junior',
      university: 'Riverside State University',
      bio: 'CS junior who loves breaking down tricky algorithms into plain English. I tutor to teach, and I am always trading skills to pick up new ones.',
      rating: 4.9,
      reviews: 32,
      sessionsTaught: 41,
      skillsTeach: [
        { subject: 'Computer Science', skill: 'Data Structures & Algorithms', level: 'Advanced' },
        { subject: 'Computer Science', skill: 'Python Programming', level: 'Advanced' },
        { subject: 'Mathematics', skill: 'Discrete Math', level: 'Intermediate' },
      ],
      skillsLearn: [
        { subject: 'Design', skill: 'UI/UX Design' },
        { subject: 'Languages', skill: 'Spanish Conversation' },
      ],
      availability: ['Weekday evenings', 'Weekends'],
      rate: 18,
      openToExchange: true,
    },
    {
      id: 'u-amara',
      name: 'Amara Okafor',
      avatar: null,
      color: '#7c3aed',
      major: 'Mathematics',
      year: 'Senior',
      university: 'Riverside State University',
      bio: 'Math senior and TA for Calculus II. Patient, visual, and a big fan of worked examples. Happy to swap math help for design feedback.',
      rating: 4.9,
      reviews: 58,
      sessionsTaught: 73,
      skillsTeach: [
        { subject: 'Mathematics', skill: 'Calculus I & II', level: 'Advanced' },
        { subject: 'Mathematics', skill: 'Linear Algebra', level: 'Advanced' },
        { subject: 'Physics', skill: 'Mechanics', level: 'Intermediate' },
      ],
      skillsLearn: [{ subject: 'Design', skill: 'Figma Prototyping' }],
      availability: ['Weekday mornings', 'Weekends'],
      rate: 22,
      openToExchange: true,
    },
    {
      id: 'u-liam',
      name: 'Liam Chen',
      avatar: null,
      color: '#0ea5a4',
      major: 'Physics',
      year: 'Senior',
      university: 'Riverside State University',
      bio: 'Physics senior researching optics. I make hard concepts click with analogies and lots of diagrams.',
      rating: 4.7,
      reviews: 24,
      sessionsTaught: 29,
      skillsTeach: [
        { subject: 'Physics', skill: 'Electromagnetism', level: 'Advanced' },
        { subject: 'Physics', skill: 'Quantum Mechanics', level: 'Intermediate' },
        { subject: 'Mathematics', skill: 'Differential Equations', level: 'Intermediate' },
      ],
      skillsLearn: [{ subject: 'Computer Science', skill: 'Python Programming' }],
      availability: ['Weekday evenings'],
      rate: 20,
      openToExchange: true,
    },
    {
      id: 'u-sofia',
      name: 'Sofia Martinez',
      avatar: null,
      color: '#dc2626',
      major: 'Design',
      year: 'Junior',
      university: 'Riverside State University',
      bio: 'Design junior obsessed with clean interfaces. I teach Figma and design systems, and I am trying to level up my coding.',
      rating: 4.8,
      reviews: 41,
      sessionsTaught: 47,
      skillsTeach: [
        { subject: 'Design', skill: 'UI/UX Design', level: 'Advanced' },
        { subject: 'Design', skill: 'Figma Prototyping', level: 'Advanced' },
        { subject: 'Design', skill: 'Brand & Typography', level: 'Intermediate' },
      ],
      skillsLearn: [
        { subject: 'Computer Science', skill: 'Data Structures & Algorithms' },
        { subject: 'Computer Science', skill: 'Python Programming' },
      ],
      availability: ['Weekends', 'Flexible'],
      rate: 19,
      openToExchange: true,
    },
    {
      id: 'u-noah',
      name: 'Noah Williams',
      avatar: null,
      color: '#f59e0b',
      major: 'Economics',
      year: 'Sophomore',
      university: 'Riverside State University',
      bio: 'Econ sophomore who tutors micro and macro. I love real-world examples and keeping study sessions low-stress.',
      rating: 4.6,
      reviews: 18,
      sessionsTaught: 21,
      skillsTeach: [
        { subject: 'Economics', skill: 'Microeconomics', level: 'Intermediate' },
        { subject: 'Economics', skill: 'Macroeconomics', level: 'Intermediate' },
        { subject: 'Business', skill: 'Financial Accounting', level: 'Beginner' },
      ],
      skillsLearn: [{ subject: 'Writing & English', skill: 'Essay Writing' }],
      availability: ['Weekday evenings', 'Weekends'],
      rate: 15,
      openToExchange: false,
    },
    {
      id: 'u-priya',
      name: 'Priya Sharma',
      avatar: null,
      color: '#2447a3',
      major: 'Biology',
      year: 'Senior',
      university: 'Riverside State University',
      bio: 'Pre-med bio senior. Organic chem and molecular biology are my happy place. Flashcards and diagrams for days.',
      rating: 5.0,
      reviews: 36,
      sessionsTaught: 52,
      skillsTeach: [
        { subject: 'Chemistry', skill: 'Organic Chemistry', level: 'Advanced' },
        { subject: 'Biology', skill: 'Molecular Biology', level: 'Advanced' },
        { subject: 'Biology', skill: 'Genetics', level: 'Intermediate' },
      ],
      skillsLearn: [{ subject: 'Languages', skill: 'Spanish Conversation' }],
      availability: ['Weekday mornings', 'Flexible'],
      rate: 21,
      openToExchange: true,
    },
    {
      id: 'u-diego',
      name: 'Diego Fernández',
      avatar: null,
      color: '#16a34a',
      major: 'Languages',
      year: 'Junior',
      university: 'Riverside State University',
      bio: 'Native Spanish speaker and languages major. Conversational practice, grammar, and exam prep. I would love to trade for CS tutoring.',
      rating: 4.8,
      reviews: 27,
      sessionsTaught: 38,
      skillsTeach: [
        { subject: 'Languages', skill: 'Spanish Conversation', level: 'Advanced' },
        { subject: 'Languages', skill: 'Spanish Grammar', level: 'Advanced' },
        { subject: 'Writing & English', skill: 'ESL Writing', level: 'Intermediate' },
      ],
      skillsLearn: [{ subject: 'Computer Science', skill: 'Python Programming' }],
      availability: ['Weekday evenings', 'Weekends'],
      rate: 16,
      openToExchange: true,
    },
    {
      id: 'u-maya',
      name: 'Maya Thompson',
      avatar: null,
      color: '#0f2454',
      major: 'Writing & English',
      year: 'Senior',
      university: 'Riverside State University',
      bio: 'English senior and writing-center coach. Essays, personal statements, and citations. I help you sound like your best self.',
      rating: 4.9,
      reviews: 44,
      sessionsTaught: 61,
      skillsTeach: [
        { subject: 'Writing & English', skill: 'Essay Writing', level: 'Advanced' },
        { subject: 'Writing & English', skill: 'Research & Citations', level: 'Advanced' },
        { subject: 'Business', skill: 'Business Communication', level: 'Intermediate' },
      ],
      skillsLearn: [{ subject: 'Design', skill: 'UI/UX Design' }],
      availability: ['Weekends', 'Flexible'],
      rate: 17,
      openToExchange: true,
    },
  ];

  // ---- Sessions (statuses: pending, confirmed, declined, completed) ----
  const sessions = [
    {
      id: 's-1',
      tutorId: 'u-amara',
      studentId: CURRENT_USER_ID,
      skill: 'Linear Algebra',
      subject: 'Mathematics',
      datetime: daysFromNow(2, 16, 0),
      durationMin: 60,
      type: 'money',
      price: 22,
      exchangeSkill: null,
      status: 'confirmed',
      approvals: { [CURRENT_USER_ID]: true, 'u-amara': true },
      note: 'Focus on eigenvalues and diagonalization for the midterm.',
      createdAt: hoursAgo(50),
    },
    {
      id: 's-2',
      tutorId: 'u-sofia',
      studentId: CURRENT_USER_ID,
      skill: 'Figma Prototyping',
      subject: 'Design',
      datetime: daysFromNow(4, 18, 30),
      durationMin: 45,
      type: 'exchange',
      price: 0,
      exchangeSkill: 'Python Programming',
      status: 'confirmed',
      approvals: { [CURRENT_USER_ID]: true, 'u-sofia': true },
      note: 'Skill swap — Sofia teaches Figma, I teach Python basics next week.',
      createdAt: hoursAgo(26),
    },
    {
      id: 's-3',
      tutorId: 'u-priya',
      studentId: CURRENT_USER_ID,
      skill: 'Organic Chemistry',
      subject: 'Chemistry',
      datetime: daysFromNow(1, 10, 0),
      durationMin: 60,
      type: 'money',
      price: 21,
      exchangeSkill: null,
      status: 'pending',
      approvals: { [CURRENT_USER_ID]: true, 'u-priya': false },
      note: 'Reaction mechanisms — hoping to go over the Sn1/Sn2 problem set.',
      createdAt: hoursAgo(6),
    },
    {
      id: 's-4',
      tutorId: CURRENT_USER_ID,
      studentId: 'u-diego',
      skill: 'Python Programming',
      subject: 'Computer Science',
      datetime: daysFromNow(3, 19, 0),
      durationMin: 60,
      type: 'exchange',
      price: 0,
      exchangeSkill: 'Spanish Conversation',
      status: 'pending',
      approvals: { [CURRENT_USER_ID]: false, 'u-diego': true },
      note: 'Diego wants Python help and will give me Spanish conversation practice.',
      createdAt: hoursAgo(3),
    },
    {
      id: 's-5',
      tutorId: 'u-liam',
      studentId: CURRENT_USER_ID,
      skill: 'Differential Equations',
      subject: 'Mathematics',
      datetime: daysFromNow(-6, 17, 0),
      durationMin: 60,
      type: 'money',
      price: 20,
      exchangeSkill: null,
      status: 'completed',
      approvals: { [CURRENT_USER_ID]: true, 'u-liam': true },
      note: 'Covered first-order ODEs. Super helpful.',
      createdAt: hoursAgo(220),
    },
    {
      id: 's-6',
      tutorId: 'u-maya',
      studentId: CURRENT_USER_ID,
      skill: 'Essay Writing',
      subject: 'Writing & English',
      datetime: daysFromNow(-12, 14, 0),
      durationMin: 45,
      type: 'money',
      price: 17,
      exchangeSkill: null,
      status: 'completed',
      approvals: { [CURRENT_USER_ID]: true, 'u-maya': true },
      note: 'Scholarship personal statement review.',
      createdAt: hoursAgo(360),
    },
    {
      id: 's-7',
      tutorId: 'u-noah',
      studentId: CURRENT_USER_ID,
      skill: 'Microeconomics',
      subject: 'Economics',
      datetime: daysFromNow(-3, 15, 0),
      durationMin: 60,
      type: 'money',
      price: 15,
      exchangeSkill: null,
      status: 'declined',
      approvals: { [CURRENT_USER_ID]: true, 'u-noah': false },
      note: 'Noah had a scheduling conflict that week.',
      createdAt: hoursAgo(180),
    },
  ];

  // ---- Conversations + messages ----
  // Message kinds: 'text' | 'agreement' (links to a session via sessionId)
  const conversations = [
    {
      id: 'c-priya',
      withId: 'u-priya',
      messages: [
        { id: 'm1', from: CURRENT_USER_ID, kind: 'text', text: "Hi Priya! I'm struggling with Sn1/Sn2 mechanisms before the orgo midterm. Any chance you could help this week?", at: hoursAgo(8) },
        { id: 'm2', from: 'u-priya', kind: 'text', text: 'Hey Jordan! Absolutely, that is one of my favorite topics to teach. What days work for you?', at: hoursAgo(7.5) },
        { id: 'm3', from: CURRENT_USER_ID, kind: 'text', text: 'Tomorrow morning would be perfect if you are free. I can do $21 for the hour.', at: hoursAgo(7) },
        { id: 'm4', from: CURRENT_USER_ID, kind: 'agreement', sessionId: 's-3', at: hoursAgo(6) },
        { id: 'm5', from: 'u-priya', kind: 'text', text: 'Looks great — let me just confirm my morning is clear and I will approve it. Bring the problem set!', at: hoursAgo(5.5) },
      ],
    },
    {
      id: 'c-diego',
      withId: 'u-diego',
      messages: [
        { id: 'm1', from: 'u-diego', kind: 'text', text: 'Jordan! I saw you teach Python. I would love to trade — I can give you Spanish conversation practice in return?', at: hoursAgo(5) },
        { id: 'm2', from: CURRENT_USER_ID, kind: 'text', text: "That's a perfect swap, I've been wanting to practice Spanish! Let's do an hour each.", at: hoursAgo(4.5) },
        { id: 'm3', from: 'u-diego', kind: 'text', text: 'Great. I set up the agreement for Python first, then we schedule Spanish after. Sound good?', at: hoursAgo(3.2) },
        { id: 'm4', from: 'u-diego', kind: 'agreement', sessionId: 's-4', at: hoursAgo(3) },
        { id: 'm5', from: 'u-diego', kind: 'text', text: 'Approved on my end! Just waiting on you to confirm the terms. 🙌', at: minsAgo(40) },
      ],
    },
    {
      id: 'c-amara',
      withId: 'u-amara',
      messages: [
        { id: 'm1', from: CURRENT_USER_ID, kind: 'text', text: 'Thanks again for agreeing to the linear algebra session!', at: hoursAgo(50) },
        { id: 'm2', from: 'u-amara', kind: 'agreement', sessionId: 's-1', at: hoursAgo(49) },
        { id: 'm3', from: 'u-amara', kind: 'text', text: 'Confirmed! We are all set for eigenvalues and diagonalization. See you then 😊', at: hoursAgo(48) },
        { id: 'm4', from: CURRENT_USER_ID, kind: 'text', text: 'Perfect, I will send over the practice problems I am stuck on beforehand.', at: hoursAgo(47) },
      ],
    },
    {
      id: 'c-sofia',
      withId: 'u-sofia',
      messages: [
        { id: 'm1', from: 'u-sofia', kind: 'text', text: 'Hey! For our swap — I teach you Figma, you teach me Python. Confirmed on my side.', at: hoursAgo(26) },
        { id: 'm2', from: 'u-sofia', kind: 'agreement', sessionId: 's-2', at: hoursAgo(26) },
        { id: 'm3', from: CURRENT_USER_ID, kind: 'text', text: "Can't wait — I'll prep a beginner Python track for you too.", at: hoursAgo(25) },
      ],
    },
  ];

  const notifications = [
    { id: 'n1', text: 'Diego approved the agreement — your confirmation is needed', link: '/messages/c-diego', at: minsAgo(40), read: false },
    { id: 'n2', text: 'Priya replied about your Organic Chemistry request', link: '/messages/c-priya', at: hoursAgo(5.5), read: false },
    { id: 'n3', text: 'Your Linear Algebra session with Amara is confirmed', link: '/sessions', at: hoursAgo(48), read: true },
  ];

  return { students, sessions, conversations, notifications };
}
