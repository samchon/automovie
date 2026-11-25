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
 * pass, where {@link builtEnvironmentWorldMatrices} would throw. An id declared
 * twice resolves to its first declaration, as a `find` would; the duplicate is
 * validation's to refuse. Matrices are computed on first request and memoized
 * for the life of the lookup, so a lookup must not outlive a change to the
 * record it was made from.
 *
 * @param environment The building record, validated or not.
 * @returns A lookup from element id to world matrix or `null`.
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
