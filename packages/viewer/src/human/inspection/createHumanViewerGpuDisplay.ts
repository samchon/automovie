import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";

/**
 * Retain the latest completed bitmap while the display's own WebGL context is lost. Native context events, rather than elapsed time, own the transition. The original viewport/model/camera remain resident and redraw after Three restores its context. Only this display's image URLs and listeners are owned. Pending decodes have no independent count cap; disposal revokes their URLs immediately and stale completions cannot republish a disposed display.
 *
 * @evidence contracts/common.md#principled-implementation Native lost/restored events freeze input and redraw the same resident; only the newest successfully decoded bitmap becomes the recovery image.
 * @evidence contracts/common.md#clear-and-simple-design One current URL, decode tickets and pending URL ownership separate visible recovery state from asynchronous candidates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recovery is reported only after original redraw and input release succeed; failed decoding leaves the previous completed bitmap and disposal attempts every owned retirement independently.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies native context authority, borrowed resident state, owned listeners/URLs and uncapped pending decode work.
 * @evidence contracts/performance.md#efficient-algorithms Event bookkeeping is constant time and browser image decoding scales with encoded pixels; disposal traverses the pending URL set once.
 * @evidence contracts/performance.md#reuse-equivalent-work Retention tickets prevent an older decode from replacing a newer requested bitmap; recovery reuses the original resident and camera rather than reconstructing another model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One published URL is retained; pending decode URLs are uncapped while requests overlap, are revoked on settlement or disposal, and listener/input retirement failures are preserved on repeated disposal.
 */
export function createHumanViewerGpuDisplay(props: {
  canvas: HTMLCanvasElement;
  display: HTMLElement;
  redraw: () => void;
  failed: (message: string) => void;
  /** Notify the display owner only after its original redraw and input release succeed. */
  recovered?: () => void;
  /** Align the bitmap with the canvas when the display also contains controls. */
  alignToCanvas?: boolean;
  /** Freeze owned playback/input until an actual restored draw completes. */
  freeze?: () => () => void;
}): { retain: (blob: Blob) => void; dispose: () => void } {
  const retained: HTMLImageElement = document.createElement("img");
  retained.alt = "Last completed display while graphics recover";
  retained.hidden = true;
  retained.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none";
  props.display.append(retained);
  let url: string | undefined;
  const pending: Set<string> = new Set();
  let ticket: number = 0;
  let disposed: boolean = false;
  let disposalFailure: { error: unknown } | undefined;
  let unavailable: boolean = false;
  let pointerEvents: string = "";
  let release: (() => void) | undefined;
  const align: () => void = (): void => {
    if (!props.alignToCanvas || !unavailable) return;
    const rect: DOMRect = props.canvas.getBoundingClientRect();
    retained.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:2;pointer-events:none`;
  };
  const lost: (event: Event) => void = (event: Event): void => {
    event.preventDefault();
    if (!unavailable) pointerEvents = props.canvas.style.pointerEvents;
    unavailable = true;
    release ??= props.freeze?.();
    align();
    retained.hidden = url === undefined;
    props.canvas.style.pointerEvents = "none";
    props.failed(
      url === undefined
        ? "The GPU context is lost before a completed bitmap was decoded."
        : "The display GPU context is lost; the last completed screen is retained.",
    );
  };
  const restored: () => void = (): void => {
    try {
      props.redraw();
      release?.();
      release = undefined;
      unavailable = false;
      retained.hidden = true;
      props.canvas.style.pointerEvents = pointerEvents;
    } catch (cause) {
      props.failed(
        "The restored GPU could not redraw the retained model: " +
          String(cause),
      );
      return;
    }
    props.recovered?.();
  };
  props.canvas.addEventListener("webglcontextlost", lost);
  props.canvas.addEventListener("webglcontextrestored", restored);
  window.addEventListener("resize", align);
  return {
    retain: (blob: Blob): void => {
      if (disposed) return;
      const mine: number = ++ticket;
      const candidate: HTMLImageElement = new Image();
      const next: string = URL.createObjectURL(blob);
      pending.add(next);
      candidate.src = next;
      void Promise.resolve()
        .then((): Promise<void> => candidate.decode())
        .then((): void => {
          pending.delete(next);
          if (disposed || mine !== ticket) {
            URL.revokeObjectURL(next);
            return;
          }
          const previous: string | undefined = url;
          url = next;
          retained.src = next;
          retained.hidden = !unavailable;
          if (previous !== undefined) URL.revokeObjectURL(previous);
        })
        .catch((): void => {
          pending.delete(next);
          if (url !== next) URL.revokeObjectURL(next);
        });
    },
    dispose: (): void => {
      if (disposed) {
        if (disposalFailure !== undefined) throw disposalFailure.error;
        return;
      }
      disposed = true;
      ++ticket;
      const unfreeze: (() => void) | undefined = release;
      const published: string | undefined = url;
      const decoding: string[] = [...pending];
      release = undefined;
      url = undefined;
      pending.clear();
      try {
        reportAutoMovieResourceRetirement([
          (): void => {
            unfreeze?.();
          },
          (): void => {
            if (unavailable) props.canvas.style.pointerEvents = pointerEvents;
          },
          (): void =>
            props.canvas.removeEventListener("webglcontextlost", lost),
          (): void =>
            props.canvas.removeEventListener("webglcontextrestored", restored),
          (): void => window.removeEventListener("resize", align),
          (): void => {
            if (published !== undefined) URL.revokeObjectURL(published);
          },
          ...decoding.map(
            (owned: string): (() => void) =>
              (): void =>
                URL.revokeObjectURL(owned),
          ),
          (): void => retained.remove(),
        ]);
      } catch (error) {
        disposalFailure = { error };
        throw error;
      }
    },
  };
}
