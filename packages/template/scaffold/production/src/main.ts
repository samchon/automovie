import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionRequest,
  type IAutoMovieViewerHandle,
  applyAutoMovieInspection,
  createAutoMoviePerformanceOverlay,
  mountViewer,
  parseAutoMovieInspectionRequest,
} from "@automovie/viewer";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import type { InspectionView } from "./InspectionView";
import { clampProductionSeconds } from "./clampProductionSeconds";
import { films } from "./composition/films";
import { placeInspectionView } from "./placeInspectionView";
import { planInspectionViews } from "./planInspectionViews";
import { selectFilm } from "./selectFilm";

const query: URLSearchParams = new URLSearchParams(location.search);
const status: HTMLOutputElement =
  document.querySelector<HTMLOutputElement>("#clock")!;
// A refused request stops the page, so its reason is shown where the clock would be. The listener is in place before anything can refuse, an unknown film included.
window.addEventListener("error", (event: ErrorEvent): void => {
  status.value =
    event.error instanceof Error ? event.error.message : event.message;
});
const film: IFilm = selectFilm(films, query.get("film")).film;
const durationSeconds: number = film.durationSeconds;
// What the query alone decides is refused before the film is created, so such a refusal mounts nothing.
const request: IAutoMovieInspectionRequest = parseAutoMovieInspectionRequest(
  (key: string): string | null => query.get(key),
);
const capture: boolean = query.get("capture") === "1";
const width: number = Number(query.get("w") ?? film.width ?? 1280);
const height: number = Number(query.get("h") ?? film.height ?? 720);
if (
  ![width, height].every(
    (size: number): boolean => Number.isSafeInteger(size) && size > 0,
  )
)
  throw new Error("Invalid viewer raster");
const start: number = Number(query.get("start") ?? 0);
const end: number = Number(query.get("end") ?? durationSeconds);
const rate: number = Number(query.get("rate") ?? 1);
if (
  ![start, end, rate].every(Number.isFinite) ||
  start < 0 ||
  end <= start ||
  end > durationSeconds ||
  rate <= 0
)
  throw new Error("Invalid playback interval or rate");
const production: IFilmProduction = await film.create(
  (message: string): void => {
    status.value = message;
  },
);
// What the page holds, in the order acquired. A refusal after this point releases all of it, since nothing more will be drawn, and so does leaving the page.
const held: (() => void)[] = [(): void => production.dispose()];
const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
const reviewRequested: boolean =
  query.get("rig") === "1" || query.get("contacts") === "1";
// The page draws through one view; the capture command draws several side by side.
let views: InspectionView[];
try {
  if (reviewRequested && !production.performance)
    throw new Error("This film has no physical review source");
  views = planInspectionViews(
    query.get("view"),
    Object.keys(production.views ?? {}),
  );
  if (views.length !== 1)
    throw new Error("The Viewer draws through one view at a time");
} catch (error: unknown) {
  release();
  throw error;
}
const view: InspectionView = views[0]!;
const spare: IFilmProduction["camera"] | undefined =
  view.kind === "film" ? undefined : production.camera.clone();
const slider: HTMLInputElement =
  document.querySelector<HTMLInputElement>("#seek")!;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
slider.max = String(durationSeconds);
let seconds: number = start;
let playing: boolean = !capture && query.get("play") === "1";
let previous: number = performance.now();
let dirty: boolean = true;
let frozen: boolean = false;
const host: IAutoMovieViewerHandle = mountViewer(
  canvas,
  production.scene,
  production.camera,
  (): boolean => {
    const now: number = performance.now();
    if (playing && !frozen) {
      seconds = Math.min(end, seconds + ((now - previous) / 1000) * rate);
      dirty = true;
      if (seconds >= end) playing = false;
    }
    previous = now;
    if (dirty) draw();
    return true;
  },
  {
    pixelRatio: 1,
    preserveDrawingBuffer: capture,
    redrawCompleted: (elapsedSeconds: number): void => {
      seconds = clampProductionSeconds(elapsedSeconds, durationSeconds);
      previous = performance.now();
      draw();
    },
    freezeCompleted: (): ((resume: boolean) => void) => {
      frozen = true;
      return (resume: boolean): void => {
        previous = performance.now();
        frozen = false;
        if (!resume) playing = false;
      };
    },
  },
);
held.push((): void => host.stop());

// The inspection is applied to the film's own objects first, so a partial view does not take the review overlay away.
let inspection: IAutoMovieInspectionHandle;
let overlay: ReturnType<typeof createAutoMoviePerformanceOverlay> | undefined;
try {
  inspection = applyAutoMovieInspection({
    scene: production.scene,
    request,
    renderer: host.renderer,
    ...(production.constructions === undefined
      ? {}
      : { constructions: production.constructions }),
  });
  held.push((): void => inspection.restore());
  if (reviewRequested && production.performance) {
    const review: ReturnType<typeof createAutoMoviePerformanceOverlay> =
      createAutoMoviePerformanceOverlay(production.performance);
    held.push((): void => review.dispose());
    production.scene.add(review.object);
    review.show(query.get("rig") === "1", query.get("contacts") === "1");
    overlay = review;
  }
} catch (error: unknown) {
  release();
  throw error;
}
// Each mark colour is listed with the number of marks drawn in it, as the capture command prints it.
const legend: HTMLOutputElement =
  document.querySelector<HTMLOutputElement>("#legend")!;
for (const entry of inspection.legend) {
  const item: HTMLSpanElement = document.createElement("span");
  const swatch: HTMLElement = document.createElement("i");
  swatch.style.background = `#${entry.color.toString(16).padStart(6, "0")}`;
  item.append(swatch, `${entry.label} x${entry.count}`);
  legend.append(item);
}

/**
 * Release everything the page holds, last acquired first, attempting each even when another throws. A second call releases nothing.
 */
function release(): void {
  const step: (() => void) | undefined = held.pop();
  if (step === undefined) return;
  try {
    step();
  } finally {
    release();
  }
}

/**
 * Draw and publish the exact production clock through the mounted Viewer. A second the request cannot draw ends the page as a refused request does: the reason replaces the clock and everything held is released, after which a call draws nothing.
 */
function draw(): void {
  if (held.length === 0) return;
  try {
    production.seek(seconds);
    inspection.update();
    if (overlay && production.performance)
      overlay.update(
        production.performance.frame(),
        production.performance.contacts(),
      );
    // A named view is framed on what this second draws, so the same second always gives the same picture.
    if (spare !== undefined && view.kind !== "film")
      placeInspectionView({
        camera: spare,
        view,
        production,
        seconds,
        aspect: width / height,
        bounds: view.kind === "named" ? inspection.bounds() : null,
      });
    host.renderer.render(production.scene, spare ?? production.camera);
    host.completeFrame(seconds);
    slider.value = String(seconds);
    status.value = `${seconds.toFixed(2)} / ${durationSeconds.toFixed(2)} s`;
    dirty = false;
  } catch (error: unknown) {
    // The reason is written here as well as by the window's listener, since a caller of `__afSeek` receives the error itself.
    status.value = error instanceof Error ? error.message : String(error);
    release();
    throw error;
  }
}

/**
 * Complete an exact-time frame before browser capture reads its pixels.
 */
function seek(time: number): void {
  const target: number = clampProductionSeconds(time, durationSeconds);
  if (!frozen) playing = false;
  seconds = target;
  previous = performance.now();
  draw();
}
Object.assign(window, { __afSeek: seek });
document.querySelector<HTMLButtonElement>("#play")!.onclick = (): void => {
  if (seconds < start || seconds >= end) seconds = start;
  previous = performance.now();
  playing = true;
};
document.querySelector<HTMLButtonElement>("#pause")!.onclick = (): void => {
  playing = false;
};
slider.oninput = (): void => seek(Number(slider.value));
window.addEventListener("pagehide", release, { once: true });
draw();
