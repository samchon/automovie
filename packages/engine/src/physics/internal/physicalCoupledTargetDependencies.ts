import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMoviePlanPhysicalContactTargets,
} from "@automovie/interface";

/**
 * Check that one group forms a reciprocal dependency through receivers that
 * actually have adjustable ancestry.
 */
export function physicalCoupledTargetDependencies(
  members: readonly Member[],
): boolean {
  const movable: Map<string, (bone: string) => boolean> = new Map(
    members.map((member: Member): [string, (bone: string) => boolean] => [
      member.body,
      adjustableAncestry(member.plan.profiles[member.body]!, member.bones),
    ]),
  );
  const forward: Map<string, string[]> = new Map();
  const reverse: Map<string, string[]> = new Map();
  for (const member of members)
    for (const binding of member.plan.bindings) {
      const peer: string = binding.target.body;
      if (
        binding.weight === 0 ||
        peer === member.body ||
        !movable.get(peer)?.(binding.target.bone)
      )
        continue;
      connect(forward, member.body, peer);
      connect(reverse, peer, member.body);
    }
  return reachable(forward) && reachable(reverse);

  function connect(
    graph: Map<string, string[]>,
    from: string,
    to: string,
  ): void {
    const edges: string[] = graph.get(from) ?? [];
    edges.push(to);
    graph.set(from, edges);
  }
  function reachable(graph: Map<string, string[]>): boolean {
    const first: string = members[0]!.body;
    const visited: Set<string> = new Set([first]);
    const stack: string[] = [first];
    while (stack.length > 0)
      for (const peer of graph.get(stack.pop()!) ?? [])
        if (!visited.has(peer)) {
          visited.add(peer);
          stack.push(peer);
        }
    return visited.size === members.length;
  }
}

type Member = {
  readonly body: string;
  readonly bones: readonly string[];
  readonly plan: Pick<
    IAutoMoviePlanPhysicalContactTargets.IInput,
    "profiles" | "bindings"
  >;
};

/** Determine whether a probe can change the receiver's displayed placement. */
function adjustableAncestry(
  profile: IAutoMoviePhysicalProfile,
  bones: readonly string[],
): (bone: string) => boolean {
  const selected: Set<string> = new Set(bones);
  const byChild: Map<string, IAutoMoviePhysicalJoint> = new Map(
    profile.joints.map(
      (joint: IAutoMoviePhysicalJoint): [string, IAutoMoviePhysicalJoint] => [
        joint.child,
        joint,
      ],
    ),
  );
  return (bone: string): boolean => {
    for (
      let joint: IAutoMoviePhysicalJoint | undefined = byChild.get(bone);
      joint;
      joint = byChild.get(joint.parent)
    )
      if (
        selected.has(joint.child) &&
        joint.axes.some(
          (axis: IAutoMoviePhysicalJointAxis): boolean =>
            axis.maximum > axis.minimum,
        )
      )
        return true;
    return false;
  };
}
