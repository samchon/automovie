/**
 * Browser client of the production's live 3D view.
 *
 * Responsibility: draw the scene that `server.ts` builds at `GET /scene`
 * with a real WebGL renderer, perspective camera, lights, shadow maps,
 * materials and depth (settings `renderer-boundary`). The page loads this
 * module through `public/index.html` once browser module loading is resolved.
 * The HTML requests `client.js`, and the native HTTP route reads matching
 * files directly. Browser-module availability under the configured runner
 * remains unverified; this TypeScript source alone does not prove delivery.
 * The three.js imports use the page's installed-package import map.
 *
 * Inputs: the JSON scene (`IViewerScene` in `scenePayload.ts`). Outputs: the
 * frame on `#viewport`, the `RENDERER` string on the console, and
 * `window.automovieViewer` = `{ renderer, ready, subject, sourceDigest,
 * error, texturesLoaded, texturesFailed }` for a capture script. `ready`
 * records completion of scene construction and the first draw; texture
 * failures are collected separately and do not prevent that flag.
 *
 * Order matters: the renderer is created first so its GPU string is known,
 * then the scene is fetched; the first frame is drawn only after every mesh
 * exists, and only then is `ready` set. When the fetch fails (server gone,
 * 409 stale source) the canvas is cleared and the error shown. This client
 * fetches once, so later source edits require a server restart and page
 * reload; an already displayed frame is not automatically invalidated.
 * Texture URLs are loaded once per scene with rejected loads recorded;
 * pagehide disposes controls and renderer, without explicitly disposing
 * the scene's geometries, materials or textures.
 *
 * Operator keys (settings `operator-access`): drag to orbit, right-drag or
 * arrow keys to pan, wheel to zoom, `R` returns to the default view, `I`
 * toggles the inspection panel. Labels stay hidden until `I` is pressed.
 *
 * Page query: `subject=calibration` asks the server for the calibration shape
 * instead of the house; `eye=x,y,z` and `at=x,y,z` (meters) replace the
 * starting camera position and target for an inspection view; `R` restores
 * those coordinates without resetting later FOV/near changes;
 * `only=<part-id>` isolates an existing payload mesh for a supplemental
 * inspection without changing geometry, material, transform, or lighting.
 * `cut=y` (meters) clips everything above world height y, a horizontal
 * section for reading plans and interiors from above; `observe=<id>` starts
 * at a derived observation pose with the settings interior frame (vertical
 * FOV 60°, near 0.05 m).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { buildScene } from "./scene.js";

type IViewerScene = import("./scenePayload").IViewerScene;
type IViewerObservation = NonNullable<IViewerScene["observations"]>[number];
type IIsolatedInspection = { part: string | null; visible: string[]; hidden: string[]; sourceDigest: string };
type IObservationSelection = { id: string; position: number[]; target: number[]; fovDeg: number; near: number; sourceDigest: string };
type IObservationProbe = { position: number[]; target: number[]; firstHit: { id: string; distance: number; point: number[] } | null };

const canvas: HTMLElement | null = document.getElementById("viewport");
const panel: HTMLElement | null = document.getElementById("inspection");
if (!(canvas instanceof HTMLCanvasElement) || panel === null)
  throw new Error("viewer page lacks #viewport canvas or #inspection panel");

const query: URLSearchParams = new URLSearchParams(window.location.search);

/**
 * Read an `x,y,z` query value, or null when absent or malformed.
 *
 * @param name Query parameter containing the comma-separated coordinates.
 * @returns A finite coordinate triple, or null.
 */
const queryPoint: (name: string) => [number, number, number] | null = (name: string): [number, number, number] | null => {
  const values: number[] = (query.get(name) ?? "").split(",").map(Number);
  return values.length === 3 && values.every(Number.isFinite)
    ? [values[0], values[1], values[2]]
    : null;
};

const texturesFailed: string[] = [];

/** State a capture script reads; written only by this module. */
const state: { renderer: string; ready: boolean; subject: string; sourceDigest: string; error: string; texturesLoaded: number; texturesFailed: string[] } = {
  renderer: "unknown",
  ready: false,
  subject: "",
  sourceDigest: "",
  error: "",
  texturesLoaded: 0,
  texturesFailed,
};
Reflect.set(window, "automovieViewer", state);

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
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
const readRendererString: () => string = (): string => {
  const gl: ReturnType<THREE.WebGLRenderer["getContext"]> = renderer.getContext();
  const debug: WEBGL_debug_renderer_info | null = gl.getExtension("WEBGL_debug_renderer_info");
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
 * @param payload The current server-owned scene payload.
 */
const show: (payload: IViewerScene) => Promise<void> = async (payload: IViewerScene): Promise<void> => {
  const { width, height, pixelRatio }: IViewerScene["raster"] = payload.raster;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  const loader: THREE.TextureLoader = new THREE.TextureLoader();
  const textures: Map<string, THREE.Texture> = new Map();
  const urls: string[] =
    query.get("textures") === "off"
      ? []
      : [
          ...new Set(
            payload.items.flatMap((item: IViewerScene["items"][number]): string[] =>
              item.texture === undefined ? [] : [item.texture],
            ),
          ),
        ];
  await Promise.all(
    urls.map(async (url: string): Promise<void> => {
      try {
        const texture: THREE.Texture = await loader.loadAsync(url);
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
  const scene: ReturnType<typeof buildScene> = buildScene(payload, textures, renderer);
    const isolate: (part: string | null) => IIsolatedInspection = (part: string|null): IIsolatedInspection => {
    const meshes: THREE.Mesh[] = scene.children.filter((item: THREE.Object3D): item is THREE.Mesh => item instanceof THREE.Mesh);
    const selected: THREE.Mesh[] =
      part === null
        ? meshes
        : meshes.filter(
            (item: THREE.Mesh): boolean => item.name === part || item.name.startsWith(part + "/"),
          );
    if (selected.length === 0)
      throw new Error(`isolated inspection has no existing meshes: ${part}`);
    for (const item of meshes) item.visible = selected.includes(item);
    const record: IIsolatedInspection = {
      part,
      visible: selected.map((item: THREE.Mesh): string => item.name),
      hidden: meshes.filter((item: THREE.Mesh): boolean => !item.visible).map((item: THREE.Mesh): string => item.name),
      sourceDigest: payload.sourceDigest,
    };
    Reflect.set(window, "automovieIsolatedInspection", record);
    return record;
  };
  const only: string | null = query.get("only");
  if (only !== null) isolate(only);
  const cut: number = Number(query.get("cut") ?? "NaN");
  renderer.clippingPlanes = Number.isFinite(cut)
    ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), cut)]
    : payload.sectionX === undefined
      ? []
      : [new THREE.Plane(new THREE.Vector3(-1, 0, 0), payload.sectionX)];
  const observed: IViewerObservation | undefined = (payload.observations ?? []).find(
    (o: IViewerObservation): boolean => o.id === query.get("observe"),
  );
  const start: IViewerScene["camera"] =
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
  const camera: THREE.PerspectiveCamera | THREE.OrthographicCamera =
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
  const controls: OrbitControls = new OrbitControls(camera, canvas);
  controls.listenToKeyEvents(window);
  const reset: () => void = (): void => {
    camera.position.set(...start.position);
    controls.target.set(...start.target);
    controls.update();
  };
  const render: () => void = (): void => {
    renderer.render(scene, camera);
  };
  controls.addEventListener("change", render);
  reset();
  render();
  Reflect.set(window, "automovieObservation", {
    ids: (payload.observations ?? []).map((o: IViewerObservation): string => o.id),
        isolate(part: string|null): IIsolatedInspection {
      const result: IIsolatedInspection = isolate(part);
      render();
      return result;
    },
        select(id: string): IObservationSelection {
      const view: IViewerObservation | undefined = payload.observations?.find((o: IViewerObservation): boolean => o.id === id);
      if (!view) throw new Error(`unknown compiled observation ${id}`);
      camera.position.set(...view.position);
      controls.target.set(...view.target);
      if (!(camera instanceof THREE.PerspectiveCamera))
        throw new Error("house observation requires its perspective camera");
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
    probe(): IObservationProbe {
      const ray: THREE.Raycaster = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hit: THREE.Intersection | undefined = ray.intersectObjects(scene.children, false)[0];
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
    payload.inspection ? "Inspection mode" : "Delivery view",
    payload.subject,
    `Source ${payload.sourceDigest}`,
    `RENDERER ${state.renderer}`,
    `${width}×${height} @${pixelRatio}`,
    ...(payload.materialReview
      ? [`Top to bottom: ${payload.materialReview.rows.join(" / ")}`]
      : []),
    "R default view · I inspection display",
  ].join(" · ");
  window.addEventListener("keydown", (event: KeyboardEvent): void => {
    if (event.key === "r" || event.key === "R") reset();
    else if (event.key === "i" || event.key === "I")
      panel.hidden = !panel.hidden;
  });
  window.addEventListener("pagehide", (): void => {
    controls.dispose();
    renderer.dispose();
  });
  state.ready = true;
};

/**
 * Clear the canvas and show why no current scene exists.
 *
 * @param error The failed fetch or scene-construction cause.
 */
const fail: (error: unknown) => void = (error: unknown): void => {
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  state.error = error instanceof Error ? error.message : String(error);
  panel.textContent = `Could not load the scene: ${state.error}`;
  panel.hidden = false;
};

/** Fetch once without caching. JSON error bodies supply status and reason; non-JSON bodies reject during parsing before that status check. */
const load: () => Promise<IViewerScene> = async (): Promise<IViewerScene> => {
  const subject: string | null = query.get("subject");
  const response: Response = await fetch(
    subject === null ? "/scene" : `/scene?${query.toString()}`,
    { cache: "no-store" },
  );
  const body: IViewerScene & { error?: string } = await response.json();
  if (!response.ok)
    throw new Error(`${response.status}: ${String(body.error ?? "unknown")}`);
  return /** @type {IViewerScene} */ body;
};

void load().then(show).catch(fail);
