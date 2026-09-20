import { IAutoMovieServiceNetwork, IAutoMovieServiceSystem } from "@automovie/interface";

/**
 * Total demand one system is declared to carry, in the system's own unit.
 *
 * The load is read at the ports facing **opposite to the root**, because that
 * is the end a system is loaded from. A supply main, a lighting circuit and a
 * supply air trunk are loaded by what their `in` ports draw; a drainage stack,
 * a return riser and an exhaust are loaded by what their `out` ports discharge.
 * Summing `in` ports for every system would leave every `to-root` system
 * measured against a load of zero — a capacity check that cannot fail is worse
 * than none, because it reads as one that passed.
 *
 * A fitting merely passing the medium on — a tee, a valve, a damper — declares
 * `0` and contributes nothing, so the water that reaches a basin through a
 * shut-off is counted where the basin draws it and not again at the valve. A
 * `bidirectional` port is counted at neither end: it is the fitting on a ring
 * that may be fed from either side, and a tap's draw is stated on the port that
 * draws it rather than on the ring it hangs off.
 *
 * This is a declaration check and nothing more. No diversity, no simultaneity
 * and no head loss enter it; `serviceAnalysisSupport` names the solver that
 * would as `unsupported`.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceSystemLoad` reports the demand a supply or collection system is declared to carry without pretending to solve hydraulic or electrical performance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceSystemLoad` sums matching-system `in` demands for flow from the root and `out` demands for flow toward it.
 * @author Samchon
 */
export const serviceSystemLoad = (props: {
  network: IAutoMovieServiceNetwork;
  system: IAutoMovieServiceSystem;
}): number => {
  const facing = props.system.flow === "to-root" ? "out" : "in";
  return props.network.nodes.reduce(
    (sum, node) =>
      sum +
      node.ports
        .filter(
          (port) =>
            port.system === props.system.id && port.direction === facing,
        )
        .reduce((total, port) => total + port.demand, 0),
    0,
  );
};
