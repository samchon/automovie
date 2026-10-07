import type { IAutoMovieHumanBodyEndpointSource } from "./IAutoMovieHumanBodyEndpointSource";
import type { IHumanBodyConstructionProgress } from "./IHumanBodyConstructionProgress";

/**
 * Constructor options of `createHumanBodyBasisBuilder`.
 *
 * Omitting the object or its field preserves the existing model and its
 * metadata absence. Physical-source registration changes no coordinates and
 * supplies no clinical tissue certification.
 *
 * @evidence contracts/common.md#principled-implementation Supplies actual topology or cross-partition source ownership without altering geometry evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Named constructor inputs are admitted exactly and their owners validate the source records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration never infers incidence from contact or substitutes an empty endpoint for external geometry.
 * @evidence contracts/common.md#meaningful-documentation States source equality, omission and the separate physical admission responsibility.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity.
 * @evidence contracts/modeling.md#parameter-channels The external source preserves the body's existing gain owner and identifies its actual head contribution.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source regions keep their identities.
 * @evidence contracts/modeling.md#emitted-geometry Selects which physical correspondence the emitted static model carries, without moving any vertex.
 * @evidence contracts/modeling.md#shared-boundaries Registered incidence lets split regions declare the same physical point across seams.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Topology registration carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A construction option, not a personal control.
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
