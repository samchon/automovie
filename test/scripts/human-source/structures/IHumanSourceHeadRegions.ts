import type { IAutoMovieHumanSkinRegion } from "@automovie/human";

import type { IHumanSourceHeadRegion } from "./IHumanSourceHeadRegion.ts";

/**
 * The head view's skin regions and the record of how each was determined.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadRegions {
  /** Regions on the head view's skin surface, by name. */
  skinRegions: Record<string, IAutoMovieHumanSkinRegion>;

  /** Selection records, written to the generation manifest. */
  records: IHumanSourceHeadRegion[];
}
