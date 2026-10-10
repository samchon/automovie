import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";

/**
 * Actual final parts and clothing coverage in their post-stitch vertex order.
 * The field's numbering follows the same retained vertices as every attribute.
 * @author Samchon
 */
export interface IHumanPersonBodyRegionParts {
  /** Final Body parts in the Person's shared frame, with its Body namespace. */
  parts: IAutoMovieModel["parts"];

  /** Rest coverage and source ordinals in each final mesh's retained vertex order. */
  garmentFields: ReadonlyMap<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>;
}
