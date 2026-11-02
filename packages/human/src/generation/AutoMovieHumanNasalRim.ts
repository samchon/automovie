import { AutoMovieHumanNasalConstruction as N } from "./AutoMovieHumanNasalConstruction";

/** One physical nostril curve shared by the hood and the aperture consumer. */
export namespace AutoMovieHumanNasalRim {

  /** Physical source geometry and numerical sampling for this construction. */
  export interface Input {

    /** Positive lateral nasal extent in physical millimetres. */
    halfWidth: number;

    /** Positive forward nasal projection used by the source opening construction, in millimetres. */
    tipLead: number;

    /** Incline of the nasal-base course, in radians. */
    columella: number;

    /** Existing longitudinal and transverse opening scales relative to nasal half-width. */
    size: readonly [number, number];

    /** Existing forward and lateral opening placement scales in the source construction. */
    center: readonly [number, number];

    /** Opening's rotation within the physical nasal-base construction, in radians. */
    sweep: number;

    /** Existing longitudinal modulation of the transverse opening profile. */
    tear: number;

    /** Reflection sign applied to world lateral coordinates for the two nasal sides. */
    side: 1 | -1;

    /** Existing non-nasal face foundation, without a projection onto this rim. */
    face: (y: number, z: number) => number;

    /** Actual curved nasal-base course; flattening it changes the inner rim. */
    base: (across: number) => number;
  }

  /** The same physical Fourier opening consumed by skin and aperture generation. */
  export interface Curve {

    /** Fourier harmonic count shared with the existing aperture consumer. */
    order: number;

    /** Axis-major Fourier constants and cosine/sine pairs for the same physical opening. */
    coefficients: number[];

    /** The physical world-space point at this boundary or intersection. */
    point: (phase: number) => N.Point;

    /** The first derivative in the curve's parameter; Fourier phases use radians. */
    first: (phase: number) => N.Point;

    /** The second derivative in the curve's parameter; Fourier phases use radians. */
    second: (phase: number) => N.Point;
  }

  /**
   * The current nasal construction's existing teardrop and curved base own
   * the opening before skin composition. No generated-skin projection feeds
   * back into its position. The same third-order Fourier curve is passed to
   * the hood and loft aperture rather than fitting two separate boundaries.
   */
  export function create(input: Input): Curve {
    if (!(input.halfWidth > 0 && input.tipLead > 0) || Math.abs(input.columella) >= Math.PI / 2)
      throw new Error("A nasal rim requires positive dimensions and a finite base plane.");
    const count: number = 24;
    const order: number = 3;
    const points: N.Point[] = Array.from({ length: count }, (_: unknown, i: number): N.Point => {
      const t: number = 2 * Math.PI * i / count;
      const along: number = input.size[0] * input.halfWidth * Math.cos(t);
      const across: number = input.size[1] * input.halfWidth * Math.sin(t) * (1 + input.tear * Math.cos(t));
      const d: number = input.center[0] * input.tipLead - along * Math.cos(input.sweep) + across * Math.sin(input.sweep);
      const z: number = input.center[1] * input.halfWidth + along * Math.sin(input.sweep) + across * Math.cos(input.sweep);
      const y: number = input.base(z) + d * Math.tan(input.columella);
      return [input.face(y, input.side * z) + d, y, input.side * z];
    });
    const coefficients: number[] = [0, 1, 2].flatMap((axis: number): number[] => {
      const values: number[] = [points.reduce((sum: number, p: N.Point): number => sum + p[axis], 0) / count];
      for (let harmonic: number = 1; harmonic <= order; harmonic++) {
        let cos: number = 0;
        let sin: number = 0;
        points.forEach((p: N.Point, i: number): void => {
          const phase: number = 2 * Math.PI * harmonic * i / count;
          cos += 2 * p[axis] * Math.cos(phase) / count;
          sin += 2 * p[axis] * Math.sin(phase) / count;
        });
        values.push(cos, sin);
      }
      return values;
    });
    const evaluate = (phase: number, derivative: 0 | 1 | 2): N.Point => [0, 1, 2].map((axis: number): number => {
      const offset: number = axis * (2 * order + 1);
      let value: number = derivative === 0 ? coefficients[offset]! : 0;
      for (let harmonic: number = 1; harmonic <= order; harmonic++) {
        const cos: number = coefficients[offset + 2 * harmonic - 1]!;
        const sin: number = coefficients[offset + 2 * harmonic]!;
        const t: number = harmonic * phase;
        value += derivative === 0 ? cos * Math.cos(t) + sin * Math.sin(t)
          : derivative === 1 ? harmonic * (-cos * Math.sin(t) + sin * Math.cos(t))
          : -harmonic * harmonic * (cos * Math.cos(t) + sin * Math.sin(t));
      }
      return value;
    }) as N.Point;
    return { order, coefficients, point: (t: number): N.Point => evaluate(t, 0), first: (t: number): N.Point => evaluate(t, 1), second: (t: number): N.Point => evaluate(t, 2) };
  }
}
