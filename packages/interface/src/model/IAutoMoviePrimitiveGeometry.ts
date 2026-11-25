import type { IAutoMoviePrimitiveShape } from "./IAutoMoviePrimitiveShape";

/** Geometry generated from one compact primitive shape recipe. */
export interface IAutoMoviePrimitiveGeometry {
  /** Discriminator. */
  type: "primitive";

  /** The parametric shape and its dimensions. */
  shape: IAutoMoviePrimitiveShape;
}
