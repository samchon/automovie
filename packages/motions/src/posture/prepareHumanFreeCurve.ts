import {
  ROM_TOLERANCE,
  getConstraint,
  hingedArmSwivel,
  jointRomOvershoot,
  samplePoseVelocity,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanFreeCurveFit } from "./HumanFreeCurveFit";
import { HumanFreeCurveIntervals } from "./HumanFreeCurveIntervals";
import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { HumanPostureRaw } from "./HumanPostureRaw";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";

/** The record of `ISeedAtKept`'s site. */
type ISeedAtKept = { share: number; value: IAnchor };

/** The record of `IPrepareHumanFreeCurveAnchorsEntry`'s site. */
type IPrepareHumanFreeCurveAnchorsEntry = { share: number; value: IAnchor };

/**
 * Continue a constructor-owned, pure free-leg curve from its canonical endpoint
 * or verified midpoint anchor and canonical dyadic intervals. This
 * constrained-IK policy is separate from public cold minimization: current
 * goals remain actual solves, and no pose is replayed or interpolated. The
 * supplied producer owns copied curve coefficients and never exposes or changes
 * them during this preparation.
 *
 * @param body The curve's canonical body, unchanged while the curve is read.
 * @param at Pure constructor-owned authoring at a phase in [0,1], with fresh
 *   records and closed direct-joint/free-world-leg goals only.
 * @param duration The physical duration in seconds, used by the existing
 *   velocity-continuation angular-resolution law.
 * @returns A current-phase preparation reader with optional placement-time
 *   setup of its canonical starting anchor, borrowing only a genuine native
 *   synchronous FK/projector source; foreign sources keep ordinary cold
 *   behavior.
 */
export function prepareHumanFreeCurve(
  body: IAutoMovieMotionHumanBody,
  at: (share: number) => IAutoMovieMotionHumanPosture,
  duration: number,
): prepareHumanFreeCurve.IReader {
  const tolerance: number =
    Number.isFinite(duration) && duration > 0
      ? samplePoseVelocity.tolerance(1e-3, duration)
      : NaN;
  const radians: number = (ROM_TOLERANCE * Math.PI) / 180;
  const legality: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => number
  > = new Map();
  const checked: Map<
    AutoMovieHumanoidBone,
    readonly [number | null, number | null, number | null]
  > = new Map();
  for (const bone of body.skeleton.bones)
    legality.set(
      bone.bone,
      jointRomOvershoot.prepare(
        bone.bone,
        getConstraint(bone.bone, bone.constraint ?? null),
        swingTwistRange.of(bone.bone, body.skeleton),
      ),
    );
  const anchors: Map<number, IPrepareHumanFreeCurveAnchorsEntry> = new Map();
  const observations: Map<number, IObserved> = new Map();
  const intervals: Map<string, IInterval> = new Map();
  let origin: IAnchor | undefined;
  let pivot: number = 0;
  let originRead: boolean = false;
  let supported: boolean =
    Number.isFinite(tolerance) &&
    tolerance > 0 &&
    tolerance < hingedArmSwivel.STEP;

  const { cold, observe, correct }: HumanFreeCurveFit.IFits = HumanFreeCurveFit(
    {
      body,
      at,
      tolerance,
      radians,
      legality,
      checked,
      observations,
    },
  );
  const { interval, boundary }: HumanFreeCurveIntervals.IIntervals =
    HumanFreeCurveIntervals({ at, intervals, correct });
  /**
   * Reuse canonical interval preparation, then solve every current target. A
   * current failure may descend into canonical children, but never changes its
   * parent's endpoint classification or another query's choice of seed.
   */
  function solve(
    share: number,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): ISolved {
    if (origin === undefined) return unanchored(share, resolution, projection);
    if (share === pivot)
      return { prepared: cold(share, resolution, projection) };
    let from: number = pivot;
    let to: number = share < pivot ? 0 : 1;
    let left: IAnchor = origin;
    for (;;) {
      const node: IInterval = interval(from, to, left, resolution, projection);
      if (node.direct) {
        const corrected: ICorrection = correct(
          share,
          left,
          resolution,
          projection,
        );
        if (corrected.kind === "accepted") return corrected;
        if (corrected.kind === "unusable")
          return { prepared: cold(share, resolution, projection) };
      }
      const middle: number = from + (to - from) / 2;
      if (middle === from || middle === to)
        return { prepared: cold(share, resolution, projection) };
      if (to > from ? share <= middle : share >= middle) to = middle;
      else {
        const anchor: IAnchor | undefined = boundary(
          from,
          middle,
          left,
          resolution,
          projection,
        );
        if (anchor === undefined)
          return { prepared: cold(share, resolution, projection) };
        from = middle;
        left = anchor;
      }
    }
  }

  /**
   * A retained anchor always has the same canonical construction, even after
   * eviction.
   */
  function seedAt(
    share: number,
    level: number,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): IAnchor | undefined {
    if (share === pivot) return origin;
    const kept: ISeedAtKept | undefined = anchors.get(level);
    if (kept?.share === share) return kept.value;
    const raw: IAutoMovieMotionHumanPosture = at(share);
    const prepared: HumanPosturePreparation.IPrepared = cold(
      share,
      resolution,
      projection,
      raw,
    );
    const value: IAnchor | undefined = observe(prepared, raw, resolution);
    if (value !== undefined) anchors.set(level, { share, value });
    return value;
  }

  /**
   * Correct actual goals from canonical preceding anchors, never from query
   * order.
   */
  function unanchored(
    share: number,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): ISolved {
    const direction: number = share < pivot ? -1 : 1;
    const extent: number = direction < 0 ? pivot : 1 - pivot;
    const progress: number =
      extent === 0 ? 0 : Math.abs(share - pivot) / extent;
    let previous: number = -1;
    for (
      let level: number = 0, scale: number = 1;
      Number.isFinite(scale);
      ++level, scale *= 2
    ) {
      let before: number = Math.floor(progress * scale) / scale;
      if (before === progress) before -= 1 / scale;
      if (before < 0 || !(before < progress))
        return { prepared: cold(share, resolution, projection) };
      if (before === previous) continue;
      previous = before;
      const anchor: number = pivot + direction * extent * before;
      if (anchor === share)
        return { prepared: cold(share, resolution, projection) };
      const prior: IAnchor | undefined = seedAt(
        anchor,
        level,
        resolution,
        projection,
      );
      if (prior === undefined) {
        if (anchor === pivot) continue;
        return { prepared: cold(share, resolution, projection) };
      }
      const corrected: ICorrection = correct(
        share,
        prior,
        resolution,
        projection,
      );
      if (corrected.kind === "accepted") return corrected;
      if (corrected.kind === "unusable")
        return { prepared: cold(share, resolution, projection) };
    }
    return { prepared: cold(share, resolution, projection) };
  }

  /** A placement can prepare its native cold anchor once after physical setup. */
  function prepare(
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): boolean {
    if (!supported || !prepareHumanPoseResolution.isNativeSource(resolution))
      return false;
    if (!originRead) {
      originRead = true;
      const initial: IAutoMovieMotionHumanPosture = at(0);
      if (
        initial.rotation !== undefined ||
        !HumanPostureRaw.eligible(initial) ||
        Object.keys(initial.limbs).length === 0
      ) {
        supported = false;
        return false;
      }
      const prepared: HumanPosturePreparation.IPrepared = cold(
        0,
        resolution,
        projection,
        initial,
      );
      origin = observe(prepared, initial, resolution);
      if (origin === undefined) {
        const raw: IAutoMovieMotionHumanPosture = at(0.5);
        const middle: HumanPosturePreparation.IPrepared = cold(
          0.5,
          resolution,
          projection,
          raw,
        );
        const interior: IAnchor | undefined = observe(middle, raw, resolution);
        if (interior !== undefined) {
          pivot = 0.5;
          origin = interior;
        }
      }
    }
    return true;
  }

  return Object.assign(
    (
      share: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): HumanPosturePreparation.IPrepared =>
      share > 0 && share < 1 && prepare(resolution, projection)
        ? solve(share, resolution, projection).prepared
        : cold(share, resolution, projection),
    {
      prepare: (): void => {
        prepare(prepareHumanPoseResolution());
      },
    },
  );
}

/** The deterministic native curve and its placement-time anchor construction. */
export namespace prepareHumanFreeCurve {
  /**
   * Same-time fit of authored goals and optional setup of the immutable curve's
   * canonical start.
   */
  export interface IReader {
    /**
     * Resolve the actual requested normalized phase with optional same-read FK
     * and joint projection.
     */
    (
      share: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): HumanPosturePreparation.IPrepared;

    /**
     * Prepare only the canonical starting anchor, using the existing live-rig
     * admission.
     */
    prepare(): void;
  }
}

/** A curve's observed bones (`HumanFreeCurveFit.IObserved`). */
type IObserved = HumanFreeCurveFit.IObserved;

/** A curve's numeric anchor (`HumanFreeCurveFit.IAnchor`). */
type IAnchor = HumanFreeCurveFit.IAnchor;

/** A curve's correction (`HumanFreeCurveFit.ICorrection`). */
type ICorrection = HumanFreeCurveFit.ICorrection;

/** A canonical interval's record (`HumanFreeCurveIntervals.IInterval`). */
type IInterval = HumanFreeCurveIntervals.IInterval;
/**
 * Same-call current solve and already completed physical observation, never a
 * cross-query answer.
 */
interface ISolved {
  /** Current independently issued canonical source. */
  prepared: HumanPosturePreparation.IPrepared;
  /**
   * Present only when this same solve completed every actual
   * physical/continuity check.
   */
  anchor?: IAnchor;
}
