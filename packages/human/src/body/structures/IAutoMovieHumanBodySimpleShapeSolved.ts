import type { IAutoMovieHumanBodySimpleShapeSolvedMass } from "./IAutoMovieHumanBodySimpleShapeSolvedMass";

/**
 * The parameters the simple tier solves by measurement: the stature channel
 * and the mass direction.
 *
 * @evidence contracts/common.md#principled-implementation A stature channel and mass direction identify the coordinates whose actual readings the simple tier inverts.
 * @evidence contracts/common.md#clear-and-simple-design The table keeps measurement-solved parameters apart from directly expanded term rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The named channels depend on the admitted basis and supply no requested answer.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the stature coordinate from the coupled mass direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measurement-solved parameter bindings definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measurement-solved parameter bindings type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The measurement-solved parameter bindings declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSolved {
  /** The body channel stature is solved along. */
  stature: string;

  /** The mass direction. */
  mass: IAutoMovieHumanBodySimpleShapeSolvedMass;
}
