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

/**
 * Authored stance leg goals and fixed-foot preparation, without a pose solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States world-metre foot/knee goals, exact forefoot planted contact, original borrowed cold references and fresh prepared output ownership.
 * @evidence contracts/development/design.md#principled-representation Uses canonical feet/body and existing limb goals; only fixed bend/contact geometry is retained by preparation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface read serves StrikingStance.legs and prepare serves unchanged-foot damped balance and defence callbacks through prepareLegs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, fitted joint, source index, success flag or time sample substitutes for authored goals; current native fitting and ROM admission remain downstream.
 */
export namespace StrikingLegGoals {
  /**
   * The original fresh goals, borrowing each supplied ankle and rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed anatomical rule, world units, original borrowed foot fields and fresh bend/MTP/goal ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Rotates the foot's toe axis, adds the original half-shank forward/full-shank upward knee hint, and retains planted forefoot MTP contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered two-side loop uses the shared bend and goal owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original point, rotation, bend, planted omission/presence and MTP offset; no knee/ankle pose is solved or cached here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two rigid hint computations and optional contact reads remain constant work; only unchanged-foot consumers use the separate explicit prepared path.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both cold and prepared paths use the same exact bend expression and field assembler; changing foot inputs still recompute the cold geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or output. Each call returns a fresh goal map/bends/contacts with the original ankle/rotation references borrowed from the caller.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean>,
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    const out: Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> = {};
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieMotionHumanFoot.IPlacement = feet[side];
      const hint: IAutoMovieVector3 = bend(body, foot);
      const bearing: boolean = planted[side];
      out[side === "left" ? "leftLeg" : "rightLeg"] =
        goal(foot.ankle, hint, foot.rotation, bearing, bearing ? HumanFoot.offset(body, side, "mtp") : undefined);
    }
    return out;
  }

  /**
   * Prepare one unchanged body, pair of feet and planted selection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States lazy fixed-foot snapshots, original goal mathematics and independent fresh vector/rotation/record ownership for each read.
   * @evidence contracts/development/implementation.md#principled-implementation The first actual demand computes the same toe direction, knee hint and conditional MTP offset as read; later demands mint new goal data from those exact unchanged geometric values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy two-side snapshot feeds the same goal field owner; no fitted-pose, clock or per-query cache layer is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only explicitly unchanged feet/body/planted geometry is prepared. All goals, field order, planted/MTP semantics and downstream physical fitting remain; varying-foot users keep read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two fixed hint/contact computations run once per owning plan instead of every goal read; each read pays only constant copying and fresh goal construction, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual damped balance and defence callers fix body, entry feet and planted selection for their whole plan or built geometry. Only that rigid authored geometry is shared; no pose, IK result, score or time observation is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns at most two private foot/hint/contact snapshots until release; reads return independent points, rotations, hints, contacts and goal maps, preventing caller output mutation from changing the retained geometry.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean>,
  ): () => Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    let seeds: readonly ISeed[] | undefined;
    return (): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> => {
      if (seeds === undefined)
        seeds = (["left", "right"] as const).map((side: "left" | "right"): ISeed => {
          const foot: IAutoMovieMotionHumanFoot.IPlacement = feet[side];
          const bearing: boolean = planted[side];
          return {
            side,
            point: { ...foot.ankle },
            rotation: { ...foot.rotation },
            bend: bend(body, foot),
            planted: bearing,
            contact: bearing ? { ...HumanFoot.offset(body, side, "mtp") } : undefined,
          };
        });
      const out: Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> = {};
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

  /** A private fixed-foot geometric snapshot; never a fitted pose or query result. */
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
  function bend(body: IAutoMovieMotionHumanBody, foot: IAutoMovieMotionHumanFoot.IPlacement): IAutoMovieVector3 {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation, { x: 0, y: 0, z: 1 });
    return Vector3.add(foot.ankle, Vector3.add(Vector3.scale(toes, 0.5 * body.measure.shank), {
      x: 0, y: body.measure.shank, z: 0,
    }));
  }

  /** The original point/bend/rotation then conditional planted/contact field order. */
  function goal(point: IAutoMovieVector3, hint: IAutoMovieVector3, rotation: IAutoMovieQuaternion, planted: boolean, contact: IAutoMovieVector3 | undefined): IAutoMovieHumanLimbGoal {
    return {
      point,
      bend: hint,
      rotation,
      ...(planted ? { planted: true, contact } : {}),
    };
  }
}
