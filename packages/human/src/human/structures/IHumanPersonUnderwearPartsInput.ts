import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";
import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";

/**
 * Final Person parts and explicitly registered Body skin material fields.
 * Source-owned region membership excludes face and internal anatomy parts.
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
