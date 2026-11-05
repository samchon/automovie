import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";

import { createProduction } from "./createProduction";
import { createRigStudy } from "./createRigStudy";
import { durationSeconds } from "./durationSeconds";
import type { IPerformancePreparation } from "./IPerformancePreparation";
import { performanceFrameRate } from "./performanceFrameRate";

/**
 * Mount the real production, its completed clock and owned preparation controls.
 * @evidence contracts/common.md#implementation-and-ownership Validates DOM/raster/query before model acquisition, protects all later initialization and attempts both Viewer and production retirement. Full controller coverage enables labelled review, while the Render consumer separately rejects all numerical failures. Capture, playback and seek draw through one actual renderer and report evaluated frame time. Terminal hooks refuse after disposal.
 * @evidence contracts/common.md#authoring-interface The current production reports its implemented range; an unfinished tail is never a later timestamp. __afWarm serializes matching preparation calls and refuses conflicting seeks/extents until completion. __afSeek renders synchronously, __afInspect reports observations and export hooks copy actual retained data. The returned disposer retires this mount; the pagehide handler uses that same owner.
 */
export function mountProductionHost(): () => void {
  const query: URLSearchParams = new URLSearchParams(location.search);
  const canvas: HTMLCanvasElement | null = document.querySelector<HTMLCanvasElement>("#view");
  const slider: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#seek");
  const clock: HTMLOutputElement | null = document.querySelector<HTMLOutputElement>("#clock");
  const play: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#play");
  const prepare: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#prepare");
  if (!canvas || !slider || !clock || !play || !prepare) throw new Error("Viewer DOM is incomplete");
  const width: number = Number(query.get("w") ?? 720);
  const height: number = Number(query.get("h") ?? 1280);
  const start: number = Number(query.get("start") ?? 0);
  const requestedEnd: number | null = query.has("end") ? Number(query.get("end")) : null;
  const rate: number = Number(query.get("rate") ?? 1);
  if (![width, height].every((size: number): boolean => Number.isSafeInteger(size) && size > 0)
    || ![start, rate, requestedEnd ?? 0].every(Number.isFinite) || start < 0 || start >= durationSeconds || rate <= 0
    || (requestedEnd !== null && (requestedEnd <= start || requestedEnd > durationSeconds)))
    throw new Error("Invalid Viewer raster or playback interval");
  const capture: boolean = query.get("capture") === "1";
  const production: {
    scene: ReturnType<typeof createProduction>["scene"];
    camera: ReturnType<typeof createProduction>["camera"];
    seek: (seconds: number) => number;
    dispose: () => void;
    implementedThrough?: number;
    warm?: (through?: number) => Promise<IPerformancePreparation>;
    exportModels?: () => object;
    exportFrames?: ReturnType<typeof createProduction>["exportFrames"];
  } = query.has("rig") ? createRigStudy() : createProduction();
  let host: IAutoMovieViewerHandle | undefined;
  let retired: boolean = false;
  let retirementFailure: AggregateError | undefined;
  /** Retire both owners once and preserve any failure on subsequent calls. */
  const dispose: () => void = (): void => {
    if (retired) { if (retirementFailure) throw retirementFailure; return; }
    retired = true;
    const errors: unknown[] = [];
    try { host?.stop(); } catch (error: unknown) { errors.push(error); }
    try { production.dispose(); } catch (error: unknown) { errors.push(error); }
    if (errors.length) { retirementFailure = new AggregateError(errors, "Viewer host retirement failed"); throw retirementFailure; }
  };
  try {
    const limit: number = production.implementedThrough ?? 8;
    const end: number = requestedEnd ?? limit;
    if (start >= end || end > limit) throw new Error("Playback interval has not been implemented");
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    production.camera.aspect = width / height; production.camera.updateProjectionMatrix();
    slider.min = String(start); slider.max = String(end);
    let seconds: number = start;
    let playing: boolean = false;
    let previous: number = performance.now();
    let dirty: boolean = true;
    let frozen: boolean = false;
    let ready: boolean = production.warm === undefined;
    let warming: Promise<IPerformancePreparation> | null = null;
    let warmingThrough: number = 0;
    play.disabled = !ready;
    /** Render before publishing the actual evaluated 24fps timestamp. */
    const draw: () => void = (): void => {
      if (retired || !host) throw new Error("Viewer host is not active");
      const evaluated: number = production.seek(seconds);
      host.renderer.render(production.scene, production.camera); host.completeFrame(evaluated);
      slider.value = String(evaluated);
      clock.value = evaluated.toFixed(2) + " / " + durationSeconds.toFixed(2) + " s" + (limit < durationSeconds ? " · implemented 0–" + limit + " s only" : "");
      dirty = false;
    };
    /** Complete an admitted frame, excluding preparation and retirement. */
    const seek: (time: number) => void = (time: number): void => {
      if (retired) throw new Error("Viewer host is retired");
      if (!Number.isFinite(time) || time < 0 || time > limit) throw new Error("Seek outside implemented range");
      if (warming !== null) throw new Error("Preparation owns seek until completion");
      if (!frozen) playing = false;
      seconds = time; previous = performance.now(); draw();
    };
    /** Evaluate the full controller range once; numerical failures allow only labelled review. */
    const warm: (through?: number) => Promise<IPerformancePreparation> = async (through: number = end): Promise<IPerformancePreparation> => {
      if (retired) throw new Error("Viewer host is retired");
      if (!production.warm) return { frames: 0, completeFrames: [], failures: [], structuralFailures: [] };
      if (warming !== null) { if (through !== warmingThrough) throw new Error("Another preparation extent is active"); return warming; }
      warmingThrough = through;
      const saved: number = seconds;
      playing = false; prepare.disabled = true; play.disabled = true; slider.disabled = true;
      warming = production.warm(through);
      try {
        const result: IPerformancePreparation = await warming;
        if (retired) return result;
        const complete: Set<number> = new Set(result.completeFrames);
        const count: number = Math.min(Math.round(end * performanceFrameRate) + 1, durationSeconds * performanceFrameRate);
        ready = result.structuralFailures.length === 0;
        for (let index: number = 0; index < count; index++) if (!complete.has(index)) ready = false;
        play.disabled = !ready;
        prepare.textContent = result.failures.length > 0 ? "Review only: " + result.failures.length + " frame issues" : ready ? "Prepared" : "Preparation incomplete";
        seconds = complete.has(Math.round(saved * performanceFrameRate)) ? saved : (result.completeFrames[0] ?? 0) / performanceFrameRate;
        previous = performance.now(); if (result.completeFrames.length) draw();
        return result;
      } finally { warming = null; if (!retired) { prepare.disabled = false; slider.disabled = false; } }
    };
    host = mountViewer(canvas, production.scene, production.camera, (): boolean => {
      const now: number = performance.now();
      if (playing && !frozen) { seconds = Math.min(end, seconds + ((now - previous) / 1000) * rate); dirty = true; if (seconds >= end) playing = false; }
      previous = now; if (dirty) draw(); return true;
    }, {
      pixelRatio: 1, preserveDrawingBuffer: capture,
      redrawCompleted: (elapsed: number): void => {
        if (warming !== null) throw new Error("Preparation owns redraw until completion");
        seconds = elapsed; previous = performance.now(); draw();
      },
      freezeCompleted: (): ((resume: boolean) => void) => {
        frozen = true;
        return (resume: boolean): void => { previous = performance.now(); frozen = false; if (!resume) playing = false; };
      },
    });
    Object.assign(window, {
      __afSeek: seek, __afWarm: warm, __afDispose: dispose,
      __afInspect: (): object => ({ ...production.scene.userData, retired, reviewReady: ready, preparing: warming !== null }),
      __afExportModels: (): object => production.exportModels?.() ?? {},
      __afExportFrames: (): unknown => production.exportFrames?.() ?? [],
    });
    prepare.onclick = (): void => { void warm().catch((error: unknown): void => { console.error(error); }); };
    play.onclick = (): void => { if (!ready || retired) return; if (seconds < start || seconds >= end) seconds = start; previous = performance.now(); playing = true; };
    document.querySelector<HTMLButtonElement>("#pause")!.onclick = (): void => { playing = false; };
    slider.oninput = (): void => seek(Number(slider.value));
    window.addEventListener("pagehide", dispose, { once: true });
    draw();
    if (!capture && query.get("play") === "1") void warm().then((): void => { if (ready && !retired) play.click(); });
    return dispose;
  } catch (error: unknown) {
    try { dispose(); } catch (cleanup: unknown) { throw new AggregateError([error, cleanup], "Viewer initialization and retirement failed"); }
    throw error;
  }
}
mountProductionHost();
