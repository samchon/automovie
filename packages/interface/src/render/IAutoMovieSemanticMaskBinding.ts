import type { IAutoMovieScene } from "../scene/IAutoMovieScene.js";
import type { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask.js";

/** A built scene and the palette its structural mask pass must paint it with. */
export interface IAutoMovieSemanticMaskBinding {
  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}
