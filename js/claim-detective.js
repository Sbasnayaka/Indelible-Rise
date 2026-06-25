// js/claim-detective.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateUserStreak } from './streak-utils.js';
import { showNotification } from './notification.js';

// ---- 55 QUESTION BANK ----
const questions = [
    // 1
    {
        claim: '"Recent studies prove that consuming three cups of green tea daily increases cognitive processing speed by 400% within a week, making it superior to any pharmaceutical intervention for focus."',
        evidence: [
            { label: 'A', text: 'A 5-year study by Oxford University on 10,000 students.' },
            { label: 'B', text: 'My friend Bob drank green tea and passed his math test.' },
            { label: 'C', text: 'A chemical analysis showing increased brain activity.' }
        ],
        correctIndex: 1,
        explanation: 'Anecdotal evidence from one person is not reliable scientific proof.'
    },
    // 2
    {
        claim: '"Energy drinks make you 200% smarter and boost your IQ instantly."',
        evidence: [
            { label: 'A', text: 'My friend Bob drank green tea and passed his math test.' },
            { label: 'B', text: 'A 3-year study on 10,000 university students.' },
            { label: 'C', text: 'Lab results show a temporary increase in alertness.' }
        ],
        correctIndex: 0,
        explanation: 'One person\'s experience is not reliable evidence (anecdotal fallacy).'
    },
    // 3
    {
        claim: '"Eating dark chocolate every day helps you lose weight fast."',
        evidence: [
            { label: 'A', text: 'A doctor wrote a book recommending chocolate for weight loss.' },
            { label: 'B', text: 'My sister ate chocolate and lost 5kg in a month.' },
            { label: 'C', text: 'A clinical trial on 500 people showed modest weight loss.' }
        ],
        correctIndex: 1,
        explanation: 'Personal testimony is not scientific evidence (anecdotal).'
    },
    // 4
    {
        claim: '"Online learning is significantly worse than traditional classroom teaching."',
        evidence: [
            { label: 'A', text: 'A survey of 200 teachers across 50 schools.' },
            { label: 'B', text: 'My friend failed his online class last semester.' },
            { label: 'C', text: 'A research paper comparing test scores of both groups.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s failure does not prove the whole system is flawed.'
    },
    // 5
    {
        claim: '"Vaccines cause autism in children."',
        evidence: [
            { label: 'A', text: 'A retracted study from 1998 (since debunked).' },
            { label: 'B', text: 'A meta-analysis of 100 million children showed no link.' },
            { label: 'C', text: 'A celebrity claimed her child developed autism after vaccination.' }
        ],
        correctIndex: 2,
        explanation: 'Celebrity opinions are not scientific evidence (appeal to false authority).'
    },
    // 6
    {
        claim: '"Drinking alkaline water cures cancer within months."',
        evidence: [
            { label: 'A', text: 'A peer-reviewed study in a reputable medical journal.' },
            { label: 'B', text: 'A biochemical analysis of alkaline water effects on cells.' },
            { label: 'C', text: 'My neighbor stopped chemotherapy and drank only alkaline water, and now feels better.' }
        ],
        correctIndex: 2,
        explanation: 'Personal anecdote does not establish a cure; controlled trials are needed.'
    },
    // 7
    {
        claim: '"Listening to classical music while sleeping makes you a genius."',
        evidence: [
            { label: 'A', text: 'A study showing increased brainwave activity during sleep.' },
            { label: 'B', text: 'My classmate listens to Mozart and gets straight A\'s.' },
            { label: 'C', text: 'Neuroscience research on memory consolidation during sleep.' }
        ],
        correctIndex: 1,
        explanation: 'A single example is not enough to prove the effect (anecdotal).'
    },
    // 8
    {
        claim: '"Taking cold showers every morning prevents all common colds."',
        evidence: [
            { label: 'A', text: 'A clinical trial with 1,000 participants over one winter.' },
            { label: 'B', text: 'My grandfather took cold showers and never got sick.' },
            { label: 'C', text: 'Immunological data showing improved circulation.' }
        ],
        correctIndex: 1,
        explanation: 'Grandfather\'s experience is anecdotal; population studies are needed.'
    },
    // 9
    {
        claim: '"Eating breakfast is the most important meal of the day for weight loss."',
        evidence: [
            { label: 'A', text: 'A meta-analysis of 50 studies on meal timing.' },
            { label: 'B', text: 'My friend skipped breakfast and gained weight, so breakfast must be essential.' },
            { label: 'C', text: 'A controlled study showing breakfast eaters have lower BMI.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s experience is not conclusive; correlation does not equal causation.'
    },
    // 10
    {
        claim: '"Yoga can completely replace medication for anxiety disorders."',
        evidence: [
            { label: 'A', text: 'A systematic review of yoga interventions for anxiety.' },
            { label: 'B', text: 'My colleague stopped taking her pills and only does yoga, and she feels calmer.' },
            { label: 'C', text: 'A randomized controlled trial comparing yoga to standard therapy.' }
        ],
        correctIndex: 1,
        explanation: 'Personal testimony does not prove that yoga can replace medication for everyone.'
    },
    // 11
    {
        claim: '"Smartphones emit radiation that causes brain tumors in all users."',
        evidence: [
            { label: 'A', text: 'My uncle used a smartphone for 10 years and developed a brain tumor.' },
            { label: 'B', text: 'A large epidemiological study across 20 countries.' },
            { label: 'C', text: 'Physical measurements of radiofrequency emissions.' }
        ],
        correctIndex: 0,
        explanation: 'One case does not establish a causal link; population studies are required.'
    },
    // 12
    {
        claim: '"The internet is making people less intelligent because they rely on search engines."',
        evidence: [
            { label: 'A', text: 'A longitudinal study on cognitive abilities over 10 years.' },
            { label: 'B', text: 'My son uses Google for everything and his grades dropped.' },
            { label: 'C', text: 'A neuroscience study on memory and information retrieval.' }
        ],
        correctIndex: 1,
        explanation: 'A single anecdote does not prove a global decline in intelligence.'
    },
    // 13
    {
        claim: '"Electric cars are worse for the environment than petrol cars because of battery production."',
        evidence: [
            { label: 'A', text: 'A life-cycle analysis comparing total emissions.' },
            { label: 'B', text: 'A report on battery manufacturing energy usage.' },
            { label: 'C', text: 'My neighbor bought an electric car and now pays more for electricity.' }
        ],
        correctIndex: 2,
        explanation: 'Personal experience with costs does not reflect overall environmental impact.'
    },
    // 14
    {
        claim: '"Playing video games causes violence in teenagers."',
        evidence: [
            { label: 'A', text: 'A meta-analysis of 100 studies on gaming and aggression.' },
            { label: 'B', text: 'My cousin played shooting games and got into a fight at school.' },
            { label: 'C', text: 'A controlled experiment measuring arousal after gaming.' }
        ],
        correctIndex: 1,
        explanation: 'A single case does not establish a causal link; meta-analyses are needed.'
    },
    // 15
    {
        claim: '"Using a standing desk improves productivity by 50%."',
        evidence: [
            { label: 'A', text: 'A workplace study with 500 employees over 6 months.' },
            { label: 'B', text: 'My office colleague got a standing desk and now finishes work faster.' },
            { label: 'C', text: 'Ergonomic research on posture and focus.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s experience is not evidence for a 50% improvement.'
    },
    // 16
    {
        claim: '"Meditation can cure depression without any side effects."',
        evidence: [
            { label: 'A', text: 'My friend stopped taking antidepressants and now meditates daily; she feels great.' },
            { label: 'B', text: 'A systematic review of meditation for depression.' },
            { label: 'C', text: 'A randomized trial comparing meditation to cognitive therapy.' }
        ],
        correctIndex: 0,
        explanation: 'Anecdotal success does not prove it cures depression for everyone.'
    },
    // 17
    {
        claim: '"Taking vitamin C prevents the common cold."',
        evidence: [
            { label: 'A', text: 'A Cochrane review of vitamin C trials.' },
            { label: 'B', text: 'My mother always takes vitamin C and never gets colds.' },
            { label: 'C', text: 'A study on immune response to vitamin C.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s experience is not a substitute for large-scale trials.'
    },
    // 18
    {
        claim: '"Artificial intelligence will replace all human jobs within 10 years."',
        evidence: [
            { label: 'A', text: 'An economic forecast by leading AI researchers.' },
            { label: 'B', text: 'My company just replaced three receptionists with a chatbot.' },
            { label: 'C', text: 'A report on automation trends in various industries.' }
        ],
        correctIndex: 1,
        explanation: 'A single company\'s decision does not prove all jobs will be replaced.'
    },
    // 19
    {
        claim: '"Eating organic food makes you live longer."',
        evidence: [
            { label: 'A', text: 'A large cohort study on organic food consumption and mortality.' },
            { label: 'B', text: 'My aunt eats only organic and is 90 years old.' },
            { label: 'C', text: 'Nutrient analysis comparing organic and conventional produce.' }
        ],
        correctIndex: 1,
        explanation: 'One long-lived relative is not scientific proof of a causal effect.'
    },
    // 20
    {
        claim: '"Caffeine is addictive and causes serious health problems for everyone."',
        evidence: [
            { label: 'A', text: 'A comprehensive review of caffeine addiction and health outcomes.' },
            { label: 'B', text: 'My friend drinks 10 cups a day and has heart palpitations.' },
            { label: 'C', text: 'A dose-response study on caffeine consumption.' }
        ],
        correctIndex: 1,
        explanation: 'Individual reaction does not represent the entire population.'
    },
    // 21
    {
        claim: '"Homework should be banned because it causes student stress."',
        evidence: [
            { label: 'A', text: 'A survey of 5,000 students on stress levels.' },
            { label: 'B', text: 'My daughter cries every night doing homework.' },
            { label: 'C', text: 'A study on the academic benefits of homework.' }
        ],
        correctIndex: 1,
        explanation: 'One child\'s experience does not justify a blanket ban.'
    },
    // 22
    {
        claim: '"Learning a second language boosts IQ by 20 points."',
        evidence: [
            { label: 'A', text: 'A meta-analysis of bilingualism and cognitive performance.' },
            { label: 'B', text: 'My cousin learned Spanish and now scores higher on tests.' },
            { label: 'C', text: 'A neuroscience study on brain plasticity in language learners.' }
        ],
        correctIndex: 1,
        explanation: 'A single case does not prove a 20‑point IQ increase for all.'
    },
    // 23
    {
        claim: '"All private schools are better than public schools because they have more resources."',
        evidence: [
            { label: 'A', text: 'A national assessment comparing standardized test scores.' },
            { label: 'B', text: 'My son transferred to a private school and his grades improved.' },
            { label: 'C', text: 'A report on funding per student in different school types.' }
        ],
        correctIndex: 1,
        explanation: 'One student\'s improvement is not evidence that all private schools are better.'
    },
    // 24
    {
        claim: '"Reading paper books is more beneficial than reading e-books."',
        evidence: [
            { label: 'A', text: 'A study comparing comprehension and retention across formats.' },
            { label: 'B', text: 'My grandmother prefers paper books and she is very wise.' },
            { label: 'C', text: 'An analysis of eye strain and reading speed.' }
        ],
        correctIndex: 1,
        explanation: 'Preference of one person does not establish superiority.'
    },
    // 25
    {
        claim: '"Taking a gap year before college improves academic performance."',
        evidence: [
            { label: 'A', text: 'A longitudinal study tracking students who took gap years.' },
            { label: 'B', text: 'My sister took a gap year and now has a 4.0 GPA.' },
            { label: 'C', text: 'A survey of university admissions officers.' }
        ],
        correctIndex: 1,
        explanation: 'One student\'s success is not proof of a general effect.'
    },
    // 26
    {
        claim: '"All college professors are liberal and indoctrinate students."',
        evidence: [
            { label: 'A', text: 'A comprehensive survey of faculty political affiliations.' },
            { label: 'B', text: 'My professor always makes left‑leaning comments in class.' },
            { label: 'C', text: 'A study on classroom discussions and student opinions.' }
        ],
        correctIndex: 1,
        explanation: 'One professor\'s behavior does not represent all professors.'
    },
    // 27
    {
        claim: '"Standardized testing is the only fair way to measure student achievement."',
        evidence: [
            { label: 'A', text: 'A research paper comparing assessment methods.' },
            { label: 'B', text: 'My cousin aced the SAT and got into a top university.' },
            { label: 'C', text: 'An analysis of test bias and predictive validity.' }
        ],
        correctIndex: 1,
        explanation: 'One successful test‑taker does not prove the system is fair for everyone.'
    },
    // 28
    {
        claim: '"Kids who eat breakfast perform better in school."',
        evidence: [
            { label: 'A', text: 'A large‑scale study on nutrition and academic performance.' },
            { label: 'B', text: 'My daughter eats breakfast every day and gets good grades.' },
            { label: 'C', text: 'A controlled trial comparing breakfast eaters and skippers.' }
        ],
        correctIndex: 1,
        explanation: 'A single child’s experience is not conclusive evidence.'
    },
    // 29
    {
        claim: '"School uniforms reduce bullying and improve discipline."',
        evidence: [
            { label: 'A', text: 'A meta‑analysis of uniform policies in schools.' },
            { label: 'B', text: 'My nephew’s school introduced uniforms and bullying stopped.' },
            { label: 'C', text: 'A survey of teacher perceptions on uniforms.' }
        ],
        correctIndex: 1,
        explanation: 'One school’s outcome does not prove uniforms are the cause.'
    },
    // 30
    {
        claim: '"Online degrees are not respected by employers."',
        evidence: [
            { label: 'A', text: 'A survey of hiring managers on their views of online degrees.' },
            { label: 'B', text: 'My friend got a degree online and couldn\'t find a job.' },
            { label: 'C', text: 'A study comparing career outcomes of online vs traditional graduates.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s job search failure does not represent all online degree holders.'
    },
    // 31
    {
        claim: '"Immigration always lowers wages for native workers."',
        evidence: [
            { label: 'A', text: 'An economic analysis of labor markets over 20 years.' },
            { label: 'B', text: 'My neighbor lost his job to an immigrant worker.' },
            { label: 'C', text: 'A report on immigrant entrepreneurship and job creation.' }
        ],
        correctIndex: 1,
        explanation: 'One individual’s experience does not prove a general economic trend.'
    },
    // 32
    {
        claim: '"Voting for a third party is a waste of your vote."',
        evidence: [
            { label: 'A', text: 'A political science analysis of electoral systems.' },
            { label: 'B', text: 'My friend voted Green Party and said it didn\'t matter.' },
            { label: 'C', text: 'Historical data on election outcomes and third‑party votes.' }
        ],
        correctIndex: 1,
        explanation: 'One voter\'s opinion is not a statistical fact about electoral impact.'
    },
    // 33
    {
        claim: '"Welfare programs make people lazy and dependent."',
        evidence: [
            { label: 'A', text: 'A longitudinal study on welfare recipients\' employment over time.' },
            { label: 'B', text: 'My cousin is on welfare and doesn\'t look for work.' },
            { label: 'C', text: 'A report on welfare policy effectiveness.' }
        ],
        correctIndex: 1,
        explanation: 'One anecdote does not represent the majority of welfare recipients.'
    },
    // 34
    {
        claim: '"Universal healthcare leads to long waiting times and poor care."',
        evidence: [
            { label: 'A', text: 'An international comparison of healthcare systems.' },
            { label: 'B', text: 'My friend in Canada waited 6 months for an MRI.' },
            { label: 'C', text: 'A study on patient satisfaction in universal healthcare systems.' }
        ],
        correctIndex: 1,
        explanation: 'A single patient’s experience is not representative of an entire system.'
    },
    // 35
    {
        claim: '"Higher taxes on the rich always harm economic growth."',
        evidence: [
            { label: 'A', text: 'An econometric study of tax policy and GDP growth.' },
            { label: 'B', text: 'My wealthy uncle moved to a low‑tax country and his business thrived.' },
            { label: 'C', text: 'A historical analysis of tax rates and economic performance.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s relocation does not prove a macroeconomic effect.'
    },
    // 36
    {
        claim: '"The death penalty deters murder."',
        evidence: [
            { label: 'A', text: 'A comprehensive review of homicide rates and capital punishment.' },
            { label: 'B', text: 'My state had a murder after executing someone, so it doesn\'t deter.' },
            { label: 'C', text: 'A criminology study on deterrence.' }
        ],
        correctIndex: 1,
        explanation: 'A single instance does not disprove a statistical deterrent effect.'
    },
    // 37
    {
        claim: '"Gun control laws prevent mass shootings."',
        evidence: [
            { label: 'A', text: 'A cross‑national study on gun laws and mass shooting rates.' },
            { label: 'B', text: 'My city has strict gun laws and still had a shooting last year.' },
            { label: 'C', text: 'A database of mass shootings and legislative changes.' }
        ],
        correctIndex: 1,
        explanation: 'One city’s incident does not invalidate the overall correlation.'
    },
    // 38
    {
        claim: '"Legalizing marijuana increases crime rates."',
        evidence: [
            { label: 'A', text: 'A multi‑state analysis of crime data after legalization.' },
            { label: 'B', text: 'My brother lives in a state where it\'s legal and he says crime is up.' },
            { label: 'C', text: 'A report on drug policy and public safety.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s perception does not constitute empirical evidence.'
    },
    // 39
    {
        claim: '"The government should not interfere in free markets at all."',
        evidence: [
            { label: 'A', text: 'An economic history of laissez‑faire and regulation.' },
            { label: 'B', text: 'My business was hurt by a new regulation, so all regulation is bad.' },
            { label: 'C', text: 'A study on market failures and regulatory solutions.' }
        ],
        correctIndex: 1,
        explanation: 'One business owner\'s complaint is not a basis for policy.'
    },
    // 40
    {
        claim: '"Climate change is a hoax because it snowed last winter."',
        evidence: [
            { label: 'A', text: 'A global climate data analysis over 50 years.' },
            { label: 'B', text: 'My town had record snowfall, so global warming can\'t be real.' },
            { label: 'C', text: 'A report from the IPCC on climate trends.' }
        ],
        correctIndex: 1,
        explanation: 'Weather (local) is not climate (global); a single cold event does not disprove global warming.'
    },
    // 41
    {
        claim: '"Plastic recycling is a scam; most of it ends up in landfills."',
        evidence: [
            { label: 'A', text: 'An investigation into recycling facility operations.' },
            { label: 'B', text: 'My neighbor stopped recycling because he saw trash trucks mixing it with garbage.' },
            { label: 'C', text: 'A government report on recycling rates and waste management.' }
        ],
        correctIndex: 1,
        explanation: 'One anecdote does not reflect the entire recycling industry.'
    },
    // 42
    {
        claim: '"Nuclear energy is too dangerous and should be banned."',
        evidence: [
            { label: 'A', text: 'A comprehensive safety review of nuclear plants worldwide.' },
            { label: 'B', text: 'My cousin works at a nuclear plant and says it\'s unsafe.' },
            { label: 'C', text: 'A study on accident risks and safety measures.' }
        ],
        correctIndex: 1,
        explanation: 'One employee\'s opinion does not replace expert safety assessments.'
    },
    // 43
    {
        claim: '"Wind turbines kill birds, so they are worse than fossil fuels."',
        evidence: [
            { label: 'A', text: 'A study comparing bird mortality from different energy sources.' },
            { label: 'B', text: 'My neighbor found a dead bird under a wind turbine.' },
            { label: 'C', text: 'A report on avian collisions with turbines.' }
        ],
        correctIndex: 1,
        explanation: 'One dead bird is not evidence of a greater environmental harm than fossil fuels.'
    },
    // 44
    {
        claim: '"Organic farming is better for the planet because it uses no pesticides."',
        evidence: [
            { label: 'A', text: 'A life‑cycle assessment of organic vs conventional farming.' },
            { label: 'B', text: 'My uncle is an organic farmer and his soil is healthy.' },
            { label: 'C', text: 'A study on biodiversity in organic farms.' }
        ],
        correctIndex: 1,
        explanation: 'One farm\'s condition does not prove organic farming is universally better.'
    },
    // 45
    {
        claim: '"Fracking causes earthquakes that endanger communities."',
        evidence: [
            { label: 'A', text: 'A geological survey linking fracking to seismic activity.' },
            { label: 'B', text: 'My house shook after a fracking operation nearby.' },
            { label: 'C', text: 'A report on induced seismicity from oil and gas extraction.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s experience of shaking does not confirm a causal link without scientific data.'
    },
    // 46
    {
        claim: '"Global warming will cause the extinction of all polar bears by 2050."',
        evidence: [
            { label: 'A', text: 'A population model of polar bears under climate scenarios.' },
            { label: 'B', text: 'My friend saw a polar bear swimming far from ice, so they are dying.' },
            { label: 'C', text: 'A study on sea ice loss and bear populations.' }
        ],
        correctIndex: 1,
        explanation: 'One observation does not predict the extinction of an entire species.'
    },
    // 47
    {
        claim: '"Recycling paper saves trees, so we should always recycle."',
        evidence: [
            { label: 'A', text: 'A lifecycle analysis of paper production and recycling.' },
            { label: 'B', text: 'My school recycles paper and we have many trees around.' },
            { label: 'C', text: 'A report on forestry sustainability.' }
        ],
        correctIndex: 1,
        explanation: 'Anecdotal presence of trees does not prove recycling is the cause.'
    },
    // 48
    {
        claim: '"Electric cars are too expensive and will never replace petrol cars."',
        evidence: [
            { label: 'A', text: 'A forecast of electric vehicle adoption and cost trends.' },
            { label: 'B', text: 'My neighbor bought a Tesla and couldn\'t afford it.' },
            { label: 'C', text: 'A study on total cost of ownership for EVs vs ICE.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s financial experience does not predict the entire market.'
    },
    // 49
    {
        claim: '"The best way to lose weight is to skip meals."',
        evidence: [
            { label: 'A', text: 'A clinical trial comparing meal frequency and weight loss.' },
            { label: 'B', text: 'My friend skipped lunch and lost 2 kilos in a week.' },
            { label: 'C', text: 'A nutritional study on metabolism and eating patterns.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s rapid weight loss is not a healthy or generalizable strategy.'
    },
    // 50
    {
        claim: '"Sugar causes hyperactivity in children."',
        evidence: [
            { label: 'A', text: 'A meta‑analysis of sugar consumption and behavior.' },
            { label: 'B', text: 'My child ate candy and ran around wildly.' },
            { label: 'C', text: 'A controlled study on sugar and energy levels.' }
        ],
        correctIndex: 1,
        explanation: 'One child\'s behavior after candy is not scientific proof of a causal link.'
    },
    // 51
    {
        claim: '"Gold is the safest investment because its value always goes up."',
        evidence: [
            { label: 'A', text: 'A historical analysis of gold prices over 100 years.' },
            { label: 'B', text: 'My grandfather bought gold and made a fortune.' },
            { label: 'C', text: 'A report on commodity market trends.' }
        ],
        correctIndex: 1,
        explanation: 'One person\'s success does not guarantee future performance for everyone.'
    },
    // 52
    {
        claim: '"Working from home is less productive than working in an office."',
        evidence: [
            { label: 'A', text: 'A study comparing productivity of remote and office workers.' },
            { label: 'B', text: 'My colleague gets distracted at home and misses deadlines.' },
            { label: 'C', text: 'A survey of company productivity metrics.' }
        ],
        correctIndex: 1,
        explanation: 'One worker\'s distraction does not prove all remote work is less productive.'
    },
    // 53
    {
        claim: '"Social media is destroying real‑life communication skills."',
        evidence: [
            { label: 'A', text: 'A long‑term study on social media use and social skills.' },
            { label: 'B', text: 'My teenage daughter spends hours on TikTok and can\'t hold a conversation.' },
            { label: 'C', text: 'A report on digital communication trends.' }
        ],
        correctIndex: 1,
        explanation: 'One teenager\'s behavior does not represent the entire generation.'
    },
    // 54
    {
        claim: '"The Earth is flat because I can see the horizon is straight."',
        evidence: [
            { label: 'A', text: 'Satellite imagery and scientific measurements of Earth\'s shape.' },
            { label: 'B', text: 'My friend took a photo of the horizon and it looks flat.' },
            { label: 'C', text: 'A physics explanation of apparent horizon curvature.' }
        ],
        correctIndex: 1,
        explanation: 'My friend took a photo of the horizon and it looks flat. A personal observation of the horizon does not override overwhelming scientific evidence.'
    },
    // 55
    {
        claim: '"Human population growth is the sole cause of environmental destruction."',
        evidence: [
            { label: 'A', text: 'A comprehensive model of environmental impact factors.' },
            { label: 'B', text: 'My town\'s population grew and now there is more pollution.' },
            { label: 'C', text: 'A study on consumption patterns and resource use.' }
        ],
        correctIndex: 1,
        explanation: 'Local correlation does not prove population is the only cause; many factors are involved.'
    }
];

// ---- STATE ----
let currentQuestionIndex = 0; // will be set from Firestore
let userXP = 0;
let gameSessionStart = performance.now();
let userStreak = 0;

// ---- DOM ELEMENTS ----
const claimCard = document.getElementById('claimCard');
const evidenceGroup = document.getElementById('evidenceGroup');
const answerText = document.getElementById('user-answer');
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

// ---- REAL‑TIME DETECTIFY UPDATE ----
function updateDetectifyStats(text) {
    if (typeof runDetectifyCheck !== 'function') return;
    const result = runDetectifyCheck(text);
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);
    if (result.isHuman) {
        verdictDisplay.textContent = '✅ Human';
        verdictDisplay.className = '';
        cognitiveFill.style.width = Math.min(100, parseInt(cognitiveFill.style.width) + 2) + '%';
        cognitiveStatus.textContent = 'Optimal';
    } else {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        cognitiveStatus.textContent = 'Under Review';
    }
}

// ---- RENDER QUESTION ----
function renderQuestion(index) {
    if (index >= questions.length) {
        feedbackDiv.className = 'feedback-message success';
        feedbackDiv.style.display = 'block';
        feedbackDiv.innerHTML = '🎉 You completed all 55 levels! Your mind is razor‑sharp. Redirecting...';
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 3000);
        return;
    }

    const q = questions[index];
    levelDisplay.textContent = `Level ${index + 1} of ${questions.length}`;

    // Claim
    claimCard.innerHTML = `<blockquote>${q.claim}</blockquote>`;

    // Evidence
    let html = '';
    q.evidence.forEach((ev, i) => {
        html += `
            <div class="evidence-option">
                <input type="radio" name="evidence" value="${i}" id="ev_${i}">
                <label for="ev_${i}"><strong>${ev.label}:</strong> ${ev.text}</label>
            </div>
        `;
    });
    evidenceGroup.innerHTML = html;

    // Clear feedback
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Play Now';

    // Reset DetectifyAI timer & paste counter
    if (typeof startDetectifyTimer === 'function') {
        startDetectifyTimer();
    }
    if (typeof setupPasteListener === 'function') {
        setupPasteListener('user-answer');
    }

    // Clear textarea and reset stats
    answerText.value = '';
    wpmDisplay.textContent = '--';
    pasteDisplay.textContent = '--';
    ttrDisplay.textContent = '--';
    verdictDisplay.textContent = 'Waiting...';
    verdictDisplay.className = '';
    cognitiveFill.style.width = '75%';
    cognitiveStatus.textContent = 'Optimal';

    // Remove previous real‑time listener and add new one
    // We'll attach a new listener after clearing old ones (by using a flag)
    // We'll use a named function to avoid duplicates
    if (window._detectifyInputListener) {
        answerText.removeEventListener('input', window._detectifyInputListener);
    }
    const listener = function(e) {
        updateDetectifyStats(e.target.value);
    };
    answerText.addEventListener('input', listener);
    window._detectifyInputListener = listener; // store for removal
}

// ---- SUBMIT LOGIC ----
submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const q = questions[currentQuestionIndex];
    if (!q) {
        // All levels done already
        submitBtn.disabled = true;
        submitBtn.textContent = '🏆 Master!';
        return;
    }

    // 1. Validate radio selection
    const selected = document.querySelector('input[name="evidence"]:checked');
    if (!selected) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please select an evidence option (A, B, or C).';
        showNotification('⚠️ Please select an evidence option (A, B, or C).', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Play Now'
        return;
    }
    const selectedIndex = parseInt(selected.value);

    // 2. Validate text area (at least 10 characters)
    const userText = answerText.value.trim();
    if (userText.length < 10) {
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = 'Please write a proper explanation (at least 10 characters).';
        showNotification('✏️ Please write a proper explanation (at least 10 characters).', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Play Now'
        return;
    }

    // 3. Run DetectifyAI
    if (typeof runDetectifyCheck !== 'function') {
        showNotification('DetectifyAI engine not loaded. Please refresh.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Play Now'
        return;
    }
    const result = runDetectifyCheck(userText);

    // 4. Update stats (already updated live, but ensure final)
    wpmDisplay.textContent = result.wpm;
    pasteDisplay.textContent = result.pasteRatio + '%';
    ttrDisplay.textContent = result.ttr.toFixed(2);

    // 5. Check Human verdict
    if (!result.isHuman) {
        verdictDisplay.textContent = '🚫 Flagged (' + result.reason + ')';
        verdictDisplay.className = 'flagged';
        feedbackDiv.className = 'feedback-message error';
        feedbackDiv.style.display = 'block';
        feedbackDiv.textContent = result.message + ' Please try again.';
        showNotification('🚫 ' + result.message + ' Please try again.', 'error');
        answerText.value = '';
        if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
        // reset live stats after clear
        updateDetectifyStats('');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Play Now'
        return;
    }

    // - Check if explanation mentions the correct evidence label ----
    const correctLabel = q.evidence[q.correctIndex].label; // 'A', 'B', or 'C'
    const containsLabel = (text, label) => {
        // Match the letter as a standalone word (e.g., "A", "B", "C")
        const regex = new RegExp(`\\b${label}\\b`, 'i');
        return regex.test(text);
    };
    const typedCorrect = containsLabel(userText, correctLabel);

    // 6. Check if evidence choice is correct
    const isCorrect = (selectedIndex === q.correctIndex) && typedCorrect;
    let xpEarned = isCorrect ? 2 : -1;

    // 7. Save to Firebase (only if human)
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not logged in');

        // Save submission
        await addDoc(collection(db, 'submissions'), {
            userId: user.uid,
            gameId: 'claim-detective',
            questionIndex: currentQuestionIndex,
            claim: q.claim,
            selectedEvidence: q.evidence[selectedIndex].label,
            correctEvidence: q.evidence[q.correctIndex].label,
            isCorrect: isCorrect,
            payload: userText,
            durationSeconds: result.duration,
            wpm: result.wpm,
            pasteRatio: result.pasteRatio,
            ttr: result.ttr,
            xpAwarded: xpEarned,
            timestamp: serverTimestamp()
        });

        // Update user XP and level
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            xp: increment(xpEarned),
            claimDetectiveLevel: currentQuestionIndex + 1  // next level
        });

         // ===== Update streak =====
        userStreak = await updateUserStreak(user.uid, db);

        // Update local XP
        userXP += xpEarned;
        xpDisplaySpan.textContent = userXP;

    } catch (error) {
        console.error('Firebase error:', error);
        showNotification('Error saving progress. Please check your connection.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Play Now'
        return;
    }

    // 8. Show feedback
    verdictDisplay.textContent = '✅ Human';
    verdictDisplay.className = '';
    feedbackDiv.className = 'feedback-message success';
    feedbackDiv.style.display = 'block';

    let message = '';
    let notifType = 'success';
    if (isCorrect) {
        message = `✅ Correct! +${xpEarned} XP. 🔥 Streak: ${userStreak} days! ${q.explanation}`;
        notifType = 'success';
    } else {
        let reason = '';
        if (selectedIndex !== q.correctIndex) {
            reason = 'You selected the wrong evidence. ';
        } else if (!typedCorrect) {
            reason = `Your explanation did not mention the correct evidence (${correctLabel}). `;
        }
        message = `❌ ${reason} -1 XP. 🔥 Streak: ${userStreak} days. Correct weak evidence was <strong>${q.evidence[q.correctIndex].label}</strong>. ${q.explanation}`;
        notifType = 'error';
    }

    feedbackDiv.innerHTML = message;

    // ----- POP‑UP NOTIFICATION (alert) -----
    const plainMessage = message.replace(/<[^>]*>/g, ''); // strip HTML for notification
    showNotification(plainMessage, notifType);


    // 9. If correct, redirect to dashboard after short delay, else allow retry
    submitBtn.disabled = true;
    submitBtn.textContent = isCorrect ? '🎉 Level Complete!' : 'Try Again';

    setTimeout(() => {
        if (isCorrect) {
            // Redirect to dashboard (user will resume at next level)
            window.location.href = '../dashboard.html';
        } else {
            // Reset for retry (stay on same level)
            submitBtn.disabled = false;
            submitBtn.textContent = 'Play Now';
            answerText.value = '';
            if (typeof startDetectifyTimer === 'function') startDetectifyTimer();
            updateDetectifyStats('');
            feedbackDiv.style.display = 'none';
            // re‑render same question to reset radio selection
            renderQuestion(currentQuestionIndex);
        }
    }, 2500);
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
            userStreak = data.streak || 0;
            xpDisplaySpan.textContent = userXP;
            // Load saved level (0‑based index)
            const savedLevel = data.claimDetectiveLevel || 0;
            // If savedLevel >= questions.length, they completed all; show completion
            if (savedLevel >= questions.length) {
                // Show completion message
                feedbackDiv.className = 'feedback-message success';
                feedbackDiv.style.display = 'block';
                feedbackDiv.innerHTML = '🏆 You have mastered all 55 levels! Amazing work!';
                submitBtn.disabled = true;
                submitBtn.textContent = '🌟 Master';
                return;
            }
            currentQuestionIndex = savedLevel;
            renderQuestion(currentQuestionIndex);
        } else {
            // New user: start at level 0
            renderQuestion(0);
        }
    } catch (e) {
        console.error('Error loading user data:', e);
        renderQuestion(0);
    }
});

// ---- KEYBOARD SHORTCUT: Ctrl+Enter to submit ----
answerText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        submitBtn.click();
    }
});