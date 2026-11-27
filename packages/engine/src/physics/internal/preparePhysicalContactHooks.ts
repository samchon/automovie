import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import type { AutoMovieXpbdCollider } from "../AutoMovieXpbdCollider";
import type { IAutoMoviePhysicalBinding as Bound } from "../IAutoMoviePhysicalBinding";
import { isPhysicalPairExcluded } from "./isPhysicalPairExcluded";
import type { solveXpbdContacts } from "./solveXpbdContacts";

/**
 * Build the world's collider-pair filter for one bound run: two colliders of
 * the same segment, of a joint's two segments, or of a pair the profile
 * declares in `collisionExclusions` never touch; colliders of different scene
 * bodies, and a body's undeclared non-adjacent segments, always may. The world
 * consults the filter for contact response and for sensor overlaps alike, so
 * the compliant layer sees the same pairs as the rigid solve. Every collider of
 * a segment shares its record, including a compliant surface's rigid core. A
 * collider the binding does not identify is resolved by
 * `isPhysicalPairExcluded` on the live input, which the floor and unknown
 * colliders pass.
 *
 * @param input The admitted simulation input: profiles, joints and exclusions.
 * @param bound The world's binding: collider identities by handle.
 * @returns The filter `AutoMovieXpbdWorld.step` takes; true admits the pair.
 */
export function preparePhysicalContactHooks(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  bound: Bound,
): solveXpbdContacts.Filter {
  const bodies: Map<string, Map<string, ISegment>> = new Map();
  for (const { id, profile } of input.bodies) {
    const segments: Map<string, ISegment> = new Map();
    for (const [ordinal, segment] of profile.segments.entries())
      segments.set(segment.bone, { body: id, ordinal });

    for (const joint of profile.joints) add(joint.parent, joint.child);
    for (const pair of profile.collisionExclusions ?? []) add(pair.a, pair.b);
    bodies.set(id, segments);

    /** Store a pair under the earlier segment in admitted profile order. */
    function add(a: string, b: string): void {
      const left: ISegment = segments.get(a)!;
      const right: ISegment = segments.get(b)!;
      if (left.ordinal < right.ordinal)
        (left.excluded ??= new Set()).add(right.ordinal);
      else (right.excluded ??= new Set()).add(left.ordinal);
    }
  }

  const owners: Map<number, ISegment> = new Map();
  for (const [handle, identity] of bound.colliders) {
    const owner: ISegment | undefined = bodies
      .get(identity.body)
      ?.get(identity.bone);
    if (owner !== undefined) owners.set(handle, owner);
  }

  return (
    first: AutoMovieXpbdCollider,
    second: AutoMovieXpbdCollider,
  ): boolean => !excluded(first.handle, second.handle);

  /**
   * Resolve the same-owner pairs once, keeping the profile lookup for unmapped
   * handles.
   */
  function excluded(first: number, second: number): boolean {
    const left: ISegment | undefined = owners.get(first);
    const right: ISegment | undefined = owners.get(second);
    if (left === undefined || right === undefined)
      return isPhysicalPairExcluded(input, bound, first, second);
    if (left.body !== right.body) return false;
    if (left === right) return true;
    return left.ordinal < right.ordinal
      ? left.excluded?.has(right.ordinal) === true
      : right.excluded?.has(left.ordinal) === true;
  }
}

/** A bound segment owns its provider order and pairs with higher ordinals. */
interface ISegment {
  /** Scene identity of the body the segment belongs to. */
  body: string;

  /** The segment's index in its profile's admitted segment order. */
  ordinal: number;

  /** Ordinals of later segments of the same body this one never touches. */
  excluded?: Set<number>;
}
