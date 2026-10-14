import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry.js";

/**
 * Rigid prototype geometry with the cycle baked after its rest-space extraction.
 * An adopted rigid object has a null cycle; a generated model may also return
 * null when no bake was requested or its source supplies no gait or skeleton.
 *
 * @evidence contracts/common.md#principled-implementation Extends rigid rest geometry with an optional per-part motion repertoire baked after extraction; null explicitly represents static output without pretending absent gait data is an empty animated table.
 * @evidence contracts/common.md#clear-and-simple-design The generic Cycle parameter lets adopted rigid objects promise null while generated animated entries retain their actual cycle representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No synthetic gait is created for missing skeleton, missing repertoire or an unrequested bake; each static cause remains represented by null.
 * @evidence contracts/common.md#meaningful-documentation Explains rest extraction before motion baking and the supported reasons a cycle is absent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This composite result shape chooses no tessellation, merge or bake strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared representation references are values; their producer/runtime decides reuse across chunks and tiers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Geometry/material ownership follows the inherited representation and cycle texture lifetime follows its owning formation representation.
 *
 * @author Samchon
 */
export interface IAutoMovieInstancedModelRepresentation<
  Cycle extends IAutoMovieFormationCycle | null =
    IAutoMovieFormationCycle | null,
> extends IAutoMovieInstancedGeometry {
  /** Baked rigid-part matrix table, or null for the static representation. */
  cycle: Cycle;
}
