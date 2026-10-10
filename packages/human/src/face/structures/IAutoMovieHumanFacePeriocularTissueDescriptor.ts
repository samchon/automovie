import type { AutoMovieHumanFacePeriocularTissue } from "./AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFacePeriocularScalarDescriptor } from "./IAutoMovieHumanFacePeriocularScalarDescriptor";

/**
 * Descriptor of one lid tissue's two authoring dimensions.
 *
 * `inwardOffset` is the distance the tissue's outer face keeps from the lid
 * skin; `thickness` is the tissue's own thickness. A numerical catalogue
 * reads these records to present defaults and envelopes with their grounds.
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
