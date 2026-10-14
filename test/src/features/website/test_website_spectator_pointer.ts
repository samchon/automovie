import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";
import { websiteSpectatorFixture as spectatorFixture } from "../internal/websiteSpectatorFixture";

/**
 * Touch and drag use the same eye motion and allow look while a direction is held.
 * Scenarios:
 * 1. Touch translation, height and slow controls use 8/2 m/s; release/cancel stops them.
 * 2. Only the active primary drag turns the camera; a drag does not request capture.
 * 3. Wheel changes the lens and pointer capture loss clears its matching hold.
 *
 * @evidence contracts/testing.md#behavioral-verification Dispatches touch, drag, wheel and mouse events through mounted controls, observing directional displacement, slow pace, matching-pointer ownership, capture-request counts, look callbacks and stopped holds; secondary-pointer steering, touch locking or sticky movement fails.
 * @evidence contracts/testing.md#independent-expectations Authored pad vectors use the public 8/2-meter-per-second speeds over 0.1 seconds, log(2) wheel input predicts a doubled lens, and callback counts discriminate ignored versus admitted events; the simultaneous-look case checks only displacement sign, not its full trajectory.
 * @evidence contracts/testing.md#distinguishing-cases Covers cardinal pads, simultaneous slow/forward holds, cancel/capture loss, secondary buttons, unmatched and stationary drags, touch clicks, mouse drags, wheel zoom and lock loss; key admission and capture promises have separate spectator units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_spectator_pointer entry owns these cases, but spectatorFixture replaces foreign pointer-capture/lock methods and document lock state. This unresolved fixture violation prevents compliant native-input verification; callback and synthetic-event observations do not prove native capture or rendered motion.
 */
export function test_website_spectator_pointer(): void {
  const f: ReturnType<typeof spectatorFixture> = spectatorFixture();
  for (const [name, xyz] of [
    ["forward", [0, 0, -0.8]],
    ["back", [0, 0, 0.8]],
    ["left", [-0.8, 0, 0]],
    ["right", [0.8, 0, 0]],
    ["up", [0, 0.8, 0]],
    ["down", [0, -0.8, 0]],
  ] as const) {
    f.controls.clear();
    f.camera.position.set(0, 0, 0);
    f.pointer(f.pad(name), "pointerdown");
    f.controls.frame(0);
    f.controls.frame(0.1);
    TestValidator.predicate(
      "touch axis",
      vclose(f.camera.position, new THREE.Vector3(...xyz)),
    );
    f.pointer(f.dom.window, "pointerup");
    TestValidator.predicate("touch release stops", !f.controls.frame(0.2));
  }
  f.controls.clear();
  f.camera.position.set(0, 0, 0);
  f.pointer(f.pad("forward"), "pointerdown", 1);
  f.pointer(f.pad("slow"), "pointerdown", 2);
  f.controls.frame(0);
  f.controls.frame(0.1);
  TestValidator.predicate(
    "touch Slow",
    vclose(f.camera.position, new THREE.Vector3(0, 0, -0.2)),
  );
  f.pointer(f.dom.window, "pointercancel", 1);
  f.pointer(f.dom.window, "lostpointercapture", 2);
  TestValidator.predicate("cancel clears holds", !f.controls.frame(0.2));
  f.pointer(f.pad("forward"), "pointerdown", 3, 0, 0, "mouse", 2);
  TestValidator.predicate("secondary button ignored", !f.controls.frame(0.3));
  f.pointer(f.canvas, "pointermove", 1, 100, 20);
  f.pointer(f.canvas, "pointerdown", 1, 0, 0, "touch", 2);
  TestValidator.equals("idle and secondary drag ignored", f.calls.changed, 0);
  f.pointer(f.canvas, "pointerdown", 1);
  f.pointer(f.canvas, "pointerdown", 2);
  f.pointer(f.canvas, "pointermove", 2, 100, 20);
  f.pointer(f.canvas, "pointermove", 1);
  TestValidator.equals(
    "other pointer and zero delta ignored",
    f.calls.changed,
    0,
  );
  f.pointer(f.pad("forward"), "pointerdown", 2);
  f.pointer(f.canvas, "pointermove", 1, 40, 0);
  TestValidator.equals("drag looks", f.calls.changed, 1);
  f.controls.frame(0.4);
  f.controls.frame(0.5);
  TestValidator.predicate(
    "look and movement simultaneous",
    f.camera.position.x > 0,
  );
  f.pointer(f.canvas, "pointerup", 1);
  f.canvas.click();
  TestValidator.equals("touch click never locks", f.calls.request, 0);
  f.controls.clear();
  f.pointer(f.canvas, "click", 1);
  TestValidator.equals(
    "touch click without drag never locks",
    f.calls.request,
    0,
  );
  f.pointer(f.canvas, "pointerdown", 1, 0, 0, "mouse");
  f.pointer(f.canvas, "pointermove", 1, 40, 0, "mouse");
  f.pointer(f.canvas, "pointerup", 1, 40, 0, "mouse");
  f.canvas.click();
  TestValidator.equals("mouse drag avoids capture", f.calls.request, 0);
  const wheel: WheelEvent = new f.dom.window.WheelEvent("wheel", {
    deltaY: Math.log(2) * 1000,
    cancelable: true,
  });
  f.canvas.dispatchEvent(wheel);
  TestValidator.predicate(
    "wheel lens",
    wheel.defaultPrevented && nclose(f.camera.fov, 90),
  );
  f.lock(true);
  f.pointer(f.canvas, "pointerdown", 8);
  const mouse: MouseEvent = new f.dom.window.MouseEvent("mousemove");
  Object.defineProperties(mouse, {
    movementX: { value: 20 },
    movementY: { value: -10 },
  });
  const before: number = f.calls.changed;
  f.dom.window.dispatchEvent(mouse);
  TestValidator.equals("captured mouse looks", f.calls.changed, before + 1);
  f.lock(false);
  f.dom.window.dispatchEvent(mouse);
  TestValidator.equals("uncaptured mouse ignored", f.calls.changed, before + 1);
  f.pointer(f.canvas, "pointerdown", 9);
  f.controls.clear();
  f.canvas.click();
  TestValidator.equals(
    "cleared drag permits a fresh capture",
    f.calls.request,
    1,
  );
  f.close();
}
