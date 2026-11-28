import type {
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  gesture
} from "../../../../../packages/motions/src/everyday/internal/gesture";
import {
  gestureAdmit
} from "../../../../../packages/motions/src/everyday/internal/gestureAdmit";
import {
  gestureJoints
} from "../../../../../packages/motions/src/everyday/internal/gestureJoints";
import {
  gestureStrokeTables
} from "../../../../../packages/motions/src/everyday/internal/gestureStrokeTables";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

namespace part_gesture_admit {
  /**
   * `gestureAdmit` admits a gesture's counts and the hands it moves: its
   * strokes (the parameter or the kind's rhythm, a whole count), its hold (none
   * or more), a bow's depth (above 0, up to `gesture.DEEPEST_BOW`), a point's
   * target and an aim's shape, and the sides its kind moves: both, the authored
   * hand (the right when unstated), or none.
   *
   * Scenarios:
   *
   * 1. A wave with no count takes its rhythm's cycles and the right hand; one with
   *    the left hand and 2.6 strokes takes the left hand and 3, the count
   *    rounded; a clap takes both hands; a nod none.
   * 2. A bow takes `gesture.BOW` unless a depth is given.
   * 3. A count rounding to 0 (0.4), a negative hold, a bow past the deepest, a
   *    point with no target and an aim with no shape are refused on `count`,
   *    `hold`, `depth`, `target` and `aim`.
   */
  export function verify(): void {
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
        if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
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

namespace part_gesture_joints {
  /** Rounding of a few trigonometric products, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `gestureJoints` sets the joints a gesture moves directly at a share of its
   * stroke, scaled by its envelope and extent: a nod flexes the head by its
   * angle on `0.5 - 0.5 cos(2 pi cycles u)`, a shrug raises both girdles and
   * tilts the head, a slump flexes the chest, the spine and the head and
   * protracts the girdles; `add` adds the same deltas to a record, and a hand
   * gesture sets none.
   *
   * Scenarios:
   *
   * 1. A two-cycle nod at a quarter of its stroke, at full envelope and extent,
   *    flexes the head its full `ANGLES.nod`; at the start, none.
   * 2. A shrug at half envelope raises each girdle by half `ANGLES.shrug` and
   *    tilts the head by half `ANGLES.shrugHead`.
   * 3. A slump at full envelope and twice the extent, added to a chest already
   *    flexed 5 degrees, flexes it to 5 + 2 `ANGLES.slumpChest`.
   * 4. A wave sets no joint.
   */
  export function verify(): void {
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

/**
 * `gesture`'s unit contract: its admission, hands, joints and signals.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `gesture_admit`: `gestureAdmit` admits a gesture's counts and the hands it
 *   moves:
 * - `gesture_joints`: `gestureJoints` sets the joints a gesture moves directly at
 *   a share of its stroke, scaled by its envelope and extent:
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gesture hand admission, direct joint contributions, and row signals follow the selected gesture and envelope.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the distinct gesture readers on typed hand choices, authored rows, and fixed envelope shares.
 * @evidence contracts/development/testing.md#independent-expectations Admitted hands and refused combinations come from each row. Known shares establish the sign and amplitude of joint motion at selected stroke instants.
 */
export async function test_motions_everyday_gesture(): Promise<void> {
  part_gesture_admit.verify();
  part_gesture_joints.verify();
}
