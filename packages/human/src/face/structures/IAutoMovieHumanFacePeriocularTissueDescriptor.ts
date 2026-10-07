import type { AutoMovieHumanFacePeriocularTissue } from "./AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFacePeriocularScalarDescriptor } from "./IAutoMovieHumanFacePeriocularScalarDescriptor";

/**
 * Descriptor of one lid tissue's two authoring dimensions.
 *
 * `inwardOffset` is the distance the tissue's outer face keeps from the lid
 * skin; `thickness` is the tissue's own thickness. A numerical catalogue
 * reads these records to present defaults and envelopes with their grounds.
 *
 * @evidence contracts/common.md#principled-implementation One record per tissue mirrors the two fields of the authoring section it describes.
 * @evidence contracts/common.md#clear-and-simple-design A tissue identity and two scalar descriptors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Describes every tissue with the same shape.
 * @evidence contracts/common.md#meaningful-documentation States the meaning of both dimensions and the consumer.
 * @evidence contracts/modeling.md#parameter-channels Two independent absolute measurements per tissue; the stack they form is checked against the lid by the lid frame, not coupled here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names an existing tissue identity.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The scalar descriptor states the unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The scalar descriptors carry the grounds.
 * @evidenceExclude contracts/anatomy.md#permitted-range The lid frame owns admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The tissue section type owns the input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularTissueDescriptor {
  /** Tissue the two dimensions belong to. */
  tissue: AutoMovieHumanFacePeriocularTissue;

  /** Distance the tissue's outer face keeps from the lid skin. */
  inwardOffset: IAutoMovieHumanFacePeriocularScalarDescriptor;

  /** Thickness of the tissue. */
  thickness: IAutoMovieHumanFacePeriocularScalarDescriptor;
}
