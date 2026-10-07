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
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularTissues {
  /** Anatomical left tissue dimensions. */
  left?: Partial<Record<AutoMovieHumanFacePeriocularTissue, IAutoMovieHumanFacePeriocularTissueSection>>;
  /** Anatomical right tissue dimensions. */
  right?: Partial<Record<AutoMovieHumanFacePeriocularTissue, IAutoMovieHumanFacePeriocularTissueSection>>;
}
