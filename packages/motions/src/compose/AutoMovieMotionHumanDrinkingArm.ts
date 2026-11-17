import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  getConstraint,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanHand } from "../posture/HumanHand";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionHumanTouch } from "./AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";
import { readHumanBone } from "../body/readHumanBone";

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
 * @evidence contracts/development/design.md#principled-representation A drinking arm is five readings of one fit: the vessel's tilt, the shoulder's flexion and abduction as the source measures them, the forearm's twist and its room.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds, the reading, the fit, the admission, the nearest arm and its refusal, and the attitude on the way; split from the search so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is of the resolver's own fit on its displayed bones; no arm is assumed.
 */
export namespace AutoMovieMotionHumanDrinkingArm {
  /** The most the shoulder is flexed while the vessel is at the face, degrees: the healthy drinkers' greatest flexion in the drinking phase, 53.5 ± 7.0 (Alt Murphy et al. 2006, Table 2), plus two standard deviations, the range about 95 % of a normal population lies within. */
  export const FLEXION: number = 53.5 + 2 * 7.0;

  /** The most the shoulder is abducted while the vessel is at the face, degrees: the healthy drinkers' greatest abduction in the drinking phase, 39.3 ± 13.0 (Alt Murphy et al. 2006, Table 2), plus two standard deviations, the range about 95 % of a normal population lies within. */
  export const ABDUCTION: number = 39.3 + 2 * 13.0;

  /**
   * What a fitted arm reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The readings the admission and the facing's choice compare.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members: the admission reads three, the choice the tilt, the refusal the twist it states with the room.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each is read off the fitted pose, never off the goal.
   */
  export interface IArm {
    /** How far the reached hand carries the vessel's axis off the asked one, degrees. */
    tilt: number;

    /** The shoulder's flexion, degrees, as the source measures it (`measured`). */
    flexion: number;

    /** The shoulder's abduction, degrees, as the source measures it (`measured`). */
    abduction: number;

    /** How far the forearm's twist lies inside its range, degrees; negative outside. */
    room: number;

    /** The forearm's clinical twist, degrees, pronation positive (`HUMANOID_REST_FRAME`); what `room` is measured from, read by the refusal. */
    twist: number;
  }

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
    side: HumanHand.Side,
    yaw: number,
  ): { flexion: number; abduction: number } {
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
   * @param source Optional same-body FK metadata borrowed through both actual fits and final observation.
   * @param projection Optional genuine same-body ROM projector borrowed by both actual fits.
   * @param base Optional pose of the posture with this arm's goal left out, lent by a search over one posture (`prepareRead`); read only when this arm is the last limb the posture's solve fits and fits alone, and then only the arm is fitted on it.
   * @returns The readings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit, both ways of solving it and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The flexion and the abduction are the source's own measure (`measured`), the twist room the forearm's twist against its own range, and the tilt the asked rotation's up axis read again through the reached rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve, one bone read and four readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The readings are the resolver's fit within the joints' ranges, never the asked goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Keeps the actual arm fit and referred reference fit; canonical selection omits only proven unrelated digit goals and final FK requests upper/lower arm, hand and hip frames. Every direct joint is still admitted, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One local exact reader connects the referred reference, actual canonical fit and demanded FK; a parent may lend same-body FK/genuine ROM metadata. Every current raw goal and authored joint receives the resolver's original admission/fitting without a partial-leg reuse assertion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The four-name demand and lazy exact FK preparation end on synchronous return/throw; the scalar result retains no pose, reader or candidate history.
   */
  export function read(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    goal: IHumanPosture.IGoal,
    referred: boolean,
    axis?: IAutoMovieVector3,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    base?: (posture: IHumanPosture) => IAutoMoviePose,
  ): IArm {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`, `${side}LowerArm`, `${side}Hand`, `${side}UpperLeg`,
    ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    // The posture's limbs are fitted legs first and this arm last when the
    // other arm has no goal and no other limb's goal rides this arm; the
    // rest of the body is then the same for every goal tried on one
    // posture, so a search lends it posed once (`base`) and only the arm is
    // fitted on it, as the posture solve fits it. The referred fit's
    // reference is the same posture's solve of the unreferred goal, so it
    // is that one arm fit on the same base too.
    const only: ((fitted: IHumanPosture.IGoal) => IAutoMoviePose) | undefined =
      base !== undefined && alone(posture.limbs, side)
        ? (fitted: IHumanPosture.IGoal): IAutoMoviePose =>
            HumanLimbFit.fit(body, base(posture), limb, fitted, ["left", "right"],
              undefined, undefined, resolution).pose
        : undefined;
    const attached: IHumanPosture.IGoal = referred
      ? {
          ...goal,
          reference: AutoMovieMotionHumanTouchLaid.reference(
            body,
            posture,
            side,
            goal,
            resolution,
            projection,
            only,
          ),
        }
      : goal;
    const pose: IAutoMoviePose = only !== undefined
      ? only(attached)
      : resolveHumanPosture.seeded(body, {
          ...posture,
          limbs: { ...posture.limbs, [limb]: attached },
        }, undefined, undefined, resolution, requested, projection).pose;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      resolution(),
      requested,
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
        readHumanBone(body, `${side}LowerArm`)?.constraint ?? null,
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
      twist,
    };
  }

  /**
   * Prepare actual arm observations for one synchronous unchanged-body search.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Binds body/side and borrowed rig metadata only until the candidate search returns or throws; each posture/goal/reference/axis still produces an actual numeric reading.
   * @evidence contracts/development/implementation.md#principled-implementation All candidates use one unchanged rig while their goals vary, so native FK/ROM preparation can share without sharing a solved candidate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One genuine FK getter and ROM projector feed the existing read owner; no alternative fit or admission path is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every candidate, referred reference fit, authored projection, IK and physical bound; no time or goal result cache is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Across Q observations one O(B+D) rig preparation replaces Q repetitions, while all actual joint projection, fitting and selected FK remain; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body/side and unchanged rig/canonical mappings establish only metadata equivalence; changed postures/goals still execute read independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search owns one getter/projector until completion or throw; its callback retains no candidate pose, goal or query history and never enters the returned drinking answer.
   */
  export function prepareRead(body: IHumanBody, side: HumanHand.Side):
    (posture: IHumanPosture, goal: IHumanPosture.IGoal, referred: boolean, axis?: IAutoMovieVector3) => IArm {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);

    // The body without this arm, posed once for the posture the search is
    // on: the candidates of one search differ only in this arm's goal.
    let based: { posture: IHumanPosture; pose: IAutoMoviePose } | undefined;
    const base = (posture: IHumanPosture): IAutoMoviePose => {
      if (based === undefined || based.posture !== posture) {
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        delete limbs[`${side}Arm`];
        based = {
          posture,
          pose: resolveHumanPosture.seeded(body, { ...posture, limbs },
            undefined, undefined, resolution, undefined, projection).pose,
        };
      }
      return based.pose;
    };
    return (posture: IHumanPosture, goal: IHumanPosture.IGoal, referred: boolean, axis?: IAutoMovieVector3): IArm =>
      read(body, posture, side, goal, referred, axis, resolution, projection, base);
  }

  /** Whether an arm is the last limb a posture's solve fits and fits alone: the other arm has no goal and no other limb's goal rides a bone of this arm. */
  function alone(limbs: IHumanPosture["limbs"], side: HumanHand.Side): boolean {
    const other: "leftArm" | "rightArm" = side === "left" ? "rightArm" : "leftArm";
    if (limbs[other] !== undefined) return false;
    for (const name of ["leftLeg", "rightLeg"] as const) {
      const on: AutoMovieHumanoidBone | undefined = limbs[name]?.on;
      if (on !== undefined && on.startsWith(side) &&
        /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(on)) return false;
    }
    return true;
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
      AutoMovieMotionHumanTouch.ITouch,
      "body" | "side" | "rest" | "effector" | "held"
    >,
    tipped: (weight: number) => number,
  ): (
    posture: IHumanPosture,
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
      _posture: IHumanPosture,
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
  export function drinks(arm: IArm): boolean {
    return (
      arm.flexion <= FLEXION &&
      arm.abduction <= ABDUCTION &&
      arm.room >= AutoMovieMotionHumanTouchLaid.MARGIN
    );
  }

  /**
   * The arm a search tried that lies least past the drinking range, for its
   * refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The readings and where they were tried, what a refusal reports.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `refused`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The readings are a fitted arm's, never a goal's.
   */
  export interface INearest {
    /** Its fitted arm. */
    arm: IArm;

    /** Where it was tried, in words. */
    at: string;
  }

  /**
   * The nearer of an arm tried and the nearest so far: the one lying less
   * past what `drinks` admits: the flexion's or the abduction's excess over
   * its bound, the forearm twist's shortfall of the margin, or the excess of
   * the vessel's axis over the miss the search admits, the greatest, all in
   * degrees. The shoulder alone ranked an arm whose forearm stood at its
   * twist's end as nearest, though it was refused for that; and without the
   * vessel's axis an arm inside the whole drinking range, refused only
   * because its hand held the vessel 8.9 degrees off the asked axis, ranked
   * with every other such arm at no excess, so the refusal reported the
   * first tried and not the one nearest to drinking.
   *
   * @param nearest The nearest so far; none before the first.
   * @param arm The arm tried.
   * @param at Where it was tried, in words.
   * @param tilt The most the reached axis may lie off the asked one for the search to admit the arm, degrees.
   * @returns The nearer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the comparison, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The searches admit an arm that `drinks` with the vessel's axis within their step, each bound on its own, so an arm lies past admission by the greatest excess, every term in degrees.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A tie keeps the earlier arm; the tilt's bound is the searching caller's own, passed in, not a second constant.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by both drinking searches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function nearer(
    nearest: INearest | undefined,
    arm: IArm,
    at: string,
    tilt: number,
  ): INearest {
    const past = (of: IArm): number =>
      Math.max(
        of.flexion - FLEXION,
        of.abduction - ABDUCTION,
        AutoMovieMotionHumanTouchLaid.MARGIN - of.room,
        of.tilt - tilt,
      );
    return nearest === undefined || past(arm) < past(nearest.arm)
      ? { arm, at }
      : nearest;
  }

  /**
   * The refusal of a vessel no candidate lets the arm drink with.
   *
   * @param side The arm.
   * @param sought What was sought, in words: the leans and turns tried.
   * @param closest The arm tried that lay least past the range (`nearer`); none when no candidate passed the reach-and-range screen to be fitted.
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
    side: HumanHand.Side,
    sought: string,
    closest: INearest | undefined,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis: "facing",
      value: side,
      reason: `no lean of the held vessel toward the face ${sought} lets the ${side} arm bring it to the region as a person drinks, the shoulder flexed at most ${FLEXION.toFixed(1)} and abducted at most ${ABDUCTION.toFixed(1)} degrees and the forearm's twist ${AutoMovieMotionHumanTouchLaid.MARGIN} degrees inside its range ${closest === undefined ? "(no candidate's wrist leaves a reaching elbow in that range)" : `(the arm nearest, ${closest.at}, has the shoulder flexed ${closest.arm.flexion.toFixed(2)} and abducted ${closest.arm.abduction.toFixed(2)} degrees, the forearm's twist at ${closest.arm.twist.toFixed(1)} degrees (pronation positive), ${closest.arm.room.toFixed(1)} inside its range, and the vessel's axis ${closest.arm.tilt.toFixed(1)} degrees off the asked one)`}`,
      fix: "bring the vessel to a region nearer the chin, or take it by a grip the arm can drink from: picked up for its use (`pickUp` with `use`), by its side, or with the other hand",
    });
  }
}

/** How far a reached hand carries the vessel's asked axis, degrees: the asked rotation's axis is the up turned back by it, read again through the reached rotation. */
function angle(
  reached: IAutoMovieQuaternion,
  goal: IHumanPosture.IGoal,
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
