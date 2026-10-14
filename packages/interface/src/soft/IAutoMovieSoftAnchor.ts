import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSoftAnchorBinding } from "./IAutoMovieSoftAnchorBinding";

/**
 * One particle held at a declared boundary position.
 *
 * @evidence contracts/common.md#principled-implementation The solver sets anchor inverse mass to zero and rewrites its target each fixed step; restConfiguration resolves named overrides before static positions or the particle's rest coordinate.
 * @evidence contracts/common.md#clear-and-simple-design Identity, particle index and target describe the static condition; optional binding identifies a moving owner resolved by the boundary-aware path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation requires binding and static position to be mutually exclusive. The static solver currently ignores binding metadata and uses static/rest targets; following the moving owner requires complete resolved boundaries, not an inferred scene or actor pose.
 * @evidence contracts/common.md#meaningful-documentation Comments state row-major indexing, world metres, null rest targets and the moving-frame exclusivity rule.
 * @author Samchon
 */
export interface IAutoMovieSoftAnchor {
  /** Stable anchor identity within the domain. */
  id: string;

  /** Row-major particle index; `0 <= particle < columns * rows`. */
  particle: number;

  /**
   * Where the anchor holds that particle in world space, or `null` to hold it exactly at its own rest position. `null` is the honest default: a seam that never moves should not have to restate a coordinate the rest mesh already carries, where a typo would silently pre-stretch the panel.
   */
  position: IAutoMovieVector3 | null;

  /**
   * Optional moving owner whose local point replaces the static position at each fixed-step boundary. When present, validation requires `position` to be null; the engine never silently combines the two frames.
   */
  binding?: IAutoMovieSoftAnchorBinding;
}
