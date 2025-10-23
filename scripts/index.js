// Default values of all important variables
const defaultState = {
    allowedIncorrectGuesses: 2,     // Number of lives (hearts)
    credits: 0,                     // In-game point system
    levelTimeLimit: 61,             // Time limit for a level (shown)
    creditsMultiplier: 10,
    // Progress tracker
    levelsUnlocked: { Tenses: 1, Articles: 1, Prepositions: 1, Conditionals: 1, Pronouns: 1 },
    shopItems: {
        cursors: [
        { id: 1, name: "Red cursor", image: "images/def_kits/red1.png", price: 0, state: "using", tier: 0 },
        { id: 2, name: "Brown cursor", image: "images/def_kits/brown1.png", price: 100, state: "buy", tier: 1 },
        { id: 3, name: "Orange cursor", image: "images/def_kits/orange1.png", price: 200, state: "buy", tier: 1 },
        { id: 4, name: "Yellow cursor", image: "images/def_kits/yellow1.png", price: 300, state: "buy", tier: 1 },
        { id: 5, name: "Beige cursor", image: "images/def_kits/beige1.png", price: 400, state: "buy", tier: 1 },
        { id: 6, name: "Pink cursor", image: "images/def_kits/pink1.png", price: 500, state: "buy", tier: 1 },
        { id: 7, name: "Magenta cursor", image: "images/def_kits/magenta1.png", price: 1000, state: "buy", tier: 1 },
        { id: 8, name: "Purple cursor", image: "images/def_kits/purple1.png", price: 1500, state: "buy", tier: 2 },
        { id: 9, name: "Blue cursor", image: "images/def_kits/blue1.png", price: 2000, state: "buy", tier: 2 },
        { id: 10, name: "Green cursor", image: "images/def_kits/green1.png", price: 2500, state: "buy", tier: 2 },
        { id: 11, name: "Black cursor", image: "images/def_kits/black1.png", price: 3000, state: "buy", tier: 2 },
        { id: 12, name: "Gray cursor", image: "images/def_kits/gray1.png", price: 3500, state: "buy", tier: 2 },
        { id: 13, name: "Rainbow cursor", image: "images/def_kits/rainbow1.png", price: 5000, state: "buy", tier: 3 },
        { id: 14, name: "Toxic cursor", image: "images/def_kits/toxic1.png", price: 7500, state: "buy", tier: 3 },
        { id: 15, name: "Fire cursor", image: "images/def_kits/fire1.png", price: 10000, state: "buy", tier: 4 },
        ],
        gameplay: [
        { id: 90, name: "Extra 5 seconds", image: "images/ui_elements/plus_five.png", price: 5000, state: "buy", tier: 3 },
        { id: 91, name: "Extra life", image: "images/ui_elements/plus_heart.png", price: 10000, state: "buy", tier: 4 },
        { id: 92, name: "Double credits", image: "images/ui_elements/double_credits.png", price: 10000, state: "buy", tier: 4 },
        { id: 93, name: "Get a random item", image: "images/ui_elements/gambling.png", price: 500, state: "buy", tier: 0 },
        ]
    }
};

function loadState() {
    const savedState = localStorage.getItem('quizState');
    return savedState ? JSON.parse(savedState) : JSON.parse(JSON.stringify(defaultState));
}

function saveState(state) {
    localStorage.setItem('quizState', JSON.stringify(state));
}

function resetState() {
    const resetState = JSON.parse(JSON.stringify(defaultState));
    saveState(resetState);
    return resetState;
}

let quizState = loadState();

function resetAllProgress(){
    quizState = resetState();
    renderCredits();
    updateCursorStyle(quizState.shopItems.cursors.find(item => item.state === 'using'));
    renderItems(currentTab);
    hideResetOverlay();
}

// Functions for playing sound
let activeAudios = [];

function play(sound) {
    var audio = new Audio(sound);
    audio.play();
    activeAudios.push(audio);
    
    // Remove from array when audio ends naturally
    audio.addEventListener('ended', function() {
        const index = activeAudios.indexOf(audio);
        if (index > -1) {
            activeAudios.splice(index, 1);
        }
    });
}

function stopAllAudios() {
    // Stop all active audio objects
    activeAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    
    activeAudios = [];
    
    // Also stop any audio elements in the DOM for good measure
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

// Logic behind switching screens without refreshing the page
function showScreen(screenId) {
    play('audio/click.mp3');
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));     // Hide all screens
    document.getElementById(screenId).classList.remove('hidden');                               // Show selected screen
}

// Navigation functions
function goToMainMenu() {
    showScreen('mainMenu');
    stopTimers()
}

let currentCategory = "Tenses";         // Default category
function setCategory(chosenCategory) {
    currentCategory = chosenCategory;
}

function goToLevelSelection() {
    loadLevelSelection(currentCategory);
    showScreen('levelSelection');
    stopTimers()
    hideQuitOverlay()
}

function startQuiz(level) {
    loadQuiz(level);
    showScreen('quizScreen');

    startLevelTimer();
}

function goToGameOver() {
    stopTimers()
    showScreen('gameOver');
    createExplosion(250, 600, 500, 5, window.innerWidth / 2, window.innerHeight / 3);
}

// Loading / rendering / updating functions
function stopTimers(){
    clearInterval(levelCountdown);
    clearInterval(questionCountdown);
}

function loadLevelSelection() {
    document.getElementById('categoryTitle').textContent = `${currentCategory}`;
    updateLevelButtons()
    updateTrophy()
    hideWinOverlay()
}

function updateLevelButtons() {

    if (unlockNewLevelFlag) {
        playUnlockAnimation(currentLevel+1);
        unlockNewLevelFlag = false;
    }

    const maxUnlocked = quizState.levelsUnlocked[currentCategory];
    const buttons = document.querySelectorAll('.circle-btn');
    buttons.forEach(btn => {
        const level = parseInt(btn.dataset.level);
        const lockImg = document.getElementById('lock-' + level);
        if (level > maxUnlocked) {
            if (lockImg) lockImg.classList.add('shown');
            btn.classList.remove('shown');
            btn.disabled = true;
        } else {
            if (lockImg) lockImg.classList.remove('shown');
            btn.classList.add('shown');
            btn.disabled = false;
        }
    });
}

function updateTrophy() {
    const trophyImg = document.getElementById('trophyImg');
    const lightRaysCont = document.getElementById('light-rays-container');
    if (!trophyImg) return;

    const trophySources = {
        Tenses: "images/ui_elements/trophies/trophy_T.png",
        Articles: "images/ui_elements/trophies/trophy_A.png",
        Prepositions: "images/ui_elements/trophies/trophy_Pre.png",
        Conditionals: "images/ui_elements/trophies/trophy_C.png",
        Pronouns: "images/ui_elements/trophies/trophy_Pro.png"
    };

    if (quizState.levelsUnlocked[currentCategory] === 6) {
        trophyImg.src = trophySources[currentCategory];
        trophyImg.classList.remove("hidden");
        lightRaysCont.style.setProperty('--center-x', '59%');
        lightRaysCont.style.setProperty('--center-y', 'calc(50% - 9vw)');
        lightRaysCont.classList.remove("hidden");
    } else {
        trophyImg.classList.add("hidden");
        lightRaysCont.classList.add("hidden");
    }
}

function playUnlockAnimation(unlockedLevel) {
    play('audio/unlock_click.mp3');
    setTimeout(() => {
        play('audio/whoosh.mp3');
    }, 1500);

    const unlockIcon = document.getElementById('unlock-' + unlockedLevel);
    if (!unlockIcon) return;
    unlockIcon.style.display = 'block';
    void unlockIcon.offsetWidth; // Force reflow
    unlockIcon.classList.add('animate');
    
    // Reset
    unlockIcon.addEventListener('animationend', function handler() {
        unlockIcon.style.display = 'none';
        unlockIcon.classList.remove('animate');
        unlockIcon.removeEventListener('animationend', handler);
    });
}

let currentLevel;
let currentQuestionIndex;
let incorrectCounter;
let shuffledQuestions = [];

function loadQuiz(level) {
    currentLevel = level;
    currentQuestionIndex = 0;
    incorrectCounter = 0;
    document.getElementById('quizTitle').textContent = `${currentCategory} - Level ${level}`;
    document.getElementById('timerWrapper').classList.remove('shakeTimer');
    renderHearts()
    renderQuizProgress()
    loadBackground();
    shuffledQuestions = [...questions[currentCategory][currentLevel]];
    shuffleArray(shuffledQuestions);
    loadQuestion();
}

function renderHearts() {
    const heartContainer = document.getElementById('hearts');
    heartContainer.innerHTML = '';  // Clear previous hearts

    const heartsLeft = quizState.allowedIncorrectGuesses - incorrectCounter;
    for (let i = 0; i < heartsLeft; i++) {
        const img = document.createElement('img');
        img.src = "images/ui_elements/heart.png";
        img.alt = "life";
        img.className = "heart-img";
        heartContainer.appendChild(img);
    }
}

function renderQuizProgress() {
    const quizProgress = document.getElementById('quizProgress');
    if (currentQuestionIndex+1 != 6)
        quizProgress.textContent = `Question ${currentQuestionIndex+1}/5`;
}

function renderCredits(){
    const creditElements = document.querySelectorAll('.credits');
    creditElements.forEach(element => {
        element.textContent = `Credits: ${quizState.credits}`;
    });
}
renderCredits()

function loadBackground(){
    const quizScreen = document.getElementById('quizScreen');
    
    for (let i = 1; i <= 5; i++){
        quizScreen.classList.remove(`l${i}`);
    }
    switch (currentLevel) {
        case 1: quizScreen.classList.add('l1'); break;
        case 2: quizScreen.classList.add('l2'); break;
        case 3: quizScreen.classList.add('l3'); break;
        case 4: quizScreen.classList.add('l4'); break;
        case 5: quizScreen.classList.add('l5'); break;
    }
}

function shuffleArray(array) {
    // Fisher-Yates
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestion() {
    startQuestionTimer();
    const questionData = shuffledQuestions[currentQuestionIndex];
    document.getElementById('questionText').textContent = questionData.question;

    let optionsArray = Object.entries(questionData.options).map(([key, text]) => ({key, text}));
    shuffleArray(optionsArray);

    const submitDiv = document.getElementById('submitAnswerButtons');
    submitDiv.innerHTML = ""; // clear old buttons

    optionsArray.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option.text;
        btn.setAttribute('data-key', option.key);
        btn.onclick = () => submitAnswer(option.key, btn);
        submitDiv.appendChild(btn);
    });
}


// Timers
let levelCountdown;                 // Holds the interval timer used for ending the game
let questionCountdown;              // Holds the interval timer used for gaining credit
const questionTimeLimit = 5;        // Time limit for a question (hidden)
let levelTimeLeft = quizState.levelTimeLimit;
let questionTimeLeft = questionTimeLimit;

function startLevelTimer() {
    levelTimeLeft = quizState.levelTimeLimit;
    document.getElementById('timerDisplay').textContent = `${levelTimeLeft-1}s`;

    // Reset timer
    clearInterval(levelCountdown);

    // Start a new countdown
    levelCountdown = setInterval(() => {
        levelTimeLeft--;
        if (levelTimeLeft-1 != -1) {
            document.getElementById('timerDisplay').textContent = `${levelTimeLeft-1}s`;
        }
        if (levelTimeLeft == 10) {
            play('audio/clock_ticking.mp3');
            document.getElementById('timerWrapper').classList.add('shakeTimer');
        }
        // Check if time has run out
        if (levelTimeLeft <= 0) {
            clearInterval(levelCountdown);
            play('audio/explosion.mp3');
            goToGameOver();
        }
    }, 1000);  // Interval set to 1 second
}

function startQuestionTimer() {
    questionTimeLeft = questionTimeLimit;

    clearInterval(questionCountdown);

    questionCountdown = setInterval(() => {
        questionTimeLeft--;
        if (questionTimeLeft <= 0) {
            clearInterval(questionCountdown);
        }
    }, 1000);
}

// Set to true when new level is unlocked, checked when goToLevelSelection() is called to know if animation should be played or not
let unlockNewLevelFlag = false;
const questionsPerLevel = 5;

function calculateCredits(questionTimeLeft) {
    quizState.credits += questionTimeLeft * quizState.creditsMultiplier;
}

function submitAnswer(selectedOption, buttonElement) {
    const questionData = shuffledQuestions[currentQuestionIndex];

    document.querySelectorAll('#submitAnswerButtons button').forEach(btn=>btn.disabled=true);

    if (selectedOption === questionData.answer) {
        buttonElement.classList.add('correct');
        play('audio/correct_answer.mp3');
        calculateCredits(questionTimeLeft);
        currentQuestionIndex++;
        saveState(quizState);
    } else {
        buttonElement.classList.add('incorrect');
        play('audio/wrong_answer.mp3');
        incorrectCounter++;
    }

    renderCredits()
    // Delay by 1 second so that the user can process what was the correct 
    setTimeout(() => {
        renderCredits()
        renderHearts()

        if (currentQuestionIndex < questionsPerLevel && incorrectCounter <= quizState.allowedIncorrectGuesses) {
            // There are questions left AND lives left -> NEXT QUESTION
            loadQuestion();
        } else if (incorrectCounter > quizState.allowedIncorrectGuesses) {
            // There are NO more lives left -> YOU LOSE
            goToGameOver();
            play('audio/explosion.mp3');
        } else {
            // There are NO more questions left AND there are lives left -> YOU WIN
            showWinOverlay()
            stopTimers()
            play('audio/win.mp3')

            if (quizState.levelsUnlocked[currentCategory] == currentLevel){
                quizState.levelsUnlocked[currentCategory] ++;         // UNLOCKS NEW LEVEL
                unlockNewLevelFlag = true;
                saveState(quizState);
            }
        }
    
        renderQuizProgress()
    }, 1000);
}

// Explosion animation
const colors = ['red', 'orangered', 'gold'];

function createExplosion(particles, size, spread, duration, centerX, centerY) {
    const pixelGrid = Math.ceil(Math.sqrt(particles));
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    document.body.appendChild(explosion);

    const cellSize = size / pixelGrid;
    const offset = (pixelGrid / 2 - 0.5) * cellSize;

    for (let i = 0; i < particles; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';

        const col = i % pixelGrid;
        const row = Math.floor(i / pixelGrid);

        const startX = centerX - offset + col * cellSize;
        const startY = centerY - offset + row * cellSize;

        pixel.style.left = `${startX}px`;
        pixel.style.top = `${startY}px`;

        const angle = Math.random() * Math.PI * 2;
        const power = spread * (0.8 + Math.random() * 0.6);

        pixel.style.setProperty('--tx', `${Math.cos(angle) * power}px`);
        pixel.style.setProperty('--ty', `${Math.sin(angle) * power}px`);

        pixel.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        pixel.style.animationDelay = `${Math.random() * 0.2}s`;
        pixel.style.animationDuration = `${duration}s`;

        explosion.appendChild(pixel);
    }

    setTimeout(() => explosion.remove(), duration*1000 + 400);
}

createExplosion(150, 400, 300, 3, window.innerWidth / 3, window.innerHeight / 5);

// Fire animation
document.addEventListener('DOMContentLoaded', function() {
    const fireContainer = document.querySelector('.fire-btn-wrapper .fire-container');
    
    function createFireParticles(count) {
        for (let i = 0; i < count; i++) {
        createFireParticle();
        }
    }

    function createFireParticle() {
        const particle = document.createElement('div');
        particle.classList.add('fire-particle');

        const size = 10 + Math.random() * 25;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.left = `${Math.random() * 100}%`;
        const duration = 1 + Math.random() * 1.2;
        const delay = Math.random() * 0.9;

        // Animate via keyframes
        particle.style.animation = `
        fireBtnRise ${duration}s ease-out ${delay}s forwards,
        fireBtnFade ${duration}s ease-in-out ${delay}s forwards
        `;

        fireContainer.appendChild(particle);

        // Remove after animation
        setTimeout(() => {
        if (particle.parentNode === fireContainer) {
            fireContainer.removeChild(particle);
        }
        }, (duration + delay) * 1000 + 100);
    }

    // Keyframes setup: runs once only, not per button.
    if (!document.getElementById('fire-btn-keyframes')) {
        const style = document.createElement('style');
        style.id = 'fire-btn-keyframes';
        style.textContent = `
        @keyframes fireBtnRise {
            0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
            20% { opacity: 0.8; }
            60% { transform: translateY(-30px) scale(1) rotate(12deg);}
            100% { transform: translateY(-60px) scale(0.5) rotate(24deg); opacity: 0; }
        }
        @keyframes fireBtnFade {
            0% { opacity: 0; }
            20% { opacity: 0.8; }
            80% { opacity: 0.3; }
            100% { opacity: 0; }
        }
        `;
        document.head.appendChild(style);
    }

    // On hover, spawn more particles
    document.querySelector('.transparent-btn').addEventListener('mouseenter', function() {
        createFireParticles(8);
    });

    // Gentle fire even when not hovered
    setInterval(() => createFireParticles(1), 300);

});

function createFireParticleAt(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('fire-particle');
    const size = 12 + Math.random() * 18;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.position = 'fixed';
    particle.style.left = `${x - size/2}px`;
    particle.style.top = `${y - size/2}px`;
    particle.style.pointerEvents = 'none';
    const duration = 0.7 + Math.random() * 0.5;
    const delay = Math.random() * 0.14;
    particle.style.animation = `
        fireBtnRise ${duration}s ease-out ${delay}s forwards,
        fireBtnFade ${duration}s ease-in-out ${delay}s forwards
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), (duration + delay) * 1000 + 100);
}

function createToxicParticleAt(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('toxic-particle', 'toxic-trail');
    const size = 10 + Math.random() * 10;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${x - size/2}px`;
    particle.style.top = `${y - size/2}px`;
    particle.style.background = `radial-gradient(ellipse at center, #2dac1cff 0%, #0e6d26ff 70%, transparent 100%)`;
    const duration = 0.8 + Math.random() * 0.5;
    particle.style.animationDuration = `${duration}s`;
    document.body.appendChild(particle);
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, duration * 1000);
}

// Light rays animation
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.light-rays-container');
    const rayCount = 12;
    const radius = 10;
    const rayLength = 8;
    
    for (let i = 0; i < rayCount; i++) {
        const ray = document.createElement('div');
        ray.className = 'light-ray';
        
        const angle = (360 / rayCount) * i;
        
        // Set CSS custom properties for relative units
        ray.style.setProperty('--radius', `${radius}vw`);
        ray.style.setProperty('--ray-length', `${rayLength}vw`);
        
        ray.style.position = 'absolute';
        ray.style.left = '50%';
        ray.style.top = '50%';
        ray.style.height = 'var(--ray-length)';
        ray.style.width = '0.4vw';
        ray.style.transformOrigin = '50% 100%';
        ray.style.transform = `rotate(${angle}deg) translateY(calc(-1 * var(--radius)))`;
        ray.style.animationDelay = `${(i / rayCount) * -8}s`;

        container.appendChild(ray);
    }
});

function getCurrentCursorUrls() {
    const usingItem = quizState.shopItems.cursors.find(item => item.state === 'using');
    if (!usingItem) {
        return { htmlCursor: 'pointer', elementsCursor: 'pointer' };
    }
    
    const cursorPrefix = usingItem.name.split(' ')[0].toLowerCase();
    const cursorImageUrlHtml = `images/def_kits/${cursorPrefix}1.png`;
    const cursorImageUrlElements = `images/def_kits/${cursorPrefix}2.png`;
    
    return {
        htmlCursor: `url("${cursorImageUrlHtml}"), auto`,
        elementsCursor: `url("${cursorImageUrlElements}"), auto`
    };
}

function unlockNewItemVisual(item) {
    // Create overlay to block clicks
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 998;
    `;
    document.body.appendChild(overlay);

    // Create container for the visualization
    const vizContainer = document.createElement('div');
    vizContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;
    document.body.appendChild(vizContainer);

    // Create light rays container
    const lightRaysContainer = document.createElement('div');
    lightRaysContainer.className = 'light-rays-container';
    lightRaysContainer.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1;
        margin-left: 0%;
        transform: translate(0, 0);
    `;
    vizContainer.appendChild(lightRaysContainer);

    // Create and animate light rays
    const rayCount = 12;
    const radius = 10;

    let rayLength;
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    if (mediaQuery.matches) {
        rayLength = 15; // Set for smaller screens
    } else {
        rayLength = 8; // Set for larger screens
    }

    for (let i = 0; i < rayCount; i++) {
        const ray = document.createElement('div');
        ray.className = 'light-ray';
                
        // Set CSS custom properties for relative units
        ray.style.setProperty('--radius', `${radius}vw`);
        ray.style.setProperty('--ray-length', `${rayLength}vw`);
        
        ray.style.position = 'absolute';
        ray.style.left = '50%';
        ray.style.top = '15%';
        ray.style.height = 'var(--ray-length)';
        ray.style.width = '0.4vw';
        ray.style.background = 'linear-gradient(to top, rgba(255, 255, 255, 0.8), transparent)';
        ray.style.borderRadius = '2px';
        ray.style.transformOrigin = '50% 50%';
        ray.style.animation = 'spin-ray 2s linear infinite';
        ray.style.animationDelay = `${(i / rayCount) * -2}s`;
        ray.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.5)';

        lightRaysContainer.appendChild(ray);
    }

    // Create item image display
    const itemDisplay = document.createElement('div');
    itemDisplay.style.cssText = `
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.8);
        padding: 30px;
        border-radius: 15px;
        border: 3px solid black;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.7);
    `;
    vizContainer.appendChild(itemDisplay);

    // Create the item image
    const itemImage = document.createElement('img');
    itemImage.src = item.image;
    itemImage.style.cssText = `
        width: 90%;
        height: 90%;
        object-fit: contain;
        margin-bottom: 15px;
    `;
    itemDisplay.appendChild(itemImage);

    // Create purchased text
    const purchasedText = document.createElement('div');
    purchasedText.style.cssText = `
        color: black;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    `;
    purchasedText.textContent = `Item unlocked!`;
    itemDisplay.appendChild(purchasedText);

    // Remove click blocking after 1 second and enable close on click
    setTimeout(() => {
        const cursors = getCurrentCursorUrls();
        
        overlay.style.cursor = cursors.elementsCursor;
        vizContainer.style.cursor = cursors.elementsCursor;
        
        overlay.onclick = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(vizContainer);
        };
        
        vizContainer.onclick = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(vizContainer);
        };
    }, 1000);
}

// Drop down menu
const dropdownBtn = document.getElementById('dropdownBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownItems = document.querySelectorAll('.dropdown-item');

dropdownBtn.addEventListener('click', () => {   // Toggle menu
    dropdownMenu.classList.toggle('show');
    dropdownBtn.classList.toggle('active');
});

dropdownItems.forEach(item => {                 // Select item
    item.addEventListener('click', () => {
        const selectedValue = item.textContent;
        dropdownBtn.textContent = selectedValue;
        
        dropdownMenu.classList.remove('show');
        dropdownBtn.classList.remove('active');
    });
});

document.addEventListener('click', (e) => {     // Close dropdown when clicking outside
    if (!e.target.closest('.dropdown')) {
        dropdownMenu.classList.remove('show');
        dropdownBtn.classList.remove('active');
    }
});

// CHECK IF SCRIPT IS LOADED IN CONSOLE
console.log("INDEX.JS LOADED");

// OVERLAYS LOGIC
function showOverlay(overlayId) {
    const o = document.getElementById(overlayId);
    o.style.display = 'flex';
    setTimeout(() => { o.classList.add('show'); }, 10);
}

function hideOverlay(overlayId) {
    const o = document.getElementById(overlayId);
    o.classList.remove('show');
    setTimeout(() => { o.style.display = 'none'; }, 300);
}

// Close overlay with X button
document.querySelectorAll('.custom-close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const overlayId = btn.getAttribute('data-overlay');
        hideOverlay(overlayId);
    });
});

// Close overlay by clicking outside of it
document.querySelectorAll('.custom-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) hideOverlay(this.id);
    });
});

// SHARE OVERLAY
function openCenteredWindow(url, width, height) {
    play('audio/click.mp3');
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    const left = (screenWidth - width) / 2;
    const top = (screenHeight - height) / 2;
    
    return window.open(url, '_blank', 
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`);
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    openCenteredWindow(shareUrl, 600, 600);
    hideShareOverlay();
}

function shareOnTwitter() {
    const text = encodeURIComponent('Check out this awesome website!');
    const url = encodeURIComponent(window.location.href);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    openCenteredWindow(shareUrl, 600, 600);
    hideShareOverlay();
}

function shareOnWhatsApp() {
    const text = encodeURIComponent('Check this website out: ' + window.location.href);
    const shareUrl = `https://wa.me/?text=${text}`;
    openCenteredWindow(shareUrl, 600, 600);
    hideShareOverlay();
}   

function showShareOverlay()    { showOverlay('shareOverlay'); play('audio/click.mp3');}
function hideShareOverlay()    { hideOverlay('shareOverlay'); }

// SHOP OVERLAY
const openShopBtn = document.getElementById('openShopBtn');
const closeShopBtn = document.getElementById('closeShopBtn');
const shopOverlay = document.getElementById('shopOverlay');
const itemsContainer = document.getElementById('itemsContainer');
const tabs = document.querySelectorAll('.tab');

// Current active tab
let currentTab = 'cursors';
renderItems(currentTab);

function showShopOverlay()     { showOverlay('shopOverlay'); play('audio/click.mp3');}
function hideShopOverlay()     { hideOverlay('shopOverlay'); }

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderItems(currentTab);
    });
});

let fireInterval = null;
let toxicInterval = null;
let fireEnabled = false;
let toxicEnabled = false;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function updateCursorStyle(usingItem) {
    const cursorPrefix = usingItem.name.split(' ')[0].toLowerCase();
    const cursorImageUrlHtml = `images/def_kits/${cursorPrefix}1.png`;
    const cursorImageUrlElements = `images/def_kits/${cursorPrefix}2.png`;

    const htmlElement = document.querySelector('html');
    htmlElement.style.cursor = `url("${cursorImageUrlHtml}"), auto`;

    const elementsToUpdate = document.querySelectorAll('a, area, button');
    elementsToUpdate.forEach(element => {
        element.style.cursor = `url("${cursorImageUrlElements}"), auto`;
    });

    if (fireInterval) {
        clearInterval(fireInterval);
        fireInterval = null;
    }
    if (cursorPrefix === "fire") {
        turnOnFireCursor();
    }
    if (toxicInterval) {
        clearInterval(toxicInterval);
        toxicInterval = null;
    }
    if (cursorPrefix === "toxic") {
        turnOnToxicCursor();
    } 
}

function turnOnFireCursor(){
    if (!fireEnabled) {
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        fireEnabled = true;
    }
    if (fireInterval) clearInterval(fireInterval);

    fireInterval = setInterval(() => {
        createFireParticleAt(mouseX, mouseY);
    }, 100);
}

function turnOnToxicCursor() {
    if (!toxicEnabled) {
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        toxicEnabled = true;
    }
    if (toxicInterval) clearInterval(toxicInterval);

    toxicInterval = setInterval(() => {
        createToxicParticleAt(mouseX, mouseY);
    }, 50);
}

function toggleFiveExtraSeconds() {
    if (quizState.levelTimeLimit == 61)
        quizState.levelTimeLimit = 66;
    else
        quizState.levelTimeLimit = 61;
    saveState(quizState);
}

function toggleExtraLife() {
    if (quizState.allowedIncorrectGuesses == 2)
        quizState.allowedIncorrectGuesses = 3;
    else
        quizState.allowedIncorrectGuesses = 2;
    saveState(quizState);
}

function toggleDoubleCredits() {
    if (quizState.creditsMultiplier == 10)
        quizState.creditsMultiplier = 20;
    else
        quizState.creditsMultiplier = 10;
    saveState(quizState);
}

function getTierBorderColor(tier) {
    switch(tier) {
        case 1: return 'whitesmoke';
        case 2: return 'blue';
        case 3: return 'fuchsia';
        case 4: return 'goldenrod';
        default: return 'whitesmoke';
    }
}

function showUnlockAnimation(unlockedItem) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Create viewport container
    const viewport = document.createElement('div');
    viewport.style.cssText = `
        width: min(90vw, 1000px);
        height: min(18vw, 200px);
        overflow: hidden;
        position: relative;
        border: 3px solid black;
        border-radius: 10px;
        background: white;
    `;

     // Add pointing indicators using symbols
    const topIndicator = document.createElement('div');
    topIndicator.style.cssText = `
        position: absolute;
        top: 0px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 20px;
        color: black;
        z-index: 1001;
        text-shadow: 0 0 5px black;
    `;
    topIndicator.textContent = '▼';

    const bottomIndicator = document.createElement('div');
    bottomIndicator.style.cssText = `
        position: absolute;
        bottom: 0px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 20px;
        color: black;
        z-index: 1001;
        text-shadow: 0 0 5px black;
    `;
    bottomIndicator.textContent = '▲';

    viewport.appendChild(topIndicator);
    viewport.appendChild(bottomIndicator);

    // Create scrolling container
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: row;
        transition-timing-function: cubic-bezier(0.1, 0.8, 0.2, 1);
    `;

    // Get all eligible items for the animation
    const allEligibleItems = [
        ...quizState.shopItems.cursors.filter(item => item.id !== 1),
        ...quizState.shopItems.gameplay.filter(item => item.id !== 93)
    ];

    const totalItems = 50;

    overlay.appendChild(viewport);
    document.body.appendChild(overlay);

    const itemSize = Math.floor(viewport.offsetWidth / 5);
    viewport.style.width = `${itemSize * 5}px`;
    
    for (let i = 0; i < totalItems; i++) {
        const itemElement = document.createElement('div');

        let currentItem;
        if (i === (totalItems - 2 - 1)) {
            currentItem = unlockedItem;
        } else {
            currentItem = allEligibleItems[Math.floor(Math.random() * allEligibleItems.length)];
        }
        
        const borderColor = getTierBorderColor(currentItem.tier);

        itemElement.style.cssText = `
            width: ${itemSize}px;
            height: ${itemSize}px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            flex-shrink: 0;
        `;
        
        // Create image wrapper for the circular border
        const imageWrapper = document.createElement('div');
        let wrapperStyle = `
            width: ${itemSize * 0.8}px;
            height: ${itemSize * 0.8}px;
            border: 2px solid ${borderColor};
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: ${itemSize * 0.1}px;
            box-sizing: border-box;
        `;
        
        // Add background color only for tier 4 items
        if (currentItem.tier === 4) {
            wrapperStyle += `background-color: #fff5ceff;`;
        }
        
        imageWrapper.style.cssText = wrapperStyle;
        
        const img = document.createElement('img');
        
        if (i === (totalItems - 2 - 1)) {
            img.src = unlockedItem.image;
            img.alt = unlockedItem.name;
        } else {
            img.src = currentItem.image;
            img.alt = currentItem.name;
        }
        
        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
        `;
        
        imageWrapper.appendChild(img);
        itemElement.appendChild(imageWrapper);
        scrollContainer.appendChild(itemElement);
    }

    const targetPosition = -(47 - 2) * itemSize;

    viewport.appendChild(scrollContainer);

    let skipFlag = false;
    // Start the animation
    requestAnimationFrame(() => {
        // Initial stop
        play('audio/unlocking_random_item.mp3');
        // Then slower scroll to final position
        setTimeout(() => {
            scrollContainer.style.transition = 'transform 5s cubic-bezier(0.1, 0.3, 0.2, 1)';
            scrollContainer.style.transform = `translateX(${targetPosition}px)`;
            
            setTimeout(() => {
                if (!skipFlag) {
                    unlockNewItemVisual(unlockedItem);
                    play('audio/item_unlock.mp3');
                    renderItems('gameplay');
                    document.body.removeChild(overlay);
                }
                else {
                    skipFlag = false;
                }
            }, 5500); // Wait for scroll to complete
        }, 1000); // Initial fast scroll duration
    });

    // Allow clicking outside to close (optional)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            stopAllAudios();
            unlockNewItemVisual(unlockedItem);
            play('audio/item_unlock.mp3');
            renderItems('gameplay');
            skipFlag = true;
            document.body.removeChild(overlay);
        }
    });
}

function unlockRandomItem() {
    const allEligibleItems = [
        ...quizState.shopItems.cursors.filter(item => item.id !== 1 && item.id !== 93),
        ...quizState.shopItems.gameplay.filter(item => item.id !== 1 && item.id !== 93)
    ];
    
    if (allEligibleItems.length === 0) {
        console.log("No eligible items found!");
        return null;
    }
    
    // Calculate weights based on inverse of price
    const weightedItems = allEligibleItems.map(item => {
        const weight = 1 / item.price;
        return { ...item, weight };
    });
    // Calculate total weight for normalization
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    // Generate random number between 0 and totalWeight
    let random = Math.random() * totalWeight;
    // Select item based on weighted probability
    let selectedItem = null;
    for (const item of weightedItems) {
        random -= item.weight;
        if (random <= 0) {
            selectedItem = item;
            break;
        }
    }
    
    // Fallback in case of floating point issues
    if (!selectedItem) {
        selectedItem = weightedItems[weightedItems.length - 1];
    }
    
    let foundItem = null;
    
    // Search in cursors
    for (let item of quizState.shopItems.cursors) {
        if (item.id === selectedItem.id) {
            item.state = "use";
            foundItem = item;
            break;
        }
    }
    // If not found in cursors, search in gameplay
    if (!foundItem) {
        for (let item of quizState.shopItems.gameplay) {
            if (item.id === selectedItem.id) {
                item.state = "use";
                foundItem = item;
                break;
            }
        }
    }
    
    if (foundItem) {
        showUnlockAnimation(foundItem);
        saveState(quizState);
    }
}

updateCursorStyle(quizState.shopItems.cursors.find(item => item.state === 'using'))

// Render items for the current tab
function renderItems(tab) {
    itemsContainer.innerHTML = '';
    quizState.shopItems[tab].forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        
        let buttonClass, buttonText;
        switch(item.state) {
            case 'buy':
                buttonClass = 'buy-btn';
                buttonText = `BUY ($${item.price})`;
                break;
            case 'use':
                buttonClass = 'use-btn';
                buttonText = 'USE';
                break;
            case 'using':
                buttonClass = 'using-btn';
                buttonText = 'USING';
                break;
        }
        
        const borderColor = getTierBorderColor(item.tier);

        itemCard.innerHTML = `
            <h3 class="item-title">${item.name}</h3>
            <img src="${item.image}" alt="${item.name}" class="item-image" style="border-color: ${borderColor}">
            <button class="item-button ${buttonClass}" 
                    data-id="${item.id}" 
                    data-state="${item.state}">
                ${buttonText}
            </button>
        `;
        
        itemsContainer.appendChild(itemCard);
    });

    document.querySelectorAll('.item-button').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.id);
            const currentState = this.dataset.state;
            const allItems = [...quizState.shopItems.cursors, ...quizState.shopItems.gameplay];
            const item = allItems.find(i => i.id === itemId);
            
            if (currentState === 'buy') {
                if (quizState.credits >= item.price) {
                    quizState.credits -= item.price;
                    renderCredits();

                    if (itemId === 93) {
                        unlockRandomItem();
                    }
                    else {
                        item.state = 'use';
                        this.dataset.state = 'use';
                        this.className = 'item-button use-btn';
                        this.textContent = 'USE';

                        unlockNewItemVisual(item);
                        play('audio/item_unlock.mp3');
                    }
                } else {
                    const notification = document.getElementById('insufficientFunds');
                    notification.style.display = 'block';
                    setTimeout(() => {
                        notification.style.display = 'none';
                    }, 2500);
                }
            } else if (currentState === 'use') {
                if (tab === 'cursors') {
                    // For cursors: Set this to USING and others to USE (do not change ones in BUY state)
                    quizState.shopItems.cursors.forEach(cursor => {
                        if (cursor.id === itemId) {
                            cursor.state = 'using';
                        } else if (cursor.state === 'using') {
                            cursor.state = 'use';
                        }
                    });
                    // Update all cursor buttons and the cursor itself
                    renderItems(tab)
                    updateCursorStyle(quizState.shopItems.cursors.find(item => item.state === 'using'))
                } else if (itemId != 93) {
                    // For gameplay: Toggle this item between use/using unless gambling
                    item.state = 'using';
                    this.dataset.state = 'using';
                    this.className = 'item-button using-btn';
                    this.textContent = 'USING';
                    if (itemId === 90) {
                        toggleFiveExtraSeconds();
                    } 
                    else if (itemId === 91) {
                        toggleExtraLife();
                    }
                    else if (itemId === 92) {
                        toggleDoubleCredits();
                    }
                }
            } else if (currentState === 'using') {
                if (tab === 'gameplay') {
                    item.state = 'use';
                    this.dataset.state = 'use';
                    this.className = 'item-button use-btn';
                    this.textContent = `USE`;
                    if (itemId === 90) {
                        toggleFiveExtraSeconds();
                    } 
                    else if (itemId === 91) {
                        toggleExtraLife();
                    }
                    else if (itemId === 92) {
                        toggleDoubleCredits();
                    }
                }
            }
            saveState(quizState);
        });
    });
}

// ARE YOU SURE YOU WANT TO QUIT OVERLAY
function showQuitOverlay()     { showOverlay('quitOverlay'); play('audio/click.mp3');}
function hideQuitOverlay()     { hideOverlay('quitOverlay');}

// YOU WIN OVERLAY
function showWinOverlay()     { showOverlay('winOverlay'); }
function hideWinOverlay()     { hideOverlay('winOverlay'); }

// ARE YOU SURE YOU WANT TO RESET ALL PROGRESS OVERLAY
function showResetOverlay()     { showOverlay('resetOverlay'); play('audio/click.mp3');}
function hideResetOverlay()     { hideOverlay('resetOverlay'); play('audio/click.mp3');}


// Rotation checker
function initRotationChecker() {
    const notification = document.querySelector('.turnDeviceNotification');

    function checkOrientation() {
        // Method 1: Using window.orientation (older but widely supported)
        if (typeof window.orientation !== 'undefined') {
            const orientation = window.orientation;
            
            if (orientation === 90 || orientation === -90) {
                notification.style.display = 'none';
            } else {
                notification.style.display = 'block';
            }
        }
        // Method 2: Using Screen Orientation API (modern)
        else if (window.screen && window.screen.orientation) {
            const orientation = window.screen.orientation.type;
            
            if (orientation.includes('landscape')) {
                notification.style.display = 'none';
            } else {
                notification.style.display = 'block';
            }
        }
        // Method 3: Using window dimensions
        else {
            if (window.innerWidth > window.innerHeight) {
                notification.style.display = 'none';
            } else {
                notification.style.display = 'block';
            }
        }
    }

    // Initial check
    checkOrientation();

    // Event listeners for orientation changes
    window.addEventListener('orientationchange', checkOrientation);
    
    // Fallback for devices that don't support orientationchange
    window.addEventListener('resize', function() {
        // Throttle resize events for better performance
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(checkOrientation, 1000);
    });

    // Also listen for the modern screen orientation change
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', checkOrientation);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotationChecker);
} else {
    initRotationChecker();
}

// Add dev secret for rapid clicks on quiz title
let clickCount = 0;
let clickTimer = null;

document.getElementById('logoImg').addEventListener('click', function() {
    clickCount++;
    
    if (clickTimer) {
        clearTimeout(clickTimer);
    }
    
    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 3000);
    
    if (clickCount >= 5) {
        play('audio/item_unlock.mp3');
        quizState.credits += 100000;
        saveState(quizState);
        renderCredits();
        
        clickCount = 0;
        
        const notification = document.createElement('div');
        notification.textContent = '💰 Dev Secret: +100,000 credits! 💰';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: gold;
            color: black;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(255,215,0,0.8);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
});