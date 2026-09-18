import { IAutoMovieServiceNetwork } from "@automovie/interface";
import { portOwners } from "./portOwners";

/**
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
 * name; the validator owns reporting the dangling root itself.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceSystemReach` reveals which declared nodes are actually connected to a system root, optionally showing the isolation caused by closed valves.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceSystemReach` traverses segment ownership according to `from-root`, `to-root`, or bidirectional flow and returns reached nodes in declaration order.
 * @author Samchon
 */
export const serviceSystemReach = (props: {
  network: IAutoMovieServiceNetwork;
  system: string;
  closedValvesBlock?: boolean;
}): string[] => {
  const system = requireSystem(props.network, props.system);
  const nodes = new Map(props.network.nodes.map((node) => [node.id, node]));
  if (!nodes.has(system.root)) return [];

  const owner = portOwners(props.network);
  const forward = new Map<string, string[]>();
  const backward = new Map<string, string[]>();
  for (const segment of props.network.segments) {
    if (segment.system !== system.id) continue;
    const from = owner.get(segment.from);
    const to = owner.get(segment.to);
    if (from === undefined || to === undefined) continue;
    push(forward, from.id, to.id);
    push(backward, to.id, from.id);
  }

  const blocks = props.closedValvesBlock === true;
  const reached = new Set<string>([system.root]);
  const queue: string[] = [system.root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodes.get(current)!;
    if (blocks && node.state !== null && node.state.opening === 0) continue;
    const next =
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
    .filter((node) => reached.has(node.id))
    .map((node) => node.id);
};
