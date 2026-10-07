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
 * @evidence contracts/common.md#principled-implementation A crown meets its lining only through its cervical ring, so the ring in arch coordinates is the whole of what the lining needs from a tooth.
 * @evidence contracts/common.md#clear-and-simple-design Identity, centre and ring are the three facts the arch frame's consumers read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps native ordinals as identity and infers no clinical axis or margin.
 * @evidence contracts/common.md#meaningful-documentation States frame, units, sign of the apical axis and the absent long axis.
 * @evidence contracts/modeling.md#part-identity-and-grouping One station per registered crown, grouped and ordered by its arch frame.
 * @evidence contracts/modeling.md#spatial-conventions Arch-frame metres with apical positive in both arches.
 * @evidence contracts/modeling.md#shared-boundaries The ring is the boundary crown and gingiva share; its native ordinals stay the shared identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the joined arch.
 * @evidence contracts/anatomy.md#anatomical-source The ring is the licensed source's open crown root, a source port and not a measured cemento-enamel junction.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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
