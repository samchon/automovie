import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSoftAnchorBinding } from "./IAutoMovieSoftAnchorBinding";

/** One particle held at a stated place. */
export interface IAutoMovieSoftAnchor {
  /** Stable anchor identity within the domain. */
  id: string;

  /** Row-major particle index; `0 <= particle < columns * rows`. */
  particle: number;

  /**
   * Where the anchor holds that particle in world space, or `null` to hold it
   * exactly at its own rest position. `null` is the honest default: a seam that
   * never moves should not have to restate a coordinate the rest mesh already
   * carries, where a typo would silently pre-stretch the panel.
   */
  position: IAutoMovieVector3 | null;

  /**
   * Optional moving owner whose local point replaces the static position at
   * each fixed-step boundary. When present, validation requires `position` to
   * be null; the engine never silently combines the two frames.
   */
  binding?: IAutoMovieSoftAnchorBinding;
}
