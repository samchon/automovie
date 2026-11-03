/**
 * How finely the leg's sections are sampled, shared by every piece that reads
 * or writes a leg ring: the number of control points of a section, the
 * uniform phases of its rings and the samples of a neighbour's ring arc.
 */
export namespace AutoMovieHumanLegSampling {
  /** Control points of a leg section: the tube's eight sectors of 33 knot spans. */
  export const ORDER: number = 264;

  /** Uniform phases of a leg ring. */
  export const SAMPLES: number = 264;

  /** Samples of a neighbour's ring arc. */
  export const RING: number = 512;

  /** Uniform phases of the radial tables, radians, one per control point. */
  export const PHASES: number[] = Array.from({ length: ORDER }, (_: unknown, j: number): number => (2 * Math.PI * j) / ORDER);
}
