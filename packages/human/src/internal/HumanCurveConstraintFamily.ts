import type { HumanCurve } from "./HumanCurve";
import { HumanCurveFamily } from "./HumanCurveFamily";

/** Interpolate exactly owned periodic boundaries without projecting their shape
 * into radial sections. Shared curves may be nonplanar; their transverse jets
 * and circumferential derivatives retain distinct physical parameter scales.
 */
export namespace HumanCurveConstraintFamily {
  /** One principal boundary, with millimetre longitudinal and radian phase units. */
  export interface Principal {
    /** Identity of the sole owner's generating curve. */
    id: string;
    /** Physical longitudinal parameter in mm; this need not be world Y. */
    stationMm: number;
    /** World position in mm at periodic phase radians. */
    evaluate: (phaseRadians: number) => HumanCurve.Vector;
    /** Exact world phase derivative in mm/radian for the same curve. */
    phaseDerivative: (phaseRadians: number) => HumanCurve.Vector;
  }

  /** Solve the minimum-bending longitudinal cubic through all supplied curves.
   * A shared boundary function is evaluated directly, without Fourier sampling,
   * planarization or coordinate welding. The tridiagonal factors are computed
   * once. Each jet evaluation solves six scalar systems, O(N) work and temporary
   * storage plus the caller's curve/endpoint costs for N principal boundaries.
   * Caller functions must remain deterministic and own any closed-over state.
   */
  export function build(principal: readonly Principal[], endpoints: HumanCurveFamily.Endpoints = {}): HumanCurveFamily.Family {
    if (principal.length < 2) throw new Error("A constrained family requires at least two owned boundaries");
    const names: Set<string> = new Set();
    const rows: readonly Principal[] = Object.freeze(principal.map((row: Principal, index: number): Principal => {
      if (!row.id || names.has(row.id) || !Number.isFinite(row.stationMm) || (index > 0 && !(row.stationMm > principal[index - 1]!.stationMm)) || typeof row.evaluate !== "function" || typeof row.phaseDerivative !== "function")
        throw new Error("Constraint identities, functions and physical stations must be finite, unique and ordered");
      names.add(row.id);
      return Object.freeze({ ...row });
    }));
    const conditions: HumanCurveFamily.Endpoints = { ...endpoints };
    const count: number = rows.length;
    const widths: number[] = rows.slice(1).map((row: Principal, index: number): number => row.stationMm - rows[index]!.stationMm);
    if (!widths.every((width: number): boolean => width > 0 && Number.isFinite(width))) throw new Error("Constraint station widths must be positive and representable");
    const lower: number[] = new Array<number>(count).fill(0), upper: number[] = new Array<number>(count).fill(0), diagonal: number[] = new Array<number>(count).fill(2);
    upper[0] = conditions.start === undefined ? 1 : 0;
    lower[count - 1] = conditions.end === undefined ? 1 : 0;
    if (conditions.start) diagonal[0] = 1;
    if (conditions.end) diagonal[count - 1] = 1;
    for (let index: number = 1; index < count - 1; index++) {
      const sum: number = widths[index - 1]! + widths[index]!;
      if (!Number.isFinite(sum)) throw new Error("Constraint width sum exceeds the physical range");
      lower[index] = widths[index]! / sum;
      upper[index] = widths[index - 1]! / sum;
    }
    const pivots: number[] = [...diagonal], multipliers: number[] = new Array<number>(count).fill(0);
    for (let index: number = 1; index < count; index++) {
      multipliers[index] = lower[index]! / pivots[index - 1]!;
      pivots[index] = diagonal[index]! - multipliers[index]! * upper[index - 1]!;
      if (!(pivots[index]! > 0 && Number.isFinite(pivots[index]))) throw new Error("Constraint slope system lost a positive pivot");
    }
    const solve: (values: number[]) => number[] = (values: number[]): number[] => {
      for (let index: number = 1; index < count; index++) values[index] = values[index]! - multipliers[index]! * values[index - 1]!;
      values[count - 1] = values[count - 1]! / pivots[count - 1]!;
      for (let index: number = count - 2; index >= 0; index--) values[index] = (values[index]! - upper[index]! * values[index + 1]!) / pivots[index]!;
      if (!values.every(Number.isFinite)) throw new Error("Constraint longitudinal derivatives are not finite");
      return values;
    };
    const sample: (phase: number) => HumanCurveFamily.Jet[] = (phase: number): HumanCurveFamily.Jet[] => {
      if (!Number.isFinite(phase)) throw new Error("Constraint phase must be finite radians");
      const values: HumanCurve.Vector[] = rows.map((row: Principal): HumanCurve.Vector => checked(row.evaluate(phase)));
      const tangents: HumanCurve.Vector[] = rows.map((row: Principal): HumanCurve.Vector => checked(row.phaseDerivative(phase)));
      const jets: HumanCurveFamily.Jet[] = values.map((positionMm: HumanCurve.Vector, index: number): HumanCurveFamily.Jet => ({ positionMm, phaseDerivativeMmPerRadian: tangents[index]!, longitudinalDerivative: [0, 0, 0], longitudinalPhaseDerivativePerRadian: [0, 0, 0] }));
      const boundary: Array<[HumanCurve.Vector, HumanCurve.Vector] | undefined> = [conditions.start, conditions.end].map((condition: HumanCurveFamily.EndpointDerivative | undefined): [HumanCurve.Vector, HumanCurve.Vector] | undefined => condition === undefined ? undefined : [checked(condition.evaluate(phase)), checked(condition.phaseDerivative(phase))]);
      for (let derivative: number = 0; derivative < 2; derivative++)
        for (let axis: number = 0; axis < 3; axis++) {
          const positions: HumanCurve.Vector[] = derivative === 0 ? values : tangents;
          const secants: number[] = widths.map((width: number, index: number): number => (positions[index + 1]![axis]! - positions[index]![axis]!) / width);
          const rhs: number[] = new Array<number>(count).fill(0);
          rhs[0] = boundary[0] === undefined ? 3 * secants[0]! : boundary[0]![derivative]![axis]!;
          rhs[count - 1] = boundary[1] === undefined ? 3 * secants[count - 2]! : boundary[1]![derivative]![axis]!;
          for (let index: number = 1; index < count - 1; index++) rhs[index] = 3 * (lower[index]! * secants[index - 1]! + upper[index]! * secants[index]!);
          const slopes: number[] = solve(rhs);
          for (let index: number = 0; index < count; index++) (derivative === 0 ? jets[index]!.longitudinalDerivative : jets[index]!.longitudinalPhaseDerivativePerRadian)[axis] = slopes[index]!;
        }
      return jets;
    };
    const intervals: HumanCurveFamily.Interval[] = rows.slice(1).map((row: Principal, index: number): HumanCurveFamily.Interval => HumanCurveFamily.interval(rows[index]!.stationMm, row.stationMm, (phase: number): HumanCurveFamily.Jet => sample(phase)[index]!, (phase: number): HumanCurveFamily.Jet => sample(phase)[index + 1]!));
    const jet: HumanCurveFamily.Family["jet"] = (station: number, phase: number): HumanCurveFamily.Jet => {
      const interval: HumanCurveFamily.Interval | undefined = intervals.find((candidate: HumanCurveFamily.Interval): boolean => station >= candidate.startMm && station <= candidate.endMm);
      if (interval === undefined) throw new Error("Constraint station lies outside the owned interval");
      return interval.jet(station, phase);
    };
    return {
      sections: Object.freeze([]), intervals: Object.freeze(intervals), jet,
      evaluate: (station: number, phase: number): HumanCurve.Vector => jet(station, phase).positionMm,
      derivative: (station: number, phase: number): HumanCurve.Vector => jet(station, phase).longitudinalDerivative,
      phaseDerivative: (station: number, phase: number): HumanCurve.Vector => jet(station, phase).phaseDerivativeMmPerRadian,
      boundaryConditions: { start: conditions.start === undefined ? "natural" : "clamped", end: conditions.end === undefined ? "natural" : "clamped" },
      refine: (depth: number, maxIntervals: number): HumanCurveFamily.Interval[] => {
        const leaves: number = intervals.length * 2 ** depth;
        if (!Number.isSafeInteger(depth) || depth < 0 || !Number.isSafeInteger(maxIntervals) || maxIntervals < 1 || !Number.isSafeInteger(leaves) || leaves > maxIntervals) throw new Error("Constraint subdivision exceeds its finite interval budget");
        let result: HumanCurveFamily.Interval[] = [...intervals];
        for (let level: number = 0; level < depth; level++) result = result.flatMap((interval: HumanCurveFamily.Interval): HumanCurveFamily.Interval[] => interval.subdivide());
        return result;
      },
      limitations: Object.freeze(["Principal boundary functions and supplied jets are owned constraints; interpolation establishes no missing feature or anatomical correspondence", "All intermediate curves and guides restrict the same minimum-bending world cubic", "The caller must establish phase transport, orientation, physical station scales, self-intersection freedom and topology"]),
    };
  }

  /** Copy finite values without displacement, rounding or normalization. */
  function checked(vector: HumanCurve.Vector): HumanCurve.Vector {
    if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(Number.isFinite)) throw new Error("A constraint returned a nonfinite physical vector");
    return [...vector];
  }
}
