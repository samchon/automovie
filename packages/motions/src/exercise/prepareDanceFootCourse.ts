import type { IAutoMovieMotionHumanFoot } from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import type { HumanFoot } from "../posture/HumanFoot";

/** A fixed floor offset in metres: x to the performer's left, z forward. */
interface IOffset {
  /** Metres to the performer's left. */
  x: number;

  /** Metres forward. */
  z: number;
}

/** One existing held or travelling fixed-endpoint foot course. */
interface IInterval {
  /** The preceding footfall's local offset. */
  from: IOffset;

  /** The arriving footfall's local offset. */
  at: IOffset;

  /** Actual rigid departure and arrival placements, borrowed unchanged. */
  placements: readonly [IAutoMovieMotionHumanFoot.IPlacement, IAutoMovieMotionHumanFoot.IPlacement];

  /** Native fixed geometry, acquired only when placement is actually observed. */
  arc?: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>;
}

/** A current interval selection; it is released with this one observation. */
interface IReading {
  /** The existing held or travelling pair. */
  interval: IInterval;

  /** Original half-beat progress, or one while held. */
  swing: number;
}

/**
 * Prepare a dance foot's fixed footfalls and rigid swing geometry. Each
 * observation independently selects its original half-beat interval;
 * placement, bearing and lateral offsets retain their separate readers.
 *
 * @param path Ordered footfalls with unchanged second-valued beats and local-metre offsets.
 * @param placements The unchanged actual world placement of each path/origin offset.
 * @param origin The initial local offset, present in placements.
 * @param period The existing beat period, seconds.
 * @param clearance The original swing height, metres.
 * @returns Independent current-time readers for local offset, fresh rigid placement and bearing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed authored footfall/placement provenance, metre/second units, half-beat intervals, independent current-time reads and fresh placement ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Retains dance's last-arrived upper-bound search, strict swing-start comparison and original progress division. Native Leg.prepareArc owns the same clamped parabolic ankle/spherical rotation path; the lateral offset keeps its original unclipped affine expressions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered preparation creates held and travelling pairs; one shared current-interval selector feeds the three existing observations without computing unobserved vectors or rotations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No beat, footfall, sample, half-period boundary, clearance, contact comparison or current leg goal changes. A held placement still evaluates the native same-endpoint arc rather than returning a borrowed endpoint.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(N) interval metadata serves N footfalls; each query retains O(log N) selection and only its actual observation. First actual placement prepares each selected pair's fixed vector/slerp prerequisites once, avoiding their repeated construction on later reads.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged authored offsets, world placements, period and clearance prove fixed geometry equivalence. Every current progress and result remains independently evaluated; separate held/travelling pairs preserve the original endpoint arithmetic.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The dance plan owns N travelling and N+1 held records with at most one native arc reader per record until release. Query readings are local; no queried time, output vector, solved pose, FK workspace or growing history is retained.
 */
export function prepareDanceFootCourse(
  path: readonly { beat: number; at: IOffset }[],
  placements: ReadonlyMap<IOffset, IAutoMovieMotionHumanFoot.IPlacement>,
  origin: IOffset,
  period: number,
  clearance: number,
): {
  /** Current local offset in metres, with the original unclipped interpolation. */
  along: (seconds: number) => IOffset;

  /** Fresh current world ankle and foot rotation from the native arc. */
  placed: (seconds: number) => IAutoMovieMotionHumanFoot.IPlacement;

  /** Whether the original half-beat swing has completed. */
  planted: (seconds: number) => boolean;
} {
  const offsets: readonly IOffset[] = [
    origin,
    ...path.map((fall: { beat: number; at: IOffset }): IOffset => fall.at),
  ];
  const pair: (from: IOffset, at: IOffset) => IInterval = (
    from: IOffset,
    at: IOffset,
  ): IInterval => ({
    from,
    at,
    placements: [placements.get(from)!, placements.get(at)!],
  });
  const held: IInterval[] = offsets.map(
    (at: IOffset): IInterval => pair(at, at),
  );
  const moving: IInterval[] = path.map(
    (fall: { beat: number; at: IOffset }, index: number): IInterval =>
      pair(offsets[index]!, fall.at),
  );
  const read: (seconds: number) => IReading = (seconds: number): IReading => {
    let lo: number = 0;
    let hi: number = path.length;
    while (lo < hi) {
      const mid: number = Math.floor((lo + hi) / 2);
      if (seconds >= path[mid]!.beat) lo = mid + 1;
      else hi = mid;
    }
    const next: { beat: number; at: IOffset } | undefined = path[lo];
    return next !== undefined && seconds > next.beat - period / 2
      ? {
          interval: moving[lo]!,
          swing: (seconds - (next.beat - period / 2)) / (period / 2),
        }
      : { interval: held[lo]!, swing: 1 };
  };
  return {
    along: (seconds: number): IOffset => {
      const current: IReading = read(seconds);
      const { from, at }: IInterval = current.interval;
      return {
        x: from.x + (at.x - from.x) * current.swing,
        z: from.z + (at.z - from.z) * current.swing,
      };
    },
    placed: (seconds: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const current: IReading = read(seconds);
      const interval: IInterval = current.interval;
      interval.arc ??= AutoMovieMotionHumanLeg.prepareArc(
        interval.placements[0],
        interval.placements[1],
        clearance,
      );
      return interval.arc(current.swing);
    },
    planted: (seconds: number): boolean => read(seconds).swing >= 1,
  };
}
