import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditContinuity,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * Whether every joint centre of a displayed motion travels a continuous,
 * humanly fast path: no jump, no out-and-back spike and no impossible speed.
 *
 * A body is continuous in time, so the distance a joint centre covers shrinks
 * with the interval it is read over, while a branch flip of an
 * inverse-kinematics fit, a swapped reference or a mis-phased blend moves it by
 * the same distance however short the interval. Three readings follow, all on
 * the displayed bones over the whole motion:
 *
 * - `jump`: the displacement that is still there when the interval around it is
 *   `1 / (rate * 4^LEVELS)` long ({@link resolve}). At 24 Hz that is 41
 *   microseconds, in which a joint at 100 m/s covers 4 mm. A frame interval is
 *   resolved when some joint's displacement over it departs by more than the
 *   limit from the one the quadratic through the two displacements on each side
 *   predicts (from the mean of its two neighbours' within two intervals of an
 *   end): a smooth path departs from it by its fourth derivative, a step by the
 *   step. Inside, a quartered interval is quartered again only for a joint
 *   whose four displacements depart from a constant-jerk path (their third
 *   difference, the residual of the same quadratic predictor) by at least the
 *   limit, and, below the first quartering, by more than a sixteenth of that
 *   joint's departure over the enclosing interval: a Richardson test
 *   (Richardson 1911, Phil Trans R Soc A 210:307: an order-p error falls by the
 *   refinement ratio to the p-th power, and the ratio fails where the path is
 *   not smooth), since a smooth path's departure falls 256-fold a quartering
 *   and a step's not at all, so a fast smooth turn (a somersault, a swing) is
 *   not chased. The parts entered are those where such a joint departs from the
 *   line through its other three displacements by at least the limit and half
 *   the largest such departure; a step departs there by its whole size.
 * - `reversal`: a joint that goes out and straight back within two intervals of
 *   `1 / REVERSAL` seconds, read as the shorter of the two displacements times
 *   the cosine of their opposition. A fit that flips for one frame and returns
 *   shows here even where each displacement alone is a plausible speed. The
 *   window is a time, not the caller's grid: on a coarser grid a stroke that
 *   oscillates by design (a rub, a wave) would go out and back within two
 *   intervals, so a turn found on the coarse grid is read again on intervals of
 *   that length across its two.
 * - `speed`: the fastest any joint centre travels relative to the hips over a
 *   grid interval, metres per second, the bound a caller sets from the action
 *   (a hand raised to the face does not reach a punch's speed). The hips carry
 *   the body's bulk motion, so a body carried, falling or riding as a whole
 *   reads only its own limbs' speed; a pop of the whole body is the `jump`'s to
 *   read.
 */
export namespace AutoMovieMotionHumanAuditContinuity {
  /** How many times a departing interval is quartered at most. */
  export const LEVELS: number = 5;

  /**
   * The samples a second a reversal is read at, whatever the grid: a reversal
   * is an out-and-back within two intervals of `1 / REVERSAL` seconds, a frame
   * of film.
   */
  export const REVERSAL: number = 24;

  /**
   * Read a person's continuity over the whole motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @param limit The smallest jump resolved, metres.
   * @param floor The reversal below which a turn on a coarse grid is taken as
   *   the grid reads it, metres: a caller that bounds the reversal passes its
   *   bound, since a reading under it decides nothing; 0 when absent, every
   *   turn read on the reversal's own intervals.
   * @returns The three readings.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    rate: number = 24,
    limit: number = 0.005,
    floor: number = 0,
  ): IAutoMovieMotionHumanAuditContinuity.IResult {
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);
    const frames: IPoints[] = times.map(
      (t: number): IPoints => points(motion, subject, t),
    );
    const result: IAutoMovieMotionHumanAuditContinuity.IResult = {
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
    for (let i: number = 0; i + 1 < times.length; i++) {
      let departs: boolean = false;
      // The body's bulk motion over the interval, read at the hips.
      const hipsHere: IAutoMovieVector3 | undefined = frames[i]!.get("hips");
      const hipsNext: IAutoMovieVector3 | undefined =
        frames[i + 1]!.get("hips");
      const hx: number =
        hipsHere === undefined || hipsNext === undefined
          ? 0
          : hipsNext.x - hipsHere.x;
      const hy: number =
        hipsHere === undefined || hipsNext === undefined
          ? 0
          : hipsNext.y - hipsHere.y;
      const hz: number =
        hipsHere === undefined || hipsNext === undefined
          ? 0
          : hipsNext.z - hipsHere.z;
      for (const bone of frames[i]!.keys()) {
        // This interval's displacement, the one before and the one after (this
        // one's at either end of the motion), a component each: the numbers
        // the vector forms gave, without a record per displacement.
        const here: IAutoMovieVector3 = frames[i]!.get(bone)!;
        const next: IAutoMovieVector3 = frames[i + 1]!.get(bone)!;
        const nx: number = next.x - here.x;
        const ny: number = next.y - here.y;
        const nz: number = next.z - here.z;
        let bx: number = nx;
        let by: number = ny;
        let bz: number = nz;
        if (i > 0) {
          const last: IAutoMovieVector3 = frames[i - 1]!.get(bone)!;
          bx = here.x - last.x;
          by = here.y - last.y;
          bz = here.z - last.z;
        }
        let ax: number = nx;
        let ay: number = ny;
        let az: number = nz;
        if (i + 2 < times.length) {
          const far: IAutoMovieVector3 = frames[i + 2]!.get(bone)!;
          ax = far.x - next.x;
          ay = far.y - next.y;
          az = far.z - next.z;
        }
        const travelled: number = Math.hypot(nx, ny, nz);
        const speed: number =
          Math.hypot(nx - hx, ny - hy, nz - hz) / (times[i + 1]! - times[i]!);
        if (speed > result.speed.value)
          result.speed = { value: speed, seconds: times[i]!, where: bone };
        const coarse: number =
          i + 2 < times.length
            ? -(nx * ax + ny * ay + nz * az) /
              Math.max(travelled, Math.hypot(ax, ay, az))
            : 0;
        if (coarse > result.reversal.value && coarse <= floor)
          result.reversal = {
            value: coarse,
            seconds: times[i + 1]!,
            where: bone,
          };
        else if (coarse > result.reversal.value) {
          // A turn on the grid, read on the reversal's own intervals across
          // its two grid intervals when the grid is coarser than they are.
          // A smooth turn goes out and back less over the shorter intervals
          // than over the grid's, and a spike at a grid instant reads its
          // height on both, so a turn the grid reads below the worst found,
          // or below the caller's floor, is not read again.
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
        if (i >= 2 && i + 3 < times.length) {
          // Away from the ends, the displacement is predicted from the two
          // on each side by the quadratic through them, exact for any path
          // whose third derivative is constant: a smooth joint departs from
          // it by its fourth derivative times the interval to the fourth,
          // while a step departs by the step, so smooth fast motion (a
          // rider on a trot) is not quartered for nothing.
          const before: IAutoMovieVector3 = frames[i - 2]!.get(bone)!;
          const after: IAutoMovieVector3 = frames[i + 3]!.get(bone)!;
          const last: IAutoMovieVector3 = frames[i - 1]!.get(bone)!;
          const far: IAutoMovieVector3 = frames[i + 2]!.get(bone)!;
          const px: number =
            (-(last.x - before.x) + 4 * bx + 4 * ax - (after.x - far.x)) / 6;
          const py: number =
            (-(last.y - before.y) + 4 * by + 4 * ay - (after.y - far.y)) / 6;
          const pz: number =
            (-(last.z - before.z) + 4 * bz + 4 * az - (after.z - far.z)) / 6;
          if (Math.hypot(nx - px, ny - py, nz - pz) > limit) departs = true;
        } else if (
          Math.hypot(
            nx - (bx + ax) / 2,
            ny - (by + ay) / 2,
            nz - (bz + az) / 2,
          ) > limit
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
   * The discontinuity inside an interval: the largest displacement of any joint
   * centre that is still there when the interval around it has been quartered
   * `LEVELS` times.
   *
   * The interval is cut into four equal parts. Over a smooth path a joint's
   * four displacements lie on a constant-jerk path up to its fourth derivative
   * times the part's length to the fourth, which falls 256-fold a quartering; a
   * step leaves at least its size in their third difference. A joint is
   * followed while that departure reaches `limit` and, below the first
   * quartering, has not fallen to a sixteenth of its departure over the
   * enclosing interval (the Richardson test that tells a step from a fast
   * smooth path). Every part where a followed joint departs from the line
   * through its other three displacements by at least `limit`, and by at least
   * half the largest such departure of the four, is quartered again; an
   * interval where no joint is followed holds no jump of that size.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param from Film seconds.
   * @param to Film seconds, after `from`.
   * @param limit The smallest jump resolved, metres.
   * @returns The displacement, the start of the final interval and the joint;
   *   zero at `none` when the path is continuous at this limit.
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

/**
 * Each joint's departure from a constant-jerk path over one quartered interval,
 * metres: the joints that may hold a step there.
 */
type IStepping = Map<AutoMovieHumanoidBone, number>;

/**
 * The line through three of a joint's four displacements, read at the fourth,
 * for each part: the least-squares line through the other three, as weights on
 * the four displacements (part `k`'s own weight zero). A path of constant
 * acceleration has displacements on a line, so the line predicts them exactly,
 * while a step in part `k` leaves part `k` departing by the whole step.
 */
const LINE: readonly (readonly number[])[] = [
  [0, 4 / 3, 1 / 3, -2 / 3],
  [4 / 7, 0, 2 / 7, 1 / 7],
  [1 / 7, 2 / 7, 0, 4 / 7],
  [-2 / 3, 1 / 3, 4 / 3, 0],
];

/**
 * How far a smooth path's departure from a constant-jerk path falls in one
 * quartering, at most, for a part to be entered: a sixteenth, the geometric
 * mean of the 256-fold fall of a fourth-order residual (a quarter of the
 * interval to the fourth power) and a step's 1, which does not fall.
 */
const RICHARDSON: number = 16;

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
  parent?: IStepping,
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
  const stepping: IStepping = new Map();

  // One joint's four displacements, a component each, written anew for every
  // joint. Only a joint that may step here is read: every joint at the first
  // level, then those that departed over the enclosing interval.
  const dx: number[] = [0, 0, 0, 0];
  const dy: number[] = [0, 0, 0, 0];
  const dz: number[] = [0, 0, 0, 0];
  for (const bone of parent === undefined ? first.keys() : parent.keys()) {
    let earlier: IAutoMovieVector3 = frames[0]!.get(bone)!;
    for (let k: number = 0; k < 4; k++) {
      const later: IAutoMovieVector3 = frames[k + 1]!.get(bone)!;
      dx[k] = later.x - earlier.x;
      dy[k] = later.y - earlier.y;
      dz[k] = later.z - earlier.z;
      earlier = later;
    }

    // The departure from a constant-jerk path, the third difference of the
    // displacements: the residual of the quadratic predictor the grid reads
    // with, zero on a cubic path. A smooth path's falls with the fourth power
    // of the interval, 256-fold a quartering, and a step of `s` in any part
    // leaves at least `s`. A joint is followed while its departure reaches
    // the limit and, below the first level, has not fallen like a smooth
    // path's from the enclosing interval's (the Richardson test).
    const jerk: number = Math.hypot(
      dx[3]! - 3 * dx[2]! + 3 * dx[1]! - dx[0]!,
      dy[3]! - 3 * dy[2]! + 3 * dy[1]! - dy[0]!,
      dz[3]! - 3 * dz[2]! + 3 * dz[1]! - dz[0]!,
    );
    if (jerk < limit) continue;
    if (parent !== undefined && RICHARDSON * jerk <= parent.get(bone)!)
      continue;
    stepping.set(bone, jerk);

    // Which part holds the step: each part's departure from the line through
    // the other three, which a step leaves at its own part in full.
    for (let k: number = 0; k < 4; k++) {
      const w: readonly number[] = LINE[k]!;
      departures[k] = Math.max(
        departures[k]!,
        Math.hypot(
          dx[k]! -
            (w[0]! * dx[0]! + w[1]! * dx[1]! + w[2]! * dx[2]! + w[3]! * dx[3]!),
          dy[k]! -
            (w[0]! * dy[0]! + w[1]! * dy[1]! + w[2]! * dy[2]! + w[3]! * dy[3]!),
          dz[k]! -
            (w[0]! * dz[0]! + w[1]! * dz[1]! + w[2]! * dz[2]! + w[3]! * dz[3]!),
        ),
      );
    }
  }
  if (stepping.size === 0) return worst;
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
      stepping,
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
