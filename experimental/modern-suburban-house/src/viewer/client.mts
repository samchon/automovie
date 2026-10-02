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
 * starting camera for an inspection view, and `R` returns to that view;
 * `only=<part-id>` isolates an existing payload mesh for a supplemental
 * inspection without changing geometry, material, transform, or lighting.
 * `cut=y` (meters) clips everything above world height y, a horizontal
 * section for reading plans and interiors from above; `observe=<id>` starts
 * at a derived observation pose with the settings interior frame (vertical
 * FOV 60°, near 0.05 m).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { buildScene } from "./scene.mjs";

type IViewerScene = import("./scenePayload").IViewerScene;

const canvas = document.getElementById("viewport");
const panel = document.getElementById("inspection");
if (!(canvas instanceof HTMLCanvasElement) || panel === null)
  throw new Error("viewer page lacks #viewport canvas or #inspection panel");

const query = new URLSearchParams(window.location.search);

/**
 * Read an `x,y,z` query value, or null when absent or malformed.
 *
 * @param  name
 * @returns 
 */
const queryPoint = (name: string): [number, number, number] | null => {
  const values = (query.get(name) ?? "").split(",").map(Number);
  return values.length === 3 && values.every(Number.isFinite)
    ? [values[0], values[1], values[2]]
    : null;
};

const texturesFailed: string[] = [];

/** State a capture script reads; written only by this module. */
const state = {
  renderer: "unknown",
  ready: false,
  subject: "",
  sourceDigest: "",
  error: "",
  texturesLoaded: 0,
  texturesFailed,
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
 * Show the scene with its starting camera and wire the operator controls.
 *
 * @param  payload
 */
const show = async (payload: IViewerScene) => {
  const { width, height, pixelRatio } = payload.raster;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const urls =
    query.get("textures") === "off"
      ? []
      : [
          ...new Set(
            payload.items.flatMap((item) =>
              item.texture === undefined ? [] : [item.texture],
            ),
          ),
        ];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const texture = await loader.loadAsync(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
        textures.set(url, texture);
      } catch {
        state.texturesFailed.push(url);
      }
    }),
  );
  state.texturesLoaded = textures.size;
  const scene = buildScene(payload, textures, renderer);
    const isolate = (part: string|null) => {
    const meshes = scene.children.filter((item) => item instanceof THREE.Mesh);
    const selected =
      part === null
        ? meshes
        : meshes.filter(
            (item) => item.name === part || item.name.startsWith(part + "/"),
          );
    if (selected.length === 0)
      throw Error(`isolated inspection has no existing meshes: ${part}`);
    for (const item of meshes) item.visible = selected.includes(item);
    const record = {
      part,
      visible: selected.map((item) => item.name),
      hidden: meshes.filter((item) => !item.visible).map((item) => item.name),
      sourceDigest: payload.sourceDigest,
    };
    Reflect.set(window, "automovieIsolatedInspection", record);
    return record;
  };
  const only = query.get("only");
  if (only !== null) isolate(only);
  const cut = Number(query.get("cut") ?? "NaN");
  renderer.clippingPlanes = Number.isFinite(cut)
    ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), cut)]
    : payload.sectionX === undefined
      ? []
      : [new THREE.Plane(new THREE.Vector3(-1, 0, 0), payload.sectionX)];
  const observed = (payload.observations ?? []).find(
    (o) => o.id === query.get("observe"),
  );
  const start =
    observed === undefined
      ? {
          ...payload.camera,
          position: queryPoint("eye") ?? payload.camera.position,
          target: queryPoint("at") ?? payload.camera.target,
        }
      : {
          ...payload.camera,
          position: observed.position,
          target: observed.target,
          fovDeg: 60,
          near: 0.05,
        };
  const camera =
    start.orthographicSpan === undefined
      ? new THREE.PerspectiveCamera(
          start.fovDeg,
          width / height,
          start.near,
          start.far,
        )
      : new THREE.OrthographicCamera(
          (-start.orthographicSpan * width) / height / 2,
          (start.orthographicSpan * width) / height / 2,
          start.orthographicSpan / 2,
          -start.orthographicSpan / 2,
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
  Reflect.set(window, "automovieObservation", {
    ids: (payload.observations ?? []).map((o) => o.id),
        isolate(part: string|null) {
      const result = isolate(part);
      render();
      return result;
    },
        select(id: string) {
      const view = payload.observations?.find((o) => o.id === id);
      if (!view) throw Error(`unknown compiled observation ${id}`);
      camera.position.set(...view.position);
      controls.target.set(...view.target);
      if (!(camera instanceof THREE.PerspectiveCamera))
        throw Error("house observation requires its perspective camera");
      camera.fov = view.fovDeg ?? 60;
      camera.near = view.near ?? 0.05;
      camera.updateProjectionMatrix();
      controls.update();
      render();
      return {
        id,
        position: camera.position.toArray(),
        target: controls.target.toArray(),
        fovDeg: camera.fov,
        near: camera.near,
        sourceDigest: payload.sourceDigest,
      };
    },
    probe() {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hit = ray.intersectObjects(scene.children, false)[0];
      return {
        position: camera.position.toArray(),
        target: controls.target.toArray(),
        firstHit: hit
          ? {
              id: hit.object.name,
              distance: hit.distance,
              point: hit.point.toArray(),
            }
          : null,
      };
    },
  });
  state.subject = payload.subject;
  state.sourceDigest = payload.sourceDigest;
  panel.textContent = [
    payload.inspection ? "검사 모드" : "전달 보기",
    payload.subject,
    `소스 ${payload.sourceDigest}`,
    `RENDERER ${state.renderer}`,
    `${width}×${height} @${pixelRatio}`,
    ...(payload.materialReview
      ? [`위에서 아래: ${payload.materialReview.rows.join(" / ")}`]
      : []),
    "R 기본 시점 · I 검사 표시",
  ].join(" · ");
  window.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") reset();
    else if (event.key === "i" || event.key === "I")
      panel.hidden = !panel.hidden;
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
 * @param  error
 */
const fail = (error: unknown) => {
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
    subject === null ? "/scene" : `/scene?${query.toString()}`,
    { cache: "no-store" },
  );
  const body = await response.json();
  if (!response.ok)
    throw new Error(`${response.status}: ${String(body.error ?? "unknown")}`);
  return /** @type {IViewerScene} */ body;
};

void load().then(show).catch(fail);
