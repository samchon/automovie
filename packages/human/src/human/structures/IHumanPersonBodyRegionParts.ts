import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";

/**
 * Actual final parts and clothing coverage in their post-stitch vertex order. The field's numbering follows the same retained vertices as every attribute.
 *
 * @evidence contracts/common.md#principled-implementation Garment scalar fields and source ordinals parallel the retained vertices of final stitched parts, preserving rest attachment through compaction.
 * @evidence contracts/common.md#clear-and-simple-design Final parts and their per-part garment fields travel together so material composition cannot silently reuse pre-stitch numbering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage follows actual retained source stencils rather than a positional heuristic that reattaches fabric after posing.
 * @evidence contracts/common.md#meaningful-documentation The declaration states the body namespace and that coverage fields use final retained vertex order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result chooses no clipping or compaction method; body-region construction owns those transformations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Per-part material fields are results for one construction, with no cross-generation equivalence cache in the type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Arrays and maps have the lifetime of this returned construction; no GPU object or external resource is owned here.
 *
 * @author Samchon
 */
export interface IHumanPersonBodyRegionParts {
  /** Final Body parts in the Person's shared frame, with its Body namespace. */
  parts: IAutoMovieModel["parts"];

  /** Rest coverage and source ordinals in each final mesh's retained vertex order. */
  garmentFields: ReadonlyMap<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>;
}
