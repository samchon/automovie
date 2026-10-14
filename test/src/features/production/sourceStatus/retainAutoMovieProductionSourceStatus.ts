import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import { loadSourceModule } from "../../internal/loadSourceModule";
import type { ISourceStatusSnapshot } from "./ISourceStatusSnapshot";
import type { ISourceStatusEvaluation } from "./ISourceStatusEvaluation";
import { productionModule } from "./productionModule";

/**
 * Expose the same maintained retention function to portable status units.
 *
 * @evidence contracts/testing.md#behavioral-verification The existing loadSourceModule require hook returns the actual source export once at module initialization; later world.status calls provide the unchanged acquisition and evaluation callbacks.
 * @evidence contracts/testing.md#independent-expectations Retention/refusal/race units assert literal evaluation counts and answer/refusal populations from the retention contract, rather than treating this loader's result as an expected answer.
 * @evidence contracts/testing.md#distinguishing-cases The same loaded owner is used for successful reuse, changed inputs, missing snapshots, thrown evaluations and arranged concurrent reads; it supplies no alternate retention algorithm.
 * @evidence contracts/testing.md#execution-ownership Node's existing require cache owns the module identity and lifetime; no method replacement, host process or dynamically discovered case is introduced.
 */
export const { retainAutoMovieProductionSourceStatus }: {
  /** Actual retention export accepting the existing observation capabilities. */
  retainAutoMovieProductionSourceStatus(props: {
    /** Current snapshot acquisition callback over the requested document population. */
    acquire: (documents: readonly string[]) => ISourceStatusSnapshot | null;
    /** Current gate evaluation callback over this logical world. */
    evaluate: () => ISourceStatusEvaluation;
  }): () => IAutoMovieBuildProjectOutput;
} = loadSourceModule<{
  /** Actual retention export accepting the existing observation capabilities. */
  retainAutoMovieProductionSourceStatus(props: {
    /** Current snapshot acquisition callback over the requested document population. */
    acquire: (documents: readonly string[]) => ISourceStatusSnapshot | null;
    /** Current gate evaluation callback over this logical world. */
    evaluate: () => ISourceStatusEvaluation;
  }): () => IAutoMovieBuildProjectOutput;
}>(productionModule("retainAutoMovieProductionSourceStatus.ts"));
