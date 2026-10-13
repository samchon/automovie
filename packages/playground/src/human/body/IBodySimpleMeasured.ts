import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * The last simple projection, unrounded and paired with the exact body it read.
 *
 * @author Samchon
 */
export interface IBodySimpleMeasured {
  /** The body read. */
  shape: IBodySimpleBody;

  /** Its simple values. */
  values: IAutoMovieHumanBodySimpleShape;
}
