import type { IAutoMovieHumanSkinRegion } from "@automovie/human/common/basis/IAutoMovieHumanSkinRegion";

import type { IHumanSourceHeadSampleSelection } from "./IHumanSourceHeadSampleSelection.ts";

/**
 * Report-only sparse skin regions and their selection provenance.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadSampleSelections {
  /** Explicit sample sets, never filled areas or ordered boundary loops. */
  skinRegions: Record<string, IAutoMovieHumanSkinRegion>;

  /** Qualification written separately from filled head-region records. */
  records: IHumanSourceHeadSampleSelection[];
}
