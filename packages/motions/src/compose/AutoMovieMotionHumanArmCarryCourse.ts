import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmClearing } from "../posture/HumanArmClearing";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/** An arm's blended joint triples at a unitless share. */
type Arm = (share: number) => IAutoMovieMotionHumanArmClearance.IArm;

/**
 * Prepare or evaluate the correction of a joint-space arm carry. The live carry
 * takes the current solved arm and planning pose. A fixed course owns endpoint
 * triples, the arrival clearance geometry and its correction knots.
 */
export namespace AutoMovieMotionHumanArmCarryCourse {
  /**
   * Prepare a carry whose selected arms are set directly to the same arrival
   * triples on every source posture and have no limb goals at any share. The
   * law supplies an invariant arrival posture and still owns the actual posture
   * at each second, including its changing fingers.
   */
  export function fixed(
    body: IAutoMovieMotionHumanBody,
    arrival: IAutoMovieMotionHumanPosture,
    from: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    sides: readonly AutoMovieHumanSide[],
  ): (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ) => IAutoMovieMotionHumanPosture {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      arrival,
      undefined,
      undefined,
      resolution,
    ).pose;
    const course: ReturnType<typeof arms> = arms(
      body,
      sides,
      from,
      pose,
      pose,
      arrival.limbs,
      resolution,
      true,
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
    ): IAutoMovieMotionHumanPosture => {
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
      for (const side of sides) {
        const arm: IAutoMovieMotionHumanArmClearance.IArm =
          course[side]!(share);
        joints[`${side}UpperArm`] = arm.upper;
        joints[`${side}LowerArm`] = arm.lower;
        joints[`${side}Hand`] = arm.hand;
      }
      return { ...posture, joints };
    };
  }

  /**
   * Build the arm courses from the exact goals and plan pose. With fixed input
   * the plans are compiled before return. Otherwise the readers are scoped to
   * one current carry evaluation.
   */
  export function arms(
    body: IAutoMovieMotionHumanBody,
    sides: readonly AutoMovieHumanSide[],
    from: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    solved: IAutoMoviePose,
    planning: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    fixed: boolean = false,
  ): Partial<Record<AutoMovieHumanSide, Arm>> {
    // Each carried arm at a share of the carry: the plain blend of its two
    // ends, and its course, the blend kept clear. An arm's course at a share
    // is solved in the pose every other carried arm has at that same share
    // (an earlier arm on its course, a later one on its plain blend), so two
    // arms that travel together keep clear of each other as they are shown,
    // and a course does not depend on the instant it is read at.

    const plains: Partial<Record<AutoMovieHumanSide, Arm>> = {};
    const courses: Partial<Record<AutoMovieHumanSide, Arm>> = {};
    const prepare: (() => void)[] = [];
    for (const side of sides) {
      const held: IAutoMovieMotionHumanArmAngles.IAngles = from[side]!;
      const goal: IAutoMovieMotionHumanArmAngles.IAngles =
        AutoMovieMotionHumanArmAngles.angles(solved, side);
      const blended: (to: IAutoMovieMotionHumanArmAngles.IAngles) => Arm = (
        to: IAutoMovieMotionHumanArmAngles.IAngles,
      ): Arm => {
        const upper: ReturnType<typeof blendHumanJoint.between> =
          blendHumanJoint.between(
            body,
            `${side}UpperArm`,
            held.upper,
            to.upper,
          );
        const lower: ReturnType<typeof blendHumanJoint.between> =
          blendHumanJoint.between(
            body,
            `${side}LowerArm`,
            held.lower,
            to.lower,
          );
        const hand: ReturnType<typeof blendHumanJoint.between> =
          blendHumanJoint.between(body, `${side}Hand`, held.hand, to.hand);
        return (share: number): IAutoMovieMotionHumanArmClearance.IArm => ({
          upper: upper(share),
          lower: lower(share),
          hand: hand(share),
        });
      };
      const plain: Arm = blended(goal);
      plains[side] = plain;
      const aimed: IAutoMovieMotionHumanArmAngles.IAngles =
        planning === solved
          ? goal
          : AutoMovieMotionHumanArmAngles.angles(planning, side);
      const plan: Arm = planning === solved ? plain : blended(aimed);
      const others: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
        limbs[`${side}Arm`]?.clear ?? [];
      const posed: Map<number, IAutoMoviePose> = new Map();
      const pose = (share: number): IAutoMoviePose => {
        let at: IAutoMoviePose | undefined = posed.get(share);
        if (at === undefined) {
          at = planning;
          // Read after every arm's blend and course exist; an earlier arm
          // is on its course, a later one on its plain blend, so no two
          // courses wait on each other.
          for (const other of sides)
            if (other !== side)
              at = HumanArmClearance.posed(
                at,
                other,
                (sides.indexOf(other) < sides.indexOf(side)
                  ? courses[other]!
                  : plains[other]!)(share),
              );
          posed.set(share, at);
        }
        return at;
      };
      // Each of the room's two readings keeps the share's blend of its own
      // two ends: the depth an end's upper arm lies in the chest is not
      // room for the forearm on the way.
      const reading = (
        of: IAutoMovieMotionHumanArmClearance.IArm,
        share: number,
        fingers?: IAutoMovieMotionHumanArmAngles.IAngles["fingers"],
      ): IAutoMovieMotionHumanArmClearance.IBaseline =>
        HumanArmClearance.baseline(
          body,
          fingers === undefined
            ? pose(share)
            : HumanArmClearance.fingered(pose(share), side, fingers),
          side,
          of,
          others,
          resolution(),
        );
      let ends:
        | readonly [
            IAutoMovieMotionHumanArmClearance.IBaseline,
            IAutoMovieMotionHumanArmClearance.IBaseline,
          ]
        | undefined;
      const known: Map<number, IAutoMovieMotionHumanArmClearance.IArm> =
        new Map();
      // Between two arms that clear the body the blended one may not, so its
      // elbow is let out by as much as the forearm lacks; each end keeps the
      // room it holds, so the carry leaves and joins them without a step.
      // The turn is one course over the carry (`HumanArmClearing.course`),
      // so two neighbouring instants read neighbouring arms.
      const clear: Parameters<typeof HumanArmClearing.course>[0]["clear"] = (
        of: IAutoMovieMotionHumanArmClearance.IArm,
        key: number,
      ): IAutoMovieMotionHumanArmClearance.IArm => {
        ends ??= [reading(held, 0, held.fingers), reading(aimed, 1)];
        // Beside the arrival a key may keep at least the arrival's own room,
        // so the place's contact is never read as room to clear.
        const beside = (from: number, to: number): number =>
          key > HumanArmClearing.BESIDE
            ? Math.max(from * (1 - key) + to * key, to)
            : from * (1 - key) + to * key;
        // The fingers as the carry shows them at the key, on their way from
        // the held shape to the place's, so the room read is the room of
        // the hand that is drawn.
        return HumanArmClearance.cleared(
          body,
          fingersAt(pose(key), side, held.fingers, aimed.fingers, key),
          side,
          of,
          0,
          others,
          {
            forearm: beside(ends[0].forearm, ends[1].forearm),
            segments: beside(ends[0].segments, ends[1].segments),
          },
          resolution,
        );
      };
      const inputs: Parameters<typeof HumanArmClearing.prepareCourse>[0] = {
        plain,
        planned: plan,
        clear,
      };
      courses[side] = (
        share: number,
      ): IAutoMovieMotionHumanArmClearance.IArm => {
        let arm: IAutoMovieMotionHumanArmClearance.IArm | undefined =
          known.get(share);
        if (arm === undefined) {
          arm = HumanArmClearing.course({ ...inputs, share });
          known.set(share, arm);
        }
        return arm;
      };
      if (fixed)
        prepare.push((): void => {
          courses[side] = HumanArmClearing.prepareCourse(inputs);
        });
    }
    for (const compile of prepare) compile();
    return courses;
  }
}

/** A hand's finger angles at a share of the carry, read on a pose. */
type Fingers = IAutoMovieMotionHumanArmAngles.IAngles["fingers"];

/**
 * A pose with one hand's fingers at a share of their way from the held shape to
 * the arrival's, each angle blended by the share as the carry shapes them; the
 * pose unchanged where either shape is not known.
 */
function fingersAt(
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
  from: Fingers,
  to: Fingers,
  share: number,
): IAutoMoviePose {
  if (from === undefined || to === undefined) return pose;
  const blended: Partial<Record<AutoMovieHumanoidBone, Triple>> = {};
  for (const bone of Object.keys(to) as AutoMovieHumanoidBone[]) {
    const a: Triple | undefined = from[bone];
    const b: Triple | undefined = to[bone];
    if (a === undefined || b === undefined) continue;
    blended[bone] = [
      a[0] + (b[0] - a[0]) * share,
      a[1] + (b[1] - a[1]) * share,
      a[2] + (b[2] - a[2]) * share,
    ];
  }
  return HumanArmClearance.fingered(pose, side, blended);
}

/** One joint's clinical angles, degrees. */
type Triple = readonly [number, number, number];
