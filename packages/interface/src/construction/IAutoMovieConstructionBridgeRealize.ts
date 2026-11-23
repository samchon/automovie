import type { IAutoMovieConstructionContinuation } from "./IAutoMovieConstructionContinuation";

/** Continuation-node narrowing consumed by the full-ring bridge realization. */
export namespace IAutoMovieConstructionBridgeRealize {
  /**
   * Realize a continuation with a band
   * (`IAutoMovieConstructionContinuation.band`): the host's open end and the
   * part's ring at `rail` inside it joined by one band round the whole ring, so
   * two faces whose sections have different orders meet without either taking
   * the other's.
   *
   * The band is a split's band with one stretch, the host's whole end ring, and
   * no seam (`AutoMovieConstructionSplitBand.fan`): its start ribbon is the
   * host's own 2-jet along its station line out of its end, its end ribbon the
   * part's own 2-jet at the rail toward its kept side, both scaled by the
   * strip's common factor to preserve each sampled boundary 2-jet's geometric
   * matching. Periodic interpolation between columns is not an exact
   * whole-boundary G2 certificate. The ring's vertices are the host's end cycle
   * and the band's start cycle, the rail's vertices the band's end cycle and
   * the part's rail cycle, each segment naming the face across it, as a split's
   * are.
   *
   * The borrowed node must remain unchanged during realization. Host failures
   * are reported before the part checkpoint. Later admission failures restore
   * appended geometry and report the node; foreign exceptions restore it and
   * propagate. The rail is a metre offset converted to kernel millimetres from
   * the selected part end, directed into its kept side.
   */
  export type INode = IAutoMovieConstructionContinuation & {
    /**
     * Required whole-ring strip specification; presence selects bridge
     * realization.
     */
    band: IAutoMovieConstructionContinuation.IBand;
  };
}
