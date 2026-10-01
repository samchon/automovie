import { TestValidator } from "@nestia/e2e";

import { drawHumanViewerLandmarks } from "../../../scripts/human-viewer/drawHumanViewerLandmarks";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "../../../scripts/human-viewer/serializeHumanViewerAddress";

/**
 * Landmarks are an address field and an overlay in capture pixels.
 *
 * Scenarios:
 * 1. The field defaults off, round-trips on, and refuses any other value.
 * 2. Markers become circles in the capture view box and the overlay shows.
 * 3. No request or no markers empties and hides the overlay.
 */
export const test_human_viewer_landmarks = (): void => {
  TestValidator.equals("default", parseHumanViewerAddress("doc=a").landmarks, false);
  const on = parseHumanViewerAddress("doc=a&landmarks=on");
  TestValidator.equals("on", on.landmarks, true);
  TestValidator.equals("round trip", parseHumanViewerAddress(serializeHumanViewerAddress(on)).landmarks, true);
  TestValidator.equals("off is not serialized", serializeHumanViewerAddress({ ...on, landmarks: false }).includes("landmarks"), false);
  let refused = "";
  try {
    parseHumanViewerAddress("doc=a&landmarks=yes");
  } catch (error) {
    refused = (error as Error).message;
  }
  TestValidator.equals("refusal", refused, "landmarks must be on or off");
  const log: string[] = [];
  const svg = {
    style: { display: "" },
    replaceChildren: () => log.push("clear"),
    setAttribute: (name: string, value: string) => log.push(`svg ${name}=${value}`),
    append: () => log.push("append"),
  };
  const create = () => ({ setAttribute: (name: string, value: string) => log.push(`${name}=${value}`) });
  drawHumanViewerLandmarks(svg, create, { width: 800, height: 400, radius: 2,
    markers: [{ x: 600, y: 150, group: "eye" }] });
  TestValidator.equals("circles", log, ["clear", "svg viewBox=0 0 800 400", "cx=600", "cy=150", "r=2",
    "fill=#00ffff", "data-group=eye", "append"]);
  TestValidator.equals("shown", svg.style.display, "block");
  drawHumanViewerLandmarks(svg, create, null);
  TestValidator.equals("hidden without a request", svg.style.display, "none");
  drawHumanViewerLandmarks(svg, create, { width: 1, height: 1, radius: 1, markers: [] });
  TestValidator.equals("hidden without markers", svg.style.display, "none");
};
