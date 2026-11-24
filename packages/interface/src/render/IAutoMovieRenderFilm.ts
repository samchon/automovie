import type { IAutoMovieFilmOptics } from "../cinematics/IAutoMovieFilmOptics";
import type { IAutoMovieFilmShading } from "../cinematics/IAutoMovieFilmShading";

/**
 * The directly rendered film's camera response and indirect shading at its most
 * demanding second, as the render inventory prices the film stage's GPU targets
 * and the further passes it draws.
 *
 * A draw scene returns `optics` and `shading` per second, and the stage
 * allocates by what they ask for: the linear target, its depth and the glare
 * pyramid whenever there are optics, two sum targets when `samples` is set, the
 * occlusion targets with `occlusion`, the probe bake and its texture with
 * `probes`, and the medium's target when the scene carries a `medium`. The
 * caller supplies, for the shot measured, optics with the largest `samples` any
 * second sets and a `glare` if any second glares, and the shading whose members
 * are every member any second asks for, with the largest probe grid any second
 * bakes, so the budget holds at every second.
 *
 * `measureAutoMovieRenderFilmStage` in the engine reads it; it is not admitted
 * there, because the draw host admits each second's own values.
 */
export interface IAutoMovieRenderFilm {
  /** The optics of the most demanding second. */
  optics: IAutoMovieFilmOptics;

  /** The union of the shading every second asks for; absent asks for none. */
  shading?: IAutoMovieFilmShading;
}
