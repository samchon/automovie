import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/** World box queried against translated service maintenance envelopes. */
export namespace IAutoMovieServiceEnvelopeObstructions {
  /**
   * World box queried against translated service maintenance envelopes.
   *
   * This is the seam a prop, a piece of furniture or a second discipline is
   * compared through: hand it any axis-aligned world box — a staged prop's
   * occupancy bound, for instance — and it names the equipment that could no
   * longer be serviced. Contact alone is not intrusion, so a cabinet standing
   * exactly on the exterior edge of an access zone is left alone. Degenerate
   * boxes strictly inside another box can still pass the endpoint comparisons.
   * World metre boxes are expected to be admitted. This query currently has no
   * product caller and is exercised only by service geometry tests.
   */
  export type IProps = {
    /**
     * Borrowed nodes; null maintenance boxes are skipped and matched node ids
     * retain declaration order.
     */
    network: IAutoMovieServiceNetwork;

    /**
     * Borrowed admitted world-metre axis-aligned box to compare against
     * translated maintenance envelopes; exterior contact is excluded.
     */
    bounds: IAutoMoviePropBox;
  };
}
