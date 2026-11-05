import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import { PCFShadowMap } from "three";

import { clampProductionSeconds } from "./clampProductionSeconds";
import { createProduction } from "./createProduction";
import { durationSeconds } from "./durationSeconds";

const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#view")!;
const slider: HTMLInputElement = document.querySelector<HTMLInputElement>("#seek")!;
const clock: HTMLOutputElement = document.querySelector<HTMLOutputElement>("#clock")!;
const playButton: HTMLButtonElement = document.querySelector<HTMLButtonElement>("#play")!;
const pauseButton: HTMLButtonElement = document.querySelector<HTMLButtonElement>("#pause")!;
const query: URLSearchParams = new URLSearchParams(location.search);
const capture: boolean = query.get("capture") === "1";
const width: number = Number(query.get("w") ?? 720);
const height: number = Number(query.get("h") ?? 1280);
if (![width, height].every((size: number): boolean => Number.isSafeInteger(size) && size > 0)) throw new Error("Invalid viewer raster");
canvas.width = width;
canvas.height = height;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
clock.value = "Preparing Human actors";
const performanceEnd: number = Number(query.get("performanceEnd") ?? 60);
if (performanceEnd !== 48 && performanceEnd !== 60) throw new Error("Explicit supported performance end required");
const production: ReturnType<typeof createProduction> = createProduction(performanceEnd);
const implementedUntil: number = production.inspect().implementedUntil;
const start: number = Number(query.get("start") ?? 0);
const end: number = Number(query.get("end") ?? implementedUntil);
const rate: number = Number(query.get("rate") ?? 1);
const captureEnd: number = Number(query.get("captureEnd") ?? durationSeconds);
if (![start, end, rate, captureEnd].every(Number.isFinite) || start < 0 || end <= start || end > implementedUntil || rate <= 0 || captureEnd <= 0 || captureEnd > durationSeconds) throw new Error("Invalid playback or capture interval");
slider.max = String(implementedUntil);
let seconds: number = start;
let playing: boolean = false;
let pendingPlay: boolean = !capture && query.get("play") === "1";
let previous: number = performance.now();
let dirty: boolean = false;
let frozen: boolean = false;
let ready: boolean = false;
let preparation: Promise<void> | undefined;
const host: IAutoMovieViewerHandle = mountViewer(canvas, production.scene, production.camera,
  (): boolean => {
    const now: number = performance.now();
    if (ready && playing && !frozen) {
      seconds = Math.min(end, seconds + ((now - previous) / 1000) * rate);
      dirty = true;
      if (seconds >= end) playing = false;
    }
    previous = now;
    if (ready && dirty) draw();
    return true;
  },
  {
    pixelRatio: 1,
    preserveDrawingBuffer: capture,
    redrawCompleted: (elapsedSeconds: number): void => {
      seconds = clampProductionSeconds(elapsedSeconds, implementedUntil);
      previous = performance.now();
      if (ready) draw();
    },
    freezeCompleted: (): ((resume: boolean) => void) => {
      frozen = true;
      return (resume: boolean): void => {
        previous = performance.now();
        frozen = false;
        if (!resume) playing = false;
      };
    },
  });
host.renderer.shadowMap.enabled = true;
host.renderer.shadowMap.type = PCFShadowMap;

/** Publish only completed prepared frames; the export path refuses incomplete or failed scope. */
function draw(): void {
  if (capture && (implementedUntil < captureEnd || !production.inspect().admitted)) throw new Error("Capture refused: requested motion is incomplete or has unresolved frame states");
  production.seek(seconds);
  host.renderer.render(production.scene, production.camera);
  host.completeFrame(seconds);
  slider.value = String(seconds);
  clock.value = `${seconds.toFixed(2)} / ${durationSeconds.toFixed(2)} s${production.inspect().admitted ? "" : " — candidate"}`;
  dirty = false;
}

/** Prepare the fixed-order performance once, before its real-time clock is allowed to run. */
function ensureReady(): Promise<void> {
  preparation ??= production.prepare((completed: number, total: number): void => {
    clock.value = `Preparing motion ${completed}/${total}`;
  }).then((): void => {
    ready = true;
    previous = performance.now();
    draw();
    if (pendingPlay) playing = true;
  });
  return preparation;
}

/** Keep a failed preparation visible and attributable rather than presenting a completed movie. */
function failure(error: unknown): void {
  playing = false;
  clock.value = "Motion preparation failed";
  console.error(error);
}

/** Complete a requested finite-time frame through the same prepared path as playback. */
function seek(time: number): void | Promise<void> {
  const target: number = clampProductionSeconds(time, implementedUntil);
  if (!frozen) playing = false;
  pendingPlay = false;
  if (!ready) return ensureReady().then((): void => { seconds = target; previous = performance.now(); draw(); });
  seconds = target;
  previous = performance.now();
  draw();
}
Object.assign(window, { __afSeek: seek, __afPrepare: ensureReady, __duelInspection: production.inspect, __duelFrame: production.frame });
playButton.onclick = (): void => {
  pendingPlay = true;
  if (seconds < start || seconds >= end) seconds = start;
  if (ready) { previous = performance.now(); playing = true; }
  else void ensureReady().catch(failure);
};
pauseButton.onclick = (): void => { pendingPlay = false; playing = false; };
slider.oninput = (): void => { const result: void | Promise<void> = seek(Number(slider.value)); if (result !== undefined) void result.catch(failure); };
window.addEventListener("pagehide", (): void => { try { host.stop(); } finally { production.dispose(); } }, { once: true });
host.renderer.render(production.scene, production.camera);
clock.value = `Prepare to view 0–${implementedUntil} s of ${durationSeconds} s`;
if (pendingPlay) void ensureReady().catch(failure);
