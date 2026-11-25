import { HumanIceGlide, HumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A leg of 0.45 m thigh and 0.42 m shank. */
const LEG = { thigh: 0.45, shank: 0.42 };

/**
 * `HumanIceGlide.admit` admits a skate's own requests before its glide is
 * planned: an edge within 90 degrees either way, and a step whose window opens
 * at or after 0 s and closes within the glide, whose offset lies within the
 * leg's 0.87 m and whose clearance is above 0 and within it.
 *
 * Scenarios, a 2 s glide:
 *
 * 1. A 30 degree edge with a step over 0.5 to 1 s, 0.2 m aside and 0.05 m clear,
 *    is admitted.
 * 2. A 120 degree edge, a window closing at 3 s, an offset 1 m aside and no
 *    clearance are refused on their own axes.
 */
export function test_unit_motions_carrier_human_ice_glide(): void {
  const pivots = { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } };
  const step = {
    side: "left" as const,
    window: [0.5, 1] as const,
    offset: { x: 0.2, y: 0, z: 0 },
    clearance: 0.05,
  };
  const refused = (
    params: Parameters<typeof HumanIceGlide.admit>[0],
  ): string | undefined => {
    try {
      HumanIceGlide.admit(params, LEG);
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.equals(
    "the skate",
    [
      refused({ duration: 2, edge: { degrees: 30, pivots }, step }),
      refused({ duration: 2, edge: { degrees: 120, pivots } }),
      refused({ duration: 2, step: { ...step, window: [0.5, 3] } }),
      refused({ duration: 2, step: { ...step, offset: { x: 1, y: 0, z: 0 } } }),
      refused({ duration: 2, step: { ...step, clearance: 0 } }),
    ],
    [
      undefined,
      "edge.degrees",
      "step.window[1]",
      "step.offset.x",
      "step.clearance",
    ],
  );
}
