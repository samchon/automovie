import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPunch,
} from "@automovie/interface";

import { blendHumanJoint } from "../posture/blendHumanJoint";
import { punchContact } from "./punchContact";
import { punchGeometry } from "./punchGeometry";
import type { punchReach } from "./punchReach";

/**
 * The arm's reference configuration at a clock: the launch's anchor blended
 * toward each moved correction's anchor by its minimum-jerk share, joint by
 * joint (`blendHumanJoint`).
 *
 * Part of `punchGeometry.build`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `anchored`.
 */
export function punchAnchored(
  prepared: punchAnchored.IPrepared,
): (clock: number) => IAutoMovieHumanLimbReference {
  const {
    anchor,
    contact,
    corrections,
    t0,
    body,
    side,
  }: punchAnchored.IPrepared = prepared;
  return (clock: number): IAutoMovieHumanLimbReference => {
    let at: IAutoMovieHumanLimbReference = anchor(contact.launched);
    for (const c of corrections(clock)) {
      if (!c.moved) continue;
      const s: number = punchAnchored.share(t0 + clock, c);
      const next: IAutoMovieHumanLimbReference = anchor(c.reach);
      at = {
        upper: blendHumanJoint(
          body,
          `${side}UpperArm`,
          at.upper,
          next.upper,
          s,
        ),
        lower: blendHumanJoint(
          body,
          `${side}LowerArm`,
          at.lower,
          next.lower,
          s,
        ),
      };
    }
    return at;
  };
}

/** The `anchored` of `punchGeometry.build`, built from what that plan prepared. */
export namespace punchAnchored {
  /**
   * How far a correction has carried the arm at a second: the minimum-jerk
   * share over its own span.
   *
   * @param seconds The punch's seconds from its launch clock's origin.
   * @param correction The correction's start and length.
   * @returns 0 to 1.
   */
  export function share(
    seconds: number,
    correction: Pick<punchReach.ICorrection, "start" | "duration">,
  ): number {
    return minimumJerk.share(
      (seconds - correction.start) / correction.duration,
    );
  }

  /** What `punchGeometry.build` prepared for its `anchored`. */
  export interface IPrepared {
    /** The `anchor` `punchGeometry.build` prepared. */
    anchor: (reach: punchReach.IReach) => IAutoMovieHumanLimbReference;

    /** The `contact` `punchGeometry.build` prepared. */
    contact: punchContact.IContact;

    /** The `corrections` `punchGeometry.build` prepared. */
    corrections: (t: number) => readonly punchReach.ICorrection[];

    /** The `t0` `punchGeometry.build` prepared. */
    t0: number;

    /** The `body` `punchGeometry.build` prepared. */
    body: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>["body"];

    /** The `side` `punchGeometry.build` prepared. */
    side: punchGeometry.ITiming["side"];
  }
}
