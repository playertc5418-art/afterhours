import { s as startup, g as getRenderHost, r as runtime, a as reactExports, p as projects, j as jsxRuntimeExports, l as lockRoomScroll, b as roomJourneyState, e as exitRoom, f as finishRoomTransition } from './index-Cnjb831L.js';
import { D as DataTexture, R as RGBAFormat, H as HalfFloatType, s as CubeUVReflectionMapping, L as LinearSRGBColorSpace, t as LinearFilter, G as Group, u as Texture, a as Scene, v as MeshDepthMaterial, w as DoubleSide, x as BackSide, F as FrontSide, y as RGBADepthPacking, z as InstancedMesh, M as Mesh, h as WebGLRenderTarget, d as Vector3, B as BufferGeometry, E as Float32BufferAttribute, j as ShaderMaterial, n as AdditiveBlending, J as Points, g as LineSegments, k as Vector2, K as MathUtils, b as PerspectiveCamera, O as OrthographicCamera, c as PlaneGeometry, Q as Matrix4, X as Quaternion, Y as UniformsUtils, _ as Euler, $ as Box3, V as Vector4, a0 as HemisphereLight, a1 as DirectionalLight, a2 as Material, a3 as MeshStandardMaterial, a4 as MeshBasicMaterial, a5 as MeshPhysicalMaterial, a6 as PMREMGenerator, i as Color, a7 as BoxGeometry, a8 as CanvasTexture, S as SRGBColorSpace, a9 as RepeatWrapping, f as BufferAttribute, C as CylinderGeometry, aa as Plane, ab as OctahedronGeometry, ac as CircleGeometry, ad as DodecahedronGeometry, ae as CatmullRomCurve3, T as TubeGeometry, af as Shape, ag as ShapeGeometry, ah as ExtrudeGeometry, ai as PointLight, aj as NoColorSpace, ak as TextureLoader, al as Path, am as TorusGeometry, an as SphereGeometry, ao as RingGeometry, ap as Object3D, aq as IcosahedronGeometry, ar as ConeGeometry, as as EdgesGeometry, at as LineBasicMaterial, au as Fog, av as Raycaster, aw as MeshLambertMaterial, A as ACESFilmicToneMapping, P as PCFSoftShadowMap } from './three-C7fIRf5V.js';
import './motion-DpMaEHIX.js';

function bootStep(prefix) {
  let last = performance.now();
  return (name) => {
    const now = performance.now();
    const state = window;
    (state.__bootTimings ??= []).push({ name: prefix + ":" + name, at: last, ms: now - last });
    last = now;
  };
}

const maps = /* @__PURE__ */ new Map();
let loading;
const getBakedEnvironment = (name) => maps.get(name);
function loadBakedEnvironments() {
  return loading ??= new Promise((resolve) => {
    const base = "./opening/environments/";
    for (const name of ["atelier", "gallery"]) startup.resource(base + name + ".bin.gz");
    let worker, timeout, settled = false;
    const finish = (fallback) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker?.terminate();
      for (const name of ["atelier", "gallery"]) startup.settleResource(base + name + ".bin.gz", fallback);
      resolve();
    };
    try {
      worker = new Worker(new URL(/* @vite-ignore */ ""+new URL('environment.worker-CH5BMuaY.js', import.meta.url).href+"", import.meta.url), { type: "module" });
    } catch {
      finish(true);
      return;
    }
    timeout = window.setTimeout(() => {
      console.warn("Baked environment download timed out; using runtime environments.");
      finish(true);
    }, 15e3);
    worker.onmessage = (event) => {
      if (settled) return;
      if (event.data.error) {
        console.warn("Baked environment fallback:", event.data.error);
        finish(true);
        return;
      }
      for (const map of event.data.maps) {
        const texture = new DataTexture(new Uint16Array(map.data), map.width, map.height, RGBAFormat, HalfFloatType);
        texture.mapping = CubeUVReflectionMapping;
        texture.colorSpace = LinearSRGBColorSpace;
        texture.minFilter = texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        texture.name = "BakedEnvironment." + map.name;
        maps.set(map.name, texture);
      }
      finish(false);
    };
    worker.onerror = (event) => {
      console.warn("Environment worker failed:", event.message);
      finish(true);
    };
    worker.postMessage({ base: new URL(base, location.href).href });
  });
}

async function buildIncrementally(steps, name, signal) {
  const host = getRenderHost();
  while (true) {
    if (signal?.aborted) {
      steps.return(void 0);
      throw new DOMException("Preparation cancelled", "AbortError");
    }
    const result = await new Promise((resolve, reject) => host.requestFrame(() => {
      if (signal?.aborted) {
        steps.return(void 0);
        reject(new DOMException("Preparation cancelled", "AbortError"));
        return;
      }
      const start = performance.now();
      try {
        resolve(steps.next());
      } catch (error) {
        reject(error);
      } finally {
        host.metrics.preparationSlices.push({ name, ms: performance.now() - start });
      }
    }));
    if (result.done) return result.value;
  }
}
function nextPreparationFrame(signal) {
  return new Promise((resolve, reject) => getRenderHost().requestFrame(() => {
    if (signal?.aborted) reject(new DOMException("Preparation cancelled", "AbortError"));
    else resolve();
  }));
}

const compiling = /* @__PURE__ */ new Set();
function trackCompilation(compilation) {
  compiling.add(compilation);
  return compilation.finally(() => {
    compiling.delete(compilation);
  });
}
function afterCompilations(release) {
  if (!compiling.size) {
    release();
    return;
  }
  void Promise.allSettled([...compiling]).then(release);
}
async function compileIncrementally(scene, camera, signal, target = null, candidates) {
  const host = getRenderHost(), objects = [], seen = /* @__PURE__ */ new Set();
  const visit = (object) => {
    const mesh = object;
    if (!mesh.isMesh && !mesh.isPoints && !mesh.isLine) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const key = [...materials.map((m) => m.uuid), object.type, !!mesh.isInstancedMesh, !!mesh.instanceColor, !!mesh.isSkinnedMesh, Object.keys(mesh.geometry.attributes).sort().join(","), Object.keys(mesh.geometry.morphAttributes).join(",")].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      objects.push(object);
    }
  };
  if (candidates) candidates.forEach(visit);
  else scene.traverse(visit);
  for (let i = 0; i < objects.length; i += 8) {
    await nextPreparationFrame(signal);
    host.profile("home");
    host.renderer.setRenderTarget(target);
    const group = new Group();
    group.children = objects.slice(i, i + 8);
    const compilation = host.renderer.compileAsync(group, camera, scene);
    compiling.add(compilation);
    host.renderer.setRenderTarget(null);
    try {
      await compilation;
    } finally {
      compiling.delete(compilation);
      group.children = [];
    }
  }
}

async function prepareHero(scene, camera, water, signal) {
  const cancelled = () => signal.aborted;
  const host = getRenderHost(), renderer = host.renderer;
  const textures = /* @__PURE__ */ new Set();
  scene.traverse((object) => {
    const mesh = object;
    if (!mesh.material) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const value of Object.values(material)) if (value instanceof Texture && !value.isRenderTargetTexture) textures.add(value);
    }
  });
  for (const texture of textures) {
    if (cancelled()) return;
    await new Promise((resolve) => host.requestFrame(() => {
      if (!cancelled()) {
        host.profile("home");
        renderer.initTexture(texture);
      }
      resolve();
    }));
  }
  if (cancelled()) return;
  await compileIncrementally(scene, water.camera, signal, water.getRenderTarget());
  if (cancelled()) return;
  const depths = new Scene(), materials = [];
  scene.traverse((object) => {
    if (object.isLight) depths.children.push(object);
  });
  scene.traverse((object) => {
    const mesh = object;
    if (!mesh.isMesh || !mesh.castShadow || !mesh.material) return;
    for (const source of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const m = source;
      if (!m.visible) return;
      const depth = new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        side: m.shadowSide ?? (m.side === DoubleSide ? DoubleSide : m.side === FrontSide ? BackSide : FrontSide),
        map: m.map,
        alphaMap: m.alphaMap,
        alphaTest: m.alphaTest,
        displacementMap: m.displacementMap,
        displacementScale: m.displacementScale,
        displacementBias: m.displacementBias,
        clippingPlanes: m.clippingPlanes,
        clipIntersection: m.clipIntersection,
        clipShadows: m.clipShadows,
        wireframe: m.wireframe
      });
      materials.push(depth);
      const proxy = mesh.isInstancedMesh ? new InstancedMesh(mesh.geometry, depth, 1) : new Mesh(mesh.geometry, depth);
      if (proxy.isInstancedMesh) proxy.instanceColor = mesh.instanceColor;
      proxy.frustumCulled = false;
      depths.add(proxy);
    }
  });
  const target = new WebGLRenderTarget(16, 16);
  const release = () => {
    target.dispose();
    depths.children.forEach((object) => {
      if (object.isInstancedMesh) object.dispose();
    });
    materials.forEach((material) => material.dispose());
  };
  try {
    await compileIncrementally(depths, camera, signal, target);
  } catch (error) {
    release();
    throw error;
  }
  if (cancelled()) {
    release();
    return;
  }
  return release;
}

async function primeScene(scene, camera, signal, name, target = null) {
  const host = getRenderHost(), renderer = host.renderer;
  const objects = [];
  scene.traverseVisible((object) => {
    const mesh = object;
    if (mesh.isMesh || object.isPoints || object.isLine) objects.push({ object, visible: object.visible, frustumCulled: object.frustumCulled });
  });
  try {
    for (let index = 0; index < objects.length; index += 4) {
      await new Promise((resolve, reject) => {
        const draw = () => {
          if (signal.aborted) {
            reject(new DOMException("Preparation cancelled", "AbortError"));
            return;
          }
          if (host.homePaused || document.hidden) {
            host.requestFrame(draw);
            return;
          }
          const start = performance.now(), selected = new Set(objects.slice(index, index + 4).map((entry) => entry.object));
          try {
            for (const entry of objects) {
              entry.object.visible = selected.has(entry.object);
              entry.object.frustumCulled = false;
            }
            host.profile("home");
            renderer.setRenderTarget(target);
            renderer.setViewport(0, 0, 32, 32);
            renderer.setScissor(0, 0, 32, 32);
            renderer.setScissorTest(true);
            renderer.shadowMap.needsUpdate = true;
            renderer.clear(true, true, false);
            renderer.render(scene, camera);
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            for (const entry of objects) {
              entry.object.visible = entry.visible;
              entry.object.frustumCulled = entry.frustumCulled;
            }
            renderer.setRenderTarget(null);
            renderer.setScissorTest(false);
            host.metrics.preparationSlices.push({ name: "prime:" + name, ms: performance.now() - start });
          }
        };
        host.requestFrame(draw);
      });
    }
  } finally {
    for (const entry of objects) {
      entry.object.visible = entry.visible;
      entry.object.frustumCulled = entry.frustumCulled;
    }
  }
}

const vertexShader$2 = "attribute float aRibbon;\r\nuniform float uTime;\r\nuniform float uVelocity;\r\nuniform float uProgress;\r\nuniform float uReduced;\r\nuniform float uPointSize;\r\nuniform float uTwist;\r\nuniform vec2 uMouse;\r\nvarying vec3 vPosition;\r\nvarying vec3 vNormal;\r\nvarying vec3 vLocal;\r\nvarying vec2 vUv;\r\nvarying float vRibbon;\r\nvarying float vTouch;\r\n\r\nvec3 twistY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x - s*p.z, p.y, s*p.x + c*p.z); }\r\n\r\nvoid main() {\r\n  vUv = uv;\r\n  vRibbon = aRibbon;\r\n  float motion = 1.0 - uReduced;\r\n  vec3 p = position;\r\n  vec3 n = normal;\r\n  // 缓慢的呼吸：沿法线的低频波，让金属带像在空气中轻微漂浮。\r\n  float breath = sin(p.y * 1.7 + uTime * 0.6 + aRibbon * 6.283) * 0.018 * motion;\r\n  p += n * breath;\r\n  // 材质研究用的整体扭转（沿高度递增）。\r\n  float angle = uTwist * p.y;\r\n  p = twistY(p, angle); n = twistY(n, angle);\r\n  // 指针局部扰动：在屏幕空间计算距离，所以回应永远发生在光标所在处。\r\n  vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);\r\n  vec2 ndc = clip.xy / max(clip.w, 0.0001);\r\n  float touch = exp(-pow(length(ndc - uMouse) * 3.2, 2.0));\r\n  vTouch = touch;\r\n  float ripple = sin(uv.x * 180.0 - uTime * 7.0);\r\n  p += n * touch * (0.05 + uVelocity * 0.16) * (0.6 + 0.4 * ripple) * motion;\r\n  // 滚动进度：折片沿径向散开，进入“碎裂 → 粒子”状态。\r\n  vec3 radial = normalize(vec3(p.x, 0.0, p.z) + 0.0001);\r\n  float shard = 0.5 + 0.5 * sin(uv.x * 90.0 + aRibbon * 40.0);\r\n  p += (radial * (0.35 + shard * 0.9) + n * 0.25 * shard) * uProgress * motion;\r\n  vLocal = p;\r\n  vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);\r\n  vPosition = viewPosition.xyz;\r\n  vNormal = normalize(normalMatrix * n);\r\n  gl_Position = projectionMatrix * viewPosition;\r\n  gl_PointSize = clamp(uPointSize / max(0.1, -viewPosition.z), 1.0, 6.0);\r\n}\r\n";

const fragmentShader$1 = "uniform float uTime;\r\nuniform float uOpacity;\r\nuniform float uSecret;\r\nuniform float uSlice;\r\nuniform float uRibs;\r\nuniform vec2 uClip;\r\nvarying vec3 vPosition;\r\nvarying vec3 vNormal;\r\nvarying vec3 vLocal;\r\nvarying vec2 vUv;\r\nvarying float vRibbon;\r\nvarying float vTouch;\r\n\r\n// 伪影棚环境：几条柔光箱在反射向量上形成锐利的金属高光带。\r\nfloat softbox(vec3 r, vec3 dir, float width){ return smoothstep(1.0 - width, 1.0, dot(r, normalize(dir))); }\r\n\r\nvoid main() {\r\n  if (uClip.y != 0.0 && (vLocal.y - uClip.x) * uClip.y > 0.0) discard;\r\n  // 切片状态：按高度切成等距薄片。\r\n  if (uSlice > 0.5 && fract(vLocal.y * 9.0) > 0.46) discard;\r\n  vec3 n = normalize(vNormal);\r\n  if (!gl_FrontFacing) n = -n;\r\n  vec3 viewDir = normalize(-vPosition);\r\n  // 折片肋条：沿带长度方向的高频法线扰动，产生细密的明暗褶皱。\r\n  float rib = sin(vUv.x * 6.283185 * uRibs * 0.5);\r\n  float ribMask = 0.35 + 0.65 * pow(abs(vUv.y * 2.0 - 1.0), 0.6);\r\n  n = normalize(n + vec3(0.0, rib * 0.055 * ribMask, 0.0));\r\n  vec3 r = reflect(-viewDir, n);\r\n  float key = softbox(r, vec3(-0.55, 0.75, 0.6), 0.24);\r\n  float strip = softbox(r, vec3(0.8, 0.15, 0.55), 0.05);\r\n  float top = softbox(r, vec3(0.0, 1.0, 0.1), 0.35);\r\n  float floorBounce = softbox(r, vec3(0.2, -1.0, 0.3), 0.5);\r\n  float fresnel = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.0);\r\n  float diffuse = max(dot(n, normalize(vec3(-0.4, 0.8, 0.7))), 0.0);\r\n  vec3 base = vec3(0.045, 0.047, 0.05);\r\n  vec3 steel = vec3(0.92, 0.93, 0.95);\r\n  float broad = softbox(r, vec3(-0.9, 0.2, 0.65), 0.38);\r\n  vec3 color = base + steel * (diffuse * 0.08 + key * 1.6 + strip * 2.2 + top * 0.32 + broad * 0.45 + floorBounce * 0.045 + fresnel * 0.22);\r\n  // 肋条的明暗交替。\r\n  color *= 0.9 + 0.1 * (0.5 + 0.5 * rib);\r\n  // 指针靠近处出现极细的酸绿色边缘光，作为“输入”的反馈。\r\n  color += vec3(0.77, 0.96, 0.4) * vTouch * fresnel * 0.55;\r\n  color = mix(color, color * vec3(0.78, 1.0, 0.42), uSecret);\r\n  // 带的边缘与两端做抗锯齿淡出，避免硬切口。\r\n  float edge = smoothstep(0.0, 0.02, vUv.y) * smoothstep(0.0, 0.02, 1.0 - vUv.y);\r\n  float ends = smoothstep(0.0, 0.03, vUv.x) * smoothstep(0.0, 0.03, 1.0 - vUv.x);\r\n  gl_FragColor = vec4(color, uOpacity * edge * ends);\r\n  #include <tonemapping_fragment>\r\n  #include <colorspace_fragment>\r\n}\r\n";

const pointFragment$1 = "uniform float uOpacity;\r\nuniform float uSecret;\r\nuniform vec2 uClip;\r\nvarying vec2 vUv;\r\nvarying vec3 vLocal;\r\nvarying float vTouch;\r\nvoid main(){\r\n  if (uClip.y != 0.0 && (vLocal.y - uClip.x) * uClip.y > 0.0) discard;\r\n  float d = length(gl_PointCoord - 0.5);\r\n  if (d > 0.5) discard;\r\n  vec3 color = mix(vec3(0.86, 0.88, 0.9), vec3(0.77, 0.96, 0.4), max(vTouch * 0.7, uSecret));\r\n  gl_FragColor = vec4(color, smoothstep(0.5, 0.1, d) * uOpacity * (0.55 + 0.45 * sin(vUv.x * 300.0)));\r\n}\r\n";

const lineFragment$1 = "uniform float uOpacity;\r\nuniform float uSecret;\r\nuniform float uTime;\r\nuniform vec2 uClip;\r\nvarying vec3 vLocal;\r\nvarying float vTouch;\r\nvoid main(){\r\n  if (uClip.y != 0.0 && (vLocal.y - uClip.x) * uClip.y > 0.0) discard;\r\n  // 一条扫描光沿主轴向上移动，强调结构的竖向势能。\r\n  float scan = smoothstep(0.35, 0.0, abs(fract(vLocal.y * 0.12 - uTime * 0.08) - 0.5) - 0.12);\r\n  vec3 color = mix(vec3(0.55, 0.58, 0.6), vec3(0.77, 0.96, 0.4), max(max(scan * 0.55, vTouch), uSecret));\r\n  gl_FragColor = vec4(color, uOpacity * (0.35 + 0.65 * scan));\r\n}\r\n";

const LITE_DETAIL = { ribbons: 3, rows: 480, columns: 14, pleats: 72 };
const HEIGHT = 5.6;
function* createArtifactGeometrySteps(detail) {
  const { ribbons, rows, columns, pleats } = detail;
  const positions = [], uvs = [], ribbon = [], indices = [];
  const out = new Vector3(), tangent = new Vector3(), radial = new Vector3();
  const axisA = new Vector3(), axisB = new Vector3(), side = new Vector3(), normal = new Vector3();
  const p = new Vector3(), a = new Vector3(), b = new Vector3();
  for (let k = 0; k < ribbons; k++) {
    const seed = k / ribbons;
    const y0 = -HEIGHT / 2 + [0, 0.28, 0.5][k % 3];
    const y1 = HEIGHT / 2 - [0, 0.32, 0.7][k % 3];
    const phase = [0.12, 2.78, 4.62][k % 3];
    const widthScale = [0.95, 0.84, 0.42][k % 3];
    const center = (s, target) => {
      const y = y0 + (y1 - y0) * s;
      const theta = phase + s * Math.PI * 1.65 + 0.18 * Math.sin(s * Math.PI * 2);
      const waist = 0.7 + 0.3 * Math.pow(Math.cos((s - 0.48) * Math.PI), 2);
      const r = (0.24 + 0.42 * Math.pow(Math.sin(Math.PI * s), 0.8)) * waist;
      const spine = 0.2 * Math.sin(s * Math.PI * 2 - 0.4);
      return target.set(spine + r * Math.cos(theta), y, r * Math.sin(theta));
    };
    const base = positions.length / 3;
    for (let i = 0; i <= rows; i++) {
      const s = i / rows;
      center(s, p);
      tangent.copy(center(Math.min(1, s + 2e-3), a)).sub(center(Math.max(0, s - 2e-3), b)).normalize();
      const theta = phase + s * Math.PI * 1.65 + 0.18 * Math.sin(s * Math.PI * 2);
      radial.set(Math.cos(theta), 0, Math.sin(theta));
      axisA.copy(radial).addScaledVector(tangent, -radial.dot(tangent)).normalize();
      axisB.crossVectors(tangent, axisA).normalize();
      const twist = 0.28 * Math.sin(s * Math.PI * 2 - 0.8) + (k === 2 ? 0.45 : -0.15);
      side.copy(axisA).multiplyScalar(Math.cos(twist)).addScaledVector(axisB, Math.sin(twist));
      normal.crossVectors(tangent, side).normalize();
      const taper = Math.pow(Math.sin(Math.PI * s), 0.48);
      const width = widthScale * taper * (0.88 + 0.12 * Math.cos(s * Math.PI * 2));
      const fold = Math.sin(s * Math.PI * 2 * pleats);
      for (let j = 0; j <= columns; j++) {
        const v = j / columns * 2 - 1;
        const pleat = fold * width * 0.035 * (0.25 + 0.75 * Math.abs(v));
        const cup = v * v * width * 0.32;
        out.copy(p).addScaledVector(side, v * width).addScaledVector(normal, pleat + cup);
        positions.push(out.x, out.y, out.z);
        uvs.push(s, (v + 1) / 2);
        ribbon.push(seed);
        if (i < rows && j < columns) {
          const q = base + i * (columns + 1) + j;
          indices.push(q, q + 1, q + columns + 1, q + 1, q + columns + 2, q + columns + 1);
        }
      }
      if (i % 64 === 63) yield;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("aRibbon", new Float32BufferAttribute(ribbon, 1));
  geometry.setIndex(indices);
  yield;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData = { ...detail };
  return geometry;
}
function createArtifactGeometry(detail) {
  const steps = createArtifactGeometrySteps(detail);
  let result = steps.next();
  while (!result.done) result = steps.next();
  return result.value;
}
async function prepareArtifact(detail, signal) {
  const geometry = await buildIncrementally(createArtifactGeometrySteps(detail), "artifact", signal);
  if (signal.aborted) {
    geometry.dispose();
    throw new DOMException("Preparation cancelled", "AbortError");
  }
  return createArtifact(detail, geometry);
}
function createArtifactUniforms(pleats) {
  return {
    uTime: { value: 0 },
    uVelocity: { value: 0 },
    uProgress: { value: 0 },
    uMouse: { value: new Vector2(9, 9) },
    uReduced: { value: 0 },
    uOpacity: { value: 1 },
    uSecret: { value: 0 },
    uPointSize: { value: 9 },
    uTwist: { value: 0 },
    uSlice: { value: 0 },
    uClip: { value: new Vector2(0, 0) },
    uRibs: { value: pleats * 2 }
  };
}
function createPointGeometry(source, step) {
  const g = new BufferGeometry(), keys = ["position", "normal", "uv", "aRibbon"];
  const out = { position: [], normal: [], uv: [], aRibbon: [] };
  const count = source.attributes.position.count;
  for (let i = 0; i < count; i += step) for (const key of keys) {
    const attr = source.attributes[key];
    for (let c = 0; c < attr.itemSize; c++) out[key].push(attr.array[i * attr.itemSize + c]);
  }
  keys.forEach((key) => g.setAttribute(key, new Float32BufferAttribute(out[key], source.attributes[key].itemSize)));
  return g;
}
function createLineGeometry(source) {
  const { ribbons, rows, columns } = source.userData;
  const stride = columns + 1, perRibbon = (rows + 1) * stride, indices = [];
  const rowStep = Math.max(4, Math.round(rows / 110));
  for (let k = 0; k < ribbons; k++) {
    const base = k * perRibbon;
    for (let i = 0; i <= rows; i += rowStep) for (let j = 0; j < columns; j++) indices.push(base + i * stride + j, base + i * stride + j + 1);
    for (const j of [0, Math.floor(columns / 2), columns]) for (let i = 0; i < rows; i += 2) indices.push(base + i * stride + j, base + Math.min(rows, i + 2) * stride + j);
  }
  const g = new BufferGeometry();
  ["position", "normal", "uv", "aRibbon"].forEach((key) => g.setAttribute(key, source.attributes[key]));
  g.setIndex(indices);
  return g;
}
function createArtifact(detail, geometry = createArtifactGeometry(detail)) {
  const uniforms = createArtifactUniforms(detail.pleats), pointUniforms = createArtifactUniforms(detail.pleats), lineUniforms = createArtifactUniforms(detail.pleats);
  const material = new ShaderMaterial({ vertexShader: vertexShader$2, fragmentShader: fragmentShader$1, uniforms, side: DoubleSide, transparent: true });
  const mesh = new Mesh(geometry, material);
  const pointGeometry = createPointGeometry(geometry, 3);
  const pointMaterial = new ShaderMaterial({ vertexShader: vertexShader$2, fragmentShader: pointFragment$1, uniforms: pointUniforms, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const points = new Points(pointGeometry, pointMaterial);
  const lineGeometry = createLineGeometry(geometry);
  const lineMaterial = new ShaderMaterial({ vertexShader: vertexShader$2, fragmentShader: lineFragment$1, uniforms: lineUniforms, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const lines = new LineSegments(lineGeometry, lineMaterial);
  const group = new Group();
  group.add(mesh, points, lines);
  const all = [uniforms, pointUniforms, lineUniforms];
  const sync = (time, velocity, progress, reduced, secret, twist, mouse) => {
    for (const u of all) {
      u.uTime.value = time;
      u.uVelocity.value = velocity;
      u.uProgress.value = progress;
      u.uReduced.value = reduced;
      u.uSecret.value = secret;
      u.uTwist.value = twist;
      u.uMouse.value.copy(mouse);
    }
  };
  const setOpacity = (solid, line, point) => {
    uniforms.uOpacity.value = solid;
    lineUniforms.uOpacity.value = line;
    pointUniforms.uOpacity.value = point;
    mesh.visible = solid > 0.01;
    lines.visible = line > 0.01;
    points.visible = point > 0.01;
  };
  const dispose = () => {
    geometry.dispose();
    pointGeometry.dispose();
    lineGeometry.dispose();
    material.dispose();
    pointMaterial.dispose();
    lineMaterial.dispose();
  };
  return { group, mesh, points, lines, uniforms, pointUniforms, lineUniforms, sync, setOpacity, dispose };
}

const MATERIAL_MODES = [[1, 0.85, 0.75, 0], [1, 0, 0, 0], [0, 1, 0, 0], [1, 0.2, 0, 1], [0, 0.1, 1, 0]];
const modeMix = (mode) => {
  const t = MATERIAL_MODES[mode] ?? MATERIAL_MODES[0];
  return { solid: t[0], line: t[1], point: t[2] };
};
function applyMode(a, mix, mode, opacity, dt, clip) {
  const t = MATERIAL_MODES[mode] ?? MATERIAL_MODES[0];
  mix.solid = MathUtils.damp(mix.solid, t[0], 7, dt);
  mix.line = MathUtils.damp(mix.line, t[1], 7, dt);
  mix.point = MathUtils.damp(mix.point, t[2], 7, dt);
  a.setOpacity(mix.solid * opacity, mix.line * opacity, mix.point * opacity);
  a.uniforms.uSlice.value = t[3];
  [a.uniforms, a.lineUniforms, a.pointUniforms].forEach((u, i) => u.uClip.value.set(clip ?? 0, clip === null ? 0 : i === 0 ? -1 : 1));
}
function readMaterialPose(a, mode, revision = 0) {
  return {
    mode,
    mix: { solid: a.uniforms.uOpacity.value, line: a.lineUniforms.uOpacity.value, point: a.pointUniforms.uOpacity.value },
    clips: [a.uniforms, a.lineUniforms, a.pointUniforms].map((u) => u.uClip.value.toArray()),
    slice: a.uniforms.uSlice.value,
    time: a.uniforms.uTime.value,
    twist: a.uniforms.uTwist.value,
    rotation: a.group.rotation.y,
    revision
  };
}
function writeMaterialPose(a, mix, pose) {
  Object.assign(mix, pose.mix);
  a.setOpacity(mix.solid, mix.line, mix.point);
  [a.uniforms, a.lineUniforms, a.pointUniforms].forEach((u, i) => {
    u.uClip.value.fromArray(pose.clips[i]);
    u.uTime.value = pose.time;
    u.uTwist.value = pose.twist;
  });
  a.uniforms.uSlice.value = pose.slice;
  a.group.rotation.y = pose.rotation;
}

const smooth$4 = (a, b, x) => MathUtils.smoothstep(x, a, b);
function createObjectHandoff(atelier, getPointSize) {
  const scene = new Scene(), camera = new PerspectiveCamera(35, 1, 0.05, 90);
  camera.layers.enable(1);
  const backdropScene = new Scene(), backdropCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const backdropUniforms = { uOpacity: { value: 0 }, uTime: { value: 0 } };
  const backdropMaterial = new ShaderMaterial({
    uniforms: backdropUniforms,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `varying vec2 vUv;uniform float uOpacity;uniform float uTime;
      void main(){
        vec2 p=vUv-.5;
        float glow=exp(-length(p*vec2(.82,1.25))*3.1);
        float floor=smoothstep(.62,.0,vUv.y);
        vec3 col=mix(vec3(.015,.013,.011),vec3(.135,.082,.043),glow);
        col+=vec3(.055,.034,.019)*floor*glow;
        float vig=smoothstep(1.05,.35,length(p));
        col*=mix(.42,1.,vig);
        gl_FragColor=vec4(col,uOpacity);
      }`
  });
  const backdrop = new Mesh(new PlaneGeometry(2, 2), backdropMaterial);
  backdrop.frustumCulled = false;
  backdropScene.add(backdrop);
  const startCamera = new PerspectiveCamera(), startPosition = new Vector3(), startScale = new Vector3(), startQuat = new Quaternion();
  const endPosition = new Vector3(), endScale = new Vector3(), endQuat = new Quaternion();
  const destinationCamera = new Vector3(0, 0, 9), identity = new Quaternion();
  const slotCamera = new PerspectiveCamera(35, 1, 0.1, 40), viewport = new Matrix4(), slotProjection = new Matrix4();
  let object = null, source = null;
  let materialArtifact = null;
  let rotation = 0, started = 0;
  let visual = null;
  const owned = [];
  const reset = () => {
    if (source) source.visible = true;
    if (object) scene.remove(object);
    owned.forEach((m) => m.dispose());
    owned.length = 0;
    object = null;
    source = null;
    materialArtifact = null;
    visual = null;
  };
  const render = (renderer, view, width, height, elapsed) => {
    const handoff = runtime.objectHandoff;
    if (!handoff || handoff.kind !== "lab") {
      if (object) reset();
      return;
    }
    if (!object) {
      reset();
      source = atelier.installation.group;
      source.updateWorldMatrix(true, true);
      object = source.clone(true);
      source.matrixWorld.decompose(startPosition, startQuat, startScale);
      object.position.copy(startPosition);
      object.quaternion.copy(startQuat);
      object.scale.copy(startScale);
      object.traverse((o) => {
        const mesh2 = o;
        if (!mesh2.material) return;
        const original = mesh2.material, material = original.clone();
        if (original instanceof ShaderMaterial && material instanceof ShaderMaterial) material.uniforms = UniformsUtils.clone(original.uniforms);
        mesh2.material = material;
        owned.push(material);
      });
      const mesh = object.children.find((o) => o instanceof Mesh);
      const lines = object.children.find((o) => o instanceof LineSegments);
      const points = object.children.find((o) => o instanceof Points);
      if (mesh && lines && points) materialArtifact = { group: object, uniforms: mesh.material.uniforms, lineUniforms: lines.material.uniforms, pointUniforms: points.material.uniforms, setOpacity: (solid, line, point) => {
        for (const [o, value] of [[mesh, solid], [lines, line], [points, point]]) {
          o.material.uniforms.uOpacity.value = value;
          o.visible = value > 0.01;
        }
      } };
      scene.add(object);
      source.visible = false;
      startCamera.copy(view);
      startCamera.updateMatrixWorld();
      runtime.labPose = { rotation: atelier.installation.group.rotation.y, twist: atelier.installation.uniforms.uTwist.value, time: elapsed };
      rotation = runtime.labPose.rotation;
      started = elapsed;
    }
    const element = document.querySelector("[data-lab-visual]");
    if (!element) return;
    const p = handoff.progress, halfH = Math.tan(MathUtils.degToRad(17.5)) * 9, halfW = halfH * width / height;
    const rect = element.getBoundingClientRect(), header = document.querySelector("header")?.getBoundingClientRect().height ?? 90;
    const top = handoff.committed ? rect.top : header + 16;
    endPosition.set(0, 0, 0);
    slotCamera.aspect = rect.width / rect.height;
    slotCamera.updateProjectionMatrix();
    viewport.set(rect.width / width, 0, 0, (rect.left + rect.width / 2) / width * 2 - 1, 0, rect.height / height, 0, 1 - (top + rect.height / 2) / height * 2, 0, 0, 1, 0, 0, 0, 0, 1);
    slotProjection.multiplyMatrices(viewport, slotCamera.projectionMatrix);
    const fit = Math.min(1, halfH * 2 * 0.9 / HEIGHT, halfH * 2 * rect.width / rect.height * 0.72 / 2.6);
    endScale.setScalar(fit);
    const spin = rotation + (elapsed - started) * 0.16;
    endQuat.setFromEuler(new Euler(0, spin, 0));
    if (runtime.labPose) {
      runtime.labPose.rotation = spin;
      runtime.labPose.time = elapsed;
    }
    const m = smooth$4(0.06, 0.43, p), landing = smooth$4(0.54, 0.9, p), structure = smooth$4(0.2, 0.4, p) * (1 - smooth$4(0.5, 0.72, p));
    const centerScale = new Vector3().setScalar(Math.min(halfH * 2 * 0.64 / HEIGHT, halfW * 2 * 0.62 / 2.6));
    if (materialArtifact) {
      if (getPointSize) materialArtifact.pointUniforms.uPointSize.value = getPointSize();
      const target = modeMix(runtime.material), arrival = smooth$4(0.68, 1, p);
      applyMode(materialArtifact, target, runtime.material, 1, 0, runtime.material === 0 ? MathUtils.lerp(-HEIGHT / 2 - 0.1, 0, arrival) : null);
      materialArtifact.setOpacity(MathUtils.lerp(1 - structure * 0.22, target.solid, arrival), MathUtils.lerp(structure * 0.35, target.line, arrival), target.point * arrival);
      for (const u of [materialArtifact.uniforms, materialArtifact.lineUniforms, materialArtifact.pointUniforms]) u.uTime.value = elapsed;
    }
    object.position.lerpVectors(startPosition, new Vector3(), m).lerp(endPosition, landing);
    object.quaternion.slerpQuaternions(startQuat, endQuat, m);
    object.scale.lerpVectors(startScale, centerScale, m).lerp(endScale, landing);
    if (materialArtifact) runtime.labMaterialPose = readMaterialPose(materialArtifact, runtime.material, elapsed * 1e3);
    camera.copy(startCamera);
    camera.aspect = width / height;
    camera.position.lerp(destinationCamera, m);
    camera.quaternion.slerp(identity, m);
    camera.updateProjectionMatrix();
    camera.projectionMatrix.elements[8] = startCamera.projectionMatrix.elements[8] * (1 - m);
    camera.projectionMatrix.elements[9] = startCamera.projectionMatrix.elements[9] * (1 - m);
    for (let i = 0; i < 16; i++) camera.projectionMatrix.elements[i] = MathUtils.lerp(camera.projectionMatrix.elements[i], slotProjection.elements[i], landing);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    renderer.setViewport(0, 0, width, height);
    renderer.setScissorTest(false);
    backdropUniforms.uOpacity.value = smooth$4(0, 0.16, p) * (1 - smooth$4(0.78, 1, p));
    backdropUniforms.uTime.value = elapsed;
    renderer.render(backdropScene, backdropCamera);
    renderer.clearDepth();
    renderer.render(scene, camera);
    object.userData.handoffProgress = p;
    const bounds = new Box3().setFromObject(object), projected = new Vector3(), xs = [], ys = [];
    for (let i = 0; i < 8; i++) {
      projected.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z).project(camera);
      xs.push((projected.x + 1) * width / 2);
      ys.push((1 - projected.y) * height / 2);
    }
    const left = Math.min(...xs), right = Math.max(...xs), topY = Math.min(...ys), bottom = Math.max(...ys);
    visual = { kind: "lab", visible: true, progress: p, center: { x: (left + right) / 2, y: (topY + bottom) / 2 }, width: right - left, height: bottom - topY, rotation: spin, pointSize: materialArtifact?.pointUniforms.uPointSize.value ?? 0 };
  };
  return { render, dispose() {
    reset();
    backdropMaterial.dispose();
    backdrop.geometry.dispose();
  }, snapshot: () => visual };
}

const smooth$3 = (a, b, x) => MathUtils.smoothstep(x, a, b);
function createDeskHandoff(atelier, stage) {
  const scene = new Scene(), camera = new PerspectiveCamera();
  scene.name = "DeskHandoff";
  camera.layers.enable(1);
  const sourceActor = new Group(), destinationActor = new Group(), sharedActor = new Group();
  scene.add(sourceActor, destinationActor, sharedActor);
  const edgeUniforms = { uSlot: { value: new Vector4() }, uAlpha: { value: 0 } };
  const edgeMaterial = new ShaderMaterial({
    uniforms: edgeUniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `varying vec2 vUv;uniform vec4 uSlot;uniform float uAlpha;
      void main(){vec2 uv=(vUv-uSlot.xy)/uSlot.zw;
        if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))discard;
        float vertical=min(1.,uv.y/.09)*min(1.,(1.-uv.y)/.14);
        float horizontal=1.;
        gl_FragColor=vec4(vec3(8./255.),(1.-vertical*horizontal)*uAlpha);}`
  });
  const edgeMask = new Mesh(new PlaneGeometry(2, 2), edgeMaterial);
  edgeMask.frustumCulled = false;
  edgeMask.renderOrder = 1e3;
  scene.add(edgeMask);
  const startCamera = new PerspectiveCamera(), focusCamera = new PerspectiveCamera();
  const endScale = new Vector3(5.65 / 1.7, 5.65 / 1.7, 5.65 / 1.7);
  const startDirection = new Vector3(), endDirection = new Vector3(), orbit = new Quaternion(), turn = new Quaternion();
  const aim = new Vector3(), focusAim = new Vector3(0, 0.1, 0), endAim = new Vector3(0, 0.45, 0), direction = new Vector3();
  const axisRight = new Vector3(), up = new Vector3(), relative = new Vector3(), desired = new Vector3();
  let startDistance = 1, endDistance = 1;
  const materials = [];
  const instances = [];
  const lights = [];
  const fill = new HemisphereLight(11978199, 2629914, 1.6);
  const key = new DirectionalLight(16764060, 2.5);
  key.position.set(-2, 6, 4);
  scene.add(fill, key);
  const viewport = new Matrix4(), endProjection = new Matrix4(), focusProjection = new Matrix4();
  let active = false, actorsReady = false;
  const bindings = [];
  let visual = null;
  const reset = () => {
    atelier.officeDesk.visible = true;
    active = false;
    visual = null;
  };
  const clone = (source, side) => {
    const object = source.clone(true), cache = /* @__PURE__ */ new Map();
    const material = (original) => {
      let next = cache.get(original);
      if (!next) {
        next = original.clone();
        next.transparent = side === "shared" ? original.transparent : true;
        if (original.userData.fadePatched) {
          next.onBeforeCompile = Material.prototype.onBeforeCompile;
          next.customProgramCacheKey = Material.prototype.customProgramCacheKey;
          delete next.userData.fadePatched;
        } else {
          next.onBeforeCompile = original.onBeforeCompile;
          next.customProgramCacheKey = original.customProgramCacheKey;
        }
        if (original instanceof ShaderMaterial && next.isShaderMaterial) next.uniforms = UniformsUtils.clone(original.uniforms);
        materials.push({ original, material: next, opacity: original.opacity, depthWrite: original.depthWrite, side });
        cache.set(original, next);
      }
      return next;
    };
    const originals = [];
    source.traverse((child) => originals.push(child));
    let index = 0;
    object.traverse((child) => {
      bindings.push({ original: originals[index++], copy: child });
      const mesh = child;
      if (child.isInstancedMesh) instances.push(child);
      if (mesh.material) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(material) : material(mesh.material);
      if (child.isLight) {
        const light = child;
        light.castShadow = false;
        lights.push({ light, intensity: light.intensity });
      }
    });
    return object;
  };
  const releaseActors = () => {
    const oldInstances = instances.splice(0), oldMaterials = materials.splice(0);
    sourceActor.clear();
    destinationActor.clear();
    sharedActor.clear();
    bindings.length = 0;
    lights.length = 0;
    actorsReady = false;
    afterCompilations(() => {
      oldInstances.forEach((mesh) => mesh.dispose());
      oldMaterials.forEach((record) => record.material.dispose());
    });
  };
  const hideDuplicates = () => {
    sharedActor.getObjectByName("Desk.Table").visible = false;
    for (const name of ["Desk.BlackHole", "Desk.Xiaojian", "Desk.Gravity"]) {
      sourceActor.getObjectByName(name).visible = false;
      destinationActor.getObjectByName(name).visible = false;
    }
  };
  function* actorSteps() {
    if (actorsReady) return;
    let complete = false;
    try {
      sourceActor.add(clone(atelier.officeDesk, "source"));
      yield;
      sharedActor.add(clone(atelier.officeDesk, "shared"));
      yield;
      destinationActor.add(clone(stage.scene, "destination"));
      yield;
      scene.environment = stage.scene.environment;
      scene.environmentIntensity = stage.scene.environmentIntensity;
      hideDuplicates();
      actorsReady = true;
      complete = true;
    } finally {
      if (!complete) releaseActors();
    }
  }
  const prepare = async (signal) => {
    await buildIncrementally(actorSteps(), "desk-handoff-actors", signal);
    sourceActor.visible = true;
    sharedActor.visible = true;
    destinationActor.visible = false;
    await compileIncrementally(scene, camera, signal);
    await primeScene(scene, camera, signal, "desk-source");
    destinationActor.visible = true;
    for (const record of materials) if (record.side !== "shared") {
      record.material.opacity = record.opacity * 0.5;
      record.material.depthWrite = false;
    }
    await compileIncrementally(scene, camera, signal);
    await primeScene(scene, camera, signal, "desk-gallery");
    for (const record of materials) {
      record.material.opacity = record.opacity;
      record.material.depthWrite = record.depthWrite;
    }
    destinationActor.visible = false;
  };
  const render = (renderer, view, width, height) => {
    const handoff = runtime.objectHandoff;
    if (!handoff || handoff.kind !== "desk") {
      if (active) reset();
      return;
    }
    const slot = document.querySelector("[data-about-visual]"), section = document.getElementById("about");
    if (!slot || !section) return;
    const rect = slot.getBoundingClientRect();
    if (!active) {
      reset();
      stage.prepareHandoff(rect.width / rect.height);
      if (!actorsReady) {
        const steps = actorSteps();
        while (!steps.next().done) {
        }
      }
      for (const { original, copy } of bindings) {
        copy.position.copy(original.position);
        copy.quaternion.copy(original.quaternion);
        copy.scale.copy(original.scale);
        copy.visible = original.visible;
      }
      for (const record of materials) {
        const from = record.original, to = record.material;
        if (from.color && to.color) to.color.copy(from.color);
        if (from.emissive && to.emissive) to.emissive.copy(from.emissive);
        if (from.emissiveIntensity !== void 0) to.emissiveIntensity = from.emissiveIntensity;
        record.opacity = from.opacity;
      }
      atelier.group.updateMatrixWorld(true);
      const frame = atelier.group.matrixWorld.clone().multiply(atelier.deskFrame);
      const source = sourceActor.children[0], shared = sharedActor.children[0];
      source.matrix.copy(frame.clone().invert().multiply(atelier.officeDesk.matrixWorld));
      source.matrixAutoUpdate = false;
      source.visible = true;
      shared.matrix.copy(source.matrix);
      shared.matrixAutoUpdate = false;
      shared.visible = true;
      sourceActor.position.set(0, 0, 0);
      sourceActor.quaternion.identity();
      sourceActor.scale.copy(endScale);
      sharedActor.scale.copy(endScale);
      sourceActor.visible = true;
      sharedActor.visible = true;
      hideDuplicates();
      atelier.officeDesk.visible = false;
      startCamera.copy(view);
      const alignment = new Matrix4().makeScale(endScale.x, endScale.y, endScale.z).multiply(frame.clone().invert()).multiply(view.matrixWorld);
      alignment.decompose(startCamera.position, startCamera.quaternion, new Vector3());
      startCamera.scale.setScalar(1);
      startCamera.updateMatrixWorld();
      startDirection.copy(startCamera.position).sub(focusAim);
      startDistance = startDirection.length();
      startDirection.normalize();
      endDirection.copy(stage.camera.position).sub(endAim);
      endDistance = endDirection.length();
      endDirection.normalize();
      orbit.setFromUnitVectors(startDirection, endDirection);
      focusCamera.copy(view);
      focusProjection.copy(startCamera.projectionMatrix);
      focusProjection.elements[8] = 0;
      focusProjection.elements[9] = 0;
      active = true;
    }
    const p = handoff.progress, zoom = smooth$3(0, 0.2, p), move = smooth$3(0.22, 0.86, p), blend = smooth$3(0.55, 0.87, p);
    const header = document.querySelector("header")?.getBoundingClientRect().height ?? 90;
    const pinnedRoom = section.closest(".room-journey")?.dataset.roomMode === "animated";
    const top = handoff.committed ? rect.top : (pinnedRoom ? 0 : header + 16) + rect.top - section.getBoundingClientRect().top;
    edgeUniforms.uSlot.value.set(rect.left / width, 1 - (top + rect.height) / height, rect.width / width, rect.height / height);
    edgeUniforms.uAlpha.value = smooth$3(0.55, 0.87, p);
    viewport.set(rect.width / width, 0, 0, (rect.left + rect.width / 2) / width * 2 - 1, 0, rect.height / height, 0, 1 - (top + rect.height / 2) / height * 2, 0, 0, 1, 0, 0, 0, 0, 1);
    endProjection.multiplyMatrices(viewport, stage.camera.projectionMatrix);
    direction.copy(startDirection).applyQuaternion(turn.identity().slerp(orbit, move));
    aim.lerpVectors(focusAim, endAim, move);
    sourceActor.updateMatrixWorld(true);
    const sourceBounds = new Box3().setFromObject(sourceActor);
    axisRight.crossVectors(new Vector3(0, 1, 0), direction).normalize();
    up.crossVectors(direction, axisRight);
    const tangent = Math.tan(MathUtils.degToRad(17.5));
    let focusDistance = 0;
    for (let i = 0; i < 8; i++) {
      relative.set(i & 1 ? sourceBounds.max.x : sourceBounds.min.x, i & 2 ? sourceBounds.max.y : sourceBounds.min.y, i & 4 ? sourceBounds.max.z : sourceBounds.min.z).sub(aim);
      focusDistance = Math.max(focusDistance, relative.dot(direction) + Math.max(Math.abs(relative.dot(axisRight)) / (tangent * width / height * 0.74), Math.abs(relative.dot(up)) / (tangent * 0.7)));
    }
    const distance = MathUtils.lerp(MathUtils.lerp(startDistance, focusDistance, zoom), endDistance, move);
    desired.copy(aim).addScaledVector(direction, distance);
    camera.position.lerpVectors(startCamera.position, desired, zoom);
    focusCamera.position.copy(camera.position);
    focusCamera.lookAt(aim);
    camera.quaternion.slerpQuaternions(startCamera.quaternion, focusCamera.quaternion, zoom);
    for (let i = 0; i < 16; i++) {
      const focused = MathUtils.lerp(startCamera.projectionMatrix.elements[i], focusProjection.elements[i], zoom);
      camera.projectionMatrix.elements[i] = MathUtils.lerp(focused, endProjection.elements[i], move);
    }
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    sourceActor.visible = blend < 1;
    destinationActor.visible = blend > 0;
    for (const record of materials) {
      const alpha = record.side === "shared" ? 1 : record.side === "source" ? 1 - smooth$3(0.42, 0.75, p) : blend;
      record.material.opacity = record.opacity * alpha;
      record.material.depthWrite = alpha > 0.98 ? record.depthWrite : false;
    }
    lights.forEach((record) => {
      record.light.intensity = record.intensity * blend;
    });
    fill.intensity = 1.6 * (1 - blend);
    key.intensity = 2.5 * (1 - blend);
    renderer.setViewport(0, 0, width, height);
    if (blend > 0) {
      const left2 = Math.max(0, rect.left), bottom2 = Math.max(0, height - top - rect.height);
      renderer.setScissor(left2, bottom2, Math.max(0, Math.min(width, rect.right) - left2), Math.max(0, Math.min(height, height - top) - bottom2));
      renderer.setScissorTest(true);
    } else renderer.setScissorTest(false);
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    const bounds = new Box3().setFromObject(blend < 0.5 ? sourceActor : destinationActor.getObjectByName("MyRoom.Desk"));
    const point = new Vector3(), xs = [], ys = [];
    for (let i = 0; i < 8; i++) {
      point.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z).project(camera);
      xs.push((point.x + 1) * width / 2);
      ys.push((1 - point.y) * height / 2);
    }
    const left = Math.min(...xs), right = Math.max(...xs), topY = Math.min(...ys), bottom = Math.max(...ys);
    const exhibit = sharedActor.getObjectByName("Desk.Gravity.Letters");
    const exhibitFacing = exhibit.getWorldDirection(new Vector3()).dot(camera.position.clone().sub(exhibit.getWorldPosition(new Vector3())).normalize());
    let exhibitCopies = 0;
    scene.traverseVisible((object) => {
      if (object.name === "Desk.Gravity.Letters") exhibitCopies++;
    });
    let exhibitOpacity = 1;
    exhibit.traverse((object) => {
      const material = object.material;
      if (material) for (const m of Array.isArray(material) ? material : [material]) exhibitOpacity = Math.min(exhibitOpacity, m.opacity);
    });
    const screenBox = new Box3().setFromObject(exhibit), sx = [], sy = [];
    for (let i = 0; i < 8; i++) {
      point.set(i & 1 ? screenBox.max.x : screenBox.min.x, i & 2 ? screenBox.max.y : screenBox.min.y, i & 4 ? screenBox.max.z : screenBox.min.z).project(camera);
      sx.push((point.x + 1) * width / 2);
      sy.push((1 - point.y) * height / 2);
    }
    const exhibitBounds = { x: Math.min(...sx), y: Math.min(...sy), width: Math.max(...sx) - Math.min(...sx), height: Math.max(...sy) - Math.min(...sy) };
    visual = { kind: "desk", visible: true, progress: p, blend, center: { x: (left + right) / 2, y: (topY + bottom) / 2 }, width: right - left, height: bottom - topY, exhibitFacing, exhibitOpacity, exhibitCopies, exhibitBounds };
  };
  return { render, prepare, dispose() {
    reset();
    releaseActors();
    edgeMask.geometry.dispose();
    edgeMaterial.dispose();
  }, snapshot: () => visual };
}

const vertexShader$1 = "attribute float aMat;\nattribute float aZone;\nattribute float aOrder;\nattribute vec3 aOpen;\n#ifdef POINTS\nattribute float aSeed;\n#endif\nuniform float uTime;\nuniform float uReduced;\nuniform float uDissolve;\nuniform float uDrift;\nuniform float uPointSize;\nuniform float uVelocity;\nuniform vec4 uOpen;\nuniform vec4 uHover;\nuniform vec2 uMouse;\nvarying vec3 vNormal;\nvarying vec3 vView;\nvarying vec3 vLocal;\nvarying float vMat;\nvarying float vZone;\nvarying float vLocalProgress;\nvarying float vHover;\nvarying float vSeed;\nvarying float vTouch;\n\nfloat zoneValue(vec4 v, float zone){\n  if (zone < 0.5) return 0.0;\n  if (zone < 1.5) return v.x;\n  if (zone < 2.5) return v.y;\n  if (zone < 3.5) return v.z;\n  return v.w;\n}\n\nvoid main(){\n  float motion = 1.0 - uReduced;\n  vec3 p = position;\n  // 剖面揭示：立面板、屋面与鳍片沿各自方向平移 / 抬起。\n  p += aOpen * zoneValue(uOpen, aZone);\n  // 消解顺序：外壳（屋面、玻璃、鳍片）先行，结构与室内随后，地台最后。\n  float lp = smoothstep(aOrder * 0.62, aOrder * 0.62 + 0.38, uDissolve);\n  vLocalProgress = lp;\n  vHover = zoneValue(uHover, aZone);\n  vSeed = 0.0;\n#ifdef POINTS\n  vSeed = aSeed;\n  // 点云脱离：先沿法线轻微膨胀，再被空间流场带走（旋转上升 + 低频扰动）。\n  float release = smoothstep(0.15, 1.0, uDrift) * motion;\n  vec3 radial = normalize(vec3(p.x, 0.0, p.z) + 0.0001);\n  float lift = (0.4 + aSeed * 2.2) * release;\n  float swirl = release * (0.6 + aSeed) * 1.4;\n  float c = cos(swirl), s = sin(swirl);\n  p.xz = mat2(c, -s, s, c) * p.xz;\n  p += normal * smoothstep(0.55, 1.0, lp) * 0.06 * motion;\n  p += radial * lift * 1.6 + vec3(0.0, lift * 0.9, 0.0);\n  p += vec3(sin(uTime * 0.4 + aSeed * 31.0), cos(uTime * 0.35 + aSeed * 17.0), sin(uTime * 0.3 + aSeed * 11.0)) * 0.22 * release;\n  p += vec3(sin(uTime * 0.9 + aSeed * 40.0), cos(uTime * 0.8 + aSeed * 20.0), 0.0) * 0.006 * motion;\n#endif\n  vLocal = p;\n  vMat = aMat;\n  vZone = aZone;\n  vec4 mv = modelViewMatrix * vec4(p, 1.0);\n  vView = mv.xyz;\n#ifdef LINES\n  vNormal = vec3(0.0, 0.0, 1.0);\n#else\n  vNormal = normalize(normalMatrix * normal);\n#endif\n  gl_Position = projectionMatrix * mv;\n  vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);\n  vTouch = exp(-pow(length(ndc - uMouse) * 3.0, 2.0)) * motion;\n#ifdef POINTS\n  gl_PointSize = clamp(uPointSize / max(0.2, -mv.z), 1.0, 5.0) * (1.0 + min(uVelocity, 2.0) * 0.15);\n#endif\n}\n";

const lineFragment = "uniform float uOpacity;\nuniform float uTime;\nuniform float uSecret;\nuniform float uDissolve;\nvarying vec3 vLocal;\nvarying float vZone;\nvarying float vLocalProgress;\nvarying float vHover;\nvarying float vTouch;\n// 结构线状态：建筑像一张正在被绘制的图纸，一道扫描光自下而上经过。\nvoid main(){\n  float drawn = smoothstep(0.0, 0.25, vLocalProgress) * (1.0 - smoothstep(0.75, 1.0, vLocalProgress));\n  float scan = smoothstep(0.25, 0.0, abs(fract(vLocal.y * 0.16 - uTime * 0.07) - 0.5) - 0.18);\n  vec3 ink = vec3(0.62, 0.68, 0.74);\n  vec3 acid = vec3(0.77, 0.96, 0.4);\n  // The entrance keeps the building's warm lighting during the structural scan.\n  // Acid remains the accent for the other rooms, rather than outlining the door.\n  vec3 accent = mix(acid, vec3(0.88, 0.72, 0.53), step(3.5, vZone));\n  vec3 color = mix(ink, accent, max(scan * 0.4, uSecret));\n  float alpha = uOpacity * (0.35 + 0.65 * scan) * (0.4 + drawn * 0.6 + (1.0 - step(0.001, uDissolve)));\n  // 悬停时，当前空间的结构线以酸绿色勾出，作为定位线。\n  color = mix(color, accent, vHover);\n  alpha = max(alpha, vHover * 0.8);\n  alpha = max(alpha, vTouch * 0.1 * uOpacity);\n  gl_FragColor = vec4(color, alpha);\n}\n";

const pointFragment = "uniform float uOpacity;\nuniform float uSecret;\nuniform float uDrift;\nvarying float vMat;\nvarying float vLocalProgress;\nvarying float vSeed;\nvarying float vTouch;\n// 点云状态：表面采样点只在该局部已开始消解时出现，与实体交接。\nvoid main(){\n  float d = length(gl_PointCoord - 0.5);\n  if (d > 0.5) discard;\n  float appear = smoothstep(0.2, 0.7, vLocalProgress);\n  float warm = step(3.5, vMat) * step(vMat, 4.5);\n  vec3 color = mix(vec3(0.84, 0.87, 0.92), vec3(1.0, 0.8, 0.6), warm * 0.6);\n  color = mix(color, vec3(0.77, 0.96, 0.4), max(max(vTouch * 0.6, step(0.97, vSeed) * (1.0 - uDrift * 0.5)), uSecret));\n  float twinkle = 0.55 + 0.45 * fract(vSeed * 13.7);\n  gl_FragColor = vec4(color, smoothstep(0.5, 0.1, d) * uOpacity * appear * twinkle);\n}\n";

const TILE = { wood: 2.4, oak: 2, stone: 2.4, plaster: 3, concrete: 3, metal: 1.5, floor: 2.4 };
function rng$2(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
function canvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d") };
}
function tex(c, color = true, repeat = true) {
  const t = new CanvasTexture(c);
  if (color) t.colorSpace = SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function blotches(g, size, r, count, alpha, light, dark) {
  for (let i = 0; i < count; i++) {
    const x = r() * size, y = r() * size, rad = size * (0.03 + r() * 0.12);
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    const c = r() > 0.5 ? light : dark;
    grad.addColorStop(0, c.replace("A", String(alpha * (0.4 + r() * 0.6))));
    grad.addColorStop(1, c.replace("A", "0"));
    g.fillStyle = grad;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      g.save();
      g.translate(ox, oy);
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      g.restore();
    }
  }
}
function woodTexture(base, dark, light, joints, seed) {
  const S = 512, { c, g } = canvas(S), r = rng$2(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  const boards = Math.max(1, joints), bw = S / boards;
  for (let b = 0; b < boards; b++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "255,235,210" : "0,0,0"},${0.03 + r() * 0.05})`;
    g.fillRect(b * bw, 0, bw, S);
    for (let i = 0; i < 70; i++) {
      const x0 = b * bw + r() * bw, amp = 1 + r() * 3, freq = 4e-3 + r() * 0.01, ph = r() * 6;
      g.strokeStyle = r() > 0.55 ? light : dark;
      g.globalAlpha = 0.05 + r() * 0.12;
      g.lineWidth = 0.6 + r() * 1.6;
      g.beginPath();
      for (let y = 0; y <= S; y += 8) {
        const x = x0 + Math.sin(y * freq * 6.283 + ph) * amp;
        if (y === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  if (joints > 0) {
    g.fillStyle = "rgba(0,0,0,0.55)";
    for (let b = 0; b <= boards; b++) g.fillRect(b * bw - 1, 0, 2, S);
  }
  return tex(c);
}
function stoneTexture(joints, seed) {
  const S = 512, { c, g } = canvas(S), r = rng$2(seed);
  g.fillStyle = "#5a5c5f";
  g.fillRect(0, 0, S, S);
  blotches(g, S, r, 90, 0.12, "rgba(150,150,145,A)", "rgba(20,22,26,A)");
  for (let i = 0; i < 9e3; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${r() * 0.07})`;
    g.fillRect(r() * S, r() * S, 1.5, 1.5);
  }
  if (joints) {
    g.fillStyle = "rgba(8,9,10,0.75)";
    const n = 2;
    for (let i = 0; i <= n; i++) {
      g.fillRect(i * S / n - 1.5, 0, 3, S);
      g.fillRect(0, i * S / n - 1.5, S, 3);
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + r() * 0.04})`;
      g.fillRect(i * S / n + 2, j * S / n + 2, S / n - 4, S / n - 4);
    }
  }
  return tex(c);
}
function stoneRoughness(seed) {
  const S = 256, { c, g } = canvas(S), r = rng$2(seed);
  g.fillStyle = "#b8b8b8";
  g.fillRect(0, 0, S, S);
  blotches(g, S, r, 50, 0.3, "rgba(230,230,230,A)", "rgba(90,90,90,A)");
  return tex(c, false);
}
function plankTexture(base, seed) {
  const S = 512, { c, g } = canvas(S), r = rng$2(seed), rows = 8, h = S / rows;
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let j = 0; j < rows; j++) {
    let x = -r() * 200;
    while (x < S) {
      const len = 160 + r() * 200;
      g.fillStyle = `rgba(${r() > 0.5 ? "255,230,200" : "30,15,5"},${0.04 + r() * 0.08})`;
      g.fillRect(x, j * h, len, h);
      for (let k = 0; k < 10; k++) {
        g.fillStyle = `rgba(40,20,8,${0.05 + r() * 0.08})`;
        g.fillRect(x, j * h + r() * h, len, 0.8 + r());
      }
      g.fillStyle = "rgba(20,10,4,0.45)";
      g.fillRect(x, j * h, 1.5, h);
      x += len;
    }
    g.fillStyle = "rgba(20,10,4,0.5)";
    g.fillRect(0, j * h, S, 1.5);
  }
  return tex(c);
}
function flatTexture(base, light, dark, alpha, seed) {
  const S = 256, { c, g } = canvas(S), r = rng$2(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  blotches(g, S, r, 40, alpha, light, dark);
  return tex(c);
}
function brushedRoughness(seed) {
  const S = 256, { c, g } = canvas(S), r = rng$2(seed);
  g.fillStyle = "#6a6a6a";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 600; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.05 + r() * 0.12})`;
    g.fillRect(0, r() * S, S, 0.6 + r());
  }
  return tex(c, false);
}
function screenTexture(kind, seed) {
  const W = 512, H = 320, { c, g } = canvas(W, H), r = rng$2(seed);
  g.fillStyle = "#0c1014";
  g.fillRect(0, 0, W, H);
  if (kind === 0) {
    g.fillStyle = "#141a20";
    g.fillRect(0, 0, 90, H);
    for (let i = 0; i < 24; i++) {
      let x = 110 + (i % 5 === 0 ? 0 : 20 + Math.floor(r() * 3) * 20);
      for (let k = 0; k < 2 + r() * 4; k++) {
        const w = 20 + r() * 80;
        g.fillStyle = ["#6f8fb0", "#c9a56a", "#8fa889", "#b9bdc4", "#7c7f86"][Math.floor(r() * 5)];
        g.globalAlpha = 0.8;
        g.fillRect(x, 16 + i * 12, w, 5);
        x += w + 8;
      }
    }
    g.globalAlpha = 1;
  } else if (kind === 1) {
    g.fillStyle = "#e7e3dc";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const x = 24 + i * 160, y = 30 + j * 140;
      g.fillStyle = ["#2b2f33", "#8a7560", "#56616b", "#c9c1b4", "#3c4a3f", "#a38f78"][(i + j * 3) % 6];
      g.fillRect(x, y, 140, 100);
      g.fillStyle = "#6d6a64";
      g.fillRect(x, y + 108, 90, 5);
    }
  } else {
    const grad = g.createRadialGradient(W * 0.5, H * 0.5, 10, W * 0.5, H * 0.5, W * 0.5);
    grad.addColorStop(0, "#6d8fb5");
    grad.addColorStop(0.5, "#1d2c3d");
    grad.addColorStop(1, "#0a0e12");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(210,225,240,0.35)";
    g.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = H / 2 + Math.sin(x * 0.02 + i * 0.4) * (20 + i * 4);
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  return tex(c, true, false);
}
function pinboardTexture(seed) {
  const W = 1024, H = 448, { c, g } = canvas(W, H), r = rng$2(seed);
  g.fillStyle = "#b9ab95";
  g.fillRect(0, 0, W, H);
  blotches(g, W, r, 30, 0.08, "rgba(255,255,255,A)", "rgba(60,40,20,A)");
  const cols = 7;
  for (let i = 0; i < cols; i++) for (let j = 0; j < 3; j++) {
    if (r() < 0.12) continue;
    const w = 100 + r() * 20, h = 90 + r() * 30, x = 24 + i * 142 + r() * 8, y = 18 + j * 142 + r() * 6;
    g.fillStyle = r() > 0.35 ? "#f1ede6" : ["#3a3f45", "#6b5846", "#56626c"][Math.floor(r() * 3)];
    g.fillRect(x, y, w, h);
    g.strokeStyle = "rgba(40,40,40,0.55)";
    g.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.moveTo(x + 10 + r() * (w - 20), y + 10);
      g.lineTo(x + 10 + r() * (w - 20), y + h - 10);
      g.stroke();
    }
    g.strokeRect(x + 8, y + 8, w - 16, h - 30);
    g.fillStyle = "#2a2a2a";
    g.beginPath();
    g.arc(x + w / 2, y + 4, 2.5, 0, 7);
    g.fill();
  }
  return tex(c, true, false);
}
function shadowTexture() {
  const S = 128, { c, g } = canvas(S);
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.75)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.35)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return tex(c, true, false);
}
function* createLibrarySteps(renderer, clip) {
  const pendingTextures = [];
  let transferred = false;
  function* texturePart(make) {
    const value = make();
    pendingTextures.push(value);
    yield;
    return value;
  }
  try {
    const step = bootStep("Library");
    const t = {
      wood: yield* texturePart(() => woodTexture("#3a2517", "#1a0e07", "#6a4a30", 6, 11)),
      woodFine: yield* texturePart(() => woodTexture("#8a6444", "#5a3a22", "#b08a64", 0, 23)),
      walnut: yield* texturePart(() => woodTexture("#4a3020", "#24140a", "#7a5638", 0, 29)),
      stone: yield* texturePart(() => stoneTexture(true, 31)),
      stoneSide: yield* texturePart(() => stoneTexture(false, 37)),
      stoneRough: yield* texturePart(() => stoneRoughness(41)),
      oakFloor: yield* texturePart(() => plankTexture("#8f6a47", 43)),
      aboutFloor: yield* texturePart(() => plankTexture("#7a5a3c", 47)),
      plaster: yield* texturePart(() => flatTexture("#d8d1c5", "rgba(255,255,255,A)", "rgba(120,100,80,A)", 0.06, 53)),
      labWall: yield* texturePart(() => flatTexture("#dfe3e6", "rgba(255,255,255,A)", "rgba(90,100,110,A)", 0.05, 59)),
      concrete: yield* texturePart(() => flatTexture("#8e9193", "rgba(200,200,200,A)", "rgba(40,42,45,A)", 0.1, 61)),
      brushed: yield* texturePart(() => brushedRoughness(67)),
      pinboard: yield* texturePart(() => pinboardTexture(71)),
      shadow: shadowTexture(),
      screens: [screenTexture(0, 73), screenTexture(1, 79), screenTexture(2, 83)]
    };
    step("textures");
    const common = { clippingPlanes: clip, clipShadows: true };
    const std = (p) => new MeshStandardMaterial({ ...common, ...p });
    const M = {
      graphite: std({ color: 1908514, metalness: 0.75, roughness: 0.38 }),
      roofMetal: std({ color: 3356218, metalness: 0.6, roughness: 0.42 }),
      seam: std({ color: 4869715, metalness: 0.75, roughness: 0.3 }),
      fascia: std({ color: 2435115, metalness: 0.7, roughness: 0.34 }),
      silver: std({ color: 10725549, metalness: 0.92, roughness: 0.3, roughnessMap: t.brushed }),
      wood: std({ map: t.wood, roughness: 0.64, metalness: 0 }),
      walnut: std({ map: t.walnut, roughness: 0.55, metalness: 0 }),
      oak: std({ map: t.woodFine, roughness: 0.55, metalness: 0 }),
      stone: std({ map: t.stone, roughnessMap: t.stoneRough, roughness: 0.82, metalness: 0, color: 10132898 }),
      stoneSide: std({ map: t.stoneSide, roughnessMap: t.stoneRough, roughness: 0.78, metalness: 0, color: 9080210 }),
      stoneDark: std({ map: t.stoneSide, roughness: 0.7, metalness: 0, color: 4869458 }),
      oakFloor: std({ map: t.oakFloor, roughness: 0.5, metalness: 0 }),
      aboutFloor: std({ map: t.aboutFloor, roughness: 0.55, metalness: 0 }),
      plaster: std({ map: t.plaster, roughness: 0.92, metalness: 0 }),
      labWall: std({ map: t.labWall, roughness: 0.8, metalness: 0 }),
      concrete: std({ map: t.concrete, roughness: 0.45, metalness: 0, color: 12896202 }),
      black: std({ color: 1118740, roughness: 0.5, metalness: 0.2 }),
      fabric: std({ color: 3026737, roughness: 0.95, metalness: 0 }),
      leather: std({ color: 5912098, roughness: 0.6, metalness: 0 }),
      whiteModel: std({ color: 14736596, roughness: 0.85, metalness: 0 }),
      ceramic: std({ color: 10262416, roughness: 0.7, metalness: 0 }),
      soil: std({ color: 1775122, roughness: 1, metalness: 0 }),
      brass: std({ color: 11569749, roughness: 0.35, metalness: 0.9 }),
      pinboard: std({ map: t.pinboard, roughness: 0.9, metalness: 0 }),
      bark: std({ color: 3878953, roughness: 0.95, metalness: 0 }),
      book: std({ color: 16777215, roughness: 0.8, metalness: 0 }),
      screenBack: std({ color: 1447963, roughness: 0.4, metalness: 0.5 }),
      screens: t.screens.map((map) => std({ color: 0, emissive: 16777215, emissiveMap: map, emissiveIntensity: 0.55, roughness: 0.25 })),
      leaf: std({ color: 16777215, roughness: 0.78, metalness: 0, flatShading: true })
    };
    const glassTint = new MeshBasicMaterial({ ...common, color: 725272, transparent: true, opacity: 0.16, depthWrite: false });
    const glassReflect = new MeshPhysicalMaterial({ ...common, color: 0, roughness: 0.04, metalness: 0, envMapIntensity: 2.2, specularIntensity: 1, transparent: true, depthWrite: false, blending: AdditiveBlending });
    const shadow = new MeshBasicMaterial({ ...common, map: t.shadow, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const emissive = (color, intensity) => new MeshStandardMaterial({ ...common, color: 0, emissive: color, emissiveIntensity: intensity, roughness: 0.6 });
    step("materials");
    let envMap = getBakedEnvironment("atelier");
    if (!envMap) {
      const pmrem = new PMREMGenerator(renderer);
      const env = new Scene();
      const panel = (color, k, w, h, pos) => {
        const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(k), side: DoubleSide }));
        m.position.set(...pos);
        m.lookAt(0, 0, 0);
        env.add(m);
        return m;
      };
      const shell = new Mesh(new BoxGeometry(40, 40, 40), new MeshBasicMaterial({ color: 724757, side: BackSide }));
      env.add(shell);
      panel(3359838, 1.3, 50, 18, [0, 16, -6]);
      panel(8228782, 2.5, 3, 3, [-10, 12, -12]);
      panel(1712688, 1, 60, 6, [0, 2, -19]);
      panel(16754784, 0.6, 8, 2, [12, 1, 10]);
      envMap = pmrem.fromScene(env, 0.03).texture;
      env.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
      pmrem.dispose();
      step("environmentMap");
    }
    yield;
    const envLevel = [
      [M.graphite, 0.9],
      [M.roofMetal, 0.9],
      [M.seam, 1.1],
      [M.fascia, 0.8],
      [M.silver, 1.2],
      [M.brass, 0.8],
      [M.screenBack, 0.6],
      [M.wood, 0.25],
      [M.walnut, 0.3],
      [M.oak, 0.3],
      [M.stone, 0.35],
      [M.stoneSide, 0.3],
      [M.stoneDark, 0.5],
      [M.oakFloor, 0.35],
      [M.aboutFloor, 0.3],
      [M.concrete, 0.45],
      [M.black, 0.4],
      [M.plaster, 0.12],
      [M.labWall, 0.15]
    ];
    for (const [m, k] of envLevel) {
      m.envMap = envMap;
      m.envMapIntensity = k;
    }
    glassReflect.envMap = envMap;
    const tiles = [
      [M.wood, TILE.wood],
      [M.walnut, TILE.oak],
      [M.oak, TILE.oak],
      [M.stone, TILE.stone],
      [M.stoneSide, TILE.stone],
      [M.stoneDark, TILE.stone],
      [M.oakFloor, TILE.floor],
      [M.aboutFloor, TILE.floor],
      [M.plaster, TILE.plaster],
      [M.labWall, TILE.plaster],
      [M.concrete, TILE.concrete],
      [M.silver, TILE.metal]
    ];
    for (const [m, k] of tiles) m.userData.tile = k;
    for (const [name, m] of Object.entries(M)) if (!Array.isArray(m)) m.name = name;
    const created = [];
    const track = (m) => {
      created.push(m);
      return m;
    };
    const dispose = () => {
      Object.values(t).flat().forEach((x) => x.dispose());
      Object.values(M).flat().forEach((m) => m.dispose());
      [glassTint, glassReflect, shadow, ...created].forEach((m) => m.dispose());
      envMap.dispose();
    };
    transferred = true;
    return { t, M, glassTint, glassReflect, shadow, envMap, emissive: (c, i) => track(emissive(c, i)), track, common, dispose };
  } finally {
    if (!transferred) pendingTextures.forEach((texture) => texture.dispose());
  }
}

/**
 * Merges a set of geometries into a single instance. All geometries must have compatible attributes.
 *
 * @param {Array<BufferGeometry>} geometries - The geometries to merge.
 * @param {boolean} [useGroups=false] - Whether to use groups or not.
 * @return {?BufferGeometry} The merged geometry. Returns `null` if the merge does not succeed.
 */
function mergeGeometries( geometries, useGroups = false ) {

	const isIndexed = geometries[ 0 ].index !== null;

	const attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
	const morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

	const attributes = {};
	const morphAttributes = {};

	const morphTargetsRelative = geometries[ 0 ].morphTargetsRelative;

	const mergedGeometry = new BufferGeometry();

	let offset = 0;

	for ( let i = 0; i < geometries.length; ++ i ) {

		const geometry = geometries[ i ];
		let attributesCount = 0;

		// ensure that all geometries are indexed, or none

		if ( isIndexed !== ( geometry.index !== null ) ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.' );
			return null;

		}

		// gather attributes, exit early if they're different

		for ( const name in geometry.attributes ) {

			if ( ! attributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.' );
				return null;

			}

			if ( attributes[ name ] === undefined ) attributes[ name ] = [];

			attributes[ name ].push( geometry.attributes[ name ] );

			attributesCount ++;

		}

		// ensure geometries have the same number of attributes

		if ( attributesCount !== attributesUsed.size ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.' );
			return null;

		}

		// gather morph attributes, exit early if they're different

		if ( morphTargetsRelative !== geometry.morphTargetsRelative ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.' );
			return null;

		}

		for ( const name in geometry.morphAttributes ) {

			if ( ! morphAttributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.' );
				return null;

			}

			if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

			morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

		}

		if ( useGroups ) {

			let count;

			if ( isIndexed ) {

				count = geometry.index.count;

			} else if ( geometry.attributes.position !== undefined ) {

				count = geometry.attributes.position.count;

			} else {

				console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute' );
				return null;

			}

			mergedGeometry.addGroup( offset, count, i );

			offset += count;

		}

	}

	// merge indices

	if ( isIndexed ) {

		let indexOffset = 0;
		const mergedIndex = [];

		for ( let i = 0; i < geometries.length; ++ i ) {

			const index = geometries[ i ].index;

			for ( let j = 0; j < index.count; ++ j ) {

				mergedIndex.push( index.getX( j ) + indexOffset );

			}

			indexOffset += geometries[ i ].attributes.position.count;

		}

		mergedGeometry.setIndex( mergedIndex );

	}

	// merge attributes

	for ( const name in attributes ) {

		const mergedAttribute = mergeAttributes( attributes[ name ] );

		if ( ! mergedAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' + name + ' attribute.' );
			return null;

		}

		mergedGeometry.setAttribute( name, mergedAttribute );

	}

	// merge morph attributes

	for ( const name in morphAttributes ) {

		const numMorphTargets = morphAttributes[ name ][ 0 ].length;

		if ( numMorphTargets === 0 ) break;

		mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
		mergedGeometry.morphAttributes[ name ] = [];

		for ( let i = 0; i < numMorphTargets; ++ i ) {

			const morphAttributesToMerge = [];

			for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

				morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

			}

			const mergedMorphAttribute = mergeAttributes( morphAttributesToMerge );

			if ( ! mergedMorphAttribute ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' + name + ' morphAttribute.' );
				return null;

			}

			mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

		}

	}

	return mergedGeometry;

}

/**
 * Merges a set of attributes into a single instance. All attributes must have compatible properties and types.
 * Instances of {@link InterleavedBufferAttribute} are not supported.
 *
 * @param {Array<BufferAttribute>} attributes - The attributes to merge.
 * @return {?BufferAttribute} The merged attribute. Returns `null` if the merge does not succeed.
 */
function mergeAttributes( attributes ) {

	let TypedArray;
	let itemSize;
	let normalized;
	let gpuType = -1;
	let arrayLength = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		const attribute = attributes[ i ];

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.' );
			return null;

		}

		if ( itemSize === undefined ) itemSize = attribute.itemSize;
		if ( itemSize !== attribute.itemSize ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.' );
			return null;

		}

		if ( normalized === undefined ) normalized = attribute.normalized;
		if ( normalized !== attribute.normalized ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.' );
			return null;

		}

		if ( gpuType === -1 ) gpuType = attribute.gpuType;
		if ( gpuType !== attribute.gpuType ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.' );
			return null;

		}

		arrayLength += attribute.count * itemSize;

	}

	const array = new TypedArray( arrayLength );
	const result = new BufferAttribute( array, itemSize, normalized );
	let offset = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		const attribute = attributes[ i ];
		if ( attribute.isInterleavedBufferAttribute ) {

			const tupleOffset = offset / itemSize;
			for ( let j = 0, l = attribute.count; j < l; j ++ ) {

				for ( let c = 0; c < itemSize; c ++ ) {

					const value = attribute.getComponent( j, c );
					result.setComponent( j + tupleOffset, c, value );

				}

			}

		} else {

			array.set( attribute.array, offset );

		}

		offset += attribute.count * itemSize;

	}

	if ( gpuType !== undefined ) {

		result.gpuType = gpuType;

	}

	return result;

}

/**
 * Returns a new geometry with vertices for which all similar vertex attributes (within tolerance) are merged.
 *
 * @param {BufferGeometry} geometry - The geometry to merge vertices for.
 * @param {number} [tolerance=1e-4] - The tolerance value.
 * @return {BufferGeometry} - The new geometry with merged vertices.
 */
function mergeVertices( geometry, tolerance = 1e-4 ) {

	tolerance = Math.max( tolerance, Number.EPSILON );

	// Generate an index buffer if the geometry doesn't have one, or optimize it
	// if it's already available.
	const hashToIndex = {};
	const indices = geometry.getIndex();
	const positions = geometry.getAttribute( 'position' );
	const vertexCount = indices ? indices.count : positions.count;

	// next value for triangle indices
	let nextIndex = 0;

	// attributes and new attribute arrays
	const attributeNames = Object.keys( geometry.attributes );
	const tmpAttributes = {};
	const tmpMorphAttributes = {};
	const newIndices = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	// Initialize the arrays, allocating space conservatively. Extra
	// space will be trimmed in the last step.
	for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

		const name = attributeNames[ i ];
		const attr = geometry.attributes[ name ];

		tmpAttributes[ name ] = new attr.constructor(
			new attr.array.constructor( attr.count * attr.itemSize ),
			attr.itemSize,
			attr.normalized
		);

		const morphAttributes = geometry.morphAttributes[ name ];
		if ( morphAttributes ) {

			if ( ! tmpMorphAttributes[ name ] ) tmpMorphAttributes[ name ] = [];
			morphAttributes.forEach( ( morphAttr, i ) => {

				const array = new morphAttr.array.constructor( morphAttr.count * morphAttr.itemSize );
				tmpMorphAttributes[ name ][ i ] = new morphAttr.constructor( array, morphAttr.itemSize, morphAttr.normalized );

			} );

		}

	}

	// convert the error tolerance to an amount of decimal places to truncate to
	const halfTolerance = tolerance * 0.5;
	const exponent = Math.log10( 1 / tolerance );
	const hashMultiplier = Math.pow( 10, exponent );
	const hashAdditive = halfTolerance * hashMultiplier;
	for ( let i = 0; i < vertexCount; i ++ ) {

		const index = indices ? indices.getX( i ) : i;

		// Generate a hash for the vertex attributes at the current index 'i'
		let hash = '';
		for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

			const name = attributeNames[ j ];
			const attribute = geometry.getAttribute( name );
			const itemSize = attribute.itemSize;

			for ( let k = 0; k < itemSize; k ++ ) {

				// double tilde truncates the decimal value
				hash += `${ ~ ~ ( attribute[ getters[ k ] ]( index ) * hashMultiplier + hashAdditive ) },`;

			}

		}

		// Add another reference to the vertex if it's already
		// used by another index
		if ( hash in hashToIndex ) {

			newIndices.push( hashToIndex[ hash ] );

		} else {

			// copy data to the new index in the temporary attributes
			for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

				const name = attributeNames[ j ];
				const attribute = geometry.getAttribute( name );
				const morphAttributes = geometry.morphAttributes[ name ];
				const itemSize = attribute.itemSize;
				const newArray = tmpAttributes[ name ];
				const newMorphArrays = tmpMorphAttributes[ name ];

				for ( let k = 0; k < itemSize; k ++ ) {

					const getterFunc = getters[ k ];
					const setterFunc = setters[ k ];
					newArray[ setterFunc ]( nextIndex, attribute[ getterFunc ]( index ) );

					if ( morphAttributes ) {

						for ( let m = 0, ml = morphAttributes.length; m < ml; m ++ ) {

							newMorphArrays[ m ][ setterFunc ]( nextIndex, morphAttributes[ m ][ getterFunc ]( index ) );

						}

					}

				}

			}

			hashToIndex[ hash ] = nextIndex;
			newIndices.push( nextIndex );
			nextIndex ++;

		}

	}

	// generate result BufferGeometry
	const result = geometry.clone();
	for ( const name in geometry.attributes ) {

		const tmpAttribute = tmpAttributes[ name ];

		result.setAttribute( name, new tmpAttribute.constructor(
			tmpAttribute.array.slice( 0, nextIndex * tmpAttribute.itemSize ),
			tmpAttribute.itemSize,
			tmpAttribute.normalized,
		) );

		if ( ! ( name in tmpMorphAttributes ) ) continue;

		for ( let j = 0; j < tmpMorphAttributes[ name ].length; j ++ ) {

			const tmpMorphAttribute = tmpMorphAttributes[ name ][ j ];

			result.morphAttributes[ name ][ j ] = new tmpMorphAttribute.constructor(
				tmpMorphAttribute.array.slice( 0, nextIndex * tmpMorphAttribute.itemSize ),
				tmpMorphAttribute.itemSize,
				tmpMorphAttribute.normalized,
			);

		}

	}

	// indices

	result.setIndex( newIndices );

	return result;

}

const PARTS = ["Structure", "Facade", "Glass", "Roof", "Interior", "Props", "Lights"];
function rng$1(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
function createZone(id, name, boxes, frame, focus) {
  const group = new Group();
  group.name = name;
  const parts = {};
  for (const p of PARTS) {
    const g = new Group();
    g.name = `${name}.${p}`;
    parts[p] = g;
    group.add(g);
  }
  const proxies = boxes.map(([a, b], i) => {
    const min = new Vector3(...a), max = new Vector3(...b), size = max.clone().sub(min);
    const proxy = new Mesh(new BoxGeometry(size.x, size.y, size.z), new MeshBasicMaterial());
    proxy.position.copy(min).add(max).multiplyScalar(0.5);
    proxy.name = `${name}.Proxy${i}`;
    proxy.userData.zone = id;
    proxy.visible = false;
    group.add(proxy);
    return proxy;
  });
  const [x0, x1, y0, y1, z] = frame;
  return { id, name, group, parts, lights: [], glow: [], proxies, frame: [new Vector3(x0, y0, z), new Vector3(x1, y0, z), new Vector3(x1, y1, z), new Vector3(x0, y1, z)], focus: new Vector3(...focus) };
}
const euler = new Euler(), quat = new Quaternion();
const place = (x, y, z, ry = 0, rx = 0, rz = 0, s = [1, 1, 1]) => new Matrix4().compose(new Vector3(x, y, z), quat.setFromEuler(euler.set(rx, ry, rz, "YXZ")), new Vector3(...s));
class Kit {
  buckets = /* @__PURE__ */ new Map();
  sets = /* @__PURE__ */ new Map();
  // 局部坐标框架：家具等组合构件在自己的坐标系中建模，再整体放置 / 旋转。
  frame = null;
  random;
  constructor(seed = 1703) {
    this.random = rng$1(seed);
  }
  at(x, y, z, ry, build) {
    const previous = this.frame, local = place(x, y, z, ry);
    this.frame = previous ? previous.clone().multiply(local) : local;
    build();
    this.frame = previous;
  }
  // 重复构件（书本、叶簇）使用 InstancedMesh，实例归属于所在区域的部件组。
  instance(parent, geometry, material, matrix, color, shadow = true) {
    const key = `${parent.uuid}|${geometry.uuid}|${material.uuid}`;
    let s = this.sets.get(key);
    if (!s) {
      s = { parent, geometry, material, matrices: [], colors: [], shadow };
      this.sets.set(key, s);
    }
    s.matrices.push(this.frame ? this.frame.clone().multiply(matrix) : matrix);
    s.colors.push(new Color(color ?? 16777215));
  }
  add(parent, material, geometry, matrix, shadow = true) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
    if (!g.attributes.uv) g.setAttribute("uv", new Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (matrix) g = g.applyMatrix4(matrix);
    if (this.frame) g = g.applyMatrix4(this.frame);
    const key = `${parent.uuid}|${material.uuid}|${shadow}`;
    let b = this.buckets.get(key);
    if (!b) {
      b = { parent, material, geometries: [], shadow };
      this.buckets.set(key, b);
    }
    b.geometries.push(g);
  }
  // 盒体 UV 按真实尺寸 / 纹理尺度缩放，并加随机偏移，避免重复纹理对齐。
  boxGeometry(w, h, d, material) {
    const g = new BoxGeometry(w, h, d), tile = material.userData.tile ?? 0;
    if (tile > 0) {
      const uv = g.attributes.uv, du = this.random(), dv = this.random();
      const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let i = 0; i < uv.count; i++) {
        const [a, b] = dims[Math.floor(i / 4)];
        uv.setXY(i, uv.getX(i) * a / tile + du, uv.getY(i) * b / tile + dv);
      }
    }
    return g;
  }
  // 以范围定义的轴对齐盒体（建筑构件最常用）。
  box(parent, material, x0, x1, y0, y1, z0, z1, shadow = true) {
    const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
    if (w < 1e-4 || h < 1e-4 || d < 1e-4) return;
    this.add(parent, material, this.boxGeometry(w, h, d, material), place((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), shadow);
  }
  // 以中心 + 旋转定义的盒体（家具与陈设）。
  cube(parent, material, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0, shadow = true) {
    this.add(parent, material, this.boxGeometry(w, h, d, material), place(x, y, z, ry, rx, rz), shadow);
  }
  cylinder(parent, material, r0, r1, h, x, y, z, segments = 16, rx = 0, rz = 0, shadow = true) {
    this.add(parent, material, new CylinderGeometry(r0, r1, h, segments), place(x, y, z, 0, rx, rz), shadow);
  }
  finish() {
    const meshes = [];
    for (const b of this.buckets.values()) {
      const merged = mergeGeometries(b.geometries, false);
      b.geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      const mesh = new Mesh(merged, b.material);
      mesh.castShadow = b.shadow;
      mesh.receiveShadow = true;
      mesh.name = `${b.parent.name}:${b.material.name || b.material.type}`;
      b.parent.add(mesh);
      meshes.push(mesh);
    }
    this.buckets.clear();
    for (const s of this.sets.values()) {
      const mesh = new InstancedMesh(s.geometry, s.material, s.matrices.length);
      s.matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, s.colors[i]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
      mesh.castShadow = s.shadow;
      mesh.receiveShadow = true;
      mesh.name = `${s.parent.name}:instances`;
      s.parent.add(mesh);
      meshes.push(mesh);
    }
    this.sets.clear();
    return meshes;
  }
}
function addLight(zone, light, x, y, z, target) {
  light.position.set(x, y, z);
  zone.parts.Lights.add(light);
  zone.lights.push({ light, base: light.intensity });
  return light;
}

/**
 * Can be used to create a flat, reflective surface like a mirror.
 *
 * Note that this class can only be used with {@link WebGLRenderer}.
 * When using {@link WebGPURenderer}, use {@link ReflectorNode}.
 *
 * ```js
 * const geometry = new THREE.PlaneGeometry( 100, 100 );
 *
 * const reflector = new Reflector( geometry, {
 * 	clipBias: 0.003,
 * 	textureWidth: window.innerWidth * window.devicePixelRatio,
 * 	textureHeight: window.innerHeight * window.devicePixelRatio,
 * 	color: 0xc1cbcb
 * } );
 *
 * scene.add( reflector );
 * ```
 *
 * @augments Mesh
 * @three_import import { Reflector } from 'three/addons/objects/Reflector.js';
 */
class Reflector extends Mesh {

	/**
	 * Constructs a new reflector.
	 *
	 * @param {BufferGeometry} geometry - The reflector's geometry.
	 * @param {Reflector~Options} [options] - The configuration options.
	 */
	constructor( geometry, options = {} ) {

		super( geometry );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isReflector = true;

		this.type = 'Reflector';

		/**
		 * Whether to force an update, no matter if the reflector
		 * is in view or not.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.forceUpdate = false;

		/**
		 * The reflector's virtual camera. This is used to render
		 * the scene from the mirror's point of view.
		 *
		 * @type {PerspectiveCamera}
		 */
		this.camera = new PerspectiveCamera();

		const scope = this;

		const color = ( options.color !== undefined ) ? new Color( options.color ) : new Color( 0x7F7F7F );
		const textureWidth = options.textureWidth || 512;
		const textureHeight = options.textureHeight || 512;
		const clipBias = options.clipBias || 0;
		const shader = options.shader || Reflector.ReflectorShader;
		const multisample = ( options.multisample !== undefined ) ? options.multisample : 4;

		//

		const reflectorPlane = new Plane();
		const normal = new Vector3();
		const reflectorWorldPosition = new Vector3();
		const cameraWorldPosition = new Vector3();
		const rotationMatrix = new Matrix4();
		const lookAtPosition = new Vector3( 0, 0, -1 );
		const clipPlane = new Vector4();

		const view = new Vector3();
		const target = new Vector3();
		const q = new Vector4();

		const textureMatrix = new Matrix4();
		const virtualCamera = this.camera;

		const renderTarget = new WebGLRenderTarget( textureWidth, textureHeight, { samples: multisample, type: HalfFloatType } );

		const material = new ShaderMaterial( {
			name: ( shader.name !== undefined ) ? shader.name : 'unspecified',
			uniforms: UniformsUtils.clone( shader.uniforms ),
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader
		} );

		material.uniforms[ 'tDiffuse' ].value = renderTarget.texture;
		material.uniforms[ 'color' ].value = color;
		material.uniforms[ 'textureMatrix' ].value = textureMatrix;

		this.material = material;

		this.onBeforeRender = function ( renderer, scene, camera ) {

			reflectorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			rotationMatrix.extractRotation( scope.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			view.subVectors( reflectorWorldPosition, cameraWorldPosition );

			// Avoid rendering when reflector is facing away unless forcing an update
			const isFacingAway = view.dot( normal ) > 0;

			if ( isFacingAway === true && this.forceUpdate === false ) return;

			view.reflect( normal ).negate();
			view.add( reflectorWorldPosition );

			rotationMatrix.extractRotation( camera.matrixWorld );

			lookAtPosition.set( 0, 0, -1 );
			lookAtPosition.applyMatrix4( rotationMatrix );
			lookAtPosition.add( cameraWorldPosition );

			target.subVectors( reflectorWorldPosition, lookAtPosition );
			target.reflect( normal ).negate();
			target.add( reflectorWorldPosition );

			virtualCamera.position.copy( view );
			virtualCamera.up.set( 0, 1, 0 );
			virtualCamera.up.applyMatrix4( rotationMatrix );
			virtualCamera.up.reflect( normal );
			virtualCamera.lookAt( target );

			virtualCamera.far = camera.far; // Used in WebGLBackground

			virtualCamera.updateMatrixWorld();
			virtualCamera.projectionMatrix.copy( camera.projectionMatrix );

			// Update the texture matrix
			textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);
			textureMatrix.multiply( virtualCamera.projectionMatrix );
			textureMatrix.multiply( virtualCamera.matrixWorldInverse );
			textureMatrix.multiply( scope.matrixWorld );

			// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
			// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
			reflectorPlane.setFromNormalAndCoplanarPoint( normal, reflectorWorldPosition );
			reflectorPlane.applyMatrix4( virtualCamera.matrixWorldInverse );

			clipPlane.set( reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant );

			const projectionMatrix = virtualCamera.projectionMatrix;

			q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
			q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
			q.z = -1;
			q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

			// Calculate the scaled plane vector
			clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

			// Replacing the third row of the projection matrix
			projectionMatrix.elements[ 2 ] = clipPlane.x;
			projectionMatrix.elements[ 6 ] = clipPlane.y;
			projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
			projectionMatrix.elements[ 14 ] = clipPlane.w;

			// Render
			scope.visible = false;

			const currentRenderTarget = renderer.getRenderTarget();

			const currentXrEnabled = renderer.xr.enabled;
			const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

			renderer.xr.enabled = false; // Avoid camera modification
			renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

			renderer.setRenderTarget( renderTarget );

			renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897

			if ( renderer.autoClear === false ) renderer.clear();
			renderer.render( scene, virtualCamera );

			renderer.xr.enabled = currentXrEnabled;
			renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

			renderer.setRenderTarget( currentRenderTarget );

			// Restore viewport

			const viewport = camera.viewport;

			if ( viewport !== undefined ) {

				renderer.state.viewport( viewport );

			}

			scope.visible = true;
			this.forceUpdate = false;

		};

		/**
		 * Returns the reflector's internal render target.
		 *
		 * @return {WebGLRenderTarget} The internal render target
		 */
		this.getRenderTarget = function () {

			return renderTarget;

		};

		/**
		 * Frees the GPU-related resources allocated by this instance. Call this
		 * method whenever this instance is no longer used in your app.
		 */
		this.dispose = function () {

			renderTarget.dispose();
			scope.material.dispose();

		};

	}

}

Reflector.ReflectorShader = {

	name: 'ReflectorShader',

	uniforms: {

		'color': {
			value: null
		},

		'tDiffuse': {
			value: null
		},

		'textureMatrix': {
			value: null
		}

	},

	vertexShader: /* glsl */`
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,

	fragmentShader: /* glsl */`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`
};

const unitBox = new BoxGeometry(1, 1, 1);
const leafGeometry = (() => {
  const g = new OctahedronGeometry(1, 0);
  g.scale(0.5, 0.12, 1);
  return g;
})();
const sharedGeometries = [unitBox, leafGeometry];
const BOOK_COLORS = [7031350, 9206370, 3818064, 10174254, 14208959, 3095091, 8022607, 12101002, 2040616, 5922662];
function table(k, p, L, w, d, h, top, style = "frame") {
  const M = L.M, t = 0.045;
  k.cube(p, top, w, t, d, 0, h - t / 2, 0);
  if (style === "frame") {
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 - 0.12);
      for (const sz of [-1, 1]) k.cube(p, M.graphite, 0.04, h - t, 0.04, x, (h - t) / 2, sz * (d / 2 - 0.08));
      k.cube(p, M.graphite, 0.04, 0.04, d - 0.12, x, 0.02, 0);
      k.cube(p, M.graphite, 0.04, 0.04, d - 0.12, x, h - t - 0.02, 0);
    }
    k.cube(p, M.graphite, w - 0.28, 0.035, 0.035, 0, h - t - 0.06, -d / 2 + 0.1);
  } else {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cube(p, M.graphite, 0.035, h - t, 0.035, sx * (w / 2 - 0.05), (h - t) / 2, sz * (d / 2 - 0.05));
    k.cube(p, M.graphite, w - 0.1, 0.05, 0.02, 0, h - t - 0.03, -d / 2 + 0.05);
  }
  L.shadow && k.add(p, L.shadow, new PlaneGeometry(w * 1.15, d * 1.3), place(0, 4e-3, 0, 0, -Math.PI / 2), false);
}
function taskChair(k, p, L, seatColor) {
  const M = L.M, seat = seatColor ?? M.fabric;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    k.cube(p, M.graphite, 0.03, 0.025, 0.3, Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14, a);
    k.cylinder(p, M.black, 0.022, 0.022, 0.03, Math.sin(a) * 0.28, 0.025, Math.cos(a) * 0.28, 8, 0, Math.PI / 2, false);
  }
  k.cylinder(p, M.silver, 0.022, 0.022, 0.34, 0, 0.24, 0, 10);
  k.cube(p, M.graphite, 0.3, 0.03, 0.3, 0, 0.41, 0);
  k.cube(p, seat, 0.48, 0.07, 0.46, 0, 0.46, 0.02);
  k.cube(p, M.graphite, 0.04, 0.34, 0.03, 0, 0.62, -0.22, 0, -0.12);
  k.cube(p, seat, 0.44, 0.44, 0.05, 0, 0.86, -0.26, 0, -0.12);
  k.add(p, L.shadow, new PlaneGeometry(0.8, 0.8), place(0, 4e-3, 0, 0, -Math.PI / 2), false);
}
function sideChair(k, p, L) {
  const M = L.M;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cube(p, M.walnut, 0.03, 0.44, 0.03, sx * 0.19, 0.22, sz * 0.18, 0, sz * 0.05);
  k.cube(p, M.walnut, 0.44, 0.035, 0.42, 0, 0.455, 0);
  k.cube(p, M.leather, 0.4, 0.02, 0.38, 0, 0.482, 0.01);
  for (const sx of [-1, 1]) k.cube(p, M.walnut, 0.03, 0.36, 0.03, sx * 0.19, 0.64, -0.2, 0, -0.1);
  k.cube(p, M.walnut, 0.42, 0.1, 0.025, 0, 0.8, -0.22, 0, -0.1);
  k.add(p, L.shadow, new PlaneGeometry(0.7, 0.7), place(0, 4e-3, 0, 0, -Math.PI / 2), false);
}
function monitor(k, p, L, screen, w = 0.62, h = 0.36) {
  const M = L.M;
  k.cube(p, M.silver, 0.22, 0.012, 0.16, 0, 6e-3, -0.02);
  k.cube(p, M.silver, 0.04, h * 0.7, 0.02, 0, 0.012 + h * 0.35, -0.07, 0, 0.12);
  k.cube(p, M.screenBack, w, h, 0.022, 0, 0.1 + h / 2, -0.03);
  k.add(p, M.screens[screen], new PlaneGeometry(w - 0.02, h - 0.02), place(0, 0.1 + h / 2, -0.018), false);
}
function laptop(k, p, L, screen) {
  const M = L.M;
  k.cube(p, M.silver, 0.32, 0.014, 0.22, 0, 7e-3, 0);
  k.at(0, 0.014, -0.11, 0, () => {
    k.add(p, M.silver, new BoxGeometry(0.32, 0.21, 8e-3), place(0, 0.105, -0.03, 0, -0.3));
    k.add(p, M.screens[screen], new PlaneGeometry(0.29, 0.18), place(0, 0.105, -0.025, 0, -0.3), false);
  });
}
function deskLamp(k, p, L, glow) {
  const M = L.M;
  k.cylinder(p, M.graphite, 0.07, 0.075, 0.02, 0, 0.01, 0, 18);
  k.cylinder(p, M.graphite, 7e-3, 7e-3, 0.36, 0.05, 0.19, 0, 6, 0, -0.3);
  k.cylinder(p, M.graphite, 7e-3, 7e-3, 0.3, 0.19, 0.38, 0, 6, 0, 1.15);
  k.cylinder(p, M.graphite, 0.022, 0.06, 0.11, 0.33, 0.32, 0, 16, 0, 0.35);
  k.add(p, glow, new CircleGeometry(0.052, 16), place(0.35, 0.265, 0, 0, Math.PI / 2, 0.35), false);
}
function floorLamp(k, p, L, glow) {
  const M = L.M;
  k.cylinder(p, M.graphite, 0.14, 0.15, 0.02, 0, 0.01, 0, 20);
  k.cylinder(p, M.graphite, 8e-3, 8e-3, 1.45, 0, 0.74, 0, 6);
  k.add(p, glow, new CylinderGeometry(0.16, 0.2, 0.26, 20, 1, true), place(0, 1.5, 0), false);
}
function bookshelf(k, p, L, w, h, d, levels, frame, seed = 1) {
  const M = L.M, t = 0.03, gap = (h - t) / levels;
  k.cube(p, frame, w, h, 0.015, 0, h / 2, -d / 2 + 75e-4);
  for (const sx of [-1, 1]) k.cube(p, frame, t, h, d, sx * (w / 2 - t / 2), h / 2, 0);
  for (let i = 0; i <= levels; i++) k.cube(p, frame, w - t * 2, t, d, 0, t / 2 + i * gap, 0);
  const bays = Math.max(1, Math.round(w / 0.9));
  for (let b = 1; b < bays; b++) k.cube(p, frame, t, h - t, d, -w / 2 + b * w / bays, h / 2, 0);
  let r = seed * 9301 + 49297;
  const rand = () => {
    r = r * 16807 % 2147483647;
    return (r - 1) / 2147483646;
  };
  const m = new Matrix4();
  for (let i = 0; i < levels; i++) {
    const y0 = t + i * gap, maxH = gap - t - 0.04;
    for (let b = 0; b < bays; b++) {
      let x = -w / 2 + b * w / bays + t + 0.02;
      const xEnd = -w / 2 + (b + 1) * w / bays - t / 2 - 0.02;
      const style = rand();
      if (style < 0.14) {
        k.cylinder(p, M.ceramic, 0.05, 0.06, 0.16, x + 0.2, y0 + 0.08, 0, 14);
        x += 0.35;
      }
      while (x < xEnd - 0.05) {
        if (rand() < 0.08) {
          x += 0.08 + rand() * 0.12;
          continue;
        }
        const bw = 0.022 + rand() * 0.028, bh = Math.min(maxH, 0.17 + rand() * 0.13), bd = Math.min(d - 0.04, 0.15 + rand() * 0.08);
        if (x + bw > xEnd) break;
        const lean = rand() < 0.06 ? 0.18 : 0;
        m.compose(new Vector3(x + bw / 2 + (lean ? bh * 0.09 : 0), y0 + bh / 2 * Math.cos(lean), -d / 2 + 0.02 + bd / 2), new Quaternion().setFromEuler(new Euler(0, 0, -lean)), new Vector3(bw, bh, bd));
        k.instance(p, unitBox, M.book, m.clone(), BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)]);
        x += bw + 2e-3;
        if (lean) break;
      }
      if (style > 0.8) for (let s = 0; s < 3; s++) {
        m.compose(new Vector3(xEnd - 0.14, y0 + 0.015 + s * 0.032, -d / 2 + 0.13), new Quaternion().setFromEuler(new Euler(0, (rand() - 0.5) * 0.2, 0)), new Vector3(0.22 - s * 0.02, 0.03, 0.16));
        k.instance(p, unitBox, M.book, m.clone(), BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)]);
      }
    }
  }
}
function pottedPlant(k, p, L, height, spread, seed) {
  const M = L.M;
  let r = seed * 7919 + 17;
  const rand = () => {
    r = r * 16807 % 2147483647;
    return (r - 1) / 2147483646;
  };
  const potH = Math.min(0.42, 0.18 + height * 0.18), potR = Math.min(0.22, 0.09 + height * 0.07);
  k.cylinder(p, M.ceramic, potR, potR * 0.82, potH, 0, potH / 2, 0, 20);
  k.cylinder(p, M.soil, potR * 0.92, potR * 0.92, 0.01, 0, potH - 0.02, 0, 16, 0, 0, false);
  const m = new Matrix4(), q = new Quaternion(), e = new Euler();
  const stems = 3 + Math.floor(height * 3);
  for (let s = 0; s < stems; s++) {
    const a = s / stems * Math.PI * 2 + rand(), lean = 0.12 + rand() * 0.3, len = height * (0.6 + rand() * 0.4);
    const tip = new Vector3(Math.sin(a) * Math.sin(lean) * len, potH + Math.cos(lean) * len, Math.cos(a) * Math.sin(lean) * len);
    k.add(p, M.bark, new CylinderGeometry(6e-3, 0.01, len, 5), place(tip.x / 2, potH + (tip.y - potH) / 2, tip.z / 2, a, lean, 0), false);
    const count = 10 + Math.floor(spread * 30);
    for (let i = 0; i < count; i++) {
      const u = rand(), h = u * len, rad = spread * (0.2 + 0.8 * Math.sin(u * Math.PI)) * 0.5;
      const pos = new Vector3(Math.sin(a) * Math.sin(lean) * h + (rand() - 0.5) * rad, potH + Math.cos(lean) * h + (rand() - 0.3) * 0.08, Math.cos(a) * Math.sin(lean) * h + (rand() - 0.5) * rad);
      if (u < 0.35) continue;
      q.setFromEuler(e.set((rand() - 0.5) * 1.4, rand() * Math.PI * 2, (rand() - 0.5) * 1.2));
      const s2 = 0.05 + rand() * 0.05;
      m.compose(pos, q, new Vector3(s2, s2, s2 * 1.4));
      k.instance(p, leafGeometry, M.leaf, m.clone(), new Color().setHSL(0.27 + rand() * 0.06, 0.35 + rand() * 0.15, 0.13 + rand() * 0.08));
    }
  }
}
function pendant(k, p, L, glow, length, drop) {
  const M = L.M;
  for (const sx of [-1, 1]) k.cylinder(p, M.black, 3e-3, 3e-3, drop, sx * length * 0.4, -drop / 2, 0, 4, 0, 0, false);
  k.cube(p, M.graphite, length, 0.035, 0.06, 0, -drop - 0.0175, 0);
  k.add(p, glow, new PlaneGeometry(length - 0.02, 0.04), place(0, -drop - 0.036, 0, 0, Math.PI / 2), false);
}
function downlight(k, p, L, glow, x, y, z) {
  k.cylinder(p, L.M.black, 0.06, 0.06, 0.012, x, y - 6e-3, z, 14, 0, 0, false);
  k.add(p, glow, new CircleGeometry(0.045, 14), place(x, y - 0.013, z, 0, Math.PI / 2), false);
}
function stool(k, p, L) {
  const M = L.M;
  k.cylinder(p, M.oak, 0.17, 0.17, 0.04, 0, 0.66, 0, 20);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    k.cube(p, M.graphite, 0.022, 0.66, 0.022, Math.sin(a) * 0.13, 0.32, Math.cos(a) * 0.13, a, Math.cos(a) * 0.08, -Math.sin(a) * 0.08);
  }
  k.cylinder(p, M.graphite, 0.12, 0.12, 0.015, 0, 0.25, 0, 16, 0, 0, false);
}
function model(k, p, L, seed) {
  const M = L.M;
  let r = seed * 131 + 7;
  const rand = () => {
    r = r * 16807 % 2147483647;
    return (r - 1) / 2147483646;
  };
  k.cube(p, M.oak, 0.42, 0.015, 0.32, 0, 75e-4, 0);
  for (let i = 0; i < 5; i++) {
    const w = 0.05 + rand() * 0.1, h = 0.03 + rand() * 0.14, d = 0.05 + rand() * 0.08;
    k.cube(p, M.whiteModel, w, h, d, (rand() - 0.5) * 0.28, 0.015 + h / 2, (rand() - 0.5) * 0.18, Math.round(rand() * 2) * 0.2);
  }
}
function rug(k, p, _L, w, d, material) {
  k.cube(p, material, w, 0.012, d, 0, 6e-3, 0, 0, 0, 0, false);
}
function loungeChair(k, p, L) {
  const M = L.M;
  for (const sx of [-1, 1]) {
    k.cube(p, M.walnut, 0.04, 0.04, 0.78, sx * 0.34, 0.2, 0);
    for (const sz of [-1, 1]) k.cube(p, M.walnut, 0.04, 0.2, 0.04, sx * 0.34, 0.1, sz * 0.34);
    k.cube(p, M.walnut, 0.05, 0.05, 0.62, sx * 0.34, 0.52, -0.04);
    k.cube(p, M.walnut, 0.04, 0.34, 0.04, sx * 0.34, 0.36, 0.25);
  }
  k.cube(p, M.leather, 0.64, 0.12, 0.66, 0, 0.3, 0.02);
  k.cube(p, M.leather, 0.62, 0.52, 0.12, 0, 0.6, -0.32, 0, -0.22);
  k.add(p, L.shadow, new PlaneGeometry(1.1, 1.1), place(0, 4e-3, 0, 0, -Math.PI / 2), false);
}

const WATER_Y = -0.42;
const FOG = 1712944;
function tree(k, p, L, x, y, z, h, spread, seed, leaves, hue = 0.27, light = 0.13) {
  const r = rng$1(seed), V = Vector3;
  const top = new V(x + (r() - 0.5) * 0.25, y + h * 0.52, z + (r() - 0.5) * 0.25);
  const trunk = new CatmullRomCurve3([new V(x, y - 0.05, z), new V(x + (r() - 0.5) * 0.12, y + h * 0.22, z + (r() - 0.5) * 0.12), top]);
  const tr = 0.04 + h * 0.012;
  k.add(p, L.M.bark, new TubeGeometry(trunk, 10, tr, 7, false));
  k.add(p, L.M.bark, new CylinderGeometry(tr * 1.1, tr * 1.7, 0.18, 8), place(x, y + 0.04, z));
  const clumps = [];
  const branches = 3 + Math.floor(r() * 2);
  for (let b = 0; b < branches; b++) {
    const a = b / branches * Math.PI * 2 + r() * 0.8, reach = spread * (0.45 + r() * 0.2);
    const start = top.clone().add(new V(0, -h * (0.06 + r() * 0.1), 0));
    const tip = top.clone().add(new V(Math.sin(a) * reach, h * (0.12 + r() * 0.18), Math.cos(a) * reach));
    const mid = start.clone().lerp(tip, 0.5).add(new V(0, h * 0.05, 0));
    k.add(p, L.M.bark, new TubeGeometry(new CatmullRomCurve3([start, mid, tip]), 6, tr * 0.45, 5, false));
    clumps.push({ c: tip, r: spread * (0.3 + r() * 0.12), ry: h * (0.13 + r() * 0.05) });
  }
  clumps.push({ c: top.clone().add(new V(0, h * 0.34, 0)), r: spread * 0.36, ry: h * 0.17 });
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), color = new Color();
  const per = Math.ceil(leaves / clumps.length);
  for (const c of clumps) for (let i = 0; i < per; i++) {
    const t = r() * Math.PI * 2, u = r() * 2 - 1, s = Math.sqrt(1 - u * u), d = 0.45 + Math.pow(r(), 0.5) * 0.55;
    const pos = new V(Math.cos(t) * s * c.r * d, u * c.ry * d, Math.sin(t) * s * c.r * d).add(c.c);
    q.setFromEuler(e.set((r() - 0.5) * 1.6, r() * Math.PI * 2, (r() - 0.5) * 1.6));
    const sc = (0.11 + r() * 0.08) * (0.7 + h * 0.12);
    m.compose(pos, q, new V(sc, sc, sc * 1.3));
    const shade = (0.55 + 0.45 * (u * 0.5 + 0.5)) * (0.6 + 0.4 * d);
    color.setHSL(hue + (r() - 0.5) * 0.05, 0.32 + r() * 0.16, light * shade + r() * 0.03);
    k.instance(p, leafGeometry, L.M.leaf, m.clone(), color.clone());
  }
}
function shrub(k, p, L, x, y, z, w, h, seed, count) {
  const r = rng$1(seed), m = new Matrix4(), q = new Quaternion(), e = new Euler(), color = new Color();
  for (let i = 0; i < count; i++) {
    const t = r() * Math.PI * 2, rad = Math.sqrt(r()), u = r();
    const pos = new Vector3(x + Math.cos(t) * rad * w * 0.5, y + h * (0.15 + 0.85 * u * (1 - rad * 0.5)), z + Math.sin(t) * rad * w * 0.35);
    q.setFromEuler(e.set((r() - 0.5) * 1.8, r() * 6.3, (r() - 0.5) * 1.8));
    const sc = 0.08 + r() * 0.06;
    m.compose(pos, q, new Vector3(sc, sc, sc * 1.3));
    color.setHSL(0.26 + (r() - 0.5) * 0.06, 0.3 + r() * 0.15, 0.07 + u * 0.08);
    k.instance(p, leafGeometry, L.M.leaf, m.clone(), color.clone());
  }
}
const PLINTH = [
  { x0: -10.4, x1: -1.4, z0: -4.1, z1: 3.95 },
  { x0: -1.4, x1: 1.6, z0: -4.1, z1: 4.3 },
  { x0: 1.6, x1: 10.7, z0: -4.1, z1: 4.9 }
];
const WATER_SHADER = {
  name: "AtelierWater",
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uTime: { value: 0 }, uOpacity: { value: 1 }, uFog: { value: new Color(FOG) }, uStrength: { value: 0.62 } },
  vertexShader: (
    /* glsl */
    `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vLocal;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vLocal = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`
  ),
  fragmentShader: (
    /* glsl */
    `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uStrength;
    uniform vec3 uFog;
    varying vec4 vUv;
    varying vec3 vLocal;
    void main() {
          // 平面局部坐标：x 横向，y 为 -z（纵深）
      vec2 q = vLocal.xy;
      // Long, slow swell + one faint ripple: broad ribbons of light instead of high-frequency zig-zag.
      float n = sin(q.x * 0.55 + uTime * 0.28) * 0.6 + sin(q.y * 0.9 - uTime * 0.22 + q.x * 0.2) * 0.4;
      // q.y grows away from the camera; the building's front edge is near q.y = 7.
      // 'away' is 0 at the plinth and 1 toward the viewer: still water at the foot of the
      // building, ripples (and fading reflection) only as the water opens up in front of it.
      float away = 1.0 - smoothstep(-6.0, 7.0, q.y);
      vec4 uv = vUv;
      uv.x += n * (0.0004 + 0.0030 * away) * uv.w;
      // Vertical smear: lights stretch into soft columns, a little longer with distance from the building.
      vec3 refl = vec3(0.0);
      float wsum = 0.0;
      for (int i = -3; i <= 3; i++) {
        float w = 1.0 - abs(float(i)) / 4.0;
        vec4 t = uv; t.y += (float(i) * (0.0030 + 0.0030 * away) + n * 0.0008) * uv.w;
        refl += texture2DProj(tDiffuse, t).rgb * w; wsum += w;
      }
      refl /= wsum;
      // Fresnel-ish falloff: the reflection is brightest at the waterline and dies into the dark.
      float fade = mix(1.0, 0.0, smoothstep(0.0, 1.0, away) * 0.92);
      float d = length(vec2(q.x / 30.0, (q.y + 1.0) / 17.0));
      vec3 c = color + refl * uStrength * fade;
      c = mix(c, uFog, smoothstep(0.45, 1.05, d));
      gl_FragColor = vec4(c, uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  )
};
function buildEnvironment(k, L, mobile) {
  const M = L.M, group = new Group();
  group.name = "Environment";
  const parts = {};
  for (const name of ["Base", "Landscape", "Water", "Backdrop", "Lights"]) {
    const g = new Group();
    g.name = `Environment.${name}`;
    parts[name] = g;
    group.add(g);
  }
  const B = parts.Base, S = parts.Landscape;
  for (const r of PLINTH) {
    k.box(B, M.stone, r.x0, r.x1, -0.13, 0, r.z0, r.z1);
    k.box(B, M.black, r.x0 + 0.06, r.x1 - 0.06, -0.19, -0.13, r.z0 + 0.06, r.z1 - 0.06, false);
    k.box(B, M.stoneDark, r.x0 + 0.1, r.x1 - 0.1, -0.7, -0.19, r.z0 + 0.1, r.z1 - 0.1);
  }
  for (const r of PLINTH) k.box(B, M.stoneSide, r.x0 - 0.01, r.x1 + 0.01, -0.13, -0.1, r.z1 - 0.02, r.z1 + 0.01, false);
  const planter = (x0, x1, z0, z1, h = 0.42) => {
    k.box(S, M.stoneDark, x0, x1, 0, h, z0, z0 + 0.08);
    k.box(S, M.stoneDark, x0, x1, 0, h, z1 - 0.08, z1);
    k.box(S, M.stoneDark, x0, x0 + 0.08, 0, h, z0, z1);
    k.box(S, M.stoneDark, x1 - 0.08, x1, 0, h, z0, z1);
    k.box(S, M.soil, x0 + 0.08, x1 - 0.08, 0, h - 0.06, z0 + 0.08, z1 - 0.08, false);
  };
  const leafScale = mobile ? 0.55 : 1;
  planter(-10.2, -8, 3.05, 3.8);
  shrub(k, S, L, -9.5, 0.36, 3.42, 1.1, 0.45, 3, Math.round(80 * leafScale));
  shrub(k, S, L, -8.55, 0.36, 3.45, 0.8, 0.35, 5, Math.round(55 * leafScale));
  tree(k, S, L, -10, 0.36, 3.45, 2.7, 1.5, 7, Math.round(420 * leafScale), 0.26, 0.14);
  planter(-2.75, -1.55, 3.2, 3.85);
  tree(k, S, L, -2.15, 0.36, 3.52, 2.6, 1.3, 11, Math.round(360 * leafScale), 0.28, 0.13);
  shrub(k, S, L, -2.4, 0.36, 3.5, 0.6, 0.3, 13, Math.round(35 * leafScale));
  planter(6.1, 9.4, 4.15, 4.75, 0.34);
  shrub(k, S, L, 6.9, 0.28, 4.45, 1.2, 0.4, 17, Math.round(70 * leafScale));
  shrub(k, S, L, 8.5, 0.28, 4.45, 1.3, 0.45, 19, Math.round(80 * leafScale));
  tree(k, S, L, 10.15, 0, 3.7, 2.9, 1.5, 23, Math.round(420 * leafScale), 0.25, 0.12);
  if (!mobile) shrub(k, S, L, 9.9, 0, 2.2, 0.9, 0.5, 29, 60);
  const rocks = [[-1.75, 4.05, 0.32, 0.4, 0.2], [2.05, 4.55, 0.26, 0.9, 1.1], [-7.7, 3.7, 0.2, 1.3, 2.2], [5.75, 4.5, 0.22, 0.2, 0.6]];
  for (const [x, z, s, ry, rz] of rocks) k.add(S, M.stoneDark, new DodecahedronGeometry(1, 0), place(x, s * 0.25, z, ry, 0.1, rz * 0.1, [s * 1.5, s * 0.55, s * 1.1]));
  const bollard = L.emissive(16758126, 2.2);
  for (const [x, z] of [[-6.4, 3.75], [-4.3, 3.75], [2.4, 4.65], [4.9, 4.65]]) {
    k.box(S, M.graphite, x - 0.05, x + 0.05, 0, 0.42, z - 0.05, z + 0.05);
    k.box(S, bollard, x - 0.045, x + 0.045, 0.34, 0.37, z + 0.05, z + 0.052, false);
  }
  const bank = new MeshStandardMaterial({ color: 790291, roughness: 1, clippingPlanes: L.common.clippingPlanes });
  L.track(bank);
  k.box(parts.Backdrop, bank, -70, 70, -0.9, -0.3, -46, -13, false);
  const woods = mobile ? 9 : 16, wr = rng$1(97);
  for (let i = 0; i < woods; i++) {
    const x = -34 + i * (68 / woods) + (wr() - 0.5) * 3, z = -14.5 - wr() * 6, h = 5 + wr() * 4;
    tree(k, parts.Backdrop, L, x, -0.3, z, h, 2.6 + wr() * 1.4, 200 + i, mobile ? 70 : 130, 0.33, 0.05);
  }
  const hillMaps = [];
  const hillTexture = (top, bottom) => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, top);
    grad.addColorStop(0.78, bottom);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.minFilter = map.magFilter = LinearFilter;
    map.generateMipmaps = false;
    hillMaps.push(map);
    return map;
  };
  const hills = (z, width, height, top, bottom, seed) => {
    const r = rng$1(seed), shape = new Shape(), n = 40;
    shape.moveTo(-width / 2, -1);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = -width / 2 + t * width;
      const y = height * (0.45 + 0.3 * Math.sin(t * 5.1 + seed) + 0.18 * Math.sin(t * 13.7 + seed * 2) + 0.07 * (r() - 0.5));
      shape.lineTo(x, y);
    }
    shape.lineTo(width / 2, -1);
    shape.closePath();
    const m = new MeshBasicMaterial({ map: hillTexture(top, bottom), transparent: true, depthWrite: false, clippingPlanes: L.common.clippingPlanes });
    L.track(m);
    k.add(parts.Backdrop, m, new ShapeGeometry(shape), place(0, -0.4, z), false);
  };
  hills(-48, 190, 5.5, "rgba(24,34,47,0.66)", "rgba(7,12,18,0.95)", 3);
  hills(-78, 260, 9.5, "rgba(30,42,58,0.45)", "rgba(13,20,30,0.78)", 8);
  const res = mobile ? 0.3 : 0.5;
  const water = new Reflector(new PlaneGeometry(130, 60), {
    textureWidth: Math.round(innerWidth * res),
    textureHeight: Math.round(innerHeight * res),
    color: 395533,
    clipBias: 2e-3,
    multisample: 0,
    shader: WATER_SHADER
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, WATER_Y, 12);
  water.name = "Environment.Water:reflector";
  const waterMaterial = water.material;
  waterMaterial.transparent = true;
  water.camera.layers.set(0);
  parts.Water.add(water);
  const floor = new Mesh(new PlaneGeometry(130, 60), new MeshBasicMaterial({ color: 329482 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, WATER_Y - 0.05, 12);
  parts.Water.add(floor);
  const moon = new DirectionalLight(11057368, 2.1);
  moon.position.set(-10, 17, -11);
  moon.target.position.set(0, 0, 0);
  moon.castShadow = true;
  moon.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  moon.shadow.bias = -4e-4;
  const hemi = new HemisphereLight(4873596, 1316379, 1.5);
  parts.Lights.add(moon, moon.target, hemi);
  const resize = (w, h) => water.getRenderTarget().setSize(Math.max(2, Math.round(w * res)), Math.max(2, Math.round(h * res)));
  const dispose = () => {
    water.dispose();
    water.geometry.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    hillMaps.forEach((map) => map.dispose());
  };
  return { group, parts, water, waterMaterial, moon, hemi, resize, dispose };
}

const A = {
  H1: 3.2,
  SLAB: 0.22,
  FL: 0.03,
  P: { x0: -9.2, x1: -1.4, z0: -3.2, z1: 3 },
  E: { x0: -1.4, x1: 1.6, door: 1 },
  L: { x0: 1.6, x1: 9, z0: -3.2, z1: 3.4 },
  U: { x0: -0.6, x1: 5.6, z0: -3.2, z1: 0.8, y: 3.42, h: 2.72 },
  STAIR: { x0: -1, x1: 4.4, z0: -2.97, z1: -2.07, risers: 18 },
  // 洞口起点 x=0.4：该处踏步高 0.89m，距吊顶（2.95m）净高 2.06m
  HOLE: { x0: 0.4, x1: 4.45, z0: -2.98, z1: -2.02 },
  COLUMN: { x: 5.6, z: 0.8 }
  // 上层前墙下方的 Lab 钢柱
};
const UY = A.U.y + 0.03;
const UTOP = UY + A.U.h;
function glassWall(k, frame, glass, L, axis, fixed, a0, a1, y0, y1, bays, facing, transom, skip = []) {
  const M = L.M, len = a1 - a0, mw = 0.055, md = 0.11;
  const bar = (c0, c1, yy0, yy1, d0, d1) => {
    if (axis === "z") k.box(frame, M.graphite, c0, c1, yy0, yy1, fixed + d0, fixed + d1);
    else k.box(frame, M.graphite, fixed + d0, fixed + d1, yy0, yy1, c0, c1);
  };
  for (let i = 0; i <= bays; i++) {
    if (skip.includes(i)) continue;
    const c2 = a0 + len * i / bays, w = i === 0 || i === bays ? mw * 1.5 : mw;
    bar(c2 - w / 2, c2 + w / 2, y0, y1, -md / 2, md / 2);
    bar(c2 - 0.012, c2 + 0.012, y0, y1, facing * md / 2 - 0.012, facing * md / 2 + 0.012);
  }
  bar(a0, a1, y1 - 0.09, y1, -md / 2 - 0.01, md / 2 + 0.01);
  bar(a0, a1, y0, y0 + 0.07, -md / 2 - 0.02, md / 2 + 0.02);
  const h = y1 - y0, cy = (y0 + y1) / 2, c = (a0 + a1) / 2;
  const m = axis === "z" ? place(c, cy, fixed, facing > 0 ? 0 : Math.PI) : place(fixed, cy, c, facing > 0 ? Math.PI / 2 : -Math.PI / 2);
  k.add(glass, L.glassTint, new PlaneGeometry(len, h), m, false);
  k.add(glass, L.glassReflect, new PlaneGeometry(len, h), m, false);
}
function around(r, hole) {
  const h = hole && { x0: Math.max(r.x0, hole.x0), x1: Math.min(r.x1, hole.x1), z0: Math.max(r.z0, hole.z0), z1: Math.min(r.z1, hole.z1) };
  if (!h || h.x1 <= h.x0 || h.z1 <= h.z0) return [r];
  return [
    { x0: r.x0, x1: h.x0, z0: r.z0, z1: r.z1 },
    { x0: h.x1, x1: r.x1, z0: r.z0, z1: r.z1 },
    { x0: h.x0, x1: h.x1, z0: r.z0, z1: h.z0 },
    { x0: h.x0, x1: h.x1, z0: h.z1, z1: r.z1 }
  ].filter((q) => q.x1 - q.x0 > 0.01 && q.z1 - q.z0 > 0.01);
}
function flatRoof(k, roof, L, x0, x1, z0, z1, y, wall, seamStep = 0.5, cover, hole, open = []) {
  const M = L.M, t = A.SLAB, ox0 = open.includes("x0") ? 0 : 0.04, ox1 = open.includes("x1") ? 0 : 0.04;
  for (const q of around({ x0, x1, z0, z1 }, hole)) k.box(roof, M.fascia, q.x0, q.x1, y, y + t, q.z0, q.z1);
  for (const q of around({ x0: x0 + ox0, x1: x1 - ox1, z0: z0 + 0.04, z1: z1 - 0.04 }, cover)) for (const r of around(q, hole)) k.box(roof, M.roofMetal, r.x0, r.x1, y + t, y + t + 0.015, r.z0, r.z1);
  const e0 = open.includes("x0") ? x0 : x0 - 0.015, e1 = open.includes("x1") ? x1 : x1 + 0.015;
  k.box(roof, M.seam, e0, e1, y + t - 0.035, y + t + 0.03, z1 - 0.03, z1 + 0.015);
  k.box(roof, M.seam, e0, e1, y + t - 0.035, y + t + 0.03, z0 - 0.015, z0 + 0.03);
  if (!open.includes("x0")) k.box(roof, M.seam, x0 - 0.015, x0 + 0.03, y + t - 0.035, y + t + 0.03, z0, z1);
  if (!open.includes("x1")) k.box(roof, M.seam, x1 - 0.03, x1 + 0.015, y + t - 0.035, y + t + 0.03, z0, z1);
  k.box(roof, M.black, x0 + 0.06, x1 - 0.06, y - 0.012, y, z1 - 0.1, z1 - 0.06, false);
  for (let x = x0 + seamStep; x < x1 - 0.1; x += seamStep) {
    const spans = cover && x > cover.x0 && x < cover.x1 ? [[z0 + 0.06, cover.z0], [cover.z1, z1 - 0.06]] : [[z0 + 0.06, z1 - 0.06]];
    for (const [a, b] of spans) if (b - a > 0.05) k.box(roof, M.seam, x - 0.012, x + 0.012, y + t + 0.015, y + t + 0.04, a, b, false);
  }
  if (wall) {
    const s = y - 0.012;
    const soffit = (a0, a1, b0, b1) => {
      if (a1 - a0 > 0.05 && b1 - b0 > 0.05) k.box(roof, M.walnut, a0, a1, s, y, b0, b1, false);
    };
    soffit(x0 + 0.04, x1 - 0.04, wall.z1, z1 - 0.1);
    soffit(x0 + 0.04, x1 - 0.04, z0 + 0.04, wall.z0);
    soffit(x0 + 0.04, wall.x0, wall.z0, wall.z1);
    soffit(wall.x1, x1 - 0.04, wall.z0, wall.z1);
  }
}
function pitchedRoof(k, roof, L, x0, x1, zFront, zBack, zRidge, y, rise) {
  const M = L.M, t = 0.2, e = 0.06;
  const s = new Shape();
  s.moveTo(-zFront, y);
  s.lineTo(-zFront, y + t);
  s.lineTo(-zRidge, y + t + rise);
  s.lineTo(-zBack, y + t);
  s.lineTo(-zBack, y);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  k.add(roof, M.fascia, g);
  const slope = (za, zb) => {
    const ya = y + t + (za === zRidge ? rise : 0), yb = y + t + (zb === zRidge ? rise : 0);
    const len = Math.hypot(zb - za, yb - ya), a = Math.atan2(-(yb - ya), zb - za);
    const n = new Vector3(0, Math.cos(a), Math.sin(a));
    const cz = (za + zb) / 2 + n.z * e / 2, cy = (ya + yb) / 2 + n.y * e / 2;
    k.add(roof, M.roofMetal, new BoxGeometry(x1 - x0 + 0.06, e, len + 0.02), place((x0 + x1) / 2, cy, cz, 0, a));
    for (let x = x0 + 0.42; x < x1 - 0.1; x += 0.42) k.add(roof, M.seam, new BoxGeometry(0.024, 0.035, len), place(x, cy + n.y * (e / 2 + 0.017), cz + n.z * (e / 2 + 0.017), 0, a), false);
  };
  slope(zRidge, zFront);
  slope(zBack, zRidge);
  k.cube(roof, M.seam, x1 - x0 + 0.08, 0.05, 0.12, (x0 + x1) / 2, y + t + rise + e + 0.02, zRidge);
  k.box(roof, M.seam, x0 - 0.03, x1 + 0.03, y - 0.02, y + t + 0.05, zFront, zFront + 0.035);
}
function battens(k, p, L, axis, fixed, a0, a1, y0, y1, facing, step = 0.13) {
  const w = 0.045, d = 0.05;
  for (let c = a0 + step / 2; c < a1; c += step) {
    k.box(p, L.M.walnut, c - w / 2, c + w / 2, y0, y1, fixed, fixed + facing * d);
  }
}
function skirting(k, p, L, x0, x1, z0, z1, y = 0) {
  k.box(p, L.M.black, x0, x1, y, y + 0.08, z0, z1, false);
}
function stripLight(k, p, material, x0, x1, y0, y1, z0, z1) {
  k.box(p, material, x0, x1, y0, y1, z0, z1, false);
}

function buildProjects(k, L, mobile) {
  const { P, H1, FL } = A, M = L.M, W = 0.2;
  const zone = createZone(1, "ProjectsZone", [[[P.x0 - 0.6, 0, P.z0 - 0.5], [P.x1, 3.75, P.z1 + 0.75]]], [P.x0 + 0.4, P.x1 - 0.4, 0.3, 2.75, P.z1 + 0.14], [-5.3, 1.5, 0.6]);
  const S = zone.parts, xi = P.x1 - W;
  const warm = L.emissive(16757870, 2.4), soft = L.emissive(16763023, 1.2);
  zone.glow.push({ material: warm, base: 2.4 }, { material: soft, base: 1.2 });
  k.box(S.Structure, M.oakFloor, P.x0, xi, 0, FL, P.z0, P.z1);
  k.box(S.Structure, M.wood, P.x0 - W, P.x1, 0, H1, P.z0 - W, P.z0);
  k.box(S.Structure, M.wood, P.x0 - W, P.x0, 0, H1, P.z0, P.z1);
  k.box(S.Structure, M.wood, xi, P.x1, 0, H1, P.z0, P.z1);
  k.box(S.Interior, M.plaster, P.x0, xi, FL, 2.95, P.z0, P.z0 + 0.02);
  k.box(S.Interior, M.plaster, P.x0, P.x0 + 0.02, FL, 2.95, P.z0 + 0.02, P.z1 - 0.06);
  k.box(S.Interior, M.plaster, xi - 0.02, xi, FL, 2.95, P.z0 + 0.02, P.z1 - 0.06);
  k.box(S.Interior, M.walnut, P.x0, xi, 2.95, H1, P.z0, P.z1 - 0.06);
  skirting(k, S.Interior, L, P.x0 + 0.02, xi - 0.02, P.z0 + 0.02, P.z0 + 0.035, FL);
  k.box(S.Interior, M.black, P.x0 + 0.02, xi - 0.02, 2.86, 2.95, P.z0 + 0.02, P.z0 + 0.14, false);
  stripLight(k, S.Lights, warm, P.x0 + 0.1, xi - 0.1, 2.855, 2.865, P.z0 + 0.03, P.z0 + 0.12);
  glassWall(k, S.Facade, S.Glass, L, "z", P.z1, P.x0, xi, FL, 2.95, 8, 1, void 0, [4]);
  k.box(S.Facade, M.graphite, P.x0 - W, P.x1, 2.95, H1, P.z1 - 0.1, P.z1 + 0.09);
  for (const [a, b] of [[P.x0 - 0.24, P.x0 + 0.16], [-5.56, -5.24], [xi - 0.16, P.x1 + 0.02]]) {
    k.box(S.Facade, M.wood, a, b, 0, 2.95, P.z1 - 0.12, P.z1 + 0.18);
    k.box(S.Facade, M.graphite, a + 0.02, b - 0.02, 0, 0.04, P.z1 + 0.18, P.z1 + 0.2, false);
  }
  glassWall(k, S.Facade, S.Glass, L, "x", P.x0 - W - 5e-3, -1.2, 0.8, 0.5, 2.7, 2, -1);
  k.box(S.Interior, M.black, P.x0 - W - 0.01, P.x0 + 0.03, 0.44, 0.5, -1.2, 0.8, false);
  k.box(S.Facade, M.black, P.x0 - W - 0.01, P.x1, 0, 0.06, P.z0 - W - 0.01, P.z0 - W + 0.02, false);
  pitchedRoof(k, S.Roof, L, P.x0 - 0.6, P.x1 - 0.02, P.z1 + 0.75, P.z0 - 0.5, -0.4, H1, 0.26);
  k.box(S.Roof, M.walnut, P.x0 - 0.56, P.x1 - 0.04, H1 - 0.016, H1, P.z1 + 0.09, P.z1 + 0.71, false);
  k.box(S.Roof, M.walnut, P.x0 - 0.56, P.x0 - W, H1 - 0.016, H1, P.z0 - 0.46, P.z1 + 0.09, false);
  for (let x = P.x0 + 0.4; x < P.x1 - 0.3; x += 1.9) downlight(k, S.Lights, L, soft, x, H1 - 0.016, P.z1 + 0.42);
  k.at(-6.9, FL, P.z0 + 0.21, 0, () => bookshelf(k, S.Interior, L, 3.8, 2.58, 0.38, 6, M.walnut, 3));
  k.box(S.Interior, M.black, -4.63, -1.97, 1.26, 2.44, P.z0 + 0.02, P.z0 + 0.035);
  k.add(S.Interior, M.pinboard, new PlaneGeometry(2.6, 1.14), place(-3.3, 1.85, P.z0 + 0.037), false);
  k.box(S.Interior, M.black, -4.55, -2.05, FL, FL + 0.1, P.z0 + 0.05, P.z0 + 0.42);
  k.box(S.Interior, M.walnut, -4.6, -2, FL + 0.1, 0.74, P.z0 + 0.02, P.z0 + 0.47);
  for (let i = 1; i < 4; i++) k.box(S.Interior, M.black, -4.6 + i * 0.65 - 4e-3, -4.6 + i * 0.65 + 4e-3, FL + 0.14, 0.7, P.z0 + 0.47, P.z0 + 0.475, false);
  k.at(-4.05, 0.74, P.z0 + 0.25, 0.12, () => model(k, S.Props, L, 5));
  k.at(-2.75, 0.74, P.z0 + 0.25, -0.2, () => model(k, S.Props, L, 9));
  k.at(-3.4, 0.74, P.z0 + 0.25, 0, () => pottedPlant(k, S.Props, L, 0.28, 0.35, 4));
  k.at(-5.6, FL, -0.1, 0, () => rug(k, S.Props, L, 4.8, 2.9, M.fabric));
  k.at(-5.6, FL, -0.5, 0, () => {
    table(k, S.Props, L, 3.6, 1, 0.75, M.walnut, "frame");
    k.at(-1, 0.75, -0.26, 0.14, () => monitor(k, S.Props, L, 0));
    k.at(0.05, 0.75, -0.28, -0.04, () => monitor(k, S.Props, L, 1, 0.7, 0.4));
    k.at(1.15, 0.75, 0.05, -0.35, () => laptop(k, S.Props, L, 2));
    k.at(-1.62, 0.75, -0.3, 0.5, () => deskLamp(k, S.Props, L, warm));
    k.at(0.95, 0.75, -0.3, 0.3, () => model(k, S.Props, L, 13));
    k.cube(S.Props, M.book, 0.3, 0.02, 0.22, -0.35, 0.76, 0.2, 0.2);
    k.cube(S.Props, M.ceramic, 0.08, 0.1, 0.08, 1.6, 0.8, -0.3);
  });
  k.at(-6.55, FL, 0.28, Math.PI + 0.12, () => taskChair(k, S.Props, L));
  k.at(-5.5, FL, 0.3, Math.PI - 0.1, () => taskChair(k, S.Props, L));
  k.at(-4.35, FL, 0.55, Math.PI + 0.45, () => taskChair(k, S.Props, L));
  k.at(-7.75, FL, 1.8, 0, () => {
    table(k, S.Props, L, 1.5, 0.85, 0.74, M.oak, "legs");
    k.at(0.2, 0.74, 0.05, 2.6, () => laptop(k, S.Props, L, 0));
    k.cube(S.Props, M.book, 0.24, 0.03, 0.3, -0.35, 0.755, -0.1, 0.3);
    k.cylinder(S.Props, M.ceramic, 0.05, 0.04, 0.12, -0.5, 0.8, 0.22, 12);
  });
  k.at(-8.72, FL, 1.8, Math.PI / 2, () => sideChair(k, S.Props, L));
  k.at(-6.78, FL, 1.8, -Math.PI / 2, () => sideChair(k, S.Props, L));
  k.at(-2.75, FL, 1.95, -2.45, () => loungeChair(k, S.Props, L));
  k.at(-2.15, FL, 2.5, 0, () => floorLamp(k, S.Props, L, soft));
  k.at(-2.25, FL, -2.45, 0, () => pottedPlant(k, S.Props, L, 1.5, 0.9, 7));
  if (!mobile) k.at(-8.6, FL, 2.55, 0, () => pottedPlant(k, S.Props, L, 1.1, 0.7, 11));
  k.at(-5.6, 2.95, -0.5, 0, () => pendant(k, S.Lights, L, warm, 2.8, 0.95));
  for (const x of [-8.3, -2.9]) for (const z of [-1.4, 1.2]) downlight(k, S.Lights, L, soft, x, 2.95, z);
  const light = (x, y, z, intensity, distance) => addLight(zone, new PointLight(16756848, intensity, distance, 2), x, y, z);
  light(-5.6, 2.2, -0.4, 13, 9);
  light(-8, 2.5, 1.2, 7, 7);
  light(-2.9, 2.5, 1, 7, 7);
  if (!mobile) light(-6.9, 2.6, -2.2, 4, 5);
  return zone;
}

function buildLab(k, L, mobile) {
  const { L: B, H1, FL, U, STAIR, HOLE } = A, M = L.M;
  const zone = createZone(2, "LabZone", [[[B.x0 + 0.2, 0, B.z0 - 0.4], [B.x1 + 0.5, 3.7, B.z1 + 0.6]]], [B.x0 + 0.35, B.x1 - 0.3, 0.3, 2.75, B.z1 + 0.12], [5.3, 1.4, 0.8]);
  const S = zone.parts;
  const cool = L.emissive(15134975, 2.2), dim = L.emissive(13623551, 1);
  zone.glow.push({ material: cool, base: 2.2 }, { material: dim, base: 1 });
  k.box(S.Structure, M.concrete, B.x0, B.x1, 0, FL, B.z0, B.z1);
  k.box(S.Structure, M.graphite, B.x0, B.x1 + 0.12, 0, H1, B.z0 - 0.2, B.z0);
  k.box(S.Interior, M.labWall, B.x0, B.x1, FL, 2.95, B.z0, B.z0 + 0.02);
  skirting(k, S.Interior, L, B.x0, B.x1, B.z0 + 0.02, B.z0 + 0.035, FL);
  for (const q of around({ x0: B.x0 + 0.2, x1: B.x1, z0: B.z0, z1: B.z1 - 0.06 }, HOLE)) k.box(S.Interior, M.labWall, q.x0, q.x1, 2.95, H1, q.z0, q.z1);
  k.box(S.Interior, M.labWall, HOLE.x0 < B.x0 ? B.x0 + 0.2 : HOLE.x0, HOLE.x1, 2.95, H1, HOLE.z1 - 0.02, HOLE.z1, false);
  for (const [x0, x1, z0, z1] of [[4.8, 8.2, -0.9, 2.4], [2.2, 4.4, -0.9, 2.4]]) {
    k.box(S.Interior, M.silver, x0 - 0.04, x1 + 0.04, 2.925, 2.95, z0 - 0.04, z1 + 0.04, false);
    stripLight(k, S.Lights, dim, x0, x1, 2.918, 2.925, z0, z1);
  }
  glassWall(k, S.Facade, S.Glass, L, "z", B.z1, B.x0, B.x1, FL, 2.95, 7, 1);
  glassWall(k, S.Facade, S.Glass, L, "x", B.x1, B.z0, B.z1, FL, 2.95, 5, 1);
  k.box(S.Facade, M.graphite, B.x1 - 0.07, B.x1 + 0.07, 0, H1, B.z1 - 0.07, B.z1 + 0.07);
  k.box(S.Facade, M.graphite, B.x0, B.x1 + 0.1, 2.95, H1, B.z1 - 0.1, B.z1 + 0.1);
  k.box(S.Facade, M.graphite, B.x1 - 0.1, B.x1 + 0.1, 2.95, H1, B.z0, B.z1);
  k.box(S.Structure, M.wood, B.x0, B.x0 + 0.2, 0, H1, STAIR.z1 + 0.05, B.z1);
  flatRoof(k, S.Roof, L, B.x0, B.x1 + 0.6, B.z0 - 0.4, B.z1 + 0.6, H1, { x0: B.x0, x1: B.x1, z0: B.z0, z1: B.z1 }, 0.46, { x0: U.x0 - 0.1, x1: U.x1 + 0.1, z0: U.z0 - 0.1, z1: U.z1 + 0.1 }, HOLE, ["x0"]);
  for (let z = B.z0; z < B.z1 + 0.3; z += 1.3) downlight(k, S.Lights, L, dim, B.x1 + 0.34, H1 - 0.012, z);
  for (let x = B.x0 + 0.8; x < B.x1; x += 1.6) downlight(k, S.Lights, L, dim, x, H1 - 0.012, B.z1 + 0.36);
  const n = STAIR.risers, run = (STAIR.x1 - STAIR.x0) / n, rise = UYL() / n;
  for (let i = 0; i < n; i++) {
    const x = STAIR.x0 + i * run;
    if (x + run < B.x0 + 0.2) continue;
    k.box(S.Interior, M.oak, Math.max(x, B.x0 + 0.2), x + run + 0.02, (i + 1) * rise - 0.045, (i + 1) * rise, STAIR.z0, STAIR.z1);
  }
  const len = Math.hypot(STAIR.x1 - STAIR.x0, UYL()), ang = Math.atan2(UYL(), STAIR.x1 - STAIR.x0);
  const beam = new BoxGeometry(len, 0.2, 0.05);
  k.add(S.Interior, M.graphite, beam, place((STAIR.x0 + STAIR.x1) / 2, UYL() / 2 - 0.1, STAIR.z1 + 0.025, 0, 0, ang));
  const rail = new PlaneGeometry(len - 0.4, 0.9);
  k.add(S.Glass, L.glassTint, rail.clone(), place((STAIR.x0 + STAIR.x1) / 2 + 0.2, UYL() / 2 + 0.5, STAIR.z1 + 0.06, 0, 0, ang), false);
  k.add(S.Interior, M.silver, new BoxGeometry(len - 0.4, 0.035, 0.035), place((STAIR.x0 + STAIR.x1) / 2 + 0.2, UYL() / 2 + 0.96, STAIR.z1 + 0.06, 0, 0, ang), false);
  rail.dispose();
  k.at(7.4, FL, B.z0 + 0.25, 0, () => {
    bookshelf(k, S.Interior, L, 2.4, 2.3, 0.4, 5, M.silver, 17);
  });
  k.cylinder(S.Props, M.graphite, 0.62, 0.66, 0.08, 5.2, FL + 0.04, 0.9, 40);
  k.cylinder(S.Props, M.silver, 0.5, 0.5, 0.52, 5.2, FL + 0.34, 0.9, 40);
  k.cylinder(S.Props, M.black, 0.46, 0.46, 0.02, 5.2, FL + 0.61, 0.9, 40, 0, 0, false);
  stripLight(k, S.Lights, cool, 4.72, 5.68, FL + 0.08, FL + 0.095, 0.42, 0.44);
  k.at(3.4, FL, -0.9, 0, () => {
    table(k, S.Props, L, 2.2, 0.8, 0.92, M.concrete, "frame");
    k.at(-0.5, 0.92, -0.18, 0.1, () => monitor(k, S.Props, L, 2, 0.6, 0.36));
    k.at(0.35, 0.92, -0.2, -0.1, () => monitor(k, S.Props, L, 0, 0.5, 0.3));
    k.cube(S.Props, M.graphite, 0.34, 0.16, 0.24, 0.85, 1, 0.05);
    k.cube(S.Props, M.silver, 0.12, 0.26, 0.12, -0.95, 1.05, 0.1);
    k.cylinder(S.Props, M.whiteModel, 0.06, 0.06, 0.1, 0.15, 0.97, 0.2, 14);
  });
  k.at(3, FL, -0.12, Math.PI + 0.2, () => stool(k, S.Props, L));
  k.at(3.95, FL, -0.1, Math.PI - 0.3, () => stool(k, S.Props, L));
  k.at(7.4, FL, 1.7, 0, () => {
    table(k, S.Props, L, 1.8, 0.8, 0.75, M.oak, "legs");
    k.at(-0.3, 0.75, 0, Math.PI + 0.3, () => laptop(k, S.Props, L, 1));
    k.cube(S.Props, M.graphite, 0.24, 0.1, 0.18, 0.45, 0.8, -0.1, 0.3);
  });
  k.at(7.4, FL, 1.05, 0.15, () => taskChair(k, S.Props, L, M.black));
  if (!mobile) k.at(8.55, FL, -2.6, 0, () => pottedPlant(k, S.Props, L, 1.2, 0.6, 19));
  const light = (x, y, z, i, d) => addLight(zone, new PointLight(14937343, i, d, 2), x, y, z);
  light(5.2, 2.4, 0.9, 10, 8);
  light(3.3, 2.4, -0.6, 7, 6);
  light(7.6, 2.4, 1.2, 6, 6);
  return zone;
}
function UYL() {
  return A.U.y + 0.03;
}

const _tempNormal = new Vector3();

function getUv( faceDirVector, normal, uvAxis, projectionAxis, radius, sideLength ) {

	const totArcLength = 2 * Math.PI * radius / 4;

	// length of the planes between the arcs on each axis
	const centerLength = Math.max( sideLength - 2 * radius, 0 );
	const halfArc = Math.PI / 4;

	// Get the vector projected onto the Y plane
	_tempNormal.copy( normal );
	_tempNormal[ projectionAxis ] = 0;
	_tempNormal.normalize();

	// total amount of UV space alloted to a single arc
	const arcUvRatio = 0.5 * totArcLength / ( totArcLength + centerLength );

	// the distance along one arc the point is at
	const arcAngleRatio = 1.0 - ( _tempNormal.angleTo( faceDirVector ) / halfArc );

	if ( Math.sign( _tempNormal[ uvAxis ] ) === 1 ) {

		return arcAngleRatio * arcUvRatio;

	} else {

		// total amount of UV space alloted to the plane between the arcs
		const lenUv = centerLength / ( totArcLength + centerLength );
		return lenUv + arcUvRatio + arcUvRatio * ( 1.0 - arcAngleRatio );

	}

}

/**
 * A special type of box geometry with rounded corners and edges.
 *
 * ```js
 * const geometry = new THREE.RoundedBoxGeometry();
 * const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
 * const cube = new THREE.Mesh( geometry, material );
 * scene.add( cube );
 * ```
 *
 * @augments BoxGeometry
 * @three_import import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
 */
class RoundedBoxGeometry extends BoxGeometry {

	/**
	 * Constructs a new rounded box geometry.
	 *
	 * @param {number} [width=1] - The width. That is, the length of the edges parallel to the X axis.
	 * @param {number} [height=1] - The height. That is, the length of the edges parallel to the Y axis.
	 * @param {number} [depth=1] - The depth. That is, the length of the edges parallel to the Z axis.
	 * @param {number} [segments=2] - Number of segments that form the rounded corners.
	 * @param {number} [radius=0.1] - The radius of the rounded corners.
	 */
	constructor( width = 1, height = 1, depth = 1, segments = 2, radius = 0.1 ) {

		// calculate total segments needed &
		// ensure it's odd so that we have a plane connecting the rounded corners
		const totalSegments = segments * 2 + 1;

		// ensure radius isn't bigger than shortest side
		radius = Math.min( width / 2, height / 2, depth / 2, radius );

		// start with a unit box geometry, its vertices will be modified to form the rounded box
		super( 1, 1, 1, totalSegments, totalSegments, totalSegments );

		this.type = 'RoundedBoxGeometry';

		/**
		 * Holds the constructor parameters that have been
		 * used to generate the geometry. Any modification
		 * after instantiation does not change the geometry.
		 *
		 * @type {Object}
		 */
		this.parameters = {
			width: width,
			height: height,
			depth: depth,
			segments: segments,
			radius: radius,
		};

		// if totalSegments is 1, no rounding is needed - return regular box
		if ( totalSegments === 1 ) return;

		const geometry2 = this.toNonIndexed();

		this.index = null;
		this.attributes.position = geometry2.attributes.position;
		this.attributes.normal = geometry2.attributes.normal;
		this.attributes.uv = geometry2.attributes.uv;

		//

		const position = new Vector3();
		const normal = new Vector3();

		const box = new Vector3( width, height, depth ).divideScalar( 2 ).subScalar( radius );

		const positions = this.attributes.position.array;
		const normals = this.attributes.normal.array;
		const uvs = this.attributes.uv.array;

		const faceTris = positions.length / 6;
		const faceDirVector = new Vector3();
		const halfSegmentSize = 0.5 / totalSegments;

		for ( let i = 0, j = 0; i < positions.length; i += 3, j += 2 ) {

			position.fromArray( positions, i );
			normal.copy( position );
			normal.x -= Math.sign( normal.x ) * halfSegmentSize;
			normal.y -= Math.sign( normal.y ) * halfSegmentSize;
			normal.z -= Math.sign( normal.z ) * halfSegmentSize;
			normal.normalize();

			positions[ i + 0 ] = box.x * Math.sign( position.x ) + normal.x * radius;
			positions[ i + 1 ] = box.y * Math.sign( position.y ) + normal.y * radius;
			positions[ i + 2 ] = box.z * Math.sign( position.z ) + normal.z * radius;

			normals[ i + 0 ] = normal.x;
			normals[ i + 1 ] = normal.y;
			normals[ i + 2 ] = normal.z;

			const side = Math.floor( i / faceTris );

			switch ( side ) {

				case 0: // right

					// generate UVs along Z then Y
					faceDirVector.set( 1, 0, 0 );
					uvs[ j + 0 ] = getUv( faceDirVector, normal, 'z', 'y', radius, depth );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'z', radius, height );
					break;

				case 1: // left

					// generate UVs along Z then Y
					faceDirVector.set( -1, 0, 0 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'z', 'y', radius, depth );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'z', radius, height );
					break;

				case 2: // top

					// generate UVs along X then Z
					faceDirVector.set( 0, 1, 0 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'z', radius, width );
					uvs[ j + 1 ] = getUv( faceDirVector, normal, 'z', 'x', radius, depth );
					break;

				case 3: // bottom

					// generate UVs along X then Z
					faceDirVector.set( 0, -1, 0 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'z', radius, width );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'z', 'x', radius, depth );
					break;

				case 4: // front

					// generate UVs along X then Y
					faceDirVector.set( 0, 0, 1 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'y', radius, width );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'x', radius, height );
					break;

				case 5: // back

					// generate UVs along X then Y
					faceDirVector.set( 0, 0, -1 );
					uvs[ j + 0 ] = getUv( faceDirVector, normal, 'x', 'y', radius, width );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'x', radius, height );
					break;

			}

		}

	}

	/**
	 * Factory method for creating an instance of this class from the given
	 * JSON object.
	 *
	 * @param {Object} data - A JSON object representing the serialized geometry.
	 * @returns {RoundedBoxGeometry} A new instance.
	 */
	static fromJSON( data ) {

		return new RoundedBoxGeometry(
			data.width,
			data.height,
			data.depth,
			data.segments,
			data.radius
		);

	}


}

const templates = /* @__PURE__ */ new Map();
function roundedBox(w = 1, h = 1, d = 1, segments = 2, radius = 0.1) {
  const key = [w, h, d, segments, radius].join(":");
  let template = templates.get(key);
  if (!template) {
    template = new RoundedBoxGeometry(w, h, d, segments, radius);
    templates.set(key, template);
  }
  return new BufferGeometry().copy(template);
}

function createDeskTextures() {
  const textures = [];
  function canvas(width, height) {
    const element = document.createElement("canvas");
    element.width = width;
    element.height = height;
    const context = element.getContext("2d", { willReadFrequently: true });
    const texture = new CanvasTexture(element);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    textures.push(texture);
    return { context, texture };
  }
  const wood = canvas(1024, 512), w = wood.context;
  w.fillStyle = "#917257";
  w.fillRect(0, 0, 1024, 512);
  let seed = 1703;
  const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 1e3; i++) {
    const y = random() * 512;
    w.strokeStyle = i % 3 ? "rgba(10,7,5,.10)" : "rgba(194,164,130,.07)";
    w.lineWidth = 0.3 + random() * 1.1;
    w.beginPath();
    w.moveTo(-10, y);
    w.bezierCurveTo(240, y - random() * 9, 740, y + random() * 9, 1034, y);
    w.stroke();
  }
  for (const y of [170, 340]) {
    w.fillStyle = "#30271f";
    w.fillRect(0, y, 1024, 1);
  }
  const brushed = canvas(256, 256), b = brushed.context;
  b.fillStyle = "#dedede";
  b.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const value = 202 + Math.floor(random() * 38);
    b.fillStyle = `rgb(${value},${value},${value})`;
    b.fillRect(0, y, 256, 0.4 + random() * 0.6);
  }
  brushed.texture.colorSpace = NoColorSpace;
  brushed.texture.wrapS = brushed.texture.wrapT = RepeatWrapping;
  const spill = canvas(128, 128), c = spill.context;
  const light = c.createRadialGradient(64, 10, 1, 64, 32, 96);
  light.addColorStop(0, "rgba(255,255,255,.8)");
  light.addColorStop(0.5, "rgba(255,255,255,.25)");
  light.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = light;
  c.beginPath();
  c.moveTo(42, 0);
  c.lineTo(82, 0);
  c.lineTo(124, 128);
  c.lineTo(4, 128);
  c.closePath();
  c.fill();
  const disk = canvas(512, 512), d = disk.context;
  for (let i = 0; i < 240; i++) {
    const radius = 117 + random() * 132, angle = random() * Math.PI * 2;
    d.strokeStyle = i % 4 ? "rgba(232,180,122,.55)" : "rgba(255,236,202,.9)";
    d.lineWidth = 0.6 + random() * 2.6;
    d.beginPath();
    d.arc(256, 256, radius, angle, angle + 0.2 + random() * 1.5);
    d.stroke();
  }
  const shadow = canvas(128, 128), sh = shadow.context, radial = sh.createRadialGradient(64, 64, 4, 64, 64, 64);
  radial.addColorStop(0, "rgba(0,0,0,.65)");
  radial.addColorStop(1, "rgba(0,0,0,0)");
  sh.fillStyle = radial;
  sh.fillRect(0, 0, 128, 128);
  return {
    wood: wood.texture,
    brushed: brushed.texture,
    spill: spill.texture,
    disk: disk.texture,
    shadow: shadow.texture,
    dispose() {
      textures.forEach((texture) => texture.dispose());
    }
  };
}

const cache = /* @__PURE__ */ new Map();
const loader = new TextureLoader();
function acquire(asset, map) {
  const path = `./materials/atelier/${asset}-${map}.jpg`;
  let entry = cache.get(path);
  if (!entry) {
    let finish;
    const ready = new Promise((resolve) => {
      finish = resolve;
    });
    startup.resource(path);
    const texture = loader.load(path, () => {
      startup.settleResource(path);
      finish();
    }, void 0, () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      context.fillStyle = map === "nor_gl" ? "#8080ff" : "#ffffff";
      context.fillRect(0, 0, 1, 1);
      texture.image = canvas;
      texture.needsUpdate = true;
      startup.settleResource(path, true);
      console.warn("Local material fallback:", path);
      finish();
    });
    texture.colorSpace = map === "diffuse" ? SRGBColorSpace : NoColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = 4;
    entry = { texture, ready, users: 0 };
    cache.set(path, entry);
  }
  entry.users++;
  return { texture: entry.texture, release() {
    if (--entry.users === 0) {
      entry.texture.dispose();
      if (cache.get(path) === entry) cache.delete(path);
    }
  } };
}
function createPbrSurface(asset) {
  const maps = [acquire(asset, "diffuse"), acquire(asset, "nor_gl"), acquire(asset, "rough")];
  let disposed = false;
  return {
    color: maps[0].texture,
    normal: maps[1].texture,
    roughness: maps[2].texture,
    dispose() {
      if (!disposed) {
        disposed = true;
        maps.forEach((map) => map.release());
      }
    }
  };
}
async function waitForSurfaceTextures() {
  await Promise.all(Array.from(cache.values(), (entry) => entry.ready));
}

function createGalleryStone(surface = "floor") {
  return createPbrSurface(surface === "column" ? "marble016" : surface === "counter" ? "granite002a" : "granite_tile");
}

const GRAVITY_GLYPHS = [{ "char": "G", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [-10.088641006267459, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[-0.278631, -0.236034], [-0.278103, 0.255718], [-0.275328, 0.283989], [-0.267927, 0.319341], [-0.256298, 0.352017], [-0.24044, 0.382016], [-0.225772, 0.402758], [-0.208725, 0.421995], [-0.189483, 0.439561], [-0.168646, 0.454921], [-0.14626, 0.468032], [-0.122324, 0.478896], [-0.096839, 0.487513], [-0.069805, 0.493881], [-0.041221, 0.498002], [-0.011087, 0.499875], [0.029962, 0.498865], [0.059096, 0.495461], [0.086701, 0.489787], [0.112779, 0.481844], [0.13733, 0.471631], [0.167687, 0.454483], [0.181848, 0.444396], [0.201816, 0.427374], [0.225287, 0.401847], [0.244491, 0.373681], [0.259427, 0.342877], [0.270096, 0.309435], [0.276498, 0.273355], [0.278631, 0.234637], [0.277783, 0.176109], [0.272055, 0.168199], [0.263021, 0.164838], [0.098464, 0.164804], [0.092502, 0.165831], [0.085446, 0.170948], [0.081916, 0.178745], [0.081549, 0.244302], [0.077824, 0.269558], [0.069134, 0.291245], [0.061181, 0.302987], [0.053531, 0.311223], [0.040437, 0.320913], [0.028059, 0.32652], [0.011445, 0.330288], [-6653e-6, 0.330826], [-0.020693, 0.328808], [-0.035939, 0.323425], [-0.047311, 0.316472], [-0.059358, 0.305168], [-0.067699, 0.293705], [-0.075147, 0.278109], [-0.079221, 0.263579], [-0.081549, 0.244302], [-0.081083, -0.25095], [-0.078561, -0.266596], [-0.0741, -0.280847], [-0.067699, -0.293705], [-0.059358, -0.305168], [-0.04944, -0.314812], [-0.038311, -0.322213], [-0.025969, -0.327372], [-0.012415, -0.330288], [2417e-6, -0.330961], [0.017196, -0.329391], [0.030641, -0.325578], [0.042753, -0.319522], [0.053531, -0.311223], [0.062927, -0.30075], [0.070492, -0.288729], [0.07701, -0.272464], [0.080307, -0.257376], [0.081665, -0.240894], [0.081401, -0.123092], [0.079328, -0.119927], [0.07529, -0.118727], [0.010449, -0.118503], [3524e-6, -0.115651], [-1828e-6, -0.10939], [-3492e-6, -0.101955], [-3483e-6, 0.022925], [-1828e-6, 0.029781], [2651e-6, 0.035364], [7307e-6, 0.038079], [0.013268, 0.039106], [0.261872, 0.039106], [0.268331, 0.037884], [0.275882, 0.031643], [0.278623, 0.022925], [0.278098, -0.255718], [0.27383, -0.293078], [0.267829, -0.319341], [0.256093, -0.352017], [0.24009, -0.382016], [0.230488, -0.396012], [0.214085, -0.41575], [0.201816, -0.428073], [0.181848, -0.444931], [0.160353, -0.459541], [0.145174, -0.468032], [0.129316, -0.475525], [0.104256, -0.48489], [0.086701, -0.489885], [0.059096, -0.495505], [9692e-6, -0.499875], [-0.021304, -0.499501], [-0.050921, -0.496878], [-0.069805, -0.493881], [-0.096839, -0.487513], [-0.130475, -0.475525], [-0.14626, -0.468032], [-0.168646, -0.454921], [-0.18271, -0.444931], [-0.202514, -0.428073], [-0.214672, -0.41575], [-0.230926, -0.396012], [-0.244801, -0.374767], [-0.25273, -0.359768], [-0.259602, -0.344099], [-0.267927, -0.319341], [-0.275328, -0.283989], [-0.278103, -0.255718]], "holes": [] }] }, { "char": "R", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [-6.718519997488527, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[0.083571, -0.485714], [-0.026429, -0.091429], [-0.029348, -0.087391], [-0.032867, -0.085754], [-0.082143, -0.085714], [-0.0875, -0.0875], [-0.089286, -0.092857], [-0.089286, -0.482857], [-0.090987, -0.490461], [-0.09692, -0.497187], [-0.105253, -0.499965], [-0.273571, -0.5], [-0.28308, -0.497187], [-0.287242, -0.493274], [-0.289664, -0.488955], [-0.290714, -0.482857], [-0.290714, 0.482857], [-0.287902, 0.492366], [-0.283988, 0.496528], [-0.279669, 0.49895], [-0.273571, 0.5], [0.027976, 0.499737], [0.065476, 0.495794], [0.100833, 0.487118], [0.128661, 0.476274], [0.155, 0.462143], [0.179386, 0.445036], [0.201354, 0.425263], [0.220904, 0.402824], [0.234803, 0.382953], [0.25, 0.355714], [0.262531, 0.326275], [0.270458, 0.301473], [0.277743, 0.268909], [0.281473, 0.241607], [0.283338, 0.213194], [0.283348, 0.184663], [0.281562, 0.157679], [0.277991, 0.131806], [0.271016, 0.101027], [0.263426, 0.077654], [0.254051, 0.055392], [0.243002, 0.034375], [0.227222, 0.010317], [0.213036, -7143e-6], [0.19746, -0.023016], [0.180496, -0.037302], [0.159643, -0.051607], [0.157148, -0.056102], [0.289286, -0.48], [0.290714, -0.485714], [0.290278, -0.490079], [0.286104, -0.496999], [0.276282, -0.499975], [0.102282, -0.499975], [0.095377, -0.498785], [0.090714, -0.496429], [0.086429, -0.491964]], "holes": [[[-0.089286, 0.32], [-0.088678, 0.072155], [-0.086496, 0.069576], [-0.082726, 0.068584], [-0.014195, 0.068632], [3259e-6, 0.070759], [0.019287, 0.075924], [0.036638, 0.086132], [0.054286, 0.103571], [0.068166, 0.125993], [0.076291, 0.148404], [0.081369, 0.178274], [0.081708, 0.211752], [0.077307, 0.242803], [0.069762, 0.266032], [0.060815, 0.283002], [0.047065, 0.300346], [0.031083, 0.313471], [0.013047, 0.322221], [-0.01059, 0.3269], [-0.082143, 0.327143], [-0.0875, 0.325357]]] }] }, { "char": "A", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [-3.146078664155194, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[0.119683, -0.484286], [0.096691, -0.345469], [0.094311, -0.3415], [0.088254, -0.34], [-0.093175, -0.34], [-0.098829, -0.34124], [-0.101508, -0.34496], [-0.12495, -0.486796], [-0.127302, -0.493016], [-0.131617, -0.497272], [-0.136714, -0.499318], [-0.143175, -0.5], [-0.311825, -0.499968], [-0.320159, -0.497937], [-0.323175, -0.495357], [-0.324921, -0.491746], [-0.324603, -0.481429], [-0.114343, 0.485568], [-0.10999, 0.494653], [-0.102021, 0.499318], [0.098113, 0.499973], [0.103879, 0.499018], [0.109325, 0.496071], [0.113165, 0.491161], [0.115136, 0.485568], [0.325397, -0.487143], [0.324415, -0.492768], [0.322096, -0.496228], [0.318413, -0.498571], [0.312192, -0.499911], [0.138254, -0.5], [0.130665, -0.499018], [0.12504, -0.496071], [0.121379, -0.491161]], "holes": [[[-0.06746, -0.184286], [0.061691, -0.184273], [0.065575, -0.183046], [0.067004, -0.180268], [-317e-6, 0.212857], [-1927e-6, 0.215885], [-4137e-6, 0.217113], [-6922e-6, 0.216243], [-8889e-6, 0.212857], [-0.073175, -0.177143], [-0.071746, -0.1825]]] }] }, { "char": "V", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [0.4216600025114725, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[-0.111111, -0.484286], [-0.316825, 0.487143], [-0.315843, 0.492768], [-0.311478, 0.497768], [-0.302393, 0.499978], [-0.116825, 0.5], [-0.107143, 0.498254], [-0.100424, 0.492116], [-0.0984, 0.485568], [317e-6, -0.144286], [2103e-6, -0.148571], [4603e-6, -0.15], [7103e-6, -0.148571], [8889e-6, -0.144286], [0.1063, 0.491161], [0.111617, 0.497272], [0.121773, 0.499973], [0.301746, 0.5], [0.310635, 0.49842], [0.313968, 0.496099], [0.316032, 0.492746], [0.316349, 0.482944], [0.108569, -0.490151], [0.102609, -0.497272], [0.093033, -0.499973], [-0.093827, -0.499973], [-0.099593, -0.499018], [-0.10504, -0.496071], [-0.108879, -0.491161]], "holes": [] }] }, { "char": "I", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [2.9051836215590914, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[-0.100714, -0.482857], [-0.100402, 0.486295], [-0.098492, 0.491429], [-0.094866, 0.495799], [-0.090179, 0.49875], [-0.084747, 0.499965], [0.087009, 0.499687], [0.092143, 0.497778], [0.096886, 0.493717], [0.099664, 0.488955], [0.100706, 0.483449], [0.100402, -0.486295], [0.098492, -0.491429], [0.094866, -0.495799], [0.090179, -0.49875], [0.084747, -0.499965], [-0.084163, -0.499991], [-0.090681, -0.498533], [-0.096122, -0.49458], [-0.099664, -0.488955]], "holes": [] }] }, { "char": "T", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [5.361524764416234, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[0.3, 0.482857], [0.299991, 0.343694], [0.298299, 0.336682], [0.293274, 0.330615], [0.288955, 0.328193], [0.283449, 0.327152], [0.103703, 0.32713], [0.099573, 0.325903], [0.097341, 0.322183], [0.097143, -0.482857], [0.095893, -0.489464], [0.089967, -0.496866], [0.081176, -0.499965], [-0.087143, -0.5], [-0.09375, -0.49875], [-0.101473, -0.492366], [-0.104286, -0.482857], [-0.104484, 0.322183], [-0.106716, 0.325903], [-0.110846, 0.32713], [-0.283449, 0.327152], [-0.288955, 0.328193], [-0.294152, 0.331344], [-0.298533, 0.337176], [-0.299991, 0.343694], [-0.3, 0.482857], [-0.29875, 0.489464], [-0.292366, 0.497187], [-0.283449, 0.499991], [0.282857, 0.5], [0.289464, 0.49875], [0.295, 0.495], [0.29875, 0.489464]], "holes": [] }] }, { "char": "Y", "accent": false, "height": 4.08, "stretch": 1.27, "depth": 0.95, "home": [8.854200818302738, 8.25, -0.4], "rotation": [0, 0, 0, 1], "outline": [{ "outer": [[-0.10143, -0.482833], [-0.10143, -0.110873], [-0.10286, -0.102289], [-0.303772, 0.481491], [-0.304577, 0.487124], [-0.303593, 0.492758], [-0.29843, 0.498189], [-0.28884, 0.5], [-0.111583, 0.499975], [-0.102681, 0.497988], [-0.096979, 0.493642], [-0.092846, 0.485694], [-4148e-6, 0.143777], [-236e-5, 0.140558], [144e-6, 0.139485], [2648e-6, 0.140558], [4436e-6, 0.143777], [0.093134, 0.485694], [0.097267, 0.493642], [0.103943, 0.49841], [0.111871, 0.499975], [0.289128, 0.5], [0.296639, 0.498748], [0.301259, 0.495793], [0.303899, 0.491646], [0.304547, 0.486091], [0.303434, 0.479971], [0.101718, -0.102289], [0.100287, -0.110873], [0.100287, -0.482833], [0.099035, -0.489449], [0.093101, -0.496862], [0.084297, -0.499965], [-0.084855, -0.499991], [-0.091382, -0.498531], [-0.096831, -0.494572], [-0.100378, -0.488939]], "holes": [] }] }, { "char": "O", "accent": true, "height": 5.8, "stretch": 1.42, "depth": 1.55, "home": [-4.106251428571429, 3.2, 1.3], "rotation": [-0.015338305547461977, -0.05066895167625268, -0.04155381030822455, 0.9977327671114297], "outline": [{ "outer": [[-0.282821, -0.223464], [-0.282821, 0.223464], [-0.281621, 0.254103], [-0.276287, 0.29251], [-0.266685, 0.328125], [-0.256683, 0.353003], [-0.239612, 0.383729], [-0.224009, 0.404941], [-0.206006, 0.424581], [-0.185994, 0.442257], [-0.164368, 0.457577], [-0.141127, 0.470539], [-0.116271, 0.481145], [-0.0898, 0.489394], [-0.061714, 0.495286], [-0.032014, 0.498822], [9921e-6, 0.499869], [0.040716, 0.497905], [0.069918, 0.493584], [0.097528, 0.486906], [0.123544, 0.477872], [0.147967, 0.46648], [0.170797, 0.452732], [0.192034, 0.436627], [0.217688, 0.411662], [0.23424, 0.390974], [0.248371, 0.368715], [0.263443, 0.336592], [0.271921, 0.310667], [0.277977, 0.28317], [0.28161, 0.254103], [0.282821, 0.223464], [0.282283, -0.244064], [0.277977, -0.28317], [0.269364, -0.319483], [0.256445, -0.353003], [0.23922, -0.383729], [0.223475, -0.404941], [0.211632, -0.418209], [0.192034, -0.436627], [0.178053, -0.447626], [0.155754, -0.46216], [0.140003, -0.470539], [0.123544, -0.477872], [0.097528, -0.486906], [0.079299, -0.49162], [0.050627, -0.496727], [0.030628, -0.498822], [-698e-6, -0.5], [-0.032014, -0.498822], [-0.051994, -0.496727], [-0.080618, -0.49162], [-0.098803, -0.486906], [-0.133021, -0.474337], [-0.1568, -0.46216], [-0.171756, -0.452732], [-0.192844, -0.436627], [-0.206006, -0.424581], [-0.218275, -0.411662], [-0.234678, -0.390974], [-0.248681, -0.368715], [-0.256683, -0.353003], [-0.266685, -0.328125], [-0.272019, -0.310667], [-0.279487, -0.273656], [-0.282288, -0.244064]], "holes": [[[0.085894, -0.231844], [0.085894, 0.231844], [0.083874, 0.256429], [0.078928, 0.275138], [0.071013, 0.291665], [0.060146, 0.305993], [0.046994, 0.317341], [0.034567, 0.324197], [0.017895, 0.329303], [-698e-6, 0.331006], [-0.019248, 0.329303], [-0.033172, 0.325284], [-0.043307, 0.320367], [-0.05255, 0.313937], [-0.062849, 0.303771], [-0.069891, 0.294208], [-0.076892, 0.28089], [-0.081893, 0.266057], [-0.084894, 0.249708], [-0.085894, 0.231844], [-0.085894, -0.231844], [-0.083333, -0.259699], [-0.078052, -0.278044], [-0.071451, -0.291665], [-0.060901, -0.305993], [-0.04804, -0.317341], [-0.035789, -0.324197], [-0.019248, -0.329303], [-3929e-6, -0.330958], [0.014929, -0.329824], [0.031922, -0.325284], [0.044615, -0.318901], [0.055975, -0.310154], [0.067716, -0.29669], [0.076619, -0.28089], [0.081772, -0.266057], [0.084863, -0.249708]]] }] }, { "char": "F", "accent": true, "height": 5.8, "stretch": 1.42, "depth": 1.55, "home": [1.0761899281723863, 3.2, 1.3], "rotation": [-0.01687346189770309, 0.03528817033497569, 0.01687346189770309, 0.9990922467928491], "outline": [{ "outer": [[0.244286, 0.327143], [-0.052857, 0.327143], [-0.056416, 0.326535], [-0.058996, 0.324353], [-0.06, 0.32], [-0.059206, 0.090317], [-0.056825, 0.087937], [-0.052857, 0.087143], [0.117734, 0.087134], [0.12324, 0.086093], [0.128002, 0.083315], [0.132584, 0.077604], [0.134277, 0.070592], [0.13386, -0.072556], [0.132063, -0.077143], [0.128437, -0.081513], [0.12375, -0.084464], [0.118895, -0.085636], [-0.052857, -0.085714], [-0.056825, -0.086508], [-0.059206, -0.088889], [-0.06, -0.482857], [-0.06105, -0.488955], [-0.064201, -0.494152], [-0.070033, -0.498533], [-0.076551, -0.499991], [-0.244286, -0.5], [-0.252857, -0.497778], [-0.259206, -0.491429], [-0.261429, -0.482857], [-0.261429, 0.482857], [-0.259206, 0.491429], [-0.252857, 0.497778], [-0.244286, 0.5], [0.244286, 0.5], [0.249866, 0.499132], [0.257956, 0.493274], [0.261394, 0.484033], [0.26142, 0.343694], [0.259962, 0.337176], [0.256008, 0.331735], [0.250383, 0.328193]], "holes": [] }] }, { "char": "F", "accent": true, "height": 5.8, "stretch": 1.42, "depth": 1.55, "home": [5.982441356743815, 3.2, 1.3], "rotation": [-0.01792435572973984, 0.034766163919495614, -0.013102402281675378, 0.9991488169299135], "outline": [{ "outer": [[0.244286, 0.327143], [-0.052857, 0.327143], [-0.056416, 0.326535], [-0.058996, 0.324353], [-0.06, 0.32], [-0.059206, 0.090317], [-0.056825, 0.087937], [-0.052857, 0.087143], [0.117734, 0.087134], [0.12324, 0.086093], [0.128002, 0.083315], [0.132584, 0.077604], [0.134277, 0.070592], [0.13386, -0.072556], [0.132063, -0.077143], [0.128437, -0.081513], [0.12375, -0.084464], [0.118895, -0.085636], [-0.052857, -0.085714], [-0.056825, -0.086508], [-0.059206, -0.088889], [-0.06, -0.482857], [-0.06105, -0.488955], [-0.064201, -0.494152], [-0.070033, -0.498533], [-0.076551, -0.499991], [-0.244286, -0.5], [-0.252857, -0.497778], [-0.259206, -0.491429], [-0.261429, -0.482857], [-0.261429, 0.482857], [-0.259206, 0.491429], [-0.252857, 0.497778], [-0.244286, 0.5], [0.244286, 0.5], [0.249866, 0.499132], [0.257956, 0.493274], [0.261394, 0.484033], [0.26142, 0.343694], [0.259962, 0.337176], [0.256008, 0.331735], [0.250383, 0.328193]], "holes": [] }] }];

const glyphTemplates = /* @__PURE__ */ new Map();
function createGlyphGeometry(glyph) {
  const shapes = glyph.outline.map((path) => {
    const shape = new Shape(path.outer.map(([x, y]) => new Vector2(x * glyph.height * glyph.stretch, y * glyph.height)));
    shape.holes = path.holes.map((hole) => new Path(hole.map(([x, y]) => new Vector2(x * glyph.height * glyph.stretch, y * glyph.height))));
    return shape;
  });
  const bevel = glyph.accent ? 0.19 : 0.115;
  const raw = new ExtrudeGeometry(shapes, { depth: glyph.depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 7, steps: 1, curveSegments: 1 });
  raw.translate(0, 0, -glyph.depth / 2 + bevel);
  raw.deleteAttribute("normal");
  const geometry = mergeVertices(raw, 1e-4);
  raw.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
function clearGravityGlyphCache() {
  glyphTemplates.forEach((geometry) => geometry.dispose());
  glyphTemplates.clear();
}
async function prepareGravityGlyphs(signal) {
  function* steps() {
    let complete = false;
    try {
      for (const [index, glyph] of GRAVITY_GLYPHS.entries()) {
        if (!glyphTemplates.has(index)) glyphTemplates.set(index, createGlyphGeometry(glyph));
        yield;
      }
      complete = true;
    } finally {
      if (!complete) clearGravityGlyphCache();
    }
  }
  await buildIncrementally(steps(), "gravity-glyphs", signal);
}
function createGravityExhibit(base, edge, shadowMap) {
  const root = new Group();
  root.name = "Desk.Gravity";
  root.position.set(0.04, 0, -0.22);
  const plinth = new Mesh(roundedBox(2.35, 0.07, 0.8, 2, 0.025), base);
  plinth.position.y = 0.04;
  plinth.castShadow = plinth.receiveShadow = true;
  root.add(plinth);
  const rim = new Mesh(roundedBox(2.28, 8e-3, 0.012, 1, 3e-3), edge);
  rim.position.set(0, 0.081, 0.37);
  root.add(rim);
  const graphite = new MeshPhysicalMaterial({ color: 2894895, metalness: 0.43, roughness: 0.36, clearcoat: 0.45, clearcoatRoughness: 0.32, envMapIntensity: 2.8 });
  const vermilion = new MeshPhysicalMaterial({ color: 10688008, metalness: 0.24, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 2.2 });
  const materials = [graphite, vermilion];
  const letters = new Group();
  letters.name = "Desk.Gravity.Letters";
  const meshes = GRAVITY_GLYPHS.map((glyph, index) => {
    const geometry = glyphTemplates.has(index) ? glyphTemplates.get(index).clone() : createGlyphGeometry(glyph);
    const mesh = new Mesh(geometry, glyph.accent ? vermilion : graphite);
    mesh.name = "Desk.Gravity.Letter." + index + "." + glyph.char;
    mesh.userData.accent = glyph.accent;
    mesh.position.fromArray(glyph.home);
    mesh.quaternion.fromArray(glyph.rotation);
    mesh.castShadow = mesh.receiveShadow = true;
    letters.add(mesh);
    return mesh;
  });
  for (const accent of [false, true]) {
    letters.updateMatrixWorld(true);
    const bounds2 = new Box3();
    meshes.filter((mesh) => mesh.userData.accent === accent).forEach((mesh) => bounds2.union(new Box3().setFromObject(mesh)));
    const center = (bounds2.min.x + bounds2.max.x) / 2;
    meshes.filter((mesh) => mesh.userData.accent === accent).forEach((mesh) => {
      mesh.position.x -= center;
    });
  }
  letters.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(letters), scale = 2.1 / (bounds.max.x - bounds.min.x), lift = 0.078 - bounds.min.y * scale;
  meshes.forEach((mesh) => {
    mesh.geometry.scale(scale, scale, scale);
    mesh.position.multiplyScalar(scale);
    mesh.position.y += lift;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  });
  letters.updateMatrixWorld(true);
  const rows = [false, true].map((accent) => {
    const box = new Box3();
    meshes.filter((mesh) => mesh.userData.accent === accent).forEach((mesh) => box.union(new Box3().setFromObject(mesh)));
    return { text: accent ? "OFF" : "GRAVITY", centerX: (box.min.x + box.max.x) / 2, width: box.max.x - box.min.x };
  });
  root.add(letters);
  const contactMaterial = new MeshBasicMaterial({ map: shadowMap, transparent: true, opacity: 0.65, depthWrite: false });
  const contactGeometry = new PlaneGeometry(1, 1);
  meshes.filter((mesh) => mesh.userData.accent).forEach((mesh) => {
    const box = new Box3().setFromObject(mesh), center = root.worldToLocal(box.getCenter(new Vector3())), size = box.getSize(new Vector3());
    const contact = new Mesh(contactGeometry, contactMaterial);
    contact.name = "Desk.Gravity.Contact";
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(center.x, 0.076, center.z);
    contact.scale.set(size.x * 1.12, Math.max(0.2, size.z + 0.13), 1);
    root.add(contact);
  });
  const homes = meshes.map((mesh) => ({ position: mesh.position.clone(), rotation: mesh.quaternion.clone() }));
  const anchor = new Vector3(0, 0.65, 0).add(root.position);
  const hitSurface = new Mesh(new BoxGeometry(2.5, 1.2, 0.65), base);
  hitSurface.name = "Desk.Gravity.HitSurface";
  hitSurface.position.set(0, 0.65, 0.03);
  hitSurface.visible = false;
  root.add(hitSurface);
  const motion = new Quaternion(), euler = new Euler();
  let spread = 0, lastSpread = -1, maxDisplacement = 0;
  const update = (mix, reduced, time, fade) => {
    spread = reduced || mix < 1e-4 ? 0 : mix;
    contactMaterial.opacity = 0.65 * (1 - spread * 0.65) * fade;
    materials.forEach((material) => {
      material.emissive.setHex(3412232);
      material.emissiveIntensity = mix * 0.13 * fade;
    });
    if (spread === 0 && lastSpread === 0) return;
    lastSpread = spread;
    maxDisplacement = 0;
    meshes.forEach((mesh, index) => {
      const home = homes[index], amount = MathUtils.smoothstep(spread, mesh.userData.accent ? 0.14 : 0, 1);
      const dx = Math.sign(home.position.x) * amount * (0.025 + index % 3 * 0.012);
      const dy = amount * (0.08 + index % 3 * 0.045) + Math.sin(time * 1.35 + index) * amount * 9e-3;
      mesh.position.copy(home.position);
      mesh.position.x += dx;
      mesh.position.y += dy;
      mesh.position.z += Math.sin(index * 1.7) * amount * 0.045;
      motion.setFromEuler(euler.set(Math.sin(index) * amount * 0.065, Math.cos(index) * amount * 0.08, Math.sin(index * 1.3) * amount * 0.05));
      mesh.quaternion.copy(home.rotation).multiply(motion);
      maxDisplacement = Math.max(maxDisplacement, mesh.position.distanceTo(home.position));
    });
  };
  update(0, false, 0, 1);
  return { root, letters, materials: [...materials, contactMaterial], anchor, update, reset() {
    update(0, false, 0, 1);
  }, snapshot() {
    return { sourceVersion: "atelier-v3.2", letters: meshes.length, rows, spread, maxDisplacement, light: graphite.emissiveIntensity };
  } };
}

const ROOM_DESK_SCALE = 1.7 / 5.65;
const OBJECT_SCALE = 0.8;
function createRoomDeskModel(legHeight = 1.12, gallery = false) {
  const root = new Group();
  root.name = "MyRoom.Desk";
  const textures = createDeskTextures(), materials = [];
  const stone = gallery ? createGalleryStone("counter") : null;
  const cedar = createPbrSurface("japanese_cedar_planks");
  const standard = (parameters) => {
    const material = new MeshStandardMaterial(parameters);
    materials.push(material);
    return material;
  };
  const basic = (parameters) => {
    const material = new MeshBasicMaterial(parameters);
    materials.push(material);
    return material;
  };
  const wood = standard({ map: textures.wood, color: 9008741, roughness: 0.78 });
  const slab = gallery ? standard({ map: stone.color, normalMap: stone.normal, normalScale: new Vector2(0.075, 0.075), roughnessMap: stone.roughness, color: 3686216, roughness: 0.8, metalness: 0, envMapIntensity: 1.1 }) : wood;
  const graphite = standard({ color: 1514530, metalness: 0.18, roughness: 0.57 });
  const edge = new MeshPhysicalMaterial({ color: 10924220, metalness: 1, roughness: 0.42, roughnessMap: textures.brushed, anisotropy: 0.3, anisotropyRotation: Math.PI / 2, envMapIntensity: 1.8 });
  materials.push(edge);
  const bronze = standard({ color: 7035457, metalness: 1, roughness: 0.36, roughnessMap: textures.brushed, envMapIntensity: 1.5 });
  const concrete = standard({ color: 7634040, roughness: 0.85 });
  const soil = standard({ color: 2370341, roughness: 0.95 });
  const timber = standard({ map: cedar.color, normalMap: cedar.normal, normalScale: new Vector2(0.15, 0.15), roughnessMap: cedar.roughness, color: 8425627, roughness: 0.9 });
  timber.userData.tile = 1.1;
  const roof = standard({ color: 2436149, roughness: 0.62, roughnessMap: textures.brushed, metalness: 0.72, envMapIntensity: 1.6 });
  const leaves = standard({ color: 10262636, roughness: 0.95 });
  const glazing = standard({ color: 15258797, emissive: 15250554, emissiveIntensity: 0.55, roughness: 0.4 });
  const lampInside = standard({ color: 15785658, emissive: 15908222, emissiveIntensity: 1, side: DoubleSide });
  const table = new Group(), blackhole = new Group(), miniature = new Group();
  table.name = "Desk.Table";
  blackhole.name = "Desk.BlackHole";
  miniature.name = "Desk.Xiaojian";
  const gravity = createGravityExhibit(graphite, edge, textures.shadow);
  materials.push(...gravity.materials);
  root.add(table, blackhole, miniature, gravity.root);
  const kit = new Kit(1703);
  const round = (parent, material, width, height, depth, x, y, z, radius = 0.025) => {
    const geometry = roundedBox(width, height, depth, 2, Math.min(radius, height / 3));
    if (gallery && material === slab || material === timber) {
      const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
        const tile = material === timber ? 1.1 : 1.6;
        uv.setXY(i, (nx > ny && nx > nz ? p.getZ(i) + z : p.getX(i) + x) / tile, (ny > nx && ny > nz ? p.getZ(i) + z : p.getY(i) + y) / tile);
      }
    }
    kit.add(parent, material, geometry, place(x, y, z), false);
  };
  const rod = (a, b, radius, material = graphite, parent = table) => {
    const start = new Vector3(...a), end = new Vector3(...b), direction = end.clone().sub(start);
    const length = direction.length();
    const matrix = new Matrix4().compose(start.add(end).multiplyScalar(0.5), new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()), new Vector3(1, 1, 1));
    kit.add(parent, material, new CylinderGeometry(radius * 0.75, radius, length, 8), matrix, false);
  };
  if (gallery) {
    round(table, slab, 5.65, 0.3, 2.5, 0, -0.15, 0, 0.028);
    for (const x of [-2.813, 2.813]) round(table, edge, 0.014, 0.014, 2.45, x, -0.018, 0, 3e-3);
    for (const z of [-1.238, 1.238]) round(table, edge, 5.6, 0.014, 0.014, 0, -0.018, z, 3e-3);
    round(table, graphite, 5.22, 0.18, 2.13, 0, -0.399, 0, 0.012);
  } else {
    round(table, wood, 5.65, 0.17, 3.12, 0, -0.085, 0, 0.045);
    round(table, graphite, 5.43, 0.12, 2.9, 0, -0.23, 0);
    for (const x of [-2.4, 2.4]) {
      for (const z of [-1.1, 1.1]) round(table, graphite, 0.075, legHeight, 0.075, x, -0.27 - legHeight / 2, z, 0.01);
      rod([x, -0.27 - legHeight, -1.16], [x, -0.27 - legHeight, 1.16], 0.045);
    }
  }
  blackhole.position.set(-1.88, 0, 0.18);
  kit.cylinder(blackhole, graphite, 0.67, 0.7, 0.08, 0, 0.045, 0, 48, 0, 0, false);
  kit.cylinder(blackhole, bronze, 0.61, 0.61, 0.012, 0, 0.091, 0, 48, 0, 0, false);
  kit.cylinder(blackhole, edge, 0.018, 0.025, 0.65, 0, 0.4, -0.11, 12, 0, 0, false);
  const hoop = new TorusGeometry(0.73, 0.013, 8, 96);
  kit.add(blackhole, bronze, hoop, place(0, 0.9, -0.09, -0.1, 0.04, -0.17), false);
  const singularity = new Group();
  singularity.position.y = 0.9;
  singularity.rotation.set(-0.05, 0, -0.34);
  blackhole.add(singularity);
  const core = new Mesh(new SphereGeometry(0.27, 40, 24), basic({ color: 131844 }));
  singularity.add(core);
  const diskMaterial = basic({ map: textures.disk, transparent: true, side: DoubleSide, depthWrite: false, toneMapped: false });
  const disk = new Mesh(new RingGeometry(0.285, 0.77, 96), diskMaterial);
  disk.rotation.x = -Math.PI / 2;
  singularity.add(disk);
  const photon = new Mesh(new TorusGeometry(0.285, 9e-3, 8, 80), basic({ color: 16767915, transparent: true, depthWrite: false, toneMapped: false }));
  photon.rotation.x = -Math.PI / 2;
  singularity.add(photon);
  const lens = new Mesh(new TorusGeometry(0.292, 0.011, 8, 80, Math.PI), basic({ color: 16764305, transparent: true, depthWrite: false, toneMapped: false }));
  lens.position.z = -0.045;
  singularity.add(lens);
  miniature.position.set(1.86, 0, 0.1);
  miniature.rotation.y = -0.18;
  round(miniature, graphite, 1.53, 0.1, 1.47, 0, 0.06, 0);
  round(miniature, soil, 1.5, 0.025, 1.44, 0, 0.123, 0);
  round(miniature, concrete, 1.02, 0.045, 0.86, 0, 0.16, -0.15);
  round(miniature, timber, 0.95, 0.54, 0.035, 0, 0.45, -0.54);
  for (const x of [-0.475, 0.475]) round(miniature, timber, 0.035, 0.54, 0.78, x, 0.45, -0.15);
  round(miniature, timber, 0.515, 0.54, 0.035, -0.2175, 0.45, 0.24);
  round(miniature, timber, 0.18, 0.54, 0.035, 0.385, 0.45, 0.24);
  round(miniature, timber, 0.25, 0.105, 0.035, 0.17, 0.6675, 0.24);
  const gable = new Shape();
  gable.moveTo(-0.475, 0);
  gable.lineTo(0, 0.34);
  gable.lineTo(0.475, 0);
  gable.closePath();
  kit.add(miniature, timber, new ExtrudeGeometry(gable, { depth: 0.78, bevelEnabled: false }), place(0, 0.72, -0.54), false);
  const slope = Math.atan2(0.37, 0.54), roofLength = Math.hypot(0.54, 0.37);
  for (const side of [-1, 1]) {
    kit.cube(miniature, roof, roofLength, 0.05, 0.97, side * 0.27, 0.905, -0.15, 0, 0, -side * slope, false);
    for (const z of [-0.635, 0.335]) kit.cube(miniature, graphite, roofLength, 0.032, 0.025, side * 0.27, 0.89, z, 0, 0, -side * slope, false);
  }
  round(miniature, graphite, 0.036, 0.035, 0.99, 0, 1.098, -0.15, 5e-3);
  for (const x of [-0.44, -0.33, -0.22, -0.11, 0.11, 0.22, 0.33, 0.44]) round(miniature, graphite, 9e-3, 0.012, 0.94, x, 1.11 - Math.abs(x) * 0.685, -0.15, 2e-3);
  for (const x of [-0.44, -0.34, -0.24, -0.14, -0.04, 0.36, 0.44]) kit.cube(miniature, graphite, 6e-3, 0.52, 7e-3, x, 0.45, 0.261, 0, 0, 0, false);
  for (let i = 0; i < 10; i++) for (const x of [-0.495, 0.495]) kit.cube(miniature, graphite, 6e-3, 0.52, 6e-3, x, 0.45, -0.51 + i * 0.077, 0, 0, 0, false);
  round(miniature, roof, 0.09, 0.25, 0.09, 0.21, 1.05, -0.31, 4e-3);
  round(miniature, edge, 0.11, 0.018, 0.11, 0.21, 1.18, -0.31, 4e-3);
  round(miniature, graphite, 0.29, 0.27, 0.035, -0.245, 0.49, 0.275, 7e-3);
  round(miniature, glazing, 0.235, 0.215, 0.015, -0.245, 0.49, 0.296, 5e-3);
  round(miniature, timber, 0.012, 0.22, 0.018, -0.245, 0.49, 0.309, 3e-3);
  round(miniature, timber, 0.24, 0.012, 0.018, -0.245, 0.49, 0.309, 3e-3);
  const windowFrame = new Object3D();
  windowFrame.name = "Desk.House.Window";
  windowFrame.position.set(-0.245, 0.49, 0.319);
  miniature.add(windowFrame);
  const doorFrame = new Object3D();
  doorFrame.name = "Desk.House.Door";
  doorFrame.position.set(0.17, 0.395, 0.3);
  miniature.add(doorFrame);
  round(miniature, graphite, 0.025, 0.24, 0.34, 0.494, 0.49, -0.16, 5e-3);
  round(miniature, glazing, 0.013, 0.19, 0.285, 0.511, 0.49, -0.16, 4e-3);
  round(miniature, timber, 0.015, 0.19, 0.012, 0.52, 0.49, -0.16, 3e-3);
  const interior = basic({ color: 1577742 });
  round(miniature, interior, 0.25, 0.43, 0.012, 0.17, 0.395, 0.19, 4e-3);
  const hinge = new Group();
  hinge.name = "Desk.House.DoorHinge";
  hinge.position.set(0.045, 0.395, 0.275);
  miniature.add(hinge);
  round(hinge, timber, 0.25, 0.43, 0.026, 0.125, 0, 0, 8e-3);
  round(hinge, edge, 0.012, 0.055, 0.025, 0.218, -0.035, 0.025, 3e-3);
  round(miniature, roof, 0.4, 0.035, 0.24, 0.17, 0.72, 0.34, 8e-3);
  for (const x of [-0.015, 0.355]) round(miniature, timber, 0.02, 0.49, 0.02, x, 0.42, 0.43, 4e-3);
  for (let i = 0; i < 3; i++) round(miniature, concrete, 0.24, 0.018, 0.105, 0.17, 0.145, 0.39 + i * 0.125, 9e-3);
  rod([-0.62, 0.14, 0.02], [-0.65, 0.95, 0.02], 0.017, timber, miniature);
  const foliage = new IcosahedronGeometry(0.032, 0);
  for (let i = 0; i < 9; i++) {
    const y = 0.5 + i * 0.061, a = i * 2.4, reach = 0.14 + kit.random() * 0.11;
    const x = -0.65 + Math.cos(a) * reach, z = 0.02 + Math.sin(a) * reach;
    rod([-0.64, y - 0.12, 0.02], [x, y + 0.12, z], 7e-3, timber, miniature);
    for (let j = 0; j < 12; j++) kit.instance(miniature, foliage, leaves, place(x + (kit.random() - 0.5) * 0.21, y + 0.1 + kit.random() * 0.15, z + (kit.random() - 0.5) * 0.2, kit.random(), 0, 0.2, [0.65 + kit.random() * 0.7, 0.6, 0.65 + kit.random() * 0.7]), i % 2 ? 10920062 : 8358261, false);
  }
  const rock = new IcosahedronGeometry(0.065, 0);
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4, x = Math.cos(a) * (0.54 + kit.random() * 0.1), z = Math.sin(a) * 0.56;
    if (z > 0.35 && Math.abs(x - 0.17) < 0.2) continue;
    kit.instance(miniature, rock, concrete, place(x, 0.155, z, a, 0, 0.3, [1, 0.5, 0.7 + kit.random()]), 9147024, false);
  }
  const spillMaterial = basic({ map: textures.spill, color: 16761986, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const spill = new Mesh(new PlaneGeometry(0.36, 0.46), spillMaterial);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0.17, 0.16, 0.48);
  miniature.add(spill);
  if (!gallery) {
    kit.cylinder(table, graphite, 0.24, 0.28, 0.06, -2.08, 0.032, -0.82, 24);
    rod([-2.08, 0.07, -0.82], [-2.08, 1.2, -0.82], 0.032);
    rod([-2.08, 1.2, -0.82], [-1.64, 2.02, -0.52], 0.035);
    rod([-1.64, 2.02, -0.52], [-0.98, 1.92, -0.35], 0.035);
    kit.add(table, graphite, new ConeGeometry(0.27, 0.25, 28, 1, true), place(-0.98, 1.82, -0.35), false);
    kit.cylinder(table, lampInside, 0.23, 0.23, 0.012, -0.98, 1.705, -0.35, 28);
  }
  const meshes = kit.finish();
  const shadowMaterial = basic({ map: textures.shadow, transparent: true, depthWrite: false, opacity: 0.68 });
  for (const [x, z, sx, sz] of [[0.04, -0.22, 2.45, 0.9], [-1.88, 0.18, 1.6, 1.5], [1.86, 0.1, 1.72, 1.5]]) {
    const shadow = new Mesh(new PlaneGeometry(sx * OBJECT_SCALE, sz * OBJECT_SCALE), shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 4e-3, z);
    table.add(shadow);
  }
  const objects = [blackhole, miniature, gravity.root];
  const anchors = [new Vector3(-1.88, 0.9, 0.18), new Vector3(1.86, 0.62, 0.1), gravity.anchor];
  objects.forEach((object, index) => {
    object.scale.setScalar(OBJECT_SCALE);
    anchors[index].sub(object.position).multiplyScalar(OBJECT_SCALE).add(object.position);
  });
  root.traverse((object) => {
    const mesh = object;
    if (mesh.isMesh && mesh.material instanceof MeshStandardMaterial) mesh.castShadow = true;
  });
  const response = [0, 0, 0];
  let angle = 0;
  let speed = 0.045, tilt = 0;
  return {
    root,
    objects,
    anchors,
    windowFrame,
    doorFrame,
    doorHinge: hinge,
    exhibit: gravity.letters,
    meshes,
    materials,
    update(_time, reduced, hovered = -1, fade = 1, dt = 1 / 60, pointerX = 0, pointerY = 0) {
      for (let i = 0; i < 3; i++) response[i] = reduced ? Number(hovered === i) : MathUtils.damp(response[i], Number(hovered === i), 8, Math.min(dt, 0.1));
      speed = 0.045 + response[0] * 0.5;
      angle += reduced ? 0 : dt * speed;
      disk.rotation.z = reduced ? 0 : angle;
      tilt = reduced ? 0 : response[0] * (0.08 + pointerY * 0.015);
      singularity.rotation.x = -0.05 + tilt;
      singularity.rotation.z = -0.34 + (reduced ? 0 : response[0] * (0.05 + pointerX * 0.04));
      diskMaterial.color.setScalar((0.75 + response[0] * 0.6) * fade);
      hinge.rotation.y = reduced ? 0 : -response[1] * 0.58;
      glazing.emissiveIntensity = (0.22 + response[1] * 0.95) * fade;
      spillMaterial.opacity = response[1] * 0.65 * fade;
      gravity.update(response[2], reduced, _time, fade);
      lampInside.emissiveIntensity = fade;
    },
    reset() {
      response.fill(0);
      hinge.rotation.y = 0;
      gravity.reset();
    },
    snapshot() {
      return { doorAngle: hinge.rotation.y, windowLight: glazing.emissiveIntensity, blackholeSpeed: speed, blackholeTilt: tilt, gravity: gravity.snapshot(), parallax: [root.rotation.x, root.rotation.y] };
    },
    dispose() {
      const geometries = /* @__PURE__ */ new Set();
      root.traverse((object) => {
        if (object.isMesh) geometries.add(object.geometry);
        if (object.isInstancedMesh) object.dispose();
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.dispose();
      stone?.dispose();
      cedar.dispose();
    }
  };
}

function buildAbout(k, L, mobile) {
  const { U, HOLE } = A, M = L.M, W = 0.18;
  const zone = createZone(3, "AboutZone", [[[U.x0 - 0.3, A.H1 + A.SLAB + 0.02, U.z0 - 0.3], [U.x1 + 0.45, UTOP + A.SLAB + 0.1, U.z1 + 0.55]]], [U.x0 + 1.25, U.x1 - 0.2, UY + 0.25, UTOP - 0.2, U.z1 + 0.12], [2.6, UY + 1.3, -1]);
  const S = zone.parts, xi0 = U.x0 + W;
  const warm = L.emissive(16760453, 1.6), soft = L.emissive(16764830, 0.9);
  zone.glow.push({ material: warm, base: 1.6 }, { material: soft, base: 0.9 });
  for (const q of around({ x0: xi0, x1: U.x1, z0: U.z0, z1: U.z1 }, HOLE)) k.box(S.Structure, M.aboutFloor, q.x0, q.x1, A.H1 + A.SLAB, UY, q.z0, q.z1);
  k.box(S.Structure, M.wood, U.x0, U.x1, A.H1 + A.SLAB, UTOP, U.z0 - W, U.z0);
  k.box(S.Structure, M.wood, U.x0, xi0, A.H1 + A.SLAB, UTOP, U.z0, U.z1);
  k.box(S.Interior, M.plaster, xi0, U.x1, UY, UTOP - 0.2, U.z0, U.z0 + 0.02);
  k.box(S.Interior, M.plaster, xi0, xi0 + 0.02, UY, UTOP - 0.2, U.z0 + 0.02, U.z1 - 0.06);
  k.box(S.Interior, M.walnut, xi0, U.x1, UTOP - 0.2, UTOP, U.z0, U.z1 - 0.06);
  skirting(k, S.Interior, L, xi0 + 0.02, U.x1, U.z0 + 0.02, U.z0 + 0.035, UY);
  k.box(S.Structure, M.fascia, U.x0, U.x1 + 0.02, A.H1 + A.SLAB, UY + 0.08, U.z1 - 0.02, U.z1 + 0.06);
  const solidEnd = U.x0 + 1.15;
  k.box(S.Facade, M.wood, U.x0, solidEnd, UY + 0.08, UTOP, U.z1 - 0.12, U.z1);
  battens(k, S.Facade, L, "z", U.z1, U.x0 + 0.02, solidEnd - 0.02, UY + 0.08, UTOP - 0.02, 1, 0.12);
  glassWall(k, S.Facade, S.Glass, L, "z", U.z1, solidEnd, U.x1, UY + 0.08, UTOP, 4, 1);
  glassWall(k, S.Facade, S.Glass, L, "x", U.x1, U.z0, U.z1, UY + 0.08, UTOP, 3, 1);
  k.box(S.Facade, M.graphite, U.x1 - 0.07, U.x1 + 0.07, UY, UTOP, U.z1 - 0.07, U.z1 + 0.07);
  flatRoof(k, S.Roof, L, U.x0 - 0.3, U.x1 + 0.45, U.z0 - 0.35, U.z1 + 0.55, UTOP, { x0: U.x0, x1: U.x1, z0: U.z0 - W, z1: U.z1 }, 0.42);
  k.box(S.Roof, M.graphite, U.x0 - 0.3, U.x1 + 0.45, UTOP, UTOP + 0.012, U.z1 - 0.12, U.z1 + 0.02, false);
  k.box(S.Interior, M.black, xi0 + 0.02, U.x1 - 0.1, UTOP - 0.28, UTOP - 0.2, U.z0 + 0.02, U.z0 + 0.13, false);
  stripLight(k, S.Lights, soft, xi0 + 0.1, U.x1 - 0.2, UTOP - 0.285, UTOP - 0.275, U.z0 + 0.03, U.z0 + 0.12);
  const rail = (x0, x1, z0, z1) => {
    const len = Math.max(x1 - x0, z1 - z0), alongX = x1 - x0 > z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    k.add(S.Glass, L.glassTint, new PlaneGeometry(len, 0.95), place(cx, UY + 0.5, cz, alongX ? 0 : Math.PI / 2), false);
    k.add(S.Interior, M.silver, new BoxGeometry(alongX ? len : 0.04, 0.04, alongX ? 0.04 : len), place(cx, UY + 0.98, cz));
    k.add(S.Interior, M.graphite, new BoxGeometry(alongX ? len : 0.05, 0.06, alongX ? 0.05 : len), place(cx, UY + 0.03, cz));
  };
  rail(Math.max(HOLE.x0, xi0), HOLE.x1 - 0.95, HOLE.z1 + 0.02, HOLE.z1 + 0.02);
  k.at(xi0 + 1.25, UY, U.z0 + 0.2, 0, () => bookshelf(k, S.Interior, L, 2.2, 2.2, 0.34, 5, M.oak, 29));
  k.at(1, UY, -0.6, 0, () => rug(k, S.Props, L, 2, 1.6, M.leather));
  k.at(0.6, UY, -0.7, 0.6, () => loungeChair(k, S.Props, L));
  k.at(0.05, UY, -1.5, 0, () => floorLamp(k, S.Props, L, soft));
  const roomDesk = createRoomDeskModel(0.75 / ROOM_DESK_SCALE - 0.27);
  const desk = roomDesk.root;
  desk.name = "AboutDesk";
  desk.position.set(4.55, UY + 0.75, -0.9);
  desk.scale.setScalar(ROOM_DESK_SCALE);
  S.Props.add(desk);
  k.at(4.55, UY, 0.05, Math.PI, () => taskChair(k, S.Props, L, M.leather));
  k.at(5.2, UY, 0.35, 0, () => pottedPlant(k, S.Props, L, 1, 0.6, 23));
  if (!mobile) k.at(xi0 + 2.6, UY, U.z0 + 0.3, 0, () => pottedPlant(k, S.Props, L, 0.45, 0.4, 27));
  const light = (x, y, z, i, d) => addLight(zone, new PointLight(16758650, i, d, 2), x, y, z);
  light(4.2, UY + 1.9, -0.8, 6, 6);
  light(1, UY + 1.9, -1.2, 4.5, 6);
  return Object.assign(zone, { roomDesk });
}

const STEPS = { x0: -1.2, x1: 1.4, edge: 4.3, mid: 4.65, ledge: -0.36 };
function buildContact(k, L) {
  const { E, P, H1, FL, U, HOLE } = A, M = L.M, z0 = P.z0, door = E.door;
  const zone = createZone(4, "ContactZone", [[[E.x0 + 0.02, -0.4, door - 0.2], [E.x1 - 0.02, 3, 5]]], [E.x0 + 0.15, E.x1 - 0.15, -0.3, 2.9, door + 0.12], [0.1, 1.3, 2.4]);
  const S = zone.parts;
  const warm = L.emissive(16757864, 2.6), soft = L.emissive(16763024, 1.3);
  zone.glow.push({ material: warm, base: 2.6 }, { material: soft, base: 1.3 });
  k.box(S.Structure, M.stoneDark, E.x0, E.x1, 0, FL, z0, door);
  k.box(S.Structure, M.wood, E.x0, E.x1, 0, H1, z0 - 0.2, z0);
  k.box(S.Interior, M.plaster, E.x0, E.x1, FL, 2.95, z0, z0 + 0.02);
  skirting(k, S.Interior, L, E.x0, E.x1, z0 + 0.02, z0 + 0.035, FL);
  for (const q of around({ x0: E.x0, x1: E.x1, z0, z1: door - 0.06 }, HOLE)) k.box(S.Interior, M.walnut, q.x0, q.x1, 2.95, H1, q.z0, q.z1);
  const d0 = -0.25, d1 = 1;
  glassWall(k, S.Facade, S.Glass, L, "z", door, E.x0, d0, FL, 2.95, 2, 1);
  k.box(S.Facade, M.graphite, d0 - 0.03, d0 + 0.03, 0, 2.95, door - 0.06, door + 0.06);
  k.box(S.Facade, M.graphite, d1 - 0.03, d1 + 0.03, 0, 2.95, door - 0.06, door + 0.06);
  k.box(S.Facade, M.graphite, d0, d1, 2.72, 2.95, door - 0.06, door + 0.06);
  k.box(S.Facade, M.walnut, d0 + 0.04, d1 - 0.04, FL, 2.7, door - 0.035, door + 0.035);
  for (let x = d0 + 0.14; x < d1 - 0.05; x += 0.14) k.box(S.Facade, M.black, x - 4e-3, x + 4e-3, FL + 0.05, 2.65, door + 0.035, door + 0.04, false);
  k.box(S.Facade, M.brass, d1 - 0.2, d1 - 0.17, 0.6, 1.75, door + 0.06, door + 0.09);
  for (const y of [0.64, 1.71]) k.box(S.Facade, M.brass, d1 - 0.2, d1 - 0.17, y - 0.015, y + 0.015, door + 0.035, door + 0.07);
  k.box(S.Facade, M.silver, d0, d1, 0, 0.012, door + 0.035, door + 0.2, false);
  k.box(S.Facade, M.wood, d1 + 0.03, E.x1, 0, 2.95, door - 0.08, door);
  battens(k, S.Facade, L, "z", door, d1 + 0.06, E.x1 - 0.02, 0.02, 2.93, 1, 0.1);
  k.box(S.Facade, M.graphite, E.x0, E.x1, 2.95, H1, door - 0.08, door + 0.08);
  flatRoof(k, S.Roof, L, E.x0 - 0.02, E.x1, z0 - 0.4, door + 1.6, H1, { x0: E.x0, x1: E.x1, z0, z1: door }, 0.48, { x0: U.x0 - 0.1, x1: U.x1 + 0.1, z0: U.z0 - 0.1, z1: U.z1 + 0.1 }, HOLE, ["x1"]);
  k.box(S.Roof, M.black, E.x0 + 0.2, E.x1 - 0.2, H1 - 0.03, H1 - 0.012, door + 0.28, door + 0.36, false);
  stripLight(k, S.Lights, warm, E.x0 + 0.24, E.x1 - 0.24, H1 - 0.036, H1 - 0.03, door + 0.29, door + 0.35);
  for (const x of [-0.8, 1.1]) downlight(k, S.Lights, L, soft, x, H1 - 0.012, door + 1.1);
  k.at(0.1, 2.95, -0.8, 0, () => pendant(k, S.Lights, L, warm, 1.2, 0.7));
  k.box(S.Props, M.walnut, -1.3, -0.5, 0.4, 0.45, -1.4, -0.95);
  for (const x of [-1.2, -0.6]) k.box(S.Props, M.graphite, x - 0.02, x + 0.02, FL, 0.4, -1.35, -1);
  k.at(1.25, FL, 0.4, 0, () => pottedPlant(k, S.Props, L, 1.2, 0.6, 31));
  const { x0, x1, edge, mid, ledge } = STEPS;
  k.box(S.Structure, M.stone, x0, x1, ledge, -0.18, edge, mid);
  k.box(S.Structure, M.stoneSide, x0, x1, ledge - 0.1, ledge, edge, mid + 0.4);
  stripLight(k, S.Lights, warm, x0 + 0.05, x1 - 0.05, -0.075, -0.045, edge - 0.012, edge + 4e-3);
  stripLight(k, S.Lights, warm, x0 + 0.05, x1 - 0.05, -0.18 - 0.075, -0.18 - 0.045, mid - 0.012, mid + 4e-3);
  k.box(S.Structure, M.stoneDark, d0 - 0.2, d1 + 0.2, 0, 0.012, door + 0.2, door + 1.3, false);
  const light = (x, y, z, i, d) => addLight(zone, new PointLight(16756842, i, d, 2), x, y, z);
  light(0.1, 2.1, -0.8, 6, 6);
  light(0.2, 2.7, door + 1, 5, 5.5);
  return zone;
}

const FADE_Y = [-0.5, 6.4];
const fadeOrder = (y) => MathUtils.lerp(0.92, 0.04, MathUtils.clamp((y - FADE_Y[0]) / (FADE_Y[1] - FADE_Y[0]), 0, 1));
function createFadeUniforms() {
  return {
    uFade: { value: 0 },
    uFadeMatrix: { value: new Matrix4() },
    // 世界 → 建筑局部（米）
    uFadeBand: { value: new Vector2(...FADE_Y) },
    uTime: { value: 0 },
    uSway: { value: 0 }
  };
}
const FADE_GLSL = (
  /* glsl */
  `
  if (uFade > 0.0) {
    vec3 fl = (uFadeMatrix * vec4(vFadePos, 1.0)).xyz;
    float fh = clamp((fl.y - uFadeBand.x) / (uFadeBand.y - uFadeBand.x), 0.0, 1.0);
    float fo = mix(0.92, 0.04, fh);
    float fp = smoothstep(fo * 0.62, fo * 0.62 + 0.38, uFade);
    float fn = fract(sin(dot(floor(fl * 14.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    if (fn < fp) discard;
  }
`
);
const SWAY_GLSL = (
  /* glsl */
  `
  #ifdef USE_INSTANCING
    vec3 swayPhase = instanceMatrix[3].xyz;
  #else
    vec3 swayPhase = vec3(0.0);
  #endif
  transformed += vec3(sin(uTime * 1.1 + swayPhase.x * 1.7 + swayPhase.z), sin(uTime * 1.6 + swayPhase.y * 3.0) * 0.4, cos(uTime * 0.9 + swayPhase.z * 1.3)) * uSway;
`
);
function patchMaterial(material, U, sway = false) {
  if (material.userData.fadePatched) return;
  material.userData.fadePatched = true;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = "uniform float uTime;\nuniform float uSway;\nvarying vec3 vFadePos;\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n" + (sway ? SWAY_GLSL : "")).replace("#include <project_vertex>", "#include <project_vertex>\n{ vec4 fadeP = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nfadeP = instanceMatrix * fadeP;\n#endif\nvFadePos = (modelMatrix * fadeP).xyz; }");
    shader.fragmentShader = "uniform float uFade;\nuniform mat4 uFadeMatrix;\nuniform vec2 uFadeBand;\nvarying vec3 vFadePos;\n" + shader.fragmentShader.replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n" + FADE_GLSL);
  };
  const key = sway ? "atelier-fade-sway" : "atelier-fade";
  material.customProgramCacheKey = () => key;
}

const smooth$2 = (a, b, p) => MathUtils.smoothstep(p, a, b);
function setDoorLightProgress(group, p) {
  const hinge = group.getObjectByName("Return.Hinge");
  if (hinge) {
    hinge.rotation.y = -smooth$2(0.02, 0.28, p) * Math.PI * 0.47;
    hinge.visible = p > 1e-3 && p < 0.72;
  }
  const light = group.getObjectByName("Return.Light");
  if (light) light.material.uniforms.uOpen.value = smooth$2(0, 0.3, p);
}
function createDoorLight(x, y, z) {
  const group = new Group();
  group.name = "Contact.ReturnLight";
  group.position.set(x, y, z);
  const materials = [], geometries = [];
  const frame = new MeshBasicMaterial({ color: 12560252, transparent: true, opacity: 0.32, toneMapped: false });
  materials.push(frame);
  const box = (w, h, d, material, parent, px = 0, py = 0, pz = 0) => {
    const geometry = new BoxGeometry(w, h, d);
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    parent.add(mesh);
    return mesh;
  };
  box(0.018, 2.56, 0.035, frame, group, -0.59);
  box(0.018, 2.56, 0.035, frame, group, 0.59);
  box(1.2, 0.018, 0.035, frame, group, 0, 1.28);
  const lightMaterial = new ShaderMaterial({
    uniforms: { uOpen: { value: 0 }, uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "varying vec2 vUv; uniform float uOpen; uniform float uOpacity; void main(){float edge=smoothstep(0.,.2,vUv.x)*smoothstep(0.,.2,1.-vUv.x);float light=.16+.24*edge;vec3 color=mix(vec3(.22,.16,.10),vec3(.65,.47,.28),edge);gl_FragColor=vec4(color,light*uOpen*uOpacity);}"
  });
  materials.push(lightMaterial);
  const plane = new PlaneGeometry(1.17, 2.54);
  geometries.push(plane);
  const light = new Mesh(plane, lightMaterial);
  light.name = "Return.Light";
  light.position.z = 0.024;
  group.add(light);
  const hinge = new Group();
  hinge.name = "Return.Hinge";
  hinge.position.set(-0.58, 0, 0.047);
  group.add(hinge);
  const wood = new MeshBasicMaterial({ color: 2695963, transparent: true, side: DoubleSide });
  materials.push(wood);
  box(1.16, 2.53, 0.025, wood, hinge, 0.58);
  setDoorLightProgress(group, 0);
  return { group, setProgress: (p) => setDoorLightProgress(group, p), dispose: () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  } };
}

const PROP_LAYER = 1;
const JOURNEY_UNIT = 0.25;
const ARCH_PARTS = ["Structure", "Facade", "Roof", "Glass"];
function eachInstance(mesh, rootInverse, cb) {
  const base = rootInverse.clone().multiply(mesh.matrixWorld), m = new Matrix4();
  if (mesh.isInstancedMesh && mesh.getMatrixAt) for (let i = 0; i < (mesh.count ?? 0); i++) {
    mesh.getMatrixAt(i, m);
    cb(base.clone().multiply(m));
  }
  else cb(base);
}
function* atelierSteps(renderer, mobile) {
  let transferred = false;
  const pending = [];
  try {
    const step = bootStep("Atelier");
    const L = yield* createLibrarySteps(renderer, []);
    pending.push(() => L.dispose());
    step("library");
    const k = new Kit(1703);
    const root = new Group();
    root.name = "AtelierRoot";
    pending.push(() => {
      const geometries = /* @__PURE__ */ new Set(), materials = /* @__PURE__ */ new Set();
      root.traverse((object) => {
        const mesh = object;
        if (mesh.geometry && !sharedGeometries.includes(mesh.geometry)) geometries.add(mesh.geometry);
        if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    });
    const environment = buildEnvironment(k, L, mobile);
    pending.push(() => environment.dispose());
    step("environment");
    yield;
    const aboutZone = buildAbout(k, L, mobile);
    pending.push(() => aboutZone.roomDesk.dispose());
    yield;
    const projectZone = buildProjects(k, L, mobile);
    yield;
    const labZone = buildLab(k, L, mobile);
    yield;
    const contactZone = buildContact(k, L);
    yield;
    const zones = [projectZone, labZone, aboutZone, contactZone];
    root.add(environment.group, ...zones.map((z) => z.group));
    zones.forEach((z) => {
      z.group.userData.zone = z.id;
    });
    k.finish();
    step("zones");
    yield;
    const installation = createArtifact(LITE_DETAIL, yield* createArtifactGeometrySteps(LITE_DETAIL));
    installation.group.scale.setScalar(1.25 / HEIGHT);
    installation.group.position.set(4.9, 0.64 + 0.68, 1.5);
    installation.setOpacity(1, 0, 0);
    zones[1].parts.Props.add(installation.group);
    yield;
    const officeDesk = zones[2].parts.Props.getObjectByName("AboutDesk");
    const deskFrame = place(4.55, UY + 0.75, -0.9);
    const objectPositions = [new Vector3(-5.55, 1.18, -0.78), new Vector3(4.9, 1.32, 1.5), new Vector3(4.55, UY + 0.95, -0.9), new Vector3(0.375, 1.4, A.E.door + 0.12)];
    const objectSizes = [[0.9, 0.7, 0.25], [1, 1.4, 0.8], [1.8, 1.4, 1.1], [1.17, 2.54, 0.2]];
    const objectProxies = zones.map((zone, i) => {
      const [w, h, d] = objectSizes[i];
      const proxy = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial());
      proxy.position.copy(objectPositions[i]);
      proxy.visible = false;
      proxy.userData.zone = zone.id;
      proxy.name = `${zone.name}.InternalObject`;
      zone.group.add(proxy);
      return proxy;
    });
    const returnLight = createDoorLight(0.375, 1.4, A.E.door + 0.1);
    zones[3].parts.Props.add(returnLight.group);
    const rectangle = (x, y, z, w, h, ry = 0) => {
      const transform = place(x, y, z, ry);
      return [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]].map(([a2, b2]) => new Vector3(a2, b2, 0).applyMatrix4(transform));
    };
    const monitorTransform = place(-5.6, A.FL, -0.5).multiply(place(0.05, 0.75, -0.28, -0.04));
    const handoffSources = {
      1: rectangle(0, 0.1 + 0.4 / 2, -0.018, 0.68, 0.38).map((v) => v.applyMatrix4(monitorTransform)),
      2: rectangle(4.9, 1.32, 1.5, 1.25, 1.25),
      3: [[-0.85, 0, -0.47], [0.85, 0, -0.47], [0.85, 0, 0.47], [-0.85, 0, 0.47]].map((p) => new Vector3().fromArray(p).applyMatrix4(deskFrame)),
      4: rectangle(0.375, 1.4, A.E.door + 0.145, 1.17, 2.54)
    };
    for (const z of zones) z.parts.Props.traverse((o) => {
      if (o.isMesh) o.layers.set(PROP_LAYER);
    });
    installation.group.traverse((o) => o.layers.set(0));
    const fade = createFadeUniforms();
    const skip = /* @__PURE__ */ new Set([environment.waterMaterial]);
    root.traverse((o) => {
      const mesh = o;
      if (!mesh.isMesh || mesh.userData.zone !== void 0) return;
      const m = mesh.material;
      if (skip.has(m) || m.isShaderMaterial) return;
      patchMaterial(m, fade, m === L.M.leaf);
    });
    const revealMaterials = [];
    for (const zone of zones) for (const part of ["Facade", "Glass", "Roof"]) zone.parts[part].traverse((object) => {
      const mesh = object;
      if (!mesh.isMesh) return;
      const original = mesh.material, material = original.clone();
      material.onBeforeCompile = original.onBeforeCompile;
      material.customProgramCacheKey = original.customProgramCacheKey;
      material.transparent = true;
      material.depthWrite = false;
      revealMaterials.push({ zone: zone.id, part, mesh, original, material });
    });
    const setInspection = (zone, progress) => {
      for (const entry of revealMaterials) {
        const amount = entry.zone === zone ? progress : 0;
        const strength = entry.part === "Glass" ? 0.98 : entry.part === "Roof" ? 0.94 : entry.zone === 4 ? 0.18 : 0.88;
        const active = amount > 1e-3;
        if (active) {
          entry.material.transparent = true;
          entry.material.depthWrite = false;
          entry.material.opacity = entry.original.opacity * (1 - amount * strength);
        }
        entry.mesh.material = active ? entry.material : entry.original;
      }
      for (const z of zones) z.parts.Roof.position.y = z.id === zone ? progress * 0.5 : 0;
    };
    const getInspectionVariants = () => revealMaterials.map((entry) => {
      const proxy = entry.mesh.clone(false);
      proxy.material = entry.material;
      return proxy;
    });
    root.updateMatrixWorld(true);
    yield;
    const bounds = new Box3();
    for (const z of zones) for (const p of ARCH_PARTS) bounds.expandByObject(z.parts[p]);
    bounds.expandByObject(environment.parts.Base);
    const center = bounds.getCenter(new Vector3()), size = bounds.getSize(new Vector3());
    const excluded = /* @__PURE__ */ new Set([L.glassReflect, L.shadow, L.M.seam, L.M.black]);
    const getArchitectureMeshes = () => {
      const out = [];
      const collect = (g) => g.traverse((o) => {
        const m = o;
        if (m.isMesh && !excluded.has(m.material) && m.userData.zone === void 0) out.push(m);
      });
      for (const z of zones) for (const p of ARCH_PARTS) collect(z.parts[p]);
      collect(environment.parts.Base);
      return out;
    };
    const zoneOf = (o) => {
      for (let p = o; p; p = p.parent) if (p.userData.zone !== void 0 && !p.isMesh) return p.userData.zone;
      return 0;
    };
    const isGlass = (m) => m.material === L.glassTint;
    const isBase = (m) => {
      for (let p = m; p; p = p.parent) if (p === environment.parts.Base) return true;
      return false;
    };
    const warmth = (zone) => zone === 2 ? 5 : zone ? 4 : 1;
    const architecture = getArchitectureMeshes(), rootInverse = new Matrix4();
    const f32 = (a2, n) => new Float32BufferAttribute(a2, n);
    step("setup");
    const linePos = [], lineMat = [], lineZone = [], lineOrder = [];
    const seen = /* @__PURE__ */ new Set(), a = new Vector3(), b = new Vector3(), jr = rng$1(911);
    const key = (v) => `${Math.round(v.x * 20)},${Math.round(v.y * 20)},${Math.round(v.z * 20)}`;
    for (const mesh of architecture) {
      yield;
      if (isGlass(mesh)) continue;
      const edges = new EdgesGeometry(mesh.geometry, 25), p = edges.attributes.position, zone = zoneOf(mesh);
      eachInstance(mesh, rootInverse, (m) => {
        for (let i = 0; i < p.count; i += 2) {
          a.fromBufferAttribute(p, i).applyMatrix4(m);
          b.fromBufferAttribute(p, i + 1).applyMatrix4(m);
          if (a.distanceTo(b) < 0.35) continue;
          const ka = key(a), kb = key(b), id = ka < kb ? ka + "|" + kb : kb + "|" + ka;
          if (seen.has(id)) continue;
          seen.add(id);
          const o = Math.min(1, fadeOrder((a.y + b.y) / 2) + jr() * 0.04);
          for (const v of [a, b]) {
            linePos.push(v.x * JOURNEY_UNIT, v.y * JOURNEY_UNIT, v.z * JOURNEY_UNIT);
            lineMat.push(warmth(zone));
            lineZone.push(zone);
            lineOrder.push(o);
          }
        }
      });
      edges.dispose();
    }
    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute("position", f32(linePos, 3));
    lineGeometry.setAttribute("aMat", f32(lineMat, 1));
    lineGeometry.setAttribute("aZone", f32(lineZone, 1));
    lineGeometry.setAttribute("aOrder", f32(lineOrder, 1));
    lineGeometry.setAttribute("aOpen", f32(new Array(lineZone.length * 3).fill(0), 3));
    step("edges");
    const tris = [], cumulative = [];
    let total = 0;
    const c = new Vector3(), ab = new Vector3(), ac = new Vector3(), nrm = new Vector3();
    for (const mesh of architecture) {
      yield;
      const pos = mesh.geometry.attributes.position, zone = zoneOf(mesh), weight = isBase(mesh) ? 0.35 : isGlass(mesh) ? 0.7 : 1;
      eachInstance(mesh, rootInverse, (m) => {
        for (let i = 0; i + 2 < pos.count; i += 3) {
          a.fromBufferAttribute(pos, i).applyMatrix4(m);
          b.fromBufferAttribute(pos, i + 1).applyMatrix4(m);
          c.fromBufferAttribute(pos, i + 2).applyMatrix4(m);
          const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2 * weight;
          if (area < 1e-5) continue;
          total += area;
          cumulative.push(total);
          tris.push({ pos: [a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], zone });
        }
      });
    }
    step("triangles");
    const count = mobile ? 7e3 : 17e3, pr = rng$1(4271);
    const pPos = new Float32Array(count * 3), pNor = new Float32Array(count * 3), pMat = new Float32Array(count), pZone = new Float32Array(count), pOrder = new Float32Array(count), pSeed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      if (i % 1024 === 0) yield;
      const target = pr() * total;
      let lo = 0, hi = cumulative.length - 1;
      while (lo < hi) {
        const mid = lo + hi >> 1;
        if (cumulative[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const t = tris[lo], q = t.pos;
      let u = pr(), w = pr();
      if (u + w > 1) {
        u = 1 - u;
        w = 1 - w;
      }
      for (let d = 0; d < 3; d++) pPos[i * 3 + d] = (q[d] + (q[3 + d] - q[d]) * u + (q[6 + d] - q[d]) * w) * JOURNEY_UNIT;
      nrm.set(q[3] - q[0], q[4] - q[1], q[5] - q[2]).cross(ab.set(q[6] - q[0], q[7] - q[1], q[8] - q[2])).normalize();
      pNor.set([nrm.x, nrm.y, nrm.z], i * 3);
      pMat[i] = warmth(t.zone);
      pZone[i] = t.zone;
      pOrder[i] = Math.min(1, fadeOrder(pPos[i * 3 + 1] / JOURNEY_UNIT) + pr() * 0.05);
      pSeed[i] = pr();
    }
    const pointGeometry = new BufferGeometry();
    pointGeometry.setAttribute("position", new BufferAttribute(pPos, 3));
    pointGeometry.setAttribute("normal", new BufferAttribute(pNor, 3));
    pointGeometry.setAttribute("aMat", new BufferAttribute(pMat, 1));
    pointGeometry.setAttribute("aZone", new BufferAttribute(pZone, 1));
    pointGeometry.setAttribute("aOrder", new BufferAttribute(pOrder, 1));
    pointGeometry.setAttribute("aSeed", new BufferAttribute(pSeed, 1));
    pointGeometry.setAttribute("aOpen", new BufferAttribute(new Float32Array(count * 3), 3));
    step("points");
    const uniforms = {
      uTime: { value: 0 },
      uReduced: { value: 0 },
      uDissolve: { value: 0 },
      uDrift: { value: 0 },
      uSecret: { value: 0 },
      uOpen: { value: new Vector4() },
      uHover: { value: new Vector4() },
      uLight: { value: new Vector4(1, 1, 1, 1) },
      uMouse: { value: new Vector2(9, 9) },
      uPointSize: { value: 18 },
      uVelocity: { value: 0 }
    };
    const make = (fragmentShader, defines) => new ShaderMaterial({ vertexShader: vertexShader$1, fragmentShader, defines, uniforms: { ...uniforms, uOpacity: { value: 0 } }, transparent: true, depthWrite: false, blending: AdditiveBlending });
    const lineMaterial = make(lineFragment, { LINES: "" }), pointMaterial = make(pointFragment, { POINTS: "" });
    const lines = new LineSegments(lineGeometry, lineMaterial), points = new Points(pointGeometry, pointMaterial);
    lines.renderOrder = 3;
    points.renderOrder = 4;
    points.frustumCulled = false;
    lines.frustumCulled = false;
    const journey = new Group();
    journey.name = "Journey";
    journey.scale.setScalar(1 / JOURNEY_UNIT);
    journey.add(lines, points);
    root.add(journey);
    const locatorMaterials = zones.map((z) => {
      const [p0, p1, p2, p3] = z.frame, arm = 0.38, pos = [];
      const corner = (p, dx, dy) => pos.push(p.x, p.y, p.z, p.x + dx * arm, p.y, p.z, p.x, p.y, p.z, p.x, p.y + dy * arm, p.z);
      corner(p0, 1, 1);
      corner(p1, -1, 1);
      corner(p2, -1, -1);
      corner(p3, 1, -1);
      const g = new BufferGeometry();
      g.setAttribute("position", f32(pos, 3));
      const m = new LineBasicMaterial({ color: z.id === 4 ? 15250554 : 12973159, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
      const seg = new LineSegments(g, m);
      seg.name = `${z.name}.Locator`;
      seg.renderOrder = 10;
      seg.visible = false;
      z.group.add(seg);
      return m;
    });
    const pointLights = zones.flatMap((z) => z.lights.map((l) => ({ zone: z.id, light: l.light, base: l.base, distance: l.light.distance })));
    const fog = new Fog(FOG, 30, 120);
    let scale = 1;
    const setScale = (s) => {
      scale = s;
      root.scale.setScalar(s);
      for (const l of pointLights) l.light.distance = l.distance * s;
      const cam = environment.moon.shadow.camera, e = 14 * s;
      cam.left = -e;
      cam.right = e;
      cam.top = e;
      cam.bottom = -e;
      cam.near = 1 * s;
      cam.far = 60 * s;
      cam.updateProjectionMatrix();
      environment.moon.shadow.normalBias = 0.03 * s;
      applyLights();
    };
    const journeyOpacity = (line, point) => {
      lines.material.uniforms.uOpacity.value = line;
      points.material.uniforms.uOpacity.value = point;
      lines.visible = line > 0.01;
      points.visible = point > 0.01;
    };
    const hover = [0, 0, 0, 0];
    const applyLights = () => {
      const any = Math.max(...hover);
      for (const l of pointLights) {
        const h = hover[l.zone - 1];
        l.light.intensity = l.base * scale * scale * (1 + 0.3 * h) * (1 - 0.12 * Math.max(0, any - h));
      }
      zones.forEach((z, i) => {
        const h = hover[i];
        for (const g of z.glow) g.material.emissiveIntensity = g.base * (1 + 0.3 * h) * (1 - 0.1 * Math.max(0, any - h));
        locatorMaterials[i].opacity = h * 0.9;
        z.group.getObjectByName(`${z.name}.Locator`).visible = h > 0.01;
      });
    };
    const setHover = (values) => {
      for (let i = 0; i < 4; i++) hover[i] = values[i] ?? 0;
      applyLights();
    };
    const solids = [environment.group, ...zones.map((z) => z.group)];
    const setFade = (value) => {
      fade.uFade.value = value;
      fade.uFadeMatrix.value.copy(root.matrixWorld).invert();
      const visible = value < 0.999;
      for (const g of solids) g.visible = visible;
      environment.moon.shadow.intensity = 1 - MathUtils.smoothstep(value, 0, 0.3);
      installation.setOpacity(1 - MathUtils.smoothstep(value, 0.38, 0.55), 0, 0);
    };
    const raycaster = new Raycaster(), ndc = new Vector2();
    const proxies = zones.flatMap((z) => z.proxies);
    const pick = (x, y, camera) => {
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(proxies, false)[0];
      return hit ? hit.object.userData.zone : 0;
    };
    const pickObject = (x, y, camera, zone) => {
      const proxy = objectProxies[zone - 1];
      if (!proxy) return 0;
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObject(proxy, false).length ? zone : 0;
    };
    const tick = (elapsed, reduced, freezeLab = false) => {
      aboutZone.roomDesk.update(elapsed, Boolean(reduced));
      const motion = 1 - reduced;
      fade.uTime.value = elapsed * motion;
      fade.uSway.value = 0.14 * motion;
      environment.waterMaterial.uniforms.uTime.value = elapsed * motion;
      if (!freezeLab) {
        installation.group.rotation.y = motion * elapsed * 0.16;
        installation.sync(elapsed * motion, 0, 0, reduced, 0, motion * Math.sin(elapsed * 0.3) * 0.35, new Vector2(9, 9));
      }
    };
    setScale(1);
    const dispose = () => {
      const geometries = /* @__PURE__ */ new Set();
      root.traverse((o) => {
        const m = o;
        if (m.geometry && !o.name.includes("Water:reflector")) geometries.add(m.geometry);
      });
      installation.group.traverse((o) => {
        const m = o;
        if (m.geometry) geometries.delete(m.geometry);
      });
      aboutZone.roomDesk.root.traverse((o) => {
        const m = o;
        if (m.geometry) geometries.delete(m.geometry);
      });
      geometries.forEach((g) => g.dispose());
      sharedGeometries.forEach((g) => g.dispose());
      zones.forEach((z) => z.proxies.forEach((p) => p.material.dispose()));
      objectProxies.forEach((p) => p.material.dispose());
      revealMaterials.forEach((e) => e.material.dispose());
      returnLight.dispose();
      locatorMaterials.forEach((m) => m.dispose());
      lineMaterial.dispose();
      pointMaterial.dispose();
      aboutZone.roomDesk.dispose();
      installation.dispose();
      environment.dispose();
      L.dispose();
    };
    transferred = true;
    return { group: root, root, environment, zones, installation, officeDesk, deskFrame, lines, points, uniforms, fog, bounds, center, size, getArchitectureMeshes, getInspectionVariants, objectPositions, handoffSources, returnLight, setInspection, pickObject, setScale, setHover, setFade, journeyOpacity, pick, tick, get scale() {
      return scale;
    }, dispose };
  } finally {
    if (!transferred) for (const release of pending.reverse()) release();
  }
}
function prepareAtelier(renderer, mobile, signal) {
  return buildIncrementally(atelierSteps(renderer, mobile), "atelier", signal);
}

/**
 * This class represents a scene with a basic room setup that can be used as
 * input for {@link PMREMGenerator#fromScene}. The resulting PMREM represents the room's
 * lighting and can be used for Image Based Lighting by assigning it to {@link Scene#environment}
 * or directly as an environment map to PBR materials.
 *
 * The implementation is based on the [EnvironmentScene](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts)
 * component from the `model-viewer` project.
 *
 * ```js
 * const environment = new RoomEnvironment();
 * const pmremGenerator = new THREE.PMREMGenerator( renderer );
 *
 * const envMap = pmremGenerator.fromScene( environment ).texture;
 * scene.environment = envMap;
 * ```
 *
 * @augments Scene
 * @three_import import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
 */
class RoomEnvironment extends Scene {

	constructor() {

		super();

		const geometry = new BoxGeometry();
		geometry.deleteAttribute( 'uv' );

		const roomMaterial = new MeshStandardMaterial( { side: BackSide } );
		const boxMaterial = new MeshStandardMaterial();

		const mainLight = new PointLight( 0xffffff, 900, 28, 2 );
		mainLight.position.set( 0.418, 16.199, 0.300 );
		this.add( mainLight );

		const room = new Mesh( geometry, roomMaterial );
		room.position.set( -0.757, 13.219, 0.717 );
		room.scale.set( 31.713, 28.305, 28.591 );
		this.add( room );

		const boxes = new InstancedMesh( geometry, boxMaterial, 6 );
		const transform = new Object3D();

		// box1
		transform.position.set( -10.906, 2.009, 1.846 );
		transform.rotation.set( 0, -0.195, 0 );
		transform.scale.set( 2.328, 7.905, 4.651 );
		transform.updateMatrix();
		boxes.setMatrixAt( 0, transform.matrix );

		// box2
		transform.position.set( -5.607, -0.754, -0.758 );
		transform.rotation.set( 0, 0.994, 0 );
		transform.scale.set( 1.970, 1.534, 3.955 );
		transform.updateMatrix();
		boxes.setMatrixAt( 1, transform.matrix );

		// box3
		transform.position.set( 6.167, 0.857, 7.803 );
		transform.rotation.set( 0, 0.561, 0 );
		transform.scale.set( 3.927, 6.285, 3.687 );
		transform.updateMatrix();
		boxes.setMatrixAt( 2, transform.matrix );

		// box4
		transform.position.set( -2.017, 0.018, 6.124 );
		transform.rotation.set( 0, 0.333, 0 );
		transform.scale.set( 2.002, 4.566, 2.064 );
		transform.updateMatrix();
		boxes.setMatrixAt( 3, transform.matrix );

		// box5
		transform.position.set( 2.291, -0.756, -2.621 );
		transform.rotation.set( 0, -0.286, 0 );
		transform.scale.set( 1.546, 1.552, 1.496 );
		transform.updateMatrix();
		boxes.setMatrixAt( 4, transform.matrix );

		// box6
		transform.position.set( -2.193, -0.369, -5.547 );
		transform.rotation.set( 0, 0.516, 0 );
		transform.scale.set( 3.875, 3.487, 2.986 );
		transform.updateMatrix();
		boxes.setMatrixAt( 5, transform.matrix );

		this.add( boxes );


		// -x right
		const light1 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light1.position.set( -16.116, 14.37, 8.208 );
		light1.scale.set( 0.1, 2.428, 2.739 );
		this.add( light1 );

		// -x left
		const light2 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light2.position.set( -16.109, 18.021, -8.207 );
		light2.scale.set( 0.1, 2.425, 2.751 );
		this.add( light2 );

		// +x
		const light3 = new Mesh( geometry, createAreaLightMaterial( 17 ) );
		light3.position.set( 14.904, 12.198, -1.832 );
		light3.scale.set( 0.15, 4.265, 6.331 );
		this.add( light3 );

		// +z
		const light4 = new Mesh( geometry, createAreaLightMaterial( 43 ) );
		light4.position.set( -0.462, 8.89, 14.520 );
		light4.scale.set( 4.38, 5.441, 0.088 );
		this.add( light4 );

		// -z
		const light5 = new Mesh( geometry, createAreaLightMaterial( 20 ) );
		light5.position.set( 3.235, 11.486, -12.541 );
		light5.scale.set( 2.5, 2.0, 0.1 );
		this.add( light5 );

		// +y
		const light6 = new Mesh( geometry, createAreaLightMaterial( 100 ) );
		light6.position.set( 0.0, 20.0, 0.0 );
		light6.scale.set( 1.0, 0.1, 1.0 );
		this.add( light6 );

	}

	/**
	 * Frees internal resources. This method should be called
	 * when the environment is no longer required.
	 */
	dispose() {

		const resources = new Set();

		this.traverse( ( object ) => {

			if ( object.isMesh ) {

				resources.add( object.geometry );
				resources.add( object.material );

			}

		} );

		for ( const resource of resources ) {

			resource.dispose();

		}

	}

}

function createAreaLightMaterial( intensity ) {

	// create an emissive-only material. see #31348
	const material = new MeshLambertMaterial( {
		color: 0x000000,
		emissive: 0xffffff,
		emissiveIntensity: intensity
	} );

	return material;

}

function createGalleryRoom(renderer, mobile) {
  const root = new Group();
  root.name = "MyRoom.Gallery";
  const stone = createGalleryStone(), marble = createGalleryStone("column"), granite = createGalleryStone("counter"), kit = new Kit(2710);
  const floor = new MeshStandardMaterial({ map: stone.color, normalMap: stone.normal, normalScale: new Vector2(0.22, 0.22), roughnessMap: stone.roughness, color: 5594473, roughness: 0.9, metalness: 0 });
  const wall = new MeshStandardMaterial({ map: granite.color, normalMap: granite.normal, normalScale: new Vector2(0.055, 0.055), roughnessMap: granite.roughness, color: 2501942, roughness: 0.95 });
  const columns = new MeshStandardMaterial({ map: marble.color, normalMap: marble.normal, normalScale: new Vector2(0.07, 0.07), roughnessMap: marble.roughness, color: 6449779, roughness: 0.85, metalness: 0, envMapIntensity: 0.8 });
  const recess = new MeshStandardMaterial({ color: 263431, roughness: 0.9 });
  const trim = new MeshStandardMaterial({ color: 2041132, metalness: 0.3, roughness: 0.55 });
  const lightMaterial = new MeshBasicMaterial({ color: 13739384, toneMapped: false });
  floor.userData.tile = 8;
  wall.userData.tile = 2.4;
  columns.userData.tile = 4.6;
  kit.box(root, floor, -16, 16, -0.55, -0.49, -18, 16, false);
  kit.box(root, recess, -14, 14, -0.49, 9, -10.2, -10, false);
  for (const side of [-1, 1]) {
    kit.box(root, wall, side < 0 ? -5.7 : 5.5, side < 0 ? -5.5 : 5.7, -0.49, 8, -10, 2, false);
    for (const [x, z, w, d] of [[3.4, 0.6, 0.65, 0.75], [3.45, -3, 0.62, 0.72], [5, -7.3, 0.8, 0.85]]) {
      const cx = side * x;
      const height = 8.49, geometry = roundedBox(w, height, d, 1, 0.018);
      const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
        uv.setXY(i, (nx > ny && nx > nz ? p.getZ(i) + z : p.getX(i) + cx) / 4.6, (ny > nx && ny > nz ? p.getZ(i) + z : p.getY(i) + 3.755) / 4.6);
      }
      kit.add(root, columns, geometry, place(cx, 3.755, z), true);
      kit.box(root, trim, cx - w / 2 - 0.025, cx + w / 2 + 0.025, -0.49, -0.405, z - d / 2 - 0.025, z + d / 2 + 0.025, false);
    }
  }
  for (const x of [-5, 5]) {
    kit.box(root, wall, x - 1, x + 1, -0.49, 6, -9.2, -9.05, false);
    kit.box(root, lightMaterial, x - 0.34, x + 0.34, -0.405, -0.395, -9, -8.92, false);
  }
  kit.box(root, trim, -5.5, 5.5, -0.47, -0.44, -9.7, -9.6, false);
  kit.finish();
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 256;
  const ctx = shadowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 28, 128, 128, 128);
  gradient.addColorStop(0, "rgba(0,0,0,.9)");
  gradient.addColorStop(0.6, "rgba(0,0,0,.5)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const shadowTexture = new CanvasTexture(shadowCanvas);
  const shadowMaterial = new MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.85, depthWrite: false });
  const contact = new Mesh(new PlaneGeometry(7.4, 4.6), shadowMaterial);
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, -0.487, 0.1);
  root.add(contact);
  const key = new DirectionalLight(12701149, 1.8);
  key.position.set(-3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(mobile ? 512 : 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 24;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -25e-5;
  key.shadow.radius = 3;
  const fill = new HemisphereLight(11846357, 2695707, 0.42);
  const rim = new DirectionalLight(14015715, 0.8);
  rim.position.set(1.5, 4, -3);
  const lights = [{ light: key, base: 1.8 }, { light: fill, base: 0.42 }, { light: rim, base: 0.8 }];
  for (const x of [-5, 5]) {
    const light = new PointLight(15250554, 9, 7, 2);
    light.position.set(x, 0.15, -8.6);
    lights.push({ light, base: 9 });
  }
  const sideLight = new DirectionalLight(11255254, 0.65);
  sideLight.position.set(-7, 4, -1);
  lights.push({ light: sideLight, base: 0.65 });
  for (const [x, y, z, power] of [[-1.88, 0.85, 0.4, 0.5], [1.86, 0.6, 0.6, 0.4]]) {
    const light = new PointLight(16761228, power, 2.3, 2);
    light.position.set(x, y, z);
    lights.push({ light, base: power });
  }
  for (const { light } of lights) root.add(light);
  const baked = getBakedEnvironment("gallery");
  const environment = baked ? { texture: baked, dispose() {
    baked.dispose();
  } } : createGalleryEnvironment(renderer);
  return {
    root,
    environment: environment.texture,
    setFade(fade) {
      lights.forEach(({ light, base }) => {
        light.intensity = base * fade;
      });
    },
    updateShadow() {
      renderer.shadowMap.needsUpdate = true;
    },
    dispose() {
      root.traverse((object) => {
        if (object.isMesh) object.geometry.dispose();
      });
      [floor, wall, columns, recess, trim, lightMaterial, shadowMaterial].forEach((material) => material.dispose());
      shadowTexture.dispose();
      stone.dispose();
      marble.dispose();
      granite.dispose();
      key.shadow.dispose();
      environment.dispose();
      root.clear();
    }
  };
}
function createGalleryEnvironment(renderer) {
  const environmentScene = new RoomEnvironment(), pmrem = new PMREMGenerator(renderer);
  const panel = new Mesh(new PlaneGeometry(14, 10), new MeshBasicMaterial({ color: new Color(3.2, 3.25, 3.4) }));
  panel.position.set(-2, 4.5, 10);
  panel.lookAt(0, 1, 0);
  environmentScene.add(panel);
  const environment = pmrem.fromScene(environmentScene, 0.04);
  environmentScene.dispose();
  pmrem.dispose();
  return environment;
}

function* aboutSteps(renderer, mobile) {
  let transferred = false;
  const pending = [];
  try {
    const scene = new Scene();
    const camera = new PerspectiveCamera(33, 1.6, 0.1, 60);
    const model = createRoomDeskModel(1.12, true), root = model.root;
    pending.push(() => model.dispose());
    scene.add(root);
    yield;
    const gallery = createGalleryRoom(renderer, mobile);
    pending.push(() => gallery.dispose());
    scene.add(gallery.root);
    yield;
    scene.environment = gallery.environment;
    scene.environmentIntensity = 0.28;
    const gravityMaterials = /* @__PURE__ */ new Set();
    model.exhibit.traverse((object) => {
      const material = object.material;
      if (material) {
        for (const item of Array.isArray(material) ? material : [material])
          if (item instanceof MeshStandardMaterial) gravityMaterials.add(item);
      }
    });
    gravityMaterials.forEach((material) => {
      material.envMap = gallery.environment;
      material.envMapIntensity *= scene.environmentIntensity;
    });
    const spot = new PointLight(15250554, 0, 3.5, 2);
    scene.add(spot);
    const anchors = model.anchors;
    const raycaster = new Raycaster(), pointer = new Vector2();
    const owners = /* @__PURE__ */ new Map();
    model.objects.forEach((group, index) => group.traverse((object) => {
      if (object.isMesh) owners.set(object, index);
    }));
    const pickables = [];
    root.traverse((object) => {
      if (object.isMesh) pickables.push(object);
    });
    let time = 0, pointerX = 0, pointerY = 0, pointerInside = false;
    let shadowX = Infinity, shadowY = Infinity, shadowDoor = Infinity;
    const center = new Vector3(0, 0.45, 0), viewTarget = center.clone(), viewPosition = new Vector3();
    const direction = new Vector3(), right = new Vector3(), up = new Vector3(), relative = new Vector3();
    const corners = [];
    for (const [x0, x1, y0, y1, z0, z1] of [
      [-2.88, 2.88, -0.55, 0, -1.3, 1.3],
      [-1, 1.1, 0.3, 1.74, -0.5, -0.3],
      [-2.68, -1.08, 0.1, 1.68, -0.15, 0.5],
      [1.05, 2.65, 0, 1.25, -0.7, 0.85]
    ]) for (let i = 0; i < 8; i++) corners.push(new Vector3(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0));
    let selected = -1, hovered = -1, reduced = false, fade = 1, first = true, aspect = 1.6, distance = 10;
    const projected = new Vector3();
    const update = (dt, nextAspect = aspect) => {
      aspect = nextAspect;
      const narrow = aspect < 1.1;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      direction.set(narrow ? 0.5 : 0.45, narrow ? 4.2 : 1.9, 10).normalize();
      right.crossVectors(new Vector3(0, 1, 0), direction).normalize();
      up.crossVectors(direction, right);
      const tan = Math.tan(MathUtils.degToRad(camera.fov / 2));
      distance = 0;
      for (const corner of corners) {
        relative.copy(corner).sub(center);
        distance = Math.max(distance, relative.dot(direction) + Math.max(Math.abs(relative.dot(right)) / (tan * aspect * 0.94), Math.abs(relative.dot(up)) / (tan * 0.91)));
      }
      const focus = selected >= 0 && !reduced ? selected : -1;
      const target = focus < 0 ? center : relative.copy(center).lerp(anchors[focus], narrow ? 0.4 : 0.42);
      const rate = 1 - Math.exp(-9 * Math.min(dt, 0.1));
      if (first || reduced) viewTarget.copy(center);
      else viewTarget.lerp(target, rate);
      const wanted = viewTarget.clone().addScaledVector(direction, distance * (focus < 0 ? 1 : 0.85));
      if (first || reduced) viewPosition.copy(wanted);
      else viewPosition.lerp(wanted, rate);
      camera.position.copy(viewPosition);
      camera.lookAt(viewTarget);
      camera.updateMatrixWorld();
      const active = selected >= 0 ? selected : hovered;
      if (active >= 0) spot.position.copy(anchors[active]).add(new Vector3(0, 1.5, 0.4));
      spot.intensity = MathUtils.damp(spot.intensity, active >= 0 ? selected >= 0 ? 2.1 : 0.8 : 0, 10, dt) * fade;
      gallery.setFade(fade);
      root.rotation.y = reduced ? 0 : MathUtils.damp(root.rotation.y, pointerInside ? pointerX * 0.028 : 0, 7, dt);
      root.rotation.x = reduced ? 0 : MathUtils.damp(root.rotation.x, pointerInside ? -pointerY * 0.012 : 0, 7, dt);
      time += dt;
      model.update(time, reduced, active, fade, dt, pointerInside ? pointerX : 0, pointerInside ? pointerY : 0);
      root.updateMatrixWorld(true);
      first = false;
    };
    const pick = (x, y) => {
      pointer.set(x * 2 - 1, 1 - y * 2);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      return hit ? owners.get(hit.object) ?? -1 : -1;
    };
    const project = (index) => {
      projected.copy(anchors[index]).applyMatrix4(root.matrixWorld).project(camera);
      return { x: (projected.x + 1) / 2, y: (1 - projected.y) / 2, visible: Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z < 1 };
    };
    update(0.016, 1.6);
    transferred = true;
    return {
      scene,
      camera,
      update,
      pick,
      project,
      windowFrame: model.windowFrame,
      doorFrame: model.doorFrame,
      doorHinge: model.doorHinge,
      updateShadow() {
        const door = model.snapshot().doorAngle;
        if (model.snapshot().gravity.spread > 1e-3 || Math.abs(shadowX - root.rotation.x) > 2e-4 || Math.abs(shadowY - root.rotation.y) > 2e-4 || Math.abs(shadowDoor - door) > 5e-3) {
          gallery.updateShadow();
          shadowX = root.rotation.x;
          shadowY = root.rotation.y;
          shadowDoor = door;
        }
      },
      prepareHandoff(nextAspect) {
        selected = -1;
        hovered = -1;
        fade = 1;
        first = true;
        spot.intensity = 0;
        pointerInside = false;
        root.rotation.set(0, 0, 0);
        model.reset();
        update(0, nextAspect);
      },
      setPointer(pointer2) {
        pointerX = pointer2.x;
        pointerY = pointer2.y;
        pointerInside = pointer2.inside;
      },
      setFocus(index) {
        selected = index >= 0 && index < 3 ? index : -1;
      },
      setHover(index) {
        hovered = index;
      },
      setReduced(value) {
        reduced = value;
      },
      setFade(value) {
        fade = reduced ? 1 : value;
      },
      resize() {
        update(0, renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight));
      },
      snapshot() {
        return { selected, hovered, camera: camera.position.toArray(), target: viewTarget.toArray(), anchors: anchors.map((_, index) => project(index)), meshes: pickables.length, interaction: model.snapshot(), exhibitFacing: model.exhibit.getWorldDirection(new Vector3()).dot(camera.position.clone().sub(model.exhibit.getWorldPosition(new Vector3())).normalize()) };
      },
      dispose() {
        model.dispose();
        gallery.dispose();
        scene.clear();
      }
    };
  } finally {
    if (!transferred) for (const release of pending.reverse()) release();
  }
}
function prepareAboutStage(renderer, mobile, signal) {
  return buildIncrementally(aboutSteps(renderer, mobile), "about", signal);
}

const phase = (p, a, b) => MathUtils.smoothstep(p, a, b);
function createRoomPortal(renderer) {
  let target;
  const camera = new PerspectiveCamera(), direction = new Vector3();
  const sourceScene = new Scene(), quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  sourceScene.name = "RoomPortal.Source";
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    uniforms: { uTexture: { value: null }, uOpacity: { value: 1 } },
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: "uniform sampler2D uTexture;uniform float uOpacity;varying vec2 vUv;void main(){gl_FragColor=texture2D(uTexture,vUv);gl_FragColor.a*=uOpacity;\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  sourceScene.add(quad);
  const gateway = new Group();
  gateway.name = "MyRoom.EntryWindow";
  gateway.visible = false;
  const barGeometry = new BoxGeometry(1, 1, 1);
  const frameMaterial = new MeshStandardMaterial({ color: 2699565, metalness: 0.65, roughness: 0.3 });
  const edgeMaterial = new MeshBasicMaterial({ color: 12973159, transparent: true, opacity: 1, toneMapped: false });
  const bars = Array.from({ length: 4 }, () => {
    const mesh = new Mesh(barGeometry, frameMaterial);
    gateway.add(mesh);
    return mesh;
  });
  const edges = Array.from({ length: 4 }, () => {
    const mesh = new Mesh(barGeometry, edgeMaterial);
    gateway.add(mesh);
    return mesh;
  });
  const placeGateway = (view, aspect) => {
    view.getWorldDirection(direction);
    gateway.position.copy(view.position).addScaledVector(direction, -2);
    gateway.quaternion.copy(view.quaternion);
    const h = 2 * Math.tan(MathUtils.degToRad(view.fov / 2)) * 5 * 0.64, w = h * Math.min(2, aspect), thickness = 0.075;
    bars.forEach((bar, index) => {
      const horizontal = index < 2, side = index % 2 === 0 ? -1 : 1;
      bar.position.set(horizontal ? 0 : side * (w + thickness) / 2, horizontal ? side * (h + thickness) / 2 : 0, 0);
      bar.scale.set(horizontal ? w + thickness * 2 : thickness, horizontal ? thickness : h, 0.16);
      edges[index].position.copy(bar.position);
      edges[index].position.z = 0.087;
      edges[index].scale.set(horizontal ? w + thickness * 2 : 8e-3, horizontal ? 8e-3 : h, 8e-3);
    });
    return { w: w + thickness * 2, h: h + thickness * 2 };
  };
  let telemetry = null;
  const viewport = (rect) => renderer.setViewport(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
  const scissor = (rect) => {
    const left = Math.max(0, rect.left), top = Math.max(0, rect.top), right = Math.min(innerWidth, rect.right), bottom = Math.min(innerHeight, rect.bottom);
    if (right <= left || bottom <= top) return false;
    renderer.setScissor(left, innerHeight - bottom, right - left, bottom - top);
    renderer.setScissorTest(true);
    return true;
  };
  const capture = (scene, view, rect) => {
    const ratio = Math.min(renderer.getPixelRatio(), 1.25), w = Math.max(1, Math.round(rect.width * ratio)), h = Math.max(1, Math.round(rect.height * ratio));
    if (!target) {
      target = new WebGLRenderTarget(w, h, { type: HalfFloatType, depthBuffer: true, stencilBuffer: false });
      material.uniforms.uTexture.value = target.texture;
    } else if (target.width !== w || target.height !== h) target.setSize(w, h);
    const previous = renderer.getRenderTarget();
    renderer.setScissorTest(false);
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, view);
    renderer.setRenderTarget(previous);
  };
  const prepareCapture = async (scene, view, signal, rect) => {
    if (!target) {
      const ratio = Math.min(renderer.getPixelRatio(), 1.25);
      target = new WebGLRenderTarget(Math.max(1, Math.round((rect?.width ?? 32) * ratio)), Math.max(1, Math.round((rect?.height ?? 32) * ratio)), { type: HalfFloatType, depthBuffer: true, stencilBuffer: false });
      material.uniforms.uTexture.value = target.texture;
    }
    await compileIncrementally(scene, view, signal, target);
    await primeScene(scene, view, signal, "lab-capture", target);
  };
  const render = (scene, view, room, lab, p) => {
    if (target && p < 0.22) {
      viewport(lab);
      if (scissor(lab)) {
        material.uniforms.uOpacity.value = 1 - phase(p, 0.04, 0.2);
        renderer.render(sourceScene, quadCamera);
      }
    }
    const opening = phase(p, 0.55, 0.7), travel = phase(p, 0.63, 0.98);
    const size = placeGateway(view, lab.width / lab.height);
    gateway.scale.y = Math.max(1e-3, opening);
    gateway.updateMatrixWorld(true);
    camera.copy(view);
    camera.aspect = room.width / room.height;
    camera.updateProjectionMatrix();
    const outside = 7 * (1 - travel);
    camera.position.addScaledVector(direction, -outside);
    camera.updateMatrixWorld(true);
    const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([x, y]) => new Vector3(x * size.w / 2, y * size.h / 2, 0.09).applyMatrix4(gateway.matrixWorld).project(camera));
    const aperture = outside <= 2 + camera.near ? { left: room.left, top: room.top, width: room.width, height: room.height } : {
      left: room.left + (Math.min(...corners.map((point) => point.x)) + 1) * room.width / 2,
      top: room.top + (1 - Math.max(...corners.map((point) => point.y))) * room.height / 2,
      width: (Math.max(...corners.map((point) => point.x)) - Math.min(...corners.map((point) => point.x))) * room.width / 2,
      height: (Math.max(...corners.map((point) => point.y)) - Math.min(...corners.map((point) => point.y))) * room.height / 2
    };
    const w = aperture.width, h = aperture.height;
    edgeMaterial.opacity = 1 - phase(p, 0.86, 0.95);
    gateway.visible = p > 0.55 && p < 0.98;
    if (w > 0.1 && h > 0.1 && opening > 0) {
      const left = Math.max(room.left, aperture.left), top = Math.max(room.top, aperture.top), right = Math.min(room.right, aperture.left + w), bottom = Math.min(room.bottom, aperture.top + h);
      const clip = { left, top, right, bottom};
      viewport(room);
      if (scissor(clip)) {
        renderer.clear(true, true, false);
        renderer.render(scene, camera);
      }
    }
    gateway.visible = false;
    renderer.setScissorTest(false);
    telemetry = { progress: p, aperture, camera: camera.position.toArray(), scene: scene.uuid, sourceReady: Boolean(target) };
    return aperture;
  };
  return {
    capture,
    render,
    prepareCapture,
    prepareRoom: async (scene, view, signal) => {
      scene.add(gateway);
      placeGateway(view, 1.8);
      gateway.visible = true;
      try {
        await compileIncrementally(scene, view, signal);
        await primeScene(scene, view, signal, "room-window");
      } finally {
        gateway.visible = false;
      }
    },
    prepare: async (signal) => {
      await trackCompilation(renderer.compileAsync(sourceScene, quadCamera));
      await primeScene(sourceScene, quadCamera, signal, "portal");
    },
    snapshot: () => telemetry,
    clear: () => {
      telemetry = null;
      gateway.visible = false;
    },
    dispose() {
      gateway.removeFromParent();
      barGeometry.dispose();
      frameMaterial.dispose();
      edgeMaterial.dispose();
      target?.dispose();
      geometry.dispose();
      material.dispose();
      sourceScene.clear();
    }
  };
}

function clippedProjection(points, camera, size) {
  let polygon = points.map((point) => point.clone().applyMatrix4(camera.matrixWorldInverse));
  const matrix = camera.projectionMatrix.elements;
  const row = (n, p) => matrix[n] * p.x + matrix[n + 4] * p.y + matrix[n + 8] * p.z + matrix[n + 12];
  const planes = [(p) => row(3, p) + row(2, p), (p) => row(3, p) + row(0, p), (p) => row(3, p) - row(0, p), (p) => row(3, p) + row(1, p), (p) => row(3, p) - row(1, p)];
  for (const plane of planes) {
    const output = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length], da = plane(a), db = plane(b);
      if (da >= 0) output.push(a);
      if (da >= 0 !== db >= 0) output.push(a.clone().lerp(b, da / (da - db)));
    }
    polygon = output;
    if (!polygon.length) break;
  }
  return polygon.map((point) => {
    point.applyMatrix4(camera.projectionMatrix);
    return { x: (point.x + 1) * size.width / 2, y: (1 - point.y) * size.height / 2 };
  });
}
function projectToSlot(point, camera, size) {
  const ndc = point.clone().project(camera);
  return { x: (ndc.x + 1) * size.width / 2, y: (1 - ndc.y) * size.height / 2 };
}
const path = (points) => points.length ? `M${points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join("L")}Z` : "";
function convexHull(points) {
  if (points.length < 3) return points;
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const lower = [], upper = [];
  for (const p of sorted) {
    while (lower.length > 1 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of sorted.slice().reverse()) {
    while (upper.length > 1 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
function rectangleMatrix(points, width, height, baseTop) {
  const [q0, q1, q2, q3] = points.map((p) => ({ x: p.x, y: p.y - baseTop }));
  const dx1 = q1.x - q2.x, dx2 = q3.x - q2.x, dx3 = q0.x - q1.x + q2.x - q3.x;
  const dy1 = q1.y - q2.y, dy2 = q3.y - q2.y, dy3 = q0.y - q1.y + q2.y - q3.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = Math.abs(determinant) > 1e-8 ? (dx3 * dy2 - dx2 * dy3) / determinant : 0;
  const h = Math.abs(determinant) > 1e-8 ? (dx1 * dy3 - dx3 * dy1) / determinant : 0;
  const a = q1.x - q0.x + g * q1.x, b = q3.x - q0.x + h * q3.x;
  const d = q1.y - q0.y + g * q1.y, e = q3.y - q0.y + h * q3.y;
  return `matrix3d(${[a / width, d / width, 0, g / width, b / height, e / height, 0, h / height, 0, 0, 1, 0, q0.x, q0.y, 0, 1].map((n) => Number(n.toFixed(10))).join(",")})`;
}
function syncReturnProjection(slot, camera, hinge, p, reduced) {
  const root = slot.closest("#contact"), node = slot.querySelector("[data-contact-return]"), viewport = slot.querySelector("[data-contact-viewport]");
  if (!root || !node || !viewport) return;
  const rect = slot.getBoundingClientRect(), layout = getComputedStyle(node);
  const width = rect.width, height = rect.height, contentWidth = parseFloat(layout.width), contentHeight = parseFloat(layout.height);
  if (!width || !height || !contentWidth || !contentHeight) return;
  node.style.setProperty("--contact-layout-y", `${-contentHeight / 2}px`);
  if (reduced || p >= 0.94) {
    node.style.transform = "none";
    viewport.style.mask = "none";
    viewport.style.webkitMask = "none";
    root.dataset.returnProjection = "identity";
    return;
  }
  const finalDistance = width / height < 0.8 ? 2 : 1.15;
  const unitsPerPixel = 2 * finalDistance * Math.tan(MathUtils.degToRad(camera.fov / 2)) / height;
  const w = contentWidth * unitsPerPixel, h = contentHeight * unitsPerPixel;
  const center = width / height < 0.8 ? 1 : 0.805;
  const points = [new Vector3(center - w / 2, 1.42 + h / 2, -1.8), new Vector3(center + w / 2, 1.42 + h / 2, -1.8), new Vector3(center + w / 2, 1.42 - h / 2, -1.8), new Vector3(center - w / 2, 1.42 - h / 2, -1.8)];
  node.style.transform = rectangleMatrix(points.map((point) => projectToSlot(point, camera, { width, height })), contentWidth, contentHeight, (height - contentHeight) / 2);
  const aperture = camera.position.z <= 1.015 ? [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }] : clippedProjection([new Vector3(-0.21, 2.7, 1.015), new Vector3(0.97, 2.7, 1.015), new Vector3(0.97, 0.03, 1.015), new Vector3(-0.21, 0.03, 1.015)], camera, { width, height });
  const leafCorners = [-0.05, 0.025].flatMap((z) => [new Vector3(0, 2.67, z), new Vector3(1.18, 2.67, z), new Vector3(1.18, 0, z), new Vector3(0, 0, z)]).map((point) => point.applyMatrix4(hinge.matrixWorld));
  const faces = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [3, 2, 6, 7], [0, 3, 7, 4], [1, 5, 6, 2]];
  const leaf = convexHull(faces.flatMap((face) => clippedProjection(face.map((index) => leafCorners[index]), camera, { width, height })));
  slot.querySelector("[data-return-aperture]")?.setAttribute("d", path(aperture));
  slot.querySelector("[data-return-leaf]")?.setAttribute("d", path(leaf));
  const mask = slot.querySelector("mask");
  mask?.setAttribute("width", String(width));
  mask?.setAttribute("height", String(height));
  viewport.style.mask = "url(#contact-door-mask)";
  viewport.style.webkitMask = "url(#contact-door-mask)";
  root.dataset.returnProjection = "camera";
  root.dataset.returnDoorAngle = (hinge.rotation.y * 180 / Math.PI).toFixed(2);
  root.dataset.returnCameraZ = camera.position.z.toFixed(4);
}

const { smoothstep, lerp: lerp$1 } = MathUtils;
function createCabinDoorReturn(stage) {
  const camera = new PerspectiveCamera(33, 1, 6e-3, 60);
  const center = new Vector3(), normal = new Vector3(), direction = new Vector3();
  const frame = stage.doorFrame;
  const hinge = stage.doorHinge;
  const geometry = new PlaneGeometry(0.25, 0.43);
  const material = new ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uSettle: { value: 0 } },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "varying vec2 vUv;uniform float uOpacity;uniform float uSettle;void main(){float core=exp(-length((vUv-.5)*vec2(1.,.8))*2.);vec3 warm=mix(vec3(.04,.025,.012),vec3(.10,.066,.034),core);gl_FragColor=vec4(mix(warm,vec3(.0024),uSettle),uOpacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}"
  });
  const glow = new Mesh(geometry, material);
  glow.name = "Desk.House.DoorLight";
  glow.renderOrder = 8;
  frame.add(glow);
  const corners = [[-0.125, 0.215], [0.125, 0.215], [0.125, -0.215], [-0.125, -0.215]].map(([x, y]) => new Vector3(x, y, 3e-3));
  const update = (room, slot, p) => {
    const expand = smoothstep(p, 0, 0.22);
    const rect = { left: lerp$1(room.left, 0, expand), top: lerp$1(room.top, 0, expand), width: lerp$1(room.width, innerWidth, expand), height: lerp$1(room.height, innerHeight, expand), right: 0, bottom: 0 };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    if (hinge) hinge.rotation.y = -smoothstep(p, 0.06, 0.52) * Math.PI * 0.46;
    frame.updateWorldMatrix(true, false);
    frame.getWorldPosition(center);
    frame.getWorldDirection(normal);
    direction.copy(stage.camera.position).sub(center);
    const initialDistance = direction.length();
    direction.normalize().lerp(normal, smoothstep(p, 0.02, 0.45)).normalize();
    const approach = smoothstep(p, 0, 0.9);
    const distance = Math.exp(lerp$1(Math.log(initialDistance), Math.log(0.025), approach));
    camera.position.copy(center).addScaledVector(direction, distance);
    if (p > 0.9) camera.position.addScaledVector(normal, -smoothstep(p, 0.9, 0.97) * 0.07);
    camera.aspect = rect.width / rect.height;
    camera.lookAt(center.clone().addScaledVector(normal, -0.32));
    const facing = camera.quaternion.clone();
    camera.quaternion.copy(stage.camera.quaternion).slerp(facing, smoothstep(p, 0, 0.42));
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    material.uniforms.uOpacity.value = smoothstep(p, 0.1, 0.3);
    material.uniforms.uSettle.value = smoothstep(p, 0.68, 0.82);
    const root = slot.closest("#contact"), viewport = slot.querySelector("[data-contact-viewport]");
    const content = slot.querySelector("[data-contact-return]");
    if (root && viewport && content) {
      const box = slot.getBoundingClientRect();
      const crossed = camera.position.clone().sub(center).dot(normal) <= camera.near;
      const points = p >= 0.8 || crossed ? [{ x: 0, y: 0 }, { x: box.width, y: 0 }, { x: box.width, y: box.height }, { x: 0, y: box.height }] : clippedProjection(corners.map((point) => point.clone().applyMatrix4(frame.matrixWorld)), camera, rect).map((point) => ({ x: point.x + rect.left - box.left, y: point.y + rect.top - box.top }));
      const path = points.length ? "M" + points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join("L") + "Z" : "";
      slot.querySelector("[data-return-aperture]")?.setAttribute("d", path);
      slot.querySelector("[data-return-leaf]")?.setAttribute("d", "");
      const mask = slot.querySelector("mask");
      mask?.setAttribute("width", String(box.width));
      mask?.setAttribute("height", String(box.height));
      viewport.style.mask = p >= 0.8 ? "none" : "url(#contact-door-mask)";
      viewport.style.webkitMask = viewport.style.mask;
      viewport.style.removeProperty("background-color");
      content.style.transform = "none";
      root.dataset.returnProjection = p >= 0.8 ? "identity" : "window";
      root.dataset.returnWindowDistance = distance.toFixed(4);
    }
    return { rect, camera, visible: p < 0.82 };
  };
  return { update, reset() {
    material.uniforms.uOpacity.value = 0;
  }, dispose() {
    glow.removeFromParent();
    geometry.dispose();
    material.dispose();
  } };
}

const skyFragment = "uniform float uTime;\nuniform float uOpacity;\nuniform float uReduced;\nuniform float uAspect;\nuniform vec2 uMoon;\nuniform float uHorizon;\nvarying vec2 vUv;\n// NIGHT SKY：深蓝灰夜色，地平线附近是与场景雾同色的薄雾；月亮只是低亮度的点缀。\nfloat hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nfloat noise(vec2 p){\n  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);\n}\nvoid main(){\n  float t = uTime * 0.01 * (1.0 - uReduced);\n  float h = vUv.y - uHorizon;\n  // 色值为线性空间，输出前转换到 sRGB\n  vec3 zenith = vec3(0.0045, 0.0065, 0.011);\n  vec3 horizon = vec3(0.0103, 0.0168, 0.0296); // = 场景雾色 #1a2330\n  vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.5, h));\n  // 极淡的云层：低对比、缓慢移动\n  float cloud = noise(vec2(vUv.x * uAspect * 2.2 + t, vUv.y * 5.0)) * noise(vec2(vUv.x * uAspect * 5.0 - t * 1.4, vUv.y * 11.0));\n  color += vec3(0.006, 0.008, 0.012) * cloud * smoothstep(0.02, 0.3, h);\n  // 月亮：小圆盘 + 柔和光晕\n  vec2 d = (vUv - uMoon) * vec2(uAspect, 1.0);\n  float r = length(d);\n  color += vec3(0.62, 0.66, 0.72) * smoothstep(0.0125, 0.0105, r) * (0.85 + 0.15 * noise(d * 400.0));\n  color += vec3(0.05, 0.06, 0.08) * exp(-r * r * 180.0) + vec3(0.012, 0.015, 0.022) * exp(-r * 9.0);\n  // 与场景雾走同一条色调映射，地平线与远处雾色无缝衔接\n  gl_FragColor = vec4(max(color, 0.0), 1.0);\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n  gl_FragColor.rgb += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.006;\n  // 预乘 alpha：随滚动淡出，露出下方的黑色页面与点场\n  gl_FragColor = vec4(max(gl_FragColor.rgb, 0.0) * uOpacity, uOpacity);\n}\n";

const bridgeFragment = "uniform sampler2D uTex0;\nuniform sampler2D uTex1;\nuniform sampler2D uTex2;\nuniform float uTime;\nuniform float uProgress;\nuniform float uVariant;\nuniform float uAspect;\nuniform float uReduced;\nuniform float uVelocity;\nvarying vec2 vUv;\n\n// 章节停顿背景：几乎静止，实际仍有 10–20% 强度的低频运动。\n// variant 0 — PROJECT FRAGMENTS → EXPERIMENT FIELD：项目图像碎片漂浮在网格上，随进度被清空。\n// variant 1 — RESIDUE：Lab 的流场与粒子残留，逐渐归于安静。\nfloat hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nfloat noise(vec2 p){\n  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);\n}\nvec3 sampleTex(float k, vec2 uv){\n  vec3 a = texture2D(uTex0, uv).rgb, b = texture2D(uTex1, uv).rgb, c = texture2D(uTex2, uv).rgb;\n  return k < 0.5 ? a : (k < 1.5 ? b : c);\n}\n\nvoid main(){\n  float motion = 1.0 - uReduced;\n  float t = uTime * motion;\n  vec2 p = vec2(vUv.x * uAspect, vUv.y);\n  // 进入与离开时淡入淡出，中段最清晰。\n  float presence = smoothstep(0.0, 0.3, uProgress) * (1.0 - smoothstep(0.7, 1.0, uProgress));\n  vec3 color = vec3(0.0);\n  if (uVariant < 0.5) {\n    // 网格（Lab 的语言）：与展馆夜景同色的冷灰蓝，只比黑底亮一档\n    vec2 g = fract(p * 14.0);\n    float grid = max(smoothstep(0.03, 0.0, g.x), smoothstep(0.03, 0.0, g.y));\n    color += vec3(0.14, 0.17, 0.22) * grid * 0.25;\n    // 六块项目碎片：深度视差 + 极轻 shader 扭曲，进度越后越稀薄（“清空”）\n    for (int i = 0; i < 6; i++) {\n      float fi = float(i);\n      // 横屏：碎片散在右侧；竖屏：碎片退到上下两条带，中间留给文字。\n      float band = mod(fi, 2.0) < 0.5 ? 0.13 + fract(fi * 0.21) * 0.1 : 0.8 + fract(fi * 0.29) * 0.1;\n      float portrait = step(uAspect, 0.9);\n      vec2 center = vec2(mix(0.56 + fract(fi * 0.618) * 0.38, 0.12 + fract(fi * 0.618) * 0.76, portrait), mix(0.18 + fract(fi * 0.381 + 0.2) * 0.64, band, portrait));\n      center.x *= uAspect;\n      float depth = 0.4 + fract(fi * 0.73) * 0.6;\n      center.y += (uProgress - 0.5) * depth * 0.5 + sin(t * 0.15 + fi) * 0.01;\n      center.x += cos(t * 0.1 + fi * 2.0) * 0.012;\n      vec2 size = vec2(0.19, 0.12) * (0.6 + depth * 0.55);\n      vec2 q = (p - center) / size;\n      float inside = step(abs(q.x), 1.0) * step(abs(q.y), 1.0);\n      if (inside > 0.5) {\n        vec2 uv = q * 0.5 + 0.5;\n        // Slice tear: bands of the screenshot slide sideways as the chapter progresses (the\n        // image is \"pulled apart\" by scrolling). Replaces 60 grey scan-line dropouts, which\n        // read as muddy noise rather than as a deliberate fracture.\n        float slice = floor(uv.y * 22.0);\n        float tear = (noise(vec2(slice, fi * 7.0 + floor(t * 0.15))) - 0.5) * 0.14 * smoothstep(0.1, 0.9, uProgress);\n        uv.x += sin(uv.y * 12.0 + t * 0.6) * 0.004 * (1.0 + uVelocity) + tear;\n        vec3 img = sampleTex(mod(fi, 3.0), clamp(uv, 0.0, 1.0));\n        float lum = dot(img, vec3(0.299, 0.587, 0.114));\n        float gap = step(0.9, fract(uv.y * 22.0));\n        float line = 1.0 - gap * smoothstep(0.35, 0.8, uProgress);\n        float fade = (0.3 + depth * 0.5) * (1.0 - smoothstep(0.35, 0.85, uProgress) * (0.4 + fract(fi * 0.37) * 0.6));\n        vec3 tone = mix(vec3(lum), img, 0.55);\n        color += tone * line * fade * 0.34;\n        float edge = max(smoothstep(0.985, 1.0, abs(q.x)), smoothstep(0.975, 1.0, abs(q.y)));\n        // 碎片边缘用暖室内光收边，呼应建筑里亮着灯的窗口\n        color += vec3(0.95, 0.70, 0.44) * edge * fade * 0.22;\n      }\n    }\n  } else {\n    // 残留流线：极慢的程序化曲线，冷色为主，只有一条暖色主线留下温度\n    for (int i = 0; i < 7; i++) {\n      float fi = float(i);\n      float y = 0.2 + fi * 0.1 + sin(p.x * 1.6 + fi * 0.9 + t * 0.06) * 0.05 + noise(vec2(p.x * 2.0 + t * 0.03, fi)) * 0.06;\n      float d = abs(vUv.y - y);\n      color += vec3(0.55, 0.62, 0.70) * smoothstep(0.0022, 0.0, d) * (0.14 + 0.09 * sin(fi));\n    }\n    float flowLine = abs(vUv.y - (0.55 + sin(p.x * 3.0 - t * 0.2) * 0.08));\n    color += vec3(0.97, 0.74, 0.48) * smoothstep(0.003, 0.0, flowLine) * 0.32;\n  }\n  // 文字安全区：标题所在一侧的背景被压暗，视觉退后，字始终可读。\n  float side = uVariant < 0.5 ? vUv.x : 1.0 - vUv.x;\n  float textMask = smoothstep(0.74, 0.5, side) * smoothstep(0.16, 0.3, vUv.y) * smoothstep(0.84, 0.7, vUv.y);\n  color *= 1.0 - textMask * 0.93;\n  // 两种变体共享：漂浮的尘埃 / 星点\n  vec2 cell = floor(p * 70.0 + vec2(0.0, t * 0.15));\n  float star = step(0.985, hash(cell));\n  vec2 local = fract(p * 70.0 + vec2(0.0, t * 0.15)) - 0.5;\n  color += vec3(0.8, 0.84, 0.88) * star * smoothstep(0.18, 0.0, length(local)) * (0.4 + 0.6 * sin(t * 0.8 + hash(cell) * 40.0));\n  // 边缘暗角，中心留给文字\n  color *= 1.0 - 0.45 * smoothstep(0.35, 0.9, length(vUv - 0.5) * 1.4);\n  gl_FragColor = vec4(color * presence, 1.0);\n  #include <colorspace_fragment>\n}\n";

const vertexShader = "attribute vec3 aShapeB;\nattribute vec3 aShapeC;\nattribute vec3 aScatter;\nattribute float aSeed;\nuniform float uTime;\nuniform float uDisperse;\nuniform float uFrom;\nuniform float uTo;\nuniform float uMix;\nuniform float uImpulse;\nuniform vec2 uImpulseOrigin;\nuniform float uSize;\nuniform vec3 uMouse;\nuniform float uReduced;\nuniform float uSpin;\nvarying float vAlpha;\nvarying float vHeat;\n\nvec3 spinY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }\nvec3 shape(float index){\n  if (index < 0.5) return position;\n  if (index < 1.5) return aShapeB;\n  return spinY(aShapeC, uSpin);\n}\n\nvoid main(){\n  float motion = 1.0 - uReduced;\n  // 每个粒子带随机延迟，变形像一阵沙从一个形状流向另一个形状。\n  float local = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uMix);\n  vec3 p = mix(shape(uFrom), shape(uTo), local);\n  float travel = sin(local * 3.14159);\n  p += aScatter * travel * 0.55 * motion;\n  // 离散参数：从秩序到混沌。\n  p += aScatter * uDisperse * motion;\n  // 低频整体呼吸叠加独立漂移，静置时仍有生命感，文字轮廓保持可读。\n  p.xy *= 1.0 + sin(uTime * 0.8) * 0.009 * motion;\n  p += vec3(sin(p.y * 1.8 + uTime * 0.65 + aSeed * 6.28) * 0.048,\n    cos(p.x * 1.2 + uTime * 0.52 + aSeed * 8.0) * 0.045,\n    sin(uTime * 0.6 + aSeed * 12.0) * 0.09) * motion;\n  // 指针排斥：在粒子局部空间里计算。\n  vec2 toMouse = p.xy - uMouse.xy;\n  float d = length(toMouse);\n  float repel = exp(-d * d * 3.2) * 0.55 * motion;\n  p.xy += normalize(toMouse + 0.0001) * repel;\n  p.z += repel * 0.8;\n  // 点击冲量：从点击处扩散的环形冲击波。\n  float age = uTime - uImpulse;\n  float ring = age * 3.2;\n  float dist = length(p.xy - uImpulseOrigin);\n  float wave = exp(-pow(dist - ring, 2.0) * 3.0) * exp(-age * 1.1) * step(0.0, age) * motion;\n  p.xy += normalize(p.xy - uImpulseOrigin + 0.0001) * wave * 0.7;\n  p.z += wave * (aSeed - 0.3) * 1.6;\n  vHeat = clamp(repel * 2.0 + wave * 1.5, 0.0, 1.0);\n  vec4 mv = modelViewMatrix * vec4(p, 1.0);\n  gl_Position = projectionMatrix * mv;\n  gl_PointSize = clamp(uSize / (-mv.z), 1.0, 5.0) * (1.0 + vHeat * 0.6);\n  vAlpha = (0.45 + 0.55 * fract(aSeed * 13.7)) * (1.0 - (0.5+0.5*sin(uTime*0.9+aSeed*20.0))*0.18*motion);\n}\n";

const fragmentShader = "varying float vAlpha;\nvarying float vHeat;\nuniform float uOpacity;\nvoid main(){\n  float d = length(gl_PointCoord - 0.5);\n  if (d > 0.5) discard;\n  vec3 color = mix(vec3(0.9, 0.91, 0.9), vec3(0.77, 0.96, 0.4), vHeat);\n  gl_FragColor = vec4(color, smoothstep(0.5, 0.1, d) * uOpacity * vAlpha);\n}\n";

const fieldVertex = "attribute float aSeed;\nuniform float uTime;\nuniform float uSize;\nuniform float uReduced;\nuniform float uVelocity;\nvarying float vAlpha;\nvarying float vHeat;\nvoid main(){\n  vec3 p = position;\n  float motion = 1.0 - uReduced;\n  // 点场沿隧道缓慢旋转；滚动速度拉长深度方向。\n  float a = uTime * 0.03 * (0.5 + aSeed) * motion;\n  p.xy = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xy;\n  p.z += sin(uTime * 0.4 + aSeed * 20.0) * 0.08 * motion;\n  vec4 mv = modelViewMatrix * vec4(p, 1.0);\n  gl_Position = projectionMatrix * mv;\n  gl_PointSize = clamp(uSize / max(0.2, -mv.z), 1.0, 5.0) * (1.0 + min(abs(uVelocity), 2.0) * 0.4 * motion);\n  vAlpha = (0.3 + 0.7 * fract(aSeed * 17.3)) * smoothstep(0.1, 2.0, -mv.z);\n  vHeat = step(0.965, aSeed);\n}\n";

function rng(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
function sampleText(text, random) {
  const w = 900, h = 300, canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '800 280px "Barlow Condensed", sans-serif';
  ctx.fillText(text, w / 2, h / 2 + 8);
  const pixels = ctx.getImageData(0, 0, w, h).data, out = [];
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (pixels[(y * w + x) * 4 + 3] > 128)
    out.push((x - w / 2) / 150 + (random() - 0.5) * 0.012, (h / 2 - y) / 150, (random() - 0.5) * 0.12);
  return out;
}
function resample(source, count, random) {
  const total = source.length / 3, out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = Math.floor(random() * total) * 3;
    out[i * 3] = source[k];
    out[i * 3 + 1] = source[k + 1];
    out[i * 3 + 2] = source[k + 2];
  }
  return out;
}
function* particleTextSteps(mobile) {
  const random = rng(827), count = mobile ? 4200 : 1e4;
  const code = resample(sampleText("CODE", random), count, random);
  yield;
  const form = resample(sampleText("FORM", random), count, random);
  yield;
  const sculptureGeometry = yield* createArtifactGeometrySteps(LITE_DETAIL);
  const sp = sculptureGeometry.attributes.position.array, sculpture = [];
  for (let i = 0; i < sp.length; i += 3) sculpture.push(sp[i] * 0.62, sp[i + 1] * 0.62, sp[i + 2] * 0.62);
  sculptureGeometry.dispose();
  const shapeC = resample(sculpture, count, random);
  yield;
  const scatter = new Float32Array(count * 3), seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const t = random() * Math.PI * 2, u = random() * 2 - 1, r = 1.5 + random() * 2.5, s = Math.sqrt(1 - u * u);
    scatter[i * 3] = Math.cos(t) * s * r;
    scatter[i * 3 + 1] = u * r * 0.7;
    scatter[i * 3 + 2] = Math.sin(t) * s * r;
    seeds[i] = random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(code, 3));
  geometry.setAttribute("aShapeB", new BufferAttribute(form, 3));
  geometry.setAttribute("aShapeC", new BufferAttribute(shapeC, 3));
  geometry.setAttribute("aScatter", new BufferAttribute(scatter, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  const uniforms = {
    uTime: { value: 0 },
    uDisperse: { value: 0 },
    uFrom: { value: 0 },
    uTo: { value: 0 },
    uMix: { value: 1 },
    uImpulse: { value: -100 },
    uImpulseOrigin: { value: new Vector2() },
    uSize: { value: mobile ? 11 : 13 },
    uMouse: { value: new Vector3(99, 99, 0) },
    uReduced: { value: 0 },
    uOpacity: { value: 1 },
    uSpin: { value: 0 }
  };
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material, uniforms, count };
}
function prepareParticleText(mobile, signal) {
  return buildIncrementally(particleTextSteps(mobile), "particle-text", signal);
}
function createField(mobile) {
  const random = rng(311), count = mobile ? 1100 : 3200, positions = new Float32Array(count * 3), seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const t = random() * Math.PI * 2, r = 0.9 + Math.pow(random(), 0.7) * 4.2;
    positions[i * 3] = Math.cos(t) * r;
    positions[i * 3 + 1] = Math.sin(t) * r * 0.8;
    positions[i * 3 + 2] = -random() * 26 + 2;
    seeds[i] = random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uSize: { value: mobile ? 12 : 16 }, uReduced: { value: 0 }, uVelocity: { value: 0 } };
  const material = new ShaderMaterial({ vertexShader: fieldVertex, fragmentShader, uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material, uniforms };
}

const quadVertex = "varying vec2 vUv;\nvoid main(){\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}\n";

const flowFragment = "uniform sampler2D uPrev;\nuniform vec2 uPoint;\nuniform vec2 uForce;\nuniform vec2 uTexel;\nuniform float uAspect;\nuniform float uRadius;\nuniform float uDissipation;\nvarying vec2 vUv;\n// xy：速度（单位 = 纹素 / 帧）  z：墨迹密度\nvoid main(){\n  vec2 vel = texture2D(uPrev, vUv).xy;\n  // 半拉格朗日自平流：沿速度反向回溯取样。\n  vec2 coord = vUv - vel * uTexel * 1.6;\n  vec4 prev = texture2D(uPrev, coord);\n  // 旋度：用邻域速度差给流动加入涡旋。\n  float l = texture2D(uPrev, coord - vec2(uTexel.x, 0.0)).y;\n  float r = texture2D(uPrev, coord + vec2(uTexel.x, 0.0)).y;\n  float b = texture2D(uPrev, coord - vec2(0.0, uTexel.y)).x;\n  float t = texture2D(uPrev, coord + vec2(0.0, uTexel.y)).x;\n  float curl = clamp((r - l) - (t - b), -2.0, 2.0);\n  vec2 v = prev.xy + vec2(prev.y, -prev.x) * curl * 0.06;\n  // 指针注入：高斯笔刷。\n  vec2 d = vUv - uPoint; d.x *= uAspect;\n  float splat = exp(-dot(d, d) / uRadius);\n  v = v * uDissipation + uForce * splat;\n  float ink = prev.z * (uDissipation - 0.01) + min(length(uForce) * 0.18, 1.0) * splat;\n  // 贴边衰减，避免边界处速度堆积。\n  vec2 border = smoothstep(vec2(0.0), uTexel * 4.0, vUv) * smoothstep(vec2(0.0), uTexel * 4.0, 1.0 - vUv);\n  gl_FragColor = vec4(clamp(v, -10.0, 10.0) * border.x * border.y, clamp(ink, 0.0, 1.5), 1.0);\n}\n";

function createFlow(renderer, width, height) {
  const supported = renderer.capabilities.isWebGL2 && (renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float"));
  const options = { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false };
  let read = new WebGLRenderTarget(width, height, options), write = new WebGLRenderTarget(width, height, options);
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uPrev: { value: read.texture },
    uPoint: { value: new Vector2(-9, -9) },
    uForce: { value: new Vector2() },
    uAspect: { value: 1 },
    uRadius: { value: 22e-4 },
    uDissipation: { value: 0.965 },
    uTexel: { value: new Vector2(1 / width, 1 / height) }
  };
  const material = new ShaderMaterial({ vertexShader: quadVertex, fragmentShader: flowFragment, uniforms, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);
  const color = new Color();
  const clear = () => {
    if (!supported) return;
    const alpha = renderer.getClearAlpha();
    renderer.getClearColor(color);
    renderer.setClearColor(0, 0);
    for (const target of [read, write]) {
      renderer.setRenderTarget(target);
      renderer.clear(true, false, false);
    }
    renderer.setRenderTarget(null);
    renderer.setClearColor(color, alpha);
  };
  const step = (point, force, aspect, dt) => {
    if (!supported) return;
    uniforms.uPrev.value = read.texture;
    uniforms.uPoint.value.copy(point);
    uniforms.uForce.value.copy(force);
    uniforms.uAspect.value = aspect;
    uniforms.uDissipation.value = Math.pow(0.962, dt * 60);
    renderer.setRenderTarget(write);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    const swap = read;
    read = write;
    write = swap;
  };
  const dispose = () => {
    read.dispose();
    write.dispose();
    material.dispose();
    geometry.dispose();
  };
  return { supported, step, clear, dispose, size: new Vector2(width, height), get texture() {
    return read.texture;
  } };
}

function surface(width = 1200, height = 760) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d") };
}
function texture(canvas) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function createProjectTexture() {
  const { canvas, ctx } = surface(1400, 860);
  const bg = ctx.createLinearGradient(0, 0, 0, 860);
  bg.addColorStop(0, "#0a0e14");
  bg.addColorStop(0.62, "#0c1119");
  bg.addColorStop(1, "#07090d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1400, 860);
  for (let k = 0; k < 16; k++) {
    const x = 40 + k * 86;
    ctx.fillStyle = `rgba(150,172,198,${0.05 + k % 3 * 0.025})`;
    ctx.fillRect(x, 0, 1, 860);
    for (let j = 0; j < 70; j++) {
      ctx.fillStyle = `rgba(138,160,188,${0.04 + (j * k + 7) % 11 * 0.014})`;
      ctx.fillRect(x + 5, j * 13, 5 + (j * 19 + k * 13) % 52, 2);
    }
  }
  const core = ctx.createRadialGradient(760, 430, 0, 760, 430, 420);
  core.addColorStop(0, "rgba(255,166,96,0.30)");
  core.addColorStop(0.35, "rgba(214,140,86,0.10)");
  core.addColorStop(1, "rgba(120,140,170,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 1400, 860);
  for (let i = 0; i < 150; i++) {
    ctx.beginPath();
    const spread = (i - 75) / 75;
    for (let x = 0; x <= 1400; x += 5) {
      const focus = Math.exp(-Math.pow((x - 760) / 260, 2));
      const y = 430 + spread * (260 * (1 - focus * 0.85)) + Math.sin(x / 190 + i * 0.07) * 38 * (1 - focus) + Math.sin(x / 47 + i) * 3 * focus;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const hot = i % 11 === 0;
    const grad = ctx.createLinearGradient(0, 0, 1400, 0);
    if (hot) {
      grad.addColorStop(0, "rgba(197,244,103,0.10)");
      grad.addColorStop(0.62, "rgba(197,244,103,0.62)");
      grad.addColorStop(1, "rgba(255,186,120,0.42)");
    } else {
      grad.addColorStop(0, "rgba(128,150,180,0.10)");
      grad.addColorStop(0.7, "rgba(168,186,210,0.22)");
      grad.addColorStop(1, "rgba(238,176,116,0.16)");
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = hot ? 1.2 : 0.7;
    ctx.stroke();
  }
  for (let i = 0; i < 180; i++) {
    const x = i * 971 % 1400, y = i * 233 % 860;
    ctx.fillStyle = i % 6 === 0 ? "#c5f467" : "#5d6b7e";
    ctx.fillRect(x, y, i % 6 === 0 ? 3 : 1, 2);
  }
  ctx.font = '14px "IBM Plex Mono", monospace';
  ctx.fillStyle = "#9aa8ba";
  ["SRC / 12 STREAMS", "EVT / 48,210", "ANOMALY / TRACE", "RISK / EXPLAINED"].forEach((s, i) => ctx.fillText(s, 40 + i * 340, 820));
  return texture(canvas);
}
function createTypeTexture(mobile = false) {
  const W = mobile ? 1024 : 2048, H = mobile ? 1024 : 1152, { canvas, ctx } = surface(W, H);
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#171a1f";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#f2f2eb";
  ctx.textBaseline = "alphabetic";
  if (mobile) {
    ctx.textAlign = "center";
    ctx.font = '800 430px "Barlow Condensed", sans-serif';
    ctx.fillText("FLOW", W / 2, 455);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f2f2eb";
    ctx.strokeText("FIELD", W / 2, 925);
    ctx.fillStyle = "#c5f467";
    ctx.fillRect(842, 320, 64, 64);
  } else {
    ctx.textAlign = "left";
    ctx.font = '800 560px "Barlow Condensed", sans-serif';
    ctx.fillText("FLOW", 70, 560);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f2f2eb";
    ctx.font = '800 560px "Barlow Condensed", sans-serif';
    ctx.strokeText("FIELD", 70, 1080);
    ctx.fillStyle = "#c5f467";
    ctx.fillRect(1770, 440, 74, 74);
  }
  return texture(canvas);
}
function loadImage(url) {
  return new Promise((resolve, reject) => new TextureLoader().load(url, (t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    resolve(t);
  }, void 0, reject));
}

const { smoothstep: smooth$1, lerp, clamp: clamp$1 } = MathUtils;
function* returnSpaceSteps(atelier) {
  let transferred = false;
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.035, 35);
  camera.layers.enable(1);
  const entrance = atelier.zones[3].group.clone(true);
  entrance.visible = true;
  const roof = entrance.getObjectByName("ContactZone.Roof");
  if (roof) roof.position.y = 0;
  scene.add(entrance);
  const ownedMaterials = [], ownedGeometry = [];
  const baseOpacity = /* @__PURE__ */ new Map();
  try {
    let pose = function(rect, p, reduced, settle = 0) {
      portal.position.set(0.375, 1.355, 0.95);
      portal.scale.set(1, 1, 1);
      const approach = smooth$1(p, 0, 0.18), crack = smooth$1(p, 0.18, 0.23), opening = smooth$1(p, 0.3, 0.56), travel = smooth$1(p, 0.7, 0.94);
      const crackAngle = 16 / 88;
      const open = crackAngle * crack + (1 - crackAngle) * (1 - (1 - opening) ** 2);
      const opacity = reduced ? 0 : 1;
      scene.visible = opacity > 1e-3;
      for (const material of ownedMaterials) if (!(material instanceof ShaderMaterial)) material.opacity = (baseOpacity.get(material) ?? 1) * opacity;
      hinge.rotation.y = open * MathUtils.degToRad(88);
      warm.uniforms.uOpacity.value = opacity * (0.18 + open * 0.15) * (1 - settle);
      floorLight.uniforms.uOpacity.value = opacity * (1 - settle);
      floorLight.uniforms.uOpen.value = open;
      inner.intensity = (8 + open * 4) * (1 - settle);
      camera.aspect = rect.width / rect.height;
      const narrow = rect.width / rect.height < 0.8;
      const contentCenter = narrow ? 1 : 0.805, holdZ = narrow ? 4.3 : 3.4;
      camera.position.set(lerp(lerp(narrow ? -0.3 : -0.7, 0.375, approach), contentCenter, travel), lerp(lerp(1.85, 1.42, approach), 1.42, travel), lerp(lerp(narrow ? 8.6 : 7.2, holdZ, approach), narrow ? 0.2 : -0.65, travel));
      target.set(lerp(0.375, contentCenter, travel), 1.42, -1.8);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      const snapshot = runtime.returnViewSnapshot;
      if (snapshot && p < 0.18) {
        camera.position.fromArray(snapshot.position).lerp(new Vector3(0.375, 1.42, holdZ), approach);
        camera.quaternion.fromArray(snapshot.quaternion).slerp(new Quaternion(), approach);
        const projection = snapshot.projection, normal = camera.projectionMatrix.elements.slice(), elements = camera.projectionMatrix.elements;
        const sx = snapshot.width / rect.width, sy = snapshot.height / rect.height;
        const tx = (snapshot.width - 2 * rect.left - rect.width) / rect.width, ty = (rect.height - snapshot.height + 2 * rect.top) / rect.height;
        for (let column = 0; column < 4; column++) {
          const i = column * 4;
          elements[i] = lerp(sx * projection[i] + tx * projection[i + 3], normal[i], approach);
          elements[i + 1] = lerp(sy * projection[i + 1] + ty * projection[i + 3], normal[i + 1], approach);
          elements[i + 2] = lerp(projection[i + 2], normal[i + 2], approach);
          elements[i + 3] = lerp(projection[i + 3], normal[i + 3], approach);
        }
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      }
      camera.updateMatrixWorld(true);
      hinge.updateMatrixWorld(true);
      scene.visible = !reduced && p < 0.94;
    }, update = function(slot, reduced) {
      const rect = slot.getBoundingClientRect();
      const p = clamp$1(parseFloat(slot.closest("#contact")?.style.getPropertyValue("--return-progress") ?? "0"), 0, 1);
      pose(rect, p, reduced);
      syncReturnProjection(slot, camera, hinge, p, reduced);
      slot.dataset.returnPhase = p < 0.18 ? "approach" : p < 0.3 ? "crack-hold" : p < 0.56 ? "opening" : p < 0.7 ? "readable-hold" : p < 0.94 ? "crossing" : "return";
      return rect;
    };
    yield;
    function* exteriorGeometry(source) {
      const geometry = source.index ? source.toNonIndexed() : source;
      const attributes = Object.entries(geometry.attributes), output = attributes.map(() => []);
      const position = geometry.getAttribute("position");
      try {
        for (let index = 0; index < position.count; index += 3) {
          if (index % 1536 === 0) yield;
          let polygon = [0, 1, 2].map((offset) => attributes.map(([, attribute]) => Array.from({ length: attribute.itemSize }, (_, k) => attribute.getComponent(index + offset, k))));
          const positionIndex = attributes.findIndex(([name]) => name === "position");
          const clipped = [];
          for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i], b = polygon[(i + 1) % polygon.length], da = a[positionIndex][2] - 0.925, db = b[positionIndex][2] - 0.925;
            if (da >= 0) clipped.push(a);
            if (da >= 0 !== db >= 0) {
              const t = da / (da - db);
              clipped.push(a.map((attribute, n) => attribute.map((value, k) => lerp(value, b[n][k], t))));
            }
          }
          polygon = clipped;
          for (let i = 1; i < polygon.length - 1; i++) for (const vertex of [polygon[0], polygon[i], polygon[i + 1]]) vertex.forEach((attribute, n) => output[n].push(...attribute));
        }
        const result = new BufferGeometry();
        attributes.forEach(([name, attribute], n) => result.setAttribute(name, new Float32BufferAttribute(output[n], attribute.itemSize)));
        result.computeBoundingSphere();
        ownedGeometry.push(result);
        return result;
      } finally {
        if (source.index) geometry.dispose();
      }
    }
    ;
    const hinge = new Group();
    hinge.position.set(-0.21, 0.03, 1.015);
    scene.add(hinge);
    for (const name of ["Contact.ReturnLight", "ContactZone.Locator"]) entrance.getObjectByName(name)?.removeFromParent();
    const meshes = [];
    entrance.traverse((object) => {
      const mesh = object;
      if (mesh.isMesh && mesh.material) meshes.push(mesh);
    });
    for (const mesh of meshes) {
      mesh.geometry = yield* exteriorGeometry(mesh.geometry);
      const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const copies = originals.map((original) => {
        const material = original.clone();
        material.onBeforeCompile = () => {
        };
        material.customProgramCacheKey = () => "return-architecture";
        material.transparent = original.transparent;
        ownedMaterials.push(material);
        baseOpacity.set(material, original.opacity);
        return material;
      });
      mesh.material = Array.isArray(mesh.material) ? copies : copies[0];
      mesh.castShadow = false;
      if (!mesh.name.startsWith("ContactZone.Facade:")) {
        yield;
        continue;
      }
      const geometry = mesh.geometry, attr = geometry.getAttribute("position");
      const keep = [], leaf = [];
      for (let n = 0; n < attr.count; n += 3) {
        let inside = true;
        for (let v = n; v < n + 3; v++) inside &&= attr.getX(v) >= -0.211 && attr.getX(v) <= 0.971 && attr.getY(v) >= 0.029 && attr.getY(v) <= 2.701 && attr.getZ(v) >= 0.959 && attr.getZ(v) <= 1.091;
        (inside ? leaf : keep).push(n, n + 1, n + 2);
      }
      if (!leaf.length) {
        yield;
        continue;
      }
      const subset = (indices) => {
        const g = new BufferGeometry();
        for (const [name, attribute] of Object.entries(geometry.attributes)) {
          const a = new Float32Array(indices.length * attribute.itemSize);
          indices.forEach((n, i) => {
            for (let k = 0; k < attribute.itemSize; k++) a[i * attribute.itemSize + k] = attribute.getComponent(n, k);
          });
          g.setAttribute(name, new BufferAttribute(a, attribute.itemSize));
        }
        g.computeBoundingSphere();
        ownedGeometry.push(g);
        return g;
      };
      mesh.geometry = subset(keep);
      const panel = new Mesh(subset(leaf).translate(0.21, -0.03, -1.015), mesh.material);
      hinge.add(panel);
      yield;
    }
    scene.add(new HemisphereLight(8951202, 3155227, 0.85));
    const moon = new DirectionalLight(11189969, 1.6);
    moon.position.set(-3, 7, 8);
    scene.add(moon);
    const inner = new PointLight(16761995, 8, 7, 2);
    inner.position.set(0.3, 1.9, 0.25);
    scene.add(inner);
    const portalGeometry = new PlaneGeometry(1.17, 2.65);
    ownedGeometry.push(portalGeometry);
    const warm = new ShaderMaterial({
      uniforms: { uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec2 vUv;uniform float uOpacity;void main(){float glow=exp(-length((vUv-vec2(.5,.48))*vec2(1.,.7))*1.7);gl_FragColor=vec4(mix(vec3(.22,.16,.11),vec3(.80,.60,.36),glow),uOpacity);}"
    });
    ownedMaterials.push(warm);
    const portal = new Mesh(portalGeometry, warm);
    portal.position.set(0.375, 1.355, 0.95);
    scene.add(portal);
    const floorGeometry = new PlaneGeometry(4, 5.5);
    ownedGeometry.push(floorGeometry);
    const floorLight = new ShaderMaterial({
      uniforms: { uOpen: { value: 0 }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec2 vUv;uniform float uOpen;uniform float uOpacity;void main(){float distance=1.-vUv.y;float width=mix(.015,.16,uOpen)+distance*mix(.012,.25,uOpen);float beam=(1.-smoothstep(width,width+.09,abs(vUv.x-.5)))*pow(vUv.y,1.8);gl_FragColor=vec4(.91,.66,.37,beam*.38*uOpacity);}"
    });
    ownedMaterials.push(floorLight);
    const floor = new Mesh(floorGeometry, floorLight);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0.375, 0.044, 3.75);
    scene.add(floor);
    const target = new Vector3();
    const updateFullscreen = (rect, p, reduced = false) => {
      pose(rect, clamp$1(p, 0, 1), reduced, smooth$1(p, 0.86, 0.98));
      const distance = 1.2;
      portal.position.x = lerp(0.375, camera.position.x, smooth$1(p, 0.7, 0.78));
      portal.position.z = Math.min(0.95, camera.position.z - distance);
      const fieldWidth = 2 * distance * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      portal.scale.x = lerp(1, Math.max(1, fieldWidth / 1.17 * 1.08), smooth$1(p, 0.7, 0.8));
      scene.visible = !reduced && p < 1;
      return rect;
    };
    transferred = true;
    return { scene, camera, update, updateFullscreen, dispose() {
      ownedGeometry.forEach((g) => g.dispose());
      ownedMaterials.forEach((m) => m.dispose());
      scene.clear();
    } };
  } finally {
    if (!transferred) {
      ownedGeometry.forEach((g) => g.dispose());
      ownedMaterials.forEach((m) => m.dispose());
      scene.clear();
    }
  }
}
function createReturnSpace(atelier) {
  const steps = returnSpaceSteps(atelier);
  let result = steps.next();
  while (!result.done) result = steps.next();
  return result.value;
}
function prepareReturnSpace(atelier, signal) {
  return buildIncrementally(returnSpaceSteps(atelier), "return-space", signal);
}

const planeVertex = "uniform float uVelocity;\nuniform float uReveal;\nuniform float uReduced;\nuniform float uStudy;\nvarying vec2 vUv;\nvoid main(){\n  vUv = uv;\n  vec3 p = position;\n  float motion = 1.0 - uReduced;\n  // 滚动速度让平面轻微弯曲；揭示前从深处向前推进。\n  p.z += sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * min(uVelocity, 2.0) * 0.1 * motion;\n  p.z -= (1.0 - smoothstep(0.0, 1.0, uReveal)) * 0.15 * motion * (1.0-uStudy);\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);\n}\n";

const planeFragment = "uniform sampler2D uTexture;\nuniform vec2 uMouse;\nuniform float uTime;\nuniform float uVelocity;\nuniform float uReveal;\nuniform float uLens;\nuniform float uHover;\nuniform float uAspect;\nuniform float uTexAspect;\nuniform float uReduced;\nuniform float uStudy;\nvarying vec2 vUv;\n\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat noise(vec2 p){\n  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);\n  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);\n}\nvec2 cover(vec2 uv){\n  float ratio=uAspect/uTexAspect;\n  if(ratio>1.0)uv.y=(uv.y-0.5)/ratio+0.5;else uv.x=(uv.x-0.5)*ratio+0.5;\n  return uv;\n}\nfloat luma(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}\n\nvoid main(){\n  float motion=1.0-uReduced;\n  vec2 aspect=vec2(uAspect,1.0);\n  float dist=length((vUv-uMouse)*aspect);\n  float lens=(1.0-smoothstep(0.15,0.21,dist))*uLens;\n  float rim=(1.0-smoothstep(0.001,0.005,abs(dist-0.19)))*uLens;\n  // 透镜局部放大，边缘色散随指针速度变化。\n  vec2 refracted=vUv-(vUv-uMouse)*lens*0.3*motion;\n  vec2 uv=cover(refracted);\n  float shift=(lens*0.003+min(uVelocity,2.0)*0.001*uHover)*motion;\n  vec3 img=vec3(texture2D(uTexture,uv+vec2(shift,0)).r,texture2D(uTexture,uv).g,texture2D(uTexture,uv-vec2(shift,0)).b);\n\n  vec2 cells=vec2(90.0*uAspect,90.0);\n  vec2 cellId=floor(vUv*cells), local=fract(vUv*cells)-0.5;\n  float lum=luma(texture2D(uTexture,cover((cellId+0.5)/cells)).rgb);\n  float dotRadius=0.035+sqrt(lum)*0.38;\n  float dots=1.0-smoothstep(dotRadius-0.025,dotRadius+0.025,length(local));\n  float lines=1.0-smoothstep(0.005,0.022,min(abs(local.x+0.5),abs(local.y+0.5)));\n  float grain=hash(cellId+floor(uTime*8.0)*motion);\n  vec3 abstract=vec3(0.016)+vec3(0.58,0.65,0.52)*dots*(0.13+lum*0.7);\n  abstract+=vec3(0.17,0.2,0.14)*lines*0.23+grain*0.008;\n\n  // 横向扫描前沿依次经过噪波、网格、半色调、原图；端点严格对应 0 / 1。\n  float turbulence=(noise(vUv*vec2(12.0,7.0))-0.5)*0.065;\n  float front=uReveal*1.5-0.22;\n  float d=front-vUv.x+turbulence;\n  float scan=smoothstep(-0.14,0.025,d);\n  float clarity=smoothstep(-0.015,0.09,d);\n  clarity=mix(clarity,1.0,lens);\n  float staticNoise=hash(floor(vUv*vec2(650.0,380.0))+floor(uTime*12.0)*motion);\n  vec3 scanned=mix(abstract,vec3(lum*dots*1.3),scan);\n  scanned+=vec3(0.5)*staticNoise*(1.0-smoothstep(0.0,0.08,abs(d)))*0.2;\n  vec3 base=mix(vec3(0.008),scanned,uStudy);\n  vec3 color=mix(base,img,clarity);\n  float edge=(1.0-smoothstep(0.001,0.006,abs(d-0.055)))*step(0.005,uReveal)*(1.0-step(0.995,uReveal));\n  color+=vec3(0.77,0.96,0.4)*(edge*0.55+rim*0.5);\n  gl_FragColor=vec4(color,1.0);\n  #include <colorspace_fragment>\n}\r\n";

const fluidFragment = "uniform sampler2D uTexture;\nuniform sampler2D uFlow;\nuniform float uForce;\nuniform float uTime;\nuniform float uReduced;\nuniform float uHasFlow;\nuniform float uAspect;\nuniform float uTexAspect;\nuniform vec2 uMouse;\nvarying vec2 vUv;\n\nfloat hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nvec2 cover(vec2 uv){\n  float r = uAspect / uTexAspect;\n  if (r > 1.0) uv.y = (uv.y - 0.5) / r + 0.5; else uv.x = (uv.x - 0.5) * r + 0.5;\n  return uv;\n}\n\nvoid main(){\n  float motion = 1.0 - uReduced;\n  vec4 f = texture2D(uFlow, vUv);\n  vec2 flow = f.xy;\n  float ink = f.z;\n  // 无浮点渲染目标时，退化为解析式的指针涟漪。\n  if (uHasFlow < 0.5) {\n    vec2 d = vUv - uMouse; d.x *= uAspect;\n    float k = exp(-dot(d, d) * 38.0);\n    flow = normalize(d + 1e-4) * k * 6.0 * sin(length(d) * 60.0 - uTime * 6.0);\n    ink = k * 0.4;\n  }\n  flow *= motion;\n  vec2 uv = cover(vUv);\n  float speed = length(flow);\n  vec2 offset = -flow * 0.0042 * uForce;\n  // 速度越大，色散越强：RGB 三通道沿流向错位。\n  vec2 split = offset * (0.35 + min(speed, 8.0) * 0.09);\n  vec3 color;\n  color.r = texture2D(uTexture, uv + offset + split).r;\n  color.g = texture2D(uTexture, uv + offset).g;\n  color.b = texture2D(uTexture, uv + offset - split).b;\n  // 墨迹：流过的区域留下极淡的酸绿色轨迹（只用语义色，不做全屏染色）。\n  color += vec3(0.77, 0.96, 0.4) * smoothstep(0.15, 1.2, ink) * 0.085 * motion;\n  // 极轻的胶片颗粒：只用于消除大面积平色里的色带，强度压到几乎看不见。\n  color += (hash(vUv * vec2(1280.0, 720.0) + fract(uTime)) - 0.5) * 0.014;\n  gl_FragColor = vec4(color, 1.0);\n  #include <colorspace_fragment>\n}\n";

const { damp, smoothstep: smooth, clamp, degToRad } = MathUtils;
const textureAspect = (t) => {
  const img = t.image;
  return img?.width && img.height ? img.width / img.height : 1.6;
};
function World({ onReady, onError, onStage }) {
  const host = getRenderHost();
  const canvasRef = reactExports.useRef(host.renderer.domElement);
  const mountRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    let disposed = false, cleanup;
    const abort = new AbortController();
    const staged = /* @__PURE__ */ new Set();
    void (async () => {
      let renderer;
      const constructionStep = bootStep("World");
      startup.complete("module");
      await loadBakedEnvironments();
      if (disposed) return;
      const requestAnimationFrame = host.requestFrame, cancelAnimationFrame = host.cancelFrame;
      host.homeMount = mountRef.current;
      try {
        renderer = host.renderer;
        host.profile("home");
      } catch {
        onError();
        return;
      }
      renderer.setClearColor(526344, 0);
      renderer.autoClear = false;
      renderer.info.autoReset = false;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      const mobile = matchMedia("(max-width: 700px)").matches, finePointer = matchMedia("(pointer: fine)").matches;
      let width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio, mobile ? 1 : 1.5);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false;
      const scene = new Scene();
      const camera = new PerspectiveCamera(35, width / height, 0.05, 90);
      camera.position.z = 8;
      camera.layers.enable(PROP_LAYER);
      staged.add(clearGravityGlyphCache);
      await prepareGravityGlyphs(abort.signal);
      const atelier = await prepareAtelier(renderer, mobile, abort.signal);
      staged.add(() => atelier.dispose());
      scene.add(atelier.group);
      constructionStep("atelier");
      await nextPreparationFrame(abort.signal);
      const backdropMaterials = [];
      atelier.environment.parts.Backdrop.traverse((object) => {
        const material = object.material;
        if (material) for (const m of Array.isArray(material) ? material : [material]) backdropMaterials.push({ material: m, opacity: m.opacity });
      });
      const S = 5.6 / atelier.size.x;
      atelier.setScale(S);
      atelier.group.position.copy(atelier.center).multiplyScalar(-S);
      atelier.group.updateMatrixWorld(true);
      scene.fog = atelier.fog;
      const field = createField(mobile);
      scene.add(field.points);
      constructionStep("field");
      await nextPreparationFrame(abort.signal);
      const skyUniforms = { uTime: { value: 0 }, uOpacity: { value: 1 }, uReduced: { value: 0 }, uAspect: { value: 1 }, uMoon: { value: new Vector2(0.6, 0.85) }, uHorizon: { value: 0.5 } };
      const sky = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ vertexShader: quadVertex, fragmentShader: skyFragment, uniforms: skyUniforms, depthTest: false, depthWrite: false, transparent: true, premultipliedAlpha: true }));
      sky.frustumCulled = false;
      const skyScene = new Scene();
      skyScene.add(sky);
      const zoneHover = [0, 0, 0, 0];
      const focusOffset = new Vector3(), corner = new Vector3();
      let returnSpace;
      const hero = { pos: new Vector3(), quat: new Quaternion(), offset: new Vector2(), dist: 10 };
      const journeyQuat = new Quaternion(), journeyPos = new Vector3(), euler = new Euler();
      const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const fluidScene = new Scene();
      const placeholder = new DataTexture(new Uint8Array([8, 8, 8, 255]), 1, 1);
      placeholder.needsUpdate = true;
      const fluidUniforms = { uTexture: { value: placeholder }, uFlow: { value: placeholder }, uForce: { value: 1 }, uTime: { value: 0 }, uReduced: { value: 0 }, uHasFlow: { value: 0 }, uAspect: { value: 1 }, uTexAspect: { value: 16 / 9 }, uMouse: { value: new Vector2(-5, -5) } };
      const fluidMaterial = new ShaderMaterial({ vertexShader: quadVertex, fragmentShader: fluidFragment, uniforms: fluidUniforms, depthTest: false, depthWrite: false });
      const quadGeometry = new PlaneGeometry(2, 2);
      const fluidQuad = new Mesh(quadGeometry, fluidMaterial);
      fluidQuad.frustumCulled = false;
      fluidScene.add(fluidQuad);
      let flow, typeTexture;
      const flowPrev = new Vector2(0.5, 0.5), flowPoint = new Vector2(), flowForce = new Vector2();
      let lastFlowReset = runtime.flowReset;
      const particleScene = new Scene();
      const particleCamera = new PerspectiveCamera(42, 1, 0.1, 40);
      particleCamera.position.z = 5;
      let particles;
      let lastImpulse = runtime.impulse;
      const studioScene = new Scene();
      const studioCamera = new PerspectiveCamera(35, 1, 0.1, 40);
      studioCamera.position.z = 9;
      const study = await prepareArtifact(LITE_DETAIL, abort.signal);
      staged.add(() => study.dispose());
      studioScene.add(study.group);
      constructionStep("study");
      await nextPreparationFrame(abort.signal);
      const aboutStage = await prepareAboutStage(renderer, mobile, abort.signal);
      const cabinDoor = createCabinDoorReturn(aboutStage);
      staged.add(() => {
        cabinDoor.dispose();
        aboutStage.dispose();
      });
      clearGravityGlyphCache();
      staged.delete(clearGravityGlyphCache);
      constructionStep("about");
      await nextPreparationFrame(abort.signal);
      returnSpace = await prepareReturnSpace(atelier, abort.signal);
      staged.add(() => returnSpace?.dispose());
      constructionStep("return");
      await nextPreparationFrame(abort.signal);
      const roomPortal = createRoomPortal(renderer);
      constructionStep("portal");
      const deskMetals = /* @__PURE__ */ new Set();
      atelier.officeDesk.traverse((object) => {
        const material = object.material;
        if (material) {
          for (const m of Array.isArray(material) ? material : [material])
            if (m instanceof MeshStandardMaterial && (m.metalness > 0.6 || m instanceof MeshPhysicalMaterial)) deskMetals.add(m);
        }
      });
      deskMetals.forEach((material) => {
        material.envMap = aboutStage.scene.environment;
        material.envMapIntensity *= aboutStage.scene.environmentIntensity;
      });
      const studyMix = { solid: 1, line: 0, point: 0 };
      let aboutFocus = -1, aboutTelemetryAt = 0;
      const objectHandoff = createObjectHandoff(atelier, () => study.pointUniforms.uPointSize.value), deskHandoff = createDeskHandoff(atelier, aboutStage);
      let studyPoseRevision = -1, heldStudyClip = null, heldStudyPointerRevision = 0;
      for (const a of [study]) a.pointUniforms.uPointSize.value = 22 * dpr;
      atelier.uniforms.uPointSize.value = (mobile ? 16 : 20) * dpr;
      const mediaScene = new Scene(), mediaCamera = new PerspectiveCamera(42, 1, 0.1, 20);
      mediaCamera.position.z = 3;
      const planeGeometry = new PlaneGeometry(2, 2, 40, 24);
      const makePlane = (texture) => {
        const uniforms = { uTexture: { value: texture }, uMouse: { value: new Vector2(-5, -5) }, uTime: { value: 0 }, uVelocity: { value: 0 }, uReveal: { value: 0 }, uLens: { value: 0 }, uHover: { value: 0 }, uAspect: { value: 1 }, uTexAspect: { value: textureAspect(texture) }, uReduced: { value: 0 }, uStudy: { value: 0 } };
        const material = new ShaderMaterial({ vertexShader: planeVertex, fragmentShader: planeFragment, uniforms, depthTest: false, depthWrite: false });
        const mesh = new Mesh(planeGeometry, material);
        mesh.frustumCulled = false;
        return { mesh, material, uniforms };
      };
      const labReveal = makePlane(placeholder);
      labReveal.uniforms.uStudy.value = 1;
      let revealImage = -1;
      const projectPlanes = /* @__PURE__ */ new Map();
      let projectTexture, projectsNear = false, featuredRevealed = false, lastFeatured = -1;
      const images = /* @__PURE__ */ new Map();
      const imageLoads = /* @__PURE__ */ new Map();
      const image = (url) => {
        if (!images.has(url)) {
          images.set(url, null);
          startup.resource(url);
          imageLoads.set(url, loadImage(url).then(async (t) => {
            if (t.image instanceof HTMLImageElement) await t.image.decode().catch(() => void 0);
            if (disposed) {
              t.dispose();
              return;
            }
            images.set(url, t);
            startup.settleResource(url);
          }).catch(() => {
            startup.settleResource(url, true);
            console.warn("Texture failed to load", url);
          }));
        }
        return images.get(url) ?? null;
      };
      projects.forEach((project) => image(project.gallery[0].src));
      const bridgeUniforms = { uTex0: { value: placeholder }, uTex1: { value: placeholder }, uTex2: { value: placeholder }, uTime: { value: 0 }, uProgress: { value: 0 }, uVariant: { value: 0 }, uAspect: { value: 1 }, uReduced: { value: 0 }, uVelocity: { value: 0 } };
      const bridgeMaterial = new ShaderMaterial({ vertexShader: quadVertex, fragmentShader: bridgeFragment, uniforms: bridgeUniforms, depthTest: false, depthWrite: false });
      const bridgeQuad = new Mesh(quadGeometry, bridgeMaterial);
      bridgeQuad.frustumCulled = false;
      const bridgeScene = new Scene();
      bridgeScene.add(bridgeQuad);
      const bridgeSlots = Array.from(document.querySelectorAll("[data-bridge-visual]"));
      const heroSection = document.getElementById("index");
      const featuredSlot = document.querySelector("[data-featured-visual]");
      const labSlot = document.querySelector("[data-lab-visual]");
      const aboutSlot = document.querySelector("[data-about-visual]");
      const apertureEdge = document.querySelector(".room-aperture-edge");
      const deskPoints = Array.from(document.querySelectorAll("[data-desk-point]"));
      const deskLinks = new Map(Array.from(document.querySelectorAll("[data-desk-link]")).map((element) => [Number(element.dataset.deskLink), element]));
      const deskControls = document.querySelector(".desk-controls");
      runtime.pickDesk = (x, y) => {
        if (!aboutSlot || runtime.modal || runtime.objectHandoff) return -1;
        if (roomJourneyState.enabled && roomJourneyState.progress < 0.94) return -1;
        const rect = aboutSlot.getBoundingClientRect();
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return -1;
        return aboutStage.pick((x - rect.left) / rect.width, (y - rect.top) / rect.height);
      };
      const returnSlot = document.querySelector("[data-return-visual]");
      runtime.captureReturnView = () => {
        atelier.group.updateWorldMatrix(true, false);
        camera.updateMatrixWorld(true);
        const inverse = atelier.group.matrixWorld.clone().invert();
        const localPosition = camera.position.clone().applyMatrix4(inverse);
        const rootQuaternion = new Quaternion();
        atelier.group.getWorldQuaternion(rootQuaternion);
        const localQuaternion = rootQuaternion.invert().multiply(camera.quaternion);
        const scale = atelier.group.getWorldScale(new Vector3()).x;
        const projection = camera.projectionMatrix.clone();
        projection.elements[14] /= Math.max(1e-4, scale);
        return { position: localPosition.toArray(), quaternion: localQuaternion.toArray(), projection: projection.toArray(), width, height };
      };
      const projectSection = document.getElementById("projects");
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          projectsNear = true;
          observer.disconnect();
        }
      }, { rootMargin: "900px 0px" });
      if (projectSection) observer.observe(projectSection);
      let journey = 1, shadowDirty = true, fitDirty = true;
      const heroArea = { left: 0, top: 0, right: 1, bottom: 1 };
      const measureHero = () => {
        const header = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 86;
        const title = document.querySelector(".hero-front .hero-title")?.getBoundingClientRect();
        const bottom = document.querySelector(".hero-front .hero-bottom")?.getBoundingClientRect();
        const bottomTop = bottom && bottom.height > 0 ? bottom.top : height - 170;
        if (width / height < 0.9) {
          heroArea.left = width * 0.03;
          heroArea.right = width * 0.97;
          heroArea.top = (title ? title.bottom : height * 0.3) + 18;
          heroArea.bottom = bottomTop - 12;
        } else {
          heroArea.left = Math.max(width * 0.27, (title ? title.right : width * 0.35) + width * 0.025);
          heroArea.right = width * 0.99;
          heroArea.top = header * 0.55;
          heroArea.bottom = bottomTop + height * 0.02;
        }
        if (heroArea.bottom - heroArea.top < height * 0.25) {
          heroArea.top = height * 0.3;
          heroArea.bottom = height * 0.82;
        }
        if (heroArea.right - heroArea.left < width * 0.35) {
          heroArea.left = width * 0.38;
          heroArea.right = width * 0.975;
        }
      };
      const probe = new PerspectiveCamera(), dir = new Vector3(), vc = new Vector3(), extentOut = [0, 0, 0, 0];
      const worldCorners = Array.from({ length: 8 }, (_, c) => {
        const b = atelier.bounds;
        return new Vector3(c & 1 ? b.max.x : b.min.x, c & 2 ? b.max.y : b.min.y, c & 4 ? b.max.z : b.min.z).sub(atelier.center).multiplyScalar(S);
      });
      const fitHero = (yaw, pitch) => {
        const tanV = Math.tan(degToRad(35 / 2)), tanH = tanV * camera.aspect;
        const ax0 = heroArea.left / width * 2 - 1, ax1 = heroArea.right / width * 2 - 1, ay1 = 1 - heroArea.top / height * 2, ay0 = 1 - heroArea.bottom / height * 2;
        dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
        const e = extentOut;
        const extent = (d) => {
          probe.position.copy(dir).multiplyScalar(d);
          probe.lookAt(0, 0, 0);
          probe.updateMatrixWorld();
          e[0] = e[2] = Infinity;
          e[1] = e[3] = -Infinity;
          for (const c of worldCorners) {
            vc.copy(c).applyMatrix4(probe.matrixWorldInverse);
            const x = vc.x / -vc.z / tanH, y = vc.y / -vc.z / tanV;
            e[0] = Math.min(e[0], x);
            e[1] = Math.max(e[1], x);
            e[2] = Math.min(e[2], y);
            e[3] = Math.max(e[3], y);
          }
        };
        let lo = 5, hi = 90;
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          extent(mid);
          if (e[1] - e[0] <= ax1 - ax0 && e[3] - e[2] <= ay1 - ay0) hi = mid;
          else lo = mid;
        }
        extent(hi);
        hero.dist = hi;
        hero.pos.copy(probe.position);
        hero.quat.copy(probe.quaternion);
        hero.offset.set((ax0 + ax1) / 2 - (e[0] + e[1]) / 2, (ay0 + ay1) / 2 - (e[2] + e[3]) / 2);
      };
      const applyShift = (sx, sy) => {
        camera.updateProjectionMatrix();
        camera.projectionMatrix.elements[8] = -sx;
        camera.projectionMatrix.elements[9] = -sy;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      };
      const resize = () => {
        width = innerWidth;
        height = innerHeight;
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        journey = Math.max(1, (heroSection?.offsetHeight ?? height * 2) - height);
        atelier.environment.resize(width * dpr, height * dpr);
        measureHero();
        fitDirty = true;
        shadowDirty = true;
      };
      resize();
      window.addEventListener("resize", resize);
      const lost = (event) => {
        event.preventDefault();
        onError();
      };
      canvasRef.current.addEventListener("webglcontextlost", lost);
      const restored = () => location.reload();
      canvasRef.current.addEventListener("webglcontextrestored", restored);
      let capturingLab = false;
      const visible = (rect) => rect.bottom > 0 && rect.top < height && rect.width > 1 && rect.height > 1;
      const renderSlot = (rect, s, c) => {
        if (rect.bottom < 0 || rect.top > height || rect.width < 1 || rect.height < 1) return;
        if (c instanceof PerspectiveCamera) {
          c.aspect = rect.width / rect.height;
          c.updateProjectionMatrix();
        }
        if (capturingLab) {
          roomPortal.capture(s, c, rect);
          return;
        }
        renderer.setViewport(rect.left, height - rect.bottom, rect.width, rect.height);
        const x = Math.max(0, rect.left), y = Math.max(0, height - rect.bottom);
        renderer.setScissor(x, y, Math.min(width, rect.right) - x, Math.min(height, height - rect.top) - y);
        renderer.setScissorTest(true);
        renderer.clearDepth();
        if (c instanceof PerspectiveCamera) {
          c.aspect = rect.width / rect.height;
          c.updateProjectionMatrix();
        }
        renderer.render(s, c);
        renderer.setScissorTest(false);
      };
      const fitPlane = (plane, aspect) => {
        const h = Math.tan(degToRad(21)) * 3;
        plane.mesh.scale.set(h * aspect, h, 1);
        plane.uniforms.uAspect.value = aspect;
      };
      const renderPlane = (plane, rect) => {
        fitPlane(plane, rect.width / rect.height);
        mediaScene.add(plane.mesh);
        renderSlot(rect, mediaScene, mediaCamera);
        mediaScene.remove(plane.mesh);
      };
      const pointerIn = (rect, out) => {
        const cx = (runtime.pointer.x + 1) / 2 * width, cy = (1 - runtime.pointer.y) / 2 * height;
        out.set((cx - rect.left) / rect.width, 1 - (cy - rect.top) / rect.height);
        return out.x >= 0 && out.x <= 1 && out.y >= 0 && out.y <= 1;
      };
      const heroLook = new Vector2(), drag = new Vector2(), offMouse = new Vector2(9, 9), labMouse = new Vector2(), tmp = new Vector2();
      const heroPos = new Vector3(), heroQuat = new Quaternion(), pickNdc = new Vector2();
      let studyRotation = 0, studyTilt = 0, heroInteractive = false;
      let raf = 0, last = performance.now(), frameCount = 0, sampleStart = last, slow = 0, elapsed = 0, ready = false, entryStart = 0;
      runtime.pickZone = (x, y) => {
        if (!heroInteractive) return 0;
        pickNdc.set(x / width * 2 - 1, 1 - y / height * 2);
        return atelier.pick(pickNdc.x, pickNdc.y, camera);
      };
      runtime.pickObject = (x, y) => {
        if (runtime.roomPhase !== "inspecting" || runtime.modal || runtime.heroDragging) return 0;
        return atelier.pickObject(x / width * 2 - 1, 1 - y / height * 2, camera, runtime.focusZone);
      };
      const roomCamera = new PerspectiveCamera();
      let lastRevealZone = 0;
      let inspectionZone = 0, inspectionProgress = 0;
      let primingPass = false;
      const renderHero = (dt, reduced) => {
        if (runtime.scroll > journey + height) {
          runtime.zoneRects = [];
          heroInteractive = false;
          runtime.keyZone = 0;
          if (runtime.hoverZone) {
            runtime.hoverZone = 0;
            window.dispatchEvent(new CustomEvent("zone-hover", { detail: 0 }));
          }
          return;
        }
        if (runtime.roomPhase !== "handoff" && runtime.focusZone && (runtime.scroll > Math.max(32, height * 0.06) || runtime.modal)) exitRoom();
        const motion = 1 - reduced, p = clamp(runtime.scroll / journey, 0, 1);
        const handoff = 1 - smooth(runtime.scroll, journey + height * 0.1, journey + height);
        const entrance = reduced ? 1 : smooth(elapsed - entryStart, 0.1, 2.6);
        const portrait = camera.aspect < 0.9;
        heroLook.x = damp(heroLook.x, runtime.heroPointer ? runtime.pointer.x : 0, 2.5, dt);
        heroLook.y = damp(heroLook.y, runtime.heroPointer ? runtime.pointer.y : 0, 2.5, dt);
        drag.x = damp(drag.x, runtime.heroDrag.x, 6, dt);
        drag.y = damp(drag.y, runtime.heroDrag.y, 6, dt);
        const yaw0 = portrait ? 0.7 : 0.44, pitch0 = portrait ? 0.3 : 0.235;
        if (fitDirty) {
          fitHero(yaw0, pitch0);
          fitDirty = false;
          shadowDirty = true;
        }
        const yaw = yaw0 + motion * (drag.x + heroLook.x * 0.03), pitch = clamp(pitch0 + motion * (drag.y - heroLook.y * 0.015), 0.12, 0.42);
        probe.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(hero.dist);
        probe.lookAt(0, 0, 0);
        heroPos.copy(probe.position);
        heroQuat.copy(probe.quaternion);
        journeyPos.set(motion * Math.sin(p * Math.PI) * 0.45, motion * p * 0.35 + 0.15, 8 - 10.5 * p * motion);
        journeyQuat.setFromEuler(euler.set(0, 0, motion * p * 0.08));
        const blend = motion * smooth(p, 0, 0.42);
        camera.position.lerpVectors(heroPos, journeyPos, blend);
        camera.quaternion.slerpQuaternions(heroQuat, journeyQuat, blend);
        let shiftX = hero.offset.x * (1 - blend), shiftY = hero.offset.y * (1 - blend);
        const focusT = runtime.focusZone ? reduced ? 1 : clamp((performance.now() - runtime.focusAt) / 1e3, 0, 1) : 0;
        if (runtime.focusZone) {
          inspectionZone = runtime.focusZone;
          inspectionProgress = focusT * focusT * (3 - 2 * focusT);
        } else inspectionProgress = reduced || p > 0.01 ? 0 : damp(inspectionProgress, 0, 9, dt);
        if (inspectionProgress < 1e-3 && !runtime.focusZone) {
          inspectionProgress = 0;
          inspectionZone = 0;
        }
        const focusEase = inspectionProgress;
        if (inspectionZone) {
          const zone = atelier.zones[inspectionZone - 1];
          focusOffset.copy(zone.focus).applyMatrix4(atelier.group.matrixWorld);
          const roomWidth = inspectionZone === 4 ? 3.1 : inspectionZone === 3 ? 5.8 : 7.6;
          const screenFraction = (heroArea.right - heroArea.left) / width;
          const distance = Math.max(2.1, roomWidth * S / (2 * Math.tan(degToRad(17.5)) * camera.aspect * screenFraction * 0.88));
          const yaw2 = inspectionZone === 2 ? 0.18 : 0.08;
          roomCamera.position.set(Math.sin(yaw2), 0.085, Math.cos(yaw2)).normalize().multiplyScalar(distance).add(focusOffset);
          roomCamera.lookAt(focusOffset);
          if (runtime.roomPhase === "handoff") roomCamera.position.lerp(focusOffset, runtime.handoffProgress * 0.12);
          camera.position.lerp(roomCamera.position, focusEase);
          camera.quaternion.slerp(roomCamera.quaternion, focusEase);
          shiftX = MathUtils.lerp(shiftX, (heroArea.left + heroArea.right) / width - 1, focusEase);
          shiftY = MathUtils.lerp(shiftY, 1 - (heroArea.top + heroArea.bottom) / height, focusEase);
          if (focusT === 1) finishRoomTransition();
        }
        atelier.setInspection(inspectionZone, focusEase);
        if (lastRevealZone !== runtime.focusZone || focusEase > 0 && focusEase < 1) shadowDirty = true;
        lastRevealZone = runtime.focusZone;
        applyShift(shiftX, shiftY);
        camera.updateMatrixWorld();
        if (runtime.focusZone) {
          corner.copy(atelier.objectPositions[runtime.focusZone - 1]).applyMatrix4(atelier.group.matrixWorld).project(camera);
          runtime.roomObject = { x: (corner.x + 1) / 2 * width, y: (1 - corner.y) / 2 * height, visible: corner.z > -1 && corner.z < 1 && Math.abs(corner.x) < 1 && Math.abs(corner.y) < 1 };
          const metadata = atelier;
          const projectSource = (point2) => {
            corner.copy(point2).applyMatrix4(atelier.group.matrixWorld).project(camera);
            return { x: (corner.x + 1) / 2 * width, y: (1 - corner.y) / 2 * height };
          };
          runtime.roomCorners = (metadata.handoffSources?.[runtime.focusZone] ?? []).map(projectSource);
          runtime.roomActors = (metadata.handoffActors ?? []).map((actor) => ({ name: actor.name, src: actor.src, crop: actor.crop, corners: actor.corners.map(projectSource) }));
        }
        const dissolve = Math.max(smooth(p, 0.08, 0.5), (1 - entrance) * 0.62) * motion;
        const drift = smooth(p, 0.42, 0.92) * motion;
        const solidOut = reduced ? 1 - handoff : Math.max(dissolve, smooth(p, 0.46, 0.56));
        const line = motion * (smooth(p, 0.05, 0.18) * (1 - smooth(p, 0.46, 0.64)) * 0.85 + (1 - entrance) * 0.6);
        const point = motion * (smooth(p, 0.16, 0.32) * (1 - smooth(p, 0.74, 0.93)) + (1 - entrance) * 0.9);
        const departure = runtime.objectHandoff ? smooth(runtime.objectHandoff.progress, 0.03, 0.38) : 0;
        atelier.setFade(Math.max(solidOut, departure));
        backdropMaterials.forEach((record) => {
          record.material.opacity = record.opacity * (1 - departure);
        });
        const u = atelier.uniforms;
        u.uTime.value = elapsed;
        u.uReduced.value = reduced;
        u.uDissolve.value = dissolve;
        u.uDrift.value = drift;
        u.uSecret.value = runtime.secret ? 1 : 0;
        u.uMouse.value.set(runtime.pointer.x, runtime.pointer.y);
        u.uVelocity.value = Math.min(runtime.pointer.speed, 3);
        atelier.journeyOpacity(line * (1 - departure), point * (1 - departure));
        atelier.tick(elapsed, reduced, runtime.objectHandoff?.kind === "lab");
        heroInteractive = p < 0.04 && entrance > 0.9 && runtime.roomPhase === "overview" && !runtime.modal;
        let hover = heroInteractive ? runtime.keyZone : 0;
        if (!hover && heroInteractive && runtime.heroPointer && !runtime.heroDragging && finePointer) hover = runtime.pickZone((runtime.pointer.x + 1) / 2 * width, (1 - runtime.pointer.y) / 2 * height);
        if (runtime.focusZone) hover = runtime.focusZone;
        if (runtime.roomPhase !== "overview") hover = 0;
        if (hover !== runtime.hoverZone) {
          runtime.hoverZone = hover;
          window.dispatchEvent(new CustomEvent("zone-hover", { detail: hover }));
        }
        for (let z = 0; z < 4; z++) zoneHover[z] = reduced ? hover === z + 1 ? 1 : 0 : damp(zoneHover[z], hover === z + 1 ? 1 : 0, 5, dt);
        atelier.setHover(zoneHover);
        runtime.zoneRects = p < 0.1 ? atelier.zones.map((zone) => {
          let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
          for (const c of zone.frame) {
            corner.copy(c).applyMatrix4(atelier.group.matrixWorld).project(camera);
            const sx = (corner.x + 1) / 2 * width, sy = (1 - corner.y) / 2 * height;
            l = Math.min(l, sx);
            r = Math.max(r, sx);
            t = Math.min(t, sy);
            b = Math.max(b, sy);
          }
          return { zone: zone.id, left: l, top: t, right: r, bottom: b };
        }) : [];
        atelier.fog.near = hero.dist * 1.25;
        atelier.fog.far = hero.dist * 3.8;
        if (shadowDirty) {
          renderer.shadowMap.needsUpdate = true;
          if (!primingPass) shadowDirty = false;
        }
        const f = field.uniforms;
        f.uTime.value = elapsed;
        f.uReduced.value = reduced;
        f.uVelocity.value = runtime.velocity * 0.05;
        f.uOpacity.value = motion * smooth(p, 0.3, 0.6) * handoff * 0.8;
        field.points.visible = f.uOpacity.value > 0.01;
        skyUniforms.uTime.value = elapsed;
        skyUniforms.uReduced.value = reduced;
        skyUniforms.uAspect.value = camera.aspect;
        corner.set(0, -0.12, -12).project(camera);
        skyUniforms.uHorizon.value = clamp((corner.y + 1) / 2, 0.2, 0.8);
        const shortSky = innerHeight < 620 || innerWidth / Math.max(1, innerHeight) > 2.35;
        skyUniforms.uMoon.value.set(portrait ? 0.82 : 0.6, portrait || shortSky ? 0.82 : 0.86);
        skyUniforms.uOpacity.value = (0.35 + 0.65 * entrance) * (1 - smooth(p, 0.3, 0.6)) * handoff * (1 - departure);
        atelier.environment.waterMaterial.uniforms.uOpacity.value = 1 - departure;
        if (skyUniforms.uOpacity.value > 0.01) renderer.render(skyScene, ortho);
        renderer.render(scene, camera);
      };
      const renderReturn = (reduced) => {
        if (runtime.homeDoor) return;
        if (!returnSlot || reduced || !visible(returnSlot.getBoundingClientRect())) return;
        if (document.querySelector(".room-journey[data-window-return=true]") && !runtime.returnViewSnapshot) return;
        returnSpace ??= createReturnSpace(atelier);
        const rect = returnSpace.update(returnSlot, Boolean(reduced));
        if (returnSpace.scene.visible) renderSlot(rect, returnSpace.scene, returnSpace.camera);
      };
      const renderHomeDoor = () => {
        if (!runtime.homeDoor) return;
        returnSpace ??= createReturnSpace(atelier);
        const rect = { left: 0, top: 0, width, height, right: width, bottom: height };
        renderer.setViewport(0, 0, width, height);
        renderer.setScissorTest(false);
        renderer.setClearColor(526344, 1);
        renderer.clear(true, true, false);
        renderer.setClearColor(526344, 0);
        returnSpace.updateFullscreen(rect, runtime.homeDoor.progress);
        if (returnSpace.scene.visible) renderSlot(rect, returnSpace.scene, returnSpace.camera);
      };
      const renderFeatured = (dt, reduced) => {
        if (!featuredSlot || !projectsNear) return;
        if (!projectTexture) {
          projectTexture = createProjectTexture();
          projectPlanes.set(0, makePlane(projectTexture));
        }
        projects.forEach((project, i) => {
          if (i > 0 && !projectPlanes.has(i)) {
            const t = image(project.gallery[0].src);
            if (t) projectPlanes.set(i, makePlane(t));
          }
        });
        const index = Number(featuredSlot.dataset.projectVisual ?? 0);
        const plane = projectPlanes.get(index), rect = featuredSlot.getBoundingClientRect();
        featuredSlot.dataset.mediaReady = String(Boolean(plane));
        if (!plane) return;
        if (!visible(rect)) return;
        if (lastFeatured !== index) {
          plane.uniforms.uReveal.value = reduced ? 1 : 0.25;
          lastFeatured = index;
        }
        if (rect.top < height * 0.8) featuredRevealed = true;
        const u = plane.uniforms, inside = !mobile && pointerIn(rect, tmp);
        if (inside) u.uMouse.value.copy(tmp);
        u.uTime.value = elapsed;
        u.uReduced.value = reduced;
        u.uReveal.value = reduced ? featuredRevealed ? 1 : 0 : damp(u.uReveal.value, featuredRevealed ? 1 : 0, 5, dt);
        u.uLens.value = damp(u.uLens.value, inside ? 0.75 : 0, 6, dt);
        u.uHover.value = damp(u.uHover.value, inside ? 1 : 0, 6, dt);
        u.uVelocity.value = Math.min(Math.abs(runtime.velocity) * 0.05, 2);
        renderPlane(plane, rect);
      };
      const renderLab = (dt, reduced) => {
        if (!labSlot || runtime.objectHandoff?.kind === "lab") return;
        if (roomJourneyState.enabled && roomJourneyState.progress >= 0.22) return;
        const rect = labSlot.getBoundingClientRect();
        if (!visible(rect)) return;
        const motion = 1 - reduced, aspect = rect.width / rect.height, lp = runtime.labPointer;
        const inside = Math.abs(lp.x) <= 1 && Math.abs(lp.y) <= 1;
        if (runtime.lab === 0) {
          if (!flow || !typeTexture) return;
          if (runtime.flowReset !== lastFlowReset) {
            lastFlowReset = runtime.flowReset;
            flow.clear();
          }
          const auto = !inside;
          if (inside) flowPoint.set(lp.x * 0.5 + 0.5, lp.y * 0.5 + 0.5);
          else {
            const t = elapsed * 0.55;
            flowPoint.set(0.5 + 0.34 * Math.sin(t * 1.3), 0.5 + 0.3 * Math.sin(t * 2.1 + 1));
          }
          flowForce.set((flowPoint.x - flowPrev.x) * flow.size.x, (flowPoint.y - flowPrev.y) * flow.size.y);
          if (flowPoint.distanceTo(flowPrev) > 0.2) flowForce.set(0, 0);
          flowPrev.copy(flowPoint);
          flowForce.multiplyScalar(runtime.params[0] * (auto ? 0.45 : 1) * motion * 1.4);
          if (flowForce.length() > 12) flowForce.setLength(12);
          flow.step(flowPoint, flowForce, aspect, dt);
          const u = fluidUniforms;
          u.uFlow.value = flow.texture;
          u.uForce.value = 0.4 + runtime.params[0];
          u.uTime.value = elapsed;
          u.uReduced.value = reduced;
          u.uAspect.value = aspect;
          u.uMouse.value.copy(flowPoint);
          renderSlot(rect, fluidScene, ortho);
        } else if (runtime.lab === 1) {
          if (!particles) return;
          const u = particles.uniforms;
          if (runtime.particleShape !== u.uTo.value) {
            u.uFrom.value = u.uTo.value;
            u.uTo.value = runtime.particleShape;
            u.uMix.value = 0;
          }
          u.uMix.value = reduced ? 1 : Math.min(1, u.uMix.value + dt / 1.9);
          const halfH = Math.tan(degToRad(21)) * 5, halfW = halfH * aspect, s = Math.min(1, halfW * 2 / 6.6);
          particles.points.scale.setScalar(s);
          if (inside) u.uMouse.value.set(lp.x * halfW / s, lp.y * halfH / s, 0);
          else u.uMouse.value.set(99, 99, 0);
          if (runtime.impulse !== lastImpulse) {
            lastImpulse = runtime.impulse;
            u.uImpulse.value = elapsed;
            u.uImpulseOrigin.value.set(inside ? u.uMouse.value.x : 0, inside ? u.uMouse.value.y : 0);
          }
          u.uDisperse.value = runtime.params[1] + smooth(-rect.top / rect.height, 0.05, 0.7) * 1.4;
          u.uTime.value = elapsed;
          u.uReduced.value = reduced;
          u.uSpin.value = elapsed * 0.35 * motion;
          renderSlot(rect, particleScene, particleCamera);
        } else if (runtime.lab === 2) {
          const index = runtime.revealImage % projects.length, t = image(projects[index].gallery[0].src), u = labReveal.uniforms;
          labSlot.dataset.mediaReady = String(Boolean(t));
          if (t && (u.uTexture.value !== t || revealImage !== index)) {
            u.uTexture.value = t;
            u.uTexAspect.value = textureAspect(t);
            u.uReveal.value = 0;
            revealImage = index;
          }
          const target = t ? runtime.params[2] : 0;
          u.uReveal.value = reduced ? target : damp(u.uReveal.value, target, 2.6, dt);
          if (inside) u.uMouse.value.set(lp.x * 0.5 + 0.5, lp.y * 0.5 + 0.5);
          u.uLens.value = damp(u.uLens.value, inside && t ? 1 : 0, 7, dt);
          u.uHover.value = u.uLens.value;
          u.uTime.value = elapsed;
          u.uReduced.value = reduced;
          u.uVelocity.value = Math.min(runtime.pointer.speed * 0.5, 2);
          renderPlane(labReveal, rect);
        } else {
          const halfH = Math.tan(degToRad(17.5)) * 9, halfW = halfH * aspect;
          const s = Math.min(1, halfH * 2 * 0.9 / HEIGHT, halfW * 2 * 0.72 / 2.6);
          study.group.scale.setScalar(s);
          const handedPose = runtime.labMaterialPose;
          if (handedPose && handedPose.revision !== studyPoseRevision) {
            writeMaterialPose(study, studyMix, handedPose);
            studyPoseRevision = handedPose.revision;
            heldStudyClip = handedPose.clips[0][0];
            heldStudyPointerRevision = runtime.labPointerRevision;
          }
          if (inside && runtime.labPointerRevision !== heldStudyPointerRevision) heldStudyClip = null;
          const clip = heldStudyClip ?? (inside ? lp.y * halfH / s : Math.sin(elapsed * 0.45) * 1.3 * motion);
          applyMode(study, studyMix, runtime.material, 1, dt, runtime.material === 0 ? clip : null);
          studyRotation = damp(studyRotation, inside ? lp.x * 0.9 : 0, 4, dt);
          studyTilt = damp(studyTilt, inside ? lp.y * 0.12 : 0, 4, dt);
          const pose = runtime.labPose, spin = pose ? pose.rotation + Math.max(0, elapsed - pose.time) * 0.16 : 0.4 + elapsed * 0.16;
          study.group.rotation.set(motion * studyTilt, motion * (spin + studyRotation), 0);
          labMouse.set(lp.x, lp.y);
          study.sync(elapsed, inside ? Math.min(runtime.pointer.speed, 3) : 0, 0, reduced, runtime.secret ? 1 : 0, pose ? MathUtils.lerp(pose.twist, (runtime.params[3] - 0.5) * 1.6, smooth(elapsed - pose.time, 0, 0.7)) : (runtime.params[3] - 0.5) * 1.6, inside ? labMouse : offMouse);
          renderSlot(rect, studioScene, studioCamera);
        }
      };
      const renderBridges = (reduced) => {
        for (const slot of bridgeSlots) {
          const section = slot.closest(".chapter-bridge");
          if (!section) continue;
          const s = section.getBoundingClientRect();
          if (s.bottom < 0 || s.top > height) continue;
          const rect = slot.getBoundingClientRect();
          const progress = clamp(-s.top / Math.max(1, s.height - height), 0, 1);
          const u = bridgeUniforms;
          u.uVariant.value = slot.dataset.bridgeVisual === "residue" ? 1 : 0;
          u.uProgress.value = clamp((height - s.top) / (s.height + height), 0, 1) * 0.5 + progress * 0.5;
          u.uTime.value = elapsed;
          u.uReduced.value = reduced;
          u.uAspect.value = rect.width / rect.height;
          u.uVelocity.value = Math.min(Math.abs(runtime.velocity) * 0.02, 1);
          for (let i = 0; i < 3; i++) {
            const t = image(projects[i % projects.length].gallery[0].src);
            if (t) u[`uTex${i}`].value = t;
          }
          renderSlot(rect, bridgeScene, ortho);
        }
      };
      const renderAbout = (dt, reduced) => {
        if (!aboutSlot || runtime.objectHandoff?.kind === "desk") return;
        const portal = roomJourneyState.enabled, p = roomJourneyState.progress;
        if (apertureEdge) apertureEdge.style.display = "none";
        if (portal && p <= 0) {
          roomPortal.clear();
          return;
        }
        const rect = aboutSlot.getBoundingClientRect();
        if (!visible(rect)) return;
        const focus = runtime.aboutMode;
        if (focus !== aboutFocus) {
          aboutFocus = focus;
          aboutStage.setFocus(focus);
        }
        aboutStage.setReduced(Boolean(reduced));
        const leaving = roomJourneyState.exitProgress > 0;
        aboutStage.setHover(portal && p < 0.94 || leaving ? -1 : runtime.aboutHover);
        aboutStage.setPointer(portal && p < 0.94 || leaving ? { x: 0, y: 0, inside: false } : runtime.aboutPointer);
        aboutStage.setFade(1 - clamp((-rect.top - height * 0.22) / (height * 0.65), 0, 0.7));
        aboutStage.update(dt, rect.width / rect.height);
        const controlRect = deskControls?.getBoundingClientRect() ?? rect;
        for (let i = 0; i < deskPoints.length; i++) {
          const point = aboutStage.project(i), element = deskPoints[i];
          element.style.left = point.x * 100 + "%";
          element.style.top = point.y * 100 + "%";
          element.dataset.visible = String(point.visible);
          deskLinks.get(i)?.style.setProperty("--desk-anchor-x", (rect.left + point.x * rect.width - controlRect.left) / controlRect.width * 100 + "%");
        }
        if (elapsed - aboutTelemetryAt > 0.1) {
          aboutSlot.dataset.deskCamera = JSON.stringify(aboutStage.snapshot());
          aboutTelemetryAt = elapsed;
        }
        aboutStage.updateShadow();
        if (leaving && returnSlot && !runtime.returnViewSnapshot) {
          const view = cabinDoor.update(rect, returnSlot, roomJourneyState.exitProgress);
          if (view.visible) renderSlot(view.rect, aboutStage.scene, view.camera);
        } else if (portal && p > 0 && p < 1 && labSlot) {
          const aperture = roomPortal.render(aboutStage.scene, aboutStage.camera, rect, labSlot.getBoundingClientRect(), p);
          if (apertureEdge && p > 0.62 && p < 0.94) {
            apertureEdge.style.display = "block";
            apertureEdge.style.left = `${aperture.left}px`;
            apertureEdge.style.top = `${aperture.top}px`;
            apertureEdge.style.width = `${aperture.width}px`;
            apertureEdge.style.height = `${aperture.height}px`;
            apertureEdge.style.opacity = String(Math.min(1, (p - 0.62) * 12, (0.94 - p) * 12));
          }
        } else {
          cabinDoor.reset();
          renderSlot(rect, aboutStage.scene, aboutStage.camera);
        }
      };
      const renderTransition = () => {
        const t = runtime.transition;
        if (!t || !document.documentElement.classList.contains("transitioning")) return;
        const plane = projectPlanes.get(t.index);
        if (!plane) return;
        const p = t.progress, r = t.rect;
        const left = r.left * (1 - p), top = r.top * (1 - p), w = r.width + (width - r.width) * p, h = r.height + (height - r.height) * p;
        plane.uniforms.uReveal.value = 1;
        plane.uniforms.uLens.value = 0;
        plane.uniforms.uVelocity.value = Math.sin(p * Math.PI) * 1.6;
        plane.uniforms.uTime.value = elapsed;
        renderer.setViewport(0, 0, width, height);
        renderer.setScissorTest(false);
        renderPlane(plane, { left, top, width: w, height: h, right: left + w, bottom: top + h });
      };
      const marks = { hero: 0, featured: 0, lab: 0, bridges: 0, about: 0, transition: 0 };
      const prof = () => window.__profile === true;
      let warmFrames = 0, warmFence = null;
      let releasePreparedDepth;
      const primeMeshes = [];
      scene.traverse((object) => {
        if (object.isMesh || object.isPoints || object.isLine) primeMeshes.push({ object, visible: object.visible });
      });
      let primeCursor = 0;
      const gl = renderer.getContext();
      const frame = (now) => {
        if (disposed) return;
        raf = requestAnimationFrame(frame);
        const covered = host.homeActive && runtime.modal && !document.documentElement.classList.contains("transitioning");
        if (document.hidden || host.homePaused || covered) {
          last = now;
          sampleStart = now;
          frameCount = 0;
          slow = 0;
          host.metrics.lastHomeAt = 0;
          return;
        }
        const dt = host.homeActive ? Math.min((now - last) / 1e3, 0.05) : 0;
        last = now;
        if (!ready) return;
        if (!host.homeActive && warmFrames >= 3) {
          if (warmFence) {
            const result = gl.clientWaitSync(warmFence, 0, 0);
            if (result === gl.TIMEOUT_EXPIRED) return;
            gl.deleteSync(warmFence);
            warmFence = null;
            if (result === gl.WAIT_FAILED) {
              onError();
              return;
            }
            releasePreparedDepth?.();
            releasePreparedDepth = void 0;
            startup.complete("warm");
            onReady();
          }
          return;
        }
        elapsed += dt;
        host.profile("home");
        primingPass = !host.homeActive && primeCursor < primeMeshes.length;
        if (primingPass) {
          const selected = new Set(primeMeshes.slice(primeCursor, primeCursor + 8).map((entry) => entry.object));
          for (const entry of primeMeshes) entry.object.visible = entry.visible && selected.has(entry.object) && entry.object !== atelier.environment.water;
          renderer.shadowMap.needsUpdate = true;
        }
        const warmStart = performance.now();
        const beforePrograms = !host.homeActive && warmFrames === 0 ? new Set(renderer.info.programs?.map((p) => p.id)) : null;
        const reduced = runtime.reduced ? 1 : 0;
        const P = prof();
        runtime.pointer.speed *= Math.exp(-dt * 5);
        renderer.setViewport(0, 0, width, height);
        renderer.setScissorTest(false);
        renderer.clear();
        renderer.info.reset();
        if (!runtime.modal || !host.homeActive) {
          let t = P ? performance.now() : 0;
          renderHero(dt, reduced);
          if (P) {
            const n = performance.now();
            marks.hero = n - t;
            t = n;
          }
          renderFeatured(dt, reduced);
          if (P) {
            const n = performance.now();
            marks.featured = n - t;
            t = n;
          }
          capturingLab = roomJourneyState.enabled && roomJourneyState.progress > 0 && roomJourneyState.progress < 0.22;
          renderLab(dt, reduced);
          capturingLab = false;
          if (P) {
            const n = performance.now();
            marks.lab = n - t;
            t = n;
          }
          renderBridges(reduced);
          if (P) {
            const n = performance.now();
            marks.bridges = n - t;
            t = n;
          }
          renderAbout(dt, reduced);
          renderReturn(reduced);
          renderHomeDoor();
          if (P) marks.about = performance.now() - t;
        }
        const tt = P ? performance.now() : 0;
        objectHandoff.render(renderer, camera, width, height, elapsed);
        deskHandoff.render(renderer, camera, width, height);
        renderTransition();
        if (P) marks.transition = performance.now() - tt;
        renderer.setRenderTarget(null);
        if (primingPass) {
          for (const entry of primeMeshes) entry.object.visible = entry.visible;
          primingPass = false;
          primeCursor += 8;
          host.metrics.preparationSlices.push({ name: "hero-gpu-prime", ms: performance.now() - warmStart });
          return;
        }
        if (!host.homeActive) {
          if (beforePrograms) host.metrics.warmNewPrograms = renderer.info.programs?.filter((p) => !beforePrograms.has(p.id)).map((p) => p.name + ":" + p.cacheKey.slice(0, 130)) ?? [];
          host.metrics.warmCpuMs.push(performance.now() - warmStart);
          warmFrames++;
          if (warmFrames === 3) {
            warmFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            gl.flush();
            if (!warmFence) {
              releasePreparedDepth?.();
              releasePreparedDepth = void 0;
              startup.complete("warm");
              onReady();
            }
          }
          return;
        }
        if (host.metrics.lastHomeAt) {
          const interval = now - host.metrics.lastHomeAt;
          host.metrics.homeFrames.push(interval);
          if (host.metrics.entryFrames.length < 120) host.metrics.entryFrames.push(interval);
          if (host.metrics.homeFrames.length > 240) host.metrics.homeFrames.shift();
        }
        host.metrics.lastHomeAt = now;
        frameCount++;
        if (now - sampleStart >= 1e3) {
          const fps = frameCount * 1e3 / (now - sampleStart);
          frameCount = 0;
          sampleStart = now;
          if (fps < 43 && !runtime.modal) slow++;
          else slow = 0;
          if (slow >= 3 && dpr > 0.75 && !runtime.homeDoor) {
            dpr = Math.max(0.75, dpr - 0.25);
            resize();
            slow = 0;
          }
          runtime.telemetry = { fps: Math.round(fps), dpr, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, points: renderer.info.render.points, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries, scroll: Math.round(runtime.velocity * 100) / 100, mouse: Math.round(runtime.pointer.speed * 100) / 100, cameraZ: Math.round(camera.position.z * 100) / 100 };
          window.dispatchEvent(new Event("world-stats"));
        }
        window.__zones = () => runtime.zoneRects;
        window.__profileMarks = marks;
        window.__world = { ...runtime.telemetry, homeDoor: runtime.homeDoor, lab: runtime.lab, portal: roomPortal.snapshot(), studyPose: { pointSize: study.pointUniforms.uPointSize.value, rotation: study.group.rotation.y, twist: study.uniforms.uTwist.value, clip: study.uniforms.uClip.value.x }, handoff: runtime.objectHandoff ? { ...runtime.objectHandoff, visual: runtime.objectHandoff.kind === "lab" ? objectHandoff.snapshot() : deskHandoff.snapshot() } : null, camera: { x: camera.position.x, z: camera.position.z }, room: { zone: runtime.focusZone, phase: runtime.roomPhase, object: runtime.roomObject }, elapsed, reduced: runtime.reduced, flow: flow?.supported ?? false, hero: { area: heroArea, dist: hero.dist, offset: hero.offset, size: atelier.size, scale: S } };
      };
      raf = requestAnimationFrame(frame);
      const onRoomState = () => {
        lockRoomScroll(runtime.roomPhase === "entering" || runtime.roomPhase === "inspecting");
        shadowDirty = true;
      };
      window.addEventListener("room-state", onRoomState);
      constructionStep("wiring");
      startup.sealResources();
      startup.complete("scene");
      async function init() {
        try {
          onStage("LOADING TYPOGRAPHY");
          await document.fonts.ready;
          await document.fonts.load('800 120px "Barlow Condensed"').catch(() => void 0);
          await document.fonts.load('400 12px "IBM Plex Mono"').catch(() => void 0);
          if (disposed) return;
          startup.complete("fonts");
          onStage("BUILDING FIELDS");
          particles = await prepareParticleText(mobile, abort.signal);
          particleScene.add(particles.points);
          await nextPreparationFrame(abort.signal);
          typeTexture = createTypeTexture(mobile);
          fluidUniforms.uTexture.value = typeTexture;
          fluidUniforms.uTexAspect.value = textureAspect(typeTexture);
          await nextPreparationFrame(abort.signal);
          flow = createFlow(renderer, mobile ? 160 : 256, mobile ? 100 : 144);
          flow.clear();
          fluidUniforms.uHasFlow.value = flow.supported ? 1 : 0;
          await nextPreparationFrame(abort.signal);
          onStage("COMPILING SHADERS");
          await waitForSurfaceTextures();
          await Promise.all(imageLoads.values());
          startup.complete("surfaces");
          if (disposed) return;
          for (const texture of [typeTexture, ...images.values()]) if (texture) {
            await nextPreparationFrame(abort.signal);
            host.profile("home");
            renderer.initTexture(texture);
          }
          for (let i = 0; i < 3; i++) {
            const texture = image(projects[i % projects.length].gallery[0].src);
            if (texture) bridgeUniforms[`uTex${i}`].value = texture;
          }
          let compiled = 0;
          const compileHome = async (s, c, candidates) => {
            if (disposed) return;
            await nextPreparationFrame(abort.signal);
            host.profile("home");
            await compileIncrementally(s, c, abort.signal, null, candidates);
            startup.set("shaders", ++compiled / 12);
          };
          await compileHome(scene, camera);
          const inspectionVariants = atelier.getInspectionVariants();
          await compileHome(scene, camera, inspectionVariants);
          await compileIncrementally(scene, atelier.environment.water.camera, abort.signal, atelier.environment.water.getRenderTarget(), inspectionVariants);
          await compileHome(skyScene, ortho);
          releasePreparedDepth = await prepareHero(scene, camera, atelier.environment.water, abort.signal);
          await compileHome(particleScene, particleCamera);
          await roomPortal.prepareCapture(particleScene, particleCamera, abort.signal, labSlot?.getBoundingClientRect());
          await compileHome(studioScene, studioCamera);
          await roomPortal.prepareCapture(studioScene, studioCamera, abort.signal);
          await compileHome(aboutStage.scene, aboutStage.camera);
          await primeScene(aboutStage.scene, aboutStage.camera, abort.signal, "about");
          await roomPortal.prepareRoom(aboutStage.scene, aboutStage.camera, abort.signal);
          await compileHome(fluidScene, ortho);
          await roomPortal.prepareCapture(fluidScene, ortho, abort.signal);
          const preFeatured = createProjectTexture();
          projectTexture = preFeatured;
          projectPlanes.set(0, makePlane(preFeatured));
          const prePlanes = [projectPlanes.get(0), labReveal];
          for (const plane of prePlanes) mediaScene.add(plane.mesh);
          await compileHome(mediaScene, mediaCamera);
          await primeScene(mediaScene, mediaCamera, abort.signal, "media");
          await roomPortal.prepareCapture(mediaScene, mediaCamera, abort.signal);
          for (const plane of prePlanes) mediaScene.remove(plane.mesh);
          await compileHome(bridgeScene, ortho);
          await primeScene(bridgeScene, ortho, abort.signal, "chapter");
          await compileHome(returnSpace.scene, returnSpace.camera);
          await primeScene(returnSpace.scene, returnSpace.camera, abort.signal, "return");
          await deskHandoff.prepare(abort.signal);
          startup.set("shaders", ++compiled / 12);
          await roomPortal.prepare(abort.signal);
          startup.set("shaders", ++compiled / 12);
          if (disposed) return;
          onStage("PREPARING FIRST FRAME");
          entryStart = -3;
          ready = true;
        } catch (error) {
          if (!disposed) {
            console.error("World initialization failed", error);
            onError();
          }
        }
      }
      void init();
      const canvas = canvasRef.current;
      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("webglcontextlost", lost);
        canvas.removeEventListener("webglcontextrestored", restored);
        window.removeEventListener("room-state", onRoomState);
        runtime.pickDesk = () => -1;
        runtime.zoneRects = [];
        runtime.pickZone = () => 0;
        runtime.captureReturnView = () => null;
        runtime.returnViewSnapshot = null;
        runtime.pickObject = () => 0;
        exitRoom();
        lockRoomScroll(false);
        document.documentElement.classList.remove("room-active");
        afterCompilations(() => {
          roomPortal.dispose();
          objectHandoff.dispose();
          deskHandoff.dispose();
          atelier.dispose();
          study.dispose();
          cabinDoor.dispose();
          aboutStage.dispose();
          returnSpace?.dispose();
          sky.geometry.dispose();
          sky.material.dispose();
          field.geometry.dispose();
          field.material.dispose();
          if (particles) {
            particles.geometry.dispose();
            particles.material.dispose();
          }
          flow?.dispose();
          typeTexture?.dispose();
          projectTexture?.dispose();
          placeholder.dispose();
          fluidMaterial.dispose();
          bridgeMaterial.dispose();
          quadGeometry.dispose();
          planeGeometry.dispose();
          labReveal.material.dispose();
          projectPlanes.forEach((p) => p.material.dispose());
          images.forEach((t) => t?.dispose());
          releasePreparedDepth?.();
          if (warmFence) gl.deleteSync(warmFence);
        });
      };
      staged.clear();
    })().catch((error) => {
      if (!disposed) {
        console.error("World preparation failed", error);
        onError();
      }
      for (const release of staged) release();
      staged.clear();
    });
    return () => {
      disposed = true;
      abort.abort();
      cleanup?.();
      for (const release of staged) release();
      staged.clear();
    };
  }, [onReady, onError, onStage]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mountRef, className: "world-mount", "aria-hidden": "true" });
}

export { MATERIAL_MODES, World as default };
