import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * The last simple projection, unrounded and paired with the exact body it read.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Keeps the projection shown with the body it belongs to.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Pairs simple values with their body key.
 * @author Samchon
 */
export interface IBodySimpleMeasured {
  /** The body read. */
  shape: IBodySimpleBody;

  /** Its simple values. */
  values: IAutoMovieHumanBodySimpleShape;
}
