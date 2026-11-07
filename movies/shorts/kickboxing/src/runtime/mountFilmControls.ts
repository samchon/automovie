import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { FilmTransport } from "./FilmTransport";

/**
 * Bind the film review controls to the same real transport and capture producer.
 * @evidence contracts/common.md#implementation-and-ownership UI actions call the borrowed actual transport/seek capabilities. One abortable listener lifetime covers buttons, keyboard and visibility changes; inspection-camera edits pause the producer and cannot change delivered camera intent.
 * @evidence contracts/common.md#authoring-interface The host owns current readiness, exact source placement and failure display. This function owns only document listeners and returns their idempotent cleanup. It creates no actor, audio clock, renderer or server.
 */
export function mountFilmControls(
  context: mountFilmControls.Context,
): () => void {
  const {
    capture,
    version,
    controls,
    requireTransport,
    seek,
    filmCamera,
    report,
  }: mountFilmControls.Context = context;
  const aborter: AbortController = new AbortController();
  /** Resolve a current control in this mounted document. */
  function element<T extends HTMLElement>(selector: string): T {
    const found: T | null = context.root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing film control ${selector}`);
    return found;
  }
  element("#play").addEventListener(
    "click",
    (): void => {
      try {
        controls.enabled = false;
        element<HTMLInputElement>("#orbit").checked = false;
        filmCamera(requireTransport().seconds);
        void requireTransport().play().catch(report);
      } catch (error: unknown) {
        report(error);
      }
    },
    { signal: aborter.signal },
  );
  element("#pause").addEventListener(
    "click",
    (): void => {
      try {
        requireTransport().pause();
      } catch (error: unknown) {
        report(error);
      }
    },
    { signal: aborter.signal },
  );
  element("#seek").addEventListener(
    "input",
    (): void => {
      void seek(Number(element<HTMLInputElement>("#seek").value)).catch(report);
    },
    { signal: aborter.signal },
  );
  element("#speed").addEventListener(
    "change",
    (): void => {
      try {
        const clock: FilmTransport = requireTransport();
        const resume: boolean = clock.playing;
        clock.speed = Number(element<HTMLSelectElement>("#speed").value);
        if (resume) void clock.play().catch(report);
      } catch (error: unknown) {
        report(error);
      }
    },
    { signal: aborter.signal },
  );
  element("#sound").addEventListener(
    "change",
    (): void => {
      try {
        const clock: FilmTransport = requireTransport();
        const resume: boolean = clock.playing;
        clock.pause();
        clock.sound = element<HTMLInputElement>("#sound").checked;
        if (resume) void clock.play().catch(report);
      } catch (error: unknown) {
        report(error);
      }
    },
    { signal: aborter.signal },
  );
  element("#interval").addEventListener(
    "click",
    (): void => {
      try {
        requireTransport().setInterval(
          Number(element<HTMLInputElement>("#start").value),
          Number(element<HTMLInputElement>("#end").value),
        );
      } catch (error: unknown) {
        report(error);
      }
    },
    { signal: aborter.signal },
  );
  element("#orbit").addEventListener(
    "change",
    (): void => {
      context.transport()?.pause();
      controls.enabled =
        !capture && element<HTMLInputElement>("#orbit").checked;
      if (!controls.enabled) filmCamera(context.transport()?.seconds ?? 0);
      context.invalidate();
    },
    { signal: aborter.signal },
  );
  element("#film-camera").addEventListener(
    "click",
    (): void => {
      controls.enabled = false;
      element<HTMLInputElement>("#orbit").checked = false;
      filmCamera(context.transport()?.seconds ?? 0);
      context.invalidate();
    },
    { signal: aborter.signal },
  );
  element("#inspect").addEventListener(
    "click",
    (): void => {
      element("#measurements").textContent = JSON.stringify(
        context.inspect(),
        null,
        2,
      );
    },
    { signal: aborter.signal },
  );
  element("#snapshot").addEventListener(
    "click",
    (): void => {
      context.transport()?.pause();
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = element<HTMLCanvasElement>("#view").toDataURL("image/png");
      link.download = `${version}-${(context.transport()?.seconds ?? 0).toFixed(3)}.png`;
      link.click();
    },
    { signal: aborter.signal },
  );
  element("#export").addEventListener(
    "click",
    (): void => {
      context.transport()?.pause();
      element("#status").textContent =
        "Export the same complete source: pnpm --filter kickboxing render <this exact URL> [output]. Export requires all 5400 actual frames, the shared soundtrack and final decoding checks.";
    },
    { signal: aborter.signal },
  );
  document.addEventListener(
    "keydown",
    (event: KeyboardEvent): void => {
      if (
        !context.ready() ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      const clock: FilmTransport = requireTransport();
      const delta: number | undefined = (
        {
          ArrowLeft: -1 / 30,
          ArrowRight: 1 / 30,
          PageDown: -0.1,
          PageUp: 0.1,
        } as Record<string, number>
      )[event.key];
      if (event.key === "Home" || event.key === "End" || delta !== undefined) {
        event.preventDefault();
        void seek(
          event.key === "Home"
            ? clock.interval[0]
            : event.key === "End"
              ? clock.interval[1]
              : Math.max(
                  clock.available[0],
                  Math.min(clock.available[1], clock.seconds + delta!),
                ),
        ).catch(report);
      }
    },
    { signal: aborter.signal },
  );
  document.addEventListener(
    "visibilitychange",
    (): void => {
      if (document.hidden) context.transport()?.pause();
    },
    { signal: aborter.signal },
  );

  return (): void => aborter.abort();
}

/**
 * Narrow borrowed host capabilities keep controls independent of film motion.
 * @evidence contracts/common.md#implementation-and-ownership Context functions read the current same host rather than freezing a stale transport during asynchronous preparation. The controls cannot substitute another actor or frame clock.
 * @evidence contracts/common.md#authoring-interface The host retains every borrowed capability until the returned cleanup is invoked. Readiness and errors remain source facts, not inferred from enabled buttons.
 */
export namespace mountFilmControls {
  /**
   * Explicit document, inspection and current transport capabilities.
   * Supplies only UI responsibilities and the original producer callbacks. Source preparation and motion stay with their existing owners.
   * Times use absolute film seconds. requireTransport refuses unloaded scenes; seek resolves only after the actual original draw completes.
   */
  export interface Context {
    /** This one mounted production document. */
    root: HTMLElement;
    /** Capture permanently uses the delivered camera. */
    capture: boolean;
    /** Stable current immutable build identity. */
    version: string;
    /** Borrowed native inspection camera controls. */
    controls: OrbitControls;
    /** Current actual transport, absent during preparation.
     * Reads the same live host reference rather than retaining a stale pre-preparation clock.
     * Undefined means no loaded transport; the control must not synthesize one.
     */
    transport: () => FilmTransport | undefined;
    /** Original readiness fact.
     * Reads the actual producer's current readiness without inferring success from a button or displayed initial pose.
     * False prevents keyboard action; full preparation and source failures belong to the host.
     */
    ready: () => boolean;
    /** Actual current inspection snapshot.
     * Delegates to the original producer's actual state and diagnostics without computing another pose.
     * Returns diagnostic data only; the control displays it without turning it into acceptance.
     */
    inspect: () => object;
    /** Require the actual loaded clock.
     * The host refuses an absent or unloaded source before any action can evaluate a fallback.
     * Returns a borrowed live transport; ownership and disposal stay with the host.
     */
    requireTransport: () => FilmTransport;
    /** The same original producer used by public capture.
     * Awaits original preparation and completes real source, camera and draw through the same host operation.
     * Seconds are absolute [0,180]; actual source or draw failures reject and retain the previous committed frame.
     */
    seek: (seconds: number) => Promise<void>;
    /** Adopt the shared delivered camera.
     * Resolves the original FilmPlan camera at the supplied same film second instead of exporting a user's inspection view.
     * Finite film seconds select a view; this operation does not advance motion or certify visibility.
     */
    filmCamera: (seconds: number) => void;
    /** Request one actual guide redraw.
     * Invalidates the single existing Viewer producer rather than starting another animation loop.
     * The host draws on its own next frame; invalidation alone publishes no completed observation.
     */
    invalidate: () => void;
    /** Display and retain the exact actual refusal.
     * Routes failures to the same host error path that pauses sound and preserves the last completed scene and clock.
     * Accepts an unknown thrown value; it does not swallow the producer failure into an apparent successful action.
     */
    report: (error: unknown) => void;
  }
}
