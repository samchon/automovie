import type { IAutoMovieLoftSectionSourceBinding } from "./IAutoMovieLoftSectionSourceBinding";
import type { IAutoMovieLoftSectionSourceFamily } from "./IAutoMovieLoftSectionSourceFamily";
import type { IAutoMovieLoftViewSource } from "./IAutoMovieLoftViewSource";

/** Data and callback contracts shared by the LoftSectionSource operations. */
export namespace IAutoMovieLoftSectionSource {
  /** Original scalar field and the compatibility rows published beside it. */
  export interface ISource {
    /** A broken present discriminator never means source absence. */
    kind: "view";

    /** Original scalar functions and existing effective cap law. */
    data: IAutoMovieLoftViewSource.ISource;

    /**
     * Independent snapshots; a later coefficient rewrite must explicitly
     * re-express ownership.
     */
    rows: readonly IAutoMovieLoftSectionSourceBinding[];
  }

  /** Actual endpoint family with an independent transformed-layer binding. */
  export interface IEndpoint {
    /** Explicit boundary discriminator. */
    kind: "endpoint";

    /**
     * Actual complete endpoint generating family, already oriented into the
     * receiver.
     */
    field: IAutoMovieLoftSectionSourceFamily;

    /** The changed layer's compatibility arrays and station. */
    binding: IAutoMovieLoftSectionSourceBinding;

    /**
     * Independent plain field snapshot, preserving value copies and detecting
     * stale edits.
     */
    snapshot: IAutoMovieLoftSectionSourceFamily;
  }
}
