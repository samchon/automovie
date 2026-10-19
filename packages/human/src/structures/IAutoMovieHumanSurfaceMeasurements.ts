/**
 * Physical targets of the generated neutral T-rest surface, in millimetres.
 * These are additional observations, not an automatic conversion of hanging-arm
 * clinical dimensions. One document records its own acquisition qualification.
 * Missing regions remain explicitly open in the generated partial surface.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSurfaceMeasurements {
  /** Current physical-document version. */
  version: 1;

  /** Measured T-rest observations or an explicitly authored engineering probe. */
  qualification: "measured-neutral-T" | "authored-convention";

  /** Horizontal trunk stations; omitted means that this chart has no surface. */
  trunk?: {
    /** Chest-apex plane in the shared standing-surface datum. */
    chest: IAutoMovieHumanSurfaceMeasurements.Section;

    /** Natural-waist plane, distinct from a navel section. */
    waist: IAutoMovieHumanSurfaceMeasurements.Section;

    /** Maximum-buttock plane; its height is independently supplied. */
    buttock: IAutoMovieHumanSurfaceMeasurements.Section;
  };
}

/** Named observations of one common physical surface definition. */
export namespace IAutoMovieHumanSurfaceMeasurements {
  /**
   * A convex enclosing section in a horizontal plane of the neutral T-rest.
   * Breadth, depth and convex-tape perimeter are independent targets. The
   * symmetric family currently has no independently located paired masses,
   * recesses or left/right envelope asymmetry.
   *
   * @author Samchon
   */
  export interface Section {
    /** Height above the shared standing surface, in millimetres. */
    heightMm: number;

    /** Uncompressed transverse skin-envelope breadth, in millimetres. */
    breadthMm: number;

    /** Anterior-to-posterior skin-envelope depth, in millimetres. */
    depthMm: number;

    /** Convex-tape perimeter at this plane, in millimetres. */
    perimeterMm: number;

    /** Fraction of depth anterior to the shared skeletal support axis, in (0,1). */
    anteriorFraction: number;
  }
}
