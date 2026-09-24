/**
 * Browser client of the production's live 3D view.
 *
 * Responsibility: draw the scene that `server.cts` builds at `GET /scene`
 * with a real WebGL renderer, perspective camera, lights, shadow maps,
 * materials and depth (settings `renderer-boundary`). The page loads this
 * module from `public/index.html`; three.js arrives through the page's
 * import map from the installed package, so no bundler is involved.
 *
 * Inputs: the JSON scene (`IViewerScene` in `scenePayload.ts`). Outputs: the
 * frame on `#viewport`, the `RENDERER` string on the console, and
 * `window.automovieViewer` = `{ renderer, ready, subject, sourceDigest,
 * error }` for a capture script, which waits for `ready`.
 *
 * Order matters: the renderer is created first so its GPU string is known,
 * then the scene is fetched; the first frame is drawn only after every mesh
 * exists, and only then is `ready` set. When the fetch fails (server gone,
 * 409 stale source) the canvas is cleared and the error shown, so an old
 * picture is never presented as current (live-viewing rule).
 *
 * Operator keys (settings `operator-access`): drag to orbit, right-drag or
 * arrow keys to pan, wheel to zoom, `R` returns to the default view, `I`
 * toggles the inspection panel. Labels stay hidden until `I` is pressed.
 *
 * Page query: `subject=calibration` asks the server for the calibration shape
 * instead of the house; `eye=x,y,z` and `at=x,y,z` (meters) replace the
 * starting camera for an inspection view, and `R` returns to that view.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** @typedef {import("./scenePayload").IViewerScene} IViewerScene */
/** @typedef {import("./scenePayload").IViewerSceneItem} IViewerSceneItem */

const canvas = document.getElementById("viewport");
const panel = document.getElementById("inspection");
if (!(canvas instanceof HTMLCanvasElement) || panel === null)
  throw new Error("viewer page lacks #viewport canvas or #inspection panel");

const query = new URLSearchParams(window.location.search);

/**
 * Read an `x,y,z` query value, or null when absent or malformed.
 *
 * @param {string} name
 * @returns {[number, number, number] | null}
 */
const queryPoint = (name) => {
  const values = (query.get(name) ?? "").split(",").map(Number);
  return values.length === 3 && values.every(Number.isFinite)
    ? /** @type {[number, number, number]} */ (values)
    : null;
};

/** State a capture script reads; written only by this module. */
const state = {
  renderer: "unknown",
  ready: false,
  subject: "",
  sourceDigest: "",
  error: "",
};
Reflect.set(window, "automovieViewer", state);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/** Read the GPU renderer string of the context that draws the building. */
const readRendererString = () => {
  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  return String(
    debug === null
      ? gl.getParameter(gl.RENDERER)
      : gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
  );
};
state.renderer = readRendererString();
console.info("RENDERER", state.renderer);

/**
 * Turn one engine mesh item into a lit, shadowed three.js mesh.
 *
 * @param {IViewerSceneItem} item
 */
const buildMesh = (item) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(item.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(item.normals, 3),
  );
  geometry.setIndex(item.indices);
  const material = new THREE.MeshStandardMaterial({
    color: item.color,
    roughness: 0.8,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = item.id;
  mesh.position.set(...item.position);
  mesh.castShadow = item.castShadow;
  mesh.receiveShadow = item.receiveShadow;
  return mesh;
};

/**
 * Build lights and meshes for one scene payload.
 *
 * @param {IViewerScene} payload
 */
const buildScene = (payload) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9dde2);
  const light = payload.lighting;
  scene.add(
    new THREE.HemisphereLight(
      light.skyColor,
      light.groundColor,
      light.fillIntensity,
    ),
  );
  const key = new THREE.DirectionalLight(0xffffff, light.keyIntensity);
  key.position.set(...light.keyFrom).normalize().multiplyScalar(2 * (light.shadowHalfExtent ?? 8) + 4);
  if (light.keyTarget) {
    key.target.position.set(...light.keyTarget);
    key.position.add(key.target.position);
  }
  key.castShadow = true;
  // The shadow box must cover the subject: the calibration shape or the whole house and site.
  const reach = light.shadowHalfExtent ?? 8;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = -reach;
  key.shadow.camera.right = reach;
  key.shadow.camera.top = reach;
  key.shadow.camera.bottom = -reach;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 4 * reach + 40;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(key.target);
  for (const item of payload.items) scene.add(buildMesh(item));
  renderer.toneMappingExposure = light.exposure;
  return scene;
};

/**
 * Show the scene with its starting camera and wire the operator controls.
 *
 * @param {IViewerScene} payload
 */
const show = (payload) => {
  const { width, height, pixelRatio } = payload.raster;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  const scene = buildScene(payload);
  const start = {
    ...payload.camera,
    position: queryPoint("eye") ?? payload.camera.position,
    target: queryPoint("at") ?? payload.camera.target,
  };
  const camera = new THREE.PerspectiveCamera(
    start.fovDeg,
    width / height,
    start.near,
    start.far,
  );
  const controls = new OrbitControls(camera, canvas);
  controls.listenToKeyEvents(window);
  const reset = () => {
    camera.position.set(...start.position);
    controls.target.set(...start.target);
    controls.update();
  };
  const render = () => {
    renderer.render(scene, camera);
  };
  controls.addEventListener("change", render);
  reset();
  render();
  state.subject = payload.subject;
  state.sourceDigest = payload.sourceDigest;
  panel.textContent = [
    payload.inspection ? "검사 모드" : "전달 보기",
    payload.subject,
    `소스 ${payload.sourceDigest}`,
    `RENDERER ${state.renderer}`,
    `${width}×${height} @${pixelRatio}`,
    "R 기본 시점 · I 검사 표시",
  ].join(" · ");
  window.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") reset();
    else if (event.key === "i" || event.key === "I") panel.hidden = !panel.hidden;
  });
  window.addEventListener("pagehide", () => {
    controls.dispose();
    renderer.dispose();
  });
  state.ready = true;
};

/**
 * Clear the canvas and show why no current scene exists.
 *
 * @param {unknown} error
 */
const fail = (error) => {
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  state.error = error instanceof Error ? error.message : String(error);
  panel.textContent = `장면을 불러오지 못했다: ${state.error}`;
  panel.hidden = false;
};

/** Fetch the current scene; a non-200 answer carries its reason. */
const load = async () => {
  const subject = query.get("subject");
  const response = await fetch(
    subject === null ? "/scene" : `/scene?subject=${encodeURIComponent(subject)}`,
    { cache: "no-store" },
  );
  const body = await response.json();
  if (!response.ok)
    throw new Error(`${response.status}: ${String(body.error ?? "unknown")}`);
  return /** @type {IViewerScene} */ (body);
};

void load().then(show, fail);
