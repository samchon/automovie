import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanFootRelax } from "../../compose/internal/AutoMovieMotionHumanFootRelax";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";

/*
 * The kicking leg of a foot strike: planted until its release, lifted and
 * folded into the chamber, extended through the contact and recoiled to its
 * plant, the knee hint and the foot's attitude carried between keys.
 *
 * The leg is solved once at the chamber and at the contact; every goal between
 * carries the solution of its two keys as its reference, so the fit never takes
 * the other knee between two seconds.
 * Parameter props: The leg's geometry and timing.
 * Returns: The primitive writing the kicking leg.
 */
export function FootStrikeLeg(
  props: FootStrikeLeg.IProps,
): IAutoMovieMotionHumanPrimitive {
  const {
    body,
    pose,
    entry,
    lower,
    side,
    feet,
    release,
    chamber,
    shown,
    recoil,
    duration,
    folded,
    through,
    knee,
    ankle,
    rotation,
    lead,
    meet,
    reachable,
  }: FootStrikeLeg.IProps = props;
  // The kicking foot leaves from its planted place, attitude and knee
  // hint (the stance's own, `StrikingStance.legs`), rises before it
  // travels, and on the way back travels before it sets down.
  const start: IAutoMovieVector3 = feet[side].ankle;
  const startBend: IAutoMovieVector3 = StrikingStance.legs(body, feet)[
    `${side}Leg`
  ]!.bend;
  const raised: typeof FootStrikeLeg.raised = FootStrikeLeg.raised;
  const extend: number = (shown - chamber) / meet;
  const limb: `${AutoMovieHumanSide}Leg` = `${side}Leg`;

  // The leg is solved once at the chamber and at the contact; every goal
  // between carries the solution of its two keys as its reference
  // (`IAutoMovieHumanLimbGoal.reference`), so the fit never takes the
  // other knee between two seconds, and the foot turns between the
  // keys' own attitudes: free at the chamber, the form's at the contact.
  const solve = (
    seconds: number,
    goal: Pick<IAutoMovieHumanLimbGoal, FootStrikeLegSolveGoal>,
  ): IKey => {
    const pose: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture(
      body,
      {
        ...lower.write(entry, seconds),
        limbs: {
          ...lower.write(entry, seconds).limbs,
          [limb]: { ...goal, planted: false },
        },
      },
    );
    return {
      reference: HumanLimbFit.reference(pose, limb),
      attitude: poseBones(
        body,
        pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}Foot`]),
      ).get(`${side}Foot`)!.worldRotation,
      ankle: ankleOf(pose),
    };
  };
  function ankleOf(
    FootStrikeLeg: IAutoMoviePose,
  ): readonly [number, number, number] {
    const j: IAutoMovieJointPose | undefined = FootStrikeLeg.joints.find(
      (q: IAutoMovieJointPose): boolean => q.bone === `${side}Foot`,
    );
    return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
  }
  const rest: IKey = {
    reference: HumanLimbFit.reference(pose, limb),
    attitude: feet[side].rotation,
    ankle: ankleOf(pose),
  };
  const cocked: IKey = solve(chamber, {
    point: folded,
    bend: knee,
  });
  const struck: IKey = solve(shown, {
    point: ankle,
    bend: knee,
    rotation,
  });
  const between = (a: IKey, b: IKey, s: number): IKey => ({
    reference: {
      upper: blendHumanJoint(
        body,
        `${side}UpperLeg`,
        a.reference.upper,
        b.reference.upper,
        s,
      ),
      lower: blendHumanJoint(
        body,
        `${side}LowerLeg`,
        a.reference.lower,
        b.reference.lower,
        s,
      ),
    },
    attitude: Quaternion.slerp(a.attitude, b.attitude, s),
    ankle: [
      a.ankle[0] + (b.ankle[0] - a.ankle[0]) * s,
      a.ankle[1] + (b.ankle[1] - a.ankle[1]) * s,
      a.ankle[2] + (b.ankle[2] - a.ankle[2]) * s,
    ],
  });
  const leg: IAutoMovieMotionHumanPrimitive = {
    channels: [limb],
    from: 0,
    to: duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      let point: IAutoMovieVector3;
      let bend: IAutoMovieVector3;
      let key: IKey;
      // Whether the foot is still rising off the floor or already setting
      // down on it: the first `lead` share of the rise, the last of the
      // recoil, where it rises before it travels and travels before it sets
      // down.
      let floorward: boolean = false;
      if (seconds <= release) {
        point = start;
        bend = startBend;
        key = rest;
      } else if (seconds <= chamber) {
        const raw: number = (seconds - release) / (chamber - release);
        const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(raw);
        point = raised(
          start,
          folded,
          AutoMovieEngineMotionSampling.minimumJerkShare((raw - lead) / (1 - lead)),
          s,
        );
        bend = Vector3.lerp(startBend, knee, s);
        key = between(rest, cocked, s);
        floorward = raw < lead;
      } else if (seconds <= shown) {
        const s: number = AutoMovieEngineMotionSampling.minimumJerkShare((seconds - chamber) / extend);
        point = Vector3.lerp(folded, through, s);
        bend = knee;
        key = between(cocked, struck, Math.min(1, s / AutoMovieEngineMotionSampling.minimumJerkShare(meet)));
      } else {
        const raw: number = (seconds - shown) / recoil;
        const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(raw);
        point = raised(ankle, start, AutoMovieEngineMotionSampling.minimumJerkShare(raw / (1 - lead)), s);
        bend = Vector3.lerp(knee, startBend, s);
        key = between(struck, rest, s);
        floorward = raw > 1 - lead;
      }
      // Planted, the foot keeps its world attitude. Off the floor its ankle
      // carries the keys' own angles, blended as the hip and the knee are,
      // relative to the shank: a world attitude asked of an airborne foot
      // made the fit turn the whole leg wherever the ankle met its range
      // (the foot flipping 95 degrees in a frame), and the keys' angles are
      // the fit's own, inside the range.
      // Near the floor, rising or setting down, the foot keeps its world
      // attitude level with it, turned toes down only as the passive dorsal
      // range asks (`AutoMovieMotionHumanFootRelax`), so the toes leave and
      // meet the floor flat instead of pitching with the shank across it.
      if (seconds <= release || floorward)
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [limb]: {
              point,
              bend,
              rotation:
                seconds <= release
                  ? key.attitude
                  : AutoMovieMotionHumanFootRelax(
                      body,
                      posture,
                      side,
                      { ankle: point, rotation: key.attitude },
                      0,
                      false,
                    ).rotation,
              reference: key.reference,
              planted: seconds <= release,
            },
          },
        };
      // An airborne goal the hip cannot lift the thigh to is turned down
      // into its reach, so the fit never meets the range's edge, where two
      // clamped branches of the hip answer the same goal and the leg flips
      // between them from one frame to the next.
      return {
        ...posture,
        joints: { ...posture.joints, [`${side}Foot`]: key.ankle },
        limbs: {
          ...posture.limbs,
          [limb]: {
            point: reachable === undefined ? point : reachable(point, seconds),
            bend,
            reference: key.reference,
            planted: false,
          },
        },
      };
    },
  };
  return leg;
}
/*
 * Companion types of FootStrikeLeg.
 */
export namespace FootStrikeLeg {
  /*
   * A foot raised between two points: along the floor by one share, up by
   * another, so the foot can lift before it travels.
   * Parameter from: Where it starts, world metres.
   * Parameter to: Where it goes, world metres.
   * Parameter level: The share of the level travel.
   * Parameter height: The share of the rise.
   * Returns: The point, world metres.
   */
  export function raised(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    level: number,
    height: number,
  ): IAutoMovieVector3 {
    return {
      x: from.x + (to.x - from.x) * level,
      y: from.y + (to.y - from.y) * height,
      z: from.z + (to.z - from.z) * level,
    };
  }

  /*
   * The kicking leg's geometry and timing.
   */
  export interface IProps {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The entry's resolved pose.
     */
    pose: IAutoMoviePose;

    /*
     * The entry posture.
     */
    entry: IAutoMovieMotionHumanPosture;

    /*
     * The lower body's primitive, which the keys are solved on.
     */
    lower: IAutoMovieMotionHumanPrimitive;

    /*
     * The kicking side.
     */
    side: AutoMovieHumanSide;

    /*
     * The entry's feet.
     */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /*
     * When the foot leaves the floor, seconds.
     */
    release: number;

    /*
     * When the chamber is reached, seconds.
     */
    chamber: number;

    /*
     * The contact, seconds.
     */
    shown: number;

    /*
     * The recoil's length, seconds.
     */
    recoil: number;

    /*
     * The action's length, seconds.
     */
    duration: number;

    /*
     * The ankle's place at the chamber.
     */
    folded: IAutoMovieVector3;

    /*
     * The point the extension aims through, past the contact.
     */
    through: IAutoMovieVector3;

    /*
     * The knee's hint at the chamber and the contact.
     */
    knee: IAutoMovieVector3;

    /*
     * The ankle's place at the contact.
     */
    ankle: IAutoMovieVector3;

    /*
     * The foot's attitude at the contact.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The share of the foot's rise it leads its travel by.
     */
    lead: number;

    /*
     * The share of the extension unit at which the foot meets the target.
     */
    meet: number;

    /*
     * An airborne ankle goal at a second brought inside the hip's reach
     * (`FootStrikeTilt.chambered`); the goal unchanged when absent.
     */
    reachable?: (
      point: IAutoMovieVector3,
      seconds: number,
    ) => IAutoMovieVector3;
  }
}

/*
 * The kicking leg's solution at a key of the strike.
 */
interface IKey {
  /*
   * The leg's reference solution there.
   */
  reference: IAutoMovieHumanLimbReference;

  /*
   * The foot's world attitude there.
   */
  attitude: IAutoMovieQuaternion;

  /*
   * The ankle's clinical angles there, degrees.
   */
  ankle: readonly [number, number, number];
}

/*
 * The alternatives of `FootStrikeLegSolveGoal`'s site.
 */
type FootStrikeLegSolveGoal = "point" | "bend" | "rotation";
