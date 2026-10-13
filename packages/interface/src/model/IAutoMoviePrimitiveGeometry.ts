import { AutoMoviePrimitiveShape } from "./AutoMoviePrimitiveShape";

/** Geometry defined by a parametric primitive shape. */
export interface IAutoMoviePrimitiveGeometry {
  /** Discriminator. */
  type: "primitive";

  /** The parametric shape and its dimensions. */
  shape: AutoMoviePrimitiveShape;
}
