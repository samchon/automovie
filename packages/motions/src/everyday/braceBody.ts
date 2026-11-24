import { ROM_TOLERANCE, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { rangeSteppingFoot } from "../actions/rangeSteppingFoot";
import type { stand } from "../actions/stand";
import { walkLeg } from "../actions/walkLeg";
import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { prepareHumanPostureCorrection } from "../compose/prepareHumanPostureCorrection";
import type { HumanPhysics } from "../law/HumanPhysics";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";
import { HumanTrunk } from "./HumanTrunk";
import type { prepareGroundedBalance } from "./prepareGroundedBalance";

/**
 * A brace's posture without its arms at a second (`brace.plan`): the root, lean
 * and legs on the set curve, balanced over the bearing feet, the rear foot
 * unloaded over the preparatory shift and loaded again on landing, and the
 * hands opened flat once the brace begins. Read from the plan's body, set
 * curve, feet and balance.
 *
 * @param scope What the plan's body posture is read from.
 * @returns The posture without its arms at a second.
 */
export function braceBody(scope: braceBody.IScope): braceBody.BodyAt {
  const {
    body,
    duration,
    yaw,
    start,
    goal,
    relaxed,
    lean,
    bearing,
    footAt,
    legsAt,
    adjust,
    window,
    swing,
    back,
    SET,
  }: braceBody.IScope = scope;
  // The posture without its arms at a second: the root, lean and legs on
  // the set curve, and the hands opened flat once the brace begins.
  const lower: ReturnType<typeof lowerHumanPosture.prepare> =
    lowerHumanPosture.prepare(body);

  // The posture on the set curve before the grounded balance.
  const rawAt = (
    t: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture => {
    const s: number = minimumJerk.share(t / SET);
    const root: IAutoMovieVector3 = Vector3.lerp(start, goal, s);
    const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      relaxed,
      lean * s * bearing,
    );
    const leftFoot: ReturnType<typeof footAt> = footAt("left", t);
    const rightFoot: ReturnType<typeof footAt> = footAt("right", t);
    const legs: IAutoMovieMotionHumanPosture["limbs"] = legsAt(root, {
      left: leftFoot.ankle,
      right: rightFoot.ankle,
    });
    for (const side of ["left", "right"] as const) {
      const limb: PlanBodyAtLimb = side === "left" ? "leftLeg" : "rightLeg";
      if (!(side === "left" ? leftFoot : rightFoot).planted)
        legs[limb] = { ...legs[limb]!, planted: false };
    }
    return lower(
      {
        root,
        yaw,
        pitch: tilt.pitch,
        roll: 0,
        joints: tilt.joints,
        limbs: legs,
      },
      resolution,
    );
  };

  // The grounded balance, solved at its knots on that posture and read from
  // their course (`prepareHumanPostureCorrection`): the step's lift and
  // landing and the set's end change its support.
  const corrected: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture =
    window === null
      ? (posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture =>
          posture
      : prepareHumanPostureCorrection(
          (t: number): IAutoMovieMotionHumanPosture => rawAt(t),
          window,
          [swing[0], swing[1], SET],
          (
            posture: IAutoMovieMotionHumanPosture,
            t: number,
          ): IAutoMovieMotionHumanPosture => adjust(posture, t),
        );
  // The rear foot unloads over the preparatory shift and accepts weight
  // over the same transfer time on landing.
  const transfer: number = swing[0];
  const load: (t: number) => number = (t: number): number =>
    t < swing[0]
      ? 1 - minimumJerk.share(t / transfer)
      : minimumJerk.share(Math.max(0, t - swing[1]) / transfer);
  // Its heel's rise, the one search of a read, solved at knots AutoKnots
  // places (Vitenti et al. 2024, arXiv:2412.13423) to the rise's angular
  // resolution (`ROM_TOLERANCE`), knots forced where the foot leaves and
  // lands, and read from their course.
  const rise: (seconds: number) => number[] = ((): ((
    seconds: number,
  ) => number[]) => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return prepareHumanSampledCourse({
      from: 0,
      to: swing[1] + transfer,
      marks: [swing[0], swing[1]],
      sample: (t: number): number[] => [
        rangeSteppingFoot.pitch(
          body,
          corrected(rawAt(t), t),
          back,
          read,
          walkLeg.dorsal(load(t)),
        ),
      ],
      tolerance: { kind: "absolute", absolute: ROM_TOLERANCE },
      step: AutoMovieMotionHumanArmCourse.STEP,
    });
  })();
  const bodyAt: (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture = (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.min(duration, Math.max(0, seconds));
    const s: number = minimumJerk.share(t / SET);
    let posture: IAutoMovieMotionHumanPosture = corrected(
      rawAt(t, resolution),
      t,
    );
    // The rear foot's forefoot keeps the planned trajectory while its heel
    // gives to the actual shank, at its prepared pitch.
    if (t > 0 && t < swing[1] + transfer)
      posture = rangeSteppingFoot(
        body,
        posture,
        back,
        prepareHumanPoseResolution(resolution),
        walkLeg.dorsal(load(t)),
        rise(t)[0]!,
      );
    // The hands open on the set's own share: written flat at once from
    // the first instant past zero, the fingers jumped from the entry's.
    return s <= 0
      ? posture
      : {
          ...posture,
          joints: {
            ...posture.joints,
            ...AutoMovieMotionHumanHand.fingers("left", "flat", 0, s),
            ...AutoMovieMotionHumanHand.fingers("right", "flat", 0, s),
          },
        };
  };

  return bodyAt;
}

/** What a brace's body posture reads and what it is. */
export namespace braceBody {
  /** What a brace plan reads its body posture from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The brace's seconds. */
    duration: number;

    /** The entry heading, degrees. */
    yaw: number;

    /** The entry root. */
    start: IAutoMovieVector3;

    /** The set root. */
    goal: IAutoMovieVector3;

    /** The relaxed upright joints. */
    relaxed: IAutoMovieMotionHumanPosture["joints"];

    /** The trunk's lean into the force, degrees. */
    lean: number;

    /** The share of the lean along the heading. */
    bearing: number;

    /**
     * A foot's ankle and plant at a second.
     *
     * @param side The foot.
     * @param t Seconds.
     * @returns The ankle and whether it is planted.
     */
    footAt: (side: AutoMovieHumanSide, t: number) => IFoot;

    /** The legs' goals on a root (`stand.prepareLegs`). */
    legsAt: ReturnType<typeof stand.prepareLegs>;

    /** The grounded balance's adjustment. */
    adjust: ReturnType<typeof prepareGroundedBalance>;

    /** The grounded balance's window. */
    window: HumanPhysics.Window;

    /** When the stepping foot leaves and lands, seconds. */
    swing: readonly [number, number];

    /** The foot that steps back. */
    back: AutoMovieHumanSide;

    /** The lead time to the set posture, seconds (`brace.SET`). */
    SET: number;
  }

  /** A foot's ankle and whether it is planted. */
  export interface IFoot {
    /** The ankle, world metres. */
    ankle: IAutoMovieVector3;

    /** Whether the foot is planted. */
    planted: boolean;
  }

  /**
   * The posture without its arms at a second.
   *
   * @param seconds Seconds.
   * @param resolution The borrowed forward-kinematics source, if any.
   * @returns The posture.
   */
  export type BodyAt = (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture;
}
/** The alternatives of `PlanBodyAtLimb`'s site. */
type PlanBodyAtLimb = "leftLeg" | "rightLeg";
