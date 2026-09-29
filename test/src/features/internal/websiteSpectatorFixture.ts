/**
 * In-memory spectator host with independently supplied clock and camera. DOM
 * pointer capture/lock are browser boundaries represented by observable test
 * inputs; no renderer, animation loop, layout or network participates.
 */
import { mountSpectatorControls } from "@automovie/website/spectator-controls";
import { JSDOM } from "jsdom";
import * as THREE from "three";

export const spectatorFixture = () => {
  const dom = new JSDOM(
    `<canvas tabindex="0"></canvas><input><button id="ordinary"></button><button data-flight-reset></button>
    ${["forward", "back", "left", "right", "up", "down", "slow"].map((name) => `<button data-flight="${name}"></button>`).join("")}`,
    { pretendToBeVisual: true },
  );
  const document = dom.window.document;
  const canvas = document.querySelector("canvas")!;
  const camera = new THREE.PerspectiveCamera(45);
  const target = new THREE.Vector3(0, 0, -10);
  const calls = {
    changed: 0,
    reset: 0,
    request: 0,
    exit: 0,
    notices: [] as string[],
  };
  let owner: Element | null = null;
  const lock = (value: boolean): undefined => {
    owner = value ? canvas : null;
    document.dispatchEvent(new dom.window.Event("pointerlockchange"));
    return undefined;
  };
  let request: () => undefined | Promise<undefined> = () => lock(true);
  Object.defineProperty(document, "pointerLockElement", { get: () => owner });
  Object.defineProperty(canvas, "requestPointerLock", {
    value: () => {
      calls.request++;
      return request();
    },
  });
  document.exitPointerLock = () => {
    calls.exit++;
    lock(false);
  };
  for (const element of document.querySelectorAll<HTMLElement>(
    "canvas, button",
  ))
    element.setPointerCapture = () => {};
  const controls = mountSpectatorControls({
    canvas,
    camera,
    target,
    changed: () => {
      calls.changed++;
    },
    reset: () => {
      calls.reset++;
    },
    notice: (message) => calls.notices.push(message),
  });
  const key = (
    code: string,
    type = "keydown",
    extras: KeyboardEventInit = {},
    node: EventTarget = canvas,
  ): KeyboardEvent => {
    const event = new dom.window.KeyboardEvent(type, {
      code,
      bubbles: true,
      cancelable: true,
      ...extras,
    });
    node.dispatchEvent(event);
    return event;
  };
  const pointer = (
    node: EventTarget,
    type: string,
    id = 1,
    x = 0,
    y = 0,
    pointerType = "touch",
    button = 0,
  ): Event => {
    const event = new dom.window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button,
    });
    Object.defineProperties(event, {
      pointerId: { value: id },
      pointerType: { value: pointerType },
    });
    node.dispatchEvent(event);
    return event;
  };
  const pad = (name: string): HTMLButtonElement =>
    document.querySelector(`[data-flight="${name}"]`)!;
  return {
    dom,
    document,
    canvas,
    camera,
    target,
    calls,
    controls,
    key,
    pointer,
    pad,
    lock,
    request: (value: () => undefined | Promise<undefined>) => {
      request = value;
    },
    close: () => {
      controls.dispose();
      dom.window.close();
    },
  };
};
