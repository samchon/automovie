import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import type { IFilmViewerState } from "./IFilmViewerState";
import { films } from "./films";
import { FilmTransport } from "./runtime/FilmTransport";
import { bindFilmMediaInspection } from "./runtime/bindFilmMediaInspection";
import { configureFilmReview } from "./runtime/configureFilmReview";
import { createFilmInspectionView } from "./runtime/createFilmInspectionView";
import { mountFilmControls } from "./runtime/mountFilmControls";
import { selectFilm } from "./selectFilm";
import { FilmPlan } from "./shots/kickboxing/ring-bout/FilmPlan";
import "./style.css";

/** Initial presentation mode; a loaded archive replaces this label with its admitted manifest mode. */
const version: string = new URLSearchParams(location.search).has("physics")
  ? "cached performance review"
  : "authored motion";
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
element("#orbit")
  .closest("label")!
  .insertAdjacentHTML(
    "afterend",
    '<label><input id="rig" type="checkbox"/>Rig points and sticks</label>',
  );
element<HTMLInputElement>("#rig").checked = params.get("rig") !== "0";
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
/**
 * The film the `film` parameter names, or the only film when it is omitted. A
 * refused name is shown on the page and in the public state that review and
 * export tools read, instead of leaving them waiting for readiness.
 */
const selected: { name: string; film: IFilm } = ((): {
  name: string;
  film: IFilm;
} => {
  try {
    return selectFilm(films, params.get("film"));
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : String(error);
    element("#status").textContent = `Request refused: ${message}`;
    const refused: object = {
      ready: false,
      stage: "film-refused",
      error: message,
    };
    Reflect.set(window, "__kickboxingFilm", refused);
    Reflect.set(window, "__kickboxing", refused);
    throw error;
  }
})();
/** The mounted film; absent until its preparation completes. */
let production: IFilmProduction | undefined;
/** Public Viewer handle, mounted on the prepared film's scene and camera. */
let handle: IAutoMovieViewerHandle | undefined;
/** Native inspection controls own no film clock. */
let controls: OrbitControls | undefined;
/** The only play/seek clock; absent until full preparation succeeds. */
let transport: FilmTransport | undefined;
/** Release of the review controls once they are mounted. */
let disposeControls: (() => void) | undefined;
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
/** Actual producer stage distinguishes placement and original draw refusals. */
let producerFailure: {
  stage: "placement" | "draw";
  message: string;
} | null = null;
/** Source and audio preparation are measured separately from startup and encoding. */
const preparationCosts: { sourceMs: number; audioMs: number } = {
  sourceMs: 0,
  audioMs: 0,
};
/** Truthful public state exists even when actual preparation refuses. */
const state: IFilmViewerState = {
  version,
  film: selected.name,
  durationSeconds: selected.film.durationSeconds,
  fps: selected.film.fps,
  frameCount: selected.film.durationSeconds * selected.film.fps,
  eventCount: 0,
  ready: false,
  stage: "preparing",
};
Reflect.set(window, "__kickboxingFilm", state);
Reflect.set(window, "__kickboxing", state);

/** Require the prepared film rather than drawing a fallback. */
function requireProduction(): IFilmProduction {
  if (!production || !handle)
    throw new Error("The complete film has not loaded");
  return production;
}

/** Adopt the delivered camera for a second, independent of inspection history. */
function filmCamera(seconds: number): void {
  const film: IFilmProduction = requireProduction();
  film.seek(seconds);
  controls?.target.copy(film.cameraTarget(seconds));
  dirty = true;
}

/** Draw the actual scene before publishing its completed exact film time. */
function draw(seconds: number): void {
  const film: IFilmProduction = requireProduction();
  const begun: number = performance.now();
  try {
    handle!.renderer.render(film.scene, film.camera);
  } finally {
    drawMs = performance.now() - begun;
  }
  frames++;
  const publicationStarted: number = performance.now();
  handle!.completeFrame(seconds);
  frameCosts.completionPublishMs = performance.now() - publicationStarted;
  element<HTMLOutputElement>("#time").value =
    `${seconds.toFixed(2)} s · available ${film.available[0]} to ${film.available[1]} s`;
  element<HTMLInputElement>("#seek").value = String(seconds);
  dirty = false;
}

/** Complete the film's placement and the original drawing as one producer operation. */
function place(seconds: number): void {
  const film: IFilmProduction = requireProduction();
  if (!state.ready) throw new Error("The complete film has not loaded");
  frameCosts.checkpointMs = 0;
  const inspecting: boolean = !capture && controls?.enabled === true;
  const position: THREE.Vector3 = film.camera.position.clone();
  const rotation: THREE.Quaternion = film.camera.quaternion.clone();
  const fov: number = film.camera.fov;
  let stage: "placement" | "draw" = "placement";
  try {
    const placementStarted: number = performance.now();
    try {
      film.seek(seconds);
    } finally {
      frameCosts.motionAndNativeMatricesMs =
        performance.now() - placementStarted;
    }

    // The inspection camera keeps its own view while the performance moves.
    const cameraStarted: number = performance.now();
    if (inspecting) {
      film.camera.position.copy(position);
      film.camera.quaternion.copy(rotation);
      film.camera.fov = fov;
      film.camera.updateProjectionMatrix();
    } else controls?.target.copy(film.cameraTarget(seconds));
    frameCosts.cameraMs = performance.now() - cameraStarted;
    stage = "draw";
    draw(seconds);
    producerFailure = null;
    if (state.error) {
      delete state.error;
      element("#status").textContent =
        "The available source interval is loaded. Independent moving-picture and listening review remain required.";
    }
  } catch (error: unknown) {
    film.camera.position.copy(position);
    film.camera.quaternion.copy(rotation);
    film.camera.fov = fov;
    film.camera.updateProjectionMatrix();
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

/** Prepare the selected film once, then mount it for every consumer. */
const bootstrap: Promise<void> = (async (): Promise<void> => {
  try {
    await new Promise<void>((resolve: () => void): void => {
      requestAnimationFrame((): void => resolve());
    });
    if (closed) throw new Error("The Viewer closed during preparation");
    // The film prepares its scene, contacts and soundtrack; sound decoding
    // starts after contact measurement, which splits the two costs.
    const sourceStarted: number = performance.now();
    let audioStarted: number | null = null;
    const film: IFilmProduction = await selected.film.create(
      (message: string): void => {
        if (message === "Decoding the soundtrack") {
          audioStarted = performance.now();
          preparationCosts.sourceMs = audioStarted - sourceStarted;
        }
        element("#status").textContent = message;
      },
    );
    preparationCosts.audioMs =
      audioStarted === null ? 0 : performance.now() - audioStarted;
    if (closed) {
      film.dispose();
      throw new Error("The Viewer closed during preparation");
    }
    production = film;
    const { start, end, speed }: ReturnType<typeof configureFilmReview> =
      configureFilmReview(app, film, params);
    state.available = film.available;

    // Polygon figures expose their actual joints and sticks by default.
    const showRig: () => void = (): void => {
      const visible: boolean = element<HTMLInputElement>("#rig").checked;
      if ("showReview" in film.runtime)
        film.runtime.showReview(visible, params.get("forces") === "1");
      else
        for (const actor of Object.values(film.runtime.actors))
          actor.showRig(visible);
      dirty = true;
    };
    showRig();
    element<HTMLInputElement>("#rig").onchange = showRig;
    handle = mountViewer(
      element("#view"),
      film.scene,
      film.camera,
      (): boolean => {
        try {
          if (transport?.playing) transport.tick();
          if (dirty && state.ready) draw(transport?.seconds ?? 0);
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
          if (transport) transport.seek(seconds);
          else throw new Error("The complete film has not loaded");
        },
      },
    );
    handle.renderer.shadowMap.enabled = true;
    handle.renderer.shadowMap.type = THREE.PCFShadowMap;
    controls = new OrbitControls(film.camera, element("#view"));
    controls.enableDamping = false;
    controls.enabled = false;
    controls.target.copy(film.cameraTarget(start));
    controls.addEventListener("change", (): void => {
      if (controls?.enabled) dirty = true;
    });
    disposeControls = mountFilmControls({
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
    transport = new FilmTransport(film.audio, place, film.available);
    transport.sound = !capture && element<HTMLInputElement>("#sound").checked;
    state.eventCount = film.runtime.audioEvents().length;
    state.ready = true;
    state.stage = "loaded-awaiting-independent-playback-review";
    transport.setInterval(start, end);
    transport.speed = speed;
    for (const selector of ["#play", "#pause", "#seek"])
      element<HTMLButtonElement | HTMLInputElement>(selector).disabled = false;
    element("#status").textContent =
      "The available source interval is loaded. Moving-picture, listening and final decoded export acceptance require actual review.";
    transport.seek(start);
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

/**
 * Await original preparation, then complete the actual placement and draw.
 * Render awaits the same preparation and uses the original transport producer.
 * Seconds are finite and within the film; failures reject and successful
 * completion follows the original draw. Waiting and placement stay separate.
 */
async function seek(seconds: number): Promise<void> {
  const started: number = performance.now();
  try {
    try {
      await bootstrap;
    } finally {
      frameCosts.seekPreparationAwaitMs = performance.now() - started;
    }
    if (capture && controls) {
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
Reflect.set(
  window,
  "__kickboxingView",
  createFilmInspectionView(
    requireProduction,
    draw,
    (): number => requireTransport().seconds,
  ),
);
Reflect.set(window, "__afSeek", seek);
bindFilmMediaInspection(state, (): IFilmProduction | undefined => production);
state.inspect = (): object => ({
  version,
  film: selected.name,
  stage: state.stage,
  ready: state.ready,
  available: state.available,
  runtime: production?.runtime.inspect(),
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
  camera: production
    ? {
        mode: controls?.enabled ? "inspection" : "film",
        position: production.camera.position.toArray(),
        rotation: production.camera.quaternion.toArray(),
        fov: production.camera.fov,
        planned: FilmPlan.camera(transport?.seconds ?? 0),
      }
    : null,
  renderer: handle
    ? {
        frames,
        drawSubmissionMs: drawMs,
        calls: handle.renderer.info.render.calls,
        triangles: handle.renderer.info.render.triangles,
        error:
          producerFailure?.stage === "draw" ? producerFailure.message : null,
      }
    : null,
  producerFailure: structuredClone(producerFailure),
  preparationCosts: { ...preparationCosts },
  frameCosts: {
    ...frameCosts,
    motionBoundary:
      "Film placement includes the runtime's clinical fitting, FK, actor pose, world-matrix updates and the delivered camera; actor costs describe each last apply and are not frame aggregates",
    drawBoundary:
      "CPU renderer submission; GPU completion, pixel readback and encoding are separate Render-owner costs",
  },
  audio: production?.audio.diagnostics() ?? null,
  acceptance: {
    continuousViewing: "not-reviewed",
    listening: "not-reviewed",
    decodedFilm: "not-delivered",
  },
});

window.addEventListener(
  "pagehide",
  (): void => {
    closed = true;
    transport?.pause();
    const errors: unknown[] = [];
    for (const dispose of [
      (): void => production?.dispose(),
      (): void => handle?.stop(),
      (): void => controls?.dispose(),
      (): void => disposeControls?.(),
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
