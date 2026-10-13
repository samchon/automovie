import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";

/**
 * One crown's place on its dental arch: the cervical ring it opens through, expressed in the arch frame that owns the lining around it.
 *
 * Coordinates are arch-frame metres `(u, v, a)`: lateral toward the anatomical left, anterior, and apical (away from the crown, so superior on the maxilla and inferior on the mandible). The station carries no tooth long axis: the source registers none, and a ring's plane is no measured axis.
 *
 * @evidence contracts/common.md#principled-implementation ISO-ordered crown stations retain cervical geometry and original dental ordinals in the resolved arch frame.
 * @evidence contracts/common.md#clear-and-simple-design One station supplies ring distance, local cervical height and lining frame correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source ring's plane is not a registered tooth long axis or clinical CEJ measurement.
 * @evidence contracts/common.md#meaningful-documentation u/v/a are lateral, anterior and apical metres, with apical sign differing between arches.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Coordinate lowering executes in resolveHumanFaceOralArchFrame and distance readers traverse these arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same station/ring data serve field and assembly rather than separately estimated crown heights.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resolver owns station coordinate/id arrays retained through the arch field's construction lifetime.
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
