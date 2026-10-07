/**
 * The contact correction applied to one resident soft surface. Counts follow
 * welded vertices rather than duplicated material corners, and depth reports
 * the deepest penetration before restoring the declared rest-clearance floor.
 * A count does not certify whole-surface intersection or visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the contact owner's actual surface identity, welded count and measured penetration.
 * @evidence contracts/common.md#clear-and-simple-design One per-surface correction result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reported quantities do not substitute for geometry admission.
 * @evidence contracts/common.md#meaningful-documentation States population, measurement timing and limits.
 * @evidence contracts/modeling.md#spatial-conventions Maximum depth is metres; vertex count is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The result names an existing surface, not a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The result moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The result emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Contact constructs the boundary, not this report.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner observes the corrected surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contact states its tissue-floor source and convention.
 * @evidenceExclude contracts/anatomy.md#permitted-range Contact enforces its correction budget.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The result is output, not an authoring control.
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
