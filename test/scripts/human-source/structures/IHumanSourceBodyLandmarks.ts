import type { IAutoMovieHumanSkinLandmark } from "@automovie/human";

import type { IHumanSourceBodyLandmark } from "./IHumanSourceBodyLandmark.ts";

/**
 * The body view's skin landmarks and the record of how each was determined.
 *
 * @author Samchon
 */
export interface IHumanSourceBodyLandmarks {
  /** Landmarks on the body view's skin surface, by name. */
  skinLandmarks: Record<string, IAutoMovieHumanSkinLandmark>;

  /** Determination records, written to the generation manifest. */
  records: IHumanSourceBodyLandmark[];
}
