import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";

/**
 * What admitting one performed pair of complementary source skins reads: the
 * admitted partition plan, the face and body triangle indices it was compiled
 * for, and the performed skin to evaluate.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellEvaluationProps {
  /** The admitted source partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** Face skin triangle vertex index triples. */
  faceIndices: readonly number[];

  /** Body skin triangle vertex index triples retained by the cut. */
  bodyIndices: readonly number[];

  /** The performed skin to evaluate. */
  input: IAutoMovieHumanPersonPerformedSkin;
}
