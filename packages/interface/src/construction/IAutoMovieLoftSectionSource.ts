import type { IAutoMovieLoftSectionSourceBinding } from "./IAutoMovieLoftSectionSourceBinding";
import type { IAutoMovieLoftSectionSourceFamily } from "./IAutoMovieLoftSectionSourceFamily";
import type { IAutoMovieLoftViewSource } from "./IAutoMovieLoftViewSource";

/**
 * Data and callback contracts shared by the LoftSectionSource operations.
 *
 * @evidence contracts/development/design.md#principled-representation Source and endpoint discriminants distinguish original scalar fields from oriented complete endpoint families, each with independent compatibility-row bindings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftSectionSource owns these records for native chain readers and continuation field capture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A present but malformed or stale source remains failure rather than falling back to legacy coefficients.
 * @evidence contracts/development/common.md#meaningful-documentation Defines source discriminants, immutable snapshots and explicit rebinding after edits.
 */
export namespace IAutoMovieLoftSectionSource {
  /**
   * Original scalar field and the compatibility rows published beside it.
   *
   * @evidence contracts/development/design.md#principled-representation Retains the actual prepared scalar functions independently of their approximate principal coefficient projection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminator, scalar source and ordered binding list define admission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing physical jet is a diagnostic status rather than a fabricated tuple or lost finite value.
   * @evidence contracts/development/common.md#meaningful-documentation Data is immutable and value-copyable; the frame owner's callable serialization limit is separate.
   */
  export interface ISource {
    /** A broken present discriminator never means source absence. */
    kind: "view";

    /** Original scalar functions and existing effective cap law. */
    data: IAutoMovieLoftViewSource.ISource;

    /** Independent snapshots; a later coefficient rewrite must explicitly re-express ownership. */
    rows: readonly IAutoMovieLoftSectionSourceBinding[];
  }

  /**
   * Actual endpoint family with an independent transformed-layer binding.
   *
   * @evidence contracts/development/design.md#principled-representation Complete native scalar2 or actual basis coefficient2 determines the endpoint's whole phase function.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Family and transformed numeric layer snapshot remain explicit plain records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A composed non-native function is not fitted into eight native scalars, and no missing derivative row is supplied as zero.
   * @evidence contracts/development/common.md#meaningful-documentation Station direction and chart reflection are applied before binding this record to its new layer.
   */
  export interface IEndpoint {
    /** Explicit boundary discriminator. */
    kind: "endpoint";

    /** Actual complete endpoint generating family, already oriented into the receiver. */
    field: IAutoMovieLoftSectionSourceFamily;

    /** The changed layer's compatibility arrays and station. */
    binding: IAutoMovieLoftSectionSourceBinding;

    /** Independent plain field snapshot, preserving value copies and detecting stale edits. */
    snapshot: IAutoMovieLoftSectionSourceFamily;
  }
}
