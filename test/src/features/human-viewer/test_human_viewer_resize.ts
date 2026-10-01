import { TestValidator } from "@nestia/e2e";

import { resizeHumanViewerFrame } from "../../../scripts/human-viewer/resizeHumanViewerFrame";

/**
 * Resident cameras receive the current square CSS extent before framing.
 *
 * Scenarios:
 * 1. A previous split view and a smaller subsequent capture are replaced before
 *    the resize observer reads dimensions.
 * 2. Reusing another cached stage repeats the observer with the new size.
 */
export const test_human_viewer_resize = (): void => {
  const display = { style: { width: "1800px", height: "900px" } };
  const canvas = { style: { width: "900px", height: "900px" } };
  const observed: string[][] = [];
  const resize = (): void => {
    observed.push([display.style.width, display.style.height,
      canvas.style.width, canvas.style.height]);
  };
  resizeHumanViewerFrame(320, display, canvas, resize);
  resizeHumanViewerFrame(1000, display, canvas, resize);
  TestValidator.equals("square before observer", observed, [
    ["320px", "320px", "320px", "320px"],
    ["1000px", "1000px", "1000px", "1000px"],
  ]);
};
