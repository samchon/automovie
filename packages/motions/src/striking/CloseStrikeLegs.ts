import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";

/**
 * The lower body of a close strike: the pelvis turned about the vertical
 * and shifted along the line with both feet planted, or, for a spin, the
 * whole stance turned about the ball of the lead foot, which pivots in
 * place while the rear foot travels round it on a low arc.
 *
 * The turn, the lean and the shift follow one share in [0, 1] of the strike
 * out and back, so the stance returns to the entry's when the share does.
 * The root is lowered until both legs reach their feet
 * (`resolveHumanPosture.lower`).
 *
 * @param body The body.
 * @param entry The entry posture.
 * @param feet The entry's feet.
 * @param lead The stance's lead side.
 * @param motion The turn, lean, shift and spin and their share by second.
 * @returns The primitive writing the root, the trunk and both legs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds of carriage, the pivot, the return and the lowering.
 * @evidence contracts/development/implementation.md#principled-implementation A planted turn changes only the root's heading and place; a spin rotates the root and the rear foot rigidly about the lead ball and turns the lead foot about that ball, the forefoot rocker of a pivot.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One share, then the feet, the root and the lowered posture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pivot ball is held exactly; the rear foot's arc height is a named share of the stance length.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the lowering fit.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the entry and the motion until plan release.
 */
export function CloseStrikeLegs(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  lead: AutoMovieHumanSide,
  motion: CloseStrikeLegs.IMotion,
): IAutoMovieMotionHumanPrimitive {
  const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const ball: IAutoMovieVector3 = HumanFoot.point(
    body,
    lead,
    "ball",
    feet[lead],
  );
  const lift: number = CloseStrikeLegs.LIFT * StrikingStance.length(body);
  return {
    channels: ["root", "trunk", "leftLeg", "rightLeg"],
    from: 0,
    to: motion.duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof resolveHumanPosture.lower>[3],
    ): IAutoMovieMotionHumanPosture => {
      const share: number = motion.share(seconds);
      const spun: number = motion.spin(seconds);
      const about: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: ball,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, spun),
      };
      const turnAbout = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          ball,
          Quaternion.rotateVector(
            about.rotation,
            Vector3.subtract(point, ball),
          ),
        );
      const turnFoot = (
        foot: IAutoMovieMotionHumanFoot.IPlacement,
      ): IAutoMovieMotionHumanFoot.IPlacement => ({
        ankle: turnAbout(foot.ankle),
        rotation: Quaternion.multiply(about.rotation, foot.rotation),
      });

      // The rear foot rises on its way round and settles back.
      const swing: IAutoMovieMotionHumanFoot.IPlacement = turnFoot(feet[rear]);
      const arc: number = spun === 0 ? 0 : Math.sin((Math.PI * spun) / 360);
      const risen: IAutoMovieMotionHumanFoot.IPlacement = {
        ...swing,
        ankle: { ...swing.ankle, y: swing.ankle.y + lift * Math.abs(arc) },
      };
      const pivoted: IAutoMovieMotionHumanFoot.IPlacement = turnFoot(
        feet[lead],
      );
      const placed: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.IPlacement
      > =
        lead === "left"
          ? { left: pivoted, right: risen }
          : { left: risen, right: pivoted };
      // A jump lifts the root and both feet together.
      const hop: number = motion.hop === undefined ? 0 : motion.hop(seconds);
      if (hop > 0)
        for (const side of ["left", "right"] as const)
          placed[side] = {
            ...placed[side],
            ankle: { ...placed[side].ankle, y: placed[side].ankle.y + hop },
          };
      const root: IAutoMovieVector3 = Vector3.add(
        turnAbout(entry.root),
        Vector3.scale(motion.shift, share),
      );
      const yaw: number = entry.yaw + spun + motion.turn * share;
      const lowered: IAutoMovieMotionHumanPosture = resolveHumanPosture.lower(
        body,
        {
          ...posture,
          root: { ...root, y: entry.root.y + hop },
          yaw,
          pitch: entry.pitch + motion.lean * share,
          joints: StrikingStance.facing(posture.joints, yaw - entry.yaw),
          limbs: {
            ...posture.limbs,
            ...StrikingStance.legs(body, placed, {
              left: hop === 0 && !(rear === "left" && spun !== 0),
              right: hop === 0 && !(rear === "right" && spun !== 0),
            }),
          },
        },
        resolveHumanPosture.KNEE,
        resolution,
      );
      return lowered;
    },
  };
}

/**
 * Companion types and constants of {@link CloseStrikeLegs}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the motion's members, units and the arc's source.
 * @evidence contracts/development/design.md#principled-representation Degrees, metres, a unit line and shares by action second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the close strike law gives its lower body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
 */
export namespace CloseStrikeLegs {
  /** The rear foot's arc height on a spin, a share of the stance length (provisional). */
  export const LIFT: number = 0.1;

  /** The lower body's carriage over a close strike. */
  export interface IMotion {
    /** The action's duration, seconds. */
    duration: number;

    /** The pelvis turn at full share, degrees, positive toward the performer's left. */
    turn: number;

    /** The trunk's forward lean at full share, degrees. */
    lean: number;

    /** The pelvis's horizontal shift at full share, world metres. */
    shift: IAutoMovieVector3;

    /** The share of the strike out and back at an action second, in [0, 1]. */
    share: (seconds: number) => number;

    /** The spin about the lead ball at an action second, degrees; 0 without a spin. */
    spin: (seconds: number) => number;

    /** The height both feet and the root are lifted at an action second, metres; none when absent. */
    hop?: (seconds: number) => number;
  }
}
