import type {
  IAutoMovieRecoveryChartBoundaryNetwork,
  IAutoMovieRecoveryChartBoundaryNetworkRegistry,
} from "@automovie/interface";

import { RecoveryChartBoundaryNetworkAugment } from "./RecoveryChartBoundaryNetworkAugment";
import { RecoveryChartBoundaryNetworkBindings } from "./RecoveryChartBoundaryNetworkBindings";
import { RecoveryChartBoundaryNetworkRegistry } from "./RecoveryChartBoundaryNetworkRegistry";

/*
 * Reconcile private quarter cuts before fitting shared maximal boundary arcs.
 * Physical keys, base-edge ancestry and exact numeric fractions declare
 * sharing; equal positions alone never identify a bank. Inputs remain
 * immutable. Missing base-edge banks are diagnosed without fabricated
 * connections. Ambiguous keys, collapsed observations, invalid incidence or
 * nonrepresentable phases throw. Canonical insertions can change existing
 * binary64 points slightly; diagnostics retain maximum point displacement and
 * actual per-chart source-area changes. This is observation subdivision, not
 * engine geometry or a PL equality proof.
 *
 * Original quarter corners, graph branches and changes of incident chart sets
 * split the physical boundary graph into open arcs. Closed and junction-return
 * chains receive stable-key anchors at existing observations, preserving every
 * edge and introducing no point or shortcut. Each canonical arc invokes
 * owner.get once; reversed banks reuse its coefficients and registration. A
 * side composite concatenates these arcs under physical-polyline-length
 * proportions. Its synthetic identity serves mapping only; assembly must use
 * pieces authority. Source words, triangles and original normals remain private
 * to this operation.
 */
export function RecoveryChartBoundaryNetwork(
  input: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation> {
  const context: ReturnType<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation> =
    RecoveryChartBoundaryNetworkRegistry(input);
  context.maximumPointChange = RecoveryChartBoundaryNetworkAugment(
    input,
    context,
  );
  return RecoveryChartBoundaryNetworkBindings(input, context);
}
