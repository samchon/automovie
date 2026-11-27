import {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServiceSystem,
  type IAutoMovieServiceSystemReach,
} from "@automovie/interface";

import { portOwners } from "./portOwners";

/*
 * Which nodes one system's root actually reaches.
 *
 * Reachability is what separates a drawn network from a working one, and its
 * direction is the system's own: a supply main is walked forward from the root,
 * a drainage stack backward into it, a ring either way. The answer is returned
 * in declaration order so two runs of the same design produce the same list.
 *
 * `closedValvesBlock` is the difference between the design question and the
 * operating one. Left off — the default — an isolating valve is walked straight
 * through, because a valve someone happened to shut is not a design defect.
 * Set, a node whose state passes nothing stops the walk at itself: it is still
 * reached, everything beyond it is not, and that is how a shut-off is shown to
 * isolate what it was installed to isolate.
 *
 * A system whose root does not resolve reaches nothing rather than reaching a
 * name; the validator owns reporting the dangling root itself. An unknown
 * system id throws. Nodes, ports and segment references must already be
 * structurally admitted; the queue walk is not an arbitrary-JSON gate.
 */
export function serviceSystemReach(
  props: IAutoMovieServiceSystemReach.IProps,
): string[] {
  const system: IAutoMovieServiceSystem = requireSystem(
    props.network,
    props.system,
  );
  const nodes: Map<string, IAutoMovieServiceNode> = new Map(
    props.network.nodes.map(
      (node: IAutoMovieServiceNode): [string, IAutoMovieServiceNode] => [
        node.id,
        node,
      ],
    ),
  );
  if (!nodes.has(system.root)) return [];

  const owner: Map<string, IAutoMovieServiceNode> = portOwners(props.network);
  const forward: Map<string, string[]> = new Map<string, string[]>();
  const backward: Map<string, string[]> = new Map<string, string[]>();
  for (const segment of props.network.segments) {
    if (segment.system !== system.id) continue;
    const from: IAutoMovieServiceNode | undefined = owner.get(segment.from);
    const to: IAutoMovieServiceNode | undefined = owner.get(segment.to);
    if (from === undefined || to === undefined) continue;
    push(forward, from.id, to.id);
    push(backward, to.id, from.id);
  }

  const blocks: boolean = props.closedValvesBlock === true;
  const reached: Set<string> = new Set<string>([system.root]);
  const queue: string[] = [system.root];
  while (queue.length > 0) {
    const current: string = queue.shift()!;
    const node: IAutoMovieServiceNode = nodes.get(current)!;
    if (blocks && node.state !== null && node.state.opening === 0) continue;
    const next: string[] =
      system.flow === "from-root"
        ? (forward.get(current) ?? [])
        : system.flow === "to-root"
          ? (backward.get(current) ?? [])
          : [...(forward.get(current) ?? []), ...(backward.get(current) ?? [])];
    for (const candidate of next)
      if (!reached.has(candidate)) {
        reached.add(candidate);
        queue.push(candidate);
      }
  }
  return props.network.nodes
    .filter((node: IAutoMovieServiceNode): boolean => reached.has(node.id))
    .map((node: IAutoMovieServiceNode): string => node.id);
}

const requireSystem: (
  network: IAutoMovieServiceNetwork,
  id: string,
) => IAutoMovieServiceSystem = (
  network: IAutoMovieServiceNetwork,
  id: string,
): IAutoMovieServiceSystem => {
  const system: IAutoMovieServiceSystem | undefined = network.systems.find(
    (candidate: IAutoMovieServiceSystem): boolean => candidate.id === id,
  );
  if (system === undefined)
    throw new Error(`service network "${network.id}" has no system "${id}"`);
  return system;
};

const push: (map: Map<string, string[]>, key: string, value: string) => void = (
  map: Map<string, string[]>,
  key: string,
  value: string,
): void => {
  const bucket: string[] | undefined = map.get(key);
  if (bucket === undefined) map.set(key, [value]);
  else bucket.push(value);
};
