import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLegAxis,
} from "@automovie/interface";

import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

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
  export function of(
    bones: IAutoMovieHumanLegAxis.IJoints,
    s0: number,
    s1: number,
    knee: number,
    ankle: number,
    crotch: number,
  ): IAutoMovieHumanLegAxis.IFrames {
    const Y: AutoMovieVector3Tuple = [0, 1, 0];
    const shank: AutoMovieVector3Tuple = normalize(
      sub(bones.knee, bones.ankle),
    );
    const thigh: AutoMovieVector3Tuple = normalize(sub(bones.hip, bones.knee));
    function turn(
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
      from: number,
      span: number,
    ): IAutoMovieHumanLegAxis.ITurn {
      const axis: AutoMovieVector3Tuple = cross(a, b);
      const sine: number = norm(axis);
      return {
        from,
        span,
        axis: sine > 1e-12 ? scale(axis, 1 / sine) : [1, 0, 0],
        angle: Math.atan2(sine, dot(a, b)),
      };
    }
    const frames: IAutoMovieHumanLegAxis.IFrames = {
      s0,
      s1,
      turns: [
        turn(Y, shank, s0, ankle),
        turn(shank, thigh, bones.knee[1] - knee, 2 * knee),
        turn(thigh, Y, s1 - crotch, crotch),
      ],
      twist: 0,
      knee: bones.knee,
      origins: [],
    };

    // The three turns leave a twist about the vertical, which runs out evenly.
    const end: AutoMovieVector3Tuple = rotated(frames, s1, [1, 0, 0], false);
    frames.twist = Math.atan2(-end[2], end[0]);

    // The origin runs along the section normal, through the knee: integrate
    // the normal's slope (Simpson over a millimetre) from below the ankle ring.
    function n(s: number): AutoMovieVector3Tuple {
      const d: AutoMovieVector3Tuple = rotated(frames, s, Y, false);
      return scale(d, 1 / d[1]);
    }
    const count: number = Math.ceil(s1 - s0 + 2 * PAD);
    const origins: AutoMovieVector3Tuple[] = [[0, s0 - PAD, 0]];
    for (let i: number = 0; i < count; i++) {
      const a: number = s0 - PAD + i;
      const p: AutoMovieVector3Tuple = origins[i]!;
      const q: AutoMovieVector3Tuple = plus(
        p,
        scale(plus(plus(n(a), scale(n(a + 0.5), 4)), n(a + 1)), 1 / 6),
      );
      origins.push([q[0], a + 1, q[2]]);
    }
    const anchor: AutoMovieVector3Tuple = interpolated(
      origins,
      n,
      s0 - PAD,
      bones.knee[1],
    );
    frames.origins = origins.map(
      (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
        p[0] - anchor[0] + bones.knee[0],
        p[1],
        p[2] - anchor[2] + bones.knee[2],
      ],
    );
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
  export function rotated(
    frames: IAutoMovieHumanLegAxis.IFrames,
    s: number,
    x: AutoMovieVector3Tuple,
    twisted: boolean = true,
  ): AutoMovieVector3Tuple {
    let out: AutoMovieVector3Tuple = twisted
      ? rotate(
          x,
          [0, 1, 0],
          -frames.twist * fifth((s - frames.s0) / (frames.s1 - frames.s0)),
        )
      : x;
    for (const t of frames.turns)
      out = rotate(out, t.axis, t.angle * fifth((s - t.from) / t.span));
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
  export function interpolated(
    table: readonly AutoMovieVector3Tuple[],
    rate: IAutoMovieHumanLegAxis.InterpolatedRate,
    first: number,
    s: number,
  ): AutoMovieVector3Tuple {
    const i: number = Math.max(
      0,
      Math.min(table.length - 2, Math.floor(s - first)),
    );
    const f: number = s - first - i;
    const a: AutoMovieVector3Tuple = table[i]!;
    const b: AutoMovieVector3Tuple = table[i + 1]!;
    const ma: AutoMovieVector3Tuple = rate(first + i);
    const mb: AutoMovieVector3Tuple = rate(first + i + 1);
    return [0, 1, 2].map(
      (c: number): number =>
        (2 * f ** 3 - 3 * f ** 2 + 1) * a[c]! +
        (f ** 3 - 2 * f ** 2 + f) * ma[c]! +
        (3 * f ** 2 - 2 * f ** 3) * b[c]! +
        (f ** 3 - f ** 2) * mb[c]!,
    ) as AutoMovieVector3Tuple;
  }

  /** The frame at station s, canonical. */
  export function frameAt(
    frames: IAutoMovieHumanLegAxis.IFrames,
    s: number,
  ): IAutoMovieHumanLegAxis.IFrame {
    const n: AutoMovieVector3Tuple = rotated(frames, s, [0, 1, 0], false);
    const origin: AutoMovieVector3Tuple = interpolated(
      frames.origins,
      (q: number): AutoMovieVector3Tuple => {
        const d: AutoMovieVector3Tuple = rotated(frames, q, [0, 1, 0], false);
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
   * @param side 0 for the central difference; 1 or -1 for the one-sided
   *   difference of second order toward that side, where nothing exists past a
   *   ring.
   */
  export function frameRate(
    frames: IAutoMovieHumanLegAxis.IFrames,
    s: number,
    side: 1 | -1 | 0,
  ): IAutoMovieHumanLegAxis.IFrame {
    const n: AutoMovieVector3Tuple = rotated(frames, s, [0, 1, 0], false);
    function derive(
      pick: (f: IAutoMovieHumanLegAxis.IFrame) => AutoMovieVector3Tuple,
    ): AutoMovieVector3Tuple {
      if (side === 0) {
        const a: AutoMovieVector3Tuple = pick(frameAt(frames, s - FRAME_STEP));
        const b: AutoMovieVector3Tuple = pick(frameAt(frames, s + FRAME_STEP));
        return scale(sub(b, a), 1 / (2 * FRAME_STEP));
      }
      const d: number = side * FRAME_STEP;
      const p: AutoMovieVector3Tuple = pick(frameAt(frames, s));
      const a: AutoMovieVector3Tuple = pick(frameAt(frames, s + d));
      const b: AutoMovieVector3Tuple = pick(frameAt(frames, s + 2 * d));
      return [0, 1, 2].map(
        (c: number): number => (-3 * p[c]! + 4 * a[c]! - b[c]!) / (2 * d),
      ) as AutoMovieVector3Tuple;
    }
    return {
      origin: scale(n, 1 / n[1]),
      u: derive(
        (f: IAutoMovieHumanLegAxis.IFrame): AutoMovieVector3Tuple => f.u,
      ),
      v: derive(
        (f: IAutoMovieHumanLegAxis.IFrame): AutoMovieVector3Tuple => f.v,
      ),
      n: derive(
        (f: IAutoMovieHumanLegAxis.IFrame): AutoMovieVector3Tuple => f.n,
      ),
    };
  }

  /** Margin of the origin's table past the rings, mm. */
  export const PAD: number = 2;

  /** Station step of the frame differences, mm. */
  export const FRAME_STEP: number = 0.01;
}

const { cross, dot, norm, normalize, plus, rotate, scale, sub, fifth } =
  AutoMovieHumanLegVector;
