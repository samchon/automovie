import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";

/** A chart point or vector, millimetres. */
type V2 = [number, number];

/** A scalar with its source partials `[value, s, p, ss, sp, pp]`. */
type J = AutoMovieConicFieldJet.IJet;

/**
 * A closed section as a chain of rational quadratic arcs through the
 * section's own control points about the course point: the view section's
 * four quarters generalized so each quarter's ends stand at the section's
 * actual extreme points (off the chart axes where the section's extremes
 * are) and a quarter may be split into two conic pieces at a further point
 * of the section, each piece with its own shoulder (#3158).
 *
 * Control point j is a chart point `P_j` with a tangent direction `T_j`,
 * oriented toward the next point. Arc j runs from `P_j` to `P_{j+1}`: the
 * rational quadratic with end weights 1, its control point `A_j` where the
 * two tangent lines meet, and middle weight `w_j = rho_j / (1 - rho_j)`, so
 * its point on the segment from the chord midpoint `M_j` to `A_j` stands at
 * the share `rho_j` (Shene, "Rational Bezier curves: conic sections"; Farin
 * and Hansford, "The Essentials of CAGD" ch. 13: a conic arc is fixed by
 * its two end points, their tangent lines and one more point; positive
 * weights keep it in its control triangle). An arc may bend either way, so a
 * concave stretch is an arc whose control point lies on the course point's
 * side of its chord.
 *
 * The chain is read in polar form about the course point, so every arc must
 * advance in phase from its start to its end. For the numerator `N(t) =
 * (1-t)^2 P0 + 2 w t (1-t) A + t^2 P2` the phase advances where `N x N' > 0`,
 * and `N x N' = 2 [w (1-t)^2 (P0 x A) + t (1-t) (P0 x P2) + w t^2 (A x P2)]`
 * (expanded term by term), a quadratic in t: the advance is decided exactly
 * over the whole arc from that quadratic's minimum on [0, 1].
 *
 * Neighbouring arcs share each point and tangent line (G1); their
 * curvatures there are their own, so the chain is not G2 in general. Each
 * arc's signed end curvature is `(A - P0) x (P2 - A) / (2 w^2 |A - P0|^3)`
 * at its start and `(A - P0) x (P2 - A) / (2 w^2 |P2 - A|^3)` at its end
 * (the rational Bezier end curvature for degree 2 and weights 1, w, 1), and
 * every join's two curvatures are reported for the reader to judge. In
 * polar form the radius is therefore C1 in phase: a phase exactly at a join
 * reads the arc starting there, and where the two curvatures differ its
 * second phase derivatives belong to that side alone, which the reading
 * marks as sided.
 *
 * Phases are reduced as the native view section reduces them
 * (`AutoMovieViewConic`): any finite phase, by the IEEE remainder `phi %
 * 2pi`, which is exact in binary64 and takes constant time; the reduction is
 * periodic in the binary64 value of 2pi, so a phase of magnitude x carries
 * the rounding of that constant times x / 2pi. One {@link read} owns that
 * reduction, the arc lookup and the point on the ray; every reader takes its
 * point and direction from it.
 *
 * {@link jets} gives the native source's radius Hessian over the station and
 * the phase: the arc point `B(s, t)` is carried through the shared conic
 * algebra (`AutoMovieConicFieldJet.AD`) with the inputs' station jets and the
 * arc parameter t as the second coordinate, its radius `R = |B|` and phase
 * `Phi = atan2(B)` take their (s, t) partials, and the inverse function
 * theorem turns them into partials over (s, phi) at the arc parameter the
 * ray meets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chain's inputs and units, the arc construction and its sources, the exact phase-advance rule, the G1 joins and the sided second phase derivatives there, the reported curvatures, the one phase reduction with its precision premise and the native jets' derivation.
 * @evidence contracts/development/design.md#principled-representation A section is its control points with tangents and one shoulder per arc; each arc is the rational quadratic those fix, with a named fault when its control triangle or phase advance fails.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Its consumer is the native view reader (`AutoMovieLoftSectionNative`) for a source declaring touch offsets or splits; the four-quarter `AutoMovieViewSection` stays the owner of axis-touch sections.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No arc is replaced by a line or default shoulder when its premise fails, no G2 is claimed, and a join's second phase derivatives are never presented as two-sided.
 */
export namespace AutoMovieViewChain {
  /**
   * The chain's inputs at one station.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, ordering, orientation and the arc each entry belongs to.
   * @evidence contracts/development/design.md#principled-representation The section's own points and tangent directions, and one shoulder per arc from a point to the next.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Lengths, order and orientation are checked by `of`, not assumed.
   */
  export interface IInput {
    /** Control points, chart millimetres about the course point, in strictly increasing phase over less than one turn. */
    points: V2[];

    /** Tangent direction at each point, oriented toward the next point (any positive length). */
    tangents: V2[];

    /** Shoulder of each arc from point j to point j + 1 (the last closes to the first), in (0, 1). */
    shoulders: number[];
  }

  /**
   * The chain's inputs with their station jets, for the native jets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each entry carries its physical station partials and no phase partials.
   * @evidence contracts/development/design.md#principled-representation The same inputs as `IInput`, each scalar a `[value, s, 0, ss, 0, 0]` jet.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `primal` and `jets`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unavailable station jets are the caller's failure, never zeros supplied here.
   */
  export interface IFieldInput {
    /** Control points, each coordinate a station jet. */
    points: [J, J][];

    /** Tangent directions, each component a station jet. */
    tangents: [J, J][];

    /** Shoulders, station jets. */
    shoulders: J[];
  }

  /**
   * One prepared arc.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the control points, weight, phase interval and end curvatures.
   * @evidence contracts/development/design.md#principled-representation The rational quadratic's three control points and middle weight, with its phase span and signed end curvatures.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `read`, `jets`, the join report and the tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only admitted arcs are prepared.
   */
  export interface IArc {
    /** Start point, chart millimetres. */
    start: V2;

    /** Control point where the two tangent lines meet. */
    control: V2;

    /** End point. */
    end: V2;

    /** Middle weight, `rho / (1 - rho)`. */
    weight: number;

    /** Start and end phase, radians, the end unwrapped past the start. */
    span: [number, number];

    /** Signed curvature at the start and at the end, per millimetre (positive turning counter-clockwise). */
    curvature: [number, number];
  }

  /**
   * The two arcs' curvatures at one shared point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which arcs meet and the units.
   * @evidence contracts/development/design.md#principled-representation The incoming arc's end curvature and the outgoing arc's start curvature at a control point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `read` for the sided flag and by the trace's receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reported, never equalized here.
   */
  export interface IJoin {
    /** The point's phase, radians. */
    phase: number;

    /** The arc ending there: its end curvature, per millimetre. */
    before: number;

    /** The arc starting there: its start curvature, per millimetre. */
    after: number;
  }

  /**
   * A prepared chain or its fault.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fault's meaning.
   * @evidence contracts/development/design.md#principled-representation The inputs, their arcs and joins, and a named fault that empties both.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `read`, `jets`, the native reader and the trace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A faulted chain has no arcs to read.
   */
  export interface ISection {
    /** The inputs. */
    input: IInput;

    /** The arcs, empty on a fault. */
    arcs: IArc[];

    /** The curvature pair at every control point, empty on a fault. */
    joins: IJoin[];

    /** The broken premise, or null. */
    fault: string | null;
  }

  /**
   * Where one phase's ray meets the chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members' meaning and units and the sided rule.
   * @evidence contracts/development/design.md#principled-representation The arc, its parameter and its exact point, with whether the phase sits on a join whose two curvatures differ.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `jets`, the native reader's Point0 and value, and `radius`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a met ray yields a reading.
   */
  export interface IRead {
    /** The arc the ray meets. */
    index: number;

    /** Its parameter there, in [0, 1]. */
    t: number;

    /** The arc's point there, chart millimetres. */
    point: V2;

    /** The phase is a join's and that join's two curvatures differ: second phase derivatives here are the starting arc's alone. */
    sided: boolean;
  }

  /**
   * One phase's native reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the output order and units and the sided rule.
   * @evidence contracts/development/design.md#principled-representation The ray reading's point and sided flag with the radius Hessian at that same arc parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the native reader's phase and jet capabilities.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A vanishing phase speed or unmet ray yields no reading rather than substituted values.
   */
  export interface IReading {
    /** The arc's point, chart millimetres; its direction is the ray's. */
    point: V2;

    /** `[r, r_s, r_phi, r_ss, r_sphi, r_phiphi]`, millimetres per station millimetre and per radian. */
    radial: J;

    /** As `IRead.sided`. */
    sided: boolean;
  }

  /**
   * Prepare a chain's arcs.
   *
   * @param input The chain's inputs.
   * @returns The prepared chain, or its fault naming the arc and premise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admission rules.
   * @evidence contracts/development/implementation.md#principled-implementation Each arc's control point is the meeting of the two tangent lines; it must lie ahead of the start along its tangent and behind the end along its tangent, so the middle weight is positive and the arc stays in its triangle; the phase advance over the whole arc is decided exactly by the minimum of the quadratic `N x N'` on [0, 1].
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate inputs and phase order, build each arc, decide its advance, record its end curvatures, then the joins.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback line, default weight or sampled advance check: any failed premise is the fault.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(K) arcs with constant work each.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure preparation coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns its arcs; retains nothing.
   */
  export function of(input: IInput): ISection {
    const K: number = input.points.length;
    const fail = (fault: string): ISection => ({ input, arcs: [], joins: [], fault });
    if (K < 3 || input.tangents.length !== K || input.shoulders.length !== K) return fail(`a chain needs at least 3 points with one tangent and shoulder each (${K}, ${input.tangents.length}, ${input.shoulders.length})`);
    for (let j: number = 0; j < K; ++j) {
      if (![...input.points[j]!, ...input.tangents[j]!, input.shoulders[j]!].every(Number.isFinite)) return fail(`point ${j}: a value is not finite`);
      if (!(Math.hypot(...input.points[j]!) > 0)) return fail(`point ${j} stands on the course point`);
      if (!(Math.hypot(...input.tangents[j]!) > 0)) return fail(`point ${j}: its tangent is zero`);
      if (!(input.shoulders[j]! > 0 && input.shoulders[j]! < 1)) return fail(`arc ${j}: shoulder ${input.shoulders[j]} outside (0, 1)`);
    }

    // Phases unwrapped from the first point; each must advance and the whole stay within one turn.
    const phases: number[] = [Math.atan2(input.points[0]![1], input.points[0]![0])];
    for (let j: number = 1; j < K; ++j) {
      let phi: number = Math.atan2(input.points[j]![1], input.points[j]![0]);
      while (phi <= phases[j - 1]!) phi += 2 * Math.PI;
      phases.push(phi);
    }
    if (!(phases[K - 1]! - phases[0]! < 2 * Math.PI)) return fail("the points' phases do not advance within one turn");
    const arcs: IArc[] = [];
    for (let j: number = 0; j < K; ++j) {
      const k: number = (j + 1) % K;
      const P0: V2 = input.points[j]!;
      const P2: V2 = input.points[k]!;
      const T0: V2 = input.tangents[j]!;
      const T2: V2 = input.tangents[k]!;

      // The tangent lines' meeting: P0 + a T0 = P2 - b T2.
      const den: number = cross(T0, T2);
      if (den === 0) return fail(`arc ${j}: its end tangents are parallel`);
      const d: V2 = [P2[0] - P0[0], P2[1] - P0[1]];
      const a: number = cross(d, T2) / den;
      const b: number = cross(T0, d) / den;
      if (!(a > 0 && b > 0)) return fail(`arc ${j}: the tangent lines meet ${a > 0 ? "behind the end" : "behind the start"} (a ${a.toExponential(3)}, b ${b.toExponential(3)}), so no positive-weight arc joins them`);
      const A: V2 = [P0[0] + a * T0[0], P0[1] + a * T0[1]];
      const w: number = input.shoulders[j]! / (1 - input.shoulders[j]!);

      // Exact phase advance: f(t) = w c0 (1-t)^2 + c1 t (1-t) + w c2 t^2 > 0 on [0, 1].
      const c0: number = cross(P0, A);
      const c1: number = cross(P0, P2);
      const c2: number = cross(A, P2);
      const qa: number = w * c0 - c1 + w * c2;
      const qb: number = c1 - 2 * w * c0;
      const vertex: number = qa > 0 ? -qb / (2 * qa) : NaN;
      const least: number = Math.min(w * c0, w * c2, vertex > 0 && vertex < 1 ? w * c0 + qb * vertex + qa * vertex * vertex : Infinity);
      if (!(least > 0)) return fail(`arc ${j}: its phase does not advance over the whole arc (N x N' reaches ${least.toExponential(3)}); the section is not star-shaped about the course point there`);

      // Signed end curvatures of the rational quadratic with weights 1, w, 1.
      const e0: V2 = [A[0] - P0[0], A[1] - P0[1]];
      const e1: V2 = [P2[0] - A[0], P2[1] - A[1]];
      const turn: number = cross(e0, e1);
      const end: number = k === 0 ? phases[0]! + 2 * Math.PI : phases[k]!;
      arcs.push({ start: P0, control: A, end: P2, weight: w, span: [phases[j]!, end], curvature: [turn / (2 * w * w * Math.hypot(...e0) ** 3), turn / (2 * w * w * Math.hypot(...e1) ** 3)] });
    }
    const joins: IJoin[] = arcs.map((arc: IArc, j: number): IJoin => ({ phase: phases[j]!, before: arcs[(j + K - 1) % K]!.curvature[1], after: arc.curvature[0] }));
    return { input, arcs, joins, fault: null };
  }

  /**
   * The values of station-jet inputs.
   *
   * @param input The inputs with their station jets.
   * @returns The same inputs at their values.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the projection.
   * @evidence contracts/development/implementation.md#principled-implementation Each jet's value entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map per member.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the exact values.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(K).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure projection coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays; retains nothing.
   */
  export function primal(input: IFieldInput): IInput {
    return {
      points: input.points.map((p: [J, J]): V2 => [p[0][0], p[1][0]]),
      tangents: input.tangents.map((t: [J, J]): V2 => [t[0][0], t[1][0]]),
      shoulders: input.shoulders.map((s: J): number => s[0]),
    };
  }

  /**
   * Where a phase's ray meets the chain: the one owner of phase reduction, arc lookup and point.
   *
   * @param section A prepared chain.
   * @param phi Phase, radians, finite.
   * @returns The arc, its parameter, its point and the sided flag, or null for a faulted chain, a non-finite phase or no admitted root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reduction, the join rule and the failure value.
   * @evidence contracts/development/implementation.md#principled-implementation The native section's reduction (`phi % 2pi`, exact in binary64) from the first point's phase; the arc whose span starts at or before it by binary search; the ray direction d meets the arc where `d x N(t) = 0`, a quadratic in t solved in closed form, and an advancing arc meets each ray of its span exactly once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce, look up, solve, read the point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No interpolation between points stands in for the arc, and no loop reduces the phase.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time reduction, O(log K) lookup over the ascending span starts and constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(section: ISection, phi: number): IRead | null {
    if (section.fault !== null || !Number.isFinite(phi)) return null;
    const arcs: IArc[] = section.arcs;
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
    const arc: IArc = arcs[index]!;
    if (!(p <= arc.span[1])) return null;
    const d: V2 = [Math.cos(p), Math.sin(p)];
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
    let best: IRead | null = null;
    let along: number = -Infinity;
    const join: IJoin = section.joins[index]!;
    const sided: boolean = p === arc.span[0] && join.before !== join.after;
    for (const t of roots) {
      if (!(t >= -1e-12 && t <= 1 + 1e-12)) continue;
      const clamped: number = Math.min(1, Math.max(0, t));
      const point: V2 = evaluate(arc, clamped);
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reading and its failure value.
   * @evidence contracts/development/implementation.md#principled-implementation The length of the point `read` finds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read, one length.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No interpolation between points stands in for the arc.
   * @evidence contracts/development/implementation.md#efficient-algorithms As `read`.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function radius(section: ISection, phi: number): number {
    const at: IRead | null = read(section, phi);
    return at === null ? NaN : Math.hypot(...at.point);
  }

  /**
   * The native jets at one station: for each phase, its ray reading and the radius Hessian over the station and the phase.
   *
   * @param input The inputs with their station jets.
   * @returns A reader from a phase to its reading (null where `read` yields none or the phase speed vanishes), or the chain's fault.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the output, units (mm, per mm of station, per radian), the sided flag and the failure values.
   * @evidence contracts/development/implementation.md#principled-implementation `read` locates the arc and parameter t*; that arc's point B(s, t) is evaluated in the shared AD algebra with the inputs' station jets and t as the second coordinate; R = |B| and Phi = atan2(B) take their (s, t) partials (Phi's by the quotient rule on `B x B_i / |B|^2`), and the inverse function theorem gives `t_phi = 1 / Phi_t`, `t_s = -Phi_s / Phi_t` and their second partials, which compose R into the (s, phi) Hessian.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the numeric chain and every arc's control point and weight jets once; per phase read, lift, invert, compose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite difference or sampled derivative; a vanishing phase speed yields no reading rather than a substituted value, and a join's one-sided second derivatives carry the sided flag.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(K) preparation, then an O(log K) read and constant AD work per phase.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned closure reuses the numeric chain and the station-only control point and weight jets across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains the numeric chain and K arcs' station jets until released.
   */
  export function jets(input: IFieldInput): ((phi: number) => IReading | null) | string {
    const ops: AutoMovieConicFieldJet.IAlgebra<J> = AutoMovieConicFieldJet.AD;
    const section: ISection = of(primal(input));
    if (section.fault !== null) return section.fault;
    const K: number = input.points.length;

    // Station-only jets of every arc: its ends, its control point and its weight.
    const crossJ = (a: [J, J], b: [J, J]): J => ops.subtract(ops.multiply(a[0], b[1]), ops.multiply(a[1], b[0]));
    const pieces: { P0: [J, J]; A: [J, J]; P2: [J, J]; w: J }[] = section.arcs.map((_: IArc, j: number): { P0: [J, J]; A: [J, J]; P2: [J, J]; w: J } => {
      const k: number = (j + 1) % K;
      const [P0, T0, P2, T2] = [input.points[j]!, input.tangents[j]!, input.points[k]!, input.tangents[k]!];
      const d: [J, J] = [ops.subtract(P2[0], P0[0]), ops.subtract(P2[1], P0[1])];
      const a: J = ops.divide(crossJ(d, T2), crossJ(T0, T2));
      const A: [J, J] = [ops.add(P0[0], ops.multiply(a, T0[0])), ops.add(P0[1], ops.multiply(a, T0[1]))];
      const w: J = ops.divide(input.shoulders[j]!, ops.subtract(ops.constant(1), input.shoulders[j]!));
      return { P0, A, P2, w };
    });
    return (phi: number): IReading | null => {
      const at: IRead | null = read(section, phi);
      if (at === null) return null;
      const { P0, A, P2, w } = pieces[at.index]!;

      // B(s, t) with t the second coordinate.
      const t: J = [at.t, 0, 1, 0, 0, 0];
      const u: J = ops.subtract(ops.constant(1), t);
      const b0: J = ops.multiply(u, u);
      const b1: J = ops.multiply(ops.constant(2), ops.multiply(w, ops.multiply(u, t)));
      const b2: J = ops.multiply(t, t);
      const den: J = ops.add(ops.add(b0, b1), b2);
      const B: [J, J] = [0, 1].map((c: number): J => ops.divide(ops.add(ops.add(ops.multiply(b0, P0[c]!), ops.multiply(b1, A[c]!)), ops.multiply(b2, P2[c]!)), den)) as [J, J];

      // R = |B| and Phi = atan2(B), as (s, t) jets.
      const R: J = ops.sqrt(ops.add(ops.multiply(B[0], B[0]), ops.multiply(B[1], B[1])));
      const Phi: J = phase(B);

      // Invert t(s, phi) and compose R(s, t(s, phi)).
      const pt: number = Phi[2];
      if (!(pt > 0)) return null;
      const tp: number = 1 / pt;
      const ts: number = -Phi[1] / pt;
      const tpp: number = -Phi[5] * tp * tp * tp;
      const tsp: number = -(Phi[4] + Phi[5] * ts) * tp * tp;
      const tss: number = -(Phi[3] + 2 * Phi[4] * ts + Phi[5] * ts * ts) / pt;
      return { point: at.point, radial: [R[0], R[1] + R[2] * ts, R[2] * tp, R[3] + 2 * R[4] * ts + R[5] * ts * ts + R[2] * tss, (R[4] + R[5] * ts) * tp + R[2] * tsp, R[5] * tp * tp + R[2] * tpp], sided: at.sided };
    };
  }

  /**
   * A point of an arc at parameter t in [0, 1].
   *
   * @param arc The arc.
   * @param t The parameter.
   * @returns The point, chart millimetres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the parameter range and units.
   * @evidence contracts/development/implementation.md#principled-implementation The rational quadratic Bezier with end weights 1 and middle weight w.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the exact formula.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function evaluate(arc: IArc, t: number): V2 {
    const s: number = 1 - t;
    const b0: number = s * s;
    const b1: number = 2 * arc.weight * s * t;
    const b2: number = t * t;
    const den: number = b0 + b1 + b2;
    return [(b0 * arc.start[0] + b1 * arc.control[0] + b2 * arc.end[0]) / den, (b0 * arc.start[1] + b1 * arc.control[1] + b2 * arc.end[1]) / den];
  }

  /** atan2 of a point jet as a jet: first partials `B x B_i / |B|^2`, second partials by the quotient rule. */
  function phase(B: [J, J]): J {
    const [x, y] = B;
    const q: number = x[0] * x[0] + y[0] * y[0];
    const first = (i: number): number => (x[0] * y[i]! - y[0] * x[i]!) / q;
    const qd = (i: number): number => 2 * (x[0] * x[i]! + y[0] * y[i]!);

    // d/dj (x y_i - y x_i) = x_j y_i + x y_ij - y_j x_i - y x_ij.
    const second = (i: number, j: number, ij: number): number => (x[j]! * y[i]! + x[0] * y[ij]! - y[j]! * x[i]! - y[0] * x[ij]!) / q - ((x[0] * y[i]! - y[0] * x[i]!) * qd(j)) / (q * q);
    return [Math.atan2(y[0], x[0]), first(1), first(2), second(1, 1, 3), second(1, 2, 4), second(2, 2, 5)];
  }

  /** a x b, the z component. */
  function cross(a: V2, b: V2): number {
    return a[0] * b[1] - a[1] * b[0];
  }
}
