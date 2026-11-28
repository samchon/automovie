import {
  HumanIceGlide
} from "../../../../../packages/motions/src/carrier/internal/HumanIceGlide";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/** A leg of 0.45 m thigh and 0.42 m shank. */
const LEG = { thigh: 0.45, shank: 0.42 };

/**
 * Check admission of an ice edge and step before the glide is planned.
 *
 * Scenarios:
 *
 * 1. In a two-second glide, admit a 30-degree edge and a step from 0.5 to 1
 *    s, with 0.2 m of offset and 0.05 m of clearance.
 * 2. Change one field at a time to a 120-degree edge, a 3 s end, a 1 m
 *    lateral offset and zero clearance. Each refusal names that field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify the glide interval, step geometry and individual refusal fields.
 * @evidence contracts/development/testing.md#behavioral-verification The admitted fixture and its four variants cover timing, angle, leg reach and clearance.
 * @evidence contracts/development/testing.md#independent-expectations The glide duration and measured 0.87 m leg provide direct boundaries for the authored step fields.
 */
export function test_motions_carrier_human_ice_glide(): void {
  const pivots = { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } };
  const step = {
    side: "left" as const,
    window: { start: 0.5, end: 1 } as const,
    offset: { x: 0.2, z: 0 },
    clearance: 0.05,
  };
  const refused = (
    params: Parameters<typeof HumanIceGlide.admit>[0],
  ): string | undefined => {
    try {
      HumanIceGlide.admit(params, LEG);
    } catch (error: unknown) {
      return error instanceof AutoMovieMotionHumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.equals(
    "the skate",
    [
      refused({ duration: 2, edge: { degrees: 30, pivots }, step }),
      refused({ duration: 2, edge: { degrees: 120, pivots } }),
      refused({
        duration: 2,
        step: { ...step, window: { start: 0.5, end: 3 } },
      }),
      refused({ duration: 2, step: { ...step, offset: { x: 1, z: 0 } } }),
      refused({ duration: 2, step: { ...step, clearance: 0 } }),
    ],
    [
      undefined,
      "edge.degrees",
      "step.window.end",
      "step.offset.x",
      "step.clearance",
    ],
  );
}
