import {
  IAutoMovieClip,
  IAutoMoviePropSpec,
  IAutoMovieStage,
} from "@automovie/interface";

/**
 * What one door-fixture compile varies.
 */
export interface IDoorShotProps {
  /** The clips the source authors, or omitted for a shot that authors none. */
  objectMotions?: readonly IAutoMovieClip[];

  /** One more staged piece, for a scenario about scene-node identity. */
  extraSet?: IAutoMovieStage["set"];

  /** The prop registry, defaulting to the one articulated door. */
  props?: readonly IAutoMoviePropSpec[];
}
