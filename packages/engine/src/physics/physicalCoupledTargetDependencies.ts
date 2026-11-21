import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMoviePlanPhysicalContactTargets,
} from "@automovie/interface";

type Member = {
  readonly body: string;
  readonly bones: readonly string[];
  readonly plan: Pick<
    IAutoMoviePlanPhysicalContactTargets.IInput,
    "profiles" | "bindings"
  >;
};

/**
 * Check that one group forms a reciprocal dependency through receivers that
 * actually have adjustable ancestry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the adjusted receiver and reciprocal reachability conditions.
 * @evidence contracts/development/implementation.md#principled-implementation Finds free selected joints in receiver ancestry, then checks reachability in both graph directions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Dependency selection and the two graph traversals use the same admitted bodies and bindings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Skips inactive, self and fixed-receiver edges. A root-only apparent loop cannot pass.
 * @evidence contracts/development/implementation.md#efficient-algorithms Indexes joints by child once and visits each reachable vertex and its edges at most once per direction.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each body's child index for all of its receiver queries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Graphs and pose indexing remain local to this admission check.
 */
export function physicalCoupledTargetDependencies(
  members: readonly Member[],
): boolean {
  const movable: Map<string, (bone: string) => boolean> = new Map(
    members.map(
      (member: PreparedMember): [string, (bone: string) => boolean] => [
        member.body,
        adjustableAncestry(member.plan.profiles[member.body]!, member.bones),
      ],
    ),
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
