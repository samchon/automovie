import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Current neutral-frame inputs to the shared static hair direction field.
 * The admitted layer owns styling values; contact remains with the integrator.
 *
 * @author Samchon
 */
export interface IHumanFaceHairDirectionInput {
  /** Admitted styling layer, with metre lengths and radian angles. */
  layer: IAutoMovieHumanFaceHair.Layer;
  /** Neutral head-frame root position, metres. */
  root: IAutoMovieVector3;
  /** Current unit outward host normal. */
  normal: IAutoMovieVector3;
  /** Accumulated centreline arc length, metres. */
  distance: number;
  /** Seeded curl phase, radians. */
  phase: number;
}
