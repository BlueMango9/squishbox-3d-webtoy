/**
 * LiquidGarden - Interactive Viscous Neon Fluid & Slime Simulator
 * Features viscoelastic particle simulation, surface tension coalescence,
 * ripple refraction, fluid vortex swirl, and zero-G floating spheres.
 */

class LiquidGarden {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.droplets = [];
    this.gravity = 0.28;
    this.viscosity = 0.94; // fluid damping
    this.surfaceTensionDist = 38;
    this.isVortexActive = false;
    this.brushMode = 'slime'; // 'slime', 'ripples', 'droplets'
    this.cursor = { x: 0, y: 0, prevX: 0, prevY: 0, isDown: false };
    
    // Vibrant neon fluid palette
    this.colors = [
      { r: 0, g: 243, b: 255 },   // Cyan
      { r: 255, g: 0, b: 127 },   // Magenta
      { r: 191, g: 0, b: 255 },   // Violet
      { r: 0, g: 255, b: 136 },   // Mint
      { r: 255, g: 230, b: 0 }    // Gold
    ];

    // Ripple wave rings
    this.ripples = [];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Pointer events
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const coords = this.getCanvasCoords(e);
      this.triggerShockwave(coords.x, coords.y);
    });

    // Seed initial fluid blobs
    this.spawnBatch(45);

    // Loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onPointerDown(e) {
    const coords = this.getCanvasCoords(e);
    this.cursor.x = coords.x;
    this.cursor.y = coords.y;
    this.cursor.prevX = coords.x;
    this.cursor.prevY = coords.y;
    this.cursor.isDown = true;

    if (this.isVortexActive) {
      if (window.soundEngine) window.soundEngine.playLaser();
      return;
    }

    // Spawn viscous splash
    for (let i = 0; i < 6; i++) {
      this.spawnDroplet(coords.x + (Math.random() - 0.5) * 20, coords.y + (Math.random() - 0.5) * 20);
    }
    this.addRipple(coords.x, coords.y, 40);

    if (window.soundEngine) window.soundEngine.playWaterDrop();
    if (window.toyState) window.toyState.addSatisfaction(4, 'Fluid Splash!');
  }

  onPointerMove(e) {
    const coords = this.getCanvasCoords(e);
    const dx = coords.x - this.cursor.x;
    const dy = coords.y - this.cursor.y;
    const speed = Math.hypot(dx, dy);

    this.cursor.prevX = this.cursor.x;
    this.cursor.prevY = this.cursor.y;
    this.cursor.x = coords.x;
    this.cursor.y = coords.y;

    if (this.cursor.isDown && !this.isVortexActive) {
      // Paint continuous gooey liquid ribbons
      const numToSpawn = Math.min(3, Math.floor(speed / 8) + 1);
      for (let i = 0; i < numToSpawn; i++) {
        const drop = this.spawnDroplet(
          coords.x + (Math.random() - 0.5) * 14,
          coords.y + (Math.random() - 0.5) * 14
        );
        if (drop) {
          drop.vx += dx * 0.25;
          drop.vy += dy * 0.25;
        }
      }

      if (Math.random() < 0.2 && window.soundEngine) {
        window.soundEngine.playWaterDrop();
      }
    }
  }

  onPointerUp() {
    this.cursor.isDown = false;
  }

  spawnDroplet(x, y) {
    const colorObj = this.colors[Math.floor(Math.random() * this.colors.length)];
    const radius = 10 + Math.random() * 14;

    const droplet = {
      x: x || Math.random() * this.canvas.width,
      y: y || Math.random() * (this.canvas.height * 0.4),
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: radius,
      color: colorObj,
      alpha: 0.85,
      mass: radius * 0.1,
      connections: []
    };

    this.droplets.push(droplet);
    if (this.droplets.length > 200) {
      this.droplets.shift();
    }
    return droplet;
  }

  spawnBatch(count = 35) {
    for (let i = 0; i < count; i++) {
      this.spawnDroplet(
        this.canvas.width * 0.25 + Math.random() * (this.canvas.width * 0.5),
        this.canvas.height * 0.15 + Math.random() * (this.canvas.height * 0.35)
      );
    }
    if (window.soundEngine) window.soundEngine.playWaterDrop();
  }

  addRipple(x, y, maxR = 60) {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: maxR,
      alpha: 0.8
    });
  }

  toggleVortex() {
    this.isVortexActive = !this.isVortexActive;
    return this.isVortexActive;
  }

  flipGravity() {
    this.gravity = -this.gravity;
    if (this.droplets.length < 10) {
      this.spawnBatch(25);
    }
    // Erupt liquid upwards or downwards
    this.droplets.forEach(d => {
      d.vy = this.gravity < 0 ? -12 - Math.random() * 8 : 12 + Math.random() * 8;
      d.vx += (Math.random() - 0.5) * 8;
    });
    if (window.soundEngine) window.soundEngine.playBoing();
    return this.gravity;
  }

  triggerShockwave(cx, cy) {
    const coords = (cx !== undefined && cy !== undefined) 
      ? { x: cx, y: cy } 
      : { x: this.canvas.width / 2, y: this.canvas.height / 2 };

    this.addRipple(coords.x, coords.y, 180);

    this.droplets.forEach(d => {
      const dx = d.x - coords.x;
      const dy = d.y - coords.y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = Math.min(32, 700 / dist);
      d.vx += (dx / dist) * force;
      d.vy += (dy / dist) * force;
    });

    if (window.soundEngine) window.soundEngine.playWhoosh();
    if (window.toyState) window.toyState.addSatisfaction(15, 'Fluid Superwave!');
  }

  clear() {
    this.droplets = [];
    this.ripples = [];
  }

  loop() {
    requestAnimationFrame(this.loop);
    if (!this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const isLightMode = document.body.classList.contains('theme-bubblegum');

    // Smooth viscous background trails
    this.ctx.fillStyle = isLightMode ? 'rgba(255, 240, 245, 0.28)' : 'rgba(8, 10, 22, 0.25)';
    this.ctx.fillRect(0, 0, w, h);

    // 1. Render Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 3.5;
      r.alpha *= 0.94;

      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(0, 243, 255, ${r.alpha * 0.6})`;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      if (r.alpha < 0.02 || r.radius > r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 2. Draw Vortex Eye
    if (this.isVortexActive && this.cursor.isDown) {
      const grad = this.ctx.createRadialGradient(this.cursor.x, this.cursor.y, 5, this.cursor.x, this.cursor.y, 110);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.9)');
      grad.addColorStop(0.4, 'rgba(236, 72, 153, 0.5)');
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(this.cursor.x, this.cursor.y, 110, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Fluid Particle Physics & Surface Tension Spring Connections
    const len = this.droplets.length;

    // Fluid-to-fluid cohesion (viscous surface tension)
    for (let i = 0; i < len; i++) {
      const p1 = this.droplets[i];

      for (let j = i + 1; j < len; j++) {
        const p2 = this.droplets[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.surfaceTensionDist && dist > 1) {
          // Draw viscous connective slime bridge
          const bridgeAlpha = (1 - dist / this.surfaceTensionDist) * 0.55;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${bridgeAlpha})`;
          this.ctx.lineWidth = Math.max(1, (1 - dist / this.surfaceTensionDist) * 8);
          this.ctx.stroke();

          // Mutual elastic attraction force
          const force = (dist - this.surfaceTensionDist * 0.6) * 0.003;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          p1.vx += fx;
          p1.vy += fy;
          p2.vx -= fx;
          p2.vy -= fy;
        }
      }
    }

    // 4. Update individual droplets
    for (let i = 0; i < len; i++) {
      const p = this.droplets[i];

      // Gravity & damping
      p.vy += this.gravity;
      p.vx *= this.viscosity;
      p.vy *= this.viscosity;

      // Vortex Swirl
      if (this.isVortexActive && this.cursor.isDown) {
        const dx = this.cursor.x - p.x;
        const dy = this.cursor.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 320) {
          // Inward pull + tangential swirl
          const pull = 0.55;
          const swirl = 0.45;
          p.vx += (dx / dist) * pull - (dy / dist) * swirl;
          p.vy += (dy / dist) * pull + (dx / dist) * swirl;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      // Boundary elastic bounce
      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx *= -0.7;
      } else if (p.x > w - p.radius) {
        p.x = w - p.radius;
        p.vx *= -0.7;
      }

      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy *= -0.7;
      } else if (p.y > h - p.radius) {
        p.y = h - p.radius;
        p.vy *= -0.7;
      }

      // Render glowing droplet body
      const grad = this.ctx.createRadialGradient(
        p.x - p.radius * 0.3,
        p.y - p.radius * 0.3,
        p.radius * 0.1,
        p.x,
        p.y,
        p.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.95)`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.2)`);

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Specular highlight gleam
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.beginPath();
      this.ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.25, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

window.LiquidGarden = LiquidGarden;
window.ChaosSandbox = LiquidGarden; // Backwards compatible
