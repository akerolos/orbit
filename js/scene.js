/**
 * ORBIT — Cinematic 3D Scene Engine (Three.js)
 * High-detail 3D astronaut, rotating planet with atmosphere shader,
 * parallax starfield, cosmic dust, and responsive mouse/scroll kinetics.
 */

class OrbitSpaceScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.astronaut = null;
    this.planetGroup = null;
    this.planet = null;
    this.clouds = null;
    this.atmosphere = null;
    this.moon = null;
    this.starfield = null;
    this.dustParticles = null;

    // Interaction & Animation state
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollY = 0;
    this.scrollProgress = 0;
    this.clock = null;
    this.isLoaded = false;
    this.modelLoaded = false;

    // Animation frame handle
    this.rafId = null;

    this.init();
  }

  init() {
    try {
      if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded. Enabling fallback mode.');
        this.initCanvasFallback();
        return;
      }

      this.clock = new THREE.Clock();

      // 1. Scene Setup
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x030508, 0.035);

      // 2. Camera Setup
      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      this.updateCameraPosition();

      // 3. Renderer Setup
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.outputEncoding = THREE.sRGBEncoding;

      // 4. Lighting System
      this.setupLighting();

      // 5. Celestial Objects (Planet, Clouds, Atmospheric Halo, Moon)
      this.setupCelestialBodies();

      // 6. Starfield & Cosmic Dust
      this.setupStarfield();
      this.setupCosmicDust();

      // 7. Load 3D Astronaut Model
      this.loadAstronautModel();

      // 8. Event Listeners
      this.setupEventListeners();

      // 9. Start Render Loop
      this.animate();

    } catch (err) {
      console.error('WebGL init error:', err);
      this.initCanvasFallback();
    }
  }

  updateCameraPosition() {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.camera.position.set(0, 0, 7.5);
    } else if (window.innerWidth < 1200) {
      this.camera.position.set(0, 0, 6.2);
    } else {
      this.camera.position.set(0, 0, 5.4);
    }
    this.camera.lookAt(0, 0, 0);
  }

  setupLighting() {
    // Soft deep-space ambient light
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2);
    this.scene.add(ambientLight);

    // Stellar Key Light (Warm distant sunlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(6, 4, 5);
    this.scene.add(keyLight);

    // Atmospheric Rim Light (Electric cyan highlighting suit silhouette)
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 3.2);
    rimLight.position.set(-6, 2, -3);
    this.scene.add(rimLight);

    // Subtle fill light from below (planetary reflection)
    const fillLight = new THREE.DirectionalLight(0x1e3a8a, 1.4);
    fillLight.position.set(0, -5, 2);
    this.scene.add(fillLight);
  }

  setupCelestialBodies() {
    this.planetGroup = new THREE.Group();
    // Position planet in background behind astronaut
    this.planetGroup.position.set(0, -0.6, -4.5);
    this.scene.add(this.planetGroup);

    const textureLoader = new THREE.TextureLoader();
    
    // Fallback procedural texture generator if image textures fail
    const createProceduralPlanetTexture = () => {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#0a192f');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);
      return new THREE.CanvasTexture(c);
    };

    // Load Earth Diffuse
    textureLoader.load(
      'assets/textures/earth.jpg',
      (texture) => {
        texture.anisotropy = 4;
        const planetGeo = new THREE.SphereGeometry(3.0, 64, 64);
        
        // Planet surface material
        const planetMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.75,
          metalness: 0.15
        });

        // Try load normal & specular if available
        textureLoader.load('assets/textures/earth_normal.jpg', (norm) => {
          planetMat.normalMap = norm;
          planetMat.normalScale.set(0.6, 0.6);
          planetMat.needsUpdate = true;
        });

        this.planet = new THREE.Mesh(planetGeo, planetMat);
        this.planetGroup.add(this.planet);
      },
      undefined,
      () => {
        // Fallback planet
        const planetGeo = new THREE.SphereGeometry(3.0, 64, 64);
        const planetMat = new THREE.MeshStandardMaterial({
          map: createProceduralPlanetTexture(),
          roughness: 0.6,
          metalness: 0.2
        });
        this.planet = new THREE.Mesh(planetGeo, planetMat);
        this.planetGroup.add(this.planet);
      }
    );

    // Rotating Cloud Layer
    textureLoader.load('assets/textures/earth_clouds.png', (cloudTex) => {
      const cloudGeo = new THREE.SphereGeometry(3.04, 64, 64);
      const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        roughness: 1.0
      });
      this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
      this.planetGroup.add(this.clouds);
    });

    // Custom Atmospheric Rim Glow (Fresnel Halo Shader)
    const atmosphereGeo = new THREE.SphereGeometry(3.2, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.68 - dot(vNormal, viewDir), 2.8);
          // Electric cyan atmospheric glow
          vec3 glowColor = vec3(0.0, 0.85, 1.0);
          gl_FragColor = vec4(glowColor, intensity * 0.85);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    this.planetGroup.add(this.atmosphere);

    // Orbiting Satellite / Moon
    textureLoader.load('assets/textures/moon.jpg', (moonTex) => {
      const moonGeo = new THREE.SphereGeometry(0.38, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        map: moonTex,
        roughness: 0.9,
        metalness: 0.1
      });
      this.moon = new THREE.Mesh(moonGeo, moonMat);
      this.moon.position.set(4.8, 1.2, -1.8);
      this.planetGroup.add(this.moon);
    });
  }

  setupStarfield() {
    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      // Spread stars across sphere volume
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = (Math.random() - 0.5) * 80;
      positions[i3 + 2] = -15 - Math.random() * 45;

      // Color variation: white, cyan, light silver
      const colRand = Math.random();
      if (colRand > 0.8) {
        colors[i3] = 0.5; colors[i3 + 1] = 0.85; colors[i3 + 2] = 1.0; // Subtle electric cyan
      } else if (colRand > 0.6) {
        colors[i3] = 0.9; colors[i3 + 1] = 0.92; colors[i3 + 2] = 1.0; // Pale ice blue
      } else {
        colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0; // White
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  setupCosmicDust() {
    const dustCount = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = 2.0 - Math.random() * 8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  loadAstronautModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('GLTFLoader not available. Building procedural astronaut mesh.');
      this.buildProceduralAstronaut();
      return;
    }

    const loader = new THREE.GLTFLoader();
    const modelUrl = 'assets/models/astronaut1.glb';
    const cdnUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    const onLoadSuccess = (gltf) => {
      this.astronaut = gltf.scene;

      // Center model bounding box
      const box = new THREE.Box3().setFromObject(this.astronaut);
      const center = box.getCenter(new THREE.Vector3());
      this.astronaut.position.sub(center);

      // Wrap in a container for smooth rotations and translations
      this.astronautContainer = new THREE.Group();
      this.astronautContainer.add(this.astronaut);

      // Adjust scale and initial orientation
      const isMobile = window.innerWidth < 768;
      const baseScale = isMobile ? 1.05 : 1.35;
      this.astronautContainer.scale.set(baseScale, baseScale, baseScale);

      // Position in center of hero composition
      this.astronautContainer.position.set(0, -0.4, 0.4);
      this.astronautContainer.rotation.y = 0.15;

      // Enhance suit materials and visor reflections
      this.astronaut.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Detect visor
          if (child.name.toLowerCase().includes('visor') || 
              (child.material.name && child.material.name.toLowerCase().includes('visor'))) {
            child.material.roughness = 0.08;
            child.material.metalness = 0.95;
            child.material.color.setHex(0x0a101d);
          } else {
            // White suit with subtle fabric sheen
            if (child.material.roughness !== undefined) {
              child.material.roughness = 0.65;
            }
          }
        }
      });

      this.scene.add(this.astronautContainer);
      this.modelLoaded = true;
      this.triggerReady();
    };

    const onLoadError = (error) => {
      console.warn('Local astronaut model failed, trying CDN fallback:', error);
      loader.load(
        cdnUrl,
        onLoadSuccess,
        undefined,
        (cdnErr) => {
          console.warn('CDN model failed too. Building procedural astronaut mesh:', cdnErr);
          this.buildProceduralAstronaut();
        }
      );
    };

    loader.load(modelUrl, onLoadSuccess, undefined, onLoadError);
  }

  // High quality procedural astronaut if GLTF is offline or fails
  buildProceduralAstronaut() {
    this.astronautContainer = new THREE.Group();

    // Torso suit
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.5, 1.2, 24);
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.55,
      metalness: 0.15
    });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 0;
    this.astronautContainer.add(torso);

    // Helmet
    const helmetGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.y = 0.95;
    this.astronautContainer.add(helmet);

    // Visor with golden/cyan glass
    const visorGeo = new THREE.SphereGeometry(0.36, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.1,
      metalness: 0.92,
      emissive: 0x002233
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.95, 0.18);
    visor.rotation.x = Math.PI * 0.45;
    this.astronautContainer.add(visor);

    // Life support backpack
    const packGeo = new THREE.BoxGeometry(0.8, 1.0, 0.4);
    const packMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });
    const backpack = new THREE.Mesh(packGeo, packMat);
    backpack.position.set(0, 0.1, -0.45);
    this.astronautContainer.add(backpack);

    // Limbs
    const armGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.8, 16);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.72, 0.2, 0.1);
    leftArm.rotation.z = Math.PI * 0.15;
    leftArm.rotation.x = -Math.PI * 0.1;

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.72, 0.2, 0.1);
    rightArm.rotation.z = -Math.PI * 0.15;
    rightArm.rotation.x = Math.PI * 0.1;

    this.astronautContainer.add(leftArm);
    this.astronautContainer.add(rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.2, 0.18, 1.0, 16);
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(-0.32, -0.95, 0);
    leftLeg.rotation.x = 0.1;

    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(0.32, -0.95, 0);
    rightLeg.rotation.x = -0.15;

    this.astronautContainer.add(leftLeg);
    this.astronautContainer.add(rightLeg);

    this.astronautContainer.position.set(0, -0.3, 0.5);
    this.scene.add(this.astronautContainer);
    this.modelLoaded = true;
    this.triggerReady();
  }

  triggerReady() {
    this.isLoaded = true;
    const event = new CustomEvent('orbit:sceneReady');
    window.dispatchEvent(event);
  }

  setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.updateCameraPosition();

      if (this.astronautContainer) {
        const isMobile = width < 768;
        const scale = isMobile ? 1.05 : 1.35;
        this.astronautContainer.scale.set(scale, scale, scale);
      }
    });

    // Pointer Parallax
    window.addEventListener('pointermove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Device Orientation for mobile tilt
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          this.mouse.targetX = Math.min(Math.max(e.gamma / 30, -1), 1);
          this.mouse.targetY = Math.min(Math.max((e.beta - 45) / 30, -1), 1);
        }
      });
    }

    // Scroll Progress Tracking
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = maxScroll > 0 ? this.scrollY / maxScroll : 0;
    }, { passive: true });
  }

  animate() {
    this.rafId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth Lerp Mouse Movement
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 1. Planet & Cloud Rotation
    if (this.planet) {
      this.planet.rotation.y += 0.0012;
      this.planet.rotation.x = 0.1 + this.mouse.y * 0.03;
    }
    if (this.clouds) {
      this.clouds.rotation.y += 0.0018;
      this.clouds.rotation.x = 0.1 + this.mouse.y * 0.03;
    }
    if (this.moon) {
      // Slow orbital revolution around planet
      const moonAngle = elapsedTime * 0.08;
      this.moon.position.x = Math.cos(moonAngle) * 4.6;
      this.moon.position.z = Math.sin(moonAngle) * 2.2 - 2.8;
      this.moon.rotation.y += 0.002;
    }

    // 2. Astronaut Subtle Floating & Mouse Parallax
    if (this.astronautContainer) {
      // Harmonic microgravity breathing oscillation
      const floatY = Math.sin(elapsedTime * 0.9) * 0.07;
      const floatRotZ = Math.cos(elapsedTime * 0.7) * 0.025;

      // Base position + mouse parallax + scroll reaction
      const scrollOffset = this.scrollY * 0.0012;
      this.astronautContainer.position.y = -0.35 + floatY - scrollOffset;
      this.astronautContainer.position.x = this.mouse.x * 0.22;

      // Smooth tilt responding to pointer
      this.astronautContainer.rotation.y = 0.15 + this.mouse.x * 0.28;
      this.astronautContainer.rotation.x = -this.mouse.y * 0.22;
      this.astronautContainer.rotation.z = floatRotZ - this.mouse.x * 0.08;
    }

    // 3. Starfield & Cosmic Dust Drift
    if (this.starfield) {
      this.starfield.rotation.y = elapsedTime * 0.0004 + this.mouse.x * 0.02;
      this.starfield.rotation.x = this.mouse.y * 0.015;
    }
    if (this.dustParticles) {
      this.dustParticles.rotation.y = elapsedTime * 0.0015;
      this.dustParticles.position.y = (elapsedTime * 0.04) % 4 - 2;
    }

    // 4. Camera Parallax
    if (this.camera) {
      this.camera.position.x = this.mouse.x * 0.18;
      this.camera.position.y = this.mouse.y * 0.14;
    }

    this.renderer.render(this.scene, this.camera);
  }

  // Graceful 2D Canvas Fallback
  initCanvasFallback() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5,
      alpha: Math.random()
    }));

    const renderFallback = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      // Dark space background
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Distant stars
      stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Planet silhouette
      const cx = this.canvas.width * 0.5;
      const cy = this.canvas.height * 0.7;
      const radius = Math.min(this.canvas.width, this.canvas.height) * 0.38;

      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(0.8, '#0b132b');
      grad.addColorStop(1, '#030508');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric limb glow
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      requestAnimationFrame(renderFallback);
    };

    renderFallback();
    this.triggerReady();
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.orbitScene = new OrbitSpaceScene('webgl-canvas');
});
