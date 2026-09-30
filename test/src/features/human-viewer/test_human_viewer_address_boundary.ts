import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * Exact protocol limits remain admitted beside their refused neighbours.
 * Scenarios:
 * 1. Both size and opacity bounds and a positive tiny frame radius are admitted.
 * 2. Every existing observation direction and pass and local reference mode is admitted.
 */
export function test_human_viewer_address_boundary(): void {
  TestValidator.equals(
    "minimum",
    parseHumanViewerAddress("size=32&opacity=0").size,
    32,
  );
  TestValidator.equals(
    "maximum",
    parseHumanViewerAddress("size=2048&opacity=1").opacity,
    1,
  );
  TestValidator.predicate(
    "positive radius",
    parseHumanViewerAddress("frame=0,0,0,0.000001").frame !== null,
  );
  for (const view of [
    "front",
    "left-three-quarter",
    "left",
    "back",
    "right-three-quarter",
    "right",
    "top",
    "bottom",
  ] as const)
    TestValidator.equals(
      view,
      parseHumanViewerAddress("view=" + view).view,
      view,
    );
  for (const pass of [
    "beauty",
    "clay",
    "normal",
    "depth",
    "flat",
    "wire",
    "outline",
  ] as const)
    TestValidator.equals(
      pass,
      parseHumanViewerAddress("pass=" + pass).pass,
      pass,
    );
  for (const ref of ["split", "overlay", "swipe"] as const)
    TestValidator.equals(ref, parseHumanViewerAddress("ref=" + ref).ref, ref);
}
