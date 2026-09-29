import { mountTourUi } from "@automovie/website/tour-ui";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { tourFixture } from "../internal/websiteTourFixture";

/**
 * Keyboard movement belongs to the focusable canvas and leaves browser shortcuts free.
 * Scenarios:
 * 1. Arrows, shifted pan, zoom and reset are handled with prevented defaults.
 * 2. Unknown, modified and already-handled keys keep their normal browser behavior.
 * 3. Missing page controls refuse mounting before listeners are installed.
 */
export const test_website_tour_keyboard = (): void => {
  const f = tourFixture(),
    calls: string[] = [];
  const ui = mountTourUi(f.document, f.data, {
    collapsed: false,
    select: (id) => calls.push(id),
    move: (action, pan) => calls.push(`${action}:${pan}`),
  });
  const canvas = f.element("#view");
  for (const [key, shiftKey] of [
    ["ArrowRight", false],
    ["ArrowUp", true],
    ["+", false],
    ["=", false],
    ["-", false],
    ["R", false],
  ] as const) {
    const event = new f.dom.window.KeyboardEvent("keydown", {
      key,
      shiftKey,
      cancelable: true,
    });
    canvas.dispatchEvent(event);
    TestValidator.predicate("handled canvas key", event.defaultPrevented);
  }
  TestValidator.equals("independent keyboard mapping", calls, [
    "right:false",
    "up:true",
    "in:false",
    "in:false",
    "out:false",
    "outside",
  ]);
  for (const init of [
    { key: "Escape" },
    { key: "ArrowLeft", ctrlKey: true },
    { key: "ArrowDown", metaKey: true },
    { key: "ArrowUp", altKey: true },
  ]) {
    const event = new f.dom.window.KeyboardEvent("keydown", {
      ...init,
      cancelable: true,
    });
    canvas.dispatchEvent(event);
    TestValidator.predicate(
      "browser shortcut preserved",
      !event.defaultPrevented,
    );
  }
  const handled = new f.dom.window.KeyboardEvent("keydown", {
    key: "r",
    cancelable: true,
  });
  handled.preventDefault();
  canvas.dispatchEvent(handled);
  TestValidator.equals("handled event not repeated", calls.length, 6);
  f.element<HTMLButtonElement>("#panel-toggle").click();
  TestValidator.predicate(
    "desktop panel collapses",
    f.element("#tour-panel").hidden === true,
  );
  ui.dispose();
  f.element("#view-search").remove();
  TestValidator.predicate(
    "required page boundary",
    throwsError(() =>
      mountTourUi(f.document, f.data, {
        collapsed: false,
        select: () => {},
        move: () => {},
      }),
    ),
  );
  f.dom.window.close();
};
