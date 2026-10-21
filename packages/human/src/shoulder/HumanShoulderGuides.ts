import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";

/** Common shoulder guide laws identified from complete saved physical Hermite
 * paths. These generated polynomial approximations do not edit source spans,
 * replace their physical widths, or establish native causal parameter effects.
 */
export namespace HumanShoulderGuides {
  /** Existing body controls; physical girth and native unitless shape stay distinct. */
  export interface Parameters {
    /** Authored bicep course in mm, finite and strictly positive. */
    bicepMm: number;
    /** Existing native masculine/feminine coordinate, in [-1,1]. */
    shape: number;
  }

  /** Sole-owner current support frame, including the bilateral across direction. */
  export interface Frame {
    /** Actual shared upper-arm support origin, mm. */
    originMm: HumanCurve.Vector;
    /** Projected global forward unit direction; every across guide lies at zero. */
    forward: HumanCurve.Vector;
    /** Bilaterally corresponding across unit direction, orthogonal to the others. */
    across: HumanCurve.Vector;
    /** Actual shared shoulder-to-elbow axial unit direction. */
    axial: HumanCurve.Vector;
  }

  /** An actual port authority and its geometric derivative at fixed guide plane. */
  export interface Endpoint {
    /** Original shared port curve object; its full function remains authoritative. */
    boundary: HumanSurface.Boundary;
    /** Actual parameter address in that boundary's declared unit and interval. */
    parameter: number;
    /** dP/da in mm/mm, where a=dot(axial,P-originMm), at fixed forward plane.
     * The common boundary owner supplies this field, including its phase gauge.
     */
    physicalAxialDerivative: (portParameter: number) => HumanCurve.Vector;
  }

  /** An endpoint additionally declares the generated physical phase gauge. */
  export interface PhaseEndpoint extends Endpoint {
    /** da/ds in mm/mm for increasing generated phase s. BC starts negative and
     * ends positive. A unit-tangent gauge is sign/norm(dP/da); an original source
     * gauge must remain separately identified rather than silently normalized.
     */
    axialSpeedPerPhysicalPhase: number;
  }

  /** Principal source-defined features before any port or skin assembly. */
  export interface Features {
    /** Conditional geometric saddle landmark, mm; not a clinical joint centre. */
    criticalPointMm: HumanCurve.Vector;
    /** Minimum of the inner guide's physical axial coordinate relative to origin. */
    innerMinimumAxialMm: number;
    /** Observed population and independently unobserved response qualifications. */
    limitations: readonly string[];
  }

  /** One exact generating function consumed by construction and adjacent patches. */
  export interface Guide {
    /** Shared generated boundary; its parameter kind is stated separately below. */
    curve: HumanSurface.Boundary;
    /** Exact second derivative in mm per squared declared physical parameter. */
    secondDerivative: (parameter: number) => HumanCurve.Vector;
    /** Generated polynomial degree, independent of the unchanged source degree. */
    degree: 3 | 6;
    /** Physical axial coordinate for AB/AC, oriented physical phase for BC. */
    parameterKind: "physical-axial-mm" | "oriented-physical-phase-mm";
    /** The actual original endpoint objects retained for the common owner. */
    endpoints: readonly [Endpoint, Endpoint];
    /** The identified BC minimum; absent for an ordinary axial guide. */
    minimum?: {
      /** Axial coordinate relative to the actual support origin, mm. */
      physicalAxialMm: number;
      /** Parameter address in the generated ascending physical phase, mm. */
      physicalPhaseMm: number;
    };
    /** Conditional source fidelity and unassembled neighboring domains. */
    limitations: readonly string[];
  }

  /** Move branch features with actual bicep girth around the existing support.
   * Six common saddle coefficients have held-out position error <=2.594 mm.
   * The separate axial minimum law has held-out axial error <=1.224 mm. These
   * are four-form geometric observations, not independent native interventions.
   */
  export function features(parameters: Parameters, frame: Frame): Features {
    validate(parameters, frame);
    const m: number = parameters.shape, g: number = parameters.bicepMm;
    const local: HumanCurve.Vector = [
      g * (-0.045320825331134754 + 0.0020021825247833907 * m),
      g * (-0.1513610763610297 + 0.005394118541193308 * m),
      g * (0.23892822785684392 + 0.012099938545674203 * m),
    ];
    const criticalPointMm: HumanCurve.Vector = [...frame.originMm];
    for (let axis: number = 0; axis < 3; axis++)
      criticalPointMm[axis] = criticalPointMm[axis]! + local[0] * frame.forward[axis]! + local[1] * frame.across[axis]! + local[2] * frame.axial[axis]!;
    const limitations: string[] = qualifications();
    if (g < 251.35665893554688 || g > 377.10025787353516 || m < -0.9922778606414795 || m > 0.9263235926628113)
      limitations.push("These controls predict outside the observed four-form feature range; independent native response remains unobserved.");
    const innerMinimumAxialMm: number = g * (0.2347001962006215 + 0.01274294511744449 * m);
    if (!finite(criticalPointMm) || !Number.isFinite(innerMinimumAxialMm)) throw new Error("The shoulder feature construction overflowed its physical domain");
    return { criticalPointMm, innerMinimumAxialMm, limitations };
  }

  /** Approximate AB or AC in physical axial coordinate using actual endpoint
   * positions and dP/da jets. This declared generated parameter is not the
   * original recovered guide's physical phase. The shared owner chooses the
   * qualified before/after ports and supplies compatible transverse fields.
   */
  export function outer(id: string, frame: Frame, start: Endpoint, end: Endpoint): Guide {
    validateFrame(frame);
    const a: Anchor = anchor(frame, start), b: Anchor = anchor(frame, end);
    const width: number = b.axialMm - a.axialMm;
    if (!(width > 0 && Number.isFinite(width))) throw new Error("An outer shoulder guide requires increasing physical axial ports");
    const coefficients: HumanCurve.Vector[] = hermite(subtract(b.position, a.position), scale(a.cross, width), scale(b.cross, width));
    return polynomial(id, start, end, a.position, coefficients, a.axialMm, b.axialMm, a.cross, b.cross, 3, "physical-axial-mm", qualifications());
  }

  /** Generate the inner B-to-C curve from one q-driven minimum and endpoint
   * jet authority. Its degree-six vector law has endpoint-value/first-jet-zero
   * residuals. The physical width follows directly from its actual polynomial
   * axial minimum; no specimen width, average seam or source mesh is consumed.
   */
  export function inner(id: string, parameters: Parameters, frame: Frame, start: PhaseEndpoint, end: PhaseEndpoint): Guide {
    const feature: Features = features(parameters, frame);
    const a: Anchor = anchor(frame, start), b: Anchor = anchor(frame, end);
    const tolerance: number = arithmeticTolerance([...a.position, ...b.position, ...frame.originMm]);
    if (Math.abs(a.axialMm - b.axialMm) > tolerance)
      throw new Error("Inner shoulder endpoints require one shared physical after-plane");
    if (!(Number.isFinite(start.axialSpeedPerPhysicalPhase) && start.axialSpeedPerPhysicalPhase < 0 && Number.isFinite(end.axialSpeedPerPhysicalPhase) && end.axialSpeedPerPhysicalPhase > 0))
      throw new Error("Inner shoulder phase must descend from B and ascend toward C");
    const d0: HumanCurve.Vector = scale(a.cross, start.axialSpeedPerPhysicalPhase);
    const d1: HumanCurve.Vector = scale(b.cross, end.axialSpeedPerPhysicalPhase);
    const chord: HumanCurve.Vector = subtract(b.position, a.position);
    const u: HumanCurve.Vector = unit(chord, "inner guide chord");
    let normal: HumanCurve.Vector = unit(cross(u, d0), "inner guide bending plane");
    const roll: number = dot(normal, frame.forward);
    if (Math.abs(roll) <= 256 * Number.EPSILON) throw new Error("Inner shoulder bending-plane orientation is unresolved");
    if (roll < 0) normal = scale(normal, -1);
    const v: HumanCurve.Vector = cross(normal, u);
    const opening: number = dot(subtract(d0, d1), v);
    const residual: HumanCurve.Vector[] = residualCoefficients(opening, u, v, normal);
    const perWidth: HumanCurve.Vector[] = hermite([0, 0, 0], d0, d1);
    for (let degree: number = 0; degree < residual.length; degree++) {
      perWidth[degree] ??= [0, 0, 0];
      perWidth[degree] = add(perWidth[degree]!, residual[degree]!);
    }
    const axialPolynomial: number[] = perWidth.map((coefficient: HumanCurve.Vector): number => dot(frame.axial, coefficient));
    const minimum: Minimum = polynomialMinimum(axialPolynomial);
    const depth: number = feature.innerMinimumAxialMm - a.axialMm;
    if (!(minimum.parameter > 0 && minimum.parameter < 1 && minimum.value < 0 && depth < 0))
      throw new Error("The inner shoulder law has no admitted negative interior axial minimum");
    const width: number = depth / minimum.value;
    if (!(width > 0 && Number.isFinite(width))) throw new Error("The feature-derived inner shoulder width is unsupported");
    const coefficients: HumanCurve.Vector[] = hermite(chord, scale(d0, width), scale(d1, width));
    for (let degree: number = 0; degree < residual.length; degree++) {
      coefficients[degree] ??= [0, 0, 0];
      coefficients[degree] = add(coefficients[degree]!, scale(residual[degree]!, width));
    }
    const actualAxial: number[] = coefficients.map((coefficient: HumanCurve.Vector): number => dot(frame.axial, coefficient));
    const actualMinimum: Minimum = polynomialMinimum(actualAxial);
    if (Math.abs(a.axialMm + actualMinimum.value - feature.innerMinimumAxialMm) > 4 * tolerance)
      throw new Error("Floating endpoint-plane disagreement prevents the identified shoulder minimum");
    const limitations: string[] = [...feature.limitations,
      "Conditional whole-person holdout curve RMS is at most 1.146 mm and maximum error 2.164 mm when supplied source endpoint/jet observations; this is not full unseen-person or real-render validation.",
      "Predicted physical phase width differs from preserved original source widths by up to 2.792 mm in that conditional holdout.",
    ];
    if (opening < -1.829828769722693 || opening > 1.7828252413640515)
      limitations.push("The endpoint opening lies outside its observed source range; this admitted curve is an unobserved geometric prediction.");
    const guide: Guide = polynomial(id, start, end, a.position, coefficients, 0, width, d0, d1, 6, "oriented-physical-phase-mm", limitations);
    guide.minimum = { physicalAxialMm: feature.innerMinimumAxialMm, physicalPhaseMm: actualMinimum.parameter * width };
    return guide;
  }

  interface Anchor { position: HumanCurve.Vector; cross: HumanCurve.Vector; axialMm: number }
  interface Minimum { parameter: number; value: number }
  interface Budget { remaining: number }

  function anchor(frame: Frame, endpoint: Endpoint): Anchor {
    const curve: HumanSurface.Boundary = endpoint.boundary;
    if (!(Number.isFinite(endpoint.parameter) && endpoint.parameter >= curve.start && endpoint.parameter <= curve.end)) throw new Error("A shoulder anchor lies outside its actual port authority");
    const position: HumanCurve.Vector = curve.evaluate(endpoint.parameter), tangent: HumanCurve.Vector = curve.derivative(endpoint.parameter);
    const derivative: HumanCurve.Vector = endpoint.physicalAxialDerivative(endpoint.parameter);
    if (![position, tangent, derivative].every(finite)) throw new Error("A shoulder endpoint returned a nonfinite generating jet");
    const relative: HumanCurve.Vector = subtract(position, frame.originMm);
    if (Math.abs(dot(relative, frame.forward)) > arithmeticTolerance([...position, ...frame.originMm]) || Math.abs(dot(derivative, frame.forward)) > arithmeticTolerance(derivative) || Math.abs(dot(derivative, frame.axial) - 1) > arithmeticTolerance(derivative))
      throw new Error("A shoulder endpoint does not use the shared guide plane and physical axial coordinate");
    const independence: number = Math.hypot(...cross(tangent, derivative));
    if (!(independence > 256 * Number.EPSILON * Math.hypot(...tangent) * Math.hypot(...derivative))) throw new Error("Port and shoulder guide directions are singular or unresolved");
    return { position, cross: derivative, axialMm: dot(relative, frame.axial) };
  }

  function residualCoefficients(opening: number, u: HumanCurve.Vector, v: HumanCurve.Vector, normal: HumanCurve.Vector): HumanCurve.Vector[] {
    const theta: readonly (readonly number[])[] = [
      [-0.1042222989641844, 0.01846298493227455, 1.6712859105972836e-15],
      [0.4171206916862465, 0.7437215021061911, -4.563865434980711e-16],
      [0.9515231211217555, 1.0830721948417554, -3.565999618384034e-15],
      [-0.2096901671820262, -0.1792252669125139, -4.862154670922557e-16],
      [-0.5950166106261291, -0.5505944564277365, -9.994571237927703e-15],
      [-0.5672934565756659, -1.487101812159093, -1.4328845539013582e-15],
    ];
    const legendre: readonly (readonly number[])[] = [[1], [-1, 2], [1, -6, 6]];
    const bubble: readonly number[] = [0, 0, 1, -2, 1];
    const result: HumanCurve.Vector[] = Array.from({ length: 7 }, (): HumanCurve.Vector => [0, 0, 0]);
    for (let k: number = 0; k < 3; k++) {
      const local: HumanCurve.Vector = [0, 0, 0];
      for (let axis: number = 0; axis < 3; axis++) local[axis] = theta[2 * k]![axis]! + opening * theta[2 * k + 1]![axis]!;
      const vector: HumanCurve.Vector = add(add(scale(u, local[0]), scale(v, local[1])), scale(normal, local[2]));
      for (let i: number = 0; i < bubble.length; i++)
        for (let j: number = 0; j < legendre[k]!.length; j++) result[i + j] = add(result[i + j]!, scale(vector, bubble[i]! * legendre[k]![j]!));
    }
    return result;
  }

  function hermite(chord: HumanCurve.Vector, d0: HumanCurve.Vector, d1: HumanCurve.Vector): HumanCurve.Vector[] {
    return [[0, 0, 0], d0, add(add(scale(chord, 3), scale(d0, -2)), scale(d1, -1)), add(add(scale(chord, -2), d0), d1)];
  }

  function polynomial(id: string, start: Endpoint, end: Endpoint, origin: HumanCurve.Vector, coefficients: HumanCurve.Vector[], low: number, high: number, d0: HumanCurve.Vector, d1: HumanCurve.Vector, degree: 3 | 6, parameterKind: Guide["parameterKind"], limitations: readonly string[]): Guide {
    if (!id) throw new Error("A generated shoulder guide requires an identity");
    const width: number = high - low;
    const derivative: HumanCurve.Vector[] = differentiateVectors(coefficients), second: HumanCurve.Vector[] = differentiateVectors(derivative);
    function normalized(parameter: number): number {
      if (!(Number.isFinite(parameter) && parameter >= low && parameter <= high)) throw new Error("A shoulder guide was evaluated outside its physical domain");
      return (parameter - low) / width;
    }
    const curve: HumanSurface.Boundary = { id, unit: "mm", start: low, end: high,
      evaluate: (parameter: number): HumanCurve.Vector => {
        const t: number = normalized(parameter);
        if (parameter === low) return start.boundary.evaluate(start.parameter);
        if (parameter === high) return end.boundary.evaluate(end.parameter);
        return add(origin, evaluateVector(coefficients, t));
      },
      derivative: (parameter: number): HumanCurve.Vector => {
        const t: number = normalized(parameter);
        if (parameter === low) return [...d0];
        if (parameter === high) return [...d1];
        return scale(evaluateVector(derivative, t), 1 / width);
      },
    };
    return { curve, secondDerivative: (parameter: number): HumanCurve.Vector => scale(evaluateVector(second, normalized(parameter)), 1 / (width * width)), degree, parameterKind, endpoints: [start, end], limitations };
  }

  function polynomialMinimum(coefficients: readonly number[]): Minimum {
    const budget: Budget = { remaining: 4096 };
    const stationary: number[] = roots(differentiate(coefficients), budget);
    const candidates: Minimum[] = [0, ...stationary.filter((value: number): boolean => value > 0 && value < 1), 1].map((parameter: number): Minimum => ({ parameter, value: evaluate(coefficients, parameter, budget) }));
    candidates.sort((a: Minimum, b: Minimum): number => a.value - b.value);
    if (!Number.isFinite(candidates[0]!.value)) throw new Error("The shoulder minimum is nonfinite");
    if (candidates[1] && Math.abs(candidates[1].value - candidates[0]!.value) <= arithmeticTolerance(coefficients)) throw new Error("The shoulder minimum has an unresolved competing branch");
    return candidates[0]!;
  }

  /** Derivative partition isolates roots of degree <=5 on a finite interval.
   * Only exact zero leading coefficients are removed. Floating multiple roots,
   * unresolved competing branches and exhausted arithmetic budgets are refused;
   * this is not an interval-arithmetic certificate for unobserved degeneracies.
   */
  function roots(input: readonly number[], budget: Budget): number[] {
    const coefficients: number[] = [...input];
    while (coefficients.length > 1 && coefficients[coefficients.length - 1] === 0) coefficients.pop();
    const degree: number = coefficients.length - 1;
    if (degree > 5 || !coefficients.every(Number.isFinite)) throw new Error("An unsupported shoulder stationary polynomial was supplied");
    if (degree === 0) {
      if (coefficients[0] === 0) throw new Error("A shoulder stationary polynomial vanishes identically");
      return [];
    }
    if (degree === 1) {
      const root: number = -coefficients[0]! / coefficients[1]!;
      return root >= 0 && root <= 1 ? [root] : [];
    }
    const critical: number[] = roots(differentiate(coefficients), budget);
    const partition: number[] = [0, ...critical.filter((value: number): boolean => value > 0 && value < 1), 1];
    const result: number[] = [];
    for (const value of partition)
      if (Math.abs(evaluate(coefficients, value, budget)) <= arithmeticTolerance(coefficients)) result.push(value);
    for (let i: number = 0; i + 1 < partition.length; i++) {
      let low: number = partition[i]!, high: number = partition[i + 1]!;
      let fLow: number = evaluate(coefficients, low, budget), fHigh: number = evaluate(coefficients, high, budget);
      if (!(fLow * fHigh < 0)) continue;
      for (let step: number = 0; step < 80; step++) {
        const middle: number = low + (high - low) / 2;
        if (middle === low || middle === high) break;
        const value: number = evaluate(coefficients, middle, budget);
        if (value === 0) { low = middle; high = middle; break; }
        if (fLow * value < 0) { high = middle; fHigh = value; }
        else { low = middle; fLow = value; }
      }
      result.push(Math.abs(fLow) <= Math.abs(fHigh) ? low : high);
    }
    result.sort((a: number, b: number): number => a - b);
    return result.filter((value: number, index: number): boolean => index === 0 || value !== result[index - 1]);
  }

  function differentiate(coefficients: readonly number[]): number[] { return coefficients.slice(1).map((value: number, index: number): number => value * (index + 1)); }
  function evaluate(coefficients: readonly number[], parameter: number, budget: Budget): number {
    if (--budget.remaining < 0) throw new Error("The shoulder stationary-root arithmetic budget was exhausted");
    let result: number = 0;
    for (let i: number = coefficients.length - 1; i >= 0; i--) result = result * parameter + coefficients[i]!;
    return result;
  }
  function differentiateVectors(coefficients: readonly HumanCurve.Vector[]): HumanCurve.Vector[] { return coefficients.slice(1).map((value: HumanCurve.Vector, index: number): HumanCurve.Vector => scale(value, index + 1)); }
  function evaluateVector(coefficients: readonly HumanCurve.Vector[], parameter: number): HumanCurve.Vector {
    const result: HumanCurve.Vector = [0, 0, 0];
    for (let i: number = coefficients.length - 1; i >= 0; i--)
      for (let axis: number = 0; axis < 3; axis++) result[axis] = result[axis]! * parameter + coefficients[i]![axis]!;
    return result;
  }
  function validate(parameters: Parameters, frame: Frame): void {
    if (!(Number.isFinite(parameters.bicepMm) && parameters.bicepMm > 0 && Number.isFinite(parameters.shape) && parameters.shape >= -1 && parameters.shape <= 1)) throw new Error("The shoulder law requires positive mm bicep girth and shape in [-1,1]");
    validateFrame(frame);
  }
  function validateFrame(frame: Frame): void {
    if (![frame.originMm, frame.forward, frame.across, frame.axial].every(finite)) throw new Error("The shoulder support frame is nonfinite");
    const axes: HumanCurve.Vector[] = [frame.forward, frame.across, frame.axial];
    for (let i: number = 0; i < 3; i++)
      for (let j: number = 0; j < 3; j++) if (Math.abs(dot(axes[i]!, axes[j]!) - (i === j ? 1 : 0)) > 1024 * Number.EPSILON) throw new Error("The shoulder frame requires actual orthonormal shared axes");
  }
  function qualifications(): string[] { return [
    "The original recovered Hermite spans, physical widths, unresolved source tolerance and source topology remain independent evidence; generated degree-three/six laws are approximations.",
    "These current-pose four-form geometric rules establish no clinical landmark, material phase or independently observed native causal response.",
    "External A/B/C ports, compatible whole-edge transverse fields, mixed twists, diagonals and an embedded neighboring skin remain the common boundary owner's responsibility.",
    "Floating stationary-root isolation is finite and conditionally admitted; nonfinite, degenerate or unresolved branches are refused rather than patched.",
  ]; }
  function finite(value: HumanCurve.Vector): boolean { return value.length === 3 && value.every(Number.isFinite); }
  function arithmeticTolerance(values: readonly number[]): number { return 256 * Number.EPSILON * Math.max(1, ...values.map(Math.abs)); }
  function add(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(value: HumanCurve.Vector, factor: number): HumanCurve.Vector { return [value[0] * factor, value[1] * factor, value[2] * factor]; }
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function unit(value: HumanCurve.Vector, meaning: string): HumanCurve.Vector {
    const length: number = Math.hypot(...value);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("An unresolved shoulder direction was supplied: " + meaning);
    return scale(value, 1 / length);
  }
}
