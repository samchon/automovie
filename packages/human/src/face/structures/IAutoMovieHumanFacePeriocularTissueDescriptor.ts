import type { AutoMovieHumanFacePeriocularTissue } from "./AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFacePeriocularScalarDescriptor } from "./IAutoMovieHumanFacePeriocularScalarDescriptor";

/**
 * Descriptor of one lid tissue's two authoring dimensions.
 *
 * `inwardOffset` is the distance the tissue's outer face keeps from the lid
 * skin; `thickness` is the tissue's own thickness. A numerical catalogue
 * reads these records to present defaults and envelopes with their grounds.
 *
 * @evidence contracts/common.md#principled-implementation One canonical tissue identity pairs independent skin-to-outer-face offset and shell thickness descriptors, preserving each scalar's measured-site/derived/authored ground.
 * @evidence contracts/common.md#clear-and-simple-design Two canonical scalar descriptors separate geometric depth from material thickness instead of exposing one undifferentiated lid-depth slider.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catalogue's cross-site stack and lower-lid extensions are qualified authored conventions; descriptor metadata neither supplies an individual's histology nor guarantees the current lid can contain a requested stack.
 * @evidence contracts/common.md#meaningful-documentation The two dimension meanings and canonical source-ground owner identify how default expansion and editor envelopes differ from physical admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This metadata aggregate implements no stack arithmetic or mesh construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared catalogue ownership introduces no evaluated-shell cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Nested scalar metadata creates no tissue buffers or imaging resources.
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
