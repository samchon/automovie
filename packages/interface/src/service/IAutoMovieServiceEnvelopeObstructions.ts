import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * World box queried against translated service maintenance envelopes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation World box queried against translated service maintenance envelopes. bounds is an admitted finite ordered world-metre AABB; serviceEnvelopeObstructions compares it to node-local maintenance boxes translated by node position.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No input validation or mutation occurs; exterior face contact is excluded by strict endpoint comparisons, but internal degenerate boxes may still pass.
 * @evidence contracts/development/design.md#principled-representation bounds is an admitted finite ordered world-metre AABB; serviceEnvelopeObstructions compares it to node-local maintenance boxes translated by node position.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The obstruction query reuses IAutoMoviePropBox and the same serviceMaintenanceBounds conversion used by network interference checks.
 */
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
   *
   * @evidence contracts/development/design.md#principled-representation bounds is an admitted finite ordered world-metre AABB; serviceEnvelopeObstructions compares it to node-local maintenance boxes translated by node position.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The obstruction query reuses IAutoMoviePropBox and the same serviceMaintenanceBounds conversion used by network interference checks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No input validation or mutation occurs; exterior face contact is excluded by strict endpoint comparisons, but internal degenerate boxes may still pass.
   * @evidence contracts/development/common.md#meaningful-documentation World box queried against translated service maintenance envelopes. bounds is an admitted finite ordered world-metre AABB; serviceEnvelopeObstructions compares it to node-local maintenance boxes translated by node position.
   */
  export type IProps = {
    /** Borrowed nodes; null maintenance boxes are skipped and matched node ids retain declaration order. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed admitted world-metre axis-aligned box to compare against translated maintenance envelopes; exterior contact is excluded. */
    bounds: IAutoMoviePropBox;
  };
}
