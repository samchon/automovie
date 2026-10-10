import type { IAutoMovieHumanBodyEndpointSource } from "./IAutoMovieHumanBodyEndpointSource";
import type { IHumanBodyConstructionProgress } from "./IHumanBodyConstructionProgress";

/**
 * Constructor options of `createHumanBodyBasisBuilder`.
 *
 * Omitting the object or its field preserves the existing model and its
 * metadata absence. Physical-source registration changes no coordinates and
 * supplies no clinical tissue certification.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisBuilderOptions {
  /** Completed construction boundaries; synchronous observer failures abort the original call. */
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
