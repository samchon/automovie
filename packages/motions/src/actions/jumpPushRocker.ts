import { ROM_TOLERANCE, carriedRate, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanFoot } from "../posture/HumanFoot";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";
import { jumpPush } from "./jumpPush";
import { walkLeg } from "./walkLeg";

/**
 * A jump push's take-off foot rocker (`jumpPush`): a foot entered on its heel
 * rocker laid flat about its heel, then its heel risen about its toes' joint by
 * the rule a walking stance rises by, read at the hip the planted leg stands
 * from, with the entry's pitch and pitch rate eased out over the rise. Read
 * from the push's body, take-off foot, its heel and ball, duration, entry pitch
 * rate and phase sampler.
 *
 * @param scope What the push builds its rocker from.
 * @returns The rocker's pivots, contacts and pitch.
 */
export function jumpPushRocker(
  scope: jumpPushRocker.IScope,
): jumpPushRocker.IRocker {
  const {
    body,
    takeoff,
    heel,
    ball,
    supportHeading,
    supportPitch,
    P,
    rolling,
    sample,
    CARRY,
  }: jumpPushRocker.IScope = scope;
  // A foot entered on its heel rocker is laid flat before its heel rises,
  // as a walking foot is (Perry and Burnfield), so the pivot passes from
  // the heel to the toes' joint with the foot at rest: passed at a rate,
  // the ankle's velocity would step by that rate times the foot's length.
  // The foot comes flat in the share of the push its pitch is of the whole
  // turn, and no later than keeps a foot entered rolling down above the
  // floor: toward the end the carried rate's term falls as four times the
  // cube of the time left and the pitch as ten times it.
  const lowered: number =
    supportPitch > 0
      ? Math.min(
          (P * supportPitch) / (supportPitch + jumpPush.HEEL),
          rolling < 0 ? (2.5 * supportPitch) / -rolling : P,
        )
      : 0;
  const span: number = P - lowered;
  const start: number = Math.min(supportPitch, 0);
  const heelAt: ReturnType<typeof HumanFoot.preparePivot> | undefined =
    lowered > 0
      ? HumanFoot.preparePivot(body, takeoff, "heel", heel, supportHeading)
      : undefined;
  const ballAt: ReturnType<typeof HumanFoot.preparePivot> =
    HumanFoot.preparePivot(body, takeoff, "mtp", ball, supportHeading);
  const heelContact: ReturnType<typeof HumanFoot.prepareOffset> | undefined =
    lowered > 0 ? HumanFoot.prepareOffset(body, takeoff, "heel") : undefined;
  const ballContact: ReturnType<typeof HumanFoot.prepareOffset> =
    HumanFoot.prepareOffset(body, takeoff, "mtp");
  const heelRise: ReturnType<typeof walkLeg.prepareHeelRise> =
    walkLeg.prepareHeelRise(
      body,
      takeoff,
      ball,
      supportHeading,
      walkLeg.ROCKER,
    );
  // The flat foot's heel then rises by the rule a walking stance rises by:
  // asked from flat to its take-off pitch, and no later than the ankle's
  // dorsal limit asks. A foot the walk held by that rule is met by it.
  // The rule reads the hip the planted leg stands from (`standing`).
  const short: ReturnType<typeof lowerHumanPosture.prepareShort> =
    lowerHumanPosture.prepareShort(body, lowerHumanPosture.KNEE);
  const ruled: (
    phase: jumpPush.IPhase,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
  ) => number = (
    phase: jumpPush.IPhase,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
  ): number => {
    const hip: IAutoMovieVector3 = hipJoints(
      body,
      phase.root,
      humanPostureHeading({ yaw: phase.yaw, pitch: 0, roll: 0 }),
      phase.pelvis,
      resolution?.(),
    )[takeoff];
    const asked: number =
      Math.min(start, -jumpPush.HEEL) *
      minimumJerk.share((phase.seconds - lowered) / span);
    const stood: IAutoMovieVector3 | undefined = jumpPush.standing(
      hip,
      ballAt(asked).ankle,
      short,
    );
    return stood === undefined ? asked : heelRise(stood, asked);
  };
  // What the entry's pitch and pitch rate differ from the rule's by is
  // eased out over the rise. A heel coming down about the ball is carried
  // no longer than lays the foot flat, where the pivot would pass to the
  // heel. The rule's slope at the rise's start is its second-order
  // one-sided difference over two steps of `STEP` seconds, whose O(STEP^2)
  // error is far below a degree per second for a rule that changes over
  // the push's tenths of a second.
  const edge: IOfEdge = ((): IOfEdgeResult => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const met: number = ruled(sample(lowered), read);
    const excess: number =
      (supportPitch > 0 ? 0 : rolling) -
      (-3 * met +
        4 * ruled(sample(lowered + STEP), read) -
        ruled(sample(lowered + 2 * STEP), read)) /
        (2 * STEP);
    return { met, excess };
  })();
  // The rule's heel-rise search, solved at knots AutoKnots places over the
  // rise (Vitenti et al. 2024, arXiv:2412.13423) and read between them from
  // a knot course (`prepareHumanSampledCourse`), so a read searches nothing.
  const rule: (seconds: number) => number[] = ((): ((
    seconds: number,
  ) => number[]) => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return prepareHumanSampledCourse({
      from: lowered,
      to: lowered + span,
      sample: (t: number): number[] => [ruled(sample(t), read)],
      tolerance: { kind: "absolute", absolute: jumpPushRocker.TOLERANCE },
      step: AutoMovieMotionHumanArmCourse.STEP,
    });
  })();
  const gap: number = start - edge.met;
  const excess: number = edge.excess;
  const carried: number =
    excess > 0 ? Math.min(span, -start / (carriedRate.PEAK * excess)) : span;
  const pitchAt: (
    phase: jumpPush.IPhase,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
  ) => number = (phase: jumpPush.IPhase): number => {
    const t: number = phase.seconds;
    return t < lowered
      ? supportPitch * (1 - minimumJerk.share(t / lowered)) +
          rolling * carriedRate(lowered, t)
      : rule(t)[0]! +
          gap * (1 - minimumJerk.share((t - lowered) / span)) +
          (carried > CARRY ? excess * carriedRate(carried, t - lowered) : 0);
  };

  return { lowered, heelAt, ballAt, heelContact, ballContact, pitchAt };
}

/** What a jump push's rocker reads and what it is. */
export namespace jumpPushRocker {
  /**
   * A heel rise's tolerance, degrees: the angular resolution its rule reads
   * flat to (`ROM_TOLERANCE`), the bound AutoKnots places the rise's knots to.
   */
  export const TOLERANCE: number = ROM_TOLERANCE;

  /** What a jump push builds its rocker from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The foot that pushes off. */
    takeoff: AutoMovieHumanSide;

    /** The take-off foot's heel, world metres. */
    heel: IAutoMovieVector3;

    /** The take-off foot's toes' joint once flat, world metres. */
    ball: IAutoMovieVector3;

    /** The take-off foot's heading, degrees. */
    supportHeading: number;

    /** The take-off foot's pitch as entered, degrees; positive with the toes up. */
    supportPitch: number;

    /** The push-off's seconds. */
    P: number;

    /** The take-off foot's entered pitch rate, degrees per second. */
    rolling: number;

    /** The push's phase sampler (`jumpPush.IPush.sample`). */
    sample: jumpPush.IPush["sample"];

    /** The shortest carry whose carried-rate term is evaluated, seconds. */
    CARRY: number;
  }

  /** The rocker's pivots, contacts and pitch. */
  export interface IRocker {
    /** When the foot comes flat, push seconds; zero for a foot entered flat. */
    lowered: number;

    /** The foot about its heel at a pitch, while it comes flat. */
    heelAt: ReturnType<typeof HumanFoot.preparePivot> | undefined;

    /** The foot about its toes' joint at a pitch. */
    ballAt: ReturnType<typeof HumanFoot.preparePivot>;

    /** The heel's contact offset, while the foot comes flat. */
    heelContact: ReturnType<typeof HumanFoot.prepareOffset> | undefined;

    /** The toes' joint's contact offset. */
    ballContact: ReturnType<typeof HumanFoot.prepareOffset>;

    /**
     * The take-off foot's pitch at a push sample.
     *
     * @param phase The push sample.
     * @param resolution The borrowed forward-kinematics reader, if any.
     * @returns The pitch, degrees.
     */
    pitchAt: (
      phase: jumpPush.IPhase,
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ) => number;
  }
}
/** The finite-difference step of the heel rule's slope, seconds. */
const STEP: number = 1e-3;

/** The record of `IOfEdgeResult`'s site. */
type IOfEdgeResult = {
  met: number;
  excess: number;
};

/** The record of `IOfEdge`'s site. */
type IOfEdge = { met: number; excess: number };
