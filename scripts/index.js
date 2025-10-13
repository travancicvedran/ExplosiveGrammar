// Default values of all important variables
const defaultState = {
    allowedIncorrectGuesses: 2,     // Number of lives (hearts)
    credits: 10000,                     // In-game point system
    levelTimeLimit: 61,             // Time limit for a level (shown)
    // Progress tracker
    levelsUnlocked: { Tenses: 1, Articles: 2, Prepositions: 3, Conditionals: 5, Pronouns: 6 },
    shopItems: {
        cursors: [
        { id: 1, name: "Red cursor", image: "images/def_kits/red1.png", price: 0, state: "using" },
        { id: 2, name: "Brown cursor", image: "images/def_kits/brown1.png", price: 100, state: "buy" },
        { id: 3, name: "Orange cursor", image: "images/def_kits/orange1.png", price: 200, state: "buy" },
        { id: 4, name: "Yellow cursor", image: "images/def_kits/yellow1.png", price: 300, state: "buy" },
        { id: 5, name: "Green cursor", image: "images/def_kits/green1.png", price: 400, state: "buy" },
        { id: 6, name: "Pink cursor", image: "images/def_kits/pink1.png", price: 500, state: "buy" },
        { id: 7, name: "Purple cursor", image: "images/def_kits/purple1.png", price: 600, state: "buy" },
        { id: 8, name: "Blue cursor", image: "images/def_kits/blue1.png", price: 700, state: "buy" },
        { id: 9, name: "Black cursor", image: "images/def_kits/black1.png", price: 1000, state: "buy" },
        { id: 10, name: "Rainbow cursor", image: "images/def_kits/rainbow1.png", price: 5000, state: "buy" },
        { id: 11, name: "Fire cursor", image: "images/def_kits/fire1.png", price: 10000, state: "buy" },
        ],
        gameplay: [
        { id: 12, name: "Extra 5 seconds", image: "images/ui_elements/plus_five.png", price: 5000, state: "buy" },
        { id: 13, name: "Extra life", image: "images/ui_elements/plus_heart.png", price: 10000, state: "buy" },
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

// Function for playing sound
function play(sound) {
    var audio = new Audio(sound);
    audio.play();
}

// Logic behind switching screens without refreshing the page
function showScreen(screenId) {
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

function submitAnswer(selectedOption, buttonElement) {
    const questionData = shuffledQuestions[currentQuestionIndex];

    document.querySelectorAll('#submitAnswerButtons button').forEach(btn=>btn.disabled=true);

    if (selectedOption === questionData.answer) {
        buttonElement.classList.add('correct');
        play('audio/correct_answer.mp3');
        quizState.credits += questionTimeLeft * 10;
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

// Light rays animation
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.light-rays-container');
    const rayCount = 12;
    const radius = 100;
    const rayLength = 80;

    for (let i = 0; i < rayCount; i++) {
        const ray = document.createElement('div');
        ray.className = 'light-ray';

        ray.style.setProperty('--radius', `${radius}px`);

        const angle = (360 / rayCount) * i;

        ray.style.position = 'absolute';
        ray.style.left = '50%';
        ray.style.top = '50%';
        ray.style.height = `${rayLength}px`;
        ray.style.width = '4px';
        ray.style.transformOrigin = '50% 100%';
        ray.style.transform = `rotate(${angle}deg) translateY(var(--radius))`;
        ray.style.animationDelay = `${(i / rayCount) * -8}s`;

        container.appendChild(ray);
    }
});

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

function showShareOverlay()    { showOverlay('shareOverlay'); }
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

function showShopOverlay()     { showOverlay('shopOverlay'); }
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
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseListenerSet = false;

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
}

function turnOnFireCursor(){
    if (!mouseListenerSet) {
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        mouseListenerSet = true;
    }
    if (fireInterval) clearInterval(fireInterval);

    fireInterval = setInterval(() => {
        createFireParticleAt(mouseX, mouseY);
    }, 100);
}

function toggleFiveExtraSeconds() {
    if (quizState.levelTimeLimit == 60)
        quizState.levelTimeLimit = 65;
    else
        quizState.levelTimeLimit = 60;
    saveState(quizState);
}

function toggleExtraLife() {
    if (quizState.allowedIncorrectGuesses == 2)
        quizState.allowedIncorrectGuesses = 3;
    else
        quizState.allowedIncorrectGuesses = 2;
    saveState(quizState);
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
        
        itemCard.innerHTML = `
            <h3 class="item-title">${item.name}</h3>
            <img src="${item.image}" alt="${item.name}" class="item-image">
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
                    
                    item.state = 'use';
                    this.dataset.state = 'use';
                    this.className = 'item-button use-btn';
                    this.textContent = 'USE';
                    
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
                } else {
                    // For gameplay: Toggle this item between use/using
                    item.state = 'using';
                    this.dataset.state = 'using';
                    this.className = 'item-button using-btn';
                    this.textContent = 'USING';
                    if (itemId === 12) {
                        toggleFiveExtraSeconds();
                    } 
                    else if (itemId === 13) {
                        toggleExtraLife();
                    }
                }
            } else if (currentState === 'using') {
                if (tab === 'gameplay') {
                    item.state = 'use';
                    this.dataset.state = 'use';
                    this.className = 'item-button use-btn';
                    this.textContent = `USE`;
                    if (itemId === 12) {
                        toggleFiveExtraSeconds();
                    } 
                    else if (itemId === 13) {
                        toggleExtraLife();
                    }
                }
            }
            saveState(quizState);
        });
    });
}

// ARE YOU SURE YOU WANT TO QUIT OVERLAY
function showQuitOverlay()     { showOverlay('quitOverlay'); }
function hideQuitOverlay()     { hideOverlay('quitOverlay'); }

// YOU WIN OVERLAY
function showWinOverlay()     { showOverlay('winOverlay'); }
function hideWinOverlay()     { hideOverlay('winOverlay'); }

// ARE YOU SURE YOU WANT TO RESET ALL PROGRESS OVERLAY
function showResetOverlay()     { showOverlay('resetOverlay'); }
function hideResetOverlay()     { hideOverlay('resetOverlay'); }