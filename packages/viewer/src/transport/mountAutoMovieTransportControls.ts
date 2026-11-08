import type { AutoMovieViewerTransport } from "./AutoMovieViewerTransport.js";

/**
 * Bind a review document's controls to a transport, with one abortable
 * listener lifetime: play, pause, seek, speed, sound, interval, inspection
 * orbit, delivered camera, inspection snapshot, PNG snapshot and an export
 * hint, plus arrow (one frame), page (0.1 s) and Home/End keys, and a pause
 * when the document hides. Elements are found by the ids `#play`, `#pause`,
 * `#seek`, `#speed`, `#sound`, `#start`, `#end`, `#interval`, `#orbit`,
 * `#film-camera`, `#inspect`, `#measurements`, `#snapshot`, `#view`,
 * `#export` and `#status`; a missing one throws. The host keeps readiness,
 * placement and error display.
 *
 * @param context The document and the host's capabilities.
 * @returns An idempotent cleanup.
 */
export function mountAutoMovieTransportControls(
  context: mountAutoMovieTransportControls.IContext,
): () => void {
  const aborter: AbortController = new AbortController();
  const signal: { signal: AbortSignal } = { signal: aborter.signal };
  const element = <T extends HTMLElement>(selector: string): T => {
    const found: T | null = context.root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing review control ${selector}`);
    return found;
  };
  const guard =
    (action: () => void): (() => void) =>
    (): void => {
      try {
        action();
      } catch (error: unknown) {
        context.report(error);
      }
    };
  const delivered = (): void => {
    context.setOrbit(false);
    element<HTMLInputElement>("#orbit").checked = false;
    context.deliveredCamera(context.transport()?.seconds ?? 0);
  };
  const restart = (change: (clock: AutoMovieViewerTransport) => void): void => {
    const clock: AutoMovieViewerTransport = context.requireTransport();
    const resume: boolean = clock.playing;
    clock.pause();
    change(clock);
    if (resume) void clock.play().catch(context.report);
  };
  element("#play").addEventListener(
    "click",
    guard((): void => {
      delivered();
      void context.requireTransport().play().catch(context.report);
    }),
    signal,
  );
  element("#pause").addEventListener(
    "click",
    guard((): void => context.requireTransport().pause()),
    signal,
  );
  element("#seek").addEventListener(
    "input",
    (): void =>
      void context
        .seek(Number(element<HTMLInputElement>("#seek").value))
        .catch(context.report),
    signal,
  );
  element("#speed").addEventListener(
    "change",
    guard((): void =>
      restart((clock: AutoMovieViewerTransport): void => {
        clock.speed = Number(element<HTMLSelectElement>("#speed").value);
      }),
    ),
    signal,
  );
  element("#sound").addEventListener(
    "change",
    guard((): void =>
      restart((clock: AutoMovieViewerTransport): void => {
        clock.sound = element<HTMLInputElement>("#sound").checked;
      }),
    ),
    signal,
  );
  element("#interval").addEventListener(
    "click",
    guard((): void =>
      context
        .requireTransport()
        .setInterval(
          Number(element<HTMLInputElement>("#start").value),
          Number(element<HTMLInputElement>("#end").value),
        ),
    ),
    signal,
  );
  element("#orbit").addEventListener(
    "change",
    (): void => {
      context.transport()?.pause();
      const orbit: boolean =
        !context.capture && element<HTMLInputElement>("#orbit").checked;
      context.setOrbit(orbit);
      if (!orbit) context.deliveredCamera(context.transport()?.seconds ?? 0);
      context.invalidate();
    },
    signal,
  );
  element("#film-camera").addEventListener(
    "click",
    (): void => {
      delivered();
      context.invalidate();
    },
    signal,
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
    signal,
  );
  element("#snapshot").addEventListener(
    "click",
    (): void => {
      context.transport()?.pause();
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = element<HTMLCanvasElement>("#view").toDataURL("image/png");
      link.download = `${context.version}-${(context.transport()?.seconds ?? 0).toFixed(3)}.png`;
      link.click();
    },
    signal,
  );
  element("#export").addEventListener(
    "click",
    (): void => {
      context.transport()?.pause();
      element("#status").textContent = context.exportHint;
    },
    signal,
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
      const clock: AutoMovieViewerTransport = context.requireTransport();
      const step: number | undefined = (
        {
          ArrowLeft: -1 / context.fps,
          ArrowRight: 1 / context.fps,
          PageDown: -0.1,
          PageUp: 0.1,
        } as Record<string, number>
      )[event.key];
      if (event.key !== "Home" && event.key !== "End" && step === undefined)
        return;
      event.preventDefault();
      void context
        .seek(
          event.key === "Home"
            ? clock.interval[0]
            : event.key === "End"
              ? clock.interval[1]
              : Math.max(
                  clock.available[0],
                  Math.min(clock.available[1], clock.seconds + step!),
                ),
        )
        .catch(context.report);
    },
    signal,
  );
  document.addEventListener(
    "visibilitychange",
    (): void => {
      if (document.hidden) context.transport()?.pause();
    },
    signal,
  );
  return (): void => aborter.abort();
}
/** Companion types of {@link mountAutoMovieTransportControls}. */
export namespace mountAutoMovieTransportControls {
  /** The document and the host's borrowed capabilities. */
  export interface IContext {
    /** The mounted review document root. */
    root: HTMLElement;

    /** Whether this is a capture page, which keeps the delivered camera. */
    capture: boolean;

    /** Build identity for snapshot names. */
    version: string;

    /** Frames per second, for one-frame arrow steps. */
    fps: number;

    /** Text the export button shows, such as the export command. */
    exportHint: string;

    /** The live transport, absent while preparing. */
    transport(): AutoMovieViewerTransport | undefined;

    /** The live transport, refusing while preparing. */
    requireTransport(): AutoMovieViewerTransport;

    /** Whether the producer is ready for keyboard review. */
    ready(): boolean;

    /** Diagnostic snapshot for the inspection panel. */
    inspect(): object;

    /** Seek through the host's completed-draw operation. */
    seek(seconds: number): Promise<void>;

    /** Adopt the delivered camera at a second. */
    deliveredCamera(seconds: number): void;

    /** Enable or disable the inspection orbit. */
    setOrbit(enabled: boolean): void;

    /** Request one redraw. */
    invalidate(): void;

    /** Display and keep a refusal. */
    report(error: unknown): void;
  }
}
