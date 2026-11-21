import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";
import RAPIER, { type PhysicsHooks } from "@dimforge/rapier3d-compat";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { isPhysicalPairExcluded } from "./isPhysicalPairExcluded";

/** A bound segment owns its provider order and pairs with higher ordinals. */
interface Segment {
  body: string;
  ordinal: number;
  excluded?: Set<number>;
}

/**
 * Index the admitted run's collider owners and self-exclusions once for both
 * native callbacks. Every collider of a segment shares its record, including
 * compliant counterparts. Native handle numbers are used as given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the admitted input, native handle lookup and both callback consumers.
 * @evidence contracts/development/implementation.md#principled-implementation Builds one unordered edge for each declared or joint-adjacent pair, shared by all shapes of a segment, then maps the existing Rapier handles to their owners; unknown handles use the existing rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One predicate serves both the contact and sensor callbacks; their original flags and refusal semantics stay explicit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bounds, collision masks, floating point and native traversal remain unchanged; no special body, sensor, material or shape category has separate policy.
 * @evidence contracts/development/implementation.md#efficient-algorithms Construction is linear in segments, pairs and handles. Pair queries use two lookups and one set membership for admitted body colliders.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One table of admitted immutable data serves all substeps of this bound world. A resumed world rebuilds the table from its own handles.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callbacks borrow the binding and own one entry per tracked collider and one entry per distinct pair; queries never add entries and these records leave with the run.
 */
export function preparePhysicalContactHooks(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  bound: Bound,
): PhysicsHooks {
  const bodies: Map<string, Map<string, Segment>> = new Map();
  for (const { id, profile } of input.bodies) {
    const segments: Map<string, Segment> = new Map();
    for (const [ordinal, segment] of profile.segments.entries())
      segments.set(segment.bone, { body: id, ordinal });

    for (const joint of profile.joints) add(joint.parent, joint.child);
    for (const pair of profile.collisionExclusions ?? []) add(pair.a, pair.b);
    bodies.set(id, segments);

    /** Store a pair under the earlier segment in admitted profile order. */
    function add(a: string, b: string): void {
      const left: Segment = segments.get(a)!;
      const right: Segment = segments.get(b)!;
      if (left.ordinal < right.ordinal)
        (left.excluded ??= new Set()).add(right.ordinal);
      else (right.excluded ??= new Set()).add(left.ordinal);
    }
  }

  const owners: Map<number, Segment> = new Map();
  for (const [handle, identity] of bound.colliders) {
    const owner: Segment | undefined = bodies
      .get(identity.body)
      ?.get(identity.bone);
    if (owner !== undefined) owners.set(handle, owner);
  }

  return {
    filterContactPair: (
      first: number,
      second: number,
    ): RAPIER.SolverFlags | null =>
      excluded(first, second) ? null : RAPIER.SolverFlags.COMPUTE_IMPULSE,
    filterIntersectionPair: (first: number, second: number): boolean =>
      !excluded(first, second),
  };

  /** Resolve the same-owner pairs once, keeping the original lookup for unmapped handles. */
  function excluded(first: number, second: number): boolean {
    const left: Segment | undefined = owners.get(first);
    const right: Segment | undefined = owners.get(second);
    if (left === undefined || right === undefined)
      return isPhysicalPairExcluded(input, bound, first, second);
    if (left.body !== right.body) return false;
    if (left === right) return true;
    return left.ordinal < right.ordinal
      ? left.excluded?.has(right.ordinal) === true
      : right.excluded?.has(left.ordinal) === true;
  }
}
