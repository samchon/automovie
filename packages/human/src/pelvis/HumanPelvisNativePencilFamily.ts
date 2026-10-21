import type { HumanCurve } from "../internal/HumanCurve";

/** Generated native lateral branch family from whole-curve joint identification.
 * Main owns all planes, skeletal reference, hip-root addresses and subsequent
 * target transport. The complete
 * hip boundary is borrowed from the trunk authority, never re-fitted here.
 * This atlas covers qualified lateral strips and their observed continuation;
 * it does not replace the unresolved inner/anterior or male four-port domain.
 */
export namespace HumanPelvisNativePencilFamily {
  /** Three components in the common support frame; each member states its units. */
  export type Vector = HumanCurve.Vector;
  /** Value, u, v, uu, uv, vv, uvv; the last channel differentiates the C1
   * boundary crossfield twice without numerical differences.
   */
  type ScalarJet = [number, number, number, number, number, number, number];
  type VectorJet = [ScalarJet, ScalarJet, ScalarJet];

  /** Signed physical plane used by the support chart and its affine pencils. */
  export interface Plane {
    /** Dimensionless signed normal; an affine pencil need not have unit length. */
    normal: Vector;

    /** Right side of normal dot position = coordinate, mm at this normal's scale. */
    coordinateMm: number;
  }

  /** The four main-owned support planes define one lateral chart, without a mesh. */
  export interface Planes {
    /** Actual whole-Hip station plane with its original upward sign. */
    hip: Plane;

    /** True physical quarter plane, distinct from the observed ceil cut. */
    thigh: Plane;

    /** Projected-forward guide plane; its zero set is the outer chart edge. */
    across: Plane;

    /** Own-side signed forward-guide plane; its zero set is the posterior edge. */
    posterior: Plane;
  }

  /** One main-selected Hip root and its piece-sided implicit-chart derivatives. */
  export interface HipJet {
    /** Literal position object from the common trunk section. */
    P: Vector;

    /** dP/dv in mm per dimensionless pencil v, on the selected original side. */
    Pv: Vector;

    /** d2P/dv2 in mm per dimensionless v squared, with the same root chain rule. */
    Pvv: Vector;

    /** Actual generated physical phase and its v derivatives, mm. Native source
     * h and native source addresses remain separately retained observations.
     */
    physicalPhaseMm: readonly [number, number, number];

    /** Generated hip tangent-plane normal and its first/second v derivatives.
     * Main derives these from the same full family with the actual root chain
     * rule. No original mesh/source normal or normalized-average field belongs
     * here. Required only by the fixed-hip-C1-u2 law gauge.
     */
    tangentNormal?: readonly [Vector, Vector, Vector];
  }

  /** Pooled scalar shape law with an explicit boundary-derivative fitting gauge. */
  export interface Law {
    /** Coefficients fitted under one explicit boundary derivative authority.
     * Free-u coefficients cannot be reused after imposing a new C1 crossfield.
     */
    gauge: "free-u" | "fixed-hip-C1-u2";

    /** Nonnegative Legendre order in u before the gauge's u or u-squared factor. */
    degreeU: number;

    /** Nonnegative Legendre order in v; this is not a source curve's degree. */
    degreeV: number;

    /** Row-major Legendre(u), Legendre(v) block followed by the shape block.
     * These are pooled common coefficients, never specimen controls.
     */
    coefficients: readonly number[];
  }

  /** Common geometry and law inputs; all boundary/root choices belong to main. */
  export interface Input {
    /** Actual signed planes in one common physical support frame. */
    planes: Planes;

    /** Proximal thigh support A, mm, matching the fitted sourceFrame.A gauge. */
    referenceMm: Vector;

    /** Pseudovector orientation supplied by the common source-frame owner. */
    orientation: 1 | -1;

    /** Positive native-Hip scalar input, mm; distinct from the curve perimeter. */
    hipMm: number;

    /** Finite achieved-native shape coordinate; extrapolation remains unqualified. */
    shape: number;

    /** Main selects the unique qualified native hip arc and supplies exact
     * scalar inverse jets. No nearest-root or world-Z selection occurs here.
     */
    hip: (v: number) => HipJet;

    /** The identical whole hip section consumed by the trunk family. */
    hipAuthority: object;

    /** Common coefficients identified under the same boundary derivative gauge. */
    law: Law;

    /** Principal u=1 quarter plus an explicitly supported neighbor continuation. */
    domainU: readonly [number, number];
  }

  /** Analytic position and derivatives in dimensionless pencil coordinates. */
  export interface Jet {
    /** Physical point in mm; at u=0 this borrows the literal Hip point object. */
    P: Vector;

    /** dP/du, mm per dimensionless hip-to-quarter coordinate. */
    Pu: Vector;

    /** dP/dv, mm per dimensionless outer-to-posterior coordinate. */
    Pv: Vector;

    /** d2P/du2, mm per dimensionless u squared. */
    Puu: Vector;

    /** d2P/(du dv), mm per dimensionless chart-coordinate product. */
    Puv: Vector;

    /** d2P/dv2, mm per dimensionless v squared, on the selected Hip piece side. */
    Pvv: Vector;

    /** Signed original plane-pencil equations, mm; no point is projected. */
    pencilResidualsMm: readonly [number, number];

    /** Signed [h+t, f-a] denominators in mm; this branch requires negative/positive. */
    chartDenominatorsMm: readonly [number, number];

    /** Raw algebraic boundary reconstruction difference, retained separately
     * from the literal common boundary position object.
     */
    boundaryReconstructionResidualMm: number | undefined;

    /** Raw versus direct-solve Fu norm, mm per u; absent off-Hip or in free-u mode. */
    boundaryCrossReconstructionResidual: number | undefined;
  }

  /** A guide or section restriction of the same analytic lateral authority. */
  export interface Trace {
    /** Dimensionless owning chart coordinate; not an original native h gauge. */
    parameter: "u" | "v";

    /** Return P in mm and its first/second derivatives in the declared chart gauge. */
    jet: (parameter: number) => { P: Vector; D: Vector; DD: Vector };

    /** Restrict the owning analytic function; midpoint and both child endpoints
     * retain the same actual node objects. No new shape is interpolated.
     */
    restrict: (start: number, end: number) => Interval;
  }

  /** Closed trace interval whose child restrictions inherit identical endpoint jets. */
  export interface Interval {
    /** Lower chart parameter and its shared P/D/DD in the trace's declared units. */
    start: { parameter: number; P: Vector; D: Vector; DD: Vector };

    /** Upper chart parameter and its shared P/D/DD in the same trace gauge. */
    end: { parameter: number; P: Vector; D: Vector; DD: Vector };

    /** Evaluate within these closed bounds; endpoint queries borrow the stored jets. */
    jet: Trace["jet"];

    /** Derive one actual midpoint jet, shared by both returned child intervals. */
    subdivide: () => readonly [Interval, Interval];
  }

  /** One lateral surface function shared by skin, guides and inferred quarter trace. */
  export interface Family {
    /** Unchanged whole-Hip owner object borrowed by this strip and the trunk. */
    hipAuthority: object;

    /** Every curve below is a restriction of this sole generated authority. */
    jet: (u: number, v: number) => Jet;

    /** The v=0 guide, directed from the Hip toward the true quarter plane. */
    across: Trace;

    /** The v=1 guide with the same increasing-u direction and analytic authority. */
    posterior: Trace;

    /** Previously unobserved quarter curve trace generated jointly from the
     * whole original section/guide shape constraints, not a source copy.
     */
    quarter: Trace;

    /** Derive the v-parameterized section at an admitted fixed u without refitting. */
    section: (u: number) => Trace;

    /** Unresolved correspondence, topology and cross-boundary qualifications. */
    limitations: readonly string[];
  }

  /** Generate a common scalar shape along each exact plane-pencil support line.
   * Seven-channel analytic algebra supplies the full chart second jet and the
   * additional uvv channel needed by a fixed-C1 boundary crossfield. The four
   * initial corners share literal objects across every incident restriction.
   * Invalid domains, unresolved support lines or a missing required Hip normal
   * field throw; no alternate source curve or coefficient gauge is substituted.
   */
  export function build(input: Input): Family {
    const law: Law = input.law;
    const count: number = (law.degreeU + 1) * (law.degreeV + 1);
    if (!Number.isInteger(law.degreeU) || !Number.isInteger(law.degreeV) || law.degreeU < 0 || law.degreeV < 0 ||
        law.coefficients.length !== 2 * count || !law.coefficients.every(Number.isFinite) ||
        (law.gauge !== "free-u" && law.gauge !== "fixed-hip-C1-u2") ||
        !Number.isFinite(input.hipMm) || input.hipMm <= 0 || !Number.isFinite(input.shape) ||
        input.domainU[0] !== 0 || input.domainU[1] < 1 || !input.domainU.every(Number.isFinite) ||
        !input.referenceMm.every(Number.isFinite) || (input.orientation !== 1 && input.orientation !== -1) ||
        Object.values(input.planes).some((plane: Plane): boolean => !plane.normal.every(Number.isFinite) ||
          !Number.isFinite(plane.coordinateMm) || Math.hypot(...plane.normal) === 0))
      throw new Error("Complete common physical branch law and principal quarter domain required.");
    const planes: Planes = input.planes;
    const scalar = (u: number, v: number): ScalarJet => {
      const U: ScalarJet = [u, 1, 0, 0, 0, 0, 0];
      const V: ScalarJet = [v, 0, 1, 0, 0, 0, 0];
      const us: ScalarJet[] = legendre(add(scale(U, 2), constant(-1)), law.degreeU);
      const vs: ScalarJet[] = legendre(add(scale(V, 2), constant(-1)), law.degreeV);
      let value: ScalarJet = constant(0);
      for (let i: number = 0; i <= law.degreeU; i++)
        for (let j: number = 0; j <= law.degreeV; j++) {
          const index: number = i * (law.degreeV + 1) + j;
          value = add(value, scale(multiply(us[i]!, vs[j]!), law.coefficients[index]! + input.shape * law.coefficients[count + index]!));
        }
      return scale(multiply(law.gauge === "fixed-hip-C1-u2" ? multiply(U, U) : U, value), input.hipMm);
    };
    const geometry = (u: number, v: number): { base: VectorJet; direction: VectorJet } => {
      const U: ScalarJet = [u, 1, 0, 0, 0, 0, 0];
      const V: ScalarJet = [v, 0, 1, 0, 0, 0, 0];
      const mix = (a: number, b: number, t: ScalarJet): ScalarJet => add(constant(a), scale(t, b - a));
      const n: VectorJet = planes.hip.normal.map((value: number, i: number): ScalarJet => mix(value, -planes.thigh.normal[i]!, U)) as VectorJet;
      const m: VectorJet = planes.across.normal.map((value: number, i: number): ScalarJet => mix(value, planes.posterior.normal[i]!, V)) as VectorJet;
      const c: ScalarJet = mix(planes.hip.coordinateMm, -planes.thigh.coordinateMm, U);
      const d: ScalarJet = mix(planes.across.coordinateMm, planes.posterior.coordinateMm, V);
      const cross: VectorJet = vcross(n, m);
      const squared: ScalarJet = vdot(cross, cross);
      const n2: number = vdot(n, n)[0];
      const m2: number = vdot(m, m)[0];
      if (!(squared[0] > 128 * Number.EPSILON * n2 * m2))
        throw new Error("Plane-pencil support line is singular or numerically unresolved.");
      const direction: VectorJet = vscale(cross, scale(power(squared, -0.5), input.orientation));
      const origin: VectorJet = input.referenceMm.map(constant) as VectorJet;
      const r: ScalarJet = add(c, scale(vdot(n, origin), -1));
      const s: ScalarJet = add(d, scale(vdot(m, origin), -1));
      const nn: ScalarJet = vdot(n, n);
      const mm: ScalarJet = vdot(m, m);
      const nm: ScalarJet = vdot(n, m);
      const determinant: ScalarJet = add(multiply(nn, mm), scale(multiply(nm, nm), -1));
      const x: ScalarJet = multiply(add(multiply(mm, r), scale(multiply(nm, s), -1)), power(determinant, -1));
      const y: ScalarJet = multiply(add(multiply(nn, s), scale(multiply(nm, r), -1)), power(determinant, -1));
      const base: VectorJet = vadd(origin, vadd(vscale(n, x), vscale(m, y)));
      return { base, direction };
    };
    const rawJet = (u: number, v: number): Jet => {
      if (!Number.isFinite(u) || !Number.isFinite(v) || u < 0 || u > input.domainU[1] || v < 0 || v > 1)
        throw new Error("Branch query lies outside its declared physical chart support.");
      const hip: HipJet = input.hip(v);
      if (![hip.P, hip.Pv, hip.Pvv, hip.physicalPhaseMm].every((vector: readonly number[]): boolean =>
        vector.length === 3 && vector.every(Number.isFinite)) || hip.physicalPhaseMm[1] === 0)
        throw new Error("Shared hip implicit-root position and physical phase jets must be resolved.");
      const original: VectorJet = hip.P.map((value: number, i: number): ScalarJet => [value, 0, hip.Pv[i]!, 0, 0, hip.Pvv[i]!, 0]) as VectorJet;
      const atHip: { base: VectorJet; direction: VectorJet } = geometry(0, v);
      const hipScalarRaw: ScalarJet = vdot(atHip.direction, vadd(original, vscale(atHip.base, constant(-1))));
      // Hip is a moving-v boundary. Its u dependence is not part of lambdaHip.
      const hipScalar: ScalarJet = [hipScalarRaw[0], 0, hipScalarRaw[2], 0, 0, hipScalarRaw[5], 0];
      let crossField: VectorJet | undefined;
      let crossScalar: ScalarJet = constant(0);
      if (law.gauge === "fixed-hip-C1-u2") {
        const normal: readonly [Vector, Vector, Vector] | undefined = hip.tangentNormal;
        if (!normal || !normal.every((vector: Vector): boolean => vector.every(Number.isFinite)))
          throw new Error("C1 family requires the actual shared hip normal function's full v jets.");
        const N: VectorJet = normal[0].map((x: number, i: number): ScalarJet => [x, 0, normal[1][i]!, 0, 0, normal[2][i]!, 0]) as VectorJet;
        const H: VectorJet = planes.hip.normal.map(constant) as VectorJet;
        const V: ScalarJet = [v, 0, 1, 0, 0, 0, 0];
        const M: VectorJet = planes.across.normal.map((x: number, i: number): ScalarJet =>
          add(constant(x), scale(V, planes.posterior.normal[i]! - x))) as VectorJet;
        const determinant: ScalarJet = vdot(N, vcross(H, M));
        const bound: number = Math.sqrt(vdot(N, N)[0] * vdot(H, H)[0] * vdot(M, M)[0]);
        if (!(Math.abs(determinant[0]) > 64 * Number.EPSILON * bound))
          throw new Error("Shared hip tangent plane and pencil derivatives have no resolved unique Fu.");
        // N.Fu=0, H.Fu=cU_u-nU_u.P, M.Fu=0. Differentiate the
        // same direct Cramer solve in v, retaining the exact normal field.
        const rhsNormal: VectorJet = planes.hip.normal.map((x: number, i: number): ScalarJet => constant(x + planes.thigh.normal[i]!)) as VectorJet;
        const rhs: ScalarJet = add(constant(-planes.hip.coordinateMm - planes.thigh.coordinateMm), vdot(rhsNormal, original));
        crossField = vscale(vcross(M, N), divide(rhs, determinant));
        const alongV = (value: ScalarJet): ScalarJet => [value[0], 0, value[2], 0, 0, value[5], 0];
        const uAlongV = (value: ScalarJet): ScalarJet => [value[1], 0, value[4], 0, 0, value[6], 0];
        crossScalar = vdot(atHip.direction.map(alongV) as VectorJet,
          vadd(crossField, vscale(vadd(atHip.base.map(uAlongV) as VectorJet,
            vscale(atHip.direction.map(uAlongV) as VectorJet, hipScalar)), constant(-1))));
      }
      const here: { base: VectorJet; direction: VectorJet } = u === 0 ? atHip : geometry(u, v);
      const U: ScalarJet = [u, 1, 0, 0, 0, 0, 0];
      const value: VectorJet = vadd(here.base, vscale(here.direction, add(add(hipScalar, multiply(U, crossScalar)), scalar(u, v))));
      const column = (index: number): Vector => value.map((component: ScalarJet): number => component[index]!) as Vector;
      const rawP: Vector = column(0);
      const P: Vector = u === 0 ? hip.P : rawP;
      const n: Vector = planes.hip.normal.map((x: number, i: number): number => (1 - u) * x - u * planes.thigh.normal[i]!) as Vector;
      const m: Vector = planes.across.normal.map((x: number, i: number): number => (1 - v) * x + v * planes.posterior.normal[i]!) as Vector;
      const h: number = dot(planes.hip.normal, P) - planes.hip.coordinateMm;
      const t: number = dot(planes.thigh.normal, P) - planes.thigh.coordinateMm;
      const a: number = dot(planes.across.normal, P) - planes.across.coordinateMm;
      const f: number = dot(planes.posterior.normal, P) - planes.posterior.coordinateMm;
      if (!(h + t < 0 && f - a > 0) || !value.every((component: ScalarJet): boolean => component.every(Number.isFinite)))
        throw new Error("Generated branch left the declared signed physical chart branch.");
      return {
        P, Pu: u === 0 && crossField ? crossField.map((component: ScalarJet): number => component[0]) as Vector : column(1),
        Pv: u === 0 ? hip.Pv : column(2), Puu: column(3),
        Puv: u === 0 && crossField ? crossField.map((component: ScalarJet): number => component[2]) as Vector : column(4),
        Pvv: u === 0 ? hip.Pvv : column(5),
        pencilResidualsMm: [dot(n, P) - ((1 - u) * planes.hip.coordinateMm - u * planes.thigh.coordinateMm), dot(m, P) - ((1 - v) * planes.across.coordinateMm + v * planes.posterior.coordinateMm)],
        chartDenominatorsMm: [h + t, f - a],
        boundaryReconstructionResidualMm: u === 0 ? Math.hypot(...rawP.map((x: number, i: number): number => x - hip.P[i]!)) : undefined,
        boundaryCrossReconstructionResidual: u === 0 && crossField ? Math.hypot(...column(1).map((x: number, i: number): number => x - crossField![i]![0])) : undefined,
      };
    };
    // All incident traces consume these same generated corner objects from
    // their first construction; no failed numerical comparison is repaired.
    const corners: readonly Jet[] = [rawJet(0, 0), rawJet(0, 1), rawJet(1, 0), rawJet(1, 1)];
    const jet = (u: number, v: number): Jet => (u === 0 || u === 1) && (v === 0 || v === 1)
      ? corners[2 * u + v]! : rawJet(u, v);
    const trace = (parameter: "u" | "v", fixed: number): Trace => {
      const sample = (t: number): { P: Vector; D: Vector; DD: Vector } => {
        const value: Jet = parameter === "u" ? jet(t, fixed) : jet(fixed, t);
        return { P: value.P, D: parameter === "u" ? value.Pu : value.Pv, DD: parameter === "u" ? value.Puu : value.Pvv };
      };
      const interval = (start: Interval["start"], end: Interval["end"]): Interval => ({
        start, end,
        jet: (t: number): { P: Vector; D: Vector; DD: Vector } => {
          if (t < start.parameter || t > end.parameter) throw new Error("Trace restriction query outside its support.");
          return t === start.parameter ? start : t === end.parameter ? end : sample(t);
        },
        subdivide: (): readonly [Interval, Interval] => {
          const t: number = start.parameter + (end.parameter - start.parameter) / 2;
          const middle: Interval["start"] = { parameter: t, ...sample(t) };
          return [interval(start, middle), interval(middle, end)];
        },
      });
      return {
        parameter, jet: sample,
        restrict: (start: number, end: number): Interval => {
          if (!(Number.isFinite(start) && Number.isFinite(end) && start < end)) throw new Error("Ordered finite trace interval required.");
          return interval({ parameter: start, ...sample(start) }, { parameter: end, ...sample(end) });
        },
      };
    };
    return {
      hipAuthority: input.hipAuthority, jet,
      across: trace("u", 0), posterior: trace("u", 1), quarter: trace("v", 1), section: (u: number): Trace => trace("v", u),
      limitations: [
        "Lateral curve atlas only; inner/anterior and additional male critical domains remain explicit graph obligations.",
        "Common native-frame generation and conditional fit do not qualify unseen end-to-end target transport.",
        "Quarter trace is inferred, with no original closed quarter observation or pointwise source guarantee.",
        "Physical native source h is retained in identification; dimensionless u/v are not substituted for source phase.",
        "Shared hip P and along-boundary jets do not establish matching cross-boundary tangent planes or embedding.",
      ],
    };
  }

  const constant = (x: number): ScalarJet => [x, 0, 0, 0, 0, 0, 0];
  const add = (a: ScalarJet, b: ScalarJet): ScalarJet => a.map((x: number, i: number): number => x + b[i]!) as ScalarJet;
  const scale = (a: ScalarJet, k: number): ScalarJet => a.map((x: number): number => x * k) as ScalarJet;
  const multiply = (a: ScalarJet, b: ScalarJet): ScalarJet => [
    a[0] * b[0], a[1] * b[0] + a[0] * b[1], a[2] * b[0] + a[0] * b[2],
    a[3] * b[0] + 2 * a[1] * b[1] + a[0] * b[3],
    a[4] * b[0] + a[1] * b[2] + a[2] * b[1] + a[0] * b[4],
    a[5] * b[0] + 2 * a[2] * b[2] + a[0] * b[5],
    a[6] * b[0] + a[5] * b[1] + 2 * a[4] * b[2] + 2 * a[2] * b[4] + a[1] * b[5] + a[0] * b[6],
  ];
  const power = (a: ScalarJet, p: number): ScalarJet => {
    if (!(a[0] > 0 && Number.isFinite(a[0]))) throw new Error("Unresolved positive scalar algebraic branch.");
    const value: number = a[0] ** p;
    const first: number = p * a[0] ** (p - 1);
    const second: number = p * (p - 1) * a[0] ** (p - 2);
    const third: number = p * (p - 1) * (p - 2) * a[0] ** (p - 3);
    return [value, first * a[1], first * a[2], first * a[3] + second * a[1] ** 2, first * a[4] + second * a[1] * a[2], first * a[5] + second * a[2] ** 2,
      first * a[6] + second * (a[1] * a[5] + 2 * a[2] * a[4]) + third * a[1] * a[2] ** 2];
  };
  /** Signed denominator division; the caller admits the underlying 3x3 solve. */
  const divide = (a: ScalarJet, b: ScalarJet): ScalarJet => multiply(a, scale(power(scale(b, b[0] < 0 ? -1 : 1), -1), b[0] < 0 ? -1 : 1));
  const vadd = (a: VectorJet, b: VectorJet): VectorJet => a.map((x: ScalarJet, i: number): ScalarJet => add(x, b[i]!)) as VectorJet;
  const vscale = (a: VectorJet, k: ScalarJet): VectorJet => a.map((x: ScalarJet): ScalarJet => multiply(x, k)) as VectorJet;
  const vdot = (a: VectorJet, b: VectorJet): ScalarJet => add(add(multiply(a[0], b[0]), multiply(a[1], b[1])), multiply(a[2], b[2]));
  const vcross = (a: VectorJet, b: VectorJet): VectorJet => [
    add(multiply(a[1], b[2]), scale(multiply(a[2], b[1]), -1)),
    add(multiply(a[2], b[0]), scale(multiply(a[0], b[2]), -1)),
    add(multiply(a[0], b[1]), scale(multiply(a[1], b[0]), -1)),
  ];
  const dot = (a: Vector, b: Vector): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const legendre = (x: ScalarJet, degree: number): ScalarJet[] => {
    const values: ScalarJet[] = [constant(1)];
    if (degree > 0) values.push(x);
    for (let n: number = 2; n <= degree; n++)
      values.push(scale(add(scale(multiply(x, values[n - 1]!), 2 * n - 1), scale(values[n - 2]!, 1 - n)), 1 / n));
    return values;
  };
}
