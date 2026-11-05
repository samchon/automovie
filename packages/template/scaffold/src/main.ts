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
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each frame calls the production's seek with the current seconds before rendering, then publishes those seconds to Viewer observers.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Playback and the public seek hook share this one draw path, renderer and camera.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No time or frame is drawn by a separate path.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that it draws and publishes the exact production clock.
 * @evidence contracts/development/implementation.md#efficient-algorithms One seek and one render per frame; cost follows the production's seek and the scene's draw.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The mounted renderer and camera serve every frame.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources It allocates nothing beyond the clock label string; the host and production own the renderer and scene.
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
 * @evidence contracts/development/implementation.md#principled-implementation The requested time passes through clampProductionSeconds and drives the same draw as playback; an ordinary seek pauses playback, while a seek during an owned capture freeze keeps the desired play state for release.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The slider and the exposed __afSeek hook use this one function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Capture uses the same draw as playback rather than a capture-only path.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that the frame is complete before capture reads pixels; nonfinite input throws through the clamp.
 * @evidence contracts/development/implementation.md#efficient-algorithms One clamp and one draw per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Seeks reuse the playback draw path rather than a separate one.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources It updates the module's clock fields only; nothing else is retained.
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
