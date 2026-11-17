import type { AutoMovieHumanoidBone, IAutoMovieAngleRange, IAutoMovieBone, IAutoMovieJointPose, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanDrinkingArm, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRefusal, IAutoMovieMotionHumanTouch, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3, getConstraint, rotationBetween } from "@automovie/engine";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";

/**
 * The arm a held vessel is brought to the lips with, read as a person
 * drinks: the arm the resolver fits for a goal, read on its displayed
 * bones, and whether it holds the posture of drinking from a glass, its
 * shoulder flexed and abducted within the range healthy drinkers use (Alt
 * Murphy, Sunnerhagen, Johnels and Willén 2006, J NeuroEng Rehabil 3:18,
 * Table 2, twenty healthy controls; the table of Murphy, Willén and
 * Sunnerhagen 2011, Neurorehabil Neural Repair 25:71, was not read), and
 * the hand's attitude on the way there. `AutoMovieMotionHumanTouchUpright`
 * searches a vessel's facing and `AutoMovieMotionHumanTouchDrink` its lean
 * by it, and the touch stroke carries a held vessel by its attitude.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the admission and its source, and who reads them.
 * @evidence contracts/development/design.md#principled-representation A drinking arm is four readings of one fit: the vessel's tilt, the shoulder's flexion and abduction as the source measures them, and the forearm's twist room.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds, the reading, the fit, the admission, the nearest arm and its refusal, and the attitude on the way; split from the search so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is of the resolver's own fit on its displayed bones; no arm is assumed.
 */
export namespace AutoMovieMotionHumanDrinkingArm {
  /** The most the shoulder is flexed while the vessel is at the face, degrees: the healthy drinkers' greatest flexion in the drinking phase, 53.5 ± 7.0 (Alt Murphy et al. 2006, Table 2), plus two standard deviations, the range about 95 % of a normal population lies within. */
  export const FLEXION: number = 53.5 + 2 * 7.0;

  /** The most the shoulder is abducted while the vessel is at the face, degrees: the healthy drinkers' greatest abduction in the drinking phase, 39.3 ± 13.0 (Alt Murphy et al. 2006, Table 2), plus two standard deviations, the range about 95 % of a normal population lies within. */
  export const ABDUCTION: number = 39.3 + 2 * 13.0;

  /**
   * The shoulder's flexion and abduction as Alt Murphy et al. 2006 measure
   * them for the drinking task, in whose definition `FLEXION` and
   * `ABDUCTION` are bounds: "for shoulder flexion/extension in sagittal
   * plane and abduction/adduction in frontal plane", the angle "between the
   * vectors joining the shoulder and elbow markers and the vertical vector
   * from the shoulder marker toward the hip". Each is the unsigned angle
   * between the shoulder-to-elbow vector and the shoulder-to-hip vector,
   * both projected on one plane through the body's heading: the sagittal
   * one (forward and up) for the flexion, the frontal one (to the side and
   * up) for the abduction. What still differs from the source: the planes
   * are the body's heading's, where the source's are the laboratory's; the
   * points are the joints' centres, where the source's are skin markers;
   * and the source's own caution holds, that these "are not the true joint
   * angles".
   *
   * @param bones The posed body's bones.
   * @param side The arm.
   * @param yaw The body's heading, degrees.
   * @returns The flexion and the abduction, degrees, unsigned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the source's definition, quoted, its reading here and what still differs.
   * @evidence contracts/development/implementation.md#principled-implementation A bound is applied in the definition that produced it: the source's two vectors and two planes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two vectors, two projections, two angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A degenerate projection reads 0, never a guessed angle.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one owner of the measure: the admission and the drinking signature read it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function measured(
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition">
    >,
    side: IAutoMovieMotionHumanHand.Side,
    yaw: number,
  ): IAutoMovieMotionHumanDrinkingArm.IMeasuredResult {
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const arm: IAutoMovieVector3 = Vector3.subtract(
      bones.get(`${side}LowerArm`)!.worldPosition,
      shoulder,
    );
    const hip: IAutoMovieVector3 = Vector3.subtract(
      bones.get(`${side}UpperLeg`)!.worldPosition,
      shoulder,
    );
    const heading: number = (yaw * Math.PI) / 180;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

    // The unsigned angle between the two vectors projected on the plane
    // through the world's up and `along`.
    const between = (along: IAutoMovieVector3): number => {
      const a: [number, number] = [
        Vector3.dot(arm, along),
        Vector3.dot(arm, up),
      ];
      const b: [number, number] = [
        Vector3.dot(hip, along),
        Vector3.dot(hip, up),
      ];
      const lengths: number = Math.hypot(...a) * Math.hypot(...b);
      return lengths > 0
        ? (Math.acos(
            Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / lengths)),
          ) *
            180) /
            Math.PI
        : 0;
    };
    return {
      flexion: between({ x: Math.sin(heading), y: 0, z: Math.cos(heading) }),
      abduction: between({ x: Math.cos(heading), y: 0, z: -Math.sin(heading) }),
    };
  }

  /**
   * The arm the resolver fits for a goal, read on its displayed bones.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param goal The arm's goal, whose rotation lays the vessel's axis.
   * @param referred Whether the fit is held to the goal's own reference (`AutoMovieMotionHumanTouchLaid.reference`), as a touch stroke holds it, or fitted on the posture alone.
   * @param axis The vessel's axis in the hand's frame, whose reached direction the tilt measures against the asked one; without it the tilt is how far the reached hand carries the direction the goal stands on the world's up.
   * @returns The readings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit, both ways of solving it and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The flexion and the abduction are the source's own measure (`measured`), the twist room the forearm's twist against its own range, and the tilt the asked rotation's up axis read again through the reached rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve, one bone read and four readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The readings are the resolver's fit within the joints' ranges, never the asked goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve, two when referred, whose first the resolver's memory holds once the unreferred fit is read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the resolver, `poseBones`, the joint constraints and `AutoMovieMotionHumanTouchLaid.reference`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: IAutoMovieMotionHumanHand.Side,
    goal: IAutoMovieMotionHumanPosture.IGoal,
    referred: boolean,
    axis?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanDrinkingArm.IArm {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const pose: IAutoMoviePose = resolveHumanPosture(body, {
      ...posture,
      limbs: {
        ...posture.limbs,
        [limb]: referred
          ? {
              ...goal,
              reference: AutoMovieMotionHumanTouchLaid.reference(
                body,
                posture,
                side,
                goal,
              ),
            }
          : goal,
      },
    });
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const shoulder: { flexion: number; abduction: number } = measured(
      bones,
      side,
      posture.yaw,
    );
    const twist: number =
      pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === `${side}LowerArm`,
      )?.twist ?? 0;
    const range: IAutoMovieAngleRange | null =
      getConstraint(
        `${side}LowerArm`,
        body.skeleton.bones.find(
          (b: IAutoMovieBone): boolean => b.bone === `${side}LowerArm`,
        )?.constraint ?? null,
      )?.twist ?? null;
    return {
      tilt:
        axis === undefined
          ? angle(bones.get(`${side}Hand`)!.worldRotation, goal)
          : degrees(
              Vector3.dot(
                Vector3.normalize(
                  Quaternion.rotateVector(
                    bones.get(`${side}Hand`)!.worldRotation,
                    axis,
                  ),
                ),
                Vector3.normalize(
                  Quaternion.rotateVector(goal.rotation!, axis),
                ),
              ),
            ),
      flexion: shoulder.flexion,
      abduction: shoulder.abduction,
      room:
        range === null
          ? Infinity
          : Math.min(twist - range.min, range.max - twist),
    };
  }

  /**
   * The hand's world rotation on the way to a vessel's place and back
   * (`AutoMovieMotionHumanArm.ICarry.attitude`): the hand the carry's blend
   * gives, turned by the shortest arc that brings the vessel's axis onto the
   * axis asked at that second. The touch's goal holds the vessel leaned as at
   * the lips, so the arm is carried toward the arm that drinks; the vessel
   * shows the share of the lean its goal's end shows (the goal as its fit
   * reaches it) that `tipped` gives at the carry's weight, from upright (none
   * until the last `AutoMovieMotionHumanTouch.TIP` of the way). The asked
   * axis is the one the held end shows, turned toward that along their
   * shortest arc by the carry's weight: a glass held upright stays upright
   * until it tips at the lips, a hand hanging with an implied vessel turns it
   * up as the arm rises instead of turning over in the frame the carry leaves
   * it, and the hand joins the fit at the lips without the step the fit's
   * own reach (a few degrees short of the asked lean) would leave if the
   * goal's asked axis were sought. The swing is removed and
   * the blend's twist about the axis kept (a swing-twist split), so the arm
   * is asked no more than the axis needs. A blend of the wrist's angles does
   * not hold a world attitude, since the forearm turns under the hand on the
   * way.
   *
   * @param touch The touch: its body, hand, effector and held rotation. The vessel's axis in the hand is the one its held rotation stands upright, or without one the effector's along axis, which an upright lay stands on the world's up.
   * @param tipped The share of the lean at the goal's end the vessel shows at a weight of the carry, in [0, 1].
   * @returns The rotation at a posture, a second, the blend's hand rotation, the two ends' and the carry's weight, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the asked axis and its two ends, the swing removed, the twist kept and why the blend does not do.
   * @evidence contracts/development/implementation.md#principled-implementation The vessel's attitude is its axis alone, so only the swing of the blend's hand off the asked axis is removed (the shortest arc), its twist about the axis left free; the asked axis meets the held end's at weight 0 and the goal's at weight 1, so the hand is continuous where the carry leaves its ends, and the arm's own goal is the drinking one throughout, so the carry's blend and its clearing course aim at one arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two interpolated axes (the tip from upright, then the way from the held end) and one shortest arc per second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The end's axis is the one the goal's fit shows at the same second, so at the lips the vessel leans exactly as the arm shows it; neither end is moved.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the carry's two ends and the engine's `rotationBetween` and `Quaternion.slerp`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function closes over its inputs only.
   */
  export function carried(
    touch: Pick<
      IAutoMovieMotionHumanTouch.ITouch,
      "body" | "side" | "rest" | "effector" | "held"
    >,
    tipped: (weight: number) => number,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    hand: IAutoMovieQuaternion,
    start: IAutoMovieQuaternion,
    end: IAutoMovieQuaternion,
    weight: number,
  ) => IAutoMovieQuaternion {
    const { body, side } = touch;
    const axis: IAutoMovieVector3 =
      touch.held === undefined
        ? AutoMovieMotionHumanTouchEffector.local(body, side, touch.effector)
            .forward
        : Quaternion.rotateVector(Quaternion.inverse(touch.held), {
            x: 0,
            y: 1,
            z: 0,
          });
    return (
      _posture: IAutoMovieMotionHumanPosture,
      _seconds: number,
      hand: IAutoMovieQuaternion,
      start: IAutoMovieQuaternion,
      end: IAutoMovieQuaternion,
      weight: number,
    ): IAutoMovieQuaternion => {
      // The vessel's axis tipped from upright by its share of the goal's
      // end's lean, then the axis the held end shows turned toward it by the
      // carry's weight, each along the shortest arc.
      const toward = (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        share: number,
      ): IAutoMovieVector3 =>
        Quaternion.rotateVector(
          Quaternion.slerp(Quaternion.identity(), rotationBetween(a, b), share),
          a,
        );
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const from: IAutoMovieVector3 = Quaternion.rotateVector(start, axis);
      const wanted: IAutoMovieVector3 = toward(
        from,
        toward(up, Quaternion.rotateVector(end, axis), tipped(weight)),
        weight,
      );
      return Quaternion.normalize(
        Quaternion.multiply(
          rotationBetween(Quaternion.rotateVector(hand, axis), wanted),
          hand,
        ),
      );
    };
  }

  /**
   * Whether a fitted arm holds the vessel as a person drinks: the shoulder
   * flexed at most `FLEXION` and abducted at most `ABDUCTION`, the
   * forearm's twist `AutoMovieMotionHumanTouchLaid.MARGIN` inside its range.
   *
   * @param arm The readings.
   * @returns Whether it drinks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three conditions and what decides the rest.
   * @evidence contracts/development/implementation.md#principled-implementation The healthy drinkers' range of shoulder flexion and abduction (Alt Murphy et al. 2006), with the forearm kept off its range's end as every laid arm's reference keeps it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conjunction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound is a named constant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the laid arm's own margin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function drinks(arm: IAutoMovieMotionHumanDrinkingArm.IArm): boolean {
    return (
      arm.flexion <= FLEXION &&
      arm.abduction <= ABDUCTION &&
      arm.room >= AutoMovieMotionHumanTouchLaid.MARGIN
    );
  }

  /**
   * The nearer of an arm tried and the nearest so far: the one lying less
   * past the drinking range: the flexion's or the abduction's excess over its
   * bound, the greater.
   *
   * @param nearest The nearest so far; none before the first.
   * @param arm The arm tried.
   * @param at Where it was tried, in words.
   * @returns The nearer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the comparison and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The range bounds each angle on its own, so an arm lies past it by the greater excess.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A tie keeps the earlier arm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by both drinking searches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function nearer(
    nearest: IAutoMovieMotionHumanDrinkingArm.INearest | undefined,
    arm: IAutoMovieMotionHumanDrinkingArm.IArm,
    at: string,
  ): IAutoMovieMotionHumanDrinkingArm.INearest {
    const past = (of: IAutoMovieMotionHumanDrinkingArm.IArm): number =>
      Math.max(of.flexion - FLEXION, of.abduction - ABDUCTION);
    return nearest === undefined || past(arm) < past(nearest.arm)
      ? { arm, at }
      : nearest;
  }

  /**
   * The refusal of a vessel no candidate lets the arm drink with.
   *
   * @param side The arm.
   * @param sought What was sought, in words: the leans and turns tried.
   * @param closest The arm tried that lay least past the range (`nearer`).
   * @returns The refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the refusal reports.
   * @evidence contracts/development/implementation.md#principled-implementation Reports the range's bounds and the nearest arm's readings in the source's measure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the named ones.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Thrown by both drinking searches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function refused(
    side: IAutoMovieMotionHumanHand.Side,
    sought: string,
    closest: IAutoMovieMotionHumanDrinkingArm.INearest,
  ): IAutoMovieMotionHumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis: "facing",
      value: side,
      reason: `no lean of the held vessel toward the face ${sought} lets the ${side} arm bring it to the region as a person drinks, the shoulder flexed at most ${FLEXION.toFixed(1)} and abducted at most ${ABDUCTION.toFixed(1)} degrees and the forearm's twist ${AutoMovieMotionHumanTouchLaid.MARGIN} degrees inside its range (the arm nearest, ${closest.at}, has the shoulder flexed ${closest.arm.flexion.toFixed(1)} and abducted ${closest.arm.abduction.toFixed(1)} degrees and the forearm's twist ${closest.arm.room.toFixed(0)} degrees inside its range)`,
      fix: "bring the vessel to a region nearer the chin, or take it by a grip the arm can drink from: picked up for its use (`pickUp` with `use`), by its side, or with the other hand",
    });
  }
}

/** How far a reached hand carries the vessel's asked axis, degrees: the asked rotation's axis is the up turned back by it, read again through the reached rotation. */
function angle(
  reached: IAutoMovieQuaternion,
  goal: IAutoMovieMotionHumanPosture.IGoal,
): number {
  const asked: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(Quaternion.normalize(goal.rotation!)),
    { x: 0, y: 1, z: 0 },
  );
  return degrees(
    Vector3.normalize(
      Quaternion.rotateVector(Quaternion.normalize(reached), asked),
    ).y,
  );
}

/** The angle whose cosine is given, clamped to [-1, 1], degrees. */
function degrees(cosine: number): number {
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
}
