/**
 * Retain the latest completed bitmap while the display's own WebGL context is
 * lost. Native context events, rather than elapsed time, own the transition.
 * The original viewport/model/camera remain resident and redraw after Three
 * restores its context. Only this display's image URLs and listeners are owned.
 *
 * @evidence contracts/common.md#principled-implementation A bitmap decoded from a completed display survives context loss; restoration redraws the retained model through its original viewport.
 * @evidence contracts/common.md#clear-and-simple-design One owner pairs native context events with one retained image and explicit disposal.
 * @evidence contracts/common.md#meaningful-documentation States retained resources, native recovery and image lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native context events and decoded completed-display blobs govern retention; restoration redraws the original resident without replacing SDK methods or restarting on an age threshold.
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
}) {
  const retained = document.createElement("img");
  retained.alt = "Last completed display while graphics recover";
  retained.hidden = true;
  retained.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none";
  props.display.append(retained);
  let url: string | undefined;
  let ticket = 0;
  let disposed = false;
  let unavailable = false;
  let pointerEvents = "";
  let release: (() => void) | undefined;
  const align = (): void => {
    if (!props.alignToCanvas || !unavailable) return;
    const rect = props.canvas.getBoundingClientRect();
    retained.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:2;pointer-events:none`;
  };
  const lost = (event: Event): void => {
    event.preventDefault();
    if (!unavailable) pointerEvents = props.canvas.style.pointerEvents;
    unavailable = true;
    release ??= props.freeze?.();
    align();
    retained.hidden = url === undefined;
    props.canvas.style.pointerEvents = "none";
    props.failed(url === undefined ? "The GPU context is lost before a completed bitmap was decoded." :
      "The display GPU context is lost; the last completed screen is retained.");
  };
  const restored = (): void => {
    try {
      props.redraw();
      release?.(); release = undefined;
      unavailable = false;
      retained.hidden = true;
      props.canvas.style.pointerEvents = pointerEvents;
    } catch (cause) {
      props.failed("The restored GPU could not redraw the retained model: " + String(cause));
      return;
    }
    props.recovered?.();
  };
  props.canvas.addEventListener("webglcontextlost", lost);
  props.canvas.addEventListener("webglcontextrestored", restored);
  window.addEventListener("resize", align);
  return {
    retain: (blob: Blob): void => {
      const mine = ++ticket;
      const candidate = new Image();
      const next = URL.createObjectURL(blob);
      candidate.src = next;
      void candidate.decode().then(() => {
        if (disposed || mine !== ticket) { URL.revokeObjectURL(next); return; }
        const previous = url;
        url = next;
        retained.src = next;
        retained.hidden = !unavailable;
        if (previous !== undefined) URL.revokeObjectURL(previous);
      }).catch(() => URL.revokeObjectURL(next));
    },
    dispose: (): void => {
      disposed = true;
      release?.(); release = undefined;
      ++ticket;
      props.canvas.removeEventListener("webglcontextlost", lost);
      props.canvas.removeEventListener("webglcontextrestored", restored);
      window.removeEventListener("resize", align);
      if (url !== undefined) URL.revokeObjectURL(url);
      retained.remove();
    },
  };
}
