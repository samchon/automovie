import type { IAutoMovieHumanSkinLandmark } from "@automovie/human";

import type { IHumanSourceHeadLandmark } from "./IHumanSourceHeadLandmark.ts";

/**
 * The head view's skin landmarks and the record of how each was chosen.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadLandmarks {
  /** Landmarks on the head view's skin surface, by name. */
  skinLandmarks: Record<string, IAutoMovieHumanSkinLandmark>;

  /** Selection records, written to the generation manifest. */
  records: IHumanSourceHeadLandmark[];
}
