import {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { serviceSystemLoad } from "./serviceSystemLoad";
import { serviceSystemReach } from "./serviceSystemReach";

/** Append declared capacity and root-reach findings in system then node declaration order.
 *
 * @evidence contracts/common.md#principled-implementation Declared load is compared with stated capacity before root-direction reach identifies disconnected nodes; neither step computes hydraulic loss, voltage drop or diversified demand.
 * @evidence contracts/common.md#clear-and-simple-design Shared load and reach owners serve production service admission, while this phase preserves system/node finding order and the existing root-missing suppression.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite capacity does not make invalid port demand safe; earlier numeric admission remains authoritative, and missing roots skip secondary reach accusations without rewriting the graph.
 * @evidence contracts/common.md#meaningful-documentation States scalar capacity versus connectivity responsibilities and their declaration-order paths in the parent gate.
 * @evidence contracts/performance.md#efficient-algorithms Each system scans graph ports for load and builds a reach traversal, then scans nodes for membership, inheriting the reach queue's worst-case removal cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The reached-id set is built once per system and reused for all of its participating nodes; no cross-system result is assumed equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reached sets and scalar totals are temporary; source node ids and capacity values survive only in caller-owned validation findings.
 */
export function appendServiceNetworkCapacity(
  network: IAutoMovieServiceNetwork,
  root: string,
  out: ViolationCollector,
): void {
  network.systems.forEach(
    (system: IAutoMovieServiceSystem, index: number): void => {
      // Read at the end facing away from the root, so a drainage stack is
      // measured by what discharges into it rather than by the zero a
      // supply-shaped reading would hand it. This is a declaration check, not a
      // hydraulic or electrical one: nothing here diversifies, and
      // `serviceAnalysisSupport` says so by name.
      const load: number = serviceSystemLoad({ network, system });
      if (Number.isFinite(system.capacity) && load > system.capacity)
        out.push(
          "range",
          `${root}.systems[${index}].capacity`,
          `system "${system.id}" carries ${load} of declared demand against a capacity of ${system.capacity}`,
          system.capacity,
          load - system.capacity,
        );
      if (
        !network.nodes.some(
          (node: IAutoMovieServiceNode): boolean => node.id === system.root,
        )
      )
        return;
      const reached: Set<string> = new Set(
        serviceSystemReach({ network, system: system.id }),
      );
      network.nodes.forEach((node: IAutoMovieServiceNode, at: number): void => {
        if (
          !node.ports.some(
            (port: IAutoMovieServicePort): boolean => port.system === system.id,
          )
        )
          return;
        if (reached.has(node.id)) return;
        out.push(
          "type",
          `${root}.nodes[${at}]`,
          `service node "${node.id}" is not reached from the root of system "${system.id}"`,
          node.id,
        );
      });
    },
  );
}
