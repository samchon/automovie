import type { IAutoMovieHumanBodyEndpointSource } from "./IAutoMovieHumanBodyEndpointSource";
import type { IHumanBodyConstructionProgress } from "./IHumanBodyConstructionProgress";

/**
 * Constructor options of `createHumanBodyBasisBuilder`.
 *
 * Omitting the object or its field preserves the existing model and its
 * metadata absence. Physical-source registration changes no coordinates and
 * supplies no clinical tissue certification.
 *
 * @evidence contracts/common.md#principled-implementation Optional progress observation, physical incidence mode and exact external endpoint provenance configure basis compilation.
 * @evidence contracts/common.md#clear-and-simple-design Each option names one constructor responsibility rather than a per-consumer workaround.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical registration changes no coordinates or clinical qualification and endpoint provenance cannot authorize missing rows.
 * @evidence contracts/common.md#meaningful-documentation Members state synchronous observer failure, incidence timing and exact source coherence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The body compiler options is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The body compiler options coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The body compiler options type itself acquires no retained runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisBuilderOptions {
  /**
   * Completed construction boundaries; synchronous observer failures abort the original call.
   *
   * @evidence contracts/common.md#principled-implementation A synchronous observer receives actual completed construction boundaries, and its exception aborts the original operation.
   * @evidence contracts/common.md#clear-and-simple-design Observation belongs to the constructor options instead of being embedded into geometry or solver decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress packets supply no acceptance verdict and cannot alter the source computation through a test-only hook.
   * @evidence contracts/common.md#meaningful-documentation The property states completed-boundary timing and observer exception effects.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The construction boundary observer defines a signature rather than an executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The construction boundary observer signature implements no cache or coordination policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The construction boundary observer declaration acquires no tasks, handles or retained buffers.
   */
  observeProgress?: (progress: IHumanBodyConstructionProgress) => void;

  /**
   * Physical incidence authority registered before UV gathering: the basis's
   * native indexed incidence, or its declared canonical source partition.
   */
  physicalSource?: "native-indexed" | "source-partition";

  /** Actual same-generation head source carrying body endpoint contributions.
   * The builder verifies body equality, both source partitions and each actual
   * driver row. This is source geometry, never permission to accept missing rows.
   */
  endpointSource?: IAutoMovieHumanBodyEndpointSource;
}
