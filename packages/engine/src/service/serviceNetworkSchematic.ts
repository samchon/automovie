import { IAutoMovieServiceNetwork } from "@automovie/interface";
import { IAutoMovieServiceSchematic } from "./IAutoMovieServiceSchematic";
import { portOwners } from "./portOwners";
import { routeLength } from "./routeLength";
import { serviceSystemLoad } from "./serviceSystemLoad";
import { serviceSystemReach } from "./serviceSystemReach";

/**
 * Project one system to a plan schematic with its totals.
 *
 * Lengths are measured on the authored 3D centre line and only the drawing is
 * flattened, so a riser does not silently become a point of zero pipe. Demand
 * is the system's own declared load, read in the direction the system flows by
 * {@link serviceSystemLoad}, so a drainage stack reports what it carries rather
 * than the zero a supply-shaped reading would give it.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceNetworkSchematic` produces the reviewable plan, topology, installed length, declared demand, and disconnection list for one service system.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceNetworkSchematic` resolves port owners, projects world routes onto `x`/`z`, and derives totals and root reachability from the selected system.
 * @evidence requirements/interior/services-and-environment.md#interior-service-terminals-controls `serviceNetworkSchematic` preserves the selected system's node, terminal, equipment, port, flow direction, demand, and valve-controlled reachability in one deterministic diagram.
 * @author Samchon
 */
export const serviceNetworkSchematic = (props: {
  network: IAutoMovieServiceNetwork;
  system: string;
}): IAutoMovieServiceSchematic => {
  const system = requireSystem(props.network, props.system);
  const owner = portOwners(props.network);
  const nodes = props.network.nodes.filter((node) =>
    node.ports.some((port) => port.system === system.id),
  );
  const edges = props.network.segments
    .filter((segment) => segment.system === system.id)
    .map((segment) => ({
      id: segment.id,
      from: owner.get(segment.from)?.id ?? segment.from,
      to: owner.get(segment.to)?.id ?? segment.to,
      points: segment.route.map((point) => ({ x: point.x, y: point.z })),
      length: routeLength(segment),
    }));
  const reached = new Set(
    serviceSystemReach({ network: props.network, system: system.id }),
  );
  return {
    system: system.id,
    discipline: system.discipline,
    medium: system.medium,
    unit: system.unit,
    root: system.root,
    nodes: nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      x: node.position.x,
      y: node.position.z,
    })),
    edges,
    totalLength: edges.reduce((sum, edge) => sum + edge.length, 0),
    totalDemand: serviceSystemLoad({ network: props.network, system }),
    unreachable: nodes
      .filter((node) => !reached.has(node.id))
      .map((node) => node.id),
  };
};
