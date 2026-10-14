import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Completed surface-boundary stem offered to the guide hierarchy's placer. The metric walker supplies this derived value only after the stem reaches full free clearance. Placement may consume it without restarting the walk; rejection continues that same state and budget. This is a numerical surface proxy, not a buried follicle or a personal authoring input.
 *
 * @evidence contracts/common.md#principled-implementation A completed stem handoff preserves travelled metric and its full-clearance terminal station, allowing placement rejection to continue the same walk budget.
 * @evidence contracts/common.md#clear-and-simple-design The transition bundles only the existing walk state needed by the guide placer instead of restarting integration or exposing authored strand vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numerical surface proxy is explicitly distinguished from a buried follicle; placement does not substitute a fresh walk after refusal.
 * @evidence contracts/common.md#meaningful-documentation Fields document metre quantities, the current host shading normal, first-clearance terminal index and target length including the existing stem.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handoff record selects no search algorithm; the walker and placer own how many stations and candidate directions are processed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The existing stem stations and spent metric are reusable within the same walk, with no promise of equivalence across source surfaces or locks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly stem stations are retained by the ongoing integration handoff; their population is the already generated transition length.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairRootedTransition {
  /** Root and all actual stem stations, through the first full-clearance row. */
  points: readonly IAutoMovieVector3[];

  /** First full-clearance station; equals points.length-1 in this handoff. */
  freeFrom: number;

  /** Actual stem metric already spent, in metres. */
  travelled: number;

  /** Target total metric, including this stem, in metres. */
  targetLength: number;

  /** Free-station threshold in metres, including half-step, requested gap, any shaft radius and the remaining rounding allowance. */
  clearance: number;

  /** Current skin host's outward unit shading normal at the root, including its triangle-plane fallback. */
  normal: IAutoMovieVector3;
}
