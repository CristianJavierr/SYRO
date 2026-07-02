import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".hero-video");
  const hero = document.querySelector(".hero");
  const video = container ? container.querySelector("video") : null;

  if (!container || !hero || !video) return;

  // Hide the native video element so WebGL canvas handles rendering
  video.style.opacity = "0";
  video.style.pointerEvents = "none";

  // Check if touch pointer is coarse (e.g. mobile) where WebGL canvas rendering isn't needed/performing well
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (isCoarsePointer) {
    video.style.opacity = "1";
    video.play().catch(() => {});
    return;
  }

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || window.innerHeight;
  let activeFrames = 0;
  let lastRenderTime = 0;
  let isHeroVisible = true;
  let heroBounds = hero.getBoundingClientRect();
  const idleFrameInterval = 1000 / 30;
  const hasVideoFrameCallback = typeof video.requestVideoFrameCallback === "function";
  let rafId = 0;
  let idleTimer = 0;
  let videoFramePending = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 10);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
    depth: false,
    stencil: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(width, height, false);
  renderer.domElement.className = "distorted-video__canvas";
  
  // Apply canvas styling
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.objectFit = "cover";
  renderer.domElement.style.pointerEvents = "none";
  renderer.domElement.style.zIndex = "1";
  
  container.appendChild(renderer.domElement);

  // Set up video texture
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.generateMipmaps = false;

  // Grid calculation based on container cells
  const gridWidth = Math.max(2, Math.floor(width / 40));
  const gridHeight = Math.max(2, Math.floor(height / 14));
  
  const gpuCompute = new GPUComputationRenderer(gridWidth, gridHeight, renderer);
  const gridTexture = gpuCompute.createTexture();
  const gridVariable = gpuCompute.addVariable("uGrid", `
    #define MOUSE_MOVE_DECAY 0.950000

    uniform vec2 uMouse;
    uniform vec2 uDeltaMouse;
    uniform float uMouseMove;
    uniform vec2 uGridAspect;
    uniform float uDistance;

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 color = texture2D(uGrid, uv);

      vec2 aspectUv = uv * uGridAspect;
      vec2 aspectMouse = uMouse * uGridAspect;

      float dist = distance(aspectUv, aspectMouse);
      dist = 1.0 - smoothstep(0.0, uDistance, dist);

      vec2 delta = uDeltaMouse;
      color.rg += delta * dist;
      color.rg *= min(MOUSE_MOVE_DECAY, uMouseMove);

      gl_FragColor = color;
    }
  `, gridTexture);

  gridVariable.material.uniforms.uMouse = { value: new THREE.Vector2(0, 0) };
  gridVariable.material.uniforms.uDeltaMouse = { value: new THREE.Vector2(0, 0) };
  gridVariable.material.uniforms.uMouseMove = { value: 0 };
  gridVariable.material.uniforms.uGridAspect = { value: new THREE.Vector2(width / height, 1) };
  gridVariable.material.uniforms.uDistance = { value: 0.2 };
  gpuCompute.setVariableDependencies(gridVariable, [gridVariable]);
  
  const error = gpuCompute.init();
  if (error !== null) {
    console.error("GPUComputationRenderer initialization error:", error);
    video.style.opacity = "1";
    return;
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
        vUv = uv;
      }
    `,
    fragmentShader: `
      #define DISPLACEMENT_STRENGTH 0.010000
      #define RED_GHOST_SHIFT 0.001000
      #define RED_GHOST_INTENSITY 1.200000
      #define EFFECT_COLOR vec3(0.000000, 0.192157, 0.768627)

      uniform sampler2D uTexture;
      uniform sampler2D uGrid;
      varying vec2 vUv;

      uniform vec2 uContainerResolution;
      uniform vec2 uImageResolution;
      uniform float uDisplacement;

      vec2 coverUvs(vec2 imageRes, vec2 containerRes) {
        float imageAspectX = imageRes.x / imageRes.y;
        float imageAspectY = imageRes.y / imageRes.x;

        float containerAspectX = containerRes.x / containerRes.y;
        float containerAspectY = containerRes.y / containerRes.x;

        vec2 ratio = vec2(
          min(containerAspectX / imageAspectX, 1.0),
          min(containerAspectY / imageAspectY, 1.0)
        );

        vec2 newUvs = vec2(
          vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
          vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        return newUvs;
      }

      void main() {
        vec4 displacement = texture2D(uGrid, vUv);
        float displacementStrength = length(displacement.rg);

        if (displacementStrength < 0.001) {
          vec2 simpleUvs = coverUvs(uImageResolution, uContainerResolution);
          vec4 texColor = texture2D(uTexture, simpleUvs);
          float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 gray = vec3(luma);
          gray = clamp((gray - 0.5) * 1.44 + 0.5, 0.0, 1.0);
          gl_FragColor = vec4(gray, texColor.a);
          return;
        }

        vec2 newUvs = coverUvs(uImageResolution, uContainerResolution);
        vec2 finalUvs = newUvs - displacement.rg * DISPLACEMENT_STRENGTH;
        vec4 originalImage = texture2D(uTexture, finalUvs);

        vec2 shift = displacement.rg * RED_GHOST_SHIFT;

        float dStr = clamp(displacementStrength, 0.0, 2.0);
        float str1 = 1.0 + dStr * 0.25;
        float str2 = 1.0 + dStr * 1.5;
        float str3 = 1.0 + dStr * 2.0;

        vec3 color1 = texture2D(uTexture, finalUvs + shift * str1).rgb;
        vec3 color2 = texture2D(uTexture, finalUvs + shift * str2).rgb;
        vec3 color3 = texture2D(uTexture, finalUvs + shift * str3).rgb;

        vec3 lumaCoef = vec3(0.299, 0.587, 0.114);
        float lumaBase = dot(originalImage.rgb, lumaCoef);
        float luma1 = dot(color1, lumaCoef);
        float luma2 = dot(color2, lumaCoef);
        float luma3 = dot(color3, lumaCoef);

        float ghost1 = abs(luma1 - lumaBase) * RED_GHOST_INTENSITY;
        float ghost2 = abs(luma2 - lumaBase) * RED_GHOST_INTENSITY;
        float ghost3 = abs(luma3 - lumaBase) * RED_GHOST_INTENSITY;
        float totalGhost = clamp(ghost1 + ghost2 + ghost3, 0.0, 1.0);

        vec3 grayVideo = vec3(lumaBase);
        grayVideo = clamp((grayVideo - 0.5) * 1.44 + 0.5, 0.0, 1.0);

        vec3 tintedColor = mix(grayVideo, EFFECT_COLOR, totalGhost);
        vec4 finalImage = vec4(tintedColor, originalImage.a);

        vec4 visualDisplacement = displacement;
        visualDisplacement *= 0.5;
        visualDisplacement += 0.5;

        vec4 finalOut = step(0.5, uDisplacement) * visualDisplacement + (1.0 - step(0.5, uDisplacement)) * finalImage;
        gl_FragColor = finalOut;
      }
    `,
    uniforms: {
      uTexture: { value: videoTexture },
      uGrid: { value: gpuCompute.getCurrentRenderTarget(gridVariable).texture },
      uContainerResolution: { value: new THREE.Vector2(width, height) },
      uImageResolution: { value: new THREE.Vector2(1920, 1080) },
      uDisplacement: { value: 0 },
    },
  });

  const geometry = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(width, height, 1);
  scene.add(mesh);

  const useVideoTexture = () => {
    material.uniforms.uImageResolution.value.set(video.videoWidth || 1920, video.videoHeight || 1080);
    video.play().catch(() => {});
  };

  const resize = () => {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || window.innerHeight;
    heroBounds = hero.getBoundingClientRect();
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    mesh.scale.set(width, height, 1);
    material.uniforms.uContainerResolution.value.set(width, height);
    gridVariable.material.uniforms.uGridAspect.value.set(width / height, 1);
    activeFrames = Math.max(activeFrames, 2);
    scheduleTick();
  };

  const pointer = new THREE.Vector2(0, 0);
  const delta = new THREE.Vector2(0, 0);
  const nextPointer = new THREE.Vector2(0, 0);

  const move = (event) => {
    if (event.type === "pointerdown" || !heroBounds.width || !heroBounds.height) {
      heroBounds = hero.getBoundingClientRect();
    }

    const x = (event.clientX - heroBounds.left) / heroBounds.width;
    const y = 1 - (event.clientY - heroBounds.top) / heroBounds.height;
    nextPointer.set(x, y);
    const uniforms = gridVariable.material.uniforms;

    uniforms.uMouseMove.value = 1;
    if (event.type === "pointerdown") {
      uniforms.uMouse.value.copy(nextPointer);
      const angle = Math.random() * Math.PI * 2;
      delta.set(
        100 * Math.cos(angle),
        100 * Math.sin(angle),
      );
      uniforms.uDeltaMouse.value.copy(delta);
    } else if (nextPointer.distanceTo(uniforms.uMouse.value) > 0.002) {
      pointer.copy(nextPointer);
      delta.subVectors(pointer, uniforms.uMouse.value).multiplyScalar(80);
      uniforms.uDeltaMouse.value.copy(delta);
      uniforms.uMouse.value.copy(pointer);
    }

    activeFrames = 70;
    scheduleTick();
  };

  const down = (event) => {
    move(event);
  };

  function scheduleTick() {
    if (document.hidden || !isHeroVisible) {
      return;
    }

    if (activeFrames > 0) {
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
      return;
    }

    if (hasVideoFrameCallback) {
      if (!videoFramePending) {
        videoFramePending = true;
        video.requestVideoFrameCallback((frameTime) => {
          videoFramePending = false;
          tick(frameTime);
        });
      }
      return;
    }

    if (!idleTimer) {
      idleTimer = window.setTimeout(() => {
        idleTimer = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(tick);
        }
      }, idleFrameInterval);
    }
  }

  function tick(now) {
    rafId = 0;

    if (document.hidden || !isHeroVisible) {
      return;
    }

    if (now - lastRenderTime < 4) {
      scheduleTick();
      return;
    }
    lastRenderTime = now;

    const uniforms = gridVariable.material.uniforms;
    let gridUpdated = false;

    if (activeFrames > 0) {
      uniforms.uMouseMove.value *= 0.95;
      uniforms.uDeltaMouse.value.multiplyScalar(0.99999);
      gpuCompute.compute();
      material.uniforms.uGrid.value = gpuCompute.getCurrentRenderTarget(gridVariable).texture;
      activeFrames -= 1;
      gridUpdated = true;
    }

    if (gridUpdated && activeFrames === 0) {
      uniforms.uMouseMove.value = 0;
      uniforms.uDeltaMouse.value.set(0, 0);
      gpuCompute.compute();
      material.uniforms.uGrid.value = gpuCompute.getCurrentRenderTarget(gridVariable).texture;
    }

    renderer.render(scene, camera);
    scheduleTick();
  }

  if (video.videoWidth) {
    useVideoTexture();
  } else {
    video.addEventListener("loadedmetadata", useVideoTexture);
    video.addEventListener("canplay", useVideoTexture, { once: true });
  }

  hero.addEventListener("pointermove", move);
  hero.addEventListener("pointerdown", down);
  hero.addEventListener("pointerenter", () => {
    heroBounds = hero.getBoundingClientRect();
  });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      lastRenderTime = 0;
      activeFrames = Math.max(activeFrames, 2);
      scheduleTick();
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      isHeroVisible = entry.isIntersecting;
      if (isHeroVisible) {
        lastRenderTime = 0;
        activeFrames = Math.max(activeFrames, 2);
        scheduleTick();
      }
    }, { rootMargin: "12% 0px", threshold: 0 });
    observer.observe(hero);
  }

  resize();
  scheduleTick();
});
