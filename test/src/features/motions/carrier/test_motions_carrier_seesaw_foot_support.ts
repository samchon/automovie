import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanMaterialContact } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Two rotated soles independently cross the same floor.
 *
 * Scenarios:
 *
 * 1. A 30-degree roll places the soles 20 mm apart vertically at the same ankle
 *    midpoint. The lower sole reaches the floor first.
 * 2. A mirrored roll swaps the intervals. A later read does not change a
 *    previously reported boundary.
 */
export function test_motions_carrier_seesaw_foot_support(): void {
  const gap =
    (side: -1 | 1, roll: number) =>
    (seconds: number): number => {
      const ankle: IAutoMovieVector3 = {
        x: 0,
        y: 0.1 + (seconds - 0.5) ** 2,
        z: 0,
      };
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, roll),
        { x: 0.02 * side, y: -0.1 / Math.cos(Math.PI / 6), z: 0 },
      );
      return Vector3.add(ankle, offset).y;
    };
  const low: HumanMaterialContact.IInterval[] = HumanMaterialContact.intervals(
    0,
    1,
    gap(-1, 30),
  );
  const high: HumanMaterialContact.IInterval[] = HumanMaterialContact.intervals(
    0,
    1,
    gap(1, 30),
  );
  const reverse: HumanMaterialContact.IInterval[] =
    HumanMaterialContact.intervals(0, 1, gap(1, -30));
  TestValidator.predicate(
    "only the lower sole bears on the exact analytic interval",
    low.length === 1 &&
      high.length === 0 &&
      nclose(low[0]!.from, 0.4, 1e-6) &&
      nclose(low[0]!.to, 0.6, 1e-6),
  );
  TestValidator.predicate(
    "mirroring the rotation swaps the sole without changing the boundaries",
    reverse.length === 1 &&
      reverse[0]!.from === low[0]!.from &&
      reverse[0]!.to === low[0]!.to,
  );
}
