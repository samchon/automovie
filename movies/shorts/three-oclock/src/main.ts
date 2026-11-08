import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";

import { clampProductionSeconds } from "./clampProductionSeconds";
import { createProduction } from "./createProduction";
import { durationSeconds } from "./durationSeconds";

const production: ReturnType<typeof createProduction> = createProduction();
const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
const slider: HTMLInputElement =
  document.querySelector<HTMLInputElement>("#seek")!;
const clock: HTMLOutputElement =
  document.querySelector<HTMLOutputElement>("#clock")!;
const query: URLSearchParams = new URLSearchParams(location.search);
const capture: boolean = query.get("capture") === "1";
const width: number = Number(query.get("w") ?? 720);
const height: number = Number(query.get("h") ?? 1280);
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
const autoplay: boolean = !capture && query.get("play") === "1";
let playing: boolean = false;
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
 *
 * Completes scene placement and drawing before publishing seconds to observers.
 * Playback and the public seek hook share this renderer and camera.
 */
function draw(): void {
  production.seek(seconds);
  host.renderer.render(production.scene, production.camera);
  host.completeFrame(seconds);
  slider.value = String(seconds);
  clock.value = `${seconds.toFixed(2)} / ${durationSeconds.toFixed(2)} s`;
  dirty = false;
}

/**
 * Complete an exact-time frame before browser capture reads its pixels.
 *
 * Finite clamped seconds drive the same draw as playback. Ordinary seek pauses
 * playback; inspection seeks during a freeze preserve desired play state.
 * Exposed as __afSeek(seconds); rejects nonfinite input and returns after drawing.
 */
function seek(time: number): void {
  const target: number = clampProductionSeconds(time, durationSeconds);
  if (!frozen) playing = false;
  seconds = target;
  previous = performance.now();
  draw();
}
/** Await all physical frame states before normal playback or exact-time export. */
async function prepare(): Promise<void> {
  const status: HTMLElement = document.querySelector<HTMLElement>("#preparation")!;
  status.textContent = "Preparing motion…";
  try {
    await production.prepare((done: number, total: number): void => { status.textContent = `Preparing motion ${done}/${total}`; });
    status.textContent = `Motion draft — ${durationSeconds} s`;
    draw();
  } catch (error: unknown) {
    status.textContent = error instanceof Error ? error.message : String(error);
    throw error;
  }
}
Object.assign(window, { __afSeek: seek, __afPrepare: prepare, __afMotion: (): object => production.scene.userData.motion });
document.querySelector<HTMLButtonElement>("#play")!.onclick = async (): Promise<void> => {
  await prepare();
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
      production.dispose();
    }
  },
  { once: true },
);
draw();
if (autoplay) void prepare().then((): void => { previous = performance.now(); playing = true; });
