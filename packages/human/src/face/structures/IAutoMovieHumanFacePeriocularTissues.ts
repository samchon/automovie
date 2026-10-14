import type { AutoMovieHumanFacePeriocularTissue } from "./AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFacePeriocularTissueSection } from "./IAutoMovieHumanFacePeriocularTissueSection";

/**
 * Independently selected left and right periocular tissue dimensions.
 *
 * Omission of the whole document section expands the descriptor owner's
 * defaults only where a registered cage and generated optics are present.
 * An explicit sparse section is preserved, including an empty side; an
 * omitted tissue member in that section requests no shell.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFacePeriocularDefaults expands only whole-section omission on sides with cage/generated optics; supplied sparse side selections pass unchanged to the actual skin-attached tissue producer.
 * @evidence contracts/common.md#clear-and-simple-design Independent optional sides map the closed tissue vocabulary to canonical explicit section dimensions, separating selection from catalogue metadata and geometry admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty sides and omitted members are not silently refilled; whole-section defaults are qualified authored/measurement-site extensions, not universal patient anatomy or guaranteed fit.
 * @evidence contracts/common.md#meaningful-documentation Whole omission versus explicit sparse/empty selection and source availability explain the actual emission request.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This selection schema performs no default expansion or tissue traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared descriptor ownership belongs to the expander and generated band reuse to the builder.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Selected caller records acquire no tissue geometry or exterior queries.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularTissues {
  /** Anatomical left tissue dimensions. */
  left?: Partial<
    Record<
      AutoMovieHumanFacePeriocularTissue,
      IAutoMovieHumanFacePeriocularTissueSection
    >
  >;

  /** Anatomical right tissue dimensions. */
  right?: Partial<
    Record<
      AutoMovieHumanFacePeriocularTissue,
      IAutoMovieHumanFacePeriocularTissueSection
    >
  >;
}
