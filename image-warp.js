import { Renderer, Program, Mesh, Texture, Triangle } from 'ogl';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D uImage;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 canvasSize, vec2 imageSize) {
  float canvasRatio = canvasSize.x / canvasSize.y;
  float imageRatio = imageSize.x / imageSize.y;
  vec2 scale = vec2(1.0);

  if (canvasRatio > imageRatio) {
    scale.y = imageRatio / canvasRatio;
  } else {
    scale.x = canvasRatio / imageRatio;
  }

  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 cover = coverUv(vUv, uResolution, uImageResolution);
  vec2 px = vUv * uResolution;
  vec2 mousePx = uMouse * uResolution;
  float dist = distance(px, mousePx);
  float influence = 1.0 - smoothstep(0.0, uRadius, dist);
  influence *= uMouseActive;

  vec2 direction = normalize(px - mousePx + vec2(0.0001));
  float ripple = sin((dist * 0.075) - (uTime * 5.5)) * 0.35 + 0.65;
  vec2 displacement = direction * influence * ripple * uStrength / uResolution;
  vec2 warpedUv = cover + displacement;

  vec4 color = texture2D(uImage, warpedUv);
  float edge = smoothstep(uRadius, uRadius * 0.58, dist);
  color.a *= edge * influence;

  gl_FragColor = color;
}
`;

function initImageWarp(container) {
  if (!container) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const eventTarget = container.closest('[data-hero-depth]') || container;
  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: false
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const texture = new Texture(gl, {
    generateMipmaps: false,
    flipY: true
  });

  const image = new Image();
  image.src = 'assets/person-hero-user-final.png';
  image.onload = () => {
    texture.image = image;
    texture.needsUpdate = true;
    program.uniforms.uImageResolution.value[0] = image.naturalWidth || image.width;
    program.uniforms.uImageResolution.value[1] = image.naturalHeight || image.height;
  };

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uImage: { value: texture },
      uResolution: { value: new Float32Array([1, 1]) },
      uImageResolution: { value: new Float32Array([1280, 720]) },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uMouseActive: { value: 0 },
      uRadius: { value: 150 },
      uStrength: { value: 52 },
      uTime: { value: 0 }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });

  const targetMouse = { x: 0.5, y: 0.5 };
  const smoothMouse = { x: 0.5, y: 0.5 };
  let targetActive = 0;
  let smoothActive = 0;
  let animateId = 0;
  let isAnimating = false;

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, container.offsetWidth);
    const height = Math.max(1, container.offsetHeight);
    renderer.setSize(width * scale, height * scale);
    program.uniforms.uResolution.value[0] = gl.canvas.width;
    program.uniforms.uResolution.value[1] = gl.canvas.height;
    program.uniforms.uRadius.value = Math.min(gl.canvas.width, gl.canvas.height) * 0.14;
    program.uniforms.uStrength.value = Math.min(gl.canvas.width, gl.canvas.height) * 0.065;
  }

  function render(time) {
    smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.08;
    smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.08;
    smoothActive += (targetActive - smoothActive) * 0.08;

    program.uniforms.uMouse.value[0] = smoothMouse.x;
    program.uniforms.uMouse.value[1] = smoothMouse.y;
    program.uniforms.uMouseActive.value = smoothActive;
    program.uniforms.uTime.value = time * 0.001;

    renderer.render({ scene: mesh });

    if (targetActive > 0 || smoothActive > 0.01) {
      animateId = requestAnimationFrame(render);
    } else {
      smoothActive = 0;
      program.uniforms.uMouseActive.value = 0;
      renderer.render({ scene: mesh });
      animateId = 0;
      isAnimating = false;
    }
  }

  function startRenderLoop() {
    if (isAnimating) return;
    isAnimating = true;
    animateId = requestAnimationFrame(render);
  }

  function handleMouseMove(event) {
    const rect = eventTarget.getBoundingClientRect();
    targetMouse.x = (event.clientX - rect.left) / rect.width;
    targetMouse.y = 1.0 - (event.clientY - rect.top) / rect.height;
    targetActive = 1;
    startRenderLoop();
  }

  function handleMouseLeave() {
    targetActive = 0;
    startRenderLoop();
  }

  container.appendChild(gl.canvas);
  resize();
  window.addEventListener('resize', resize, false);
  eventTarget.addEventListener('mousemove', handleMouseMove);
  eventTarget.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    cancelAnimationFrame(animateId);
    window.removeEventListener('resize', resize);
    eventTarget.removeEventListener('mousemove', handleMouseMove);
    eventTarget.removeEventListener('mouseleave', handleMouseLeave);
    gl.canvas.remove();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

const warpField = document.querySelector('[data-image-warp-field]');

if (warpField) {
  initImageWarp(warpField);
}
