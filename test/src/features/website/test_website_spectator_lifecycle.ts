import { TestValidator } from "@nestia/e2e";

import { spectatorFixture } from "../internal/websiteSpectatorFixture";

/**
 * Mouse capture failures remain recoverable and leaving the viewer stops motion.
 * Scenarios:
 * 1. Synchronous/asynchronous refusal and browser errors announce drag/keyboard fallback.
 * 2. In-flight capture is requested once; successful capture supports keyboard flight.
 * 3. Escape, blur, hidden document, capture loss and disposal clear held input.
 */
export const test_website_spectator_lifecycle = async (): Promise<void> => {
  const f = spectatorFixture();
  f.request(() => {
    throw new Error("denied");
  });
  f.canvas.click();
  TestValidator.predicate(
    "sync fallback",
    f.calls.notices.at(-1)!.includes("unavailable"),
  );
  f.request(() => Promise.reject(new Error("denied")));
  f.canvas.click();
  await Promise.resolve();
  await Promise.resolve();
  TestValidator.predicate(
    "async fallback",
    f.calls.notices.at(-1)!.includes("unavailable"),
  );
  f.document.dispatchEvent(new f.dom.window.Event("pointerlockerror"));
  TestValidator.predicate(
    "browser capture error",
    f.calls.notices.at(-1)!.includes("retry"),
  );
  let finish!: () => void;
  f.request(
    () =>
      new Promise<undefined>((resolve) => {
        finish = () => resolve(undefined);
      }),
  );
  f.canvas.click();
  f.canvas.click();
  TestValidator.equals("single pending capture", f.calls.request, 3);
  finish();
  await Promise.resolve();
  f.request(() => f.lock(true));
  f.canvas.click();
  const captured = f.calls.request;
  f.canvas.click();
  TestValidator.equals("captured click ignored", f.calls.request, captured);
  for (const exit of ["Escape", "blur", "hidden", "capture", "form"] as const) {
    f.lock(true);
    f.key("KeyW");
    f.controls.frame(0);
    TestValidator.predicate("capture enables flight", f.controls.frame(0.1));
    if (exit === "Escape") f.key("Escape");
    else if (exit === "blur")
      f.dom.window.dispatchEvent(new f.dom.window.Event("blur"));
    else if (exit === "hidden") {
      Object.defineProperty(f.document, "hidden", {
        configurable: true,
        value: false,
      });
      f.document.dispatchEvent(new f.dom.window.Event("visibilitychange"));
      TestValidator.equals(
        "visible retains capture",
        f.document.pointerLockElement,
        f.canvas,
      );
      Object.defineProperty(f.document, "hidden", {
        configurable: true,
        value: true,
      });
      f.document.dispatchEvent(new f.dom.window.Event("visibilitychange"));
    } else if (exit === "capture") f.lock(false);
    else f.document.querySelector<HTMLButtonElement>("#ordinary")!.focus();
    f.controls.frame(0.2);
    TestValidator.predicate("leaving clears travel", !f.controls.frame(0.3));
    TestValidator.equals(
      "capture released",
      f.document.pointerLockElement,
      null,
    );
  }
  f.canvas.focus();
  f.key("KeyW");
  f.controls.dispose();
  TestValidator.predicate("disposed frame does nothing", !f.controls.frame(1));
  const before = f.calls.request;
  f.canvas.click();
  f.key("KeyR");
  TestValidator.equals(
    "listeners removed",
    [f.calls.request, f.calls.reset],
    [before, 0],
  );
  await Promise.resolve();
  f.dom.window.close();
  const pending = spectatorFixture();
  let finishPending!: () => void;
  pending.request(
    () =>
      new Promise<undefined>((resolve) => {
        finishPending = () => resolve(undefined);
      }),
  );
  pending.canvas.click();
  pending.controls.dispose();
  pending.lock(true);
  finishPending();
  await Promise.resolve();
  TestValidator.equals(
    "late capture released after disposal",
    pending.document.pointerLockElement,
    null,
  );
  pending.dom.window.close();
  const rejected = spectatorFixture();
  rejected.request(() => Promise.reject(new Error("late")));
  rejected.canvas.click();
  rejected.controls.dispose();
  const notices = rejected.calls.notices.length;
  await Promise.resolve();
  await Promise.resolve();
  TestValidator.equals(
    "late refusal leaves disposed UI alone",
    rejected.calls.notices.length,
    notices,
  );
  rejected.dom.window.close();
};
