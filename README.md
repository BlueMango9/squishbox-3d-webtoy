# ✦ SQUISHBOX 3D • The Cosmic Anti-Boredom Web Toy
> **GitHub Community SRM (GCSRM) Recruitment 2026**  
> **Track:** Web Development / Frontend (Year 1) — **Option A: Build a Web Toy**  
> **Tech Stack:** Pure Vanilla HTML5, Modern CSS3 (Glassmorphism & Custom Properties), ES6+ JavaScript, Three.js WebGL & Web Audio API (Zero external assets required).

---

## 🌟 Live Demo & Video Walkthrough

- 🔗 **Live Demo Link:** [https://bluemango9.github.io/squishbox-3d-webtoy/](https://bluemango9.github.io/squishbox-3d-webtoy/) *(or open `index.html` locally in any browser with zero setup)*
- 🎥 **Demonstration Video:** Included in repository assets (`/demo.mp4` / `demo.webp`).

---

## 🚀 Overview & Goal

> *"Build something useless, fun, and surprisingly addictive. Create a small interactive website that makes the user want to click, explore, or play with it."*

**SQUISHBOX 3D** is a hyper-polished, interactive anti-stress playground and sensory toy deck. Designed with rich glassmorphism, dynamic lighting, 60 FPS physics, and tactile micro-interactions, it invites the user to fidget, squish, pop, and discover hidden secrets.

---

## 🎮 Core Interactive Experiences

SQUISHBOX 3D contains **4 distinct interactive toys** (well surpassing the 3 required interactions):

### 1. 🔮 3D Kinetic Jelly Core (Three.js WebGL)
- **Soft-Body Vertex Physics:** Real-time spring-damper mesh physics deforms the sphere when clicked or dragged.
- **Slingshot Fling & Bounce:** Drag and stretch the jelly in 3D space, release to launch and watch it ricochet off screen boundaries with elastic damping.
- **Zero-G Buoyant Flight:** Press 'G' to send the jelly floating weightlessly toward the ceiling with harmonic wobbles.
- **Dynamic Lighting & Eyes:** Point lights track pointer coordinates, clearcoat reflections, and pupils track cursor in real time.

### 2. 🫧 Tactile Bubble-Wrap Matrix (Infinite Pop-It)
- **Skeuomorphic 3D Silicone Cells:** Custom-shaded bubbles with realistic tactile depth and depression physics.
- **Procedural Melodic Audio:** Each pop triggers a randomized note from a pentatonic scale via the **Web Audio API**—clicking rapidly plays joyful arpeggio chords!
- **Chain Reactions & Frenzy:** Includes single pop, "Frenzy Pop All", and smooth cascading re-inflation.

### 3. 🌊 Cosmic Liquid Slime & Wave Garden
- **Viscous Fluid Dynamics:** Stream gooey neon liquid ribbons that stretch, drip, and coalesce with surface tension springs.
- **Interactive Fluid Vortex:** Swirl the glowing liquid into hypnotic iridescent whirlpools.
- **Tidal Wave Shockwave:** Trigger radial wave pulses that send liquid droplets rippling outward.
- **Zero-G Floating Beads:** Press 'G' to make liquid droplets float into space spheres.

### 4. 🐭 Speedy Mouse vs. Flying Cheese
- **Agile Physics Chase:** Move your cursor to guide the mouse avatar (`🐭`) with **zero cursor latency** as the Flying Cheese darts and ricochets at supersonic speeds!
- **Difficulty Levels 1 to 5:** Progressive speed tiers from *Level 1 • Nibble Run* up to *Level 5 • Hyper Havarti*.
- **Panic Evasion AI:** The cheese detects the approaching mouse, accelerating away with witty thought bubbles and evasive swerves.
- **⚡ Scurry Sprint:** Hit Spacebar or click to execute a high-speed dash burst!
- **Victory Feast:** Touch the cheese to trigger munch sound effects, confetti celebrations, and score boosts!

---

## 💎 Bonus Implementations Checklist

| Requirement / Bonus | Implementation in Squishbox 3D |
| :--- | :--- |
| **HTML, CSS, JavaScript** | 100% Vanilla without bulky frameworks or bundlers. |
| **At least 3 Interactions** | 4 full gadgets (3D Jelly, Bubble Matrix, Liquid Slime, Mouse & Cheese). |
| **Rich Animations** | 60 FPS Three.js vertex spring physics, Viscous fluid springs, confetti engine. |
| **Sound Effects** | Custom **Web Audio API procedural synthesizer** (pops, zaps, chomp, whoosh, zero-g). |
| **Dark Mode & Themes** | 4 curated themes: `Dark Cyber`, `Midnight Void`, `Retro Synthwave`, `☀️ Light Mode`. |
| **Easter Eggs & Riddles** | 🕺 **Neon Disco Rave (`D` key, `ESC` to exit)**<br>🌌 **Cosmic Anti-Gravity (`G`)**<br>💻 **Matrix Rain (`M` or logo triple-click, strictly `ESC` to exit)**<br>⚡ **High-Voltage Lightning Trail (`L` or `R`)** |
| **Score & Combo System** | Dynamic Satisfy-O-Meter, click streak multiplier (up to 10x frenzy), high score counter. |
| **Local Storage** | Persists high score, total bubbles popped, cheeses caught, unlocked achievements, sound toggle, and theme preference. |
| **Responsive Design** | Fluid layouts optimized for desktop, tablet, and mobile touch screens. |

---

## 🏆 Hall of Achievements

SQUISHBOX 3D features a built-in Achievement System with badges saved to `localStorage`:
- 🫧 **Pop Prodigy:** Pop 50 bubbles.
- 🧀 **Master Cheese Hunter:** Capture the supersonic flying cheese.
- 🕺 **Disco Legend:** Unlock the Neon Disco Rave party.
- 🌌 **Physics Violator:** Invert gravity across cosmic toys.
- 💻 **Cyber Operative:** Discover the secret Matrix terminal (ESC to exit).
- ⚡ **Lightning Storm:** Awaken high-voltage lightning bolt cursor trail.
- ⚡ **Max Overdrive:** Reach 100% on the Satisfy-O-Meter.

---

## 🕹️ Secret Controls & Easter Eggs (Spoilers!)

- **Neon Disco Rave:** Press <kbd>D</kbd> (or the 4th letter of the alphabet) to initiate the **Full Neon Disco Rave** with 8-bit beat and disco ball. Press <kbd>ESC</kbd> to exit.
- **Anti-Gravity:** Press <kbd>G</kbd> to invert gravity across both the 3D Jelly and Liquid Slime.
- **Matrix Digital Rain:** Press <kbd>M</kbd> or **triple-click the top-left logo** to trigger terminal cyber code rain. Strictly press <kbd>ESC</kbd> to exit.
- **Lightning Bolt Trail:** Press <kbd>L</kbd> (or <kbd>R</kbd>) to unleash a crackling high-voltage lightning cursor trail.

---

## 🛠️ Local Setup & Quick Start

Because this project is built using native web standards, **no build step, npm install, or compilation is required**.

### Method 1: Instant Browser Opening
Simply double-click [`index.html`](index.html) or drag it into any modern web browser (Google Chrome, Firefox, Safari, Microsoft Edge, Brave).

### Method 2: Local HTTP Server (Optional)
```bash
# Clone the repository
git clone https://github.com/BlueMango9/squishbox-3d-webtoy.git
cd squishbox-3d-webtoy

# Run with Python
python -m http.server 8000

# Or run with Node.js
npx serve .
```
Then visit `http://localhost:8000` in your browser.

---

## 📂 Project Architecture

```
gcsrm-webtoy/
├── index.html       # Semantic HTML5 layout, UI controls, modals, and overlays
├── style.css        # Modern design system, themes, glassmorphism, animations
├── audio.js         # Zero-asset Web Audio API procedural sound synthesizer
├── jelly3d.js       # Three.js 3D soft-body spring mesh, slingshot & eye tracking
├── sandbox.js       # Canvas 2D physics engine (particles, gravity, vortex)
├── toy.js           # Game loop, satisfy meter, bubble matrix, sassy button, easter eggs
└── README.md        # Documentation and submission specifications
```

---

## 👨‍💻 Submission Attribution
- **Candidate:** Akshith
- **Event:** GitHub Community SRM (GCSRM) Recruitment 2026
- **Track:** Technical Track — Web Development (Option A)
