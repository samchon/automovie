import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";

/** The kicking leg's solution at a key of the strike. */
interface IKey {
  /** The leg's reference solution there. */
  reference: IAutoMovieHumanLimbReference;

  /** The foot's world attitude there. */
  attitude: IAutoMovieQuaternion;
}

/**
 * The kicking leg of a foot strike: planted until its release, lifted and
 * folded into the chamber, extended through the contact and recoiled to its
 * plant, the knee hint and the foot's attitude carried between keys.
 *
 * The leg is solved once at the chamber and at the contact; every goal
 * between carries the solution of its two keys as its reference, so the fit
 * never takes the other knee between two seconds.
 *
 * @param props The leg's geometry and timing.
 * @returns The primitive writing the kicking leg.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases and how the keys anchor the fit.
 * @evidence contracts/development/implementation.md#principled-implementation Two solved keys and the entry's own solution, blended as joint rotations, anchor every goal; the foot rises before it travels and travels before it sets down.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keys first, then one phase branch per second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The contact goal is the law's; an airborne foot is only turned toes down by the shared relax's closed form where the passive dorsal range asks.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two limb solves per plan; each second blends two references.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stance's knee hint, the posture resolver's references and the joint blend.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains its keys until plan release.
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
  }: FootStrikeLeg.IProps = props;
  // The kicking foot leaves from its planted place, attitude and knee
  // hint (the stance's own, `StrikingStance.legs`), rises before it
  // travels, and on the way back travels before it sets down.
  const start: IAutoMovieVector3 = feet[side].ankle;
  const startBend: IAutoMovieVector3 = StrikingStance.legs(body, feet)[
    `${side}Leg`
  ]!.bend;
  const raised = (
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    level: number,
    height: number,
  ): IAutoMovieVector3 => ({
    x: from.x + (to.x - from.x) * level,
    y: from.y + (to.y - from.y) * height,
    z: from.z + (to.z - from.z) * level,
  });
  const extend: number = (shown - chamber) / meet;
  const limb: `${AutoMovieHumanSide}Leg` = `${side}Leg`;

  // The leg is solved once at the chamber and at the contact; every goal
  // between carries the solution of its two keys as its reference
  // (`IAutoMovieHumanLimbGoal.reference`), so the fit never takes the
  // other knee between two seconds, and the foot turns between the
  // keys' own attitudes: free at the chamber, the form's at the contact.
  const solve = (
    seconds: number,
    goal: Pick<IAutoMovieHumanLimbGoal, "point" | "bend" | "rotation">,
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
      reference: resolveHumanPosture.reference(pose, limb),
      attitude: poseBones(
        body,
        pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}Foot`]),
      ).get(`${side}Foot`)!.worldRotation,
    };
  };
  const rest: IKey = {
    reference: resolveHumanPosture.reference(pose, limb),
    attitude: feet[side].rotation,
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
      if (seconds <= release) {
        point = start;
        bend = startBend;
        key = rest;
      } else if (seconds <= chamber) {
        const raw: number = (seconds - release) / (chamber - release);
        const s: number = minimumJerk.share(raw);
        point = raised(
          start,
          folded,
          minimumJerk.share((raw - lead) / (1 - lead)),
          s,
        );
        bend = Vector3.lerp(startBend, knee, s);
        key = between(rest, cocked, s);
      } else if (seconds <= shown) {
        const s: number = minimumJerk.share((seconds - chamber) / extend);
        point = Vector3.lerp(folded, through, s);
        bend = knee;
        key = between(cocked, struck, Math.min(1, s / minimumJerk.share(meet)));
      } else {
        const raw: number = (seconds - shown) / recoil;
        const s: number = minimumJerk.share(raw);
        point = raised(ankle, start, minimumJerk.share(raw / (1 - lead)), s);
        bend = Vector3.lerp(knee, startBend, s);
        key = between(struck, rest, s);
      }
      // A foot off the floor bears nothing, so it turns toes down about its
      // ankle until its shank's lean leaves it within the passive dorsal
      // range (`AutoMovieMotionHumanFootRelax`): the attitude blended between
      // keys stays level while the knee folds, and the folding shank leaned
      // it to the ankle's full 39 degrees.
      const attitude: IAutoMovieQuaternion =
        seconds <= release
          ? key.attitude
          : AutoMovieMotionHumanFootRelax.of(
              body,
              posture,
              side,
              { ankle: point, rotation: key.attitude },
              0,
              false,
            ).rotation;
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [limb]: {
            point,
            bend,
            rotation: attitude,
            reference: key.reference,
            planted: seconds <= release,
          },
        },
      };
    },
  };
  return leg;
}

/**
 * Companion types of {@link FootStrikeLeg}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
 * @evidence contracts/development/design.md#principled-representation World metres, action seconds and shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the foot strike law hands its kicking leg.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's vector, quaternion, pose and primitive types.
 */
export namespace FootStrikeLeg {
  /** The kicking leg's geometry and timing. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The entry's resolved pose. */
    pose: IAutoMoviePose;

    /** The entry posture. */
    entry: IAutoMovieMotionHumanPosture;

    /** The lower body's primitive, which the keys are solved on. */
    lower: IAutoMovieMotionHumanPrimitive;

    /** The kicking side. */
    side: AutoMovieHumanSide;

    /** The entry's feet. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** When the foot leaves the floor, seconds. */
    release: number;

    /** When the chamber is reached, seconds. */
    chamber: number;

    /** The contact, seconds. */
    shown: number;

    /** The recoil's length, seconds. */
    recoil: number;

    /** The action's length, seconds. */
    duration: number;

    /** The ankle's place at the chamber. */
    folded: IAutoMovieVector3;

    /** The point the extension aims through, past the contact. */
    through: IAutoMovieVector3;

    /** The knee's hint at the chamber and the contact. */
    knee: IAutoMovieVector3;

    /** The ankle's place at the contact. */
    ankle: IAutoMovieVector3;

    /** The foot's attitude at the contact. */
    rotation: IAutoMovieQuaternion;

    /** The share of the foot's rise it leads its travel by. */
    lead: number;

    /** The share of the extension unit at which the foot meets the target. */
    meet: number;
  }
}
