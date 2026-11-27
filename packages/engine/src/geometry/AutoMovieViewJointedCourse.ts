import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

import { AutoMovieAxisDirection } from "./AutoMovieAxisDirection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";

/** The admitted jointed course's Rodrigues transport and analytic frame jets. */
export namespace AutoMovieViewJointedCourse {
  /**
   * Prepare the original centreline admission and setback integral shared by
   * both consumers.
   */
  export function prepare(
    centres: readonly AutoMovieVector3Tuple[],
    halves: readonly number[],
  ): IAutoMovieViewJointedCourse.ICourse | string {
    const m: number = centres.length;
    if (m < 2) return `${m} centres, at least two needed`;
    if (halves.length !== m - 2)
      return `${halves.length} half lengths for ${m - 2} interior centres`;
    const directions: AutoMovieVector3Tuple[] = [];
    const lengths: number[] = [];
    for (let i: number = 0; i + 1 < m; i++) {
      const d: AutoMovieVector3Tuple = sub(centres[i + 1]!, centres[i]!);
      const l: number = Math.hypot(d[0], d[1], d[2]);
      if (!(l > 0))
        return `centres ${i} and ${i + 1} have no finite positive separation`;
      directions.push(AutoMovieAxisDirection.unit(d, l));
      lengths.push(l);
    }

    // Full-turn displacement determines the symmetric setback on both segments.
    const turns: IAutoMovieViewJointedCourse.ITurn[] = [];
    for (let i: number = 1; i + 1 < m; i++) {
      const h: number = halves[i - 1]!;
      const a: AutoMovieVector3Tuple = directions[i - 1]!;
      const b: AutoMovieVector3Tuple = directions[i]!;
      const n: AutoMovieVector3Tuple = cross(a, b);
      const ln: number = Math.hypot(n[0], n[1], n[2]);
      const angle: number = Math.atan2(ln, dot(a, b));
      if (!(angle < Math.PI - 1e-9))
        return `segments ${i - 1} and ${i} are opposite`;
      if (!(h >= 0 && (angle === 0 || h > 0)))
        return `half length ${h} at centre ${i} must be finite and nonnegative, and positive for a nonzero turn`;
      const axis: AutoMovieVector3Tuple =
        ln > 0 ? AutoMovieAxisDirection.unit(n, ln) : [0, 0, 0];
      const turn: IAutoMovieViewJointedCourse.ITurn = {
        centre: i,
        half: angle === 0 ? 0 : h,
        angle,
        axis,
        setback: angle === 0 ? 0 : h,
        start: 0,
      };
      if (turn.angle > 0) {
        const displacement: AutoMovieVector3Tuple = integrate(a, turn, 2 * h);
        const bisector: AutoMovieVector3Tuple = add(a, b);
        turn.setback = dot(displacement, bisector) / dot(bisector, bisector);
      }
      turns.push(turn);
    }
    for (let i: number = 0; i + 1 < m; i++) {
      const before: number = i >= 1 ? turns[i - 1]!.setback : 0;
      const after: number = i + 1 < m - 1 ? turns[i]!.setback : 0;
      if (!(before + after < lengths[i]!))
        return `the turns' set-backs ${before} and ${after} overrun segment ${i} of length ${lengths[i]}`;
    }

    // The same setback/turn lengths date each turn in physical arclength.
    let s: number = 0;
    for (let i: number = 0; i < turns.length; i++) {
      const t: IAutoMovieViewJointedCourse.ITurn = turns[i]!;
      const previous: number = i >= 1 ? turns[i - 1]!.setback : 0;
      s += lengths[i]! - previous - t.setback;
      t.start = s;
      s += 2 * t.half;
    }
    return { directions, lengths, turns };
  }

  /**
   * Evaluate one immutable admitted course from its first origin, tangent and
   * chart axis.
   */
  export function create(
    origin: AutoMovieVector3Tuple,
    direction: AutoMovieVector3Tuple,
    first: AutoMovieVector3Tuple,
    turns: readonly IAutoMovieViewJointedCourse.ITurn[],
  ): IAutoMovieViewAxis.IAxis {
    const read: (station: number) => ISample = (station: number): ISample => {
      let point: AutoMovieVector3Tuple = [...origin];
      let u: AutoMovieVector3Tuple = first;
      let tangent: AutoMovieVector3Tuple = direction;
      let at: number = 0;
      let active: IAutoMovieViewJointedCourse.ITurn | undefined;
      let offset: number = 0;
      let inside: boolean = false;
      for (const turn of turns) {
        if (station <= turn.start) break;
        point = add(point, scale(tangent, turn.start - at));
        at = turn.start;
        const share: number = Math.min(2 * turn.half, station - at);
        if (turn.angle > 0) {
          point = add(point, integrate(tangent, turn, share));
          const x: number = share / (2 * turn.half);
          const angle: number = turn.angle * smoothstep(x);
          u = rotate(u, turn.axis, angle);
          tangent = rotate(tangent, turn.axis, angle);
          if (share < 2 * turn.half) {
            inside = true;
            active = turn;
            offset = x;
          }
        } else point = add(point, scale(tangent, share));
        at += share;
        if (share < 2 * turn.half) break;
      }
      const v: AutoMovieVector3Tuple = cross(u, tangent);
      return {
        value: {
          origin: inside ? point : add(point, scale(tangent, station - at)),
          u: [...u],
          v,
        },
        tangent,
        active,
        offset,
      };
    };
    return {
      at: (station: number): IAutoMovieLoftSectionFrame => read(station).value,
      jet: (
        station: number,
        parameter?: IAutoMovieConstructionOutlineParameter,
      ): IAutoMovieViewAxisJet.IJet | null => {
        const sample: ISample = read(station);
        const turn: IAutoMovieViewJointedCourse.ITurn | undefined =
          sample.active;
        const x: number = sample.offset;
        const angular: number =
          turn === undefined
            ? 0
            : (turn.angle * 30 * x * x * (1 - x) * (1 - x)) / (2 * turn.half);
        const angularRate: number =
          turn === undefined
            ? 0
            : (turn.angle * 60 * x * (1 - x) * (1 - 2 * x)) /
              (4 * turn.half * turn.half);
        const axis: AutoMovieVector3Tuple = turn?.axis ?? [0, 0, 0];
        const derivative: (
          vector: AutoMovieVector3Tuple,
        ) => AutoMovieVector3Tuple = (
          vector: AutoMovieVector3Tuple,
        ): AutoMovieVector3Tuple => scale(cross(axis, vector), angular);
        const second: (
          vector: AutoMovieVector3Tuple,
        ) => AutoMovieVector3Tuple = (
          vector: AutoMovieVector3Tuple,
        ): AutoMovieVector3Tuple =>
          add(
            scale(cross(axis, vector), angularRate),
            scale(cross(axis, cross(axis, vector)), angular * angular),
          );
        return AutoMovieViewAxisJet.parameter(
          {
            value: sample.value,
            first: {
              origin: [...sample.tangent],
              u: derivative(sample.value.u),
              v: derivative(sample.value.v),
            },
            second: {
              origin: derivative(sample.tangent),
              u: second(sample.value.u),
              v: second(sample.value.v),
            },
          },
          parameter,
          station,
        );
      },
    };
  }

  /**
   * One value-only course walk; derivative vectors are allocated only by the
   * analytic jet query.
   */
  interface ISample {
    /** Actual quadrature-origin frame value. */
    value: IAutoMovieLoftSectionFrame;

    /** Analytic unit tangent at that station. */
    tangent: AutoMovieVector3Tuple;

    /** Active nonzero turn, absent on a straight run or turn endpoint. */
    active: IAutoMovieViewJointedCourse.ITurn | undefined;

    /** Unit turn share when active, zero otherwise. */
    offset: number;
  }

  /** Integral of one admitted turn's tangent over an arclength from its start. */
  export function integrate(
    tangent: AutoMovieVector3Tuple,
    turn: IAutoMovieViewJointedCourse.ITurn,
    length: number,
  ): AutoMovieVector3Tuple {
    let sum: AutoMovieVector3Tuple = [0, 0, 0];
    const width: number = length / PANELS;
    for (let p: number = 0; p < PANELS; p++)
      for (const [x, w] of GAUSS) {
        const sigma: number = width * (p + (x + 1) / 2);
        const turned: number = turn.angle * smoothstep(sigma / (2 * turn.half));
        sum = add(
          sum,
          scale(rotate(tangent, turn.axis, turned), (w * width) / 2),
        );
      }
    return sum;
  }
}

/** Shared vector arithmetic preserves the original jointed course's order. */
const { add, cross, dot, scale, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/** Quintic smoothstep, constant outside its closed unit span. */
function smoothstep(x: number): number {
  const c: number = Math.min(1, Math.max(0, x));
  return c * c * c * (10 + c * (-15 + 6 * c));
}

/** Rodrigues rotation about an admitted unit axis. */
function rotate(
  a: AutoMovieVector3Tuple,
  axis: AutoMovieVector3Tuple,
  angle: number,
): AutoMovieVector3Tuple {
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  return add(
    add(scale(a, c), scale(cross(axis, a), s)),
    scale(axis, dot(axis, a) * (1 - c)),
  );
}

/** Original ten-point Gauss-Legendre nodes and weights on [-1,1]. */
const GAUSS: readonly (readonly [number, number])[] = [
  [-0.9739065285171717, 0.0666713443086881],
  [-0.8650633666889845, 0.1494513491505806],
  [-0.6794095682990244, 0.219086362515982],
  [-0.4333953941292472, 0.2692667193099963],
  [-0.1488743389816312, 0.2955242247147529],
  [0.1488743389816312, 0.2955242247147529],
  [0.4333953941292472, 0.2692667193099963],
  [0.6794095682990244, 0.219086362515982],
  [0.8650633666889845, 0.1494513491505806],
  [0.9739065285171717, 0.0666713443086881],
];

/** Original fixed number of displacement quadrature panels. */
const PANELS: number = 8;
