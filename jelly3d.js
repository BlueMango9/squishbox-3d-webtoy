/**
 * Jelly3D - Interactive 3D Soft-Body Kinetic Jelly Toy
 * Built with Three.js (r128). Features vertex deformation, spring jiggle,
 * interactive eye-tracking, grab-and-slingshot physics, and metallic iridescence.
 */

class JellyToy {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.jellyMesh = null;
    this.originalVertices = [];
    this.vertexDisplacements = [];
    this.vertexVelocities = [];
    
    // Physics & Interaction state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.pointer = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();
    this.jellyVelocity = new THREE.Vector3(0, 0, 0);
    this.jellyPos = new THREE.Vector3(0, 0, 0);
    this.bounds = { x: 4.5, y: 3.0 };
    
    // Expressive Pupils
    this.leftEye = null;
    this.rightEye = null;
    this.leftPupil = null;
    this.rightPupil = null;

    // Disco light
    this.discoLight = null;
    this.isRaving = false;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.z = 8.5;

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 3. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    this.pointLight = new THREE.PointLight(0x00f3ff, 2.5, 30);
    this.pointLight.position.set(3, 4, 5);
    this.scene.add(this.pointLight);

    const rimLight = new THREE.DirectionalLight(0xff007f, 1.8);
    rimLight.position.set(-5, -4, -3);
    this.scene.add(rimLight);

    // 4. Jelly Sphere Geometry & Material
    const radius = 2.0;
    const detail = 32;
    const geometry = new THREE.SphereGeometry(radius, detail, detail);

    // Store original vertex coordinates
    const posAttr = geometry.attributes.position;
    this.originalVertices = [];
    this.vertexVelocities = [];
    for (let i = 0; i < posAttr.count; i++) {
      this.originalVertices.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
      this.vertexVelocities.push(new THREE.Vector3(0, 0, 0));
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x8a2be2,
      emissive: 0x220544,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.45,
      ior: 1.35,
      reflectivity: 0.9,
      wireframe: false
    });

    this.jellyMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.jellyMesh);

    // 5. Playful Googly Eyes
    this.createEyes();

    // 6. Event Listeners
    this.bindEvents();

    // 7. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createEyes() {
    const eyeGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });

    const pupilGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Left Eye
    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.65, 0.45, 1.7);
    this.leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    this.leftPupil.position.set(0, 0, 0.26);
    this.leftEye.add(this.leftPupil);
    this.jellyMesh.add(this.leftEye);

    // Right Eye
    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.65, 0.45, 1.7);
    this.rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    this.rightPupil.position.set(0, 0, 0.26);
    this.rightEye.add(this.rightPupil);
    this.jellyMesh.add(this.rightEye);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    const dom = this.renderer.domElement;
    
    // Mouse / Touch handlers
    dom.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    dom.addEventListener('pointerleave', () => this.onPointerUp());
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updatePointerCoords(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerDown(e) {
    this.updatePointerCoords(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObject(this.jellyMesh);

    if (intersects.length > 0) {
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      const hitPoint = intersects[0].point.clone().sub(this.jellyMesh.position);

      // Squish impact shockwave
      this.deformAt(hitPoint, -0.9, 1.4);
      if (window.soundEngine) window.soundEngine.playSquish(1.2);
      if (window.toyState) window.toyState.addSatisfaction(5, 'Squished the 3D Jelly!');
    }
  }

  onPointerMove(e) {
    this.updatePointerCoords(e);

    // Track mouse light position
    if (this.pointLight) {
      this.pointLight.position.x = this.pointer.x * 5;
      this.pointLight.position.y = this.pointer.y * 3.5;
    }

    // Pupils follow pointer
    if (this.leftPupil && this.rightPupil) {
      const px = Math.max(-0.15, Math.min(0.15, this.pointer.x * 0.25));
      const py = Math.max(-0.15, Math.min(0.15, this.pointer.y * 0.25));
      this.leftPupil.position.x = px;
      this.leftPupil.position.y = py;
      this.rightPupil.position.x = px;
      this.rightPupil.position.y = py;
    }

    // Slingshot pull while dragging
    if (this.isDragging) {
      const dx = (e.clientX - this.dragStart.x) * 0.012;
      const dy = -(e.clientY - this.dragStart.y) * 0.012;
      this.jellyMesh.position.x = this.jellyPos.x + dx;
      this.jellyMesh.position.y = this.jellyPos.y + dy;
      this.jellyMesh.scale.set(1 + Math.abs(dx) * 0.2, 1 + Math.abs(dy) * 0.2, 1 - (Math.abs(dx) + Math.abs(dy)) * 0.1);
    }
  }

  onPointerUp() {
    if (this.isDragging) {
      this.isDragging = false;
      // Slingshot release launch velocity!
      const snapVector = new THREE.Vector3(
        (this.jellyPos.x - this.jellyMesh.position.x) * 0.25,
        (this.jellyPos.y - this.jellyMesh.position.y) * 0.25,
        0
      );

      this.jellyVelocity.copy(snapVector);
      this.jellyMesh.scale.set(1, 1, 1);

      // Boing sound & wobble
      if (window.soundEngine) {
        window.soundEngine.playWhoosh();
        setTimeout(() => window.soundEngine.playBoing(), 100);
      }
      this.deformRandom(0.7);
      if (window.toyState) window.toyState.addSatisfaction(10, 'Flicked the Slingshot!');
    }
  }

  deformAt(localPoint, strength, radius) {
    const pos = this.jellyMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const orig = this.originalVertices[i];
      const dist = orig.distanceTo(localPoint);
      if (dist < radius) {
        const factor = (1 - dist / radius) * strength;
        const normal = orig.clone().normalize();
        this.vertexVelocities[i].addScaledVector(normal, factor);
      }
    }
  }

  deformRandom(magnitude = 0.5) {
    for (let i = 0; i < this.vertexVelocities.length; i++) {
      const randForce = (Math.random() - 0.5) * magnitude;
      const norm = this.originalVertices[i].clone().normalize();
      this.vertexVelocities[i].addScaledVector(norm, randForce);
    }
  }

  pokeCenter() {
    this.deformAt(new THREE.Vector3(0, 0, 2), -1.2, 2.2);
    if (window.soundEngine) window.soundEngine.playBoing();
    if (window.toyState) window.toyState.addSatisfaction(8, 'Center Poked!');
  }

  setDiscoMode(active) {
    this.isRaving = active;
    if (active) {
      this.jellyMesh.material.wireframe = false;
      this.jellyMesh.material.emissiveIntensity = 1.0;
    } else {
      this.jellyMesh.material.emissiveIntensity = 0.2;
    }
  }

  toggleZeroGravity(forceState) {
    this.isZeroG = forceState !== undefined ? forceState : !this.isZeroG;
    if (this.isZeroG) {
      this.jellyVelocity.y += 0.22;
      this.deformRandom(0.8);
    } else {
      this.jellyVelocity.y -= 0.15;
      this.deformRandom(0.5);
    }
    return this.isZeroG;
  }

  setThemeColor(colorHex, emissiveHex) {
    if (this.jellyMesh && this.jellyMesh.material) {
      this.jellyMesh.material.color.setHex(colorHex);
      this.jellyMesh.material.emissive.setHex(emissiveHex);
    }
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate);
    const time = timestamp * 0.001;

    // 1. Soft-body Spring Vertex Update
    const posAttr = this.jellyMesh.geometry.attributes.position;
    const spring = 0.12;
    const damping = 0.88;

    for (let i = 0; i < posAttr.count; i++) {
      const orig = this.originalVertices[i];
      const curX = posAttr.getX(i);
      const curY = posAttr.getY(i);
      const curZ = posAttr.getZ(i);

      // Spring force returning to original vertex shape
      const fx = (orig.x - curX) * spring;
      const fy = (orig.y - curY) * spring;
      const fz = (orig.z - curZ) * spring;

      const vel = this.vertexVelocities[i];
      vel.x = (vel.x + fx) * damping;
      vel.y = (vel.y + fy) * damping;
      vel.z = (vel.z + fz) * damping;

      // Subtle breathing ripple
      const breathing = Math.sin(time * 3 + orig.y * 2) * 0.008;

      posAttr.setXYZ(i, curX + vel.x + breathing * orig.x, curY + vel.y + breathing * orig.y, curZ + vel.z + breathing * orig.z);
    }
    posAttr.needsUpdate = true;
    this.jellyMesh.geometry.computeVertexNormals();

    // 2. Slingshot Ricochet & Bounds Physics
    if (!this.isDragging) {
      this.jellyMesh.position.add(this.jellyVelocity);
      this.jellyVelocity.multiplyScalar(0.96); // air drag

      // Restoring force to center (or buoyant ceiling in Zero-G)
      const targetY = this.isZeroG ? 1.6 : 0;
      this.jellyVelocity.x += (0 - this.jellyMesh.position.x) * 0.015;
      this.jellyVelocity.y += (targetY - this.jellyMesh.position.y) * (this.isZeroG ? 0.012 : 0.015);
      if (this.isZeroG) {
        this.jellyVelocity.y += Math.sin(time * 2.5) * 0.005;
      }

      // Wall bounce
      if (Math.abs(this.jellyMesh.position.x) > this.bounds.x) {
        this.jellyVelocity.x *= -0.7;
        this.jellyMesh.position.x = Math.sign(this.jellyMesh.position.x) * this.bounds.x;
        this.deformRandom(0.4);
      }
      if (Math.abs(this.jellyMesh.position.y) > this.bounds.y) {
        this.jellyVelocity.y *= -0.7;
        this.jellyMesh.position.y = Math.sign(this.jellyMesh.position.y) * this.bounds.y;
        this.deformRandom(0.4);
      }
    }

    // 3. Gentle Idle Floating & Tilting
    this.jellyMesh.rotation.y = Math.sin(time * 0.8) * 0.15;
    this.jellyMesh.rotation.x = Math.cos(time * 0.6) * 0.08;

    // 4. Disco Rave Color Cycling
    if (this.isRaving) {
      const hue = (time * 0.5) % 1;
      this.jellyMesh.material.color.setHSL(hue, 1.0, 0.5);
      if (this.pointLight) this.pointLight.color.setHSL((hue + 0.5) % 1, 1.0, 0.6);
      this.jellyMesh.rotation.z += 0.03;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.JellyToy = JellyToy;
