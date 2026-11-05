import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { MovieAudio } from "./audio/MovieAudio";
import { createInspectionRing } from "./createInspectionRing";
import { FilmPlan } from "./film/FilmPlan";
import { FilmRuntime } from "./film/FilmRuntime";
import { FilmTransport } from "./film/FilmTransport";
import { mountFilmControls } from "./film/mountFilmControls";
import "./style.css";

/** Immutable source identity; the existing static review server is never edited here. */
const version: string = "keyframed-bout-001";
/** The one document mount owns controls and the actual viewport. */
const app: HTMLElement | null = document.getElementById("app");
if (!app) throw new Error("Missing production mount");
app.innerHTML = `<main><header><h1>Kickboxing</h1><p>${version} · 180 seconds · original Human polygon</p></header><p id="status" role="status">Preparing the actual film source.</p><section class="viewport"><canvas id="view" aria-label="Three-minute kickboxing film"></canvas></section><section id="clips" class="controls"><button id="film-camera">Film camera</button><label><input id="orbit" type="checkbox"/>Inspection camera</label><button id="play" disabled>Play</button><button id="pause" disabled>Pause</button><label><input id="sound" type="checkbox" checked/>Sound</label><output id="time">0.00 / 180.00 s</output><label>Seek <input id="seek" disabled type="range" min="0" max="180" step="any" value="0"/></label><label>Speed <select id="speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="0.25">0.25×</option></select></label><label>Start <input id="start" type="number" min="0" max="180" step="any" value="0"/></label><label>End <input id="end" type="number" min="0" max="180" step="any" value="180"/></label><button id="interval">Apply interval</button><button id="snapshot">Save current frame</button><button id="export">Export instructions</button><span>Preparation and physical admission do not establish moving-picture or listening acceptance. Actual refusals remain visible.</span></section><details><summary>Actual displayed state, source and performance</summary><button id="inspect">Read current measurements</button><pre id="measurements"></pre></details><section class="audio"><p>The browser and export consume one fixed 180-second soundtrack. Impact cues require matching actual geometry receipts. Inspection controls never change the delivered film camera.</p></section></main>`;

/** Read one owned control and fail explicitly if the document is incomplete. */
function element<T extends HTMLElement>(selector: string): T {
  const found: T | null = app!.querySelector<T>(selector);
  if (!found) throw new Error(`Missing control ${selector}`);
  return found;
}

/** Capture dimensions and review bounds have one URL owner. */
const params: URLSearchParams = new URLSearchParams(location.search);
/** Capture consumes the exact same scene and delivered camera. */
const capture: boolean =
  params.get("cap") === "1" || params.get("capture") === "1";
if (capture) {
  const width: number = Number(params.get("w") ?? "1280");
  const height: number = Number(params.get("h") ?? "720");
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 2 ||
    height < 2 ||
    width > 3840 ||
    height > 2160
  )
    throw new Error("Invalid capture raster");
  document.body.classList.add("capture");
  element(".viewport").style.cssText =
    `width:${width}px;height:${height}px;min-height:0`;
}
/** One original scene is borrowed by public Viewer and Render capture. */
const scene: THREE.Scene = new THREE.Scene();
scene.background = new THREE.Color(0x10151e);
/** The same physical camera performs ordinary playback and capture. */
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  43,
  1,
  0.02,
  80,
);
/** Native inspection controls own no film clock. */
const controls: OrbitControls = new OrbitControls(camera, element("#view"));
controls.enableDamping = false;
controls.enabled = false;
scene.add(new THREE.HemisphereLight(0xe2efff, 0x635c53, 2.1));
/** Fixed overhead source for this one actual scene. */
const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xfff2dc, 3);
light.position.set(2, 7, 4);
light.castShadow = true;
light.shadow.mapSize.set(1024, 1024);
Object.assign(light.shadow.camera, {
  left: -4,
  right: 4,
  top: 4,
  bottom: -4,
  near: 0.1,
  far: 15,
});
scene.add(light);
/** Visible ring and its same actual staging descriptor. */
const ring: createInspectionRing.Result = createInspectionRing();
scene.add(ring.object);
/** One complete native soundtrack, separately owned from film motion. */
const audio: MovieAudio = new MovieAudio();
/** Source runtime is created after healthy scenery has drawn. */
let runtime: FilmRuntime | undefined;
/** The only play/seek clock; absent until full preparation succeeds. */
let transport: FilmTransport | undefined;
/** Completed original draws, separate from idle RAF observation. */
let frames: number = 0;
/** Last CPU submission cost, not a GPU completion measurement. */
let drawMs: number = 0;
/** Real producer intervals; native pose/FK/world matrices remain explicitly combined. */
const frameCosts: {
  checkpointMs: number;
  motionAndNativeMatricesMs: number;
  cameraMs: number;
  completionPublishMs: number;
  seekPreparationAwaitMs: number;
  seekPlacementMs: number;
  seekTotalMs: number;
} = {
  checkpointMs: 0,
  motionAndNativeMatricesMs: 0,
  cameraMs: 0,
  completionPublishMs: 0,
  seekPreparationAwaitMs: 0,
  seekPlacementMs: 0,
  seekTotalMs: 0,
};
/** Paused idle frames perform no body, matrix or draw work. */
let dirty: boolean = true;
/** Document lifetime cancels late asynchronous readiness. */
let closed: boolean = false;
/** Actual producer stage distinguishes motion, camera and original draw refusals. */
let producerFailure: {
  stage: "motion" | "camera" | "draw";
  message: string;
} | null = null;
/** Source and audio preparation are measured separately from startup and encoding. */
const preparationCosts: { sourceMs: number; audioMs: number } = {
  sourceMs: 0,
  audioMs: 0,
};
/** Truthful public state exists even when actual preparation refuses. */
const state: {
  version: string;
  durationSeconds: number;
  fps: number;
  frameCount: number;
  eventCount: number;
  ready: boolean;
  stage: string;
  error?: string;
  seek?: (seconds: number) => Promise<void>;
  inspect?: () => object;
  contacts?: () => unknown[];
  floorContacts?: () => unknown[];
  audioEvents?: () => FilmPlan.Event[];
  audioManifest?: () => MovieAudio.Manifest;
} = {
  version,
  durationSeconds: 180,
  fps: 30,
  frameCount: 5400,
  eventCount: 0,
  ready: false,
  stage: "preparing",
};
Reflect.set(window, "__kickboxingFilm", state);
Reflect.set(window, "__kickboxing", state);

/** Adopt the source camera independently of prior inspection or seek history. */
function filmCamera(seconds: number): void {
  const view: FilmPlan.Camera = FilmPlan.camera(seconds);
  camera.position.set(...view.position);
  camera.fov = view.fovDegrees;
  camera.lookAt(new THREE.Vector3(...view.target));
  camera.updateProjectionMatrix();
  controls.target.set(...view.target);
}
filmCamera(0);

/** Draw the actual scene before publishing its completed exact film time. */
function draw(seconds: number): void {
  const begun: number = performance.now();
  try {
    handle.renderer.render(scene, camera);
  } finally {
    drawMs = performance.now() - begun;
  }
  frames++;
  const publicationStarted: number = performance.now();
  handle.completeFrame(seconds);
  frameCosts.completionPublishMs = performance.now() - publicationStarted;
  element<HTMLOutputElement>("#time").value =
    `${seconds.toFixed(2)} / 180.00 s`;
  element<HTMLInputElement>("#seek").value = String(seconds);
  dirty = false;
}

/** Keep scenery and the Viewer alive when a requested motion refuses. */
const handle: IAutoMovieViewerHandle = mountViewer(
  element("#view"),
  scene,
  camera,
  (): boolean => {
    try {
      if (transport?.playing) transport.tick();
      if (dirty) draw(transport?.seconds ?? 0);
    } catch (error: unknown) {
      report(error);
    }
    return true;
  },
  {
    pixelRatio: 1,
    preserveDrawingBuffer: true,
    freezeCompleted: (): ((resume: boolean) => void) =>
      transport?.freeze() ?? ((_resume: boolean): void => {}),
    redrawCompleted: (seconds: number): void => {
      if (transport) {
        transport.seek(seconds);
      } else if (seconds === 0) {
        draw(0);
      } else throw new Error("The complete film has not loaded");
    },
  },
);
handle.renderer.shadowMap.enabled = true;
handle.renderer.shadowMap.type = THREE.PCFShadowMap;
controls.addEventListener("change", (): void => {
  if (controls.enabled) dirty = true;
});

/** Complete source, camera and original drawing as one successful producer operation. */
function place(seconds: number): void {
  if (!runtime?.ready || !state.ready)
    throw new Error("The complete film has not loaded");
  frameCosts.checkpointMs = 0;
  const position: THREE.Vector3 = camera.position.clone();
  const rotation: THREE.Quaternion = camera.quaternion.clone();
  const fov: number = camera.fov;
  const target: THREE.Vector3 = controls.target.clone();
  let stage: "motion" | "camera" | "draw" = "motion";
  try {
    const motionStarted: number = performance.now();
    try {
      runtime.evaluate(seconds);
    } finally {
      frameCosts.motionAndNativeMatricesMs = performance.now() - motionStarted;
    }
    stage = "camera";
    const cameraStarted: number = performance.now();
    try {
      if (capture || !controls.enabled) filmCamera(seconds);
    } finally {
      frameCosts.cameraMs = performance.now() - cameraStarted;
    }
    stage = "draw";
    draw(seconds);
    producerFailure = null;
    if (state.error) {
      delete state.error;
      element("#status").textContent =
        "The full source is loaded. Independent moving-picture and listening review remain required.";
    }
  } catch (error: unknown) {
    camera.position.copy(position);
    camera.quaternion.copy(rotation);
    camera.fov = fov;
    controls.target.copy(target);
    camera.updateProjectionMatrix();
    producerFailure = {
      stage,
      message: error instanceof Error ? error.message : String(error),
    };
    throw error;
  }
}

/** Retain the last completed scene and clock while exposing the exact refusal. */
function report(error: unknown): void {
  transport?.pause();
  state.error = error instanceof Error ? error.message : String(error);
  element("#status").textContent = `Request refused: ${state.error}`;
  element("#measurements").textContent = JSON.stringify(
    state.inspect?.() ?? state,
    null,
    2,
  );
  console.error(error);
}

/** Reject controls and capture before actual full preparation, rather than drawing a fallback. */
function requireTransport(): FilmTransport {
  if (!state.ready || !transport)
    throw new Error("The complete film has not loaded");
  return transport;
}

/** Resolve actual source, shared audio and initial placement once for every consumer. */
const bootstrap: Promise<void> = (async (): Promise<void> => {
  try {
    await new Promise<void>((resolve: () => void): void => {
      requestAnimationFrame((): void => resolve());
    });
    if (closed) throw new Error("The Viewer closed during preparation");
    const start: number = readSeconds("start", 0);
    const end: number = readSeconds("end", 180);
    const speed: number = readSeconds("speed", 1);
    if (
      ![0.25, 0.5, 1].includes(speed) ||
      start < 0 ||
      end > 180 ||
      start >= end
    )
      throw new Error(
        "URL requires 0 <= start < end <= 180 and speed .25, .5 or 1",
      );
    runtime = new FilmRuntime();
    for (const actor of Object.values(runtime.actors)) {
      scene.add(actor.person.object);
      // Review-only skeleton overlay (joint points and sticks): `?rig=1`.
      if (params.get("rig") === "1") actor.showRig();
    }
    dirty = true;
    const sourceStarted: number = performance.now();
    await runtime.prepare(
      (id: string, completed: number, total: number): void => {
        element("#status").textContent =
          `Measuring contacts ${completed}/${total}: ${id}`;
      },
    );
    preparationCosts.sourceMs = performance.now() - sourceStarted;
    if (closed) throw new Error("The Viewer closed during preparation");
    const audioStarted: number = performance.now();
    audio.configure(
      runtime.audioEvents(),
      runtime.contacts(),
      runtime.floorContacts(),
    );
    await audio.prepare();
    preparationCosts.audioMs = performance.now() - audioStarted;
    if (closed) throw new Error("The Viewer closed during preparation");
    transport = new FilmTransport(audio, place);
    transport.sound = !capture && element<HTMLInputElement>("#sound").checked;
    state.eventCount = runtime.audioEvents().length;
    state.ready = true;
    state.stage = "loaded-awaiting-independent-playback-review";
    transport.setInterval(start, end);
    transport.speed = speed;
    element<HTMLInputElement>("#start").value = String(start);
    element<HTMLInputElement>("#end").value = String(end);
    element<HTMLSelectElement>("#speed").value = String(speed);
    for (const selector of ["#play", "#pause", "#seek"])
      element<HTMLButtonElement | HTMLInputElement>(selector).disabled = false;
    element("#status").textContent =
      "The full source is loaded. Moving-picture, listening and final decoded export acceptance require actual review.";
    if (params.get("play") === "1" && !capture)
      void transport.play().catch(report);
  } catch (error: unknown) {
    state.ready = false;
    state.stage = "preparation-refused";
    report(error);
    dirty = true;
    throw error;
  }
})();
void bootstrap.catch((): void => {});

/** Reject empty query values instead of silently converting them to zero. */
function readSeconds(name: string, fallback: number): number {
  const text: string | null = params.get(name);
  if (text !== null && !text.trim())
    throw new Error(`URL ${name} must contain seconds`);
  const value: number = text === null ? fallback : Number(text);
  if (!Number.isFinite(value)) throw new Error(`URL ${name} must be finite`);
  return value;
}

/**
 * Await original preparation, then complete the actual source/camera/draw seek.
 * Render awaits the same preparation and uses the original transport producer.
 * Seconds are finite [0,180]; failures reject and successful completion follows
 * the original actual draw. Source waiting and placement intervals stay separate.
 */
async function seek(seconds: number): Promise<void> {
  const started: number = performance.now();
  try {
    try {
      await bootstrap;
    } finally {
      frameCosts.seekPreparationAwaitMs = performance.now() - started;
    }
    if (capture) {
      controls.enabled = false;
      element<HTMLInputElement>("#orbit").checked = false;
    }
    const placementStarted: number = performance.now();
    try {
      requireTransport().seek(seconds);
    } finally {
      frameCosts.seekPlacementMs = performance.now() - placementStarted;
    }
  } finally {
    frameCosts.seekTotalMs = performance.now() - started;
  }
}
state.seek = seek;

/** Review-only inspection camera: "x,y,z:tx,ty,tz" in world metres; the delivered camera is unchanged. */
Reflect.set(window, "__kickboxingView", (value: string): void => {
  const [position, target] = value
    .split(":")
    .map((part: string): number[] => part.split(",").map(Number));
  if (position?.length !== 3 || target?.length !== 3)
    throw new Error("View is x,y,z:tx,ty,tz");
  camera.position.set(position[0]!, position[1]!, position[2]!);
  camera.fov = 40;
  camera.lookAt(target[0]!, target[1]!, target[2]!);
  camera.updateProjectionMatrix();
  draw(transport?.seconds ?? 0);
});
Reflect.set(window, "__afSeek", seek);
state.contacts = (): unknown[] => {
  if (!state.ready || !runtime)
    throw new Error("Full film contacts are unavailable");
  return runtime.contacts();
};
state.floorContacts = (): unknown[] => {
  if (!state.ready || !runtime)
    throw new Error("Full film floor receipts are unavailable");
  return runtime.floorContacts();
};
state.audioEvents = (): FilmPlan.Event[] => {
  if (!state.ready || !runtime)
    throw new Error("The actual audio event manifest is unavailable");
  return runtime.audioEvents();
};
state.audioManifest = (): MovieAudio.Manifest => {
  if (!state.ready) throw new Error("The full soundtrack is unavailable");
  return audio.manifest();
};
state.inspect = (): object => ({
  version,
  stage: state.stage,
  ready: state.ready,
  film: runtime?.inspect(),
  transport: transport
    ? {
        seconds: transport.seconds,
        playing: transport.playing,
        speed: transport.speed,
        interval: [...transport.interval],
        sound: transport.sound,
        error: transport.error,
      }
    : null,
  camera: {
    mode: controls.enabled ? "inspection" : "film",
    position: camera.position.toArray(),
    rotation: camera.quaternion.toArray(),
    fov: camera.fov,
    planned: FilmPlan.camera(transport?.seconds ?? 0),
  },
  renderer: {
    frames,
    drawSubmissionMs: drawMs,
    calls: handle.renderer.info.render.calls,
    triangles: handle.renderer.info.render.triangles,
    error: producerFailure?.stage === "draw" ? producerFailure.message : null,
  },
  producerFailure: structuredClone(producerFailure),
  preparationCosts: { ...preparationCosts },
  frameCosts: {
    ...frameCosts,
    motionBoundary:
      "FilmRuntime evaluation includes actual clinical fitting, FK, actor pose and world-matrix updates; actor costs describe each last apply and are not frame aggregates",
    drawBoundary:
      "CPU renderer submission; GPU completion, pixel readback and encoding are separate Render-owner costs",
  },
  audio: audio.diagnostics(),
  acceptance: {
    continuousViewing: "not-reviewed",
    listening: "not-reviewed",
    decodedFilm: "not-delivered",
  },
});

const disposeControls: () => void = mountFilmControls({
  root: app,
  capture,
  version,
  controls,
  transport: (): FilmTransport | undefined => transport,
  ready: (): boolean => state.ready,
  inspect: (): object => state.inspect!(),
  requireTransport,
  seek,
  filmCamera,
  invalidate: (): void => {
    dirty = true;
  },
  report,
});
window.addEventListener(
  "pagehide",
  (): void => {
    closed = true;
    transport?.pause();
    const errors: unknown[] = [];
    for (const dispose of [
      (): void => audio.dispose(),
      (): void => runtime?.dispose(),
      (): void => handle.stop(),
      (): void => controls.dispose(),
      disposeControls,
      (): void => ring.dispose(),
    ])
      try {
        dispose();
      } catch (error: unknown) {
        errors.push(error);
      }
    if (errors.length)
      console.error(new AggregateError(errors, "Film Viewer shutdown failed"));
  },
  { once: true },
);
