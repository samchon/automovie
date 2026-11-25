import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { PairWalk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_grappling_pair_walk_legs`. */
namespace ScenarioPairWalkLegs {
  /** A planted foot at an ankle point, at rest. */
  const foot = (x: number): IAutoMovieMotionHumanEntryState.IFoot => ({
    ankle: { x, y: 0.08, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    planted: true,
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    spin: { x: 0, y: 0, z: 0 },
  });

  /**
   * `PairWalk.legs` poses both feet on a walk: a foot before its step stands
   * planted where it was, during it travels on a minimum-jerk share lifted by
   * `PairWalk.LIFT` times `sin(pi u)`, and after it stands planted where it
   * landed; the knee hint is the caller's from the ankle.
   *
   * The left foot steps 0.3 m back over 0 to 1 s; the right does not step.
   *
   * Scenarios:
   *
   * 1. At the start both feet stand planted at their entry ankles.
   * 2. Halfway, the minimum-jerk share is one half: the left ankle is midway and
   *    lifted the whole 0.04 m, not planted.
   * 3. After the step it stands planted where it landed, and the right never moved.
   */
  export function test_unit_motions_grappling_pair_walk_legs(): void {
    const entry: Pick<IAutoMovieMotionHumanEntryState, "feet"> = {
      feet: { left: foot(0.1), right: foot(-0.1) },
    };
    const steps: PairWalk.IStep[] = [
      {
        side: "left",
        from: 0,
        to: 1,
        start: { x: 0.1, y: 0.08, z: 0 },
        end: { x: 0.1, y: 0.08, z: -0.3 },
      },
    ];
    const knee = (ankle: IAutoMovieVector3): IAutoMovieVector3 => ({
      ...ankle,
      y: ankle.y + 0.4,
    });
    const at = (
      seconds: number,
      side: "left" | "right",
    ): IAutoMovieHumanLimbGoal =>
      PairWalk.legs(entry, steps, seconds, knee)[`${side}Leg`]!;

    // 1. At the start.
    TestValidator.predicate(
      "planted at the entry",
      vclose(at(0, "left").point, { x: 0.1, y: 0.08, z: 0 }, 1e-12) &&
        at(0, "left").planted === true,
    );

    // 2. Halfway.
    const half: IAutoMovieHumanLimbGoal = at(0.5, "left");
    TestValidator.predicate(
      "midway and lifted",
      vclose(
        half.point,
        { x: 0.1, y: 0.08 + PairWalk.LIFT, z: -0.15 },
        1e-12,
      ) &&
        half.planted === false &&
        nclose(half.bend!.y, half.point.y + 0.4, 1e-12),
    );

    // 3. After.
    TestValidator.predicate(
      "landed, and the other foot still",
      vclose(at(2, "left").point, { x: 0.1, y: 0.08, z: -0.3 }, 1e-12) &&
        at(2, "left").planted === true &&
        vclose(at(0.5, "right").point, { x: -0.1, y: 0.08, z: 0 }, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_pair_walk_plants`. */
namespace ScenarioPairWalkPlants {
  /**
   * `PairWalk.plants` gives each foot a ground plant over the shares of the
   * action outside its own steps.
   *
   * A 4 s action: the left foot steps over 1 to 2 s, the right does not step.
   *
   * Scenarios:
   *
   * 1. The left foot plants before its step, to 1/4, and after it, from 1/2.
   * 2. The right foot plants the whole action.
   */
  export function test_unit_motions_grappling_pair_walk_plants(): void {
    const window = (
      part: "leftFoot" | "rightFoot",
      from: number,
      to: number,
    ): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind: "plant",
      from,
      to,
      support: { kind: "ground" },
    });
    TestValidator.equals(
      "the plants around the step",
      PairWalk.plants(
        [
          {
            side: "left",
            from: 1,
            to: 2,
            start: { x: 0, y: 0, z: 0 },
            end: { x: 0, y: 0, z: -0.3 },
          },
        ],
        4,
      ),
      [
        window("leftFoot", 0, 0.25),
        window("leftFoot", 0.5, 1),
        window("rightFoot", 0, 1),
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_pair_walk_steps`. */
namespace ScenarioPairWalkSteps {
  /** A planted foot at an ankle point, at rest. */
  const foot = (x: number): IAutoMovieMotionHumanEntryState.IFoot => ({
    ankle: { x, y: 0.08, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    planted: true,
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    spin: { x: 0, y: 0, z: 0 },
  });

  /**
   * `PairWalk.steps` carries both feet a displacement in steps of at most
   * `PairWalk.STEP` (0.3 m), alternating from the left, the last step closing the
   * trailing foot, the window split evenly among the steps.
   *
   * The feet stand 0.2 m apart; the pair walks 0.5 m back (-Z) over 0 to 3 s.
   *
   * Scenarios:
   *
   * 1. 0.5 m needs two strides and a closing step: left, right, left, each 1 s.
   * 2. The left foot goes halfway first, then the right all the way, then the left
   *    closes; each step starts where that foot last landed.
   * 3. No displacement takes no step.
   */
  export function test_unit_motions_grappling_pair_walk_steps(): void {
    const entry: Pick<IAutoMovieMotionHumanEntryState, "feet"> = {
      feet: { left: foot(0.1), right: foot(-0.1) },
    };
    TestValidator.equals(
      "two strides and a closing step",
      PairWalk.steps(entry, { x: 0, y: 0, z: -0.5 }, 0, 3),
      [
        {
          side: "left",
          from: 0,
          to: 1,
          start: { x: 0.1, y: 0.08, z: 0 },
          end: { x: 0.1, y: 0.08, z: -0.25 },
        },
        {
          side: "right",
          from: 1,
          to: 2,
          start: { x: -0.1, y: 0.08, z: 0 },
          end: { x: -0.1, y: 0.08, z: -0.5 },
        },
        {
          side: "left",
          from: 2,
          to: 3,
          start: { x: 0.1, y: 0.08, z: -0.25 },
          end: { x: 0.1, y: 0.08, z: -0.5 },
        },
      ] satisfies PairWalk.IStep[],
    );
    TestValidator.equals(
      "no displacement",
      PairWalk.steps(entry, { x: 0, y: 0, z: 0 }, 0, 3),
      [],
    );
  }
}

/**
 * The `pair_walk` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_grappling_pair_walk(): void {
  ScenarioPairWalkLegs.test_unit_motions_grappling_pair_walk_legs();
  ScenarioPairWalkPlants.test_unit_motions_grappling_pair_walk_plants();
  ScenarioPairWalkSteps.test_unit_motions_grappling_pair_walk_steps();
}
