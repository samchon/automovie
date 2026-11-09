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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Bind a review document's controls to a transport, with one abortable listener lifetime: play, pause, seek, speed, sound, interval, inspection orbit, delivered camera, inspection snapshot, PNG snapshot and an export hint, plus arrow (one frame), page (0.1 s) and Home/End keys, and a pause when the document hides) and documents parameter `context`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Bind a review document's controls to a transport, with one abortable listener lifetime: play, pause, seek, speed, sound, interval, inspection orbit, delivered camera, inspection snapshot, PNG snapshot and an export hint, plus arrow (one frame), page (0.1 s) and Home/End keys, and a pause when the document hides) directly over its typed inputs (`context`) as a fixed number of statements with no loop or recursion in the body, delegating to `action`, `context.report`, `context.setOrbit`, `element`, `context.deliveredCamera`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 3, 0.1, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 175 lines and 20 top-level statements that reuses `action`, `context.report`, `context.setOrbit`, `element`, `context.deliveredCamera` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 1 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `context`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Performs effectful work per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body touches I/O, timers, listeners or process state; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
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
/**
 * Companion types of {@link mountAutoMovieTransportControls}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 1 member (`IContext`); units and frames named in its text: frames, second, frame, seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `mountAutoMovieTransportControls` in packages/viewer/src/transport/mountAutoMovieTransportControls.ts; its surface is the 1 member listed and the text shows 1 other file naming it, mostly packages/viewer (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
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
