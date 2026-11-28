import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMoviePoseState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { bolloOffset } from "../../internal/oracles/bolloOffset";
import { vclose } from "../../internal/vclose";

/** The requested decay time, seconds. */
const DECAY: number = 0.3;

/** Rounding of a rotation round trip through the joint chart, degrees. */
const ANGLE: number = 1e-9;

/** Rounding of the quintic's few products, metres. */
const ROUNDING: number = 1e-12;

/** The displayed pose of a transition for an elapsed time and a target pose. */
type Blend = (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose;

/**
 * `inertializePose` shows the target pose plus the source's offset from it at
 * the cut, decayed on Bollo's quintic (GDC 2018): a joint's rotation offset
 * about its own axis and the root translation per axis.
 *
 * The states are synthetic. Without a rig every joint is a ball joint, so a
 * knee bent 40° at the cut over a target of 10° carries a 30° offset about the
 * flexion axis; at rest its quintic is `3 x0 / 16` at half the decay (`(3 x0 +
 * v0 t1 / 2) / 16` with `v0 = 0`), so the knee shows 10 + 5.625°. The root
 * translation decays per axis with its rate, by the same quintic
 * (`bolloOffset`).
 *
 * Scenarios:
 *
 * 1. At the cut the knee shows the source's 40°; at half the decay 15.625° about
 *    the same axis; from the decay time on exactly the target's angles,
 *    whatever the target pose does then.
 * 2. Equal source and target joints show the target's angles at once.
 * 3. A root 0.2 m off with a rate of 1.5 m/s away from the target starts at the
 *    source's place and slope and reaches the target at the decay time.
 * 4. A root 0.01 m off closing at 24 m/s stops at the target within its clamped
 *    decay, and passes through it when asked to, by the quintic over the whole
 *    decay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the knee's carry from the cut, moving target once settled, zero initial angle offset, and the root's clamp and pass-through variants.
 * @evidence contracts/development/testing.md#behavioral-verification Creates synthetic pose and rate records, builds `inertializePose` continuations, and reads their knee articulation and root position during and after transition.
 * @evidence contracts/development/testing.md#independent-expectations A 30-degree zero-rate knee offset leaves 3/16 of its size halfway through, above a 10-degree target at 15.625 degrees. The root continuation starts 0.2 m away at 1.5 m/s. A scalar Bollo quintic supplies comparisons for the root's carried offset and allowed crossing.
 */
export function test_engine_motion_inertialize_pose(): void {
  const pose: (flexion: number, x: number) => IAutoMoviePose = (
    flexion: number,
    x: number,
  ): IAutoMoviePose => ({
    skeleton: "knee",
    root: {
      translation: { x, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: [{ bone: "leftLowerLeg", flexion, abduction: 0, twist: 0 }],
  });
  const state: (
    flexion: number,
    x: number,
    rate: number,
  ) => IAutoMoviePoseState = (
    flexion: number,
    x: number,
    rate: number,
  ): IAutoMoviePoseState => ({
    pose: pose(flexion, x),
    velocity: {
      joints: new Map(),
      spins: new Map(),
      linear: { x: rate, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    },
  });
  const knee: (shown: IAutoMoviePose) => number[] = (
    shown: IAutoMoviePose,
  ): number[] =>
    shown.joints
      .filter(
        (joint: IAutoMovieJointPose): boolean => joint.bone === "leftLowerLeg",
      )
      .flatMap((joint: IAutoMovieJointPose): number[] => [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ]);
  const bent: (shown: IAutoMoviePose, flexion: number) => boolean = (
    shown: IAutoMoviePose,
    flexion: number,
  ): boolean => {
    const angles: number[] = knee(shown);
    return (
      angles.length === 3 &&
      nclose(angles[0]!, flexion, ANGLE) &&
      nclose(angles[1]!, 0, ANGLE) &&
      nclose(angles[2]!, 0, ANGLE)
    );
  };
  const root: (shown: IAutoMoviePose) => IAutoMovieVector3 = (
    shown: IAutoMoviePose,
  ): IAutoMovieVector3 => shown.root!.translation;

  // 1. The knee's rotation offset.
  const knees: Blend = AutoMovieEngineMotionSampling.inertializePose(state(40, 0, 0), state(10, 0, 0), DECAY);
  TestValidator.predicate(
    "the cut shows the source",
    bent(knees(0, pose(10, 0)), 40),
  );
  TestValidator.predicate(
    "half the decay shows 3/16 of the offset",
    bent(knees(DECAY / 2, pose(10, 0)), 10 + (3 * 30) / 16),
  );
  TestValidator.equals(
    "the decay time shows the target's own angles",
    [knee(knees(DECAY, pose(10, 0))), knee(knees(0.5, pose(0, 0)))],
    [
      [10, 0, 0],
      [0, 0, 0],
    ],
  );

  // 2. No joint offset.
  TestValidator.equals(
    "equal joints show the target at once",
    knee(
      AutoMovieEngineMotionSampling.inertializePose(state(10, 0, 0), state(10, 0, 0), DECAY)(0, pose(25, 0)),
    ),
    [25, 0, 0],
  );

  // 3. The root moving away from its target.
  const away: Blend = AutoMovieEngineMotionSampling.inertializePose(
    state(10, 0.2, 1.5),
    state(10, 0, 0),
    DECAY,
  );
  const h: number = 1e-6;
  TestValidator.predicate(
    "the root starts at the source's place and slope",
    vclose(root(away(0, pose(10, 0))), { x: 0.2, y: 0, z: 0 }, ROUNDING) &&
      nclose((root(away(h, pose(10, 0))).x - 0.2) / h, 1.5, 1e-4),
  );
  TestValidator.predicate(
    "the root decays by the quintic and reaches the target",
    nclose(
      root(away(DECAY / 2, pose(10, 0))).x,
      bolloOffset(0.2, 1.5, DECAY, DECAY / 2),
      ROUNDING,
    ) && root(away(DECAY, pose(10, 0))).x === 0,
  );

  // 4. The root closing on its target.
  const closing: (through: boolean) => number = (through: boolean): number =>
    root(
      AutoMovieEngineMotionSampling.inertializePose(
        state(10, 0.01, -24),
        state(10, 0, 0),
        DECAY,
        through,
      )(0.01, pose(10, 0)),
    ).x;
  TestValidator.predicate(
    "a closing root stops at the target within its clamped decay",
    closing(false) === 0,
  );
  TestValidator.predicate(
    "passing through follows the whole decay",
    nclose(closing(true), bolloOffset(0.01, -24, DECAY, 0.01), ROUNDING) &&
      closing(true) < 0,
  );
}
