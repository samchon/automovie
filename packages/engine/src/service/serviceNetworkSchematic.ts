import { IAutoMovieServiceNetwork, IAutoMovieServiceSystem, IAutoMovieServiceNode, IAutoMovieServicePort, IAutoMovieServiceSegment, IAutoMovieVector3, AutoMovieServiceNodeKind } from "@automovie/interface";
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
 * This report has no current product caller. An unknown system throws and a
 * missing endpoint owner remains the authored port id; validation is separate.
 *
 * @evidence contracts/common.md#principled-implementation XZ projection produces plan geometry while developed 3D lengths, declared load and directional reach preserve quantities outside that drawing projection.
 * @evidence contracts/common.md#clear-and-simple-design Shared ownership, length, demand and reach queries supply one report, but its current consumption is test-only rather than production report wiring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown systems refuse and dangling endpoint ids remain visible; no report success implies the network passed validation or a performance solver.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes drawing/physical quantities, system-unit load, unknown-system refusal, dangling endpoint behavior and the current unconsumed product status.
 * @evidence contracts/performance.md#efficient-algorithms Node/port and segment scans plus route projection are linear in their populations, with reach inheriting its queue-removal worst case; result storage scales with selected points and nodes.
 * @evidence contracts/performance.md#reuse-equivalent-work One owner lookup resolves all selected edges and the projected edge lengths are reused for totalLength; no report survives mutable network equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New drawing rows and point arrays transfer to the caller while temporary ownership/reach maps release without a source-network cache.
 *
 * @author Samchon
 */
export const serviceNetworkSchematic: (props: { network: IAutoMovieServiceNetwork; system: string; }) => IAutoMovieServiceSchematic = (props: {
  network: IAutoMovieServiceNetwork;
  system: string;
}): IAutoMovieServiceSchematic => {
  const system: IAutoMovieServiceSystem = requireSystem(props.network, props.system);
  const owner: Map<string, IAutoMovieServiceNode> = portOwners(props.network);
  const nodes: IAutoMovieServiceNode[] = props.network.nodes.filter((node: IAutoMovieServiceNode): boolean =>
    node.ports.some((port: IAutoMovieServicePort): boolean => port.system === system.id),
  );
  const edges: { id: string; from: string; to: string; points: { x: number; y: number; }[]; length: number; }[] = props.network.segments
    .filter((segment: IAutoMovieServiceSegment): boolean => segment.system === system.id)
    .map((segment: IAutoMovieServiceSegment): { id: string; from: string; to: string; points: { x: number; y: number; }[]; length: number; } => ({
      id: segment.id,
      from: owner.get(segment.from)?.id ?? segment.from,
      to: owner.get(segment.to)?.id ?? segment.to,
      points: segment.route.map((point: IAutoMovieVector3): { x: number; y: number; } => ({ x: point.x, y: point.z })),
      length: routeLength(segment),
    }));
  const reached: Set<string> = new Set(
    serviceSystemReach({ network: props.network, system: system.id }),
  );
  return {
    system: system.id,
    discipline: system.discipline,
    medium: system.medium,
    unit: system.unit,
    root: system.root,
    nodes: nodes.map((node: IAutoMovieServiceNode): { id: string; kind: AutoMovieServiceNodeKind; x: number; y: number; } => ({
      id: node.id,
      kind: node.kind,
      x: node.position.x,
      y: node.position.z,
    })),
    edges,
    totalLength: edges.reduce((sum: number, edge: { id: string; from: string; to: string; points: { x: number; y: number; }[]; length: number; }): number => sum + edge.length, 0),
    totalDemand: serviceSystemLoad({ network: props.network, system }),
    unreachable: nodes
      .filter((node: IAutoMovieServiceNode): boolean => !reached.has(node.id))
      .map((node: IAutoMovieServiceNode): string => node.id),
  };
};

const requireSystem: (network: IAutoMovieServiceNetwork, id: string) => IAutoMovieServiceSystem = (
  network: IAutoMovieServiceNetwork,
  id: string,
): IAutoMovieServiceSystem => {
  const system: IAutoMovieServiceSystem | undefined = network.systems.find((candidate: IAutoMovieServiceSystem): boolean => candidate.id === id);
  if (system === undefined)
    throw new Error(`service network "${network.id}" has no system "${id}"`);
  return system;
};
