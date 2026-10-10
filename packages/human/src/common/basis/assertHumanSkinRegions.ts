import type { IAutoMovieHumanSkinRegionHolder } from "./IAutoMovieHumanSkinRegionHolder";

/**
 * Admit a basis's named skin areas. Every name is an own, non-inherited key;
 * every area lies on a declared surface and lists at least one vertex of it,
 * strictly increasing. Two areas named as the right and left of one feature
 * (`<feature>-right` and `<feature>-left`) on the same surface share no
 * vertex, because the two sides of one body hold no skin in common. Each
 * violation refuses by name. Face and body bases admit theirs through this one
 * owner.
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
