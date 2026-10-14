import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { ISourceStatusSnapshot } from "./ISourceStatusSnapshot";
import type { ISourceStatusEvaluation } from "./ISourceStatusEvaluation";
import type { ISourceStatusState } from "./ISourceStatusState";

/**
 * Existing per-world ports used to arrange and observe source-status traces against the maintained retention function.
 *
 * @author Samchon
 */
export interface ISourceStatusWorld {
  /** Mutable semantic state shared with the owning unit's arrangements. */
  state: ISourceStatusState;

  /** Counts actual capability invocations, never inferred elapsed time. */
  counts: {
    /** Actual evaluation capability invocation count. */
    evaluations: number;

    /** Actual acquisition capability invocation count. */
    acquisitions: number;
  };

  /** Existing deterministic arrangement hooks; no global or foreign method is replaced. */
  hooks: {
    /** Runs before snapshot admission, after acquisition count advances. */
    acquire: () => void;

    /** Receives the assembled snapshot before the acquisition returns. */
    snapshot: (snapshot: ISourceStatusSnapshot) => void;

    /** Runs after evaluation count advances and before document reads. */
    beforeRead: () => void;

    /** Runs immediately before each indexed document observation. */
    read: (index: number) => void;

    /** Runs after all requested document observations. */
    afterRead: () => void;

    /** Receives the actual constructed answer before the final hook. */
    output: (output: IAutoMovieBuildProjectOutput) => void;

    /** Runs after the output hook and before the evaluation returns. */
    afterAnswer: () => void;
  };

  /** Captures the current logical observations; incomplete state yields null. */
  acquire: (documents: readonly string[]) => ISourceStatusSnapshot | null;

  /** Evaluates the existing in-memory semantic state and returns its read trace. */
  evaluate: () => ISourceStatusEvaluation;

  /** Supplies the real maintained retention function with these capabilities. */
  status: () => (() => IAutoMovieBuildProjectOutput);

  /** Records the current source as compiled and advances the logical revision. */
  compile: () => void;
}
