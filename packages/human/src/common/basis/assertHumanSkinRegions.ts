import type { IAutoMovieHumanSkinRegionHolder } from "./IAutoMovieHumanSkinRegionHolder";

/**
 * Admit a basis's named skin areas. Every name is an own, non-inherited key;
 * every area lies on a declared surface and lists at least one vertex of it,
 * strictly increasing. Two areas named as the right and left of one feature
 * (`<feature>-right` and `<feature>-left`) on the same surface share no
 * vertex, because the two sides of one body hold no skin in common. Each
 * violation refuses by name. Face and body bases admit theirs through this one
 * owner.
 *
 * @evidence contracts/common.md#principled-implementation Admits nonempty increasing integer vertex lists, then requires same-surface named right/left feature pairs to have disjoint membership.
 * @evidence contracts/common.md#clear-and-simple-design Common admission owns membership and bilateral nonsharing; measurement instruments retain stable region names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documented -right/-left feature suffix rule does not conflate different surfaces or synthesize missing companions.
 * @evidence contracts/common.md#meaningful-documentation Documents increasing-list admission, same-surface pairing and name-specific refusals.
 * @evidence contracts/performance.md#efficient-algorithms For R regions and V listed vertices, passes and paired set lookups cost O(R+V); a right-side set is built only for its present same-surface companion.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads current membership without rediscovering skin geometry; mutable region lists are not memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Entry arrays and temporary paired-vertex sets are bounded by this call; no basis, handle or task is retained.
 */
export function assertHumanSkinRegions(
  basis: IAutoMovieHumanSkinRegionHolder,
): void {
  const regions: NonNullable<IAutoMovieHumanSkinRegionHolder["skinRegions"]> =
    basis.skinRegions ?? {};
  for (const [name, region] of Object.entries(regions)) {
    if (name in Object.prototype)
      throw new Error(
        `The basis ${basis.id} names a skin region after an inherited property: ${name}`,
      );
    const surface:
      | IAutoMovieHumanSkinRegionHolder["surfaces"][number]
      | undefined = basis.surfaces[region.surface];
    if (surface === undefined)
      throw new Error(
        `The skin region ${name} of ${basis.id} is not on a declared surface.`,
      );
    if (region.vertices.length === 0)
      throw new Error(
        `The skin region ${name} of ${basis.id} lists no vertex.`,
      );
    region.vertices.forEach((vertex: number, k: number): void => {
      if (
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        vertex * 3 + 2 >= surface.positions.length
      )
        throw new Error(
          `The skin region ${name} of ${basis.id} lists ${vertex}, which is not a vertex of its surface.`,
        );
      if (k > 0 && vertex <= region.vertices[k - 1])
        throw new Error(
          `The skin region ${name} of ${basis.id} does not list its vertices strictly increasing at ${vertex}.`,
        );
    });
  }
  for (const [name, right] of Object.entries(regions)) {
    if (!name.endsWith("-right")) continue;
    const mirror: string = `${name.slice(0, -"-right".length)}-left`;
    const left:
      | NonNullable<IAutoMovieHumanSkinRegionHolder["skinRegions"]>[string]
      | undefined = Object.hasOwn(regions, mirror)
      ? regions[mirror]
      : undefined;
    if (left === undefined || left.surface !== right.surface) continue;
    const held: Set<number> = new Set(right.vertices);
    const shared: number | undefined = left.vertices.find(
      (vertex: number): boolean => held.has(vertex),
    );
    if (shared !== undefined)
      throw new Error(
        `The skin regions ${name} and ${mirror} of ${basis.id} share vertex ${shared}.`,
      );
  }
}
