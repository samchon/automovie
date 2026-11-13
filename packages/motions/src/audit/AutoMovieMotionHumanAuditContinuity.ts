import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether every joint centre of a displayed motion travels a continuous,
 * humanly fast path: no jump, no out-and-back spike and no impossible speed.
 *
 * A body is continuous in time, so the distance a joint centre covers
 * shrinks with the interval it is read over, while a branch flip of an
 * inverse-kinematics fit, a swapped reference or a mis-phased blend moves it
 * by the same distance however short the interval. Three readings follow, all
 * on the displayed bones over the whole motion:
 *
 * - `jump`: the displacement that is still there when the interval around it
 *   is `1 / (rate * 4^LEVELS)` long ({@link resolve}). At 24 Hz that is 41
 *   microseconds, in which a joint at 100 m/s covers 4 mm. A frame interval is
 *   resolved when some joint's displacement over it departs from the mean of
 *   its two neighbours' by more than the limit.
 * - `reversal`: a joint that goes out and straight back within two
 *   intervals of `1 / REVERSAL` seconds, read as the shorter of the two
 *   displacements times the cosine of their opposition. A fit that flips for
 *   one frame and returns shows here even where each displacement alone is a
 *   plausible speed. The window is a time, not the caller's grid: on a
 *   coarser grid a stroke that oscillates by design (a rub, a wave) would go
 *   out and back within two intervals, so a turn found on the coarse grid is
 *   read again on intervals of that length across its two.
 * - `speed`: the fastest any joint centre travels over a grid interval,
 *   metres per second, the bound a caller sets from the action (a hand
 *   raised to the face does not reach a punch's speed).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the premise, each reading, its unit and what the resolution reaches.
 * @evidence contracts/development/implementation.md#principled-implementation The definition of continuity applied directly: over equal sub-intervals a smooth path's displacements differ by acceleration times the interval squared, which vanishes sixteenfold per quartering, while a step keeps its size.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the grid for the three readings, one recursive quartering per departing interval.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed bones only; no bone, action or instant is exempt, and every bone is followed, so a small flip is not hidden by a faster limb.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in grid frames and bones; a quartering costs three poses a level and is entered only where a displacement departs from its neighbours, and a turn on a grid coarser than `REVERSAL` costs the poses of its two intervals at that rate, read once per turn.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the motion handed in.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditContinuity {
  /** How many times a departing interval is quartered at most. */
  export const LEVELS: number = 5;

  /** The samples a second a reversal is read at, whatever the grid: a reversal is an out-and-back within two intervals of `1 / REVERSAL` seconds, a frame of film. */
  export const REVERSAL: number = 24;

  /** The three readings of {@link measure}. */
  export interface IResult {
    /** The largest displacement left at full resolution, metres. */
    jump: IAutoMovieMotionHumanAuditMeasure;

    /** The largest out-and-back within two grid intervals, metres. */
    reversal: IAutoMovieMotionHumanAuditMeasure;

    /** The fastest joint centre over a grid interval, metres per second. */
    speed: IAutoMovieMotionHumanAuditMeasure;
  }

  /**
   * Read a person's continuity over the whole motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @param limit The smallest jump resolved, metres.
   * @returns The three readings.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    rate: number = 24,
    limit: number = 0.005,
  ): IResult {
    const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    );
    const frames: IPoints[] = times.map(
      (t: number): IPoints => points(motion, subject, t),
    );
    const result: IResult = {
      jump: { value: 0, seconds: 0, where: "none" },
      reversal: { value: 0, seconds: 0, where: "none" },
      speed: { value: 0, seconds: 0, where: "none" },
    };
    // The reversal's own instants across two grid intervals: the grid's
    // own three when it is as fine as the reversal's, else as many equal
    // intervals as make each no longer than `1 / REVERSAL`.
    const finerTimes = (i: number): number[] => {
      const span: number = times[i + 2]! - times[i]!;
      const count: number = Math.max(2, Math.ceil(span * REVERSAL - 1e-9));
      return Array.from(
        { length: count + 1 },
        (_: unknown, k: number): number => times[i]! + (span * k) / count,
      );
    };
    const fined: Map<number, IPoints[]> = new Map();
    const finer = (i: number): IPoints[] => {
      let found: IPoints[] | undefined = fined.get(i);
      if (found === undefined) {
        const at: number[] = finerTimes(i);
        found =
          at.length === 3
            ? [frames[i]!, frames[i + 1]!, frames[i + 2]!]
            : at.map((t: number): IPoints => points(motion, subject, t));
        fined.set(i, found);
      }
      return found;
    };
    const step = (i: number, bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      subtract(frames[i + 1]!.get(bone)!, frames[i]!.get(bone)!);
    for (let i: number = 0; i + 1 < times.length; i++) {
      let departs: boolean = false;
      for (const bone of frames[i]!.keys()) {
        const now: IAutoMovieVector3 = step(i, bone);
        const before: IAutoMovieVector3 = i > 0 ? step(i - 1, bone) : now;
        const after: IAutoMovieVector3 =
          i + 2 < times.length ? step(i + 1, bone) : now;
        const speed: number = length(now) / (times[i + 1]! - times[i]!);
        if (speed > result.speed.value)
          result.speed = { value: speed, seconds: times[i]!, where: bone };
        if (i + 2 < times.length && -dot(now, after) > 0) {
          // A turn on the grid, read on the reversal's own intervals across
          // its two grid intervals when the grid is coarser than they are.
          const fine: IPoints[] = finer(i);
          const at: number[] = finerTimes(i);
          for (let k: number = 0; k + 2 < fine.length; k++) {
            const out: IAutoMovieVector3 = subtract(
              fine[k + 1]!.get(bone)!,
              fine[k]!.get(bone)!,
            );
            const back: IAutoMovieVector3 = subtract(
              fine[k + 2]!.get(bone)!,
              fine[k + 1]!.get(bone)!,
            );
            const opposed: number = -dot(out, back);
            if (!(opposed > 0)) continue;
            const reversal: number =
              opposed / Math.max(length(out), length(back));
            if (reversal > result.reversal.value)
              result.reversal = {
                value: reversal,
                seconds: at[k + 1]!,
                where: bone,
              };
          }
        }
        if (
          length({
            x: now.x - (before.x + after.x) / 2,
            y: now.y - (before.y + after.y) / 2,
            z: now.z - (before.z + after.z) / 2,
          }) > limit
        )
          departs = true;
      }
      if (!departs) continue;
      const left: IAutoMovieMotionHumanAuditMeasure = quarter(
        motion,
        subject,
        times[i]!,
        times[i + 1]!,
        frames[i]!,
        frames[i + 1]!,
        limit,
        0,
      );
      if (left.value > result.jump.value) result.jump = left;
    }
    return result;
  }

  /**
   * The discontinuity inside an interval: the largest displacement of any
   * joint centre that is still there when the interval around it has been
   * quartered `LEVELS` times.
   *
   * The interval is cut into four equal parts. Over a smooth path the four
   * displacements of a joint differ by its acceleration times the part's
   * length squared; a step makes its part's displacement depart from the mean
   * of the other three by the step. Every part where some joint departs by at
   * least `limit`, and by at least half the largest departure of the four, is
   * quartered again; a part where none does holds no jump of that size.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param from Film seconds.
   * @param to Film seconds, after `from`.
   * @param limit The smallest jump resolved, metres.
   * @returns The displacement, the start of the final interval and the joint; zero at `none` when the path is continuous at this limit.
   */
  export function resolve(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    from: number,
    to: number,
    limit: number,
  ): IAutoMovieMotionHumanAuditMeasure {
    return quarter(
      motion,
      subject,
      from,
      to,
      points(motion, subject, from),
      points(motion, subject, to),
      limit,
      0,
    );
  }
}

/** Every bone's joint centre at an instant. */
type IPoints = Map<AutoMovieHumanoidBone, IAutoMovieVector3>;

/** One level of {@link AutoMovieMotionHumanAuditContinuity.resolve}. */
const quarter = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  from: number,
  to: number,
  first: IPoints,
  last: IPoints,
  limit: number,
  level: number,
): IAutoMovieMotionHumanAuditMeasure => {
  let worst: IAutoMovieMotionHumanAuditMeasure = {
    value: 0,
    seconds: from,
    where: "none",
  };
  if (level === AutoMovieMotionHumanAuditContinuity.LEVELS) {
    for (const [bone, point] of first) {
      const value: number = length(subtract(last.get(bone)!, point));
      if (value > worst.value) worst = { value, seconds: from, where: bone };
    }
    return worst;
  }
  const times: number[] = [0, 1, 2, 3, 4].map(
    (k: number): number => from + ((to - from) * k) / 4,
  );
  const frames: IPoints[] = [
    first,
    points(motion, subject, times[1]!),
    points(motion, subject, times[2]!),
    points(motion, subject, times[3]!),
    last,
  ];
  const departures: number[] = [0, 0, 0, 0];
  for (const bone of first.keys()) {
    const steps: IAutoMovieVector3[] = [0, 1, 2, 3].map(
      (k: number): IAutoMovieVector3 =>
        subtract(frames[k + 1]!.get(bone)!, frames[k]!.get(bone)!),
    );
    const sum: IAutoMovieVector3 = {
      x: steps[0]!.x + steps[1]!.x + steps[2]!.x + steps[3]!.x,
      y: steps[0]!.y + steps[1]!.y + steps[2]!.y + steps[3]!.y,
      z: steps[0]!.z + steps[1]!.z + steps[2]!.z + steps[3]!.z,
    };
    for (let k: number = 0; k < 4; k++) {
      const s: IAutoMovieVector3 = steps[k]!;
      departures[k] = Math.max(
        departures[k]!,
        length({
          x: s.x - (sum.x - s.x) / 3,
          y: s.y - (sum.y - s.y) / 3,
          z: s.z - (sum.z - s.z) / 3,
        }),
      );
    }
  }
  const largest: number = Math.max(...departures);
  for (let k: number = 0; k < 4; k++) {
    if (departures[k]! < limit || departures[k]! < largest / 2) continue;
    const found: IAutoMovieMotionHumanAuditMeasure = quarter(
      motion,
      subject,
      times[k]!,
      times[k + 1]!,
      frames[k]!,
      frames[k + 1]!,
      limit,
      level + 1,
    );
    if (found.value > worst.value) worst = found;
  }
  return worst;
};

/** Every bone's joint centre of a person at an instant. */
const points = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  seconds: number,
): IPoints => {
  const out: IPoints = new Map();
  for (const [bone, resolved] of motion.bones(subject, seconds))
    out.set(bone, resolved.worldPosition);
  return out;
};

const subtract = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

const length = (a: IAutoMovieVector3): number => Math.hypot(a.x, a.y, a.z);
