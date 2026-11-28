import type { IAutoMovieLoftSectionSourceBinding } from "./IAutoMovieLoftSectionSourceBinding";
import type { IAutoMovieLoftSectionSourceFamily } from "./IAutoMovieLoftSectionSourceFamily";
import type { IAutoMovieLoftViewSource } from "./IAutoMovieLoftViewSource";

/** Data and callback contracts shared by the LoftSectionSource operations. */
export namespace IAutoMovieLoftSectionSource {
  /**
   * Original prepared view source and independent compatibility snapshots for
   * its principal layers. Keep snapshots sorted by physical station. If a
   * retained layer changes, update its binding through the owning producer
   * before using the original section source again.
   */
  export interface ISource {
    /**
     * Discriminator for original prepared view ownership. An invalid present
     * source is rejected by the reader.
     */
    kind: "view";

    /**
     * Prepared scalar view data, including the original domain and effective
     * cap treatment.
     */
    data: IAutoMovieLoftViewSource.ISource;

    /**
     * Independent coefficient snapshots sorted by station. Preserve them and
     * the corresponding layer data during source reuse.
     */
    rows: readonly IAutoMovieLoftSectionSourceBinding[];
  }

  /**
   * Complete endpoint generating family already expressed in the receiving
   * chart, with independent copies binding the actual family and transformed
   * layer. Use SectionSource.bind to prepare the field and snapshot. Endpoint
   * lookup rejects a changed record or changed bound layer.
   */
  export interface IEndpoint {
    /** Discriminator for a generating family bound to one actual layer endpoint. */
    kind: "endpoint";

    /**
     * Complete native or basis generating family in the receiver's station and
     * phase chart.
     */
    field: IAutoMovieLoftSectionSourceFamily;

    /**
     * Snapshot of the changed layer's physical station and compatibility
     * coefficient rows.
     */
    binding: IAutoMovieLoftSectionSourceBinding;

    /**
     * Independent copy of the admitted generating family used to detect changes
     * to field.
     */
    snapshot: IAutoMovieLoftSectionSourceFamily;
  }
}
