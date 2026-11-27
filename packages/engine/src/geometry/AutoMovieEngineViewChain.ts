import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicFieldJet,
  IAutoMovieViewChain,
} from "@automovie/interface";

import { AutoMovieEngineConicFieldJet } from "./AutoMovieEngineConicFieldJet";

/**
 * A closed section as a chain of rational quadratic arcs through the section's
 * own control points about the course point: the view section's four quarters
 * generalized so each quarter's ends stand at the section's actual extreme
 * points (off the chart axes where the section's extremes are) and a quarter
 * may be split into two conic pieces at a further point of the section, each
 * piece with its own shoulder (#3158).
 *
 * Control point j is a chart point `P_j` with a tangent direction `T_j`,
 * oriented toward the next point. Arc j runs from `P_j` to `P_{j+1}`: the
 * rational quadratic with end weights 1, its control point `A_j` where the two
 * tangent lines meet, and middle weight `w_j = rho_j / (1 - rho_j)`, so its
 * point on the segment from the chord midpoint `M_j` to `A_j` stands at the
 * share `rho_j` (Shene, "Rational Bezier curves: conic sections"; Farin and
 * Hansford, "The Essentials of CAGD" ch. 13: a conic arc is fixed by its two
 * end points, their tangent lines and one more point; positive weights keep it
 * in its control triangle). An arc may bend either way, so a concave stretch is
 * an arc whose control point lies on the course point's side of its chord.
 *
 * The chain is read in polar form about the course point, so every arc must
 * advance in phase from its start to its end. For the numerator `N(t) = (1-t)^2
 * P0 + 2 w t (1-t) A + t^2 P2` the phase advances where `N x N' > 0`, and `N x
 * N' = 2 [w (1-t)^2 (P0 x A) + t (1-t) (P0 x P2) + w t^2 (A x P2)]` (expanded
 * term by term), a quadratic in t: the advance is decided exactly over the
 * whole arc from that quadratic's minimum on [0, 1].
 *
 * Neighbouring arcs share each point and tangent line (G1); their curvatures
 * there are their own, so the chain is not G2 in general. Each arc's signed end
 * curvature is `(A - P0) x (P2 - A) / (2 w^2 |A - P0|^3)` at its start and `(A
 *
 * - P0) x (P2 - A) / (2 w^2 |P2 - A|^3)` at its end (the rational Bezier end
 *   curvature for degree 2 and weights 1, w, 1), and every join's two
 *   curvatures are reported for the reader to judge. In polar form the radius
 *   is therefore C1 in phase: a phase exactly at a join reads the arc starting
 *   there, and where the two curvatures differ its second phase derivatives
 *   belong to that side alone, which the reading marks as sided.
 *
 * Phases are reduced as the native view section reduces them
 * (`AutoMovieEngineViewConic`): any finite phase, by the IEEE remainder `phi % 2pi`,
 * which is exact in binary64 and takes constant time; the reduction is periodic
 * in the binary64 value of 2pi, so a phase of magnitude x carries the rounding
 * of that constant times x / 2pi. One {@link read} owns that reduction, the arc
 * lookup and the point on the ray; every reader takes its point and direction
 * from it.
 *
 * {@link jets} gives the native source's radius Hessian over the station and the
 * phase: the arc point `B(s, t)` is carried through the shared conic algebra
 * (`AutoMovieEngineConicFieldJet.AD`) with the inputs' station jets and the arc
 * parameter t as the second coordinate, its radius `R = |B|` and phase `Phi =
 * atan2(B)` take their (s, t) partials, and the inverse function theorem turns
 * them into partials over (s, phi) at the arc parameter the ray meets.
 */
export namespace AutoMovieEngineViewChain {
  /**
   * Prepare a chain's arcs.
   *
   * @param input The chain's inputs.
   * @returns The prepared chain, or its fault naming the arc and premise.
   */
  export function of(
    input: IAutoMovieViewChain.IInput,
  ): IAutoMovieViewChain.ISection {
    const K: number = input.points.length;
    const fail = (fault: string): IAutoMovieViewChain.ISection => ({
      input,
      arcs: [],
      joins: [],
      fault,
    });
    if (K < 3 || input.tangents.length !== K || input.shoulders.length !== K)
      return fail(
        `a chain needs at least 3 points with one tangent and shoulder each (${K}, ${input.tangents.length}, ${input.shoulders.length})`,
      );
    for (let j: number = 0; j < K; ++j) {
      if (!(Math.hypot(...input.points[j]!) > 0))
        return fail(`point ${j} stands on the course point`);
      if (!(Math.hypot(...input.tangents[j]!) > 0))
        return fail(`point ${j}: its tangent is zero`);
      if (!(input.shoulders[j]! > 0 && input.shoulders[j]! < 1))
        return fail(`arc ${j}: shoulder ${input.shoulders[j]} outside (0, 1)`);
    }

    // Phases unwrapped from the first point; each must advance and the whole stay within one turn.
    const phases: number[] = [
      Math.atan2(input.points[0]![1], input.points[0]![0]),
    ];
    for (let j: number = 1; j < K; ++j) {
      let phi: number = Math.atan2(input.points[j]![1], input.points[j]![0]);
      while (phi <= phases[j - 1]!) phi += 2 * Math.PI;
      phases.push(phi);
    }
    if (!(phases[K - 1]! - phases[0]! < 2 * Math.PI))
      return fail("the points' phases do not advance within one turn");
    const arcs: IAutoMovieViewChain.IArc[] = [];
    for (let j: number = 0; j < K; ++j) {
      const k: number = (j + 1) % K;
      const P0: AutoMovieVector2Tuple = input.points[j]!;
      const P2: AutoMovieVector2Tuple = input.points[k]!;
      const T0: AutoMovieVector2Tuple = input.tangents[j]!;
      const T2: AutoMovieVector2Tuple = input.tangents[k]!;

      // The tangent lines' meeting: P0 + a T0 = P2 - b T2.
      const den: number = cross(T0, T2);
      if (den === 0) return fail(`arc ${j}: its end tangents are parallel`);
      const d: AutoMovieVector2Tuple = [P2[0] - P0[0], P2[1] - P0[1]];
      const a: number = cross(d, T2) / den;
      const b: number = cross(T0, d) / den;
      if (!(a > 0 && b > 0))
        return fail(
          `arc ${j}: the tangent lines meet ${a > 0 ? "behind the end" : "behind the start"} (a ${a.toExponential(3)}, b ${b.toExponential(3)}), so no positive-weight arc joins them`,
        );
      const A: AutoMovieVector2Tuple = [P0[0] + a * T0[0], P0[1] + a * T0[1]];
      const w: number = input.shoulders[j]! / (1 - input.shoulders[j]!);

      // Exact phase advance: f(t) = w c0 (1-t)^2 + c1 t (1-t) + w c2 t^2 > 0 on [0, 1].
      const c0: number = cross(P0, A);
      const c1: number = cross(P0, P2);
      const c2: number = cross(A, P2);
      const qa: number = w * c0 - c1 + w * c2;
      const qb: number = c1 - 2 * w * c0;
      const vertex: number = qa > 0 ? -qb / (2 * qa) : NaN;
      const least: number = Math.min(
        w * c0,
        w * c2,
        vertex > 0 && vertex < 1
          ? w * c0 + qb * vertex + qa * vertex * vertex
          : Infinity,
      );
      if (!(least > 0))
        return fail(
          `arc ${j}: its phase does not advance over the whole arc (N x N' reaches ${least.toExponential(3)}); the section is not star-shaped about the course point there`,
        );

      // Signed end curvatures of the rational quadratic with weights 1, w, 1.
      const e0: AutoMovieVector2Tuple = [A[0] - P0[0], A[1] - P0[1]];
      const e1: AutoMovieVector2Tuple = [P2[0] - A[0], P2[1] - A[1]];
      const turn: number = cross(e0, e1);
      const end: number = k === 0 ? phases[0]! + 2 * Math.PI : phases[k]!;
      arcs.push({
        start: P0,
        control: A,
        end: P2,
        weight: w,
        span: [phases[j]!, end],
        curvature: [
          turn / (2 * w * w * Math.hypot(...e0) ** 3),
          turn / (2 * w * w * Math.hypot(...e1) ** 3),
        ],
      });
    }
    const joins: IAutoMovieViewChain.IJoin[] = arcs.map(
      (
        arc: IAutoMovieViewChain.IArc,
        j: number,
      ): IAutoMovieViewChain.IJoin => ({
        phase: phases[j]!,
        before: arcs[(j + K - 1) % K]!.curvature[1],
        after: arc.curvature[0],
      }),
    );
    return { input, arcs, joins, fault: null };
  }

  /**
   * The values of station-jet inputs.
   *
   * @param input The inputs with their station jets.
   * @returns The same inputs at their values.
   */
  export function primal(
    input: IAutoMovieViewChain.IFieldInput,
  ): IAutoMovieViewChain.IInput {
    return {
      points: input.points.map(
        (
          p: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet],
        ): AutoMovieVector2Tuple => [p[0][0], p[1][0]],
      ),
      tangents: input.tangents.map(
        (
          t: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet],
        ): AutoMovieVector2Tuple => [t[0][0], t[1][0]],
      ),
      shoulders: input.shoulders.map(
        (s: IAutoMovieConicFieldJet.IJet): number => s[0],
      ),
    };
  }

  /**
   * Where a phase's ray meets the chain: the one owner of phase reduction, arc
   * lookup and point.
   *
   * @param section A prepared chain.
   * @param phi Phase, radians, finite.
   * @returns The arc, its parameter, its point and the sided flag, or null for
   *   a faulted chain, a non-finite phase or no admitted root.
   */
  export function read(
    section: IAutoMovieViewChain.ISection,
    phi: number,
  ): IAutoMovieViewChain.IRead | null {
    if (section.fault !== null) return null;
    const arcs: IAutoMovieViewChain.IArc[] = section.arcs;
    const first: number = arcs[0]!.span[0];
    const turn: number = 2 * Math.PI;
    let offset: number = (phi - first) % turn;
    if (offset < 0) offset += turn;
    const p: number = first + offset;

    // The last arc whose span starts at or before p: a join phase reads the arc starting there.
    let lo: number = 0;
    let hi: number = arcs.length - 1;
    while (lo < hi) {
      const mid: number = (lo + hi + 1) >> 1;
      if (arcs[mid]!.span[0] <= p) lo = mid;
      else hi = mid - 1;
    }
    const index: number = lo;
    const arc: IAutoMovieViewChain.IArc = arcs[index]!;
    if (!(p <= arc.span[1])) return null;
    const d: AutoMovieVector2Tuple = [Math.cos(p), Math.sin(p)];
    const alpha: number = cross(d, arc.start);
    const beta: number = cross(d, arc.control);
    const gamma: number = cross(d, arc.end);

    // alpha (1 - t)^2 + 2 w beta t (1 - t) + gamma t^2 = 0, as A t^2 + B t + C = 0.
    const A: number = alpha - 2 * arc.weight * beta + gamma;
    const B: number = 2 * arc.weight * beta - 2 * alpha;
    const C: number = alpha;
    const roots: number[] = [];
    if (Math.abs(A) <= 1e-15 * (Math.abs(B) + Math.abs(C))) {
      if (B !== 0) roots.push(-C / B);
    } else {
      const disc: number = B * B - 4 * A * C;
      if (disc >= 0) {
        const q: number = -0.5 * (B + (B < 0 ? -1 : 1) * Math.sqrt(disc));
        roots.push(q / A);
        if (q !== 0) roots.push(C / q);
      }
    }
    let best: IAutoMovieViewChain.IRead | null = null;
    let along: number = -Infinity;
    const join: IAutoMovieViewChain.IJoin = section.joins[index]!;
    const sided: boolean = p === arc.span[0] && join.before !== join.after;
    for (const t of roots) {
      if (!(t >= -1e-12 && t <= 1 + 1e-12)) continue;
      const clamped: number = Math.min(1, Math.max(0, t));
      const point: AutoMovieVector2Tuple = evaluate(arc, clamped);
      const reach: number = point[0] * d[0] + point[1] * d[1];
      if (reach > 0 && reach > along) {
        along = reach;
        best = { index, t: clamped, point, sided };
      }
    }
    return best;
  }

  /**
   * The chain's radius at a phase.
   *
   * @param section A prepared chain.
   * @param phi Phase, radians, finite.
   * @returns The radius, millimetres, or NaN where `read` yields no reading.
   */
  export function radius(
    section: IAutoMovieViewChain.ISection,
    phi: number,
  ): number {
    const at: IAutoMovieViewChain.IRead | null = read(section, phi);
    return at === null ? NaN : Math.hypot(...at.point);
  }

  /**
   * The native jets at one station: for each phase, its ray reading and the
   * radius Hessian over the station and the phase.
   *
   * @param input The inputs with their station jets.
   * @returns A reader from a phase to its reading (null where `read` yields
   *   none or the phase speed vanishes), or the chain's fault.
   */
  export function jets(
    input: IAutoMovieViewChain.IFieldInput,
  ): ((phi: number) => IAutoMovieViewChain.IReading | null) | string {
    const ops: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieEngineConicFieldJet.AD;
    const section: IAutoMovieViewChain.ISection = of(primal(input));
    if (section.fault !== null) return section.fault;
    const K: number = input.points.length;

    // Station-only jets of every arc: its ends, its control point and its weight.
    const crossJ = (
      a: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet],
      b: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet],
    ): IAutoMovieConicFieldJet.IJet =>
      ops.subtract(ops.multiply(a[0], b[1]), ops.multiply(a[1], b[0]));
    const pieces: {
      P0: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];
      A: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];
      P2: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];
      w: IAutoMovieConicFieldJet.IJet;
    }[] = section.arcs.map(
      (
        _: IAutoMovieViewChain.IArc,
        j: number,
      ): {
        P0: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];
        A: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];
        P2: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];
        w: IAutoMovieConicFieldJet.IJet;
      } => {
        const k: number = (j + 1) % K;
        const [P0, T0, P2, T2] = [
          input.points[j]!,
          input.tangents[j]!,
          input.points[k]!,
          input.tangents[k]!,
        ];
        const d: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet] =
          [ops.subtract(P2[0], P0[0]), ops.subtract(P2[1], P0[1])];
        const a: IAutoMovieConicFieldJet.IJet = ops.divide(
          crossJ(d, T2),
          crossJ(T0, T2),
        );
        const A: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet] =
          [
            ops.add(P0[0], ops.multiply(a, T0[0])),
            ops.add(P0[1], ops.multiply(a, T0[1])),
          ];
        const w: IAutoMovieConicFieldJet.IJet = ops.divide(
          input.shoulders[j]!,
          ops.subtract(ops.constant(1), input.shoulders[j]!),
        );
        return { P0, A, P2, w };
      },
    );
    return (phi: number): IAutoMovieViewChain.IReading | null => {
      const at: IAutoMovieViewChain.IRead | null = read(section, phi);
      if (at === null) return null;
      const { P0, A, P2, w } = pieces[at.index]!;

      // B(s, t) with t the second coordinate.
      const t: IAutoMovieConicFieldJet.IJet = [at.t, 0, 1, 0, 0, 0];
      const u: IAutoMovieConicFieldJet.IJet = ops.subtract(ops.constant(1), t);
      const b0: IAutoMovieConicFieldJet.IJet = ops.multiply(u, u);
      const b1: IAutoMovieConicFieldJet.IJet = ops.multiply(
        ops.constant(2),
        ops.multiply(w, ops.multiply(u, t)),
      );
      const b2: IAutoMovieConicFieldJet.IJet = ops.multiply(t, t);
      const den: IAutoMovieConicFieldJet.IJet = ops.add(ops.add(b0, b1), b2);
      const B: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet] = [
        0, 1,
      ].map(
        (c: number): IAutoMovieConicFieldJet.IJet =>
          ops.divide(
            ops.add(
              ops.add(ops.multiply(b0, P0[c]!), ops.multiply(b1, A[c]!)),
              ops.multiply(b2, P2[c]!),
            ),
            den,
          ),
      ) as [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet];

      // R = |B| and Phi = atan2(B), as (s, t) jets.
      const R: IAutoMovieConicFieldJet.IJet = ops.sqrt(
        ops.add(ops.multiply(B[0], B[0]), ops.multiply(B[1], B[1])),
      );
      const Phi: IAutoMovieConicFieldJet.IJet = phase(B);

      // Invert t(s, phi) and compose R(s, t(s, phi)).
      const pt: number = Phi[2];
      if (!(pt > 0)) return null;
      const tp: number = 1 / pt;
      const ts: number = -Phi[1] / pt;
      const tpp: number = -Phi[5] * tp * tp * tp;
      const tsp: number = -(Phi[4] + Phi[5] * ts) * tp * tp;
      const tss: number = -(Phi[3] + 2 * Phi[4] * ts + Phi[5] * ts * ts) / pt;
      return {
        point: at.point,
        radial: [
          R[0],
          R[1] + R[2] * ts,
          R[2] * tp,
          R[3] + 2 * R[4] * ts + R[5] * ts * ts + R[2] * tss,
          (R[4] + R[5] * ts) * tp + R[2] * tsp,
          R[5] * tp * tp + R[2] * tpp,
        ],
        sided: at.sided,
      };
    };
  }

  /**
   * A point of an arc at parameter t in [0, 1].
   *
   * @param arc The arc.
   * @param t The parameter.
   * @returns The point, chart millimetres.
   */
  export function evaluate(
    arc: IAutoMovieViewChain.IArc,
    t: number,
  ): AutoMovieVector2Tuple {
    const s: number = 1 - t;
    const b0: number = s * s;
    const b1: number = 2 * arc.weight * s * t;
    const b2: number = t * t;
    const den: number = b0 + b1 + b2;
    return [
      (b0 * arc.start[0] + b1 * arc.control[0] + b2 * arc.end[0]) / den,
      (b0 * arc.start[1] + b1 * arc.control[1] + b2 * arc.end[1]) / den,
    ];
  }

  /*
   * Atan2 of a point jet as a jet: first partials `B x B_i / |B|^2`, second
   * partials by the quotient rule.
   */
  function phase(
    B: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet],
  ): IAutoMovieConicFieldJet.IJet {
    const [x, y] = B;
    const q: number = x[0] * x[0] + y[0] * y[0];
    const first = (i: number): number => (x[0] * y[i]! - y[0] * x[i]!) / q;
    const qd = (i: number): number => 2 * (x[0] * x[i]! + y[0] * y[i]!);

    // d/dj (x y_i - y x_i) = x_j y_i + x y_ij - y_j x_i - y x_ij.
    const second = (i: number, j: number, ij: number): number =>
      (x[j]! * y[i]! + x[0] * y[ij]! - y[j]! * x[i]! - y[0] * x[ij]!) / q -
      ((x[0] * y[i]! - y[0] * x[i]!) * qd(j)) / (q * q);
    return [
      Math.atan2(y[0], x[0]),
      first(1),
      first(2),
      second(1, 1, 3),
      second(1, 2, 4),
      second(2, 2, 5),
    ];
  }

  /*
   * A x b, the z component.
   */
  function cross(a: AutoMovieVector2Tuple, b: AutoMovieVector2Tuple): number {
    return a[0] * b[1] - a[1] * b[0];
  }
}
