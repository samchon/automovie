import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { highJumpBar } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** A high jump's contacts: its crossbar 2 m up, 4 m long along its +X. */
const BAR: IAutoMovieAffordance = {
  id: "bar",
  kind: "bar",
  frame: {
    translation: { x: 0, y: 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
  length: 4,
};

/**
 * `highJumpBar` reads the crossbar where the high jump stands at the action's
 * start: its centre, its axis along the bar affordance's +X and its length.
 *
 * The high jump stands at (3, 0, 5) turned a quarter about +Y at the action's
 * start, 2 s.
 *
 * Scenarios:
 *
 * 1. The bar's centre is (3, 2, 5), its axis the turned +X, -Z, its length 4 m,
 *    read at the action's start.
 * 2. A high jump without a `bar` is refused.
 */
export function test_unit_motions_sport_high_jump_bar(): void {
  const asked: number[] = [];
  const reader = (
    affordances: readonly IAutoMovieAffordance[],
  ): IAutoMovieMotionHumanPropReader => ({
    prop: {
      subject: "highJump",
      frame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      points: {},
      affordances,
    },
    frame: (seconds: number): IAutoMovieRigidTransform => {
      asked.push(seconds);
      return {
        position: { x: 3, y: 0, z: 5 },
        rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      };
    },
  });
  const bar: highJumpBar.IBar = highJumpBar(
    { prop: () => reader([BAR]), start: 2 },
    "highJump",
  );
  TestValidator.predicate(
    "the placed crossbar",
    vclose(bar.point, { x: 3, y: 2, z: 5 }, 1e-12) &&
      vclose(bar.axis, { x: 0, y: 0, z: -1 }, 1e-12) &&
      bar.length === 4 &&
      asked[0] === 2,
  );
  TestValidator.predicate(
    "no bar",
    throwsError(() =>
      highJumpBar({ prop: () => reader([]), start: 2 }, "highJump"),
    ),
  );
}
