/**
 * Shared input lifecycle for every website building. The existing viewer owns
 * the clock and renderer; frame(elapsed seconds) reports translation only.
 * Clicking captures the mouse for unlimited look. Focused-canvas keyboard and
 * drag look remain usable if capture is refused. Touch pads support simultaneous
 * movement and look. Blur, focus changes, reset, capture loss and disposal clear
 * held inputs so neither a search field nor a restored page keeps flying.
 */
import type * as THREE from "three";

import {
  lookSpectatorCamera,
  moveSpectatorCamera,
  zoomSpectatorCamera,
} from "./spectatorCamera";

export const mountSpectatorControls = (options: {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  reset(): void;
  changed(): void;
  notice(message: string): void;
}): { frame(elapsed: number): boolean; clear(): void; dispose(): void } => {
  const { canvas, camera, target } = options;
  const document = canvas.ownerDocument;
  const window = document.defaultView!;
  const held = new Set<string>();
  const pads = new Map<number, string>();
  const listeners: (() => void)[] = [];
  const listen = <E extends Event>(
    node: EventTarget,
    type: string,
    handler: (event: E) => void,
    settings?: AddEventListenerOptions,
  ): void => {
    const callback = handler as EventListener;
    node.addEventListener(type, callback, settings);
    listeners.push(() => node.removeEventListener(type, callback, settings));
  };
  const locked = (): boolean => document.pointerLockElement === canvas;
  const slow = (): boolean =>
    held.has("ShiftLeft") ||
    held.has("ShiftRight") ||
    [...pads.values()].includes("slow");
  let notice = "";
  const announce = (): void =>
    options.notice(
      `${slow() ? "Slow · 2" : "Free flight · 8"} m/s · ${locked() ? "Mouse look · Esc releases" : notice || "Click to fly · Drag to look"}`,
    );
  let drag: { id: number; x: number; y: number } | null = null;
  let skipClick = false;
  let requesting = false;
  let disposed = false;
  let previous: number | null = null;
  const clear = (): void => {
    held.clear();
    pads.clear();
    drag = null;
    skipClick = false;
    previous = null;
    announce();
  };
  const release = (): void => {
    clear();
    if (locked()) document.exitPointerLock();
  };
  const isForm = (node: EventTarget | null): boolean =>
    node instanceof window.HTMLElement &&
    node.closest("input, textarea, select, button, [contenteditable]") !== null;
  const directions = new Set([
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
  listen<KeyboardEvent>(window, "keydown", (event) => {
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
  listen<KeyboardEvent>(window, "keyup", (event) => {
    held.delete(event.code);
    announce();
  });
  listen<FocusEvent>(window, "focusin", (event) => {
    if (event.target !== canvas) release();
  });
  listen(window, "blur", release);
  listen(document, "visibilitychange", () => {
    if (document.hidden) release();
  });
  listen(document, "pointerlockchange", () => {
    notice = "";
    requesting = false;
    clear();
  });
  const refused = (): void => {
    requesting = false;
    if (disposed) return;
    notice =
      "Mouse capture unavailable · Drag to look, WASD to fly · Click to retry";
    announce();
  };
  listen(document, "pointerlockerror", refused);
  listen<MouseEvent>(canvas, "click", (event) => {
    if (skipClick || (event as PointerEvent).pointerType === "touch") {
      skipClick = false;
      return;
    }
    if (requesting || locked()) return;
    canvas.focus();
    requesting = true;
    try {
      void Promise.resolve(canvas.requestPointerLock())
        .then(() => {
          requesting = false;
          if (disposed && locked()) document.exitPointerLock();
        })
        .catch(refused);
    } catch {
      refused();
    }
  });
  const look = (x: number, y: number): void => {
    lookSpectatorCamera(camera, target, x, y);
    options.changed();
  };
  listen<MouseEvent>(window, "mousemove", (event) => {
    if (locked()) look(event.movementX, event.movementY);
  });
  listen<PointerEvent>(canvas, "pointerdown", (event) => {
    if (locked() || drag !== null || event.button !== 0) return;
    event.preventDefault();
    canvas.focus();
    canvas.setPointerCapture(event.pointerId);
    skipClick = event.pointerType === "touch";
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  listen<PointerEvent>(canvas, "pointermove", (event) => {
    if (drag === null || event.pointerId !== drag.id) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
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
    listen<PointerEvent>(button, "pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pads.set(event.pointerId, button.dataset.flight!);
      announce();
    });
  }
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    listen<PointerEvent>(window, type, (event) => {
      pads.delete(event.pointerId);
      if (drag?.id === event.pointerId) drag = null;
      announce();
    });
  }
  listen<WheelEvent>(
    canvas,
    "wheel",
    (event) => {
      event.preventDefault();
      zoomSpectatorCamera(camera, event.deltaY);
      options.changed();
    },
    { passive: false },
  );
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-flight-reset]",
  ))
    listen(button, "click", () => {
      clear();
      options.reset();
    });
  const axis = (
    positive: string[],
    negative: string[],
    padPositive: string,
    padNegative: string,
  ): number => {
    const values = [...pads.values()];
    return (
      Number(
        positive.some((key) => held.has(key)) || values.includes(padPositive),
      ) -
      Number(
        negative.some((key) => held.has(key)) || values.includes(padNegative),
      )
    );
  };
  announce();
  return {
    clear,
    frame: (elapsed) => {
      if (disposed) return false;
      const seconds = previous === null ? 0 : elapsed - previous;
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
    dispose: () => {
      disposed = true;
      release();
      for (const remove of listeners) remove();
    },
  };
};
