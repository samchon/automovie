import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { cross, dot, norm, normalize, plus, rotate, scale, sub, fifth } = AutoMovieHumanLegVector;

/**
 * The leg's axis and its section planes, in the left leg's canonical frame.
 *
 * The leg is built straight in its own frame, and the bind posture is the
 * rotation that places it: the section normal turns from the ankle ring's
 * vertical to the shank, from the shank to the thigh across the knee, and from
 * the thigh back to the crotch ring's vertical, each a turn about one fixed
 * axis square to both directions, eased by the smootherstep so that it starts
 * and ends without angular velocity. A turn about a fixed axis carries the
 * in-plane axes without twist; the three turns together leave a residual twist
 * about the vertical, which runs out evenly along the leg so both end rings
 * keep their own axes. The knee turns over as many skin depths as a joint's
 * bend spreads over, and the end rings over the reaches their differences fade
 * over. The origin of a plane runs along the section normal through the knee.
 *
 * These are plane laws, not shape fades: the neighbours' rings are horizontal,
 * so the planes must be vertical where they meet them.
 */
export namespace AutoMovieHumanLegAxis {
  /** A section plane, canonical, with its normal. */
  export interface IFrame {
    /** Origin, on the axis. */
    origin: Vec3;

    /** In-plane axis, forward in the straight leg. */
    u: Vec3;

    /** In-plane axis, lateral in the straight leg. */
    v: Vec3;

    /** Normal, along the bone. */
    n: Vec3;
  }

  /** The joints the axis passes through. */
  export interface IJoints {
    /** Hip centre. */
    hip: Vec3;

    /** Knee centre. */
    knee: Vec3;

    /** Ankle centre. */
    ankle: Vec3;
  }

  /** One eased turn of the section normal about a fixed axis. */
  export interface ITurn {
    /** Station where the turn starts. */
    from: number;

    /** Length of the turn along the stations, mm. */
    span: number;

    /** Unit axis. */
    axis: Vec3;

    /** Total angle, radians. */
    angle: number;
  }

  /** The leg's frames along its stations. */
  export interface IFrames {
    /** Station of the ankle ring. */
    s0: number;

    /** Station of the crotch ring. */
    s1: number;

    /** The three turns: ankle ring to shank, shank to thigh, thigh to the crotch ring. */
    turns: ITurn[];

    /** Residual twist about the vertical, radians. */
    twist: number;

    /** Knee centre. */
    knee: Vec3;

    /** Origins at whole millimetres of station, from `s0 - PAD`. */
    origins: Vec3[];
  }

  /**
   * The frames: vertical at the ankle ring, square to the shank, turned to the
   * thigh across the knee, and vertical again at the crotch ring.
   *
   * @param bones The side's joints, canonical.
   * @param s0 Station of the ankle ring.
   * @param s1 Station of the crotch ring.
   * @param knee Half of the knee's turn.
   * @param ankle Reach of the turn off the ankle ring.
   * @param crotch Reach of the turn onto the crotch ring.
   */
  export function of(bones: IJoints, s0: number, s1: number, knee: number, ankle: number, crotch: number): IFrames {
    const Y: Vec3 = [0, 1, 0];
    const shank: Vec3 = normalize(sub(bones.knee, bones.ankle));
    const thigh: Vec3 = normalize(sub(bones.hip, bones.knee));
    const turn = (a: Vec3, b: Vec3, from: number, span: number): ITurn => {
      const axis: Vec3 = cross(a, b);
      const sine: number = norm(axis);
      return {
        from,
        span,
        axis: sine > 1e-12 ? scale(axis, 1 / sine) : [1, 0, 0],
        angle: Math.atan2(sine, dot(a, b)),
      };
    };
    const frames: IFrames = {
      s0,
      s1,
      turns: [turn(Y, shank, s0, ankle), turn(shank, thigh, bones.knee[1] - knee, 2 * knee), turn(thigh, Y, s1 - crotch, crotch)],
      twist: 0,
      knee: bones.knee,
      origins: [],
    };

    // The three turns leave a twist about the vertical, which runs out evenly.
    const end: Vec3 = rotated(frames, s1, [1, 0, 0], false);
    frames.twist = Math.atan2(-end[2], end[0]);

    // The origin runs along the section normal, through the knee: integrate
    // the normal's slope (Simpson over a millimetre) from below the ankle ring.
    const n = (s: number): Vec3 => {
      const d: Vec3 = rotated(frames, s, Y, false);
      return scale(d, 1 / d[1]);
    };
    const count: number = Math.ceil(s1 - s0 + 2 * PAD);
    const origins: Vec3[] = [[0, s0 - PAD, 0]];
    for (let i: number = 0; i < count; i++) {
      const a: number = s0 - PAD + i;
      const p: Vec3 = origins[i]!;
      const q: Vec3 = plus(p, scale(plus(plus(n(a), scale(n(a + 0.5), 4)), n(a + 1)), 1 / 6));
      origins.push([q[0], a + 1, q[2]]);
    }
    const anchor: Vec3 = interpolated(origins, n, s0 - PAD, bones.knee[1]);
    frames.origins = origins.map((p: Vec3): Vec3 => [p[0] - anchor[0] + bones.knee[0], p[1], p[2] - anchor[2] + bones.knee[2]]);
    return frames;
  }

  /**
   * A vector of the leg's straight frame carried to station s.
   *
   * @param frames The frames.
   * @param s Station.
   * @param x The vector in the straight frame.
   * @param twisted Whether the residual twist is applied.
   */
  export function rotated(frames: IFrames, s: number, x: Vec3, twisted: boolean = true): Vec3 {
    let out: Vec3 = twisted ? rotate(x, [0, 1, 0], -frames.twist * fifth((s - frames.s0) / (frames.s1 - frames.s0))) : x;
    for (const t of frames.turns) out = rotate(out, t.axis, t.angle * fifth((s - t.from) / t.span));
    return out;
  }

  /**
   * A table's value at s by cubic Hermite, with derivatives from `rate`.
   *
   * @param table Values at whole millimetres from `first`.
   * @param rate Derivative at a station.
   * @param first Station of the table's first value.
   * @param s Station read.
   */
  export function interpolated(table: readonly Vec3[], rate: (s: number) => Vec3, first: number, s: number): Vec3 {
    const i: number = Math.max(0, Math.min(table.length - 2, Math.floor(s - first)));
    const f: number = s - first - i;
    const a: Vec3 = table[i]!;
    const b: Vec3 = table[i + 1]!;
    const ma: Vec3 = rate(first + i);
    const mb: Vec3 = rate(first + i + 1);
    return [0, 1, 2].map(
      (c: number): number =>
        (2 * f ** 3 - 3 * f ** 2 + 1) * a[c]! +
        (f ** 3 - 2 * f ** 2 + f) * ma[c]! +
        (3 * f ** 2 - 2 * f ** 3) * b[c]! +
        (f ** 3 - f ** 2) * mb[c]!,
    ) as Vec3;
  }

  /** The frame at station s, canonical. */
  export function frameAt(frames: IFrames, s: number): IFrame {
    const n: Vec3 = rotated(frames, s, [0, 1, 0], false);
    const origin: Vec3 = interpolated(
      frames.origins,
      (q: number): Vec3 => {
        const d: Vec3 = rotated(frames, q, [0, 1, 0], false);
        return scale(d, 1 / d[1]);
      },
      frames.s0 - PAD,
      s,
    );
    return {
      origin: [origin[0], s, origin[2]],
      u: rotated(frames, s, [1, 0, 0]),
      v: rotated(frames, s, [0, 0, 1]),
      n,
    };
  }

  /**
   * The frame's station derivative at s.
   *
   * @param frames The frames.
   * @param s Station.
   * @param side 0 for the central difference; 1 or -1 for the one-sided difference of second order toward that side, where nothing exists past a ring.
   */
  export function frameRate(frames: IFrames, s: number, side: 1 | -1 | 0): IFrame {
    const n: Vec3 = rotated(frames, s, [0, 1, 0], false);
    const derive = (pick: (f: IFrame) => Vec3): Vec3 => {
      if (side === 0) {
        const a: Vec3 = pick(frameAt(frames, s - FRAME_STEP));
        const b: Vec3 = pick(frameAt(frames, s + FRAME_STEP));
        return scale(sub(b, a), 1 / (2 * FRAME_STEP));
      }
      const d: number = side * FRAME_STEP;
      const p: Vec3 = pick(frameAt(frames, s));
      const a: Vec3 = pick(frameAt(frames, s + d));
      const b: Vec3 = pick(frameAt(frames, s + 2 * d));
      return [0, 1, 2].map((c: number): number => (-3 * p[c]! + 4 * a[c]! - b[c]!) / (2 * d)) as Vec3;
    };
    return {
      origin: scale(n, 1 / n[1]),
      u: derive((f: IFrame): Vec3 => f.u),
      v: derive((f: IFrame): Vec3 => f.v),
      n: derive((f: IFrame): Vec3 => f.n),
    };
  }

  /** Margin of the origin's table past the rings, mm. */
  export const PAD: number = 2;

  /** Station step of the frame differences, mm. */
  export const FRAME_STEP: number = 0.01;
}
