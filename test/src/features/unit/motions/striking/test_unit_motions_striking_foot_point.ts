import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { StrikingFootPoint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";

/** A toe 0.06 m below and 0.15 m ahead of the ankle: its height. */
const TOE = (q: IAutoMovieQuaternion): number =>
  Quaternion.rotateVector(q, { x: 0, y: -0.06, z: 0.15 }).y;

/**
 * A pointed striking foot (`StrikingFootPoint.pointed`, `lift`): the foot
 * pitches 25 degrees a whole bump about its lateral axis, and the ankle rises
 * by as much as that lowers the toe.
 *
 * Scenarios:
 *
 * 1. A whole bump pitches the unturned foot 25 degrees about +X.
 * 2. Pointed, the toe drops from -0.06 to `-0.06 cos 25 - 0.15 sin 25`, and the
 *    ankle at 0.1 m rises by that drop; pointed back up, it stays.
 */
export function test_unit_motions_striking_foot_point(): void {
  const still: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const pointed: IAutoMovieQuaternion = StrikingFootPoint.pointed(still, 1);
  TestValidator.predicate(
    "the pitch",
    StrikingFootPoint.POINT === 25 &&
      qclose(
        pointed,
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 25),
        1e-12,
      ),
  );
  const a: number = (25 * Math.PI) / 180;
  const drop: number = -0.06 - (-0.06 * Math.cos(a) - 0.15 * Math.sin(a));
  const placed = { ankle: { x: 0, y: 0.1, z: 0 }, rotation: still };
  TestValidator.predicate(
    "the lift",
    nclose(
      StrikingFootPoint.lift(placed, pointed, TOE).ankle.y,
      0.1 + drop,
      1e-12,
    ) &&
      nclose(
        StrikingFootPoint.lift({ ...placed, rotation: pointed }, still, TOE)
          .ankle.y,
        0.1,
        1e-12,
      ),
  );
}
