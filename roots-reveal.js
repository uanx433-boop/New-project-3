import { Renderer, Program, Mesh, Texture, Triangle } from './node_modules/ogl/src/index.js';

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

float vegetationMask(vec3 color) {
  float greenLead = color.g - max(color.r, color.b);
  float greenEnergy = color.g - ((color.r + color.b) * 0.5);
  float chroma = max(max(color.r, color.g), color.b) - min(min(color.r, color.g), color.b);
  float softGreen = smoothstep(0.04, 0.2, color.g)
    * smoothstep(-0.035, 0.045, color.g - color.r)
    * smoothstep(-0.04, 0.055, color.g - color.b)
    * smoothstep(0.018, 0.13, chroma);

  float saturatedGreen = smoothstep(0.012, 0.095, greenLead)
    * smoothstep(0.018, 0.12, greenEnergy)
    * smoothstep(0.025, 0.16, chroma)
    * smoothstep(0.06, 0.32, color.g);

  return max(saturatedGreen, softGreen);
}

void main() {
  vec2 cover = coverUv(vUv, uResolution, uImageResolution);
  vec4 baseColor = texture2D(uImage, cover);
  float vegetation = vegetationMask(baseColor.rgb);

  float slowTime = uTime * 0.85;
  float broadWind = sin((cover.y * 30.0) + slowTime + sin(cover.x * 13.0));
  float fineWind = sin((cover.y * 57.0) - (slowTime * 0.73) + cos(cover.x * 21.0));
  float lift = cos((cover.x * 31.0) + (slowTime * 0.61) + sin(cover.y * 17.0));
  vec2 wind = vec2(
    ((broadWind * 0.0042) + (fineWind * 0.0014)) * vegetation,
    lift * 0.0012 * vegetation
  );

  vec4 movingColor = texture2D(uImage, cover + wind);
  gl_FragColor = mix(baseColor, movingColor, vegetation);
}
`;

const drawCover = (context, image, width, height) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) * 0.5;
  const y = (height - drawHeight) * 0.5;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, x, y, drawWidth, drawHeight);
};

const isLeafPixel = (r, g, b) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);

  return green > 0.04
    && green - red > -0.035
    && green - blue > -0.04
    && chroma > 0.018;
};

const panel = document.querySelector('#roots');
const revealImage = panel?.querySelector('.roots-reveal-media');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (panel && revealImage && canHover) {
  let pointerX = 0;
  let pointerY = 0;
  let pointerFrame = 0;

  const renderPointer = () => {
    const bounds = panel.getBoundingClientRect();
    panel.style.setProperty('--reveal-x', `${pointerX - bounds.left}px`);
    panel.style.setProperty('--reveal-y', `${pointerY - bounds.top}px`);
    pointerFrame = 0;
  };

  const updatePointer = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
  };

  panel.addEventListener('pointerenter', (event) => {
    updatePointer(event);
    panel.classList.add('is-revealing');
  });

  panel.addEventListener('pointermove', updatePointer, { passive: true });
  panel.addEventListener('pointerleave', () => panel.classList.remove('is-revealing'));

  if (!reduceMotion) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      dpr: pixelRatio
    });
    const gl = renderer.gl;
    const texture = new Texture(gl, {
      generateMipmaps: false,
      flipY: true
    });
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uImage: { value: texture },
        uResolution: { value: new Float32Array([1, 1]) },
        uImageResolution: { value: new Float32Array([1672, 941]) },
        uTime: { value: 0 }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });
    const canvas = gl.canvas;
    canvas.className = 'full-media roots-reveal-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    panel.appendChild(canvas);

    const leafCanvas = document.createElement('canvas');
    const leafContext = leafCanvas.getContext('2d');
    const leafSource = document.createElement('canvas');
    const leafSourceContext = leafSource.getContext('2d');
    leafCanvas.className = 'full-media roots-leaf-motion-canvas';
    leafCanvas.setAttribute('aria-hidden', 'true');
    panel.appendChild(leafCanvas);

    let animationFrame = 0;
    let isVisible = false;
    let isReady = false;
    let leavesReady = false;

    const rebuildLeaves = (image) => {
      const width = gl.canvas.width;
      const height = gl.canvas.height;

      leafCanvas.width = width;
      leafCanvas.height = height;
      leafSource.width = width;
      leafSource.height = height;
      leafCanvas.style.width = '100%';
      leafCanvas.style.height = '100%';

      drawCover(leafSourceContext, image, width, height);
      const pixels = leafSourceContext.getImageData(0, 0, width, height);
      const data = pixels.data;

      for (let index = 0; index < data.length; index += 4) {
        if (isLeafPixel(data[index], data[index + 1], data[index + 2])) {
          data[index + 3] = Math.round(data[index + 3] * 0.78);
        } else {
          data[index + 3] = 0;
        }
      }

      leafSourceContext.putImageData(pixels, 0, 0);
      leavesReady = true;
    };

    const renderLeaves = (time) => {
      if (!leavesReady) return;

      const t = time * 0.001;
      const swayX = Math.sin(t * 1.35) * 3.8 * pixelRatio;
      const swayY = Math.cos(t * 1.05) * 1.6 * pixelRatio;

      leafContext.clearRect(0, 0, leafCanvas.width, leafCanvas.height);
      leafContext.globalAlpha = 0.62;
      leafContext.drawImage(leafSource, swayX, swayY);
      leafContext.globalAlpha = 0.28;
      leafContext.drawImage(leafSource, -swayX * 0.55, -swayY * 0.45);
      leafContext.globalAlpha = 1;
    };

    const resize = () => {
      const width = Math.max(1, panel.clientWidth);
      const height = Math.max(1, panel.clientHeight);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value[0] = gl.canvas.width;
      program.uniforms.uResolution.value[1] = gl.canvas.height;

      if (texture.image) rebuildLeaves(texture.image);
    };

    const render = (time) => {
      if (!isVisible || !isReady) {
        animationFrame = 0;
        return;
      }

      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });
      renderLeaves(time);
      animationFrame = requestAnimationFrame(render);
    };

    const startMotion = () => {
      if (!animationFrame && isVisible && isReady) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    const image = new Image();
    image.src = revealImage.currentSrc || revealImage.src;
    image.onload = () => {
      texture.image = image;
      texture.needsUpdate = true;
      program.uniforms.uImageResolution.value[0] = image.naturalWidth || image.width;
      program.uniforms.uImageResolution.value[1] = image.naturalHeight || image.height;
      resize();
      renderer.render({ scene: mesh });
      renderLeaves(performance.now());
      isReady = true;
      panel.classList.add('is-roots-motion-ready');
      startMotion();
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible) {
        startMotion();
      } else if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }, { threshold: 0.05 });

    visibilityObserver.observe(panel);
    window.addEventListener('resize', resize, { passive: true });
  }
}
