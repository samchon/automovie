import type { IAutoMovieHumanSegmentJoint } from "@automovie/interface";

/** Admit operations for Human joint-chain topology. */
export namespace AutoMovieHumanChainTopology {
  /**
   * Admit an invocation against an authoritative logical name/parent topology.
   * Offsets and reference rotations remain the caller's actual inputs. The
   * authoritative graph must be valid and unique; this check proves membership,
   * uniqueness and parent identity, not rigid-frame validity, ordering or symmetry.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Compares every candidate name and parent against the authoritative graph, rejects duplicates and missing names, and returns the same admitted candidate without changing any frame input.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure owner is shared by the assembly boundary and made-input tests.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing, additional, duplicate and reparented joints are explicit refusals; no fallback graph, offset or rotation repairs them. Other frame/figure premises remain the producer's responsibility.
   * @evidence contracts/development/common.md#meaningful-documentation States the trusted reference-graph premise and the exact scope of admission separately from frame, ordering and symmetry validity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Expected and seen indexes require linear work and storage in the two joint counts; each candidate and expected name is visited once.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure input handoff coordinates no prepared requests.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Two call-local indexes die on return or refusal; the admitted chain is borrowed unchanged and no input is cached.
   */
  export function admit(
    reference: readonly Pick<IAutoMovieHumanSegmentJoint, "name" | "parent">[],
    candidate: readonly IAutoMovieHumanSegmentJoint[],
  ): readonly IAutoMovieHumanSegmentJoint[] {
    const expected: Map<string, string | null> = new Map(
      reference.map(
        (joint: Pick<IAutoMovieHumanSegmentJoint, "name" | "parent">): [string, string | null] => [
          joint.name,
          joint.parent,
        ],
      ),
    );
    const seen: Set<string> = new Set();
    for (const joint of candidate) {
      if (seen.has(joint.name))
        throw new Error("Chain topology: duplicate " + joint.name);
      seen.add(joint.name);
      if (!expected.has(joint.name))
        throw new Error("Chain topology: unexpected " + joint.name);
      const parent: string | null = expected.get(joint.name)!;
      if (parent !== joint.parent)
        throw new Error(
          "Chain topology: parent " +
            joint.name +
            ": expected " +
            String(parent) +
            ", received " +
            String(joint.parent),
        );
    }
    for (const joint of reference)
      if (!seen.has(joint.name))
        throw new Error("Chain topology: missing " + joint.name);
    return candidate;
  }
}
