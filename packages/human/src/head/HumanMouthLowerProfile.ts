import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanMouthFeatures } from "./HumanMouthFeatures";

/** One source-identified symmetric lower-lip principal owns its exact central ports. */
export namespace HumanMouthLowerProfile {
  type Vector = HumanCurve.Vector;

  /** Existing mouth consumers and incident external skin share this single function. */
  export interface Result {
    /** Original public center-to-corner curve domains, evaluated from the full principal. */
    curves: { left: HumanMouthFeatures.Curve; right: HumanMouthFeatures.Curve };
    /** Sole existing-corner frame and exact central boundary restrictions. */
    central: HumanMouthFeatures.LowerCentral;
  }

  /**
   * Identify the complete lower lip in the observed commissural coordinate.
   * The two original named Hermite halves supply full physical-span projection
   * roots and Jacobians; original degree, physical h and both central jets remain
   * unchanged in the evidence. A six-scalar common symmetric degree-six law fixes
   * the actual corner endpoints and has a central tangent along their chord.
   * Source asymmetry and its small central G0 turn remain unsupported. This is a
   * new common approximation, not a source reduction or a source-copy fallback.
   *
   * Existing corners are injected once. This owner creates both public half curves
   * and the exact boundary objects for future lip/external skin consumers. The
   * central station is an analytic coordinate of this principal, not a numerical
   * inverse of the superseded curve or equal phases of independent features.
   */
  export function build(corners: { left: Vector; right: Vector }): Result {
    const first: Vector = corners.left, last: Vector = corners.right;
    const chord: Vector = last.map((value: number, axis: number): number => value - first[axis]!) as Vector;
    const width: number = Math.hypot(...chord);
    if (!(width > 0 && Number.isFinite(width) && first.every(Number.isFinite) && last.every(Number.isFinite)))
      throw new Error("The lower-lip principal requires finite existing mouth corners");
    const normal: Vector = chord.map((value: number): number => value / width) as Vector;
    const projection: Vector = [1 - normal[0] * normal[0], -normal[0] * normal[1], -normal[0] * normal[2]];
    const magnitude: number = Math.hypot(...projection);
    if (!(magnitude > 0 && Number.isFinite(magnitude))) throw new Error("The mouth chord has no registered forward chart");
    const forward: Vector = projection.map((value: number): number => value / magnitude) as Vector;
    const up: Vector = [normal[1] * forward[2] - normal[2] * forward[1],
      normal[2] * forward[0] - normal[0] * forward[2], normal[0] * forward[1] - normal[1] * forward[0]];
    const full: (u: number) => { position: Vector; derivative: Vector } =
      (u: number): { position: Vector; derivative: Vector } => {
        admit(u, 0, 1);
        const x: [number, number] = residual(forwardCoefficients, u), y: [number, number] = residual(upCoefficients, u);
        const position: Vector = u === 0 ? first : u === 1 ? last : first.map((value: number, axis: number): number =>
          value + u * chord[axis]! + width * (forward[axis]! * x[0] + up[axis]! * y[0])) as Vector;
        const derivative: Vector = chord.map((value: number, axis: number): number =>
          value + width * (forward[axis]! * x[1] + up[axis]! * y[1])) as Vector;
        return { position, derivative };
      };
    const curves: Partial<Result["curves"]> = {}, ports: HumanMouthFeatures.LowerPort[] = [];
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? -1 : 1;
      const id: string = "head.mouth." + side + ".lower.outer";
      curves[side] = { id,
        evaluate: (t: number): Vector => { admit(t, 0, 1); return full((1 + sign * t) / 2).position; },
        derivative: (t: number): Vector => {
          admit(t, 0, 1);
          return full((1 + sign * t) / 2).derivative.map((value: number): number => sign * value / 2) as Vector;
        } };
      const start: number = side === "left" ? 0.2 : 0.5, end: number = side === "left" ? 0.5 : 0.8;
      const boundary: HumanSurface.Boundary = { id: id + ".central-commissural", start, end,
        unit: "commissural-chord-fraction",
        evaluate: (u: number): Vector => { admit(u, start, end); return full(u).position; },
        derivative: (u: number): Vector => { admit(u, start, end); return full(u).derivative; } };
      ports.push({ side, boundary });
    }
    return { curves: curves as Result["curves"], central: {
      widthMm: width, normal, forward, up, centerU: 0.5, ports,
      centerMm: first.map((value: number, axis: number): number => (value + last[axis]!) / 2) as Vector,
    } };
  }

  const forwardCoefficients: readonly number[] = [1.11636683524418, 0.49836511902425695, -0.1175080485423043];
  const upCoefficients: readonly number[] = [-0.5890586168938511, -0.22467261455732268, -0.5184742686709469];

  /** Exact degree-six value and along derivative; symmetry fixes the central tangent. */
  function residual(coefficients: readonly number[], u: number): [number, number] {
    const z: number = 2 * u - 1, z2: number = z * z;
    const polynomial: number = coefficients[0]! + z2 * (coefficients[1]! + z2 * coefficients[2]!);
    const derivative: number = 4 * z * coefficients[1]! + 8 * z * z2 * coefficients[2]!;
    const factor: number = u * (1 - u);
    return [factor * polynomial, (1 - 2 * u) * polynomial + factor * derivative];
  }

  /** Finite source-supported restrictions never extend an existing principal. */
  function admit(value: number, start: number, end: number): void {
    if (!(Number.isFinite(value) && value >= start && value <= end))
      throw new Error("Lower-lip parameter lies outside its declared principal domain");
  }
}
