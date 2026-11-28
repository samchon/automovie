import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanMaterialContact
} from "../../../../../packages/motions/src/posture/internal/HumanMaterialContact";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check independent floor crossing intervals for tilted soles.
 *
 * Scenarios:
 *
 * 1. A 30-degree roll separates the soles vertically by 20 mm. Only the lower
 *    sole bears, from 0.4 to 0.6 s.
 * 2. Mirror the roll and swap the bearing sole while retaining the two
 *    boundary seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the roll angle, bearing interval and mirrored sole.
 * @evidence contracts/development/testing.md#behavioral-verification The interval search distinguishes the two displayed sole offsets and preserves the analytic crossings when mirrored.
 * @evidence contracts/development/testing.md#independent-expectations The roots of the lower gap `(t - 0.5) ** 2 - 0.01` give the expected interval.
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
      const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, roll),
        { x: 0.02 * side, y: -0.1 / Math.cos(Math.PI / 6), z: 0 },
      );
      return AutoMovieEngineVector3.add(ankle, offset).y;
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
