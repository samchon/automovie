import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";

/**
 * One actual ribbon or terminal-shaft mesh in the person's shared metre frame.
 *
 * @evidence contracts/common.md#principled-implementation Readonly coordinates and their indexed faces retain the producer's actual mesh without authoring a substitute surface.
 * @evidence contracts/common.md#clear-and-simple-design The coordinate and triangle populations travel together to the one body-contact consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries produced geometry rather than expected contact results or subject-specific vertices.
 * @evidence contracts/common.md#meaningful-documentation The fields identify placement stage, coordinate layout and aligned face population.
 * @evidence contracts/modeling.md#spatial-conventions Flat XYZ positions are metres in the person frame; indices are dimensionless references into that population.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The face producer owns strand or card identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record transports geometry and defines no authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The producer determines the mesh population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The person contact stage owns the hair-to-body clearance.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact consumer observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The producer owns the biological meaning of its supplied geometry.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits no biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is internal transport rather than a numerical authoring input.
 *
 * @author Samchon
 */
export interface IHumanPersonHairContactMesh {
  /** Flat XYZ vertices after head placement, before body contact. */
  readonly positions: readonly number[];

  /** Oriented triangle indices into the same vertex population. */
  readonly indices: readonly number[];

  /**
   * Geometry-owned actual station membership and this part's requested gap.
   * Omission retains the legacy ribbon-only interpretation; a terminal shaft
   * must carry its producer's layout instead of being interpreted as pairs.
   */
  readonly layout?: IHumanFaceHairContactLayout;
}
