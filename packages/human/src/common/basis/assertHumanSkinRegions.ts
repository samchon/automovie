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
 * @evidence contracts/common.md#principled-implementation Areas are checked once at basis admission, so a rule never reads an index the basis does not hold or a side that overlaps its mirror.
 * @evidence contracts/common.md#clear-and-simple-design One pass over each area, then one pass over each right/left pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-range, unsorted, empty or overlapping area refuses instead of being repaired.
 * @evidence contracts/common.md#meaningful-documentation States every condition, the pairing by name, the refusal and the shared owner.
 * @evidence contracts/modeling.md#spatial-conventions Admits indices into the basis's own surfaces.
 * @evidence contracts/modeling.md#part-identity-and-grouping A side's area is disjoint from its mirror's, so one vertex never belongs to both sides.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The conditions are topological, not anatomical.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function assertHumanSkinRegions(
  basis: IAutoMovieHumanSkinRegionHolder,
): void {
  const regions = basis.skinRegions ?? {};
  for (const [name, region] of Object.entries(regions)) {
    if (name in Object.prototype)
      throw new Error(
        `The basis ${basis.id} names a skin region after an inherited property: ${name}`,
      );
    const surface = basis.surfaces[region.surface];
    if (surface === undefined)
      throw new Error(
        `The skin region ${name} of ${basis.id} is not on a declared surface.`,
      );
    if (region.vertices.length === 0)
      throw new Error(
        `The skin region ${name} of ${basis.id} lists no vertex.`,
      );
    region.vertices.forEach((vertex, k) => {
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
    const mirror = `${name.slice(0, -"-right".length)}-left`;
    const left = Object.hasOwn(regions, mirror) ? regions[mirror] : undefined;
    if (left === undefined || left.surface !== right.surface) continue;
    const held = new Set(right.vertices);
    const shared = left.vertices.find((vertex) => held.has(vertex));
    if (shared !== undefined)
      throw new Error(
        `The skin regions ${name} and ${mirror} of ${basis.id} share vertex ${shared}.`,
      );
  }
}
