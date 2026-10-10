import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSkinRegionAppearance } from "../../structures/IAutoMovieHumanFaceSkinRegionAppearance";

/**
 * Expand named shared-area reflectance into the skin's resident gain buffers.
 * The connected builder multiplies these with legacy pigmentation and fibre
 * gains before the existing albedo admission. Membership belongs to the licensed
 * immutable basis; unknown areas refuse, including zero-strength requests.
 * Areas compose in lexical order. Triangle interpolation supplies the boundary
 * transition at the source resolution; this does not invent pore detail or prove
 * a smooth pigment boundary beyond that resolution. Inputs remain caller-owned.
 */
export function createHumanFaceSkinRegionGains(
  basis: IAutoMovieHumanFaceBasis,
  input: Record<string, IAutoMovieHumanFaceSkinRegionAppearance> | undefined,
): Map<string, number[]> {
  const result = new Map<string, number[]>();
  const skinOwners = new Set(
    [
      basis.contact?.lips.surface,
      basis.periocular?.left.cage?.surface,
      basis.periocular?.right.cage?.surface,
    ].filter((surface): surface is string => surface !== undefined),
  );
  for (const name of Object.keys(input ?? {}).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    const value = input![name];
    if (
      value.gain.length !== 3 ||
      value.gain.some((gain) => !Number.isFinite(gain) || gain < 0) ||
      !Number.isFinite(value.strength) ||
      value.strength < 0 ||
      value.strength > 1
    )
      throw new Error(
        "Named skin appearance needs nonnegative RGB gains and strength in [0,1]: " +
          name,
      );
    const area = basis.skinRegions?.[name];
    const surface =
      area === undefined ? undefined : basis.surfaces[area.surface];
    if (
      area === undefined ||
      surface === undefined ||
      area.vertices.length === 0
    )
      throw new Error(
        "Named skin appearance needs a resident shared area: " + name,
      );
    if (!skinOwners.has(surface.id))
      throw new Error(
        "Named skin appearance requires the registered continuous skin host: " +
          name,
      );
    let gains = result.get(surface.id);
    if (gains === undefined) {
      gains = new Array<number>(surface.positions.length).fill(1);
      result.set(surface.id, gains);
    }
    for (const vertex of area.vertices) {
      if (
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        3 * vertex + 2 >= gains.length
      )
        throw new Error(
          "Named skin area needs resident vertex identities: " + name,
        );
      for (let channel = 0; channel < 3; channel++)
        gains[3 * vertex + channel] *=
          1 + value.strength * (value.gain[channel] - 1);
    }
  }
  return result;
}
