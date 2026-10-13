import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/** A note pinned to one feature of the design. */
export interface IAutoMovieDrawingAnnotationSpec {
  /** Stable annotation identity within the view. */
  id: string;

  /** Note text, drawn as authored. */
  text: string;

  /** Feature the note is pinned to. */
  target: IAutoMovieDrawingFeature;
}
