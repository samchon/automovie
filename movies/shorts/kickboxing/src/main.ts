import { createAutoMoviePerformanceOverlay } from "@automovie/render";
import { mountViewer, type IAutoMovieViewerHandle } from "@automovie/viewer";

import type { IFilm } from "./IFilm";
import type { IFilmProduction } from "./IFilmProduction";
import { clampProductionSeconds } from "./clampProductionSeconds";
import { films } from "./composition/films";
import { selectFilm } from "./selectFilm";

const query: URLSearchParams = new URLSearchParams(location.search);
const film: IFilm = selectFilm(films, query.get("film")).film;
const durationSeconds: number = film.durationSeconds;
const status: HTMLOutputElement =
  document.querySelector<HTMLOutputElement>("#clock")!;
const production: IFilmProduction = await film.create(
  (message: string): void => {
    status.value = message;
  },
);
const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
const reviewRequested: boolean =
  query.get("rig") === "1" || query.get("contacts") === "1";
if (reviewRequested && !production.performance)
  throw new Error("This film has no physical review source");
const overlay:
  | ReturnType<typeof createAutoMoviePerformanceOverlay>
  | undefined =
  reviewRequested && production.performance
    ? createAutoMoviePerformanceOverlay(production.performance)
    : undefined;
if (overlay) {
  production.scene.add(overlay.object);
  overlay.show(query.get("rig") === "1", query.get("contacts") === "1");
}
const inspection: IFilmProduction["camera"] | undefined = query.has("view")
  ? production.camera.clone()
  : undefined;
if (inspection) {
  const coordinates: number[][] = query
    .get("view")!
    .split(":")
    .map((part: string): number[] => part.split(",").map(Number));
  if (
    coordinates.length !== 2 ||
    coordinates.some(
      (point: number[]): boolean =>
        point.length !== 3 || !point.every(Number.isFinite),
    )
  )
    throw new Error("Inspection view must be x,y,z:tx,ty,tz in metres");
  inspection.position.set(
    coordinates[0]![0]!,
    coordinates[0]![1]!,
    coordinates[0]![2]!,
  );
  inspection.lookAt(
    coordinates[1]![0]!,
    coordinates[1]![1]!,
    coordinates[1]![2]!,
  );
  inspection.updateProjectionMatrix();
}
const slider: HTMLInputElement =
  document.querySelector<HTMLInputElement>("#seek")!;
const clock: HTMLOutputElement =
  document.querySelector<HTMLOutputElement>("#clock")!;
const capture: boolean = query.get("capture") === "1";
const width: number = Number(query.get("w") ?? 1280);
const height: number = Number(query.get("h") ?? 720);
if (
  ![width, height].every(
    (size: number): boolean => Number.isSafeInteger(size) && size > 0,
  )
)
  throw new Error("Invalid viewer raster");
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
slider.max = String(durationSeconds);
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

/**
 * Draw and publish the exact production clock through the mounted Viewer.
 */
function draw(): void {
  production.seek(seconds);
  if (overlay && production.performance)
    overlay.update(
      production.performance.frame(),
      production.performance.contacts(),
    );
  host.renderer.render(production.scene, inspection ?? production.camera);
  host.completeFrame(seconds);
  slider.value = String(seconds);
  clock.value = `${seconds.toFixed(2)} / ${durationSeconds.toFixed(2)} s`;
  dirty = false;
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
/**
 * The frame cache's digest of an exact second: SHA-256 of the production's
 * own digest text, without moving or drawing the scene.
 */
async function frameDigest(time: number): Promise<string> {
  const text: string = production.digest!(
    clampProductionSeconds(time, durationSeconds),
  );
  const bytes: ArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(bytes), (b: number): string =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
Object.assign(window, {
  __afSeek: seek,
  ...(production.digest ? { __afFrameDigest: frameDigest } : {}),
  __afReport: (): IFilmProduction["report"] => production.report,
});
document.querySelector<HTMLButtonElement>("#play")!.onclick = (): void => {
  if (seconds < start || seconds >= end) seconds = start;
  previous = performance.now();
  playing = true;
};
document.querySelector<HTMLButtonElement>("#pause")!.onclick = (): void => {
  playing = false;
};
slider.oninput = (): void => seek(Number(slider.value));
window.addEventListener(
  "pagehide",
  (): void => {
    try {
      host.stop();
    } finally {
      try {
        overlay?.dispose();
      } finally {
        production.dispose();
      }
    }
  },
  { once: true },
);
draw();
