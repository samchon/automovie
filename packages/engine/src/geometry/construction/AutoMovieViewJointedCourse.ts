import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieAxisDirection } from "./AutoMovieAxisDirection";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";

/**
 * The admitted jointed course's Rodrigues transport and analytic frame jets.
 *
 * @evidence contracts/common.md#principled-implementation The tangent and both chart axes follow the same quintic angle; differentiating Rodrigues gives omega cross vector and its second product derivative. Origin values use the existing fixed Gauss quadrature of that tangent.
 * @evidence contracts/common.md#clear-and-simple-design This owner prepares/evaluates the course and its displacement integral; ViewAxis owns initial chart-direction admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled frame fit or finite-difference jet is introduced; quadrature values remain approximations to the analytic integral, without a universal error certificate.
 * @evidence contracts/common.md#meaningful-documentation States arclength units, angle derivatives, zero derivatives on straight runs and the numerical origin-value boundary.
 * @evidence contracts/performance.md#efficient-algorithms A query walks preceding turns and pays the existing fixed quadrature per nonzero turn, with constant extra derivative arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Frame values and derivatives share one course walk, angle and tangent at the requested station.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned axis borrows immutable admitted course arrays and its first frame; each query owns fresh output vectors without a global cache.
 */
export namespace AutoMovieViewJointedCourse {
  /**
   * A prepared turn shared by admission, straight-run placement and frame evaluation.
   *
   * @evidence contracts/common.md#principled-implementation Axis/angle and arclength half-span define the quintic tangent rotation; setback and start locate it between admitted segments.
   * @evidence contracts/common.md#clear-and-simple-design Six fields carry one already admitted corner without another geometry representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not admit an angle, shorten an overlapping turn or turn a numerical zero into a straight joint.
   * @evidence contracts/common.md#meaningful-documentation Members state radians, millimetres, axis direction and source index.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Prepared data executes no integration.
   * @evidence contracts/performance.md#reuse-equivalent-work The same record serves setback preparation and every frame query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources An admitted course owns one fixed-size record per interior centre.
   */
  export interface ITurn {
    /** Index of the interior source centre. */
    centre: number;

    /** Half the turning arclength, mm; zero for an exactly straight joint. */
    half: number;

    /** Total nonnegative angle, radians. */
    angle: number;

    /** Unit rotation axis; zero on a straight joint. */
    axis: Vec3;

    /** Distance removed from each neighbouring segment, mm. */
    setback: number;

    /** Arclength station of the turn's first point, mm. */
    start: number;
  }

  /**
   * Admitted finite segments and nonoverlapping quintic-angle turns.
   *
   * @evidence contracts/common.md#principled-implementation Prepared directions, lengths and turns share the same centreline definition for frame and run readings.
   * @evidence contracts/common.md#clear-and-simple-design Three finite arrays expose the admitted course without duplicating centreline geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The preparation refuses inadmissible turns instead of shortening or fitting them.
   * @evidence contracts/common.md#meaningful-documentation Directions are unit and lengths/start/setbacks are kernel mm; callers keep preparation immutable.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record executes no preparation or query.
   * @evidence contracts/performance.md#reuse-equivalent-work Both jointed-frame and straight-run consumers use this one preparation contract.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its caller owns O(C) records for C centres; no global cache retains the course.
   */
  export interface ICourse {
    /** Unit segment directions in source order. */
    directions: Vec3[];

    /** Positive segment lengths, mm. */
    lengths: number[];

    /** One admitted turn per interior source centre. */
    turns: ITurn[];
  }

  /**
   * Prepare the original centreline admission and setback integral shared by both consumers.
   *
   * @evidence contracts/common.md#principled-implementation Finite separated centres give normalized segments; atan2 determines nonzero turns and the original tangent integral gives each bisector setback before overlap admission.
   * @evidence contracts/common.md#clear-and-simple-design One preparation owns direction/turn geometry, lengths and arclength placements for both frame and run queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps the existing opposite-direction conditioning limit and refuses negative/nonfinite halves or overruns; no turn is shortened or thresholded to zero.
   * @evidence contracts/common.md#meaningful-documentation Inputs and failures use kernel mm; exact straight joints consume zero setback and turn length.
   * @evidence contracts/performance.md#efficient-algorithms Linear centre passes plus fixed Gauss quadrature for each nonzero turn require O(C) output and scratch.
   * @evidence contracts/performance.md#reuse-equivalent-work Each nonzero turn's full displacement is integrated once in this preparation and shared by its setback and placement.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Failure releases local arrays; success transfers the finite prepared arrays to the caller without global retention.
   */
  export function prepare(
    centres: readonly Vec3[],
    halves: readonly number[],
  ): ICourse | string {
    const m: number = centres.length;
    if (m < 2) return `${m} centres, at least two needed`;
    if (!centres.every((p: Vec3): boolean => p.every(Number.isFinite)))
      return "joint centres are not finite";
    if (halves.length !== m - 2)
      return `${halves.length} half lengths for ${m - 2} interior centres`;
    const directions: Vec3[] = [];
    const lengths: number[] = [];
    for (let i: number = 0; i + 1 < m; i++) {
      const d: Vec3 = sub(centres[i + 1]!, centres[i]!);
      const l: number = Math.hypot(d[0], d[1], d[2]);
      if (!(l > 0 && Number.isFinite(l)))
        return `centres ${i} and ${i + 1} have no finite positive separation`;
      directions.push(AutoMovieAxisDirection.unit(d, l));
      lengths.push(l);
    }

    // Full-turn displacement determines the symmetric setback on both segments.
    const turns: ITurn[] = [];
    for (let i: number = 1; i + 1 < m; i++) {
      const h: number = halves[i - 1]!;
      const a: Vec3 = directions[i - 1]!;
      const b: Vec3 = directions[i]!;
      const n: Vec3 = cross(a, b);
      const ln: number = Math.hypot(n[0], n[1], n[2]);
      const angle: number = Math.atan2(ln, dot(a, b));
      if (!(angle < Math.PI - 1e-9))
        return `segments ${i - 1} and ${i} are opposite`;
      if (!(Number.isFinite(h) && h >= 0 && (angle === 0 || h > 0)))
        return `half length ${h} at centre ${i} must be finite and nonnegative, and positive for a nonzero turn`;
      const axis: Vec3 =
        ln > 0 ? AutoMovieAxisDirection.unit(n, ln) : [0, 0, 0];
      const turn: ITurn = {
        centre: i,
        half: angle === 0 ? 0 : h,
        angle,
        axis,
        setback: angle === 0 ? 0 : h,
        start: 0,
      };
      if (turn.angle > 0) {
        const displacement: Vec3 = integrate(a, turn, 2 * h);
        const bisector: Vec3 = add(a, b);
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
      const t: ITurn = turns[i]!;
      const previous: number = i >= 1 ? turns[i - 1]!.setback : 0;
      s += lengths[i]! - previous - t.setback;
      t.start = s;
      s += 2 * t.half;
    }
    return { directions, lengths, turns };
  }

  /**
   * Evaluate one immutable admitted course from its first origin, tangent and chart axis.
   *
   * @evidence contracts/common.md#principled-implementation Integrates the quintic-angle tangent for the origin and reads exact analytic T, theta-prime and theta-double-prime for the frame derivatives; p-prime=T and p-double-prime=theta-prime times axis-cross-T.
   * @evidence contracts/common.md#clear-and-simple-design The at and jet callbacks share one evaluator and therefore the same source value.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Straight runs use zero angular velocity; no knot resampling, shortened turn or endpoint finite difference changes the course.
   * @evidence contracts/common.md#meaningful-documentation Inputs are admitted immutable mm course data; station derivatives describe the analytic curve whose value is evaluated by fixed quadrature.
   * @evidence contracts/performance.md#efficient-algorithms Each read visits at most all turns with fixed quadrature panels and constant-size jet storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Both callback modes share the same admitted direction/turn arrays and the same evaluator; independent queries do not cache or share mutable output.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The axis closure borrows its first origin/direction, chart axis and turns for its lifetime; caller mutation is unsupported and returned jets own their vectors.
   */
  export function create(
    origin: Vec3,
    direction: Vec3,
    first: Vec3,
    turns: readonly ITurn[],
  ): AutoMovieViewAxis.IAxis {
    const read: (station: number) => ISample = (station: number): ISample => {
      let point: Vec3 = [...origin];
      let u: Vec3 = first;
      let tangent: Vec3 = direction;
      let at: number = 0;
      let active: ITurn | undefined;
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
      const v: Vec3 = cross(u, tangent);
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
      at: (station: number): AutoMovieLoftFrame.IFrame => read(station).value,
      jet: (
        station: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): AutoMovieViewAxisJet.IJet | null => {
        const sample: ISample = read(station);
        const turn: ITurn | undefined = sample.active;
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
        const axis: Vec3 = turn?.axis ?? [0, 0, 0];
        const derivative: (vector: Vec3) => Vec3 = (vector: Vec3): Vec3 =>
          scale(cross(axis, vector), angular);
        const second: (vector: Vec3) => Vec3 = (vector: Vec3): Vec3 =>
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

  /** One value-only course walk; derivative vectors are allocated only by the analytic jet query. */
  interface ISample {
    /** Actual quadrature-origin frame value. */
    value: AutoMovieLoftFrame.IFrame;

    /** Analytic unit tangent at that station. */
    tangent: Vec3;

    /** Active nonzero turn, absent on a straight run or turn endpoint. */
    active: ITurn | undefined;

    /** Unit turn share when active, zero otherwise. */
    offset: number;
  }

  /**
   * Integral of one admitted turn's tangent over an arclength from its start.
   *
   * @evidence contracts/common.md#principled-implementation Preserves composite ten-point Gauss-Legendre quadrature on eight panels for the original Rodrigues/quintic-angle integrand.
   * @evidence contracts/common.md#clear-and-simple-design The same integral computes both prepared setbacks and query origin values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the original nodes, panels and arithmetic order without a fitted displacement or unproved exactness guarantee.
   * @evidence contracts/common.md#meaningful-documentation Tangent is unit, turn is admitted and length/output are mm; the numerical integral approximates the analytic curve.
   * @evidence contracts/performance.md#efficient-algorithms Eight panels times ten nodes gives fixed work and fixed live-vector storage per integral.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller reuses full-turn results for setbacks; this pure evaluation retains no query cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All quadrature vectors are call-local and only the displacement triple escapes.
   */
  export function integrate(tangent: Vec3, turn: ITurn, length: number): Vec3 {
    let sum: Vec3 = [0, 0, 0];
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

/** Source vector; points and displacements use world mm. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** Shared vector arithmetic preserves the original jointed course's order. */
const { add, cross, dot, scale, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/** Quintic smoothstep, constant outside its closed unit span. */
function smoothstep(x: number): number {
  const c: number = Math.min(1, Math.max(0, x));
  return c * c * c * (10 + c * (-15 + 6 * c));
}

/** Rodrigues rotation about an admitted unit axis. */
function rotate(a: Vec3, axis: Vec3, angle: number): Vec3 {
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
