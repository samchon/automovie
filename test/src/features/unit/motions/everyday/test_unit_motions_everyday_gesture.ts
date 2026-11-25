import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanHand,
  HumanRefusal,
  gesture,
  gestureAdmit,
  gestureHands,
  gestureJoints,
  gestureSignal,
  gestureStrokeTables,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

namespace part_gesture_admit {
  /**
   * `gestureAdmit` admits a gesture's counts and the hands it moves: its strokes
   * (the parameter or the kind's rhythm, a whole count), its hold (none or more),
   * a bow's depth (above 0, up to `gesture.DEEPEST_BOW`), a point's target and an
   * aim's shape, and the sides its kind moves: both, the authored hand (the right
   * when unstated), or none.
   *
   * Scenarios:
   *
   * 1. A wave with no count takes its rhythm's cycles and the right hand; one with
   *    the left hand and 2.6 strokes takes the left hand and 3, the count
   *    rounded; a clap takes both hands; a nod none.
   * 2. A bow takes `gesture.BOW` unless a depth is given.
   * 3. A count rounding to 0 (0.4), a negative hold, a bow past the deepest, a point
   *    with no target and an aim with no shape are refused on `count`, `hold`,
   *    `depth`, `target` and `aim`.
   */
  export function run(): void {
    const admit: (
      p: IAutoMovieMotionHumanGesture.IParams,
    ) => gestureAdmit.IAdmitted = (
      p: IAutoMovieMotionHumanGesture.IParams,
    ): gestureAdmit.IAdmitted =>
      gestureAdmit(p, gestureStrokeTables.RHYTHM[p.kind]);
    TestValidator.equals(
      "the hands",
      [
        admit({ kind: "wave" }),
        admit({ kind: "wave", hand: "left", count: 3 }).sides,
        admit({ kind: "wave", hand: "left", count: 2.6 }).cycles,
        admit({ kind: "clap" }).sides,
        admit({ kind: "nod" }).sides,
      ],
      [
        {
          cycles: gestureStrokeTables.RHYTHM.wave.cycles,
          hold: 0,
          depth: gesture.BOW,
          sides: ["right"],
        },
        ["left"],
        3,
        ["left", "right"],
        [],
      ],
    );
    TestValidator.equals(
      "the bow",
      [admit({ kind: "bow" }).depth, admit({ kind: "bow", depth: 20 }).depth],
      [gesture.BOW, 20],
    );
    const refused: (p: IAutoMovieMotionHumanGesture.IParams) => string = (
      p: IAutoMovieMotionHumanGesture.IParams,
    ): string => {
      try {
        admit(p);
      } catch (error: unknown) {
        if (error instanceof HumanRefusal) return error.axis;
      }
      return "admitted";
    };
    TestValidator.equals(
      "refusals",
      [
        refused({ kind: "wave", count: 0.4 }),
        refused({ kind: "wave", hold: -1 }),
        refused({ kind: "bow", depth: gesture.DEEPEST_BOW + 1 }),
        refused({ kind: "point" }),
        refused({ kind: "wave", aim: { digit: "thumb", toward: "up" } }),
      ],
      ["count", "hold", "depth", "target", "aim"],
    );
  }
}

namespace part_gesture_hands {
  /**
   * `gestureHands.prepare` readies one gesture hand on its stroke's surface and
   * shape. Its fingers go from the posture's own angles (the relaxed cascade's
   * flexion where it holds none) to the stroke's shape by the transport's share,
   * `own + (shape + curl - own) e` in flexion, `own + (shape - own) e` in spread
   * and `own (1 - e)` in twist, the extra curl on every digit but the thumb; a
   * goal on another surface or shape reads as a hand prepared on that one.
   *
   * The body is built whole (`humanFixtureBody`): the hand request reads the
   * rig's hand offsets.
   *
   * Scenarios, the right hand of a wave prepared on a flat palm:
   *
   * 1. At share 0 with no finger of its own each digit holds the relaxed flexion, no
   *    spread and no twist.
   * 2. At share 1 with a 10 degree curl each digit takes the flat shape, the fingers
   *    flexed 10 more.
   * 3. A digit held at (5, 2, 8) reads, at share 0.5, halfway to the flat shape and
   *    half its twist.
   * 4. A fist goal on the flat-palm hand reads as on a hand prepared on the fist.
   */
  export async function run(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const p: Pick<
      IAutoMovieMotionHumanGesture.IParams,
      "turn" | "shape" | "aim"
    > = {};
    const flat: gestureHands.IPrepared = gestureHands.prepare(
      body,
      "right",
      p,
      undefined,
      0,
      { surface: "palm", shape: "flat" },
    );
    const shape: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      "right",
      "flat",
    );
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      "right",
      "relaxed",
    );
    const bones: AutoMovieHumanoidBone[] = Object.keys(
      shape,
    ) as AutoMovieHumanoidBone[];
    const start: IAutoMovieMotionHumanPosture["joints"] = flat.fingers(
      { shape: "flat", curl: 10 },
      0,
    );
    TestValidator.predicate(
      "at rest",
      bones.every((bone: AutoMovieHumanoidBone): boolean => {
        const j = start[bone]!;
        return j[0] === relaxed[bone]![0] && j[1] === 0 && j[2] === 0;
      }),
    );
    const stroke: IAutoMovieMotionHumanPosture["joints"] = flat.fingers(
      { shape: "flat", curl: 10 },
      1,
    );
    TestValidator.predicate(
      "on the stroke",
      bones.every((bone: AutoMovieHumanoidBone): boolean => {
        const j = stroke[bone]!;
        const curl: number = bone.includes("Thumb") ? 0 : 10;
        return j[0] === shape[bone]![0] + curl && j[1] === shape[bone]![1];
      }),
    );
    const held: AutoMovieHumanoidBone = bones[0]!;
    const half = flat.fingers({ shape: "flat" }, 0.5, { [held]: [5, 2, 8] })[
      held
    ]!;
    TestValidator.equals("a held digit halfway", half, [
      5 + (shape[held]![0] - 5) * 0.5,
      2 + (shape[held]![1] - 2) * 0.5,
      4,
    ]);
    const posture: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const goal: IAutoMovieMotionHumanGestureStroke.IHand = {
      surface: "fist",
      shape: "fist",
      point: { x: -0.2, y: 1.3, z: 0.35 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      out: 0,
    };
    const fist: gestureHands.IPrepared = gestureHands.prepare(
      body,
      "right",
      p,
      undefined,
      0,
      { surface: "fist", shape: "fist" },
    );
    TestValidator.equals(
      "another goal",
      flat.hand(posture, goal, 1),
      fist.hand(posture, goal, 1),
    );
  }
}

namespace part_gesture_joints {
  /** Rounding of a few trigonometric products, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `gestureJoints` sets the joints a gesture moves directly at a share of its
   * stroke, scaled by its envelope and extent: a nod flexes the head by its angle
   * on `0.5 - 0.5 cos(2 pi cycles u)`, a shrug raises both girdles and tilts the
   * head, a slump flexes the chest, the spine and the head and protracts the
   * girdles; `add` adds the same deltas to a record, and a hand gesture sets
   * none.
   *
   * Scenarios:
   *
   * 1. A two-cycle nod at a quarter of its stroke, at full envelope and extent,
   *    flexes the head its full `ANGLES.nod`; at the start, none.
   * 2. A shrug at half envelope raises each girdle by half `ANGLES.shrug` and tilts
   *    the head by half `ANGLES.shrugHead`.
   * 3. A slump at full envelope and twice the extent, added to a chest already
   *    flexed 5 degrees, flexes it to 5 + 2 `ANGLES.slumpChest`.
   * 4. A wave sets no joint.
   */
  export function run(): void {
    TestValidator.predicate(
      "a nod",
      nclose(
        gestureJoints.at("nod", 0.25, 2, 1, 1).head![0],
        gestureJoints.ANGLES.nod,
        ROUNDING,
      ) && nclose(gestureJoints.at("nod", 0, 2, 1, 1).head![0], 0, ROUNDING),
    );
    const shrug: IAutoMovieMotionHumanPosture["joints"] = gestureJoints.at(
      "shrug",
      0.5,
      1,
      0.5,
      1,
    );
    TestValidator.predicate(
      "a shrug",
      nclose(
        shrug.leftShoulder![1],
        gestureJoints.ANGLES.shrug / 2,
        ROUNDING,
      ) &&
        nclose(
          shrug.rightShoulder![1],
          gestureJoints.ANGLES.shrug / 2,
          ROUNDING,
        ) &&
        nclose(shrug.head![1], gestureJoints.ANGLES.shrugHead / 2, ROUNDING),
    );
    const joints: IAutoMovieMotionHumanPosture["joints"] = { chest: [5, 0, 0] };
    gestureJoints.add(joints, "slump", 0.5, 1, 1, 2);
    TestValidator.predicate(
      "an added slump",
      nclose(
        joints.chest![0],
        5 + 2 * gestureJoints.ANGLES.slumpChest,
        ROUNDING,
      ) &&
        nclose(joints.spine![0], 2 * gestureJoints.ANGLES.slumpSpine, ROUNDING),
    );
    TestValidator.equals("a wave", gestureJoints.at("wave", 0.5, 1, 1, 1), {});
  }
}

namespace part_gesture_signal_bump {
  /** Rounding of one squared sine, unitless. */
  const ROUNDING: number = 1e-12;

  /**
   * `gestureSignal.bump` is a single rise and fall over the stroke, `sin^2(pi
   * u)`, zero at and outside its ends.
   *
   * Scenarios:
   *
   * 1. Zero at and outside the ends.
   * 2. One at the middle.
   * 3. A half at a quarter: `sin^2(pi / 4) = 1/2`.
   */
  export function run(): void {
    TestValidator.equals(
      "zero at and outside the ends",
      [gestureSignal.bump(0), gestureSignal.bump(1), gestureSignal.bump(2)],
      [0, 0, 0],
    );
    TestValidator.predicate(
      "one at the middle",
      nclose(gestureSignal.bump(0.5), 1, ROUNDING),
    );
    TestValidator.predicate(
      "a half at a quarter",
      nclose(gestureSignal.bump(0.25), 0.5, ROUNDING),
    );
  }
}

namespace part_gesture_signal_oscillation {
  /** Rounding of one sine and one minimum-jerk share, unitless. */
  const ROUNDING: number = 1e-12;

  /**
   * `gestureSignal.oscillation` is `sin(2 pi n u)` under a window easing in over
   * the first and out over the last 15 % of the stroke on the minimum-jerk share,
   * zero at and outside the stroke's ends.
   *
   * Scenarios:
   *
   * 1. At and outside the ends the signal is 0.
   * 2. In the window's open middle it is the bare sine: two cycles at u = 5/8 give
   *    `sin(5 pi / 2) = 1`.
   * 3. Inside the easing it is the sine scaled by the share: at `u = 0.075`, half
   *    the easing, the share `s(1/2) = 1/2`.
   */
  export function run(): void {
    TestValidator.equals(
      "zero at and outside the ends",
      [
        gestureSignal.oscillation(0, 2),
        gestureSignal.oscillation(1, 2),
        gestureSignal.oscillation(-0.5, 2),
        gestureSignal.oscillation(1.5, 2),
      ],
      [0, 0, 0, 0],
    );
    TestValidator.predicate(
      "the bare sine in the middle",
      nclose(gestureSignal.oscillation(5 / 8, 2), 1, ROUNDING),
    );
    TestValidator.predicate(
      "half the easing",
      nclose(
        gestureSignal.oscillation(0.075, 2),
        0.5 * Math.sin(2 * Math.PI * 2 * 0.075),
        ROUNDING,
      ),
    );
  }
}

namespace part_gesture_signal_rise {
  /** Rounding of one minimum-jerk share, unitless. */
  const ROUNDING: number = 1e-12;

  /**
   * `gestureSignal.rise` is a push's rise held to the end: the minimum-jerk share
   * over the first 60 % of the stroke, `s(u / 0.6)`.
   *
   * Scenarios:
   *
   * 1. Zero at the start.
   * 2. A half at 30 % of the stroke: `s(1/2) = 1/2`.
   * 3. One from 60 % on.
   */
  export function run(): void {
    TestValidator.equals("zero at the start", gestureSignal.rise(0), 0);
    TestValidator.predicate(
      "a half at 30 %",
      nclose(gestureSignal.rise(0.3), 0.5, ROUNDING),
    );
    TestValidator.equals(
      "held from 60 %",
      [gestureSignal.rise(0.6), gestureSignal.rise(0.9)],
      [1, 1],
    );
  }
}

/**
 * `gesture`'s unit contract: its admission, hands, joints and signals.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `gesture_admit`: `gestureAdmit` admits a gesture's counts and the hands it
 *   moves:
 * - `gesture_hands`: `gestureHands.prepare` readies one gesture hand on its
 *   stroke's surface and shape.
 * - `gesture_joints`: `gestureJoints` sets the joints a gesture moves directly at
 *   a share of its stroke, scaled by its envelope and extent:
 * - `gesture_signal_bump`: `gestureSignal.bump` is a single rise and fall over
 *   the stroke, `sin^2(pi u)`, zero at and outside its ends.
 * - `gesture_signal_oscillation`: `gestureSignal.oscillation` is `sin(2 pi n u)`
 *   under a window easing in over the first and out over the last 15 % of the
 *   stroke on the minimum-jerk share, zero at and outside the stroke's ends.
 * - `gesture_signal_rise`: `gestureSignal.rise` is a push's rise held to the end:
 */
export async function test_unit_motions_everyday_gesture(): Promise<void> {
  part_gesture_admit.run();
  await part_gesture_hands.run();
  part_gesture_joints.run();
  part_gesture_signal_bump.run();
  part_gesture_signal_oscillation.run();
  part_gesture_signal_rise.run();
}
