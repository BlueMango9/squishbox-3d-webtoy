/**
 * ToyState & Interaction Orchestrator
 * Controls: Satisfy-O-Meter, Bubble Matrix, Sassy Quantum Button,
 * Easter Eggs, Achievements & LocalStorage persistence.
 */

class ToyState {
  constructor() {
    this.score = parseInt(localStorage.getItem('squishbox_score') || '0', 10);
    this.satisfaction = 30; // 0 - 100
    this.combo = 1;
    this.lastActionTime = Date.now();
    this.comboTimer = null;
    this.unlockedAchievements = JSON.parse(localStorage.getItem('squishbox_achievements') || '[]');

    // Bubble Wrap state
    this.bubblesPopped = parseInt(localStorage.getItem('squishbox_bubbles_popped') || '0', 10);
    this.totalBubbles = 48;

    // Mouse & Cheese state
    this.cheesesCaught = parseInt(localStorage.getItem('squishbox_cheese_count') || '0', 10);
    this.catPos = { x: 250, y: 250 };
    this.catTarget = { x: 250, y: 250 };
    this.cheesePos = { x: 120, y: 120 };
    this.cheeseVel = { vx: 5, vy: 4 };
    this.cheeseSpeed = 9.5;
    this.cheeseDifficulty = '3';
    this.dashStamina = 100;
    this.isDashing = false;
    this.isCheeseCaught = false;
    this.cheeseQuotes = [
      "Too fast for you!",
      "Can't catch this!",
      "Zoom zoom!",
      "Squeak away!",
      "Slippery as cheddar!",
      "Not your snack today!",
      "Nice try, little paws!",
      "Catch me if you can!"
    ];

    // Easter Egg sequences & Anti-Gravity
    this.recentKeys = [];
    this.isDiscoActive = false;
    this.isMatrixActive = false;
    this.isZeroGActive = false;
    this.isLightningActive = false;
    this.lightningListenerAttached = false;

    this.init();
  }

  init() {
    this.updateUI();
    this.initThemes();
    this.initBubbleMatrix();
    this.initCatGame();
    this.initEasterEggListeners();
    this.renderAchievementsList();

    // Natural satisfaction decay loop
    setInterval(() => {
      if (Date.now() - this.lastActionTime > 3000 && this.satisfaction > 20) {
        this.satisfaction = Math.max(20, this.satisfaction - 1);
        this.updateSatisfactionUI();
      }
    }, 800);
  }

  addSatisfaction(amount, reason = '') {
    this.lastActionTime = Date.now();
    this.combo = Math.min(10, this.combo + 0.5);
    const addedScore = Math.round(amount * this.combo);
    this.score += addedScore;
    this.satisfaction = Math.min(100, this.satisfaction + amount * 0.8);

    localStorage.setItem('squishbox_score', this.score);
    this.updateUI();

    // Floating score popup
    this.spawnScoreFloat(addedScore, reason);

    // Reset combo after 2.5 seconds of inactivity
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.combo = 1;
      this.updateUI();
    }, 2500);

    // Overdrive check
    if (this.satisfaction >= 100) {
      this.unlockAchievement('overdrive', '⚡ Max Overdrive!', 'Filled the Satisfy-O-Meter to 100%!');
    }
  }

  spawnScoreFloat(score, text) {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.innerHTML = `+${score} <span style="font-size:0.7em; opacity:0.8;">${text}</span>`;
    el.style.left = `${Math.min(window.innerWidth - 180, Math.max(40, window.innerWidth / 2 + (Math.random() - 0.5) * 200))}px`;
    el.style.top = `${Math.min(window.innerHeight - 150, Math.max(100, window.innerHeight / 2 + (Math.random() - 0.5) * 150))}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  updateUI() {
    const scoreVal = document.getElementById('scoreValue');
    const comboVal = document.getElementById('comboValue');
    if (scoreVal) scoreVal.innerText = this.score.toLocaleString();
    if (comboVal) {
      comboVal.innerText = `${this.combo.toFixed(1)}x`;
      if (this.combo > 2) comboVal.classList.add('frenzy');
      else comboVal.classList.remove('frenzy');
    }
    this.updateSatisfactionUI();
  }

  updateSatisfactionUI() {
    const fill = document.getElementById('satisfactionFill');
    const label = document.getElementById('satisfactionLabel');
    if (fill) fill.style.width = `${this.satisfaction}%`;
    if (label) label.innerText = `${Math.round(this.satisfaction)}%`;
  }

  // --- THEMES & DARK MODE ---
  initThemes() {
    const savedTheme = localStorage.getItem('squishbox_theme') || 'dark-cyber';
    this.setTheme(savedTheme);

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = savedTheme;
      themeSelect.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
        themeSelect.blur();
      });
    }

    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
      const isMuted = window.soundEngine && window.soundEngine.muted;
      audioToggle.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound FX';
      audioToggle.addEventListener('click', () => {
        const muted = window.soundEngine.toggleMute();
        audioToggle.innerHTML = muted ? '🔇 Muted' : '🔊 Sound FX';
        if (!muted) window.soundEngine.playPop(1);
      });
    }
  }

  setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('squishbox_theme', themeName);

    // Sync 3D Jelly colors
    if (window.jellyInstance) {
      if (themeName === 'dark-cyber') window.jellyInstance.setThemeColor(0x8a2be2, 0x220544);
      else if (themeName === 'retro-synth') window.jellyInstance.setThemeColor(0xff007f, 0x330033);
      else if (themeName === 'midnight-void') window.jellyInstance.setThemeColor(0x00f3ff, 0x001133);
      else if (themeName === 'bubblegum') window.jellyInstance.setThemeColor(0xff69b4, 0x441122);
    }
  }

  // --- BUBBLE WRAP MATRIX ---
  initBubbleMatrix() {
    const grid = document.getElementById('bubbleGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < this.totalBubbles; i++) {
      const bubble = document.createElement('button');
      bubble.className = 'bubble-cell';
      bubble.setAttribute('aria-label', `Bubble ${i + 1}`);
      bubble.dataset.index = i;

      bubble.addEventListener('pointerdown', () => this.popBubble(bubble));
      grid.appendChild(bubble);
    }

    const resetBtn = document.getElementById('reinflateBubblesBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reinflateBubbles());
    }

    const popAllBtn = document.getElementById('popAllBubblesBtn');
    if (popAllBtn) {
      popAllBtn.addEventListener('click', () => this.popAllBubbles());
    }
  }

  popBubble(bubble) {
    if (bubble.classList.contains('popped')) return;

    bubble.classList.add('popped');
    this.bubblesPopped++;
    localStorage.setItem('squishbox_bubbles_popped', this.bubblesPopped);

    // Micro spark animation inside bubble
    const spark = document.createElement('span');
    spark.className = 'bubble-spark';
    bubble.appendChild(spark);
    setTimeout(() => spark.remove(), 400);

    if (window.soundEngine) window.soundEngine.playPop(1 + (this.bubblesPopped % 8) * 0.1);
    this.addSatisfaction(3, 'Popped Bubble!');

    if (this.bubblesPopped >= 50) {
      this.unlockAchievement('pop_prodigy', '🫧 Pop Prodigy', 'Popped 50 bubbles in total!');
    }

    // Auto-reinflate if all bubbles popped
    const unpopped = document.querySelectorAll('.bubble-cell:not(.popped)');
    if (unpopped.length === 0) {
      setTimeout(() => this.reinflateBubbles(true), 600);
    }
  }

  reinflateBubbles(auto = false) {
    const bubbles = document.querySelectorAll('.bubble-cell');
    bubbles.forEach((b, idx) => {
      setTimeout(() => {
        b.classList.remove('popped');
      }, idx * 12);
    });

    if (window.soundEngine) window.soundEngine.playWhoosh();
    if (!auto) this.addSatisfaction(5, 'Reinflated Bubbles!');
  }

  popAllBubbles() {
    const bubbles = document.querySelectorAll('.bubble-cell:not(.popped)');
    bubbles.forEach((b, idx) => {
      setTimeout(() => {
        this.popBubble(b);
      }, idx * 25);
    });
  }

  // --- TAB 4: CAT & FLYING CHEESE GAME ---
  // --- TAB 4: MOUSE & FLYING CHEESE GAME ---
  initCatGame() {
    const arena = document.getElementById('catCheeseArena');
    const catEl = document.getElementById('hunterCat');
    const cheeseEl = document.getElementById('flyingCheese');
    if (!arena || !catEl || !cheeseEl) return;

    // Direct 1:1 cursor sync (ZERO LATENCY)
    arena.addEventListener('pointermove', (e) => {
      const rect = arena.getBoundingClientRect();
      const x = Math.max(35, Math.min(rect.width - 35, e.clientX - rect.left));
      const y = Math.max(35, Math.min(rect.height - 35, e.clientY - rect.top));
      this.catTarget.x = x;
      this.catTarget.y = y;
      this.catPos.x = x;
      this.catPos.y = y;
      catEl.style.left = `${x}px`;
      catEl.style.top = `${y}px`;
    });

    // Touch / pointer enter immediately snaps mouse to cursor
    arena.addEventListener('pointerdown', (e) => {
      const rect = arena.getBoundingClientRect();
      const x = Math.max(35, Math.min(rect.width - 35, e.clientX - rect.left));
      const y = Math.max(35, Math.min(rect.height - 35, e.clientY - rect.top));
      this.catTarget.x = x;
      this.catTarget.y = y;
      this.catPos.x = x;
      this.catPos.y = y;
      catEl.style.left = `${x}px`;
      catEl.style.top = `${y}px`;
      this.pounceDashCat();
    });

    // Wire speed selector (Levels 1 to 5)
    const diffSelect = document.getElementById('cheeseDiffSelect');
    if (diffSelect) {
      this.setCheeseDifficulty(diffSelect.value);
      diffSelect.addEventListener('change', (e) => {
        this.setCheeseDifficulty(e.target.value);
        e.target.blur();
      });
    }

    // Wire action buttons
    const dashBtn = document.getElementById('dashCatBtn');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => this.pounceDashCat());
    }

    const resetBtn = document.getElementById('resetCatGameBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetCatGame());
    }

    // Update score badge
    const badge = document.getElementById('cheeseScoreBadge');
    if (badge) badge.innerText = `🧀 Munched: ${this.cheesesCaught}`;

    // Start 60fps Mouse & Cheese physics loop
    this.catGameLoop = this.catGameLoop.bind(this);
    requestAnimationFrame(this.catGameLoop);
  }

  setCheeseDifficulty(level) {
    this.cheeseDifficulty = String(level);
    const speeds = {
      '1': 4.5,
      '2': 7.0,
      '3': 9.5,
      '4': 12.5,
      '5': 16.5
    };
    this.cheeseSpeed = speeds[this.cheeseDifficulty] || 9.5;
    const curSpeed = Math.hypot(this.cheeseVel.vx, this.cheeseVel.vy) || 1;
    this.cheeseVel.vx = (this.cheeseVel.vx / curSpeed) * this.cheeseSpeed;
    this.cheeseVel.vy = (this.cheeseVel.vy / curSpeed) * this.cheeseSpeed;
  }

  pounceDashCat() {
    if (this.dashStamina < 25 || this.isDashing) return;

    this.isDashing = true;
    this.dashStamina = Math.max(0, this.dashStamina - 35);
    const catEl = document.getElementById('hunterCat');
    if (catEl) catEl.classList.add('pouncing');

    if (window.soundEngine) window.soundEngine.playWhoosh();

    // Instant dash burst towards cheese
    const toCheeseX = this.cheesePos.x - this.catPos.x;
    const toCheeseY = this.cheesePos.y - this.catPos.y;
    const dist = Math.hypot(toCheeseX, toCheeseY) || 1;
    const dashDist = Math.min(80, dist * 0.5);
    this.catPos.x += (toCheeseX / dist) * dashDist;
    this.catPos.y += (toCheeseY / dist) * dashDist;
    if (catEl) {
      catEl.style.left = `${this.catPos.x}px`;
      catEl.style.top = `${this.catPos.y}px`;
    }

    setTimeout(() => {
      this.isDashing = false;
      if (catEl) catEl.classList.remove('pouncing');
    }, 240);
  }

  resetCatGame() {
    const arena = document.getElementById('catCheeseArena');
    if (!arena) return;
    const rect = arena.getBoundingClientRect();

    this.isCheeseCaught = false;
    this.cheesePos.x = Math.random() * (rect.width - 100) + 50;
    this.cheesePos.y = Math.random() * (rect.height - 100) + 50;
    const angle = Math.random() * Math.PI * 2;
    this.cheeseVel.vx = Math.cos(angle) * this.cheeseSpeed;
    this.cheeseVel.vy = Math.sin(angle) * this.cheeseSpeed;

    const catAvatar = document.getElementById('catAvatar');
    if (catAvatar) catAvatar.innerText = '🐭';

    const cheeseBubble = document.getElementById('cheeseDialog');
    if (cheeseBubble) {
      cheeseBubble.innerText = "Catch me if you can!";
      cheeseBubble.classList.add('show');
      setTimeout(() => cheeseBubble.classList.remove('show'), 1600);
    }
    if (window.soundEngine) window.soundEngine.playBoing();
  }

  catchCheese() {
    if (this.isCheeseCaught) return;
    this.isCheeseCaught = true;
    this.cheesesCaught++;
    localStorage.setItem('squishbox_cheese_count', this.cheesesCaught);

    const catAvatar = document.getElementById('catAvatar');
    if (catAvatar) catAvatar.innerText = '🐹';

    const cheeseBubble = document.getElementById('cheeseDialog');
    if (cheeseBubble) {
      cheeseBubble.innerText = "🎉 SQUEAK! DELICIOUS CHEESE!";
      cheeseBubble.classList.add('show');
    }

    const badge = document.getElementById('cheeseScoreBadge');
    if (badge) badge.innerText = `🧀 Munched: ${this.cheesesCaught}`;

    // Celebration sound: chomp & bubble chime
    if (window.soundEngine) {
      window.soundEngine.playChomp();
      window.soundEngine.playPop(1.5);
    }
    this.addSatisfaction(40, 'MUNCH! Caught the Supersonic Cheese!');
    this.unlockAchievement('caught_sassy', '🎯 Master Cheese Hunter', 'Captured the supersonic flying cheese!');

    // Dramatic confetti fiesta
    this.triggerConfettiFiesta();

    // Auto-respawn after brief feast
    setTimeout(() => {
      this.resetCatGame();
    }, 1200);
  }

  catGameLoop() {
    requestAnimationFrame(this.catGameLoop);
    const arena = document.getElementById('catCheeseArena');
    const catEl = document.getElementById('hunterCat');
    const cheeseEl = document.getElementById('flyingCheese');
    if (!arena || !catEl || !cheeseEl) return;

    const rect = arena.getBoundingClientRect();
    const timeScale = window.timeScale || 1.0;

    // Stamina recovery
    if (this.isDashing) {
      this.dashStamina = Math.max(0, this.dashStamina - 2.5);
    } else if (this.dashStamina < 100) {
      this.dashStamina = Math.min(100, this.dashStamina + 0.45);
    }
    const staminaBar = document.getElementById('dashStaminaBar');
    if (staminaBar) staminaBar.style.width = `${this.dashStamina}%`;

    // Rotate mouse slightly towards cheese
    const toCheeseX = this.cheesePos.x - this.catPos.x;
    const toCheeseY = this.cheesePos.y - this.catPos.y;
    const catAngle = Math.atan2(toCheeseY, toCheeseX);
    catEl.style.left = `${this.catPos.x}px`;
    catEl.style.top = `${this.catPos.y}px`;
    catEl.style.transform = `rotate(${catAngle * 0.12}rad)`;

    // 2. Flying Cheese Dynamics
    if (!this.isCheeseCaught) {
      // Wall collisions & bounce
      const margin = 35;
      if (this.cheesePos.x < margin) {
        this.cheesePos.x = margin;
        this.cheeseVel.vx = Math.abs(this.cheeseVel.vx);
      } else if (this.cheesePos.x > rect.width - margin) {
        this.cheesePos.x = rect.width - margin;
        this.cheeseVel.vx = -Math.abs(this.cheeseVel.vx);
      }

      if (this.cheesePos.y < margin) {
        this.cheesePos.y = margin;
        this.cheeseVel.vy = Math.abs(this.cheeseVel.vy);
      } else if (this.cheesePos.y > rect.height - margin) {
        this.cheesePos.y = rect.height - margin;
        this.cheeseVel.vy = -Math.abs(this.cheeseVel.vy);
      }

      // Proximity Evasion (Panic Flight!)
      const distToCat = Math.hypot(toCheeseX, toCheeseY);
      if (distToCat < 160) {
        // Boost away from mouse
        const panicForce = 0.55 * (1 - distToCat / 160);
        this.cheeseVel.vx += (toCheeseX / (distToCat || 1)) * panicForce * this.cheeseSpeed;
        this.cheeseVel.vy += (toCheeseY / (distToCat || 1)) * panicForce * this.cheeseSpeed;

        // Random evasive quotes
        const cheeseBubble = document.getElementById('cheeseDialog');
        if (cheeseBubble && !cheeseBubble.classList.contains('show') && Math.random() < 0.08) {
          cheeseBubble.innerText = this.cheeseQuotes[Math.floor(Math.random() * this.cheeseQuotes.length)];
          cheeseBubble.classList.add('show');
          setTimeout(() => cheeseBubble.classList.remove('show'), 900);
        }
      }

      // Clamp max velocity to speed preset
      const curSpeed = Math.hypot(this.cheeseVel.vx, this.cheeseVel.vy) || 1;
      const targetSpeed = this.cheeseSpeed * (this.isZeroGActive ? 0.7 : 1);
      this.cheeseVel.vx = (this.cheeseVel.vx / curSpeed) * targetSpeed;
      this.cheeseVel.vy = (this.cheeseVel.vy / curSpeed) * targetSpeed;

      this.cheesePos.x += this.cheeseVel.vx * timeScale;
      this.cheesePos.y += this.cheeseVel.vy * timeScale;

      cheeseEl.style.left = `${this.cheesePos.x}px`;
      cheeseEl.style.top = `${this.cheesePos.y}px`;

      // Catch detection
      if (distToCat < (this.isDashing ? 60 : 48)) {
        this.catchCheese();
      }
    }
  }

  triggerConfettiFiesta() {
    for (let i = 0; i < 60; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti-piece';
      conf.style.left = `${Math.random() * 100}vw`;
      conf.style.backgroundColor = ['#ff007f', '#00f3ff', '#ffe600', '#00ff88', '#bf00ff'][Math.floor(Math.random() * 5)];
      conf.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      conf.style.animationDelay = `${Math.random() * 0.5}s`;
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 4000);
    }
  }

  // --- ANTI-GRAVITY (COSMIC ZERO-G) ---
  triggerAntiGravity() {
    this.isZeroGActive = !this.isZeroGActive;
    
    // 1. Invert Liquid Slime physics
    if (window.sandboxInstance) {
      window.sandboxInstance.flipGravity();
    }

    // 2. Invert 3D Jelly buoyant spring
    if (window.jellyInstance) {
      window.jellyInstance.toggleZeroGravity(this.isZeroGActive);
    }

    // 3. Play sci-fi Zero-G audio glide
    if (window.soundEngine) {
      window.soundEngine.playZeroG(this.isZeroGActive);
    }

    // 4. Prominent notification toast & achievement
    const statusMsg = this.isZeroGActive ? '🌌 ZERO-G ACTIVATED (Cosmic Anti-Gravity!)' : '⬇️ NORMAL GRAVITY RESTORED';
    this.showNotification(statusMsg);
    this.unlockAchievement('gravity_invert', '🌌 Physics Violator', 'Inverted gravity in the cosmos!');
  }

  // --- LIGHTNING BOLT CURSOR TRAIL ---
  toggleLightningTrail() {
    this.isLightningActive = !this.isLightningActive;

    if (this.isLightningActive) {
      if (window.soundEngine) {
        window.soundEngine.playZap();
        setTimeout(() => window.soundEngine.playSecretChime(), 120);
      }
      this.showNotification('⚡ HIGH VOLTAGE: Crackling Lightning Bolt Trail Activated!');
      this.unlockAchievement('lightning_storm', '⚡ Lightning Storm', 'Awakened high-voltage lightning bolt cursor trail!');
      if (!this.lightningListenerAttached) {
        this.lightningListenerAttached = true;
        let lastSpawn = 0;
        window.addEventListener('pointermove', (e) => {
          if (!this.isLightningActive) return;
          const now = Date.now();
          if (now - lastSpawn > 32) {
            lastSpawn = now;
            this.spawnLightningParticle(e.clientX, e.clientY);
          }
        });
      }
    } else {
      this.showNotification('⚡ Lightning Trail Discharged');
    }
  }

  // Alias for backward compatibility
  toggleRainbowStardust() {
    this.toggleLightningTrail();
  }

  spawnLightningParticle(x, y) {
    const bolt = document.createElement('div');
    bolt.className = 'lightning-bolt-trail';
    const bolts = ['⚡', '🌩️', '⚡', '⚡'];
    bolt.innerText = bolts[Math.floor(Math.random() * bolts.length)];
    const rot = (Math.random() - 0.5) * 60;
    bolt.style.setProperty('--rot', `${rot}deg`);
    bolt.style.left = `${x + (Math.random() - 0.5) * 20}px`;
    bolt.style.top = `${y + (Math.random() - 0.5) * 20}px`;
    document.body.appendChild(bolt);
    if (Math.random() < 0.15 && window.soundEngine) {
      window.soundEngine.playZap();
    }
    setTimeout(() => bolt.remove(), 550);
  }

  // --- EASTER EGGS ---
  initEasterEggListeners() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept when focused on an input/select
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // ESC Key: Exit Matrix, Disco, and Close Modals
      if (e.key === 'Escape') {
        if (this.isMatrixActive) this.toggleMatrixGlitch(false);
        if (this.isDiscoActive) this.toggleDiscoRave(false);
        const modal = document.getElementById('achievementsModal');
        if (modal) modal.classList.remove('open');
        return;
      }

      // Spacebar: Pounce Dash in Cat & Cheese game!
      if (e.code === 'Space') {
        e.preventDefault();
        this.pounceDashCat();
        return;
      }

      // Normalize key
      let key = e.key;
      if (key === 'Up') key = 'ArrowUp';
      if (key === 'Down') key = 'ArrowDown';
      if (key === 'Left') key = 'ArrowLeft';
      if (key === 'Right') key = 'ArrowRight';
      key = key.toLowerCase();

      // Audio feedback on arrow keys
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (window.soundEngine) window.soundEngine.playStepTick(this.recentKeys.length);
      }

      // Maintain rolling history of last 5 keys
      this.recentKeys.push(e.key.startsWith('Arrow') ? e.key : key);
      if (this.recentKeys.length > 5) this.recentKeys.shift();

      const last4 = this.recentKeys.slice(-4).join(',');
      const last5 = this.recentKeys.slice(-5).join('');

      // Check 4-step Disco sequences:
      // 1. Up, Down, Up, Down
      // 2. Up, Right, Down, Left (360 spin)
      // 3. Typing "disco"
      const danceStep1 = ['ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown'].join(',');
      const danceStep2 = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].join(',');
      if (last4 === danceStep1 || last4 === danceStep2 || last5 === 'disco') {
        this.toggleDiscoRave(true);
        this.recentKeys = [];
      }

      // 'd' key: Neon Disco Rave
      if (key === 'd') {
        this.toggleDiscoRave();
      }

      // 'g' key: Anti-Gravity
      if (key === 'g') {
        this.triggerAntiGravity();
      }

      // 'l' or 'r' key: Lightning Bolt Trail
      if (key === 'l' || key === 'r') {
        this.toggleLightningTrail();
      }

      // 'm' key: Matrix Glitch Mode
      if (key === 'm') {
        this.toggleMatrixGlitch();
      }
    });

    // Logo easter egg trigger (Triple-click)
    const logo = document.getElementById('toyLogo');
    let logoClicks = 0;
    if (logo) {
      logo.addEventListener('click', () => {
        logoClicks++;
        if (logoClicks === 3) {
          this.toggleMatrixGlitch();
          logoClicks = 0;
        }
      });
    }

    // NOTE: Matrix screen does NOT close on tap/click — it strictly exits only when pressing the ESC key.

    // Disco mode exit button
    const discoExit = document.getElementById('exitDiscoBtn');
    if (discoExit) {
      discoExit.addEventListener('click', () => this.toggleDiscoRave(false));
    }
  }

  toggleDiscoRave(forceState) {
    this.isDiscoActive = forceState !== undefined ? forceState : !this.isDiscoActive;
    const overlay = document.getElementById('discoOverlay');

    if (this.isDiscoActive) {
      if (overlay) overlay.classList.add('active');
      document.body.classList.add('rave-mode');
      if (window.soundEngine) {
        window.soundEngine.playSecretChime();
        window.soundEngine.startRaveBeat();
      }
      if (window.jellyInstance) window.jellyInstance.setDiscoMode(true);
      this.unlockAchievement('disco_king', '🕺 Disco Legend', 'Entered the legendary 4-step Disco Rave!');
      this.showNotification('🕺 NEON DISCO RAVE ACTIVATED! 🪩 (ESC to Exit)');
    } else {
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('rave-mode');
      if (window.soundEngine) window.soundEngine.stopRaveBeat();
      if (window.jellyInstance) window.jellyInstance.setDiscoMode(false);
    }
  }

  toggleMatrixGlitch(forceState) {
    this.isMatrixActive = forceState !== undefined ? forceState : !this.isMatrixActive;
    const matrixContainer = document.getElementById('matrixContainer');
    const matrixCanvas = document.getElementById('matrixCanvas');
    if (!matrixContainer || !matrixCanvas) return;

    if (this.isMatrixActive) {
      matrixContainer.style.display = 'block';
      this.startMatrixRain(matrixCanvas);
      if (window.soundEngine) window.soundEngine.playSecretChime();
      this.unlockAchievement('matrix_glitch', '💻 Cyber Operative', 'Discovered the hidden Matrix rain terminal!');
      this.showNotification('💻 SYSTEM OVERRIDE: MATRIX GLITCH ACTIVATED (ESC to Exit)');
    } else {
      matrixContainer.style.display = 'none';
    }
  }

  startMatrixRain(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '0123456789ABCDEF@#$%&*+-/<>~';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    const render = () => {
      if (!this.isMatrixActive) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff88';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      requestAnimationFrame(render);
    };
    render();
  }

  // --- ACHIEVEMENTS SYSTEM ---
  unlockAchievement(id, title, desc) {
    if (this.unlockedAchievements.includes(id)) return;

    this.unlockedAchievements.push(id);
    localStorage.setItem('squishbox_achievements', JSON.stringify(this.unlockedAchievements));

    if (window.soundEngine) window.soundEngine.playFanfare();
    this.showAchievementBanner(title, desc);
    this.renderAchievementsList();
  }

  showAchievementBanner(title, desc) {
    const banner = document.createElement('div');
    banner.className = 'achievement-toast';
    banner.innerHTML = `
      <div class="achieve-icon">🏆</div>
      <div class="achieve-content">
        <div class="achieve-title">Achievement Unlocked!</div>
        <div class="achieve-name">${title}</div>
        <div class="achieve-desc">${desc}</div>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add('show'), 20);
    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 400);
    }, 4000);
  }

  showNotification(msg) {
    const note = document.createElement('div');
    note.className = 'system-notification';
    note.innerText = msg;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 2500);
  }

  renderAchievementsList() {
    const list = document.getElementById('achievementsList');
    if (!list) return;

    const all = [
      { id: 'pop_prodigy', icon: '🫧', name: 'Pop Prodigy', desc: 'Pop 50 bubbles' },
      { id: 'caught_sassy', icon: '🧀', name: 'Master Cheese Hunter', desc: 'Capture the supersonic flying cheese' },
      { id: 'disco_king', icon: '🕺', name: 'Disco Legend', desc: 'Unlock the 4-step Neon Disco Rave' },
      { id: 'gravity_invert', icon: '🌌', name: 'Physics Violator', desc: 'Invert gravity across cosmic toys' },
      { id: 'matrix_glitch', icon: '💻', name: 'Cyber Operative', desc: 'Find the secret Matrix terminal (ESC to exit)' },
      { id: 'lightning_storm', icon: '⚡', name: 'Lightning Storm', desc: 'Awaken high-voltage lightning bolt cursor trail' },
      { id: 'overdrive', icon: '⚡', name: 'Max Overdrive', desc: 'Reach 100% on Satisfy-O-Meter' }
    ];

    list.innerHTML = all.map(item => {
      const isUnlocked = this.unlockedAchievements.includes(item.id);
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="card-icon">${item.icon}</div>
          <div class="card-info">
            <div class="card-title">${item.name} ${isUnlocked ? '✓' : '🔒'}</div>
            <div class="card-desc">${item.desc}</div>
          </div>
        </div>
      `;
    }).join('');

    const count = document.getElementById('achieveCountBadge');
    if (count) count.innerText = `${this.unlockedAchievements.length} / ${all.length}`;
  }
}

window.ToyState = ToyState;
