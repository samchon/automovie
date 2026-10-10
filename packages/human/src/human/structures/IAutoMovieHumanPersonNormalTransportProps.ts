import type { IAutoMovieHumanPersonNormalTransportPlan } from "./IAutoMovieHumanPersonNormalTransportPlan";
import type { IAutoMovieHumanPersonReferenceNormalField } from "./IAutoMovieHumanPersonReferenceNormalField";
import type { IAutoMovieHumanPersonSourceCellEvaluationProps } from "./IAutoMovieHumanPersonSourceCellEvaluationProps";

/**
 * What building fixed source-cell normal transport reads: the performed-cell
 * evaluation context without its input, the admitted transport plan, the
 * ancestral field builder over reference parent areas, and a sample's
 * weighted-key identity under a parent.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportProps {
  /** Performed-cell evaluation context, without the per-call input. */
  evaluation: Omit<IAutoMovieHumanPersonSourceCellEvaluationProps, "input">;

  /** The admitted fixed normal transport. */
  transport: IAutoMovieHumanPersonNormalTransportPlan;

  /**
   * Build the ancestral field from reference parent area vectors.
   */
  referenceField: (
    parentAreas: readonly number[],
  ) => IAutoMovieHumanPersonReferenceNormalField;

  /**
   * Weighted-key identity of a sample under a parent.
   */
  identity: (sample: number, parent: number) => string;
}
