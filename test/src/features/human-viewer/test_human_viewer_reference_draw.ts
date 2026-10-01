import { TestValidator } from "@nestia/e2e";

import { drawHumanViewerReference } from "../../../scripts/human-viewer/drawHumanViewerReference";
import { layoutHumanViewerReference } from "../../../scripts/human-viewer/layoutHumanViewerReference";

/**
 * The drawing executes a layout layer by layer with isolated alpha and clip.
 *
 * Scenarios:
 * 1. A swipe layout draws the render unclipped at full alpha, then the photo
 *    inside a clip window at its own alpha, each between save and restore.
 * 2. A split layout never clips and hands the named image to each layer.
 * 3. Markers are drawn after every layer, filled cyan, and none draws nothing.
 */
export const test_human_viewer_reference_draw = (): void => {
  const calls: string[] = [];
  const context = {
    globalAlpha: 1,
    fillStyle: "",
    arc: (x: number, y: number, r: number) => calls.push(`arc ${x},${y},${r}`),
    fill: () => calls.push("fill"),
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    beginPath: () => calls.push("begin"),
    rect: (x: number, y: number, w: number, h: number) => calls.push(`rect ${x},${y},${w},${h}`),
    clip: () => calls.push("clip"),
    drawImage: (image: unknown, x: number, y: number, w: number, h: number) =>
      calls.push(`draw ${String(image)} ${context.globalAlpha} ${x},${y},${w},${h}`),
  };
  const images = { render: "R", photo: "P" };
  drawHumanViewerReference(context,
    layoutHumanViewerReference("swipe", 100, 0.5, { width: 100, height: 100 }).layers, images);
  TestValidator.equals("swipe calls", calls, [
    "save", "draw R 1 0,0,100,100", "restore",
    "save", "begin", "rect 50,0,50,100", "clip", "draw P 1 0,0,100,100", "restore",
  ]);
  calls.length = 0;
  drawHumanViewerReference(context,
    layoutHumanViewerReference("split", 50, 0.5, { width: 50, height: 25 }).layers, images);
  TestValidator.equals("split calls", calls, [
    "save", "draw R 1 0,0,50,50", "restore",
    "save", "draw P 1 50,12.5,50,25", "restore",
  ]);
  calls.length = 0;
  drawHumanViewerReference(context, [], images, [{ x: 3, y: 4 }, { x: 5, y: 6 }], 2);
  TestValidator.equals("markers", calls, [
    "begin", "arc 3,4,2", "fill", "begin", "arc 5,6,2", "fill",
  ]);
  TestValidator.equals("marker colour", context.fillStyle, "#00ffff");
};
