import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";

/**
 * A lookup from element id to its rest-pose world matrix, tolerant of a record
 * validation has not accepted.
 *
 * Each element's world matrix is its parent's world matrix times its own TRS,
 * column-major, with every moving panel and carriage at its authored rest
 * transform rather than displaced by an operating state; that is where a hole
 * and its fill are, whatever state a door is shown in. The lookup answers
 * `null` for an id the record does not declare, for an element with a missing
 * ancestor, and for an element whose parent chain closes on itself. Prop
 * placement reads it because it runs beside `validateBuiltEnvironment` and must
 * report its own defects on a record that validation is refusing in the same
 * pass, where {@link builtEnvironmentWorldMatrices} would throw. An id
 * declared twice resolves to its first declaration, as a `find` would; the
 * duplicate is validation's to refuse. Matrices are computed on first request
 * and memoized for the life of the lookup, so a lookup must not outlive a
 * change to the record it was made from.
 *
 * @param environment The building record, validated or not.
 * @returns A lookup from element id to world matrix or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Memoizes column-major affine products of local TRS matrices. Products preserve composed shear rather than certifying representable world TRS; non-finite arithmetic is not refused here. A visiting set terminates parent cycles with null, while an excessively deep acyclic chain can still exceed the runtime call stack.
 * @evidence contracts/common.md#clear-and-simple-design The rest-pose, failure-tolerant counterpart of `builtEnvironmentWorldMatrices`, kept separate because prop placement needs rest poses and `null` answers on unvalidated records where staging needs operated poses and validated input; it replaces a private copy in each prop query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element or opening; a missing or cyclic ancestor is answered by the stated `null` rule rather than caught from a throw, and operating states are ignored for every element alike.
 * @evidence contracts/common.md#meaningful-documentation States the composition order and matrix layout, that operating states are ignored and why, each `null` case, why it tolerates unvalidated records and how that differs from the operated-pose staging, the first-declaration rule for a duplicate id, and the memoization's lifetime.
 * @evidence contracts/performance.md#efficient-algorithms O(E + Q) across index construction and Q lookups, with at most O(E) matrix products and parent-link visits. Missing-id requests still cost lookups; recursion depth follows hierarchy depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one lookup every ancestor's matrix is computed once and reused by all its descendants and by every later request; across lookups nothing is shared, because the record is the caller's mutable data.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the id index and the memo for as long as the caller holds the lookup, bounded by one entry and one sixteen-number matrix per element, and both are released when the lookup is dropped.
 */
export const builtElementRestMatrices: (
  environment: IAutoMovieBuiltEnvironment,
) => (id: string) => number[] | null = (
  environment: IAutoMovieBuiltEnvironment,
): ((id: string) => number[] | null) => {
  const byId: Map<string, IAutoMovieBuiltElement> = new Map();
  for (const element of environment.elements)
    if (!byId.has(element.id)) byId.set(element.id, element);
  const memo: Map<string, number[] | null> = new Map();
  const visiting: Set<string> = new Set();
  const read: (id: string) => number[] | null = (
    id: string,
  ): number[] | null => {
    const cached: number[] | null | undefined = memo.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return null;
    const element: IAutoMovieBuiltElement | undefined = byId.get(id);
    if (element === undefined) return null;
    visiting.add(id);
    const local: number[] = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    const parent: number[] | null =
      element.parent === null ? null : read(element.parent);
    visiting.delete(id);
    const world: number[] | null =
      element.parent === null
        ? local
        : parent === null
          ? null
          : Matrix4.multiply(parent, local);
    memo.set(id, world);
    return world;
  };
  return read;
};
