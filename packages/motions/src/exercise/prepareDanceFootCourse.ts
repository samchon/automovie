import type { IAutoMovieMotionHumanFoot } from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";

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
  placements: readonly [
    IAutoMovieMotionHumanFoot.IPlacement,
    IAutoMovieMotionHumanFoot.IPlacement,
  ];

  /** The swing's arc between the two placements, prepared with the course. */
  arc: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>;
}

/** A current interval selection; it is released with this one observation. */
interface IReading {
  /** The existing held or travelling pair. */
  interval: IInterval;

  /** Original half-beat progress, or one while held. */
  swing: number;
}
/** The record of `IPrepareDanceFootCourseReadNext`'s site. */
type IPrepareDanceFootCourseReadNext = { beat: number; at: IOffset };

/** The record of `IPrepareDanceFootCourseMovingFall`'s site. */
type IPrepareDanceFootCourseMovingFall = { beat: number; at: IOffset };

/** The record of `IPrepareDanceFootCourseOffsetsFall`'s site. */
type IPrepareDanceFootCourseOffsetsFall = { beat: number; at: IOffset };

/** The record of `IPrepareDanceFootCourseResult`'s site. */
type IPrepareDanceFootCourseResult = {
  /** Current local offset in metres, with the original unclipped interpolation. */
  along: (seconds: number) => IOffset;

  /** Fresh current world ankle and foot rotation from the native arc. */
  placed: (seconds: number) => IAutoMovieMotionHumanFoot.IPlacement;

  /** Whether the original half-beat swing has completed. */
  planted: (seconds: number) => boolean;
};

/** The record of `IPrepareDanceFootCoursePathItem`'s site. */
type IPrepareDanceFootCoursePathItem = { beat: number; at: IOffset };

/**
 * Prepare a dance foot's fixed footfalls and rigid swing geometry. Each
 * observation independently selects its original half-beat interval; placement,
 * bearing and lateral offsets retain their separate readers.
 *
 * @param path Ordered footfalls with unchanged second-valued beats and
 *   local-metre offsets.
 * @param placements The unchanged actual world placement of each path/origin
 *   offset.
 * @param origin The initial local offset, present in placements.
 * @param period The existing beat period, seconds.
 * @param clearance The original swing height, metres.
 * @returns Independent current-time readers for local offset, fresh rigid
 *   placement and bearing.
 */
export function prepareDanceFootCourse(
  path: readonly IPrepareDanceFootCoursePathItem[],
  placements: ReadonlyMap<IOffset, IAutoMovieMotionHumanFoot.IPlacement>,
  origin: IOffset,
  period: number,
  clearance: number,
): IPrepareDanceFootCourseResult {
  const offsets: readonly IOffset[] = [
    origin,
    ...path.map((fall: IPrepareDanceFootCourseOffsetsFall): IOffset => fall.at),
  ];
  const pair: (from: IOffset, at: IOffset) => IInterval = (
    from: IOffset,
    at: IOffset,
  ): IInterval => {
    const ends: IInterval["placements"] = [
      placements.get(from)!,
      placements.get(at)!,
    ];
    return {
      from,
      at,
      placements: ends,
      arc: AutoMovieMotionHumanLeg.prepareArc(ends[0], ends[1], clearance),
    };
  };
  const held: IInterval[] = offsets.map(
    (at: IOffset): IInterval => pair(at, at),
  );
  const moving: IInterval[] = path.map(
    (fall: IPrepareDanceFootCourseMovingFall, index: number): IInterval =>
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
    const next: IPrepareDanceFootCourseReadNext | undefined = path[lo];
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
      return current.interval.arc(current.swing);
    },
    planted: (seconds: number): boolean => read(seconds).swing >= 1,
  };
}
