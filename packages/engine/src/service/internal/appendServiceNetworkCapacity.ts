import {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { serviceSystemLoad } from "./serviceSystemLoad";
import { serviceSystemReach } from "./serviceSystemReach";

/**
 * Append declared capacity and root-reach findings in system then node
 * declaration order.
 */
export function appendServiceNetworkCapacity(
  network: IAutoMovieServiceNetwork,
  root: string,
  out: IAutoMovieViolationCollector,
): void {
  network.systems.forEach(
    (system: IAutoMovieServiceSystem, index: number): void => {
      // Read at the end facing away from the root, so a drainage stack is
      // measured by what discharges into it rather than by the zero a
      // supply-shaped reading would hand it. This is a declaration check, not a
      // hydraulic or electrical one: nothing here diversifies, and
      // `serviceAnalysisSupport` says so by name.
      const load: number = serviceSystemLoad({ network, system });
      if (load > system.capacity)
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
