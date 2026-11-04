import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSolidVector } from "../../lofting/AutoMovieHumanSolidVector";
import type { AutoMovieHumanViewAxis } from "../../lofting/AutoMovieHumanViewAxis";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
const { add, cross, dot, norm, scale, sub } = AutoMovieHumanSolidVector;

/**
 * The axis of one bone chain lofted as one walk (a leg over femur and tibia,
 * an arm over humerus, forearm and palm, a digit over its phalanges): straight
 * along each bone at the neutral pose, and turned at each joint by a C2 turn
 * about one fixed axis over the joint's own half length.
 *
 * Why one walk. Two nearly collinear tubes cross nearly tangentially, where
 * the solid merge's trace is singular (its Jacobian `[A_s, -B_y, -B_theta]`
 * loses rank as `A_s` falls into the host's tangent plane), so a joint between
 * segments of one bone chain is a station of one part, its blend the C2
 * station rule (#3044 supervisor decision; #3048 to #3051).
 *
 * Construction. The station is arclength along the axis from the first joint
 * centre `P_0`, and segment `i` runs from `P_i` to `P_{i+1}` with direction
 * `d_i`. At interior joint `i` the direction turns from `d_{i-1}` to `d_i`
 * about the fixed unit axis `k_i = d_{i-1} x d_i / |...|` by the angle
 * `Theta_i e((s - J_i + h_i) / (2 h_i))`, where `J_i` is the joint's station
 * (the summed bone lengths), `h_i` the turn's half length and
 * `e(x) = 6 x^5 - 15 x^4 + 10 x^3` the quintic smoothstep, which leaves the
 * angle's first and second derivatives zero at both ends, so the direction
 * and the frame are C2 in station. A rotation about one fixed axis carries
 * the chart axes with no twist about the direction (it is the rotation
 * minimizing frame of a planar turn), so the section never spins about the
 * bone. Every chart axis takes the same rotations as the direction, in order.
 *
 * The origin is the integral of the direction from `P_0`. On a straight run it
 * is exact and linear; over a turn the integral is taken by the eight-point
 * Gauss-Legendre rule on four equal parts of the turn, whose error on this
 * analytic integrand stays far under a micrometre. A turn cuts its corner: past
 * it the origin runs parallel to the next bone, off its line by
 * `|int_{J-h}^{J+h} (t - d) ds|` in the turn's plane, of order `h Theta^2 / 10`
 * for a small angle (a 5-degree knee turned over 50 mm, about 0.04 mm), so
 * the joints downstream stand within that of their centres; the identity tests
 * read sizes on the skin, never this offset.
 *
 * Premise: consecutive turns do not overlap (`J_i + h_i <= J_{i+1} - h_{i+1}`),
 * and no turn reaches a half turn; the constructor reports a violation by
 * returning null.
 */
export namespace AutoMovieHumanJointedAxis {
  /** One joint between two bones. */
  export interface IJoint {
    /** Half the length of the turn along the station, mm, positive: the joint's skin depth. */
    half: number;
  }

  /** What the axis is built from. */
  export interface IInput {
    /** The joint centres along the chain, the first at station 0, at least two. */
    centres: Vec3[];

    /** One per interior centre (`centres.length - 2`). */
    joints: IJoint[];

    /** The chart's `u` axis on the first bone, square to it (its part along the bone is removed). */
    u: Vec3;
  }

  /** A built axis with its joint stations. */
  export interface IAxis extends AutoMovieHumanViewAxis.IAxis {
    /** Station of every centre, mm: 0, then the summed bone lengths. */
    stations: number[];
  }

  /** Gauss-Legendre nodes on `[-1, 1]` (eight points). */
  const NODES: readonly number[] = [-0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];

  /** Gauss-Legendre weights matching {@link NODES}. */
  const WEIGHTS: readonly number[] = [0.1012285362903763, 0.2223810344533745, 0.3137066661925262, 0.362683783378362, 0.362683783378362, 0.3137066661925262, 0.2223810344533745, 0.1012285362903763];

  /** Equal parts each turn's integral is split into. */
  const PARTS: number = 4;

  /**
   * Build the axis.
   *
   * @param input The centres, the joints' half lengths and the first chart axis.
   * @returns The axis, or null when a bone has no length, a turn overlaps its neighbour or reaches a half turn.
   */
  export function create(input: IInput): IAxis | null {
    const { centres, joints } = input;
    if (centres.length < 2 || joints.length !== centres.length - 2) return null;

    // Bones, their directions and the joints' stations.
    const directions: Vec3[] = [];
    const stations: number[] = [0];
    for (let i: number = 0; i + 1 < centres.length; i++) {
      const d: Vec3 = sub(centres[i + 1]!, centres[i]!);
      const length: number = norm(d);
      if (!(length > 0)) return null;
      directions.push(scale(d, 1 / length));
      stations.push(stations[i]! + length);
    }

    // Each turn: its fixed axis and angle, centred on its joint's station.
    const turns: ITurn[] = joints.map((j: IJoint, i: number): ITurn => {
      const a: Vec3 = directions[i]!;
      const b: Vec3 = directions[i + 1]!;
      const k: Vec3 = cross(a, b);
      const sine: number = norm(k);
      return { from: stations[i + 1]! - j.half, span: 2 * j.half, axis: sine > 1e-12 ? scale(k, 1 / sine) : [1, 0, 0], angle: Math.atan2(sine, dot(a, b)) };
    });
    for (let i: number = 0; i < turns.length; i++) {
      const t: ITurn = turns[i]!;
      if (!(t.span > 0) || !(t.angle < Math.PI - 1e-9)) return null;
      if (i > 0 && t.from < turns[i - 1]!.from + turns[i - 1]!.span) return null;
    }

    // The first chart axes, square to the first bone.
    const d0: Vec3 = directions[0]!;
    const u0: Vec3 = sub(input.u, scale(d0, dot(input.u, d0)));
    if (!(norm(u0) > 0)) return null;
    const u: Vec3 = scale(u0, 1 / norm(u0));
    const v: Vec3 = cross(d0, u);

    // A vector of the first bone's frame carried to a station.
    const carried = (s: number, x: Vec3): Vec3 => {
      let out: Vec3 = x;
      for (const t of turns) out = rotate(out, t.axis, t.angle * smooth((s - t.from) / t.span));
      return out;
    };

    // The origin: P_0 plus the direction's integral, straight runs in closed
    // form and turns by Gauss-Legendre. Each turn's own integral is kept.
    const across: Vec3[] = turns.map((t: ITurn): Vec3 => integral(t.from, t.from + t.span, (s: number): Vec3 => carried(s, d0)));
    const origin = (s: number): Vec3 => {
      let p: Vec3 = centres[0]!;
      let at: number = 0;
      for (let i: number = 0; i <= turns.length; i++) {
        const end: number = i < turns.length ? turns[i]!.from : Number.POSITIVE_INFINITY;
        const straight: number = Math.min(s, end) - at;
        if (straight !== 0) p = add(p, scale(carried(at + straight / 2, d0), straight));
        if (s <= end) return p;
        const t: ITurn = turns[i]!;
        if (s < t.from + t.span) return add(p, integral(t.from, s, (q: number): Vec3 => carried(q, d0)));
        p = add(p, across[i]!);
        at = t.from + t.span;
      }
      return p;
    };

    return {
      stations,
      at: (station: number): AutoMovieHumanLoftFrame.IFrame => ({
        origin: origin(station),
        u: carried(station, u),
        v: carried(station, v),
      }),
    };
  }

  /** One turn: where it starts, its length, its fixed axis and its whole angle. */
  interface ITurn {
    /** Station where it starts, mm. */
    from: number;

    /** Its length, mm. */
    span: number;

    /** Unit axis. */
    axis: Vec3;

    /** Whole angle, radians. */
    angle: number;
  }

  /**
   * The quintic smoothstep `6 x^5 - 15 x^4 + 10 x^3`, held at 0 below and 1
   * above: zero first and second derivatives at both ends.
   *
   * @param x Share of the turn.
   * @returns The eased share.
   */
  function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (t * (6 * t - 15) + 10);
  }

  /**
   * A vector turned about a unit axis (Rodrigues' formula).
   *
   * @param x The vector.
   * @param k The unit axis.
   * @param angle Radians.
   * @returns The turned vector.
   */
  function rotate(x: Vec3, k: Vec3, angle: number): Vec3 {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return add(add(scale(x, c), scale(cross(k, x), s)), scale(k, dot(k, x) * (1 - c)));
  }

  /**
   * The integral of a vector function over an interval by the eight-point
   * Gauss-Legendre rule on {@link PARTS} equal parts.
   *
   * @param a Lower end.
   * @param b Upper end.
   * @param f The integrand.
   * @returns The integral.
   */
  function integral(a: number, b: number, f: (s: number) => Vec3): Vec3 {
    let sum: Vec3 = [0, 0, 0];
    const h: number = (b - a) / PARTS;
    for (let p: number = 0; p < PARTS; p++) {
      const mid: number = a + (p + 0.5) * h;
      for (let n: number = 0; n < NODES.length; n++) sum = add(sum, scale(f(mid + (NODES[n]! * h) / 2), (WEIGHTS[n]! * h) / 2));
    }
    return sum;
  }
}
