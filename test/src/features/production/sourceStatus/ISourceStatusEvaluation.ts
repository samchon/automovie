import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { ISourceStatusEntry } from "./ISourceStatusEntry";

/**
 * One actual gate answer, its ordered document-read observations and its declared module/revision dependencies.
 *
 * @author Samchon
 */
export interface ISourceStatusEvaluation {
  /** The answer produced by this capability, passed to the real retention owner. */
output: IAutoMovieBuildProjectOutput;

  /** Ordered document observations; repeated reads remain visible during evaluation. */
documents: ISourceStatusEntry[];

  /** Executed-module names outside the fixture's declared fingerprint closure. */
undeclaredModules: string[];

  /** Whether the answer reports dependence on its logical revision. */
revisionBound: boolean;
}
