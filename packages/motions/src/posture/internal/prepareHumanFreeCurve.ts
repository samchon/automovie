import { ROM_TOLERANCE, hingedArmSwivel, jointRomOvershoot, AutoMovieEngineMotionSampling, swingTwistRange, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanFreeCurveFit } from "../HumanFreeCurveFit";
import { HumanFreeCurveIntervals } from "../HumanFreeCurveIntervals";
import { HumanPosturePreparation } from "../HumanPosturePreparation";
import { HumanPostureRaw } from "../HumanPostureRaw";
import { prepareHumanKnotCourse } from "./prepareHumanKnotCourse";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";

/**
 * Prepare a free-leg curve: the legs' continuation knots solved once, in order,
 * and a pure reader that fits each requested phase from them.
 *
 * Preparation fits the origin, phase zero's cold solve, or the midpoint's when
 * phase zero's is not observable, then the knots from it toward each end placed
 * by AutoKnots (Vitenti et al. 2024, arXiv:2412.13423;
 * `HumanFreeCurveIntervals`), each knot a correction of the one before under
 * the original branch, swivel and rotation gates (`HumanFreeCurveFit`). The
 * legs' swivels at the knots are joined by the minimum-jerk path through them
 * in phase (Flash and Hogan 1985, J. Neurosci. 5(7):1688;
 * `prepareHumanKnotCourse` with the knots' phases as its fixed timing): the
 * curve's clock is the flight's ballistic one, so the knots are not retimed. A
 * read finds its knot interval by binary search, seeds the actual target's fit
 * with the course's swivel on the interval's branch, gates it against the knot
 * nearer the origin, and falls back to the ordinary cold fit where the gates
 * fail or no knot reaches. No pose is replayed or interpolated and nothing is
 * stored on a read, so any phase in any order gives the same answer.
 *
 * @param body The curve's canonical body, unchanged while the curve is read.
 * @param at Pure authoring at a phase in [0,1], with fresh records and closed
 *   direct-joint/free-world-leg goals only.
 * @param duration The physical duration in seconds, used by the
 *   velocity-continuation angular-resolution law.
 * @returns The reader of a phase with an optional borrowed native FK source and
 *   ROM projector; a foreign source keeps the ordinary cold fit.
 */
export function prepareHumanFreeCurve(
  body: IAutoMovieMotionHumanBody,
  at: (share: number) => IAutoMovieMotionHumanPosture,
  duration: number,
): prepareHumanFreeCurve.IReader {
  const tolerance: number =
    duration > 0 && duration < Infinity
      ? AutoMovieEngineMotionSampling.samplePoseVelocityTolerance(1e-3, duration)
      : NaN;
  const radians: number = (ROM_TOLERANCE * Math.PI) / 180;
  const legality: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => number
  > = new Map();
  for (const bone of body.skeleton.bones) {
    const constraint: IAutoMovieJointConstraint | null = AutoMovieEngineKinematics.getConstraint(
      bone.bone,
      bone.constraint ?? null,
    );
    const frame: IAutoMovieJointRotationFrame | undefined = swingTwistRange.of(
      bone.bone,
      body.skeleton,
    );
    legality.set(
      bone.bone,
      jointRomOvershoot.prepare(
        bone.bone,
        constraint,
        constraint === null ||
          constraint.swingTwist === undefined ||
          constraint.swingTwist === null ||
          frame === undefined
          ? undefined
          : swingTwistRange.prepare(bone.bone, frame, constraint),
      ),
    );
  }
  const { cold, observe, correct }: HumanFreeCurveFit.IFits = HumanFreeCurveFit(
    { body, at, tolerance, radians, legality },
  );
  const prepared: IPrepared | undefined =
    tolerance > 0 && tolerance < hingedArmSwivel.STEP
      ? prepareKnots(at, cold, observe, correct)
      : undefined;

  return (
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): HumanPosturePreparation.IPrepared => {
    if (
      prepared === undefined ||
      !(share > 0 && share < 1) ||
      share === prepared.pivot ||
      share < prepared.shares[0]! ||
      share > prepared.shares[prepared.shares.length - 1]!
    )
      return cold(share, resolution, projection);
    const corrected: HumanFreeCurveFit.ICorrection = correct(
      share,
      seedAt(prepared, share),
      resolution,
      projection,
    );
    return corrected.kind === "accepted"
      ? corrected.prepared
      : cold(share, resolution, projection);
  };
}

/** The free-leg curve's reader. */
export namespace prepareHumanFreeCurve {
  /**
   * Fit the authored goals at a normalized phase, with an optional same-read FK
   * source and joint projection.
   */
  export interface IReader {
    (
      share: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): HumanPosturePreparation.IPrepared;
  }
}

/** A curve's numeric anchor (`HumanFreeCurveFit.IAnchor`). */
type IAnchor = HumanFreeCurveFit.IAnchor;

/** A curve's prepared knots and the swivel course through them. */
interface IPrepared {
  /** The origin's phase, 0 or 0.5. */
  pivot: number;

  /** Each knot's phase, ascending, the origin among them. */
  shares: readonly number[];

  /** Each knot's anchor. */
  anchors: readonly IAnchor[];

  /** The legs whose swivels are coursed, in the course's coordinate order. */
  limbs: readonly AutoMovieHumanLimb[];

  /**
   * Each knot's unwrapped swivels less its own, degrees: the whole turns the
   * course adds to each leg's swivel there.
   */
  turns: readonly (readonly number[])[];

  /** The minimum-jerk course of the unwrapped swivels in phase. */
  course: prepareHumanKnotCourse.ICourse;
}

/**
 * The origin and the knots toward each end, solved with the native FK source,
 * and the swivel course through them; none where no origin is observable.
 */
function prepareKnots(
  at: (share: number) => IAutoMovieMotionHumanPosture,
  cold: HumanFreeCurveFit.IFits["cold"],
  observe: HumanFreeCurveFit.IFits["observe"],
  correct: HumanFreeCurveFit.IFits["correct"],
): IPrepared | undefined {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const initial: IAutoMovieMotionHumanPosture = at(0);
  if (
    initial.rotation !== undefined ||
    !HumanPostureRaw.eligible(initial) ||
    Object.keys(initial.limbs).length === 0
  )
    return undefined;
  let pivot: number = 0;
  let origin: IAnchor | undefined = observe(
    cold(0, resolution, undefined, initial),
    initial,
    resolution,
  );
  if (origin === undefined) {
    const raw: IAutoMovieMotionHumanPosture = at(0.5);
    origin = observe(cold(0.5, resolution, undefined, raw), raw, resolution);
    pivot = 0.5;
  }
  if (origin === undefined) return undefined;
  const chain: (to: number) => HumanFreeCurveIntervals.IKnot[] = (
    to: number,
  ): HumanFreeCurveIntervals.IKnot[] =>
    HumanFreeCurveIntervals({
      at,
      correct,
      from: pivot,
      to,
      origin: origin!,
      resolution,
      projection: undefined,
    });
  const knots: HumanFreeCurveIntervals.IKnot[] = [
    ...(pivot > 0 ? chain(0).reverse() : []),
    { share: pivot, anchor: origin },
    ...chain(1),
  ];

  // Every knot fits the origin's legs on the origin's branches (the gates
  // require it), so each leg's swivel is one coordinate of the course,
  // unwrapped along the knots, each step its shortest turn.
  const limbs: AutoMovieHumanLimb[] = (
    Object.entries(origin.seeds) as [
      AutoMovieHumanLimb,
      IAutoMovieSwivelSeed | null | undefined,
    ][]
  )
    .filter(
      ([, seed]: [
        AutoMovieHumanLimb,
        IAutoMovieSwivelSeed | null | undefined,
      ]): boolean => seed !== null && seed !== undefined,
    )
    .map(
      ([limb]: [
        AutoMovieHumanLimb,
        IAutoMovieSwivelSeed | null | undefined,
      ]): AutoMovieHumanLimb => limb,
    );
  const unwrapped: number[][] = [];
  for (const knot of knots) {
    const before: number[] | undefined = unwrapped.at(-1);
    unwrapped.push(
      limbs.map((limb: AutoMovieHumanLimb, c: number): number => {
        const swivel: number = knot.anchor.seeds[limb]!.swivel;
        if (before === undefined) return swivel;
        const turn: number = swivel - before[c]!;
        return before[c]! + turn - 360 * Math.round(turn / 360);
      }),
    );
  }
  return {
    pivot,
    shares: knots.map(
      (knot: HumanFreeCurveIntervals.IKnot): number => knot.share,
    ),
    anchors: knots.map(
      (knot: HumanFreeCurveIntervals.IKnot): IAnchor => knot.anchor,
    ),
    limbs,
    turns: unwrapped.map((values: number[], k: number): number[] =>
      values.map(
        (v: number, c: number): number =>
          v - knots[k]!.anchor.seeds[limbs[c]!]!.swivel,
      ),
    ),
    course: prepareHumanKnotCourse(
      unwrapped.map(
        (position: number[]): { position: number[]; dwell: number } => ({
          position,
          dwell: 0,
        }),
      ),
      {
        kind: "fixed",
        times: knots.map(
          (knot: HumanFreeCurveIntervals.IKnot): number => knot.share,
        ),
      },
    ),
  };
}

/**
 * The prior a phase inside the knots is corrected from: the knot nearer the
 * origin of the phase's knot interval, its legs' swivels moved to the course's
 * at the phase, in that knot's own turn.
 */
function seedAt(prepared: IPrepared, share: number): IAnchor {
  const { shares, anchors, limbs, turns }: IPrepared = prepared;
  let low: number = 0;
  let high: number = shares.length - 1;
  while (high - low > 1) {
    const middle: number = (low + high) >> 1;
    if (shares[middle]! <= share) low = middle;
    else high = middle;
  }
  const k: number = share > prepared.pivot ? low : high;
  const anchor: IAnchor = anchors[k]!;
  const swivels: number[] = prepared.course.position(share);
  const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = {
    ...anchor.seeds,
  };
  limbs.forEach((limb: AutoMovieHumanLimb, c: number): void => {
    seeds[limb] = {
      ...anchor.seeds[limb]!,
      swivel: swivels[c]! - turns[k]![c]!,
    };
  });
  return { seeds, rotations: anchor.rotations };
}
