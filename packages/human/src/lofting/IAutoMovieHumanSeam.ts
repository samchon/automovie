/**
 * A declared seam between two pieces of a divided part, as data.
 *
 * Divide and conquer builds every piece in its own frame by its own rule; the
 * pieces merge only at declared seams. Each seam has one owner, which
 * evaluates the shared curve and publishes its jet (see
 * `AutoMovieHumanSeam`), and one neighbour, which converts that jet to its
 * own parameter and copies it. The declaration is what a seam observer reads:
 * it measures gap, normal angle and normal-curvature jump on the emitted skin
 * across `curve`, in the plane normal to the seam's tangent, against
 * `continuity`.
 *
 * - G0: both pieces pass through the same points.
 * - G1: they also share the tangent plane (for a curve, the tangent line).
 * - G2: they also share the normal curvature across the seam (for a curve,
 *   the curvature vector).
 *
 * A relief window needs no declaration: its height, slope and curvature
 * vanish at the window's edge by construction (`IAutoMovieLoftRelief`).
 */
export interface IAutoMovieHumanSeam {
  /** Seam identity in findings, such as `hand.web-2` or `head.face/P`. */
  name: string;

  /** Piece that evaluates the shared curve and publishes its jet. */
  owner: string;

  /** Piece that copies the owner's jet. */
  neighbour: string;

  /**
   * Address of the shared curve: a principal section `<chain>/<k>`, a guide
   * `<chain>/g<j>`, a root loop or another named curve its readers resolve.
   */
  curve: string;

  /** Order of contact the neighbour must reach. */
  continuity: IAutoMovieHumanSeam.Continuity;
}
export namespace IAutoMovieHumanSeam {
  /** Order of geometric contact across a seam. */
  export type Continuity = "G0" | "G1" | "G2";

  /**
   * A curve's jet by arclength, the form an owner publishes (rule J1): free of
   * the owner's parameter, so a neighbour of any parameter speed can copy it.
   * Vectors share the owner's frame and may have any dimension (a section's
   * `(x, z)` or the world's `(x, y, z)`).
   */
  export interface IArcJet {
    /** Point, mm. */
    point: number[];

    /** Unit tangent along increasing arclength. */
    tangent: number[];

    /** Curvature vector `kappa N`, perpendicular to the tangent, 1/mm. */
    curvature: number[];
  }

  /**
   * A surface's parametric 2-jet at one point of a seam (rules J4 and J5),
   * world millimetres. `along` runs with the seam's parameter, `across` leaves
   * the seam away from the owner, into the neighbour; `twist` is the mixed
   * derivative, which a corner's owner publishes so both pieces meeting there
   * agree on it.
   */
  export interface ISurfaceJet {
    /** Point on the seam, mm. */
    point: number[];

    /** First derivative along the seam. */
    along: number[];

    /** Second derivative along the seam. */
    alongSecond: number[];

    /** First derivative across the seam, away from the owner. */
    across: number[];

    /** Second derivative across the seam. */
    acrossSecond: number[];

    /** Mixed derivative along and across. */
    twist: number[];
  }
}
