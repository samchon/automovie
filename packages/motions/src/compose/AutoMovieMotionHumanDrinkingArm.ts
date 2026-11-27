import { Quaternion, Vector3, rotationBetween, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDrinkingArm,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanTouch,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/internal/readHumanBone";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { isHumanArmAlone } from "../posture/internal/isHumanArmAlone";
import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";
import { HumanTouchArmReference } from "./HumanTouchArmReference";
import { measureDrinkingShoulder } from "./internal/measureDrinkingShoulder";

/** The alternatives of `CarriedTouch`'s site. */
type CarriedTouch = "body" | "side" | "rest" | "effector" | "held";

/** The record of `IPrepareReadBased`'s site. */
type IPrepareReadBased = {
  posture: IAutoMovieMotionHumanPosture;
  pose: IAutoMoviePose;
};

/** The alternatives of `ReadLimb`'s site. */
type ReadLimb = "leftArm" | "rightArm";

/**
 * The arm a held vessel is brought to the lips with, read as a person drinks:
 * the arm the resolver fits for a goal, read on its displayed bones, and
 * whether it holds the posture of drinking from a glass, its shoulder flexed
 * and abducted within the range healthy drinkers use (Alt Murphy, Sunnerhagen,
 * Johnels and Willén 2006, J NeuroEng Rehabil 3:18, Table 2, twenty healthy
 * controls; the table of Murphy, Willén and Sunnerhagen 2011, Neurorehabil
 * Neural Repair 25:71, was not read), and the hand's attitude on the way there.
 * `AutoMovieMotionHumanTouchUpright` searches a vessel's facing and
 * `AutoMovieMotionHumanTouchDrink` its lean by it, and the touch stroke carries
 * a held vessel by its attitude.
 */
export namespace AutoMovieMotionHumanDrinkingArm {
  /**
   * The most the shoulder is flexed while the vessel is at the face, degrees:
   * the healthy drinkers' greatest flexion in the drinking phase, 53.5 ± 7.0
   * (Alt Murphy et al. 2006, Table 2), plus two standard deviations, the range
   * about 95 % of a normal population lies within.
   */
  export const FLEXION: number = 53.5 + 2 * 7.0;

  /**
   * The most the shoulder is abducted while the vessel is at the face, degrees:
   * the healthy drinkers' greatest abduction in the drinking phase, 39.3 ± 13.0
   * (Alt Murphy et al. 2006, Table 2), plus two standard deviations, the range
   * about 95 % of a normal population lies within.
   */
  export const ABDUCTION: number = 39.3 + 2 * 13.0;

  /** The sagittal and frontal shoulder angles used by the drinking bounds. */
  export const measured: typeof measureDrinkingShoulder =
    measureDrinkingShoulder;

  /**
   * The arm the resolver fits for a goal, read on its displayed bones.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param goal The arm's goal, whose rotation lays the vessel's axis.
   * @param referred Whether the fit is held to the goal's own reference
   *   (`AutoMovieMotionHumanTouchLaid.reference`), as a touch stroke holds it,
   *   or fitted on the posture alone.
   * @param axis The vessel's axis in the hand's frame, whose reached direction
   *   the tilt measures against the asked one; without it the tilt is how far
   *   the reached hand carries the direction the goal stands on the world's
   *   up.
   * @param source Optional same-body FK metadata borrowed through both actual
   *   fits and final observation.
   * @param projection Optional genuine same-body ROM projector borrowed by both
   *   actual fits.
   * @param base Optional pose of the posture with this arm's goal left out,
   *   lent by a search over one posture (`prepareRead`); read only when this
   *   arm is the last limb the posture's solve fits and fits alone, and then
   *   only the arm is fitted on it.
   * @returns The readings.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    goal: IAutoMovieHumanLimbGoal,
    referred: boolean,
    axis?: IAutoMovieVector3,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    base?: (posture: IAutoMovieMotionHumanPosture) => IAutoMoviePose,
    select?: SelectReference,
  ): IObservation {
    const limb: ReadLimb = `${side}Arm`;
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        `${side}UpperArm`,
        `${side}LowerArm`,
        `${side}Hand`,
        `${side}UpperLeg`,
      ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    // The posture's limbs are fitted legs first and this arm last when the
    // other arm has no goal and no other limb's goal rides this arm; the
    // rest of the body is then the same for every goal tried on one
    // posture, so a search lends it posed once (`base`) and only the arm is
    // fitted on it, as the posture solve fits it. The referred fit's
    // reference is the same posture's solve of the unreferred goal, so it
    // is that one arm fit on the same base too.
    const lent:
      | ((posture: IAutoMovieMotionHumanPosture) => IAutoMoviePose)
      | undefined = isHumanArmAlone(posture.limbs, side) ? base : undefined;
    const only:
      | ((fitted: IAutoMovieHumanLimbGoal) => IAutoMoviePose)
      | undefined =
      lent === undefined
        ? undefined
        : (fitted: IAutoMovieHumanLimbGoal): IAutoMoviePose =>
            HumanLimbFit.fit(
              body,
              lent(posture),
              limb,
              fitted,
              ["left", "right"],
              undefined,
              undefined,
              resolution,
            ).pose;
    const attached: IAutoMovieHumanLimbGoal = referred
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
    const pose: IAutoMoviePose =
      only !== undefined
        ? only(attached)
        : resolveHumanPosture.seeded(
            body,
            {
              ...posture,
              limbs: { ...posture.limbs, [limb]: attached },
            },
            undefined,
            undefined,
            resolution,
            requested,
            projection,
          ).pose;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      resolution(),
      requested,
    );
    const shoulder: IAutoMovieMotionHumanDrinkingArm.IMeasuredResult = measured(
      bones,
      side,
      posture.yaw,
    );
    const twist: number =
      pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === `${side}LowerArm`,
      )?.twist ?? 0;
    const range: IAutoMovieAngleRange | null =
      AutoMovieEngineKinematics.getConstraint(
        `${side}LowerArm`,
        readHumanBone(body, `${side}LowerArm`)?.constraint ?? null,
      )?.twist ?? null;
    const arm: IObservation = {
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
    // Only the independent-arm solve has the exact same dependency set as
    // the reference fit. Other postures keep their full reference solve.
    if (only !== undefined && !referred && select?.(arm))
      arm.reference = HumanTouchArmReference.boundedReference(
        body,
        side,
        HumanLimbFit.reference(pose, limb),
      );
    return arm;
  }

  interface IObservation extends IAutoMovieMotionHumanDrinkingArm.IArm {
    reference?: IAutoMovieHumanLimbReference;
  }

  type SelectReference = (
    arm: IAutoMovieMotionHumanDrinkingArm.IArm,
  ) => boolean;

  /** Prepare actual arm observations for one synchronous unchanged-body search. */
  export function prepareRead(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    goal: IAutoMovieHumanLimbGoal,
    referred: boolean,
    axis?: IAutoMovieVector3,
    select?: SelectReference,
  ) => IObservation {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);

    // The body without this arm, posed once for the posture the search is
    // on: the candidates of one search differ only in this arm's goal.
    let based: IPrepareReadBased | undefined;
    const base = (posture: IAutoMovieMotionHumanPosture): IAutoMoviePose => {
      if (based === undefined || based.posture !== posture) {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        delete limbs[`${side}Arm`];
        based = {
          posture,
          pose: resolveHumanPosture.seeded(
            body,
            { ...posture, limbs },
            undefined,
            undefined,
            resolution,
            undefined,
            projection,
          ).pose,
        };
      }
      return based.pose;
    };
    return (
      posture: IAutoMovieMotionHumanPosture,
      goal: IAutoMovieHumanLimbGoal,
      referred: boolean,
      axis?: IAutoMovieVector3,
      select?: SelectReference,
    ): IObservation =>
      read(
        body,
        posture,
        side,
        goal,
        referred,
        axis,
        resolution,
        projection,
        base,
        select,
      );
  }

  /**
   * The hand's world rotation on the way to a vessel's place and back
   * (`AutoMovieMotionHumanArm.ICarry.attitude`): the hand the carry's blend
   * gives, turned by the shortest arc that brings the vessel's axis onto the
   * axis asked at that second. The touch's goal holds the vessel leaned as at
   * the lips, so the arm is carried toward the arm that drinks; the vessel
   * shows the share of the lean its goal's end shows (the goal as its fit
   * reaches it) that `tipped` gives at the carry's weight, from upright (none
   * until the last `AutoMovieMotionHumanTouch.TIP` of the way). The asked axis
   * is the one the held end shows, turned toward that along their shortest arc
   * by the carry's weight: a glass held upright stays upright until it tips at
   * the lips, a hand hanging with an implied vessel turns it up as the arm
   * rises instead of turning over in the frame the carry leaves it, and the
   * hand joins the fit at the lips without the step the fit's own reach (a few
   * degrees short of the asked lean) would leave if the goal's asked axis were
   * sought. The swing is removed and the blend's twist about the axis kept (a
   * swing-twist split), so the arm is asked no more than the axis needs. A
   * blend of the wrist's angles does not hold a world attitude, since the
   * forearm turns under the hand on the way.
   *
   * @param touch The touch: its body, hand, effector and held rotation. The
   *   vessel's axis in the hand is the one its held rotation stands upright, or
   *   without one the effector's along axis, which an upright lay stands on the
   *   world's up.
   * @param tipped The share of the lean at the goal's end the vessel shows at a
   *   weight of the carry, in [0, 1].
   * @returns The rotation at a posture, a second, the blend's hand rotation,
   *   the two ends' and the carry's weight, world.
   */
  export function carried(
    touch: Pick<IAutoMovieMotionHumanTouch.ITouch, CarriedTouch>,
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
   * flexed at most `FLEXION` and abducted at most `ABDUCTION`, the forearm's
   * twist `AutoMovieMotionHumanTouchLaid.MARGIN` inside its range.
   *
   * @param arm The readings.
   * @returns Whether it drinks.
   */
  export function drinks(arm: IAutoMovieMotionHumanDrinkingArm.IArm): boolean {
    return (
      arm.flexion <= FLEXION &&
      arm.abduction <= ABDUCTION &&
      arm.room >= AutoMovieMotionHumanTouchLaid.MARGIN
    );
  }

  /**
   * The nearer of an arm tried and the nearest so far: the one lying less past
   * what `drinks` admits: the flexion's or the abduction's excess over its
   * bound, the forearm twist's shortfall of the margin, or the excess of the
   * vessel's axis over the miss the search admits, the greatest, all in
   * degrees. The shoulder alone ranked an arm whose forearm stood at its
   * twist's end as nearest, though it was refused for that; and without the
   * vessel's axis an arm inside the whole drinking range, refused only because
   * its hand held the vessel 8.9 degrees off the asked axis, ranked with every
   * other such arm at no excess, so the refusal reported the first tried and
   * not the one nearest to drinking.
   *
   * @param nearest The nearest so far; none before the first.
   * @param arm The arm tried.
   * @param at Where it was tried, in words.
   * @param tilt The most the reached axis may lie off the asked one for the
   *   search to admit the arm, degrees.
   * @returns The nearer.
   */
  export function nearer(
    nearest: IAutoMovieMotionHumanDrinkingArm.INearest | undefined,
    arm: IAutoMovieMotionHumanDrinkingArm.IArm,
    at: string,
    tilt: number,
  ): IAutoMovieMotionHumanDrinkingArm.INearest {
    const past = (of: IAutoMovieMotionHumanDrinkingArm.IArm): number =>
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
   * @param closest The arm tried that lay least past the range (`nearer`); none
   *   when no candidate passed the reach-and-range screen to be fitted.
   * @returns The refusal.
   */
  export function refused(
    side: AutoMovieHumanSide,
    sought: string,
    closest: IAutoMovieMotionHumanDrinkingArm.INearest | undefined,
  ): IAutoMovieMotionHumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis: "facing",
      value: side,
      reason: `no lean of the held vessel toward the face ${sought} lets the ${side} arm bring it to the region as a person drinks, the shoulder flexed at most ${FLEXION.toFixed(1)} and abducted at most ${ABDUCTION.toFixed(1)} degrees and the forearm's twist ${AutoMovieMotionHumanTouchLaid.MARGIN} degrees inside its range ${closest === undefined ? "(no candidate's wrist leaves a reaching elbow in that range)" : `(the arm nearest, ${closest.at}, has the shoulder flexed ${closest.arm.flexion.toFixed(2)} and abducted ${closest.arm.abduction.toFixed(2)} degrees, the forearm's twist at ${closest.arm.twist.toFixed(1)} degrees (pronation positive), ${closest.arm.room.toFixed(1)} inside its range, and the vessel's axis ${closest.arm.tilt.toFixed(1)} degrees off the asked one)`}`,
      fix: "bring the vessel to a region nearer the chin, or take it by a grip the arm can drink from: picked up for its use (`pickUp` with `use`), by its side, or with the other hand",
    });
  }
}

/**
 * How far a reached hand carries the vessel's asked axis, degrees: the asked
 * rotation's axis is the up turned back by it, read again through the reached
 * rotation.
 */
function angle(
  reached: IAutoMovieQuaternion,
  goal: IAutoMovieHumanLimbGoal,
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
