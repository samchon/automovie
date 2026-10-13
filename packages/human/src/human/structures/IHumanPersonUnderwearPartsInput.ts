import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";
import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";

/**
 * Final Person parts and explicitly registered Body skin material fields. Source-owned region membership excludes face and internal anatomy parts.
 *
 * @evidence contracts/common.md#principled-implementation Explicit final body region membership connects rest coverage to final parts without treating face or internal tissue as garment skin.
 * @evidence contracts/common.md#clear-and-simple-design Parts, optional garment recipe and registered fields are the complete inputs of the final material composition stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact IDs come from the body composition owner instead of guessing body membership from an arbitrary part name.
 * @evidence contracts/common.md#meaningful-documentation Comments state retained local transforms, absence of garment behavior and exact per-part source registration.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The material composition input chooses no splitting strategy; the underwear material owner performs field cuts and lifting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registered coverage fields are supplied completed work, while this type defines no cross-call equivalence or cache invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Part arrays and coverage maps are borrowed inputs; emitted garment meshes are owned by the composition result.
 *
 * @author Samchon
 */
export interface IHumanPersonUnderwearPartsInput {
  /** Final Person parts after placement and source/layer readings, retaining local transforms. */
  parts: IAutoMovieModel["parts"];

  /** Admitted material and rest coverage; omission returns the same final part population. */
  garment?: IAutoMovieHumanBodyUnderwearParts;

  /** Exact final part ids supplied by the owning Body composition loop. */
  regions: ReadonlyMap<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>;
}
