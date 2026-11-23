import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/** Authored stance leg goals and fixed-foot preparation, without a pose solve. */
export namespace StrikingLegGoals {
  /** The original fresh goals, borrowing each supplied ankle and rotation. */
  export function read(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean>,
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    const out: Pick<
      IAutoMovieMotionHumanPosture["limbs"],
      "leftLeg" | "rightLeg"
    > = {};
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieMotionHumanFoot.IPlacement = feet[side];
      const hint: IAutoMovieVector3 = bend(body, foot);
      const bearing: boolean = planted[side];
      out[side === "left" ? "leftLeg" : "rightLeg"] = goal(
        foot.ankle,
        hint,
        foot.rotation,
        bearing,
        bearing ? HumanFoot.offset(body, side, "mtp") : undefined,
      );
    }
    return out;
  }

  /** Prepare one unchanged body, pair of feet and planted selection. */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean>,
  ): () => Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    let seeds: readonly ISeed[] | undefined;
    return (): Pick<
      IAutoMovieMotionHumanPosture["limbs"],
      "leftLeg" | "rightLeg"
    > => {
      if (seeds === undefined)
        seeds = (["left", "right"] as const).map(
          (side: "left" | "right"): ISeed => {
            const foot: IAutoMovieMotionHumanFoot.IPlacement = feet[side];
            const bearing: boolean = planted[side];
            return {
              side,
              point: { ...foot.ankle },
              rotation: { ...foot.rotation },
              bend: bend(body, foot),
              planted: bearing,
              contact: bearing
                ? { ...HumanFoot.offset(body, side, "mtp") }
                : undefined,
            };
          },
        );
      const out: Pick<
        IAutoMovieMotionHumanPosture["limbs"],
        "leftLeg" | "rightLeg"
      > = {};
      for (const seed of seeds)
        out[seed.side === "left" ? "leftLeg" : "rightLeg"] = goal(
          { ...seed.point },
          { ...seed.bend },
          { ...seed.rotation },
          seed.planted,
          seed.contact === undefined ? undefined : { ...seed.contact },
        );
      return out;
    };
  }

  /**
   * A private fixed-foot geometric snapshot; never a fitted pose or query
   * result.
   */
  interface ISeed {
    /** Which original output goal this describes. */
    side: "left" | "right";
    /** Fixed world ankle, metres. */
    point: IAutoMovieVector3;
    /** Fixed world foot rotation. */
    rotation: IAutoMovieQuaternion;
    /** Original fixed world knee hint, metres. */
    bend: IAutoMovieVector3;
    /** Original forefoot support selection. */
    planted: boolean;
    /** Original MTP offset, only for a planted foot. */
    contact: IAutoMovieVector3 | undefined;
  }

  /** The exact original ordered toe-axis and knee-hint arithmetic. */
  function bend(
    body: IAutoMovieMotionHumanBody,
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3 {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return Vector3.add(
      foot.ankle,
      Vector3.add(Vector3.scale(toes, 0.5 * body.measure.shank), {
        x: 0,
        y: body.measure.shank,
        z: 0,
      }),
    );
  }

  /**
   * The original point/bend/rotation then conditional planted/contact field
   * order.
   */
  function goal(
    point: IAutoMovieVector3,
    hint: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    planted: boolean,
    contact: IAutoMovieVector3 | undefined,
  ): IAutoMovieHumanLimbGoal {
    return {
      point,
      bend: hint,
      rotation,
      ...(planted ? { planted: true, contact } : {}),
    };
  }
}
