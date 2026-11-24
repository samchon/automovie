import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { seatedFlatHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few products, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `seatedFlatHand` lays a seated hand flat by a share, and turns its thumb's
 * metacarpal about its long axis by the body's own flat-thumb turn times the
 * share, so the thumb lies on the thigh with the palm; a body whose thumb needs
 * no turn keeps the flat shape as it is.
 *
 * Scenarios, an upright posture with no joint set:
 *
 * 1. With a 12-degree flat thumb, half way flat, the right thumb is turned 6
 *    degrees past the shape a body with no turn gives, its other two angles
 *    alike.
 * 2. The left hand of that body, whose left thumb needs no turn, matches the
 *    shape.
 */
export function test_unit_motions_everyday_seated_flat_hand(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.5, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const turned: IAutoMovieMotionHumanPosture = seatedFlatHand(
    { flatThumb: { left: 0, right: 12 } },
    posture,
    "right",
    0.5,
  );
  const plain: IAutoMovieMotionHumanPosture = seatedFlatHand(
    { flatThumb: { left: 0, right: 0 } },
    posture,
    "right",
    0.5,
  );
  const a: readonly [number, number, number] =
    turned.joints.rightThumbMetacarpal!;
  const b: readonly [number, number, number] =
    plain.joints.rightThumbMetacarpal!;
  TestValidator.predicate(
    "the turned thumb",
    nclose(a[2], b[2] + 6, ROUNDING) &&
      nclose(a[0], b[0], ROUNDING) &&
      nclose(a[1], b[1], ROUNDING),
  );
  TestValidator.equals(
    "the left hand",
    seatedFlatHand({ flatThumb: { left: 0, right: 12 } }, posture, "left", 0.5),
    seatedFlatHand({ flatThumb: { left: 0, right: 0 } }, posture, "left", 0.5),
  );
}
