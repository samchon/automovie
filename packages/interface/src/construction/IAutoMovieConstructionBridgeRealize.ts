import type { IAutoMovieConstructionContinuation } from "./IAutoMovieConstructionContinuation";

/**
 * Continuation-node narrowing consumed by the full-ring bridge realization.
 *
 * @evidence contracts/development/design.md#principled-representation A required band selects the bridge path of a continuation without changing its authored metre/radian quantities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConstructionBridgeRealize consumes the existing continuation declaration directly.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The intersection narrows optional band presence; realized faces and a valid interior rail still require runtime admission.
 * @evidence contracts/development/common.md#meaningful-documentation Names the owning realization path and its required-band premise.
 */
export namespace IAutoMovieConstructionBridgeRealize {
  /**
   * Realize a continuation with a band (`IAutoMovieConstructionContinuation.band`): the host's open end and the part's ring at `rail` inside
   * it joined by one band round the whole ring, so two faces whose sections have different orders meet without either taking the other's.
   *
   * The band is a split's band with one stretch, the host's whole end ring, and no seam (`AutoMovieConstructionSplitBand.fan`): its start
   * ribbon is the host's own 2-jet along its station line out of its end, its end ribbon the part's own 2-jet at the rail toward its kept
   * side, both scaled by the strip's common factor to preserve each sampled
   * boundary 2-jet's geometric matching. Periodic interpolation between columns
   * is not an exact whole-boundary G2 certificate. The ring's vertices are the host's end cycle and the band's
   * start cycle, the rail's vertices the band's end cycle and the part's rail cycle, each segment naming the face across it, as a split's
   * are.
   *
   * The borrowed node must remain unchanged during realization. Host failures
   * are reported before the part checkpoint. Later admission failures restore
   * appended geometry and report the node; foreign exceptions restore it and
   * propagate. The rail is a metre offset converted to kernel millimetres from
   * the selected part end, directed into its kept side.
   *
   * @evidence contracts/development/design.md#principled-representation Requires the continuation's existing band descriptor for a complete host ring joined to an interior part rail.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses IAutoMovieConstructionContinuation rather than copying its reference and sampling fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Band presence is structural; BridgeRealize checks realized face ownership, uncut ends and the strictly interior rail.
   * @evidence contracts/development/common.md#meaningful-documentation Defines rail units, borrowed input lifetime and reported versus propagated failures.
   */
  export type INode = IAutoMovieConstructionContinuation & {
    /** Required whole-ring strip specification; presence selects bridge realization. */
    band: IAutoMovieConstructionContinuation.IBand;
  };
}
