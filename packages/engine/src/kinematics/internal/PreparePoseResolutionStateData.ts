import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

export namespace PreparePoseResolutionStateData {
  /*
   * Private identity operands; no returned transform aliases them.
   */
  export const IDENTITY: IAutoMovieQuaternion = AutoMovieEngineQuaternion.identity();

  /*
   * Private root-relative origin.
   */
  export const ORIGIN: IAutoMovieVector3 = AutoMovieEngineVector3.create();
}
