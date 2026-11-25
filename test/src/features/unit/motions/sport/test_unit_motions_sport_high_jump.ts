import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import type { AthleticsRunUp } from "@automovie/motions/internal";
import { highJumpBar } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_high_jump_bar`. */
namespace ScenarioHighJumpBar {
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
}

/** The scenarios of `test_unit_motions_sport_high_jump_bar_admit`. */
namespace ScenarioHighJumpBarAdmit {
  /**
   * `highJumpBar.admit` requires the take-off foot to be the one farther from the
   * bar, as a Fosbury flop takes off from the outside foot of its curve.
   *
   * The bar lies along +X, 0.8 m ahead in +Z of an ankle at the origin; the
   * runner runs along +X, so the bar is on the runner's right (the left is -Z for
   * a heading of +X).
   *
   * Scenarios:
   *
   * 1. Taking off from the left foot, the farther one, is admitted.
   * 2. Taking off from the right foot, the nearer one, is refused.
   */
  export function test_unit_motions_sport_high_jump_bar_admit(): void {
    const bar: highJumpBar.IBar = {
      point: { x: 0, y: 2, z: 0.8 },
      axis: { x: 1, y: 0, z: 0 },
      length: 4,
    };
    const approach = (foot: "left" | "right"): AthleticsRunUp.IApproach => ({
      foot,
      speed: 7,
      heading: { x: 1, y: 0, z: 0 },
      ankle: { x: 0, y: 0.08, z: 0 },
      stance: 0.15,
      toeOff: { x: 0.2, y: 0.05, z: 0 },
    });
    TestValidator.predicate(
      "the outside foot only",
      !throwsError(() => highJumpBar.admit(bar, approach("left"))) &&
        throwsError(() => highJumpBar.admit(bar, approach("right"))),
    );
  }
}

/**
 * The `high_jump` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_high_jump(): void {
  ScenarioHighJumpBar.test_unit_motions_sport_high_jump_bar();
  ScenarioHighJumpBarAdmit.test_unit_motions_sport_high_jump_bar_admit();
}
