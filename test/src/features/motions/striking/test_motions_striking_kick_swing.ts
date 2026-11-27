import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  KickSwing
} from "../../../../../packages/motions/src/striking/internal/KickSwing";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A kick's swing (`KickSwing.shared`, `between`, `turn`, `unit`): the share of
 * a span elapsed, clamped; a leg between two keys, its segments keeping their
 * lengths; a rotation's hinge the short way round; and the time share of a
 * minimum-jerk travel share.
 *
 * Scenarios:
 *
 * 1. Half a second of a second is half; past it all, before it none; any time of a
 *    span of none is all.
 * 2. Between a leg hanging down and one held ahead, the ends are the keys and
 *    halfway both segments stay 0.5 m long.
 * 3. A quarter turn about +Y is a 90 degree hinge about +Y, the same when its
 *    quaternion is negated; no rotation has none.
 * 4. Half the travel takes half the time.
 */
export function test_motions_striking_kick_swing(): void {
  TestValidator.equals(
    "shared",
    [
      KickSwing.shared(0.5, 1),
      KickSwing.shared(2, 1),
      KickSwing.shared(-1, 1),
      KickSwing.shared(0.5, 0),
    ],
    [0.5, 1, 0, 1],
  );
  const down = {
    thigh: { x: 0, y: -0.5, z: 0 },
    shank: { x: 0, y: -0.5, z: 0 },
  };
  const ahead = {
    thigh: { x: 0, y: 0, z: 0.5 },
    shank: { x: 0, y: 0, z: 0.5 },
  };
  const half = KickSwing.between(down, ahead, 0.5);
  TestValidator.predicate(
    "between",
    vclose(KickSwing.between(down, ahead, 0).thigh, down.thigh, 1e-12) &&
      vclose(KickSwing.between(down, ahead, 1).thigh, ahead.thigh, 1e-9) &&
      vclose(KickSwing.between(down, ahead, 1).shank, ahead.shank, 1e-9) &&
      nclose(AutoMovieEngineVector3.length(half.thigh), 0.5, 1e-12) &&
      nclose(AutoMovieEngineVector3.length(half.shank), 0.5, 1e-12),
  );
  const same = (v: IAutoMovieVector3): IAutoMovieVector3 => v;
  const quarter = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const hinge = KickSwing.turn(quarter, same);
  const negated = KickSwing.turn(
    { x: -quarter.x, y: -quarter.y, z: -quarter.z, w: -quarter.w },
    same,
  );
  TestValidator.predicate(
    "the hinge",
    vclose(hinge.axis, { x: 0, y: 1, z: 0 }, 1e-12) &&
      nclose(hinge.degrees, 90, 1e-9) &&
      vclose(negated.axis, { x: 0, y: 1, z: 0 }, 1e-12) &&
      nclose(negated.degrees, 90, 1e-9) &&
      KickSwing.turn({ x: 0, y: 0, z: 0, w: 1 }, same).degrees === 0,
  );
  TestValidator.predicate("the unit", nclose(KickSwing.unit(0.5), 0.5, 1e-9));
}
