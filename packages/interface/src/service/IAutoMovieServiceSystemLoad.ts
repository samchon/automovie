import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";
import type { IAutoMovieServiceSystem } from "./IAutoMovieServiceSystem";

/** Service graph and selected flow policy for declared demand aggregation. */
export namespace IAutoMovieServiceSystemLoad {
  /**
   * Service graph and selected flow policy for declared demand aggregation.
   *
   * The load is read at the ports facing **opposite to the root**, because that
   * is the end a system is loaded from. A supply main, a lighting circuit and a
   * supply air trunk are loaded by what their `in` ports draw; a drainage
   * stack, a return riser and an exhaust are loaded by what their `out` ports
   * discharge. Summing `in` ports for every system would leave every `to-root`
   * system measured against a load of zero — a capacity check that cannot fail
   * is worse than none, because it reads as one that passed.
   *
   * A fitting merely passing the medium on — a tee, a valve, a damper —
   * declares `0` and contributes nothing, so the water that reaches a basin
   * through a shut-off is counted where the basin draws it and not again at the
   * valve. A `bidirectional` port is counted at neither end: it is the fitting
   * on a ring that may be fed from either side, and a tap's draw is stated on
   * the port that draws it rather than on the ring it hangs off.
   *
   * This is a declaration check and nothing more. No diversity, no simultaneity
   * and no head loss enter it; `serviceAnalysisSupport` names the solver that
   * would as `unsupported`.
   */
  export type IProps = {
    /**
     * Borrowed nodes and ports whose declared demands are summed; no matching
     * load-side ports gives zero.
     */
    network: IAutoMovieServiceNetwork;

    /**
     * Borrowed system policy identifying matching ports, flow direction and
     * demand unit; membership in the supplied network is a caller premise.
     */
    system: IAutoMovieServiceSystem;
  };
}
