// js/memory-market.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateUserStreak } from './streak-utils.js';

// ---- 55 STORIES WITH 3 QUESTIONS EACH ----
const memoryStories = [
    // 1
    {
        id: 'story_1',
        text: "At 9:30 AM, Sarah walked into the Green Valley Market. She bought three red apples, a loaf of sourdough bread, and a carton of milk. She paid £14 with a twenty-pound note and accidentally left her blue umbrella on the counter.",
        q1: "What time did Sarah walk into the market?",
        q2: "How much did her groceries cost?",
        q3: "What item did she accidentally leave on the counter?"
    },
    // 2
    {
        id: 'story_2',
        text: "Flight 402 to Paris was delayed by two hours due to heavy snow. Captain Miller announced that passengers would receive free coffee at Gate 7. Only 45 people were on the flight, mostly carrying yellow backpacks.",
        q1: "Where was the flight traveling to?",
        q2: "What was the Captain's name?",
        q3: "At which gate was the free coffee offered?"
    },
    // 3
    {
        id: 'story_3',
        text: "The Riverside Cafe opened at 7 AM. Mrs. Chen ordered a green tea and a croissant. She sat by the window, reading her paperback novel, and stayed for exactly 45 minutes before heading to her pottery class.",
        q1: "What time did the Riverside Cafe open?",
        q2: "What did Mrs. Chen order?",
        q3: "How long did she stay at the cafe?"
    },
    // 4
    {
        id: 'story_4',
        text: "Dr. Patel's clinic is on the third floor of the Hillcrest Building. His receptionist, Maria, has worked there for 12 years. He sees patients on Tuesdays and Thursdays, and his consultation fee is £85.",
        q1: "Which floor is Dr. Patel's clinic on?",
        q2: "What is the receptionist's name?",
        q3: "How much is the consultation fee?"
    },
    // 5
    {
        id: 'story_5',
        text: "The old library on Oak Street was built in 1924. It has 47,000 books and a famous spiral staircase. Every Saturday at 2 PM, a storyteller reads to children in the basement. The librarian is Mr. Thompson.",
        q1: "What year was the library built?",
        q2: "How many books does it have?",
        q3: "What is the librarian's name?"
    },
    // 6
    {
        id: 'story_6',
        text: "At the summer festival, there were 12 food stalls and 6 music stages. The main act, The Echoes, started at 8 PM. 3,500 people attended, and they sold 800 glow sticks. The fireworks lasted 15 minutes.",
        q1: "How many music stages were there?",
        q2: "What was the main act called?",
        q3: "How long did the fireworks last?"
    },
    // 7
    {
        id: 'story_7',
        text: "James lives at 42 Maple Avenue with his golden retriever, Max. He works as a graphic designer for a tech company. He has lived there for 5 years and pays £1,200 rent per month. His favourite colour is green.",
        q1: "What is James's dog's name?",
        q2: "What does James do for work?",
        q3: "How much rent does he pay?"
    },
    // 8
    {
        id: 'story_8',
        text: "The Grand Hotel has 200 rooms and a rooftop swimming pool. The check-in time is 3 PM. The restaurant serves breakfast until 10:30 AM. The hotel manager is Ms. Fernandez, and she has worked there since 2015.",
        q1: "How many rooms does the Grand Hotel have?",
        q2: "What time is check-in?",
        q3: "Who is the hotel manager?"
    },
    // 9
    {
        id: 'story_9',
        text: "On Tuesday morning, the temperature was 12°C. By noon it had risen to 18°C. In the afternoon, a gentle rain fell for 20 minutes. The wind speed was 15 km/h from the west. The barometer read 1012 hPa.",
        q1: "What was the temperature at noon?",
        q2: "How long did the rain last?",
        q3: "What was the wind speed?"
    },
    // 10
    {
        id: 'story_10',
        text: "The museum has a new dinosaur exhibit featuring a T-Rex skeleton. It is 12 metres tall and 21 metres long. The exhibit opened on June 1st and will run until September 30th. Tickets cost £18 for adults.",
        q1: "How tall is the T-Rex skeleton?",
        q2: "When did the exhibit open?",
        q3: "How much do adult tickets cost?"
    },
    // 11
    {
        id: 'story_11',
        text: "The school play was a musical called 'Starlight Dreams'. It featured 35 students from years 7 to 10. The performance ran for 90 minutes with a 15-minute interval. The director was Mrs. Williams, and tickets sold out in 3 days.",
        q1: "What was the musical called?",
        q2: "How long was the performance?",
        q3: "Who was the director?"
    },
    // 12
    {
        id: 'story_12',
        text: "The local bakery bakes 12 different types of bread. They sell around 800 loaves per day. Their most popular item is sourdough. The bakery opens at 6 AM and closes at 8 PM. The owner is Mr. Rossi, who is from Italy.",
        q1: "How many types of bread does the bakery make?",
        q2: "What is the most popular item?",
        q3: "Where is Mr. Rossi from?"
    },
    // 13
    {
        id: 'story_13',
        text: "The art gallery is showing works by 5 local artists. The exhibition started on January 15th and ends on March 2nd. There are 47 paintings on display. The gallery is open from 10 AM to 6 PM, except on Mondays.",
        q1: "How many artists are featured?",
        q2: "What date does the exhibition end?",
        q3: "When is the gallery closed?"
    },
    // 14
    {
        id: 'story_14',
        text: "The hiking trail is 8.5 kilometres long and takes about 3 hours to complete. There are 4 rest stops along the way. The highest point is 450 metres above sea level. The trail starts at the Pine Grove car park.",
        q1: "How long is the hiking trail?",
        q2: "How many rest stops are there?",
        q3: "Where does the trail start?"
    },
    // 15
    {
        id: 'story_15',
        text: "The new smartphone has a 6.5-inch screen and 256 GB of storage. It has a battery life of 18 hours. It weighs 210 grams and comes in three colours: black, blue, and gold. It costs £899 without a contract.",
        q1: "How much storage does the phone have?",
        q2: "What is the battery life?",
        q3: "How much does it cost?"
    },
    // 16
    {
        id: 'story_16',
        text: "The choir has 42 members and rehearses every Wednesday evening at 7:30 PM. Their next concert is on November 5th at St. Mary's Church. They will perform 8 songs, and tickets are £12 each.",
        q1: "When does the choir rehearse?",
        q2: "Where is the concert?",
        q3: "How much are the tickets?"
    },
    // 17
    {
        id: 'story_17',
        text: "The football team won 7 of their last 10 matches. They scored 23 goals and conceded 9. Their top scorer is Liam, who has 8 goals. The team's next game is on Saturday at 3 PM against the league leaders.",
        q1: "How many matches did they win?",
        q2: "Who is the top scorer?",
        q3: "When is the next game?"
    },
    // 18
    {
        id: 'story_18',
        text: "The community garden has 32 plots and grows 14 different vegetables. There is a greenhouse that is 6 metres wide and 12 metres long. The garden club has 28 members and meets every second Saturday.",
        q1: "How many vegetable types are grown?",
        q2: "How wide is the greenhouse?",
        q3: "When does the garden club meet?"
    },
    // 19
    {
        id: 'story_19',
        text: "The bus route number 204 has 18 stops and takes 45 minutes from start to end. The first bus leaves at 5:30 AM and the last at 11:15 PM. There are 6 buses running during peak hours.",
        q1: "How many stops does bus 204 have?",
        q2: "What time does the last bus leave?",
        q3: "How many buses run during peak hours?"
    },
    // 20
    {
        id: 'story_20',
        text: "The science fair had 78 projects from 12 different schools. The judges gave 5 gold awards, 10 silver, and 15 bronze. The winning project was about renewable energy. The fair was held in the city hall's main hall.",
        q1: "How many projects were at the fair?",
        q2: "How many gold awards were given?",
        q3: "Where was the fair held?"
    },
    // 21
    {
        id: 'story_21',
        text: "On the camping trip, we pitched 5 tents by the lake. We arrived at 3 PM and spent the evening fishing. We caught 12 fish, cooked them for dinner, and saw 8 shooting stars that night.",
        q1: "How many tents were pitched?",
        q2: "What time did they arrive?",
        q3: "How many fish did they catch?"
    },
    // 22
    {
        id: 'story_22',
        text: "The theatre is showing a play called 'The Last Voyage' for 6 weeks. It features 11 actors and has 3 acts. The show starts at 7:30 PM and runs for 2 hours. The director is Ms. Lee, and she is from Singapore.",
        q1: "What is the play called?",
        q2: "How many actors are in it?",
        q3: "Where is Ms. Lee from?"
    },
    // 23
    {
        id: 'story_23',
        text: "The history book has 17 chapters and 340 pages. It was published in 2021. The author is Professor David Chen, who teaches at the university. The book costs £28 in hardcover.",
        q1: "How many chapters does the book have?",
        q2: "What year was it published?",
        q3: "How much does it cost in hardcover?"
    },
    // 24
    {
        id: 'story_24',
        text: "The swimming pool is 25 metres long and has 8 lanes. It is heated to 28°C. The pool opens at 6 AM for lane swimming and closes at 9 PM. The lifeguard on duty is named Sophia.",
        q1: "How many lanes does the pool have?",
        q2: "What temperature is the pool heated to?",
        q3: "What is the lifeguard's name?"
    },
    // 25
    {
        id: 'story_25',
        text: "The new cafe, called 'Bean & Brew', opened last month. They serve 7 types of coffee and 4 types of tea. They also sell fresh pastries baked daily. The most popular item is the cinnamon roll.",
        q1: "What is the cafe called?",
        q2: "How many types of coffee do they serve?",
        q3: "What is the most popular item?"
    },
    // 26
    {
        id: 'story_26',
        text: "The autumn fair has 15 rides and 8 food trucks. The Ferris wheel is 22 metres high. The fair runs from 11 AM to 10 PM each day. Entrance costs £10 for adults and £6 for children.",
        q1: "How many food trucks are at the fair?",
        q2: "How high is the Ferris wheel?",
        q3: "How much does an adult ticket cost?"
    },
    // 27
    {
        id: 'story_27',
        text: "The university library has 5 floors and 800 study spaces. It is open 24 hours during exam week. There are 120 computers available for student use. The library holds 200,000 books and 15,000 e-journals.",
        q1: "How many study spaces are there?",
        q2: "How many computers are available?",
        q3: "How many books does the library hold?"
    },
    // 28
    {
        id: 'story_28',
        text: "The construction project will take 18 months to complete. It will have 45 apartments, a rooftop garden, and 3 retail spaces on the ground floor. The total cost of the project is £4.5 million.",
        q1: "How long will the project take?",
        q2: "How many apartments will there be?",
        q3: "How much does the project cost?"
    },
    // 29
    {
        id: 'story_29',
        text: "The marathon had 1,200 runners this year. The winner finished in 2 hours 32 minutes. There were 16 water stations along the route. The race started at 8 AM and finished at 2 PM.",
        q1: "How many runners participated?",
        q2: "What was the winner's time?",
        q3: "How many water stations were there?"
    },
    // 30
    {
        id: 'story_30',
        text: "The old cinema on High Street has 4 screens and 800 seats. It was built in 1956 and renovated in 2018. The cinema shows 6 films daily and sells about 500 tickets each day.",
        q1: "How many screens does the cinema have?",
        q2: "What year was it built?",
        q3: "How many films are shown daily?"
    },
    // 31
    {
        id: 'story_31',
        text: "A photo exhibition features 120 images from 17 countries. It runs for 3 weeks starting November 1st. The exhibition is sponsored by a photography magazine. The entrance fee is £9, and it's free for students.",
        q1: "How many countries are featured?",
        q2: "When does the exhibition start?",
        q3: "What is the entrance fee?"
    },
    // 32
    {
        id: 'story_32',
        text: "The garden centre sells 30 types of flowers and 12 types of trees. They have a team of 8 gardeners. The centre is open from 9 AM to 7 PM every day. The owner's name is Mr. Green.",
        q1: "How many types of trees do they sell?",
        q2: "How many gardeners are there?",
        q3: "What is the owner's name?"
    },
    // 33
    {
        id: 'story_33',
        text: "The jazz band has a trumpet player, a saxophonist, a drummer, a bass player, and a pianist. They perform every Friday and Saturday night. Their next concert is at the Blue Note on the 24th.",
        q1: "How many members are in the band?",
        q2: "Which days do they perform?",
        q3: "Where is their next concert?"
    },
    // 34
    {
        id: 'story_34',
        text: "The mountain is 1,285 metres tall and has three climbing routes. The easiest route takes 4 hours to ascend. There is a cabin at 900 metres where climbers can rest. The nearest village is 6 kilometres away.",
        q1: "How tall is the mountain?",
        q2: "How long does the easiest route take?",
        q3: "How far is the nearest village?"
    },
    // 35
    {
        id: 'story_35',
        text: "The charity is raising money for children's hospitals. Their target is £250,000. So far, they have raised £78,000. They are running a sponsored walk next month and have 350 participants.",
        q1: "What is the charity's target?",
        q2: "How much have they raised so far?",
        q3: "How many participants are in the walk?"
    },
    // 36
    {
        id: 'story_36',
        text: "The nature reserve covers 45 hectares and has 7 different habitats. There are 120 species of birds recorded here. The visitor centre is open from 10 AM to 5 PM and has a cafe serving hot drinks.",
        q1: "How many hectares is the reserve?",
        q2: "How many bird species are recorded?",
        q3: "When does the visitor centre close?"
    },
    // 37
    {
        id: 'story_37',
        text: "The dance school has 150 students aged 5 to 18. They offer 10 different dance styles including ballet, tap, and jazz. The school was founded in 2005 by Ms. Caroline Moore.",
        q1: "How many students does the school have?",
        q2: "What is the minimum age of students?",
        q3: "Who founded the school?"
    },
    // 38
    {
        id: 'story_38',
        text: "The new train line has 12 stations and covers 38 kilometres. Trains run every 15 minutes during peak times. The journey from one end to the other takes 42 minutes. The first train leaves at 5:45 AM.",
        q1: "How many stations does the line have?",
        q2: "How long is the journey?",
        q3: "What time does the first train leave?"
    },
    // 39
    {
        id: 'story_39',
        text: "The cooking class has 8 students and runs for 6 weeks. They learn to cook French, Italian, and Japanese cuisine. The class costs £180, and all ingredients are provided. The teacher is Chef Antoine.",
        q1: "How many students are in the class?",
        q2: "How long is the course?",
        q3: "Who is the teacher?"
    },
    // 40
    {
        id: 'story_40',
        text: "The planetarium has a 15-metre dome screen and seats 80 people. Shows run every hour from 11 AM to 5 PM. The most popular show is about the solar system. Tickets cost £14 for adults and £9 for children.",
        q1: "How big is the dome screen?",
        q2: "How many seats are there?",
        q3: "How much is an adult ticket?"
    },
    // 41
    {
        id: 'story_41',
        text: "The sports club has 340 members and offers 8 different activities. The swimming pool is open 6 days a week. The club was established in 1989. Monthly membership costs £45 per adult.",
        q1: "How many members does the club have?",
        q2: "What year was the club established?",
        q3: "How much is monthly membership?"
    },
    // 42
    {
        id: 'story_42',
        text: "The marathon had 1,200 runners this year. The winner finished in 2 hours 32 minutes. There were 16 water stations along the route. The race started at 8 AM and finished at 2 PM.",
        q1: "How many runners participated?",
        q2: "What was the winner's time?",
        q3: "How many water stations were there?"
    },
    // 43
    {
        id: 'story_43',
        text: "The observatory has a telescope that is 2.4 metres in diameter. It is located on a hill at an altitude of 1,800 metres. The observatory is open to the public on clear Saturday nights. The lead astronomer is Dr. Kaur.",
        q1: "What is the diameter of the telescope?",
        q2: "When is the observatory open?",
        q3: "Who is the lead astronomer?"
    },
    // 44
    {
        id: 'story_44',
        text: "The honey farm has 120 hives and produces 3,600 litres of honey per year. The bees are kept in fields of wildflowers. The farm sells honey in 500g jars for £7.50. The farmer is called Mr. Beekman.",
        q1: "How many hives does the farm have?",
        q2: "How much honey is produced per year?",
        q3: "How much does a 500g jar cost?"
    },
    // 45
    {
        id: 'story_45',
        text: "The cinema is showing a new film called 'The Last Summer'. It runs for 2 hours and 15 minutes. The film is rated PG and is suitable for ages 8 and above. The director is a young filmmaker from Australia.",
        q1: "What is the film called?",
        q2: "How long is the film?",
        q3: "Where is the director from?"
    },
    // 46
    {
        id: 'story_46',
        text: "The hospital has 5 departments and 200 beds. It employs 45 doctors and 120 nurses. The hospital was built in 1972. It is located at 8 Health Street, just next to the pharmacy.",
        q1: "How many beds does the hospital have?",
        q2: "How many doctors are employed?",
        q3: "What year was the hospital built?"
    },
    // 47
    {
        id: 'story_47',
        text: "The choir has 42 members and rehearses every Wednesday evening at 7:30 PM. Their next concert is on November 5th at St. Mary's Church. They will perform 8 songs, and tickets are £12 each.",
        q1: "How many members does the choir have?",
        q2: "Where is the concert?",
        q3: "How many songs will they perform?"
    },
    // 48
    {
        id: 'story_48',
        text: "The bakery produces 200 bagels every morning. They have 5 different flavours: plain, sesame, poppy seed, cinnamon, and cheese. The most popular flavour is cinnamon. They sell out by 11 AM most days.",
        q1: "How many bagels do they produce daily?",
        q2: "How many flavours are there?",
        q3: "By what time do they usually sell out?"
    },
    // 49
    {
        id: 'story_49',
        text: "The bookshop has 20,000 books and a reading cafe. They host 4 author events every month. The bookshop is open 9 AM to 8 PM. The owner is Ms. Elizabeth, who has run the shop for 15 years.",
        q1: "How many books does the shop have?",
        q2: "How often do they host author events?",
        q3: "Who is the owner?"
    },
    // 50
    {
        id: 'story_50',
        text: "The gym has 6 new treadmills and 4 stationary bikes. It also has a weights area with 10 different machines. The gym is open 6 AM to 10 PM. Monthly membership is £55 with no joining fee.",
        q1: "How many treadmills does the gym have?",
        q2: "When does the gym open?",
        q3: "How much is monthly membership?"
    },
    // 51
    {
        id: 'story_51',
        text: "The new park has 5 play areas and a 2-kilometre running track. There is a pond with ducks and a small bridge. The park opens at 7 AM and closes at sunset. There are 50 benches throughout the park.",
        q1: "How many play areas are there?",
        q2: "What time does the park open?",
        q3: "How many benches are there?"
    },
    // 52
    {
        id: 'story_52',
        text: "The theatre company has 15 actors and 6 stage crew members. They have performed 8 different plays this year. Their next production is a comedy called 'The Mix-Up'. Tickets go on sale next Monday.",
        q1: "How many actors are in the company?",
        q2: "How many plays have they performed this year?",
        q3: "What is the next production called?"
    },
    // 53
    {
        id: 'story_53',
        text: "The computer lab has 25 workstations and 3 printers. It is open 9 AM to 9 PM on weekdays and 10 AM to 6 PM on weekends. There is also a scanner available for student use.",
        q1: "How many printers does the lab have?",
        q2: "What time does the lab open on weekdays?",
        q3: "What time does the lab close on weekends?"
    },
    // 54
    {
        id: 'story_54',
        text: "The aquarium has 12 tanks and 230 species of fish. The largest tank holds 100,000 litres of water. The shark feeding show happens at 2:30 PM every day. The aquarium opened in 2010.",
        q1: "How many species of fish are there?",
        q2: "What time is the shark feeding show?",
        q3: "What year did the aquarium open?"
    },
    // 55
    {
        id: 'story_55',
        text: "The climbing centre has 18 climbing walls of varying difficulty. The tallest wall is 18 metres high. They also have a small cafe serving hot drinks. The centre is open from 10 AM to 10 PM and has 120 members.",
        q1: "How many climbing walls are there?",
        q2: "How tall is the tallest wall?",
        q3: "How many members does the centre have?"
    }
];

// ---- STATE ----
let currentLevelIndex = 0;
let userXP = 0;
let quizStarted = false;
let currentStory = null;
let userStreak = 0;

// ---- DOM ELEMENTS ----
const storyPhase = document.getElementById('storyPhase');
const questionPhase = document.getElementById('questionPhase');
const storyText = document.getElementById('storyText');
const startQuizBtn = document.getElementById('startQuizBtn');
const form = document.getElementById('memoryForm');
const ans1 = document.getElementById('ans-q1');
const ans2 = document.getElementById('ans-q2');
const ans3 = document.getElementById('ans-q3');
const labelQ1 = document.getElementById('labelQ1');
const labelQ2 = document.getElementById('labelQ2');
const labelQ3 = document.getElementById('labelQ3');
const submitBtn = document.getElementById('submit-btn');
const feedbackDiv = document.getElementById('feedbackMessage');
const levelDisplay = document.getElementById('levelDisplay');
const xpDisplaySpan = document.getElementById('xpDisplay');
const backBtn = document.getElementById('backToDashboardBtn');

// DetectifyAI display elements
const wpmDisplay = document.getElementById('wpmDisplay');
const pasteDisplay = document.getElementById('pasteDisplay');
const ttrDisplay = document.getElementById('ttrDisplay');
const verdictDisplay = document.getElementById('verdictDisplay');
const cognitiveFill = document.getElementById('cognitiveLoadFill');
const cognitiveStatus = document.getElementById('cognitiveStatus');

// ---- GET COMBINED TEXT FOR DETECTIFY ----
function getCombinedText() {
    const a1 = ans1.value.trim();
    const a2 = ans2.value.trim();
    const a3 = ans3.value.trim();
    return a1 + " " + a2 + " " + a3;
}

// ---- REAL‑TIME DETECTIFY UPDATE ----
function updateDetectifyStats() {
    if (!quizStarted) return;
    const combined = getCombinedText();
    if (combined.length < 3) {
        wpmDisplay.textContent = '--';
        pasteDisplay.textContent = '--';
        ttrDisplay.textContent = '--';
        verdictDisplay.textContent = 'Waiting...';
        verdictDisplay.className = '';
        return;
    }

    if (typeof runDetectifyCheck !== 'function') return;
    const result = runDetectifyCheck(combined);
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);
    if (result.isHuman) {
        verdictDisplay.textContent = '✅ Human';
        verdictDisplay.className = '';
        cognitiveStatus.textContent = 'Optimal';
        cognitiveFill.style.width = Math.min(100, parseInt(cognitiveFill.style.width) + 2) + '%';
    } else {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        cognitiveStatus.textContent = 'Under Review';
    }
}

// ---- RENDER LEVEL ----
function renderLevel(index) {
    if (index >= memoryStories.length) {
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all 55 levels! Your memory is incredible! Redirecting...';
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
        return;
    }

    currentStory = memoryStories[index];
    quizStarted = false;
    levelDisplay.textContent = `Level ${index + 1} of ${memoryStories.length}`;

    // Show story, hide questions
    storyPhase.style.display = 'block';
    questionPhase.style.display = 'none';
    storyText.textContent = currentStory.text;

    // Set questions for later
    labelQ1.textContent = currentStory.q1;
    labelQ2.textContent = currentStory.q2;
    labelQ3.textContent = currentStory.q3;

    // Clear feedback
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Answers';
    startQuizBtn.disabled = false;
    startQuizBtn.innerHTML = '<i class="fas fa-check-circle"></i> I\'ve memorised it! Start Quiz';

    // Clear inputs and reset stats
    ans1.value = '';
    ans2.value = '';
    ans3.value = '';
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
    cognitiveStatus.textContent = 'Optimal';

    // Remove input listeners (will reattach after quiz starts)
    if (window._memoryInputListener) {
        ans1.removeEventListener('input', window._memoryInputListener);
        ans2.removeEventListener('input', window._memoryInputListener);
        ans3.removeEventListener('input', window._memoryInputListener);
        window._memoryInputListener = null;
    }
}

// ---- START QUIZ ----
startQuizBtn.addEventListener('click', () => {
    // Hide story, show questions
    storyPhase.style.display = 'none';
    questionPhase.style.display = 'block';
    quizStarted = true;
    startQuizBtn.disabled = true;

    // Start DetectifyAI timer NOW (not while reading)
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('ans-q1');
        setupPasteListener('ans-q2');
        setupPasteListener('ans-q3');
    }

    // Attach input listeners for live Detectify updates
    const listener = function() {
        updateDetectifyStats();
    };
    ans1.addEventListener('input', listener);
    ans2.addEventListener('input', listener);
    ans3.addEventListener('input', listener);
    window._memoryInputListener = listener;

    // Focus first input
    ans1.focus();
});

// ---- SUBMIT LOGIC ----
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!quizStarted || currentLevelIndex >= memoryStories.length) return;

    const a1 = ans1.value.trim();
    const a2 = ans2.value.trim();
    const a3 = ans3.value.trim();

    // 1. Validate all fields are filled
    if (!a1 || !a2 || !a3) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please answer all 3 questions before submitting.';
        return;
    }

    const combined = getCombinedText();

    // 2. Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        alert('DetectifyAI engine not loaded. Please refresh.');
        return;
    }
    const result = runDetectifyCheck(combined);

    // 3. Update stats
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);

    // 4. Check Human verdict
    if (!result.isHuman) {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = result.message + ' Please try again with your own memory.';
        ans1.value = '';
        ans2.value = '';
        ans3.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        updateDetectifyStats();
        return;
    }

    // 5. Human verified! Save to Firebase
    const xpEarned = 5;
    const story = memoryStories[currentLevelIndex];

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'memory-market',
            levelIndex: currentLevelIndex,
            storyId: story.id,
            storyText: story.text,
            payload: {
                answer1: a1,
                answer2: a2,
                answer3: a3
            },
            durationSeconds: result.duration,
            wpm: result.wpm,
            pasteRatio: result.pasteRatio,
            ttr: result.ttr,
            xpAwarded: xpEarned,
            timestamp: serverTimestamp()
        });

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            xp: increment(xpEarned),
            memoryMarketLevel: currentLevelIndex + 1
        });

        userStreak = await updateUserStreak(user.uid, db);

        userXP += xpEarned;
        xpDisplaySpan.textContent = userXP;

    } catch (error) {
        console.error('Firebase error:', error);
        alert('Error saving progress. Please check your connection.');
        return;
    }

    // 6. Show success feedback
    verdictDisplay.textContent = '✅ Human';
    verdictDisplay.className = '';
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';
    feedbackDiv.innerHTML = `✅ Great recall! +${xpEarned} XP. 🔥 Streak: ${userStreak} days! Your memory is getting sharper! 🧠`;

    // 7. Advance to next level after delay
    submitBtn.disabled = true;
    submitBtn.textContent = '🎉 Level Complete!';

    setTimeout(() => {
        currentLevelIndex++;
        renderLevel(currentLevelIndex);
        document.querySelector('.game-main').scrollIntoView({ behavior: 'smooth' });
    }, 2000);
});

// ---- BACK BUTTON ----
backBtn.addEventListener('click', () => {
    window.location.href = '../dashboard.html';
});

// ---- LOAD USER LEVEL AND XP ----
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../login.html';
        return;
    }
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            userXP = data.xp || 0;
            xpDisplaySpan.textContent = userXP;
            userStreak = data.streak || 0;
            const savedLevel = data.memoryMarketLevel || 0;
            if (savedLevel >= memoryStories.length) {
                feedbackDiv.className = 'feedback-message success';
                feedbackDiv.style.display = 'block';
                feedbackDiv.innerHTML = `✅ Great recall! +${xpEarned} XP. 🔥 Streak: ${userStreak} days! Your memory is getting sharper! 🧠`;
                submitBtn.disabled = true;
                submitBtn.textContent = '🌟 Master';
                return;
            }
            currentLevelIndex = savedLevel;
            renderLevel(currentLevelIndex);
        } else {
            renderLevel(0);
        }
    } catch (e) {
        console.error('Error loading user data:', e);
        renderLevel(0);
    }
});

// ---- KEYBOARD SHORTCUT: Ctrl+Enter to submit ----
const allInputs = [ans1, ans2, ans3];
allInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            form.dispatchEvent(new Event('submit'));
        }
    });
});