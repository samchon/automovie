import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * One crown's place on its dental arch: the cervical ring it opens through,
 * expressed in the arch frame that owns the lining around it.
 *
 * Coordinates are arch-frame metres `(u, v, a)`: lateral toward the
 * anatomical left, anterior, and apical (away from the crown, so superior on
 * the maxilla and inferior on the mandible). The station carries no tooth long
 * axis: the source registers none, and a ring's plane is no measured axis.
 *
 * @author Samchon
 */
export interface IHumanFaceOralToothStation {
  /** Permanent ISO quadrant and position of the crown. */
  id: IAutoMovieHumanFaceOralCrownSupport["id"];

  /** Mean of the cervical ring in arch-frame metres `(u, v, a)`. */
  centre: number[];

  /** Cervical ring vertices as flat `(u, v, a)` triples, in the crown's cervical order. */
  cervical: number[];

  /** Native dental ordinals of those ring vertices, aligned with `cervical`. */
  vertices: number[];
}
