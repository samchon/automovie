import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanDirection } from "./AutoMovieHumanDirection";
import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanRing } from "./IAutoMovieHumanRing";

/**
 * Where one part opens its ring at one site for one person: the site's definition resolved against the skeleton.
 *
 * A part generator places ring vertex `k` in the half-plane that the frame's normal axis bounds and `directions[k]` points into, at the distance its own cross-section gives, ideally on the cut plane through `frame.origin`. The other part of the site gets the same origin, reference and directions with the normal reversed, so the two rings pair by angle alone: vertex `k` of the proximal ring meets vertex `(count - k) % count` of the distal ring, both on the same anatomical ray.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanRingLayout {
  /** The site. */
  site: AutoMovieHumanJunctionSite;

  /** The side of a bilateral site, or null for the neck sites. */
  side: AutoMovieHumanSide | null;

  /** The part opening this ring. */
  part: AutoMovieHumanPart;

  /** Number of ring vertices. */
  count: number;

  /** Anatomical direction of vertex 0. */
  start: AutoMovieHumanDirection;

  /** The ring's frame, its normal pointing out of `part`. */
  frame: IAutoMovieHumanRing.IFrame;

  /**
   * Unit direction of each vertex from the origin, in the cut plane: `reference` turned counterclockwise about `normal` by `2πk / count`.
   */
  directions: IAutoMovieVector3[];
}
