import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Completed surface-boundary stem offered to the guide hierarchy's placer.
 * The metric walker supplies this derived value only after the stem reaches
 * full free clearance. Placement may consume it without restarting the walk;
 * rejection continues that same state and budget. This is a numerical surface
 * proxy, not a buried follicle or a personal authoring input.
 *
 * @evidence contracts/common.md#principled-implementation Actual travelled metric and the target lock length remain distinct while the first full-clearance index identifies which prefix geometry a placement must preserve.
 * @evidence contracts/common.md#clear-and-simple-design One immutable-view handoff separates a completed boundary stem from a complete curve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The walker derives the same handoff for every root without personal vertices or stored corrections.
 * @evidence contracts/common.md#meaningful-documentation Explains handoff timing, rejection continuity, units and the boundary proxy's anatomical limitation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It transports numerical state and defines no displayed identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels It exposes derived state, not a styling control.
 * @evidence contracts/modeling.md#emitted-geometry It carries the actual retained stem stations and their boundary index, without resampling.
 * @evidence contracts/modeling.md#spatial-conventions Stations and metrics are current head-frame metres; normal is a unit direction.
 * @evidence contracts/modeling.md#shared-boundaries The walker supplies the same skin-certified stem that placement and meshing must preserve.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is a transport value; the assembled builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value or buried tissue claim.
 * @evidenceExclude contracts/anatomy.md#permitted-range It describes numerical state rather than clinical bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is a derived consumer handoff, never a personal curve input.
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

  /** Free fibre-path clearance, including the existing rounding allowance. */
  clearance: number;

  /** Original current root triangle's outward unit normal. */
  normal: IAutoMovieVector3;
}
