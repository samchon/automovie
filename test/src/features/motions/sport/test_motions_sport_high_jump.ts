import type { IAutoMovieAffordance, IAutoMovieMotionHumanPropReader, IAutoMovieRigidTransform } from "@automovie/interface";
import { type AthleticsRunUp, highJumpBar } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A high jump's crossbar 2 m up, 4 m long along its +X. */
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

/** A runner's approach along +X taking off from a foot at the origin. */
const approach = (foot: "left" | "right"): AthleticsRunUp.IApproach => ({
  foot,
  speed: 7,
  heading: { x: 1, y: 0, z: 0 },
  ankle: { x: 0, y: 0.08, z: 0 },
  stance: 0.15,
  toeOff: { x: 0.2, y: 0.05, z: 0 },
});

/**
 * The high jump's own logic: the crossbar where the high jump stands at the
 * action's start, and the take-off foot a Fosbury flop requires.
 *
 * Scenarios:
 *
 * 1. A high jump at (3, 0, 5) turned a quarter about +Y, read at the action's 2 s
 *    start, has its bar's centre at (3, 2, 5), its axis along -Z and its 4 m
 *    length.
 * 2. With the bar 0.8 m to the right of a runner heading +X, the left (outside)
 *    foot takes off and the right (inside) one is refused.
 */
export function test_motions_sport_high_jump(): void {
  const asked: number[] = [];
  const reader: IAutoMovieMotionHumanPropReader = {
    prop: {
      subject: "highJump",
      frame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      points: {},
      affordances: [BAR],
    },
    frame: (seconds: number): IAutoMovieRigidTransform => {
      asked.push(seconds);
      return {
        position: { x: 3, y: 0, z: 5 },
        rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      };
    },
  };
  const bar: highJumpBar.IBar = highJumpBar(
    { prop: (): IAutoMovieMotionHumanPropReader => reader, start: 2 },
    "highJump",
  );
  TestValidator.predicate(
    "the placed crossbar",
    vclose(bar.point, { x: 3, y: 2, z: 5 }, 1e-12) &&
      vclose(bar.axis, { x: 0, y: 0, z: -1 }, 1e-12) &&
      bar.length === 4 &&
      asked[0] === 2,
  );
  const side: highJumpBar.IBar = {
    point: { x: 0, y: 2, z: 0.8 },
    axis: { x: 1, y: 0, z: 0 },
    length: 4,
  };
  TestValidator.predicate(
    "the outside foot only",
    !throwsError(() => highJumpBar.admit(side, approach("left"))) &&
      throwsError(() => highJumpBar.admit(side, approach("right"))),
  );
}
