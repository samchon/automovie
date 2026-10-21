import type { HumanCurve } from "./HumanCurve";

/** Full polynomial conversion and Green moments in the source Y gauge.
 * Forward differences retain degree n and all physical-Y coefficient jets.
 * Outward binary64 intervals propagate conversion and integration roundoff;
 * they concern exact input bits, not measurement error or source geometry.
 * Main owns world transport, boundary/phase identity, selection and integration.
 *
 * @evidence contracts/common.md#principled-implementation The Bernstein finite-difference identity supplies full powers; polynomial products and Green integrals carry second Y jets. Differentiating A*C=M gives centroid quotient jets without an average axis.
 * @evidence contracts/common.md#clear-and-simple-design convert handles one polynomial piece; closedSection reuses those same coefficients and a single operation budget for the complete horizontal section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rational tags/weights are unsupported; no degree reduction, sampling, shape fitting, absolute weld epsilon, coordinate correction or source fallback occurs.
 * @evidence contracts/common.md#meaningful-documentation Public records state local t, source Y, signed projected area/moment units, roundoff enclosures and incomplete states; coefficient-root equivalence is not asserted.
 * @evidence contracts/performance.md#efficient-algorithms For K pieces of degree at most n, forward differences and full polynomial convolutions cost O(K*n²) operations and O(K*n) returned coefficients; no numerical quadrature or repeated conversion is used.
 * @evidence contracts/performance.md#reuse-equivalent-work The section reuses each conversion's complete value/first/second powers for area and both moments; a caller can also consume the published powers for plane roots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Explicit piece, degree and operation limits bound each call; one private eight-byte next-representable workspace and returned evidence are call-owned, with no global cache or handles.
 */
export namespace HumanBernsteinSectionMath {
  type V = readonly [number, number, number];

  /** Inclusive binary64 enclosure, in the enclosing quantity's declared units. */
  export type Range = readonly [number, number];

  /** All three coordinate enclosures for one complete polynomial coefficient. */
  export type VectorRange = readonly [Range, Range, Range];

  /** One original piece; physical-Y fields differentiate controls at fixed local t. */
  export interface Piece {
    /** Original stable piece identity, unique in a closed section. */
    id: string;

    /** Rational and hybrid representations return unsupported, without conversion. */
    primitive: "polynomialBezier" | "rationalBezier" | "rationalXZPolynomialYBezier";

    /** Original nonnegative degree; every coefficient field has degree+1 entries. */
    degree: number;

    /** Original full Bernstein controls, mm. */
    controlsMm: readonly V[];

    /** Actual control derivatives per physical Y mm, mm/mm. */
    firstPerMm: readonly V[];

    /** Actual second control derivatives per Y mm², inverse mm. */
    secondPerMmSquared: readonly V[];

    /** Any supplied rational weights are unsupported, including all-one weights. */
    weights?: readonly number[];
  }

  /** Resource bounds and one relative numerical admission, with no physical epsilon. */
  export interface Policy {
    /** Largest admitted original degree; nonnegative safe integer. */
    maxDegree: number;

    /** Largest admitted section piece count; positive safe integer. */
    maxPieces: number;

    /** Positive safe-integer cap on charged admission/scalar arithmetic primitives. */
    maxOperations: number;

    /** In (0,1): maximum enclosed area roundoff divided by abs(nominal area).
     * This admits the centroid denominator only; it changes no curve or root.
     */
    maxRelativeAreaRoundoff: number;
  }

  /** One scalar and its first/second physical-Y derivatives. */
  export interface Jet {
    /** Area mm², moment mm³, or centroid coordinate mm, as its field declares. */
    value: number;

    /** First Y derivative: respectively mm, mm², or dimensionless. */
    first: number;

    /** Second Y derivative: respectively dimensionless, mm, or inverse mm. */
    second: number;

    /** Outward enclosures in value, first, second order, with those same units. */
    enclosures: readonly [Range, Range, Range];
  }

  /** Complete degree is preserved, even if its leading coefficient is exactly zero. */
  export interface Conversion {
    /** Complete is numerical conversion only; it is not exact polynomial equality. */
    status: "complete" | "unsupported" | "invalid" | "budget-exhausted" | "nonfinite";

    /** Original identity. */
    id: string;

    /** Original degree, including retained zero high powers. */
    degree: number;

    /** Ascending local-t value powers, mm; a failed conversion keeps its prefix. */
    powersMm: readonly HumanCurve.Vector[];

    /** Matching ascending first physical-Y powers, mm/mm. */
    firstPowersPerMm: readonly HumanCurve.Vector[];

    /** Matching ascending second physical-Y powers, inverse mm. */
    secondPowersPerMmSquared: readonly HumanCurve.Vector[];

    /** Outer order is value/first/second; then full power index; then X/Y/Z.
     * Each range encloses the exact rational Bernstein-to-power coefficient
     * for the supplied bits, assuming the documented IEEE arithmetic model.
     */
    powerEnclosures: readonly [readonly VectorRange[], readonly VectorRange[], readonly VectorRange[]];

    /** Explicit unsupported representation, stopped resource or numerical condition. */
    condition: string;

    /** Charged primitives consumed by this conversion; a section shares one
     * budget across these per-piece counts and all subsequent integrations.
     */
    operations: number;
  }

  /** Rational area-moment centroid and full physical-Y jets in this source gauge. */
  export interface Centroid {
    /** [Mx/A, original station Y, Mz/A], mm. */
    positionMm: HumanCurve.Vector;

    /** [d(Mx/A)/dY, 1, d(Mz/A)/dY], mm/mm. */
    firstPerMm: HumanCurve.Vector;

    /** [d²(Mx/A)/dY², 0, d²(Mz/A)/dY²], inverse mm. */
    secondPerMmSquared: HumanCurve.Vector;

    /** X-coordinate quotient jet and its arithmetic enclosures. */
    x: Jet;

    /** Z-coordinate quotient jet and its arithmetic enclosures. */
    z: Jet;
  }

  /** Numerical evidence is separate from topological/physical interpretation. */
  export interface Diagnostics {
    /** Charged primitives for the call; this is not a CPU instruction count. */
    operations: number;

    /** Full absolute area coefficient-integral term sum, nominal mm².
     * It is a cancellation diagnostic, not an area or a roundoff certificate.
     */
    areaAbsoluteIntegralTermSum?: number;

    /** Upper bound on abs(nominal A minus exact-input A), mm². */
    areaRoundoffAbsoluteBound?: number;

    /** Upward-rounded preceding bound divided by abs(nominal A), if nonzero. */
    relativeAreaRoundoff?: number;

    /** Original uninspected piece index range [start,end), when work stopped. */
    uninspectedPieceRange?: readonly [number, number];

    /** Explicit complete, unsupported, closure, arithmetic or budget condition. */
    condition: string;
  }

  /** Whole closed section; missing moments/centroid never imply a fallback axis. */
  export interface Section {
    /** Complete requires all pieces, exact endpoint/Y-field admission and a
     * finite centroid denominator passing the relative roundoff condition.
     */
    status: "complete" | "partial" | "invalid";

    /** Every inspected conversion, including an unsupported or stopped piece. */
    pieces: readonly Conversion[];

    /** Oriented area in XZ, mm²; no abs sign or orientation repair is applied. */
    signedArea?: Jet;

    /** Signed integral of X over area, mm³. */
    xMoment?: Jet;

    /** Signed integral of Z over area, mm³. */
    zMoment?: Jet;

    /** Issued only for the admitted rational quotient; source Y is unchanged. */
    centroid?: Centroid;

    /** Complete scalar-work and cancellation evidence. */
    diagnostics: Diagnostics;
  }

  /** Convert the full degree without sampling or changing the local [0,1] chart.
   * Input bits are exact points for enclosure propagation, not measurements
   * without uncertainty. Returned binary64 powers generally differ from the
   * exact rational transform; exact roots of those rounded powers do not prove
   * identical roots of the original Bernstein polynomial. No rational input
   * is treated as a Euclidean polynomial control cache.
   */
  export function convert(piece: Piece, policy: Policy): Conversion {
    const state: State = create(policy);
    return conversion(piece, state).result;
  }

  /** Integrate one closed horizontal source section and its actual Y 2-jet.
   * All endpoint positions and both Y fields must match exactly, including the
   * periodic seam. Every control Y field must be [stationMm,1,0]. C0 corners
   * in local t are permitted. Green formulas produce signed algebraic moments;
   * they do not certify simplicity, positive shell semantics or material phase.
   */
  export function closedSection(input: readonly Piece[], stationMm: number, policy: Policy): Section {
    const state: State = create(policy), results: Conversion[] = [], converted: Coefficient[][] = [];
    const output: Section = { status: "partial", pieces: results, diagnostics: { operations: 0, condition: "Uninspected" } };
    try {
      admitPolicy(policy);
      if (!Array.isArray(input) || input.length < 1 || !Number.isFinite(stationMm)) throw new Error("A finite source Y and a nonempty ordered section are required");
      const count: number = Math.min(input.length, policy.maxPieces), names: Set<string> = new Set();
      for (let i: number = 0; i < count; i++) {
        const item: Internal = conversion(input[i]!, state); results.push(item.result);
        if (item.result.status === "budget-exhausted") {
          output.diagnostics.uninspectedPieceRange = [i + 1, input.length];
          throw new Error("maxOperations; original piece and its converted prefix are retained");
        }
        if (item.coefficients !== undefined) converted.push(item.coefficients);
      }
      if (count < input.length) { output.diagnostics.uninspectedPieceRange = [count, input.length]; throw new Error("maxPieces; remaining original pieces are uninspected"); }
      if (results.some((item: Conversion): boolean => item.status !== "complete")) throw new Error("Every original piece must convert before whole-section moments exist");
      for (let i: number = 0; i < input.length; i++) {
        const a: Piece = input[i]!, b: Piece = input[(i + 1) % input.length]!;
        if (names.has(a.id)) throw new Error("Original piece identities must be unique"); names.add(a.id);
        const fields: readonly (readonly V[])[] = [a.controlsMm, a.firstPerMm, a.secondPerMmSquared];
        const next: readonly (readonly V[])[] = [b.controlsMm, b.firstPerMm, b.secondPerMmSquared];
        for (let order: number = 0; order < 3; order++) {
          for (const control of fields[order]!) { tick(state); if (control[1] !== (order === 0 ? stationMm : order === 1 ? 1 : 0)) throw new Error("Source horizontal control Y jet must be exactly [stationMm,1,0]"); }
          for (let axis: number = 0; axis < 3; axis++) { tick(state); if (fields[order]![a.degree]![axis] !== next[order]![0]![axis]) throw new Error("Original endpoint value/Y/YY fields do not close exactly"); }
        }
      }
      let area: IJ = zero(), mx: IJ = zero(), mz: IJ = zero(), absolute: S = literal(0);
      for (const coefficients of converted) {
        const x: IJ[] = coefficients.map((c: Coefficient): IJ => c[0]);
        const z: IJ[] = coefficients.map((c: Coefficient): IJ => c[2]);
        const cross: IJ[] = subtract(product(x, localDerivative(z, state), state), product(z, localDerivative(x, state), state), state);
        const a: IJ[] = cross.map((j: IJ): IJ => divideJet(j, literal(2), state));
        area = addJet(area, integral(a, state), state);
        mx = addJet(mx, divideJet(integral(product(x, cross, state), state), literal(3), state), state);
        mz = addJet(mz, divideJet(integral(product(z, cross, state), state), literal(3), state), state);
        for (let k: number = 0; k < a.length; k++) absolute = add(absolute, divide(absoluteScalar(a[k]![0]), literal(k + 1), state), state);
      }
      output.signedArea = publish(area); output.xMoment = publish(mx); output.zMoment = publish(mz);
      output.diagnostics.areaAbsoluteIntegralTermSum = absolute.value;
      tick(state); const error: number = up(Math.max(Math.abs(area[0].value - area[0].lower), Math.abs(area[0].upper - area[0].value)), state);
      if (!Number.isFinite(error)) throw new Arithmetic("The full signed-area enclosure has no finite absolute roundoff bound");
      output.diagnostics.areaRoundoffAbsoluteBound = error;
      tick(state); const relative: number = area[0].value === 0 ? Infinity : up(error / Math.abs(area[0].value), state);
      if (Number.isFinite(relative)) output.diagnostics.relativeAreaRoundoff = relative;
      if (area[0].lower <= 0 && area[0].upper >= 0) throw new Error("Signed area enclosure contains zero; no rational centroid is admitted");
      if (!(relative <= policy.maxRelativeAreaRoundoff)) throw new Error("Full-term area roundoff exceeds the relative denominator admission");
      const cx: IJ = quotient(mx, area, state), cz: IJ = quotient(mz, area, state);
      output.centroid = { positionMm: [cx[0].value, stationMm, cz[0].value], firstPerMm: [cx[1].value, 1, cz[1].value],
        secondPerMmSquared: [cx[2].value, 0, cz[2].value], x: publish(cx), z: publish(cz) };
      output.status = "complete"; output.diagnostics.condition = "Complete signed Green moments and numerical centroid jet, with exact-input arithmetic enclosures under the IEEE round-to-nearest model; no source-error or root-equivalence certificate";
    } catch (error) {
      output.diagnostics.condition = message(error);
      if (results.length === 0) output.status = "invalid";
    }
    output.diagnostics.operations = state.operations; return output;
  }

  /** Signed-area coefficients of the complete degree-n Bernstein basis.
   * For one oriented piece, A=sum_i,j X_i*values[i][j]*Z_j, in mm².
   * This reuses the same conversion, convolution and Green integral as the
   * closed-section authority. It neither closes a curve nor admits a centroid.
   * Bounded conversion costs O(n³), and all (n+1)² full products O(n⁴).
   */
  export function signedAreaBilinear(degree: number, policy: Policy): {
    status: Conversion["status"]; degree: number; values: number[][];
    enclosures: Range[][]; operations: number; condition: string;
  } {
    const state: State = create(policy), values: number[][] = [], enclosures: Range[][] = [];
    const output: {status: Conversion["status"];degree: number;values: number[][];enclosures: Range[][];operations: number;condition: string} =
      {status:"invalid",degree,values,enclosures,operations:0,condition:"Uninspected"};
    try {
      admitPolicy(policy);
      if (!Number.isSafeInteger(degree) || degree < 0 || degree > policy.maxDegree || degree+1 > policy.maxPieces)
        throw new Error("The complete basis must fit the explicit degree and piece bounds");
      const basis: IJ[][] = [];
      for (let index: number = 0; index <= degree; index++) {
        const converted: Internal = conversion({id:"bernstein-basis-"+index,primitive:"polynomialBezier",degree,
          controlsMm:Array.from({length:degree+1},(_:unknown,j:number):V=>[j===index?1:0,0,0]),
          firstPerMm:Array.from({length:degree+1},():V=>[0,0,0]),
          secondPerMmSquared:Array.from({length:degree+1},():V=>[0,0,0])},state);
        if (converted.coefficients === undefined) {
          output.status = converted.result.status; output.condition = converted.result.condition;
          return output;
        }
        basis.push(converted.coefficients.map((coefficient: Coefficient): IJ => coefficient[0]));
      }
      for (const x of basis) {
        const row: number[] = [], enclosed: Range[] = []; values.push(row); enclosures.push(enclosed);
        for (const z of basis) {
          const cross: IJ[] = subtract(product(x,localDerivative(z,state),state),product(z,localDerivative(x,state),state),state);
          const area: IJ = divideJet(integral(cross,state),literal(2),state);
          row.push(area[0].value); enclosed.push(range(area[0]));
        }
      }
      output.status = "complete";
      output.condition = "Complete oriented polynomial Bernstein Green bilinear form; outward exact-input arithmetic enclosures, without source-error or closed-surface qualification";
    } catch (error) {
      output.status = error instanceof Limit ? "budget-exhausted" : error instanceof Arithmetic ? "nonfinite" : "invalid";
      output.condition = message(error);
    } finally {output.operations = state.operations;}
    return output;
  }

  interface S { value: number; lower: number; upper: number }
  type IJ = readonly [S, S, S];
  type Coefficient = readonly [IJ, IJ, IJ];
  interface State { policy: Policy; operations: number; bits: DataView }
  interface Internal { result: Conversion; coefficients?: Coefficient[] }
  class Limit extends Error {}
  class Arithmetic extends Error {}

  function create(policy: Policy): State { return { policy, operations: 0, bits: new DataView(new ArrayBuffer(8)) }; }
  function admitPolicy(p: Policy): void {
    if (![p.maxDegree, p.maxPieces, p.maxOperations].every((v: number): boolean => Number.isSafeInteger(v) && v >= 0) || p.maxPieces < 1 || p.maxOperations < 1 ||
        !(p.maxRelativeAreaRoundoff > 0 && p.maxRelativeAreaRoundoff < 1)) throw new Error("Explicit finite work bounds and a relative area admission in (0,1) are required");
  }
  function tick(s: State): void { if (s.operations >= s.policy.maxOperations) throw new Limit("maxOperations"); s.operations++; }
  function literal(value: number): S { return { value, lower: value, upper: value }; }
  function zero(): IJ { return [literal(0), literal(0), literal(0)]; }
  function range(x: S): Range { return [x.lower, x.upper]; }
  function publish(x: IJ): Jet { return { value: x[0].value, first: x[1].value, second: x[2].value, enclosures: [range(x[0]), range(x[1]), range(x[2])] }; }
  function message(error: unknown): string { return error instanceof Error ? error.message : "Unknown coefficient arithmetic condition"; }
  /** Adjacent binary64 values give outward bounds even through subnormal rounding. */
  function up(value: number, s: State): number {
    if (value === Infinity || Number.isNaN(value)) return value;
    if (value === 0) return Number.MIN_VALUE;
    s.bits.setFloat64(0, value, false); const bits: bigint = s.bits.getBigUint64(0, false);
    s.bits.setBigUint64(0, value > 0 ? bits + 1n : bits - 1n, false); return s.bits.getFloat64(0, false);
  }
  function down(value: number, s: State): number { return -up(-value, s); }
  function bounded(value: number, lower: number, upper: number): S {
    if (![value, lower, upper].every(Number.isFinite) || lower > value || upper < value) throw new Arithmetic("Nonfinite or inconsistent outward arithmetic enclosure");
    return { value, lower, upper };
  }
  function add(a: S, b: S, s: State): S { tick(s); return bounded(a.value + b.value, down(a.lower + b.lower, s), up(a.upper + b.upper, s)); }
  function negative(a: S, s: State): S { tick(s); return { value: -a.value, lower: -a.upper, upper: -a.lower }; }
  function minus(a: S, b: S, s: State): S { return add(a, negative(b, s), s); }
  function multiply(a: S, b: S, s: State): S {
    tick(s); const corners: number[] = [a.lower * b.lower, a.lower * b.upper, a.upper * b.lower, a.upper * b.upper];
    return bounded(a.value * b.value, down(Math.min(...corners), s), up(Math.max(...corners), s));
  }
  function divide(a: S, b: S, s: State): S {
    tick(s); if (b.lower <= 0 && b.upper >= 0) throw new Arithmetic("Arithmetic denominator enclosure contains zero");
    const corners: number[] = [a.lower / b.lower, a.lower / b.upper, a.upper / b.lower, a.upper / b.upper];
    return bounded(a.value / b.value, down(Math.min(...corners), s), up(Math.max(...corners), s));
  }
  function absoluteScalar(a: S): S { return { value: Math.abs(a.value), lower: a.lower <= 0 && a.upper >= 0 ? 0 : Math.min(Math.abs(a.lower), Math.abs(a.upper)), upper: Math.max(Math.abs(a.lower), Math.abs(a.upper)) }; }
  function addJet(a: IJ, b: IJ, s: State): IJ { return [add(a[0], b[0], s), add(a[1], b[1], s), add(a[2], b[2], s)]; }
  function minusJet(a: IJ, b: IJ, s: State): IJ { return [minus(a[0], b[0], s), minus(a[1], b[1], s), minus(a[2], b[2], s)]; }
  function scaleJet(a: IJ, k: S, s: State): IJ { return [multiply(a[0], k, s), multiply(a[1], k, s), multiply(a[2], k, s)]; }
  function divideJet(a: IJ, k: S, s: State): IJ { return [divide(a[0], k, s), divide(a[1], k, s), divide(a[2], k, s)]; }
  function timesJet(a: IJ, b: IJ, s: State): IJ {
    return [multiply(a[0], b[0], s), add(multiply(a[1], b[0], s), multiply(a[0], b[1], s), s),
      add(add(multiply(a[2], b[0], s), multiply(multiply(literal(2), a[1], s), b[1], s), s), multiply(a[0], b[2], s), s)];
  }
  function quotient(m: IJ, a: IJ, s: State): IJ {
    const c: S = divide(m[0], a[0], s), cy: S = divide(minus(m[1], multiply(a[1], c, s), s), a[0], s);
    return [c, cy, divide(minus(minus(m[2], multiply(a[2], c, s), s), multiply(literal(2), multiply(a[1], cy, s), s), s), a[0], s)];
  }
  function conversion(piece: Piece, s: State): Internal {
    const start: number = s.operations;
    const powers: HumanCurve.Vector[][] = [[], [], []], bounds: VectorRange[][] = [[], [], []], coefficients: Coefficient[] = [];
    const result: Conversion = { status: "invalid", id: piece?.id ?? "", degree: piece?.degree ?? -1, powersMm: powers[0]!, firstPowersPerMm: powers[1]!, secondPowersPerMmSquared: powers[2]!,
      powerEnclosures: [bounds[0]!, bounds[1]!, bounds[2]!], condition: "Uninspected", operations: 0 };
    try {
      admitPolicy(s.policy);
      if (piece?.primitive !== "polynomialBezier" || piece.weights !== undefined) { result.status = "unsupported"; result.condition = "Only original polynomial Bernstein controls are supported"; return { result }; }
      if (!piece.id || !Number.isSafeInteger(piece.degree) || piece.degree < 0 || piece.degree > s.policy.maxDegree) throw new Error("Original identity and nonnegative degree must be within the explicit degree bound");
      const n: number = piece.degree, fields: readonly (readonly V[])[] = [piece.controlsMm, piece.firstPerMm, piece.secondPerMmSquared];
      if (fields.some((f: readonly V[]): boolean => !Array.isArray(f) || f.length !== n + 1)) throw new Error("All three original coefficient fields require degree+1 controls");
      const work: Coefficient[] = [];
      for (let i: number = 0; i <= n; i++) {
        tick(s);
        for (const field of fields) if (!Array.isArray(field[i]) || field[i]!.length !== 3 || !field[i]!.every(Number.isFinite)) throw new Error("Every original coefficient field must contain finite 3-vectors");
        work.push([0, 1, 2].map((axis: number): IJ => [literal(fields[0]![i]![axis]!), literal(fields[1]![i]![axis]!), literal(fields[2]![i]![axis]!)]) as unknown as Coefficient);
      }
      let choose: S = literal(1);
      for (let k: number = 0; k <= n; k++) {
        const c: Coefficient = work[0]!.map((j: IJ): IJ => scaleJet(j, choose, s)) as unknown as Coefficient; coefficients.push(c);
        for (let order: number = 0; order < 3; order++) {
          powers[order]!.push(c.map((j: IJ): number => j[order]!.value) as HumanCurve.Vector);
          bounds[order]!.push(c.map((j: IJ): Range => range(j[order]!)) as unknown as VectorRange);
        }
        if (k < n) {
          for (let i: number = 0; i < n - k; i++) work[i] = [0, 1, 2].map((axis: number): IJ => minusJet(work[i + 1]![axis]!, work[i]![axis]!, s)) as unknown as Coefficient;
          choose = divide(multiply(choose, literal(n - k), s), literal(k + 1), s);
        }
      }
      result.status = "complete"; result.condition = "Full original degree and physical-Y fields retained; outward roundoff enclosures accompany rounded powers"; return { result, coefficients };
    } catch (error) { result.status = error instanceof Limit ? "budget-exhausted" : error instanceof Arithmetic ? "nonfinite" : "invalid"; result.condition = message(error); return { result }; }
    finally { result.operations = s.operations - start; }
  }
  function localDerivative(p: readonly IJ[], s: State): IJ[] { return p.length === 1 ? [zero()] : p.slice(1).map((j: IJ, i: number): IJ => scaleJet(j, literal(i + 1), s)); }
  function product(a: readonly IJ[], b: readonly IJ[], s: State): IJ[] {
    const out: IJ[] = Array.from({ length: a.length + b.length - 1 }, (): IJ => zero());
    for (let i: number = 0; i < a.length; i++) for (let j: number = 0; j < b.length; j++) out[i + j] = addJet(out[i + j]!, timesJet(a[i]!, b[j]!, s), s);
    return out;
  }
  function subtract(a: readonly IJ[], b: readonly IJ[], s: State): IJ[] { return Array.from({ length: Math.max(a.length, b.length) }, (_: unknown, i: number): IJ => minusJet(a[i] ?? zero(), b[i] ?? zero(), s)); }
  function integral(p: readonly IJ[], s: State): IJ { let out: IJ = zero(); for (let k: number = 0; k < p.length; k++) out = addJet(out, divideJet(p[k]!, literal(k + 1), s), s); return out; }
}
