/**
 * Shared input lifecycle for every website building. The existing viewer owns the clock and renderer; frame(elapsed seconds) reports translation only. Clicking captures the mouse for unlimited look. Focused-canvas keyboard and drag look remain usable if capture is refused. Touch pads support simultaneous movement and look. Blur, focus changes, reset, capture loss and disposal clear held inputs so neither a search field nor a restored page keeps flying.
 */
import type * as THREE from "three";

import { runWebsiteCleanup } from "./internal/runWebsiteCleanup";
import {
  lookSpectatorCamera,
  moveSpectatorCamera,
  zoomSpectatorCamera,
} from "./spectatorCamera";

/**
 * Attach keyboard, pointer and touch flight controls to the supplied camera and canvas. Disposal retires input authority and attempts state clearing, pointer-lock exit and every listener removal independently; repeated disposal reports a saved failure without retrying effects. A late successful lock request attempts exit after disposal, but explicit pointer-capture release and transactional rollback for every pre-return attachment failure are not implemented. Native release requires browser observation.
 *
 * @evidence contracts/common.md#principled-implementation Native focus, form targets, pointer-lock state and held input facts determine admission; generation-free terminal disposal gates listeners, while the existing camera helpers own finite motion calculations and elapsed-time clamping.
 * @evidence contracts/common.md#clear-and-simple-design One mount owns native input lifetime and calls the shared movement/look/lens owners; reset and redraw remain host callbacks, and no second animation loop is created.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capture refusal retains drag and focused-keyboard input rather than replacing native methods; failed disposal remains reportable, while pointer-capture and partial-attachment cleanup gaps are stated instead of hidden.
 * @evidence contracts/common.md#meaningful-documentation The comments state clock units, focus/reset clearing, capture fallback, terminal callback authority, failure receipts and unresolved native release boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Event coordination is fixed plus current held/pad scans; frame axes create temporary pad arrays and scan active pointers, so per-frame work is O(P + K) in active pointer/key counts rather than scene complexity.
 * @evidence contracts/performance.md#reuse-equivalent-work The mount reuses one held-key set, pointer map, listeners and camera objects; every frame reads current input, and pending pointer-lock requests are suppressed until completion or native lock/error observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Listener count grows with mounted flight buttons, held/pad state with native input identities, and pending lock duration has no timeout; disposal clears local input and attempts lock exit/listener cleanup once, retaining at most one arbitrary failure, but does not explicitly release pointer captures or guarantee native release.
 */
export const mountSpectatorControls: (options: {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  reset(): void;
  changed(): void;
  notice(message: string): void;
}) => {
  frame(elapsed: number): boolean;
  clear(): void;
  dispose(): void;
} = (options: {
  /** Focus and pointer input surface, with its native owning document/window. */
  canvas: HTMLCanvasElement;

  /** Borrowed perspective camera mutated by flight, look and zoom. */
  camera: THREE.PerspectiveCamera;

  /** Borrowed world aim point translated with the eye. */
  target: THREE.Vector3;

  /** Host callback that applies its authored starting view after input clearing. */
  reset(): void;

  /** Host redraw/lighting invalidation after look or lens mutation. */
  changed(): void;

  /** Host status display for current flight/capture state. */
  notice(message: string): void;
}): {
  /** Consume monotone viewer elapsed seconds and report whether translation occurred. */
  frame(elapsed: number): boolean;

  /** Clear held keys, pads, drag and prior frame time; update status. */
  clear(): void;

  /** Retire input authority and attempt owned cleanup once. */
  dispose(): void;
} => {
  const {
    canvas,
    camera,
    target,
  }: {
    canvas: HTMLCanvasElement;
    camera: THREE.PerspectiveCamera;
    target: THREE.Vector3;
    reset(): void;
    changed(): void;
    notice(message: string): void;
  } = options;
  const document: Document = canvas.ownerDocument;
  const window: Window & typeof globalThis = document.defaultView!;
  const held: Set<string> = new Set<string>();
  const pads: Map<number, string> = new Map<number, string>();
  const listeners: (() => void)[] = [];
  const listen: <E extends Event>(
    node: EventTarget,
    type: string,
    handler: (event: E) => void,
    settings?: AddEventListenerOptions,
  ) => void = <E extends Event>(
    node: EventTarget,
    type: string,
    handler: (event: E) => void,
    settings?: AddEventListenerOptions,
  ): void => {
    const callback: EventListener = (event: Event): void => {
      if (!disposed) handler(event as E);
    };
    node.addEventListener(type, callback, settings);
    listeners.push((): void =>
      node.removeEventListener(type, callback, settings),
    );
  };
  const locked: () => boolean = (): boolean =>
    document.pointerLockElement === canvas;
  const slow: () => boolean = (): boolean =>
    held.has("ShiftLeft") ||
    held.has("ShiftRight") ||
    [...pads.values()].includes("slow");
  let notice: string = "";
  const announce: () => void = (): void =>
    options.notice(
      `${slow() ? "Slow · 2" : "Free flight · 8"} m/s · ${locked() ? "Mouse look · Esc releases" : notice || "Click to fly · Drag to look"}`,
    );
  let drag: { id: number; x: number; y: number } | null = null;
  let skipClick: boolean = false;
  let requesting: boolean = false;
  let disposed: boolean = false;
  const disposalFailure: unknown[] = [];
  let previous: number | null = null;
  const clear: () => void = (): void => {
    held.clear();
    pads.clear();
    drag = null;
    skipClick = false;
    previous = null;
    announce();
  };
  const release: () => void = (): void => {
    runWebsiteCleanup([
      clear,
      (): void => {
        if (locked()) document.exitPointerLock();
      },
    ]);
  };
  const isForm: (node: EventTarget | null) => boolean = (
    node: EventTarget | null,
  ): boolean =>
    node instanceof window.HTMLElement &&
    node.closest("input, textarea, select, button, [contenteditable]") !== null;
  const directions: Set<string> = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowLeft",
    "ArrowDown",
    "ArrowRight",
    "Space",
    "KeyC",
    "ShiftLeft",
    "ShiftRight",
  ]);
  listen<KeyboardEvent>(window, "keydown", (event: KeyboardEvent): void => {
    if (event.code === "Escape") {
      release();
      return;
    }
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.metaKey ||
      event.ctrlKey ||
      (!locked() && document.activeElement !== canvas) ||
      isForm(event.target)
    ) {
      clear();
      return;
    }
    if (event.code === "KeyR") {
      if (!event.repeat) {
        clear();
        options.reset();
      }
    } else if (directions.has(event.code)) {
      held.add(event.code);
      announce();
    } else return;
    event.preventDefault();
  });
  listen<KeyboardEvent>(window, "keyup", (event: KeyboardEvent): void => {
    held.delete(event.code);
    announce();
  });
  listen<FocusEvent>(window, "focusin", (event: FocusEvent): void => {
    if (event.target !== canvas) release();
  });
  listen(window, "blur", release);
  listen(document, "visibilitychange", (): void => {
    if (document.hidden) release();
  });
  listen(document, "pointerlockchange", (): void => {
    notice = "";
    requesting = false;
    clear();
  });
  const refused: () => void = (): void => {
    requesting = false;
    if (disposed) return;
    notice =
      "Mouse capture unavailable · Drag to look, WASD to fly · Click to retry";
    announce();
  };
  listen(document, "pointerlockerror", refused);
  listen<MouseEvent>(canvas, "click", (event: MouseEvent): void => {
    if (skipClick || (event as PointerEvent).pointerType === "touch") {
      skipClick = false;
      return;
    }
    if (requesting || locked()) return;
    canvas.focus();
    requesting = true;
    try {
      let requestCompleted: boolean = false;
      void Promise.resolve(canvas.requestPointerLock())
        .then((): void => {
          requestCompleted = true;
          requesting = false;
          if (disposed && locked()) document.exitPointerLock();
        })
        .catch((error: unknown): void => {
          if (!requestCompleted) {
            refused();
            return;
          }
          if (disposed) {
            const failure: unknown =
              disposalFailure.length === 0
                ? error
                : new AggregateError(
                    [disposalFailure[0], error],
                    "Spectator cleanup failed.",
                  );
            disposalFailure.splice(0, disposalFailure.length, failure);
          }
          console.error("Spectator pointer-lock callback failed.", error);
        });
    } catch {
      refused();
    }
  });
  const look: (x: number, y: number) => void = (x: number, y: number): void => {
    lookSpectatorCamera(camera, target, x, y);
    options.changed();
  };
  listen<MouseEvent>(window, "mousemove", (event: MouseEvent): void => {
    if (locked()) look(event.movementX, event.movementY);
  });
  listen<PointerEvent>(canvas, "pointerdown", (event: PointerEvent): void => {
    if (locked() || drag !== null || event.button !== 0) return;
    event.preventDefault();
    canvas.focus();
    canvas.setPointerCapture(event.pointerId);
    skipClick = event.pointerType === "touch";
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  listen<PointerEvent>(canvas, "pointermove", (event: PointerEvent): void => {
    if (drag === null || event.pointerId !== drag.id) return;
    const x: number = event.clientX - drag.x;
    const y: number = event.clientY - drag.y;
    if (x !== 0 || y !== 0) {
      skipClick = true;
      look(x, y);
      drag.x = event.clientX;
      drag.y = event.clientY;
    }
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-flight]",
  )) {
    listen<PointerEvent>(button, "pointerdown", (event: PointerEvent): void => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pads.set(event.pointerId, button.dataset.flight!);
      announce();
    });
  }
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    listen<PointerEvent>(window, type, (event: PointerEvent): void => {
      pads.delete(event.pointerId);
      if (drag?.id === event.pointerId) drag = null;
      announce();
    });
  }
  listen<WheelEvent>(
    canvas,
    "wheel",
    (event: WheelEvent): void => {
      event.preventDefault();
      zoomSpectatorCamera(camera, event.deltaY);
      options.changed();
    },
    { passive: false },
  );
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-flight-reset]",
  ))
    listen(button, "click", (): void => {
      clear();
      options.reset();
    });
  const axis: (
    positive: string[],
    negative: string[],
    padPositive: string,
    padNegative: string,
  ) => number = (
    positive: string[],
    negative: string[],
    padPositive: string,
    padNegative: string,
  ): number => {
    const values: string[] = [...pads.values()];
    return (
      Number(
        positive.some((key: string): boolean => held.has(key)) ||
          values.includes(padPositive),
      ) -
      Number(
        negative.some((key: string): boolean => held.has(key)) ||
          values.includes(padNegative),
      )
    );
  };
  try {
    announce();
  } catch (error) {
    disposed = true;
    runWebsiteCleanup(listeners.splice(0), [error]);
    throw error;
  }
  return {
    clear,
    frame: (elapsed: number): boolean => {
      if (disposed) return false;
      const seconds: number = previous === null ? 0 : elapsed - previous;
      previous = elapsed;
      return moveSpectatorCamera(
        camera,
        target,
        {
          forward: axis(
            ["KeyW", "ArrowUp"],
            ["KeyS", "ArrowDown"],
            "forward",
            "back",
          ),
          right: axis(
            ["KeyD", "ArrowRight"],
            ["KeyA", "ArrowLeft"],
            "right",
            "left",
          ),
          up: axis(["Space"], ["KeyC"], "up", "down"),
        },
        seconds,
        slow(),
      );
    },
    dispose: (): void => {
      if (disposed) {
        if (disposalFailure.length !== 0) throw disposalFailure[0];
        return;
      }
      disposed = true;
      try {
        runWebsiteCleanup([release, ...listeners.splice(0)]);
      } catch (error) {
        disposalFailure.push(error);
        throw error;
      }
    },
  };
};
