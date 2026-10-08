import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceBrowMaterialReference } from "./IHumanSourceBrowMaterialReference.ts";

/** Actual source and completed consumer references for material support.
 * This source preparation record adds no personal vertex authoring input.
 * @author Samchon
 */
export interface IHumanSourceBrowMaterialSupportInput {
  /** Caller-owned parsed source whose metadata is compiled in place. */
  basis: IAutoMovieHumanFaceBasis;

  /** Bootstrap and requested profiles with their actual shape-only references. */
  references: readonly IHumanSourceBrowMaterialReference[];
}
