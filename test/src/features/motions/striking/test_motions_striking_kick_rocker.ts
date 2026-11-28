import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody, IAutoMovieVector3 } from "@automovie/interface";
import {
  KickRocker
} from "../../../../../packages/motions/src/striking/internal/KickRocker";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Rotation and translation of a sub-metre forefoot socket form fewer than 32
 * binary64 products and sums at metre scale. This bound allows 64 ulps.
 */
const PIVOT_ROUNDING_METRES: number = 64 * Number.EPSILON;

/** Convert a returned unit quaternion to pitch with the forward direction's asin. */
const PITCH_ROUNDING_DEGREES: number = 64 * Number.EPSILON * 180 / Math.PI;

/**
 * Rocking an animated foot preserves its translated toe joint and compensates
 * the foot's pitch at the free toes. A foot with dorsal room only translates.
 *
 * Scenarios:
 *
 * 1. A near-vertical leg with a slightly folded knee retains the flat plant.
 * 2. A distant hip requires the heel to rise. A hand-transformed rest toe
 *    offset lands at the translated hinge, and foot pitch plus toe flexion is
 *    zero. The result uses the left foot's own socket.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains a virtual foot rocker that retains its translated toe hinge and compensates free-toe pitch.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the same foot with upright and distant hip positions and reads the left rig socket.
 * @evidence contracts/development/testing.md#independent-expectations A manually transformed toe offset reconstructs the translated hinge. In the raised case compensating pitch and toe flexion sum to zero.
 */
export async function test_motions_striking_kick_rocker(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const ankle: IAutoMovieVector3 = { x: 0.3, y: 0.2, z: 0.1 };
  const shift: IAutoMovieVector3 = { x: -0.2, y: 0.1, z: 0.3 };
  const adjusted: IAutoMovieVector3 = { x: 0.1, y: 0.3, z: 0.4 };
  const rotation = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30);
  const length: number = body.measure.thigh + body.measure.shank;
  const rocker: KickRocker.Reader = KickRocker(body, "left", {
    ankle,
    rotation,
    knee: { x: 0.3, y: 0.6, z: 0.1 },
  });
  const flat: KickRocker.IRocked = rocker(
    { ...adjusted, y: adjusted.y + 0.999 * length },
    shift,
    39,
  );
  TestValidator.predicate(
    "a flat plant just translates",
    flat.foot.rotation === rotation &&
      vclose(flat.foot.ankle, adjusted, PIVOT_ROUNDING_METRES) && flat.toes === 0,
  );

  const lifted: KickRocker.IRocked = rocker(
    { ...adjusted, y: adjusted.y + 2 * length },
    shift,
    20,
  );
  const hinge: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(body.rest.get("leftToes")!, body.rest.get("leftFoot")!);
  const expected: IAutoMovieVector3 = AutoMovieEngineVector3.add(adjusted, AutoMovieEngineQuaternion.rotateVector(rotation, hinge));
  const actual: IAutoMovieVector3 = AutoMovieEngineVector3.add(lifted.foot.ankle, AutoMovieEngineQuaternion.rotateVector(lifted.foot.rotation, hinge));
  const pointed: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(lifted.foot.rotation, { x: 0, y: 0, z: 1 });
  const pitch: number = Math.atan2(pointed.y, Math.hypot(pointed.x, pointed.z)) * 180 / Math.PI;
  TestValidator.predicate(
    "the rising foot keeps its toe hinge",
    lifted.toes > 0 &&
      lifted.foot.ankle.y > adjusted.y &&
      vclose(actual, expected, PIVOT_ROUNDING_METRES) &&
      nclose(lifted.toes, -pitch, PITCH_ROUNDING_DEGREES),
  );
}
