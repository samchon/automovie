/**
 * The contact correction applied to one resident soft surface. Counts follow
 * welded vertices rather than duplicated material corners, and depth reports
 * the deepest penetration before restoring the declared rest-clearance floor.
 * A count does not certify whole-surface intersection or visual acceptance.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactResolutionSummary {
  /** Existing soft basis surface identity. */
  surface: string;

  /** Welded vertices corrected on that surface. */
  vertices: number;

  /** Largest pre-correction penetration found, metres. */
  maxDepthMetres: number;
}
