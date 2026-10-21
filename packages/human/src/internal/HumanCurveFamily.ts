import type { HumanCurve } from "./HumanCurve";

/**
 * One world-space curve authority interpolates generated principal sections.
 * Radial Fourier curves are expanded algebraically before a natural or clamped
 * cubic spline solves longitudinal slopes. Plane axes are never renormalized.
 * This interpolation minimizes integrated squared world second derivative for
 * each phase under its endpoint conditions; it identifies no missing anatomy.
 */
export namespace HumanCurveFamily {
  /** Physical world vector; derivative records state their independent units. */
  export type Vector = HumanCurve.Vector;

  /** A shared endpoint's prescribed longitudinal jet, supplied by its sole owner. */
  export interface EndpointDerivative {
    /** Deterministic dP/ds in mm per mm at circumferential phase in radians. */
    evaluate: (phaseRadians: number) => Vector;

    /** Deterministic d²P/(ds dphase), in inverse radians, for the same boundary. */
    phaseDerivative: (phaseRadians: number) => Vector;

    /** Optional exact d³P/(ds dphase²), inverse radians squared. Its absence leaves interior angular second jets unsupported. */
    phaseSecondDerivative?: (phaseRadians: number) => Vector;
  }

  /** Independently prescribed end slopes; an omitted end uses zero second derivative. */
  export interface Endpoints {
    /** Shared longitudinal derivative at the first principal station. */
    start?: EndpointDerivative;

    /** Shared longitudinal derivative at the last principal station. */
    end?: EndpointDerivative;
  }

  /** Independent longitudinal and circumferential derivatives of one surface point. */
  export interface Jet {
    /** World position, mm. */
    positionMm: Vector;

    /** dP/ds, mm per longitudinal station mm. */
    longitudinalDerivative: Vector;

    /** dP/dphase, mm per circumferential radian. */
    phaseDerivativeMmPerRadian: Vector;

    /** d²P/(ds dphase), inverse circumferential radians. */
    longitudinalPhaseDerivativePerRadian: Vector;

    /** Exact d²P/ds² when supplied by the analytic owner, inverse mm. Omission is unsupported, never a numerical-difference substitute. */
    longitudinalSecondDerivative?: Vector;

    /** Exact d²P/dphase² when supplied by the analytic owner, mm per radian squared. */
    phaseSecondDerivativeMmPerRadianSquared?: Vector;

    /** Exact d³P/(ds dphase²), inverse radians squared, when the owner supplies the full angular second jet of its longitudinal slope. */
    longitudinalPhaseSecondDerivativePerRadianSquared?: Vector;
  }

  /** One physical Hermite interval; subdivision preserves the existing polynomial. */
  export interface Interval {
    /** First physical longitudinal station, mm. */
    startMm: number;

    /** Last physical longitudinal station, mm. */
    endMm: number;

    /** Evaluate the existing interval and both independent first derivatives. */
    jet: (stationMm: number, phaseRadians: number) => Jet;

    /** Split at its physical midpoint using the parent's exact midpoint jet. */
    subdivide: () => [Interval, Interval];
  }

  /** Skin and construction consume this same function-valued spline. */
  export interface Family {
    /** Exact world-Fourier power coefficients of an ordinary unclamped cubic
     * family. Function-valued or externally clamped families omit this field;
     * their original functions are never sampled or reduced to populate it.
     */
    polynomialSpans?: readonly PolynomialSpan[];
    /** Frozen radial principal descriptors when present. General constrained
     * families retain their exact boundary functions instead of planar descriptors.
     * Recursive intervals add no principal sections.
     */
    sections: readonly HumanCurve.Section[];

    /** One interval per adjacent principal pair, with shared world endpoint slopes. */
    intervals: readonly Interval[];

    /** The selected mathematical condition at each end, independently of join qualification. */
    boundaryConditions: { start: "natural" | "clamped" | "analytic"; end: "natural" | "clamped" | "analytic" };

    /** World position in mm; longitudinal station is bounded by the principal domain. */
    evaluate: (stationMm: number, phaseRadians: number) => Vector;

    /** Longitudinal derivative dP/ds in mm per station mm, never a ring tangent. */
    derivative: (stationMm: number, phaseRadians: number) => Vector;

    /** Circumferential derivative dP/dphase in mm per radian. */
    phaseDerivative: (stationMm: number, phaseRadians: number) => Vector;

    /** Return position, first derivatives and their mixed derivative together. */
    jet: (stationMm: number, phaseRadians: number) => Jet;

    /** Recursively restrict every interval under the caller's finite leaf budget. */
    refine: (depth: number, maxIntervals: number) => Interval[];

    /** Endpoint assumptions and geometric claims that interpolation does not establish. */
    limitations: readonly string[];
  }

  /** Complete cubic powers in u=(s-startMm)/(endMm-startMm), world mm. */
  export interface PolynomialSpan {
    /** Original physical interval start, mm. */
    startMm: number;
    /** Original physical interval end, mm. */
    endMm: number;
    /** Ascending local powers; each retains c0,cos1,sin1,... world vectors. */
    powers: readonly (readonly Vector[])[];
  }

  /**
   * Build a world-position spline over strictly increasing physical stations.
   * Each radial Fourier curve becomes world Fourier degree K+1 by exact product
   * identities, without changing its input order or its plane. A diagonally
   * dominant tridiagonal slope system is factored once. Every coefficient channel
   * and optional endpoint influence uses those same factors, costing O(NK) work
   * and storage for N sections and maximum radial degree K. Evaluation costs O(K)
   * plus interval lookup; caller endpoint functions own their computation cost.
   * Copies and factors belong to the returned family; there is no global cache.
   */
  export function build(
    principal: readonly HumanCurve.Section[],
    endpoints: Endpoints = {},
  ): Family {
    if (!Array.isArray(principal) || principal.length < 2)
      throw new Error("A curve family requires at least two principal sections");
    const names: Set<string> = new Set();
    const sections: HumanCurve.Section[] = principal.map(
      (section: HumanCurve.Section, index: number): HumanCurve.Section => {
        if (!section.id || names.has(section.id) || !Number.isFinite(section.stationMm) ||
          (index > 0 && !(section.stationMm > principal[index - 1]!.stationMm)) ||
          !vector(section.originMm) || !vector(section.axisU) || !vector(section.axisV) ||
          !Array.isArray(section.coefficientsMm) || section.coefficientsMm.length % 2 !== 1 ||
          !section.coefficientsMm.every(Number.isFinite))
          throw new Error("Principal identities, stations, planes and odd radial Fourier arrays must be finite and ordered");
        const normU: number = dot(section.axisU, section.axisU);
        const normV: number = dot(section.axisV, section.axisV);
        if (Math.abs(normU - 1) > 1e-10 || Math.abs(normV - 1) > 1e-10 || Math.abs(dot(section.axisU, section.axisV)) > 1e-10)
          throw new Error("Principal plane axes must already be orthonormal; the family does not normalize them");
        names.add(section.id);
        const copy: HumanCurve.Section = {
          id: section.id, stationMm: section.stationMm,
          originMm: [...section.originMm], axisU: [...section.axisU], axisV: [...section.axisV],
          coefficientsMm: [...section.coefficientsMm],
          ...(section.topology === undefined ? {} : { topology: section.topology }),
        };
        Object.freeze(copy.originMm); Object.freeze(copy.axisU); Object.freeze(copy.axisV);
        Object.freeze(copy.coefficientsMm); Object.freeze(copy);
        return copy;
      },
    );
    Object.freeze(sections);
    for (const endpoint of [endpoints.start, endpoints.end])
      if (endpoint !== undefined && (typeof endpoint.evaluate !== "function" || typeof endpoint.phaseDerivative !== "function"))
        throw new Error("A clamped endpoint requires its longitudinal derivative and exact phase derivative");
    const startEndpoint: EndpointDerivative | undefined = endpoints.start === undefined ? undefined : { ...endpoints.start };
    const endEndpoint: EndpointDerivative | undefined = endpoints.end === undefined ? undefined : { ...endpoints.end };
    const count: number = sections.length;
    const channels: number = Math.max(...sections.map((section: HumanCurve.Section): number => section.coefficientsMm.length)) + 2;
    const world: Vector[][] = sections.map((section: HumanCurve.Section): Vector[] => worldCoefficients(section, channels));
    const widths: number[] = sections.slice(1).map((section: HumanCurve.Section, i: number): number => section.stationMm - sections[i]!.stationMm);
    if (widths.some((width: number): boolean => !(width > 0 && Number.isFinite(width))))
      throw new Error("Physical station widths must be positive and representable");
    const lower: number[] = new Array<number>(count).fill(0);
    const upper: number[] = new Array<number>(count).fill(0);
    const diagonal: number[] = new Array<number>(count).fill(2);
    upper[0] = startEndpoint === undefined ? 1 : 0;
    lower[count - 1] = endEndpoint === undefined ? 1 : 0;
    if (startEndpoint !== undefined) diagonal[0] = 1;
    if (endEndpoint !== undefined) diagonal[count - 1] = 1;
    for (let i: number = 1; i < count - 1; i++) {
      const sum: number = widths[i - 1]! + widths[i]!;
      if (!Number.isFinite(sum)) throw new Error("Adjacent station width sum is unresolved");
      lower[i] = widths[i]! / sum;
      upper[i] = widths[i - 1]! / sum;
    }
    const pivots: number[] = [...diagonal];
    const multipliers: number[] = new Array<number>(count).fill(0);
    for (let i: number = 1; i < count; i++) {
      multipliers[i] = lower[i]! / pivots[i - 1]!;
      pivots[i] = diagonal[i]! - multipliers[i]! * upper[i - 1]!;
      if (!(pivots[i]! > 0 && Number.isFinite(pivots[i])))
        throw new Error("The longitudinal slope factorization lost a positive pivot");
    }
    const solve: (rhs: readonly number[]) => number[] = (rhs: readonly number[]): number[] => {
      const values: number[] = [...rhs];
      for (let i: number = 1; i < count; i++) values[i] = values[i]! - multipliers[i]! * values[i - 1]!;
      values[count - 1] = values[count - 1]! / pivots[count - 1]!;
      for (let i: number = count - 2; i >= 0; i--) values[i] = (values[i]! - upper[i]! * values[i + 1]!) / pivots[i]!;
      if (!values.every(Number.isFinite)) throw new Error("Longitudinal spline slopes are not finite");
      return values;
    };
    const slopes: Vector[][] = sections.map((): Vector[] => Array.from({ length: channels }, (): Vector => [0, 0, 0]));
    for (let channel: number = 0; channel < channels; channel++)
      for (let axis: number = 0; axis < 3; axis++) {
        const secants: number[] = widths.map((width: number, i: number): number => (world[i + 1]![channel]![axis]! - world[i]![channel]![axis]!) / width);
        const rhs: number[] = new Array<number>(count).fill(0);
        if (startEndpoint === undefined) rhs[0] = 3 * secants[0]!;
        if (endEndpoint === undefined) rhs[count - 1] = 3 * secants.at(-1)!;
        for (let i: number = 1; i < count - 1; i++) rhs[i] = 3 * (lower[i]! * secants[i - 1]! + upper[i]! * secants[i]!);
        const values: number[] = solve(rhs);
        for (let i: number = 0; i < count; i++) slopes[i]![channel]![axis] = values[i]!;
      }
    const endpointWeight: (at: number, enabled: boolean) => number[] = (at: number, enabled: boolean): number[] => {
      const rhs: number[] = new Array<number>(count).fill(0);
      if (enabled) rhs[at] = 1;
      return solve(rhs);
    };
    const startWeights: number[] = endpointWeight(0, startEndpoint !== undefined);
    const endWeights: number[] = endpointWeight(count - 1, endEndpoint !== undefined);
    const at: (index: number, phase: number) => Jet = (index: number, phase: number): Jet => {
      const position: [Vector, Vector, Vector] = fourier(world[index]!, phase);
      const slope: [Vector, Vector, Vector] = fourier(slopes[index]!, phase);
      let completeAngularSlope: boolean = true;
      for (const [endpoint, weight] of [[startEndpoint, startWeights[index]!], [endEndpoint, endWeights[index]!]] as const) {
        if (endpoint === undefined) continue;
        const value: Vector = endpoint.evaluate(phase);
        const phaseValue: Vector = endpoint.phaseDerivative(phase);
        const phaseSecond: Vector | undefined = endpoint.phaseSecondDerivative?.(phase);
        if (!vector(value) || !vector(phaseValue)) throw new Error("A shared endpoint derivative returned a nonfinite vector");
        if (phaseSecond !== undefined && !vector(phaseSecond)) throw new Error("A shared endpoint angular second derivative returned a nonfinite vector");
        if (phaseSecond === undefined) completeAngularSlope = false;
        for (let axis: number = 0; axis < 3; axis++) {
          slope[0][axis] = slope[0][axis]! + weight * value[axis]!;
          slope[1][axis] = slope[1][axis]! + weight * phaseValue[axis]!;
          if (phaseSecond !== undefined) slope[2][axis] = slope[2][axis]! + weight * phaseSecond[axis]!;
        }
      }
      return { positionMm: position[0], longitudinalDerivative: slope[0], phaseDerivativeMmPerRadian: position[1], longitudinalPhaseDerivativePerRadian: slope[1], phaseSecondDerivativeMmPerRadianSquared: position[2], ...(completeAngularSlope ? { longitudinalPhaseSecondDerivativePerRadianSquared: slope[2] } : {}) };
    };
    const intervals: Interval[] = sections.slice(1).map((section: HumanCurve.Section, i: number): Interval =>
      interval(sections[i]!.stationMm, section.stationMm, (phase: number): Jet => at(i, phase), (phase: number): Jet => at(i + 1, phase)));
    const polynomialSpans: readonly PolynomialSpan[] | undefined = startEndpoint !== undefined || endEndpoint !== undefined ? undefined : Object.freeze(widths.map((width: number,index: number): PolynomialSpan => ({
      startMm:sections[index]!.stationMm,endMm:sections[index+1]!.stationMm,
      powers:Object.freeze(Array.from({length:4},(_:unknown,power:number):readonly Vector[] => Object.freeze(Array.from({length:channels},(_:unknown,channel:number):Vector => Object.freeze([0,1,2].map((axis:number):number => {
        const a:number=world[index]![channel]![axis]!,b:number=world[index+1]![channel]![axis]!,da:number=width*slopes[index]![channel]![axis]!,db:number=width*slopes[index+1]![channel]![axis]!;
        return power===0?a:power===1?da:power===2?3*(b-a)-2*da-db:2*(a-b)+da+db;
      })) as unknown as Vector)))),
    })));
    Object.freeze(intervals);
    const jet: (station: number, phase: number) => Jet = (station: number, phase: number): Jet => {
      if (!Number.isFinite(station) || station < sections[0]!.stationMm || station > sections.at(-1)!.stationMm)
        throw new Error("Longitudinal evaluation lies outside the principal station domain");
      let low: number = 0, high: number = intervals.length - 1;
      while (low < high) {
        const middle: number = Math.floor((low + high) / 2);
        if (station > intervals[middle]!.endMm) low = middle + 1; else high = middle;
      }
      return intervals[low]!.jet(station, phase);
    };
    return {
      sections, intervals, jet, ...(polynomialSpans === undefined ? {} : {polynomialSpans}),
      boundaryConditions: { start: startEndpoint === undefined ? "natural" : "clamped", end: endEndpoint === undefined ? "natural" : "clamped" },
      evaluate: (station: number, phase: number): Vector => jet(station, phase).positionMm,
      derivative: (station: number, phase: number): Vector => jet(station, phase).longitudinalDerivative,
      phaseDerivative: (station: number, phase: number): Vector => jet(station, phase).phaseDerivativeMmPerRadian,
      refine: (depth: number, maxIntervals: number): Interval[] => {
        const leaves: number = intervals.length * 2 ** depth;
        if (!Number.isSafeInteger(depth) || depth < 0 || !Number.isSafeInteger(maxIntervals) || maxIntervals < 1 || !Number.isSafeInteger(leaves) || leaves > maxIntervals)
          throw new Error("Recursive restriction exceeds its explicit finite interval budget");
        let result: Interval[] = [...intervals];
        for (let level: number = 0; level < depth; level++) result = result.flatMap((item: Interval): Interval[] => item.subdivide());
        return result;
      },
      limitations: Object.freeze([
        "Natural endpoints impose zero world second derivative; they do not qualify a shared anatomical join",
        "Clamped endpoint derivatives and their phase derivatives rely on the shared owner's supplied functions",
        "Midpoint subdivision restricts the existing cubic in binary64 arithmetic and does not improve shape or add observations",
        "Radial positivity, self-intersection, topology, feature correspondence and unsupported parameter ranges are not certified by interpolation",
      ]),
    };
  }

  /** Preserve an identified analytic surface and its actual longitudinal order.
   * Principal descriptors identify features and contour deaths; they are never
   * interpolated in place of the supplied function. Each recursive interval is
   * an exact domain restriction, so high longitudinal degree is not reduced to
   * cubic Hermite. The owner supplies consistent physical and phase derivatives.
   * Calls retain no global cache and cost the supplied evaluator plus constant
   * domain checks; principal features are metadata rather than evaluation knots.
   */
  export function fromFunction(principal: readonly HumanCurve.Section[], evaluateJet: (stationMm: number, phaseRadians: number) => Jet, limitations: readonly string[] = []): Family {
    if (principal.length < 2 || typeof evaluateJet !== "function") throw new Error("An analytic family requires principal features and its exact jet");
    const sections: readonly HumanCurve.Section[] = Object.freeze(principal.map((section: HumanCurve.Section, index: number): HumanCurve.Section => {
      if (!section.id || !Number.isFinite(section.stationMm) || (index > 0 && !(section.stationMm > principal[index - 1]!.stationMm))) throw new Error("Analytic principal feature stations must be ordered and finite");
      return Object.freeze({ ...section, originMm: Object.freeze([...section.originMm]) as unknown as Vector, axisU: Object.freeze([...section.axisU]) as unknown as Vector, axisV: Object.freeze([...section.axisV]) as unknown as Vector, coefficientsMm: Object.freeze([...section.coefficientsMm]) as unknown as number[] });
    }));
    const jet: Family["jet"] = (station: number, phase: number): Jet => {
      if (!Number.isFinite(station) || !Number.isFinite(phase) || station < sections[0]!.stationMm || station > sections.at(-1)!.stationMm) throw new Error("Analytic evaluation lies outside the physical family domain");
      const value: Jet = evaluateJet(station, phase);
      if (![value.positionMm, value.longitudinalDerivative, value.phaseDerivativeMmPerRadian, value.longitudinalPhaseDerivativePerRadian].every(vector)) throw new Error("Analytic surface jet must contain finite physical vectors");
      return value;
    };
    const intervals: readonly Interval[] = Object.freeze(sections.slice(1).map((section: HumanCurve.Section, index: number): Interval => restrictedInterval(sections[index]!.stationMm, section.stationMm, jet)));
    return {
      sections, intervals, jet, boundaryConditions: { start: "analytic", end: "analytic" },
      evaluate: (station: number, phase: number): Vector => jet(station, phase).positionMm,
      derivative: (station: number, phase: number): Vector => jet(station, phase).longitudinalDerivative,
      phaseDerivative: (station: number, phase: number): Vector => jet(station, phase).phaseDerivativeMmPerRadian,
      refine: (depth: number, maxIntervals: number): Interval[] => refineIntervals(intervals, depth, maxIntervals),
      limitations: Object.freeze([...limitations, "Analytic derivative consistency, feature correspondence and topology are owned by the generating method; restriction adds no missing shape"]),
    };
  }

  /** Restrict an existing authority without refitting its curves or jets.
   * Open cut boundaries consume that exact authority; no planar surrogate,
   * endpoint averaging or transverse derivative replacement is introduced.
   */
  export function restrict(family: Family, startMm: number, endMm: number): Family {
    if (!(Number.isFinite(startMm) && Number.isFinite(endMm) && startMm < endMm && startMm >= family.intervals[0]!.startMm && endMm <= family.intervals.at(-1)!.endMm)) throw new Error("Restricted domain must lie inside the generating authority");
    const jet: Family["jet"] = (station: number, phase: number): Jet => {
      if (!Number.isFinite(station) || station < startMm || station > endMm) throw new Error("Evaluation lies outside the restricted domain");
      return family.jet(station, phase);
    };
    const intervals: readonly Interval[] = Object.freeze(family.intervals.filter((row: Interval): boolean => row.startMm < endMm && row.endMm > startMm).map((row: Interval): Interval => restrictedInterval(Math.max(startMm, row.startMm), Math.min(endMm, row.endMm), jet)));
    return { ...family, sections: Object.freeze(family.sections.filter((section: HumanCurve.Section): boolean => section.stationMm >= startMm && section.stationMm <= endMm)), intervals, jet,
      evaluate: (station: number, phase: number): Vector => jet(station, phase).positionMm,
      derivative: (station: number, phase: number): Vector => jet(station, phase).longitudinalDerivative,
      phaseDerivative: (station: number, phase: number): Vector => jet(station, phase).phaseDerivativeMmPerRadian,
      refine: (depth: number, maxIntervals: number): Interval[] => refineIntervals(intervals, depth, maxIntervals),
      boundaryConditions: { start: "analytic", end: "analytic" },
    };
  }

  /** Recursively restrict any owned polynomial or analytic interval under a finite budget. */
  export function refineIntervals(intervals: readonly Interval[], depth: number, maxIntervals: number): Interval[] {
    const leaves: number = intervals.length * 2 ** depth;
    if (!Number.isSafeInteger(depth) || depth < 0 || !Number.isSafeInteger(maxIntervals) || maxIntervals < 1 || !Number.isSafeInteger(leaves) || leaves > maxIntervals) throw new Error("Recursive restriction exceeds its explicit finite interval budget");
    let result: Interval[] = [...intervals];
    for (let level: number = 0; level < depth; level++) result = result.flatMap((row: Interval): Interval[] => row.subdivide());
    return result;
  }

  /** A true domain restriction retains the complete owner's jet at every new point. */
  function restrictedInterval(startMm: number, endMm: number, authority: Family["jet"]): Interval {
    if (!(endMm > startMm && Number.isFinite(endMm - startMm))) throw new Error("Analytic interval needs a representable positive width");
    return Object.freeze({ startMm, endMm,
      jet: (station: number, phase: number): Jet => {
        if (!Number.isFinite(station) || station < startMm || station > endMm) throw new Error("Analytic interval evaluation is outside its domain");
        return authority(station, phase);
      },
      subdivide: (): [Interval, Interval] => {
        const middle: number = startMm + (endMm - startMm) / 2;
        if (!(middle > startMm && middle < endMm)) throw new Error("Analytic midpoint is no longer representable");
        return [restrictedInterval(startMm, middle, authority), restrictedInterval(middle, endMm, authority)];
      },
    });
  }

  /** Expand r(phase)(U cos phase + V sin phase) through exact product identities. */
  function worldCoefficients(section: HumanCurve.Section, channels: number): Vector[] {
    const result: Vector[] = Array.from({ length: channels }, (): Vector => [0, 0, 0]);
    result[0] = [...section.originMm];
    for (let axis: number = 0; axis < 3; axis++) {
      result[1]![axis] = section.coefficientsMm[0]! * section.axisU[axis]!;
      result[2]![axis] = section.coefficientsMm[0]! * section.axisV[axis]!;
    }
    for (let k: number = 1; 2 * k < section.coefficientsMm.length; k++) {
      const a: number = section.coefficientsMm[2 * k - 1]!, b: number = section.coefficientsMm[2 * k]!;
      for (let axis: number = 0; axis < 3; axis++) {
        const u: number = section.axisU[axis]!, v: number = section.axisV[axis]!;
        result[2 * (k + 1) - 1]![axis] = result[2 * (k + 1) - 1]![axis]! + (a * u - b * v) / 2;
        result[k === 1 ? 0 : 2 * (k - 1) - 1]![axis] = result[k === 1 ? 0 : 2 * (k - 1) - 1]![axis]! + (a * u + b * v) / 2;
        result[2 * (k + 1)]![axis] = result[2 * (k + 1)]![axis]! + (a * v + b * u) / 2;
        if (k > 1) result[2 * (k - 1)]![axis] = result[2 * (k - 1)]![axis]! + (-a * v + b * u) / 2;
      }
    }
    if (result.some((coefficient: Vector): boolean => !vector(coefficient))) throw new Error("World Fourier expansion is not finite");
    return result;
  }

  /** Evaluate one world Fourier series and its exact first and second phase derivatives. */
  function fourier(coefficients: readonly Vector[], phase: number): [Vector, Vector, Vector] {
    if (!Number.isFinite(phase)) throw new Error("Circumferential phase must be finite radians");
    const value: Vector = [...coefficients[0]!], derivative: Vector = [0, 0, 0], second: Vector = [0, 0, 0];
    for (let k: number = 1; 2 * k < coefficients.length; k++) {
      const cosine: number = Math.cos(k * phase), sine: number = Math.sin(k * phase);
      for (let axis: number = 0; axis < 3; axis++) {
        const a: number = coefficients[2 * k - 1]![axis]!, b: number = coefficients[2 * k]![axis]!;
        value[axis] = value[axis]! + a * cosine + b * sine;
        derivative[axis] = derivative[axis]! + k * (-a * sine + b * cosine);
        second[axis] = second[axis]! - k*k*(a*cosine+b*sine);
      }
    }
    if (!vector(value) || !vector(derivative) || !vector(second)) throw new Error("World Fourier evaluation is not finite");
    return [value, derivative, second];
  }

  /** Physical Hermite interpolation uses actual station width. An explicit
   * analytic authority instead creates exact restrictions of that function;
   * neither interval evaluation nor recursive subdivision refits its order.
   */
  export function interval(start: number, end: number, left: (phase: number) => Jet, right: (phase: number) => Jet, rootJet?: (station: number, phase: number) => Jet): Interval {
    const width: number = end - start;
    if (!(width > 0 && Number.isFinite(width))) throw new Error("A physical Hermite interval must have finite positive width");
    if (rootJet !== undefined) return restrictedInterval(start, end, rootJet);
    const jet: (station: number, phase: number) => Jet = (station: number, phase: number): Jet => {
      if (!Number.isFinite(station) || station < start || station > end) throw new Error("Station lies outside its Hermite interval");
      const a: Jet = left(phase), b: Jet = right(phase);
      const t: number = (station - start) / width;
      const t2: number = t * t, t3: number = t2 * t;
      const weights: number[] = [2 * t3 - 3 * t2 + 1, width * (t3 - 2 * t2 + t), -2 * t3 + 3 * t2, width * (t3 - t2)];
      const slopes: number[] = [(6 * t2 - 6 * t) / width, 3 * t2 - 4 * t + 1, (-6 * t2 + 6 * t) / width, 3 * t2 - 2 * t];
      const seconds: number[] = [(12*t-6)/(width*width),(6*t-4)/width,(-12*t+6)/(width*width),(6*t-2)/width];
      const position: Vector[] = [a.positionMm, a.longitudinalDerivative, b.positionMm, b.longitudinalDerivative];
      const phaseJet: Vector[] = [a.phaseDerivativeMmPerRadian, a.longitudinalPhaseDerivativePerRadian, b.phaseDerivativeMmPerRadian, b.longitudinalPhaseDerivativePerRadian];
      const combine: (values: readonly Vector[], factors: readonly number[]) => Vector = (values: readonly Vector[], factors: readonly number[]): Vector => {
        const result: Vector = [0, 0, 0];
        for (let i: number = 0; i < 4; i++)
          for (let axis: number = 0; axis < 3; axis++) result[axis] = result[axis]! + factors[i]! * values[i]![axis]!;
        if (!vector(result)) throw new Error("Hermite evaluation is not finite");
        return result;
      };
      const angular: Array<Vector | undefined> = [a.phaseSecondDerivativeMmPerRadianSquared,a.longitudinalPhaseSecondDerivativePerRadianSquared,b.phaseSecondDerivativeMmPerRadianSquared,b.longitudinalPhaseSecondDerivativePerRadianSquared];
      const completeAngular: boolean = angular.every((value: Vector | undefined): value is Vector => value !== undefined);
      return { positionMm: combine(position, weights), longitudinalDerivative: combine(position, slopes), phaseDerivativeMmPerRadian: combine(phaseJet, weights), longitudinalPhaseDerivativePerRadian: combine(phaseJet, slopes), longitudinalSecondDerivative: combine(position,seconds), ...(completeAngular ? { phaseSecondDerivativeMmPerRadianSquared: combine(angular as Vector[],weights), longitudinalPhaseSecondDerivativePerRadianSquared: combine(angular as Vector[],slopes) } : {}) };
    };
    const authority: (station: number, phase: number) => Jet = rootJet ?? jet;
    return Object.freeze({
      startMm: start, endMm: end, jet,
      subdivide: (): [Interval, Interval] => {
        const middle: number = start + width / 2;
        if (!(middle > start && middle < end)) throw new Error("Physical interval midpoint is no longer representable");
        const middleJet: (phase: number) => Jet = (phase: number): Jet => authority(middle, phase);
        return [interval(start, middle, left, middleJet, authority), interval(middle, end, middleJet, right, authority)];
      },
    });
  }

  /** Finite triples are admitted without displacement, normalization or rounding. */
  function vector(value: readonly number[]): value is Vector {
    return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
  }

  /** Dot product of already admitted world directions. */
  function dot(a: Vector, b: Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
