import type { HumanCurve } from "./HumanCurve";
import type { HumanSurface } from "./HumanSurface";

/** Function-valued Hermite transfinite interpolation preserves whole boundaries.
 * Cubic blending does not convert Fourier, higher-order or rational edges into
 * cubic curves. Shape must be identified before this interpolator is called.
 */
export namespace HumanHermitePatch {
  /** One canonical cross derivative along an existing physical edge. */
  export interface Side {
    /** Shared actual edge and its direction in the normalized chart. */
    edge: HumanSurface.Edge;
    /** dP/d(normalized transverse coordinate), world mm, including chart scale/shear. */
    cross: (physicalEdgeParameter: number) => HumanCurve.Vector;
    /** Derivative of cross with respect to the edge's declared physical parameter. */
    crossDerivative: (physicalEdgeParameter: number) => HumanCurve.Vector;
  }

  /** Compatible position, first derivatives and mixed derivative, all in mm. */
  export interface Jet {
    /** World millimetres from the identified boundary/interior law. */
    positionMm: HumanCurve.Vector;
    /** Derivative in the normalized increasing U direction. */
    derivativeU: HumanCurve.Vector;
    /** Derivative in the normalized increasing V direction. */
    derivativeV: HumanCurve.Vector;
    /** Mixed normalized derivative; physical widths belong to the side adapters. */
    derivativeUV: HumanCurve.Vector;
  }

  /** Ordinary patch with the same evaluator's additional mixed derivative. */
  export interface Patch extends HumanSurface.Patch {
    /** Exact analytic jet of the transfinite and identified interior terms. */
    jet: (u: number, v: number) => Jet;
  }

  /**
   * Construct the Boolean sum Pu+Pv-PuPv after checking all corner jets.
   * Cross derivatives are canonical chart derivatives; edge derivatives retain
   * their physical widths and reversal signs. Compatibility is checked within
   * binary64 arithmetic scale, never within source fitting error. Incompatible
   * corners must be solved jointly by the caller, rather than averaged here.
   * Optional interior[i][j] multiplies u²(1-u)² v²(1-v)² u^i v^j;
   * therefore it changes neither boundary positions nor their first jets.
   * Evaluation costs O(IJ) plus four edge evaluations. Returned closures own
   * copied interior coefficients and retain the caller's four edge authorities.
   * These constraints do not certify immersion, embedding or anatomical likeness.
   */
  export function build(id: string, sides: { u0: Side; u1: Side; v0: Side; v1: Side }, outwardSign: 1 | -1, interior: readonly (readonly HumanCurve.Vector[])[] = []): Patch {
    if (!id || (outwardSign !== 1 && outwardSign !== -1) || interior.length > 64 || interior.some((row: readonly HumanCurve.Vector[]): boolean => row.length > 64 || row.some((point: HumanCurve.Vector): boolean => !finite(point)))) throw new Error("Hermite patches require finite identified coefficients and an oriented domain");
    for (const side of Object.values(sides)) {
      const curve: HumanSurface.Boundary = side.edge.curve;
      if (!curve.id || !curve.unit || !(Number.isFinite(curve.start) && Number.isFinite(curve.end) && curve.end > curve.start && Number.isFinite(curve.end - curve.start)) || (side.edge.orientation !== 1 && side.edge.orientation !== -1)) throw new Error("Hermite patch side has no finite physical parameter");
    }
    const coefficients: HumanCurve.Vector[][] = interior.map((row: readonly HumanCurve.Vector[]): HumanCurve.Vector[] => row.map((value: HumanCurve.Vector): HumanCurve.Vector => [...value]));
    const ends: Sample[][] = [[sample(sides.u0, 0), sample(sides.u0, 1)], [sample(sides.u1, 0), sample(sides.u1, 1)]];
    for (let i: number = 0; i < 2; i++) for (let j: number = 0; j < 2; j++) {
      const vertical: Sample = ends[i]![j]!;
      const horizontal: Sample = sample(j === 0 ? sides.v0 : sides.v1, i);
      compatible(vertical.position, horizontal.position, "corner position");
      compatible(vertical.cross, horizontal.along, "corner U tangent");
      compatible(vertical.along, horizontal.cross, "corner V tangent");
      compatible(vertical.crossAlong, horizontal.crossAlong, "corner twist");
    }
    const matrix: HumanCurve.Vector[][] = [
      [ends[0]![0]!.position, ends[0]![1]!.position, ends[0]![0]!.along, ends[0]![1]!.along],
      [ends[1]![0]!.position, ends[1]![1]!.position, ends[1]![0]!.along, ends[1]![1]!.along],
      [ends[0]![0]!.cross, ends[0]![1]!.cross, ends[0]![0]!.crossAlong, ends[0]![1]!.crossAlong],
      [ends[1]![0]!.cross, ends[1]![1]!.cross, ends[1]![0]!.crossAlong, ends[1]![1]!.crossAlong],
    ];
    return { id, u: { start: 0, end: 1, unit: "normalized" }, v: { start: 0, end: 1, unit: "normalized" }, outwardSign,
      boundaries: { u0: sides.u0.edge, u1: sides.u1.edge, v0: sides.v0.edge, v1: sides.v1.edge }, jet };

    function jet(u: number, v: number): Jet {
      if (!(Number.isFinite(u) && u >= 0 && u <= 1 && Number.isFinite(v) && v >= 0 && v <= 1)) throw new Error("Hermite patch evaluation is outside its normalized domain");
      const hu: Basis = basis(u), hv: Basis = basis(v);
      const a: Sample = sample(sides.u0, v), b: Sample = sample(sides.u1, v), c: Sample = sample(sides.v0, u), d: Sample = sample(sides.v1, u);
      const fu: HumanCurve.Vector[] = [a.position, b.position, a.cross, b.cross], fuv: HumanCurve.Vector[] = [a.along, b.along, a.crossAlong, b.crossAlong];
      const fv: HumanCurve.Vector[] = [c.position, d.position, c.cross, d.cross], fvu: HumanCurve.Vector[] = [c.along, d.along, c.crossAlong, d.crossAlong];
      const result: Jet = { positionMm: [0, 0, 0], derivativeU: [0, 0, 0], derivativeV: [0, 0, 0], derivativeUV: [0, 0, 0] };
      for (let i: number = 0; i < 4; i++) {
        accumulate(result.positionMm, fu[i]!, hu.value[i]!); accumulate(result.positionMm, fv[i]!, hv.value[i]!);
        accumulate(result.derivativeU, fu[i]!, hu.derivative[i]!); accumulate(result.derivativeU, fvu[i]!, hv.value[i]!);
        accumulate(result.derivativeV, fuv[i]!, hu.value[i]!); accumulate(result.derivativeV, fv[i]!, hv.derivative[i]!);
        accumulate(result.derivativeUV, fuv[i]!, hu.derivative[i]!); accumulate(result.derivativeUV, fvu[i]!, hv.derivative[i]!);
        for (let j: number = 0; j < 4; j++) {
          const corner: HumanCurve.Vector = matrix[i]![j]!;
          accumulate(result.positionMm, corner, -hu.value[i]! * hv.value[j]!);
          accumulate(result.derivativeU, corner, -hu.derivative[i]! * hv.value[j]!);
          accumulate(result.derivativeV, corner, -hu.value[i]! * hv.derivative[j]!);
          accumulate(result.derivativeUV, corner, -hu.derivative[i]! * hv.derivative[j]!);
        }
      }
      for (let i: number = 0; i < coefficients.length; i++) for (let j: number = 0; j < coefficients[i]!.length; j++) {
        const p: [number, number] = bubblePower(u, i), q: [number, number] = bubblePower(v, j), coefficient: HumanCurve.Vector = coefficients[i]![j]!;
        accumulate(result.positionMm, coefficient, p[0] * q[0]); accumulate(result.derivativeU, coefficient, p[1] * q[0]);
        accumulate(result.derivativeV, coefficient, p[0] * q[1]); accumulate(result.derivativeUV, coefficient, p[1] * q[1]);
      }
      // The defining boundary functions also own evaluation at the closed edges.
      if (u === 0 || u === 1) {
        const side: Sample = u === 0 ? a : b;
        result.positionMm = side.position; result.derivativeU = side.cross; result.derivativeV = side.along; result.derivativeUV = side.crossAlong;
      } else if (v === 0 || v === 1) {
        const side: Sample = v === 0 ? c : d;
        result.positionMm = side.position; result.derivativeU = side.along; result.derivativeV = side.cross; result.derivativeUV = side.crossAlong;
      }
      return result;
    }
  }

  interface Sample { position: HumanCurve.Vector; along: HumanCurve.Vector; cross: HumanCurve.Vector; crossAlong: HumanCurve.Vector; }
  interface Basis { value: number[]; derivative: number[]; }
  function sample(side: Side, t: number): Sample {
    const curve: HumanSurface.Boundary = side.edge.curve;
    const width: number = (curve.end - curve.start) * side.edge.orientation;
    const parameter: number = t === 0 ? (width > 0 ? curve.start : curve.end) : t === 1 ? (width > 0 ? curve.end : curve.start) : (width > 0 ? curve.start : curve.end) + width * t;
    const result: Sample = { position: curve.evaluate(parameter), along: scale(curve.derivative(parameter), width), cross: side.cross(parameter), crossAlong: scale(side.crossDerivative(parameter), width) };
    if (!Object.values(result).every(finite)) throw new Error("Hermite side returned a nonfinite physical jet");
    return result;
  }
  function basis(t: number): Basis { return { value: [2*t*t*t-3*t*t+1, -2*t*t*t+3*t*t, t*t*t-2*t*t+t, t*t*t-t*t], derivative: [6*t*t-6*t, -6*t*t+6*t, 3*t*t-4*t+1, 3*t*t-2*t] }; }
  function bubblePower(t: number, power: number): [number, number] { return [t ** (power+2) * (1-t) ** 2, (power+2) * t ** (power+1) * (1-t) ** 2 - 2*t ** (power+2)*(1-t)]; }
  function finite(value: HumanCurve.Vector): boolean { return value.length === 3 && value.every(Number.isFinite); }
  function scale(value: HumanCurve.Vector, factor: number): HumanCurve.Vector { return [factor*value[0], factor*value[1], factor*value[2]]; }
  function accumulate(target: HumanCurve.Vector, value: HumanCurve.Vector, factor: number): void { for (let axis: number = 0; axis < 3; axis++) target[axis] = target[axis]! + factor*value[axis]!; }
  function compatible(a: HumanCurve.Vector, b: HumanCurve.Vector, name: string): void {
    if (a.some((value: number, axis: number): boolean => Math.abs(value-b[axis]!) > 64*Number.EPSILON*Math.max(1, Math.abs(value), Math.abs(b[axis]!)))) throw new Error("Incompatible Hermite patch " + name + "; solve shared constraints before interpolation");
  }
}
