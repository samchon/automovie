import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { vclose } from "../internal/predicates";
import { spectatorFixture } from "../internal/websiteSpectatorFixture";

/**
 * Focused or mouse-captured flight responds to held physical keys, including slow Shift.
 * Scenarios:
 * 1. Both key families travel on the expected axes; opposite keys cancel.
 * 2. Either Shift gives 2 m/s and releasing it immediately restores 8 m/s.
 * 3. Reset is single-shot; unrelated, modified, handled and form keys preserve browser behavior.
 */
export const test_website_spectator_keyboard = (): void => {
  const f = spectatorFixture();
  TestValidator.predicate(
    "unfocused key ignored",
    !f.key("KeyW").defaultPrevented,
  );
  f.canvas.focus();
  TestValidator.predicate(
    "window-level flight key handled",
    f.key("KeyW", "keydown", {}, f.dom.window).defaultPrevented,
  );
  f.key("KeyW", "keyup", {}, f.dom.window);
  for (const [code, axis] of [
    ["KeyW", [0, 0, -1]],
    ["ArrowUp", [0, 0, -1]],
    ["KeyS", [0, 0, 1]],
    ["ArrowDown", [0, 0, 1]],
    ["KeyA", [-1, 0, 0]],
    ["ArrowLeft", [-1, 0, 0]],
    ["KeyD", [1, 0, 0]],
    ["ArrowRight", [1, 0, 0]],
    ["Space", [0, 1, 0]],
    ["KeyC", [0, -1, 0]],
  ] as const) {
    f.controls.clear();
    f.camera.position.set(0, 0, 0);
    TestValidator.predicate("flight key handled", f.key(code).defaultPrevented);
    f.controls.frame(0);
    f.controls.frame(0.1);
    TestValidator.predicate(
      "hand-calculated direction",
      vclose(f.camera.position, new THREE.Vector3(...axis).multiplyScalar(0.8)),
    );
    f.key(code, "keyup");
    TestValidator.predicate("release stops flight", !f.controls.frame(0.2));
  }
  for (const shift of ["ShiftLeft", "ShiftRight"]) {
    f.controls.clear();
    f.camera.position.set(0, 0, 0);
    f.key("KeyW");
    f.key(shift);
    f.controls.frame(0);
    f.controls.frame(0.1);
    TestValidator.predicate(
      "either Shift slows",
      vclose(f.camera.position, new THREE.Vector3(0, 0, -0.2)),
    );
    TestValidator.predicate(
      "pace announced",
      f.calls.notices.at(-1)!.includes("2 m/s"),
    );
    f.key(shift, "keyup");
    f.controls.frame(0.2);
    TestValidator.predicate(
      "release restores fast pace",
      vclose(f.camera.position, new THREE.Vector3(0, 0, -1)),
    );
  }
  f.controls.clear();
  f.key("KeyW");
  f.key("KeyS");
  f.controls.frame(0);
  TestValidator.predicate("opposite keys cancel", !f.controls.frame(0.1));
  f.key("KeyR");
  f.key("KeyR", "keydown", { repeat: true });
  TestValidator.equals("reset once", f.calls.reset, 1);
  for (const extra of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }])
    TestValidator.predicate(
      "browser shortcut preserved",
      !f.key("KeyR", "keydown", extra).defaultPrevented,
    );
  TestValidator.predicate(
    "unmapped key preserved",
    !f.key("KeyZ").defaultPrevented,
  );
  const prevented = new f.dom.window.KeyboardEvent("keydown", {
    code: "KeyR",
    bubbles: true,
    cancelable: true,
  });
  prevented.preventDefault();
  f.canvas.dispatchEvent(prevented);
  TestValidator.equals("handled reset not repeated", f.calls.reset, 1);
  f.lock(true);
  const input = f.document.querySelector("input")!;
  TestValidator.predicate(
    "form key preserved while locked",
    !f.key("KeyW", "keydown", {}, input).defaultPrevented,
  );
  input.focus();
  TestValidator.equals(
    "search releases capture",
    f.document.pointerLockElement,
    null,
  );
  f.canvas.focus();
  f.key("KeyW");
  f.controls.clear();
  f.controls.frame(0);
  TestValidator.predicate(
    "selected view clears travel",
    !f.controls.frame(0.1),
  );
  f.key("KeyW");
  f.document.querySelector<HTMLButtonElement>("[data-flight-reset]")!.click();
  TestValidator.equals("touch reset available", f.calls.reset, 2);
  f.controls.frame(0.2);
  TestValidator.predicate("reset button clears travel", !f.controls.frame(0.3));
  f.close();
};
