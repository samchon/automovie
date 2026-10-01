import { TestValidator } from "@nestia/e2e";

import { layoutHumanViewerReference } from "../../../scripts/human-viewer/layoutHumanViewerReference";

/**
 * A capture that shows a reference photograph composes it by the page's rule.
 *
 * Scenarios:
 * 1. Split doubles the width, keeps the render left, and fits a landscape
 *    photograph into the right cell without cropping, centred vertically.
 * 2. Overlay draws the photograph over the render at one minus the render share.
 * 3. Swipe clips the photograph to the part right of the swipe fraction, and a
 *    portrait photograph is centred horizontally.
 * 4. Non-positive sizes and an opacity outside zero to one refuse.
 */
export const test_human_viewer_reference_layout = (): void => {
  const split = layoutHumanViewerReference("split", 400, 0.5, { width: 800, height: 400 });
  TestValidator.equals("split extent", [split.width, split.height], [800, 400]);
  TestValidator.equals("split layers", split.layers, [
    { source: "render", box: { x: 0, y: 0, w: 400, h: 400 }, alpha: 1, clip: null },
    { source: "photo", box: { x: 400, y: 100, w: 400, h: 200 }, alpha: 1, clip: null },
  ]);
  const overlay = layoutHumanViewerReference("overlay", 300, 0.25, { width: 300, height: 300 });
  TestValidator.equals("overlay extent", [overlay.width, overlay.height], [300, 300]);
  TestValidator.equals("overlay photo", overlay.layers[1], {
    source: "photo", box: { x: 0, y: 0, w: 300, h: 300 }, alpha: 0.75, clip: null,
  });
  const swipe = layoutHumanViewerReference("swipe", 200, 0.4, { width: 100, height: 400 });
  TestValidator.equals("swipe photo", swipe.layers[1], {
    source: "photo", box: { x: 75, y: 0, w: 50, h: 200 }, alpha: 1,
    clip: { x: 80, y: 0, w: 120, h: 200 },
  });
  for (const [size, opacity, width] of [[0, 0.5, 10], [10, 0.5, 0], [10, -0.1, 10], [10, 1.1, 10], [10, NaN, 10]] as const) {
    let refused = false;
    try {
      layoutHumanViewerReference("split", size, opacity, { width, height: 10 });
    } catch {
      refused = true;
    }
    TestValidator.predicate("refuses " + [size, opacity, width].join(","), refused);
  }
  let height = false;
  try {
    layoutHumanViewerReference("split", 10, 0.5, { width: 10, height: 0 });
  } catch {
    height = true;
  }
  TestValidator.predicate("refuses zero height", height);
};
