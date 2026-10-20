import {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
} from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Summing demand on ports opposite the root-facing direction yields the declared terminal load, with bidirectional and pass-through zero-demand ports following their stated semantics.
 * @evidence contracts/common.md#clear-and-simple-design Capacity validation and schematic totals consume this common load definition while discipline-specific pressure and diversity remain outside its declaration arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Flow direction selects the load-bearing end for every system, without special-casing drainage ids or inventing a simultaneity factor.
 * @evidence contracts/common.md#meaningful-documentation Explains supply/return direction, fitting-zero and bidirectional omissions, system units and the absence of hydraulic/electrical performance modeling.
 * @evidence contracts/performance.md#efficient-algorithms Every node's ports are filtered and summed once, O(P) time for P ports, with temporary filtered arrays bounded by individual node port counts.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One load is derived per requested system from its current port demands; cross-system demand tables are not cached by this scalar owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary filtered lists release on return and the output is a primitive, so no graph record remains retained.
 */
export const serviceSystemLoad: (props: {
  network: IAutoMovieServiceNetwork;
  system: IAutoMovieServiceSystem;
}) => number = (props: {
  network: IAutoMovieServiceNetwork;
  system: IAutoMovieServiceSystem;
}): number => {
  const facing: string = props.system.flow === "to-root" ? "out" : "in";
  return props.network.nodes.reduce(
    (sum: number, node: IAutoMovieServiceNode): number =>
      sum +
      node.ports
        .filter(
          (port: IAutoMovieServicePort): boolean =>
            port.system === props.system.id && port.direction === facing,
        )
        .reduce(
          (total: number, port: IAutoMovieServicePort): number =>
            total + port.demand,
          0,
        ),
    0,
  );
};
