import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSkinRegionAppearance } from "../../structures/IAutoMovieHumanFaceSkinRegionAppearance";
import type { IAutoMovieHumanSkinRegion as IAutoMovieHumanSkinRegionImported, IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../../index";


/**
 * Expand named shared-area reflectance into the skin's resident gain buffers.
 * The connected builder multiplies these with legacy pigmentation and fibre
 * gains before the existing albedo admission. Membership belongs to the licensed
 * immutable basis; unknown areas refuse, including zero-strength requests.
 * Areas compose in lexical order. Triangle interpolation supplies the boundary
 * transition at the source resolution; this does not invent pore detail or prove
 * a smooth pigment boundary beyond that resolution. Inputs remain caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation Named basis-owned skin areas select resident vertices; lexically ordered strength-blended nonnegative RGB multipliers accumulate on registered continuous skin owners, with downstream albedo admission rather than biological pigment inference.
 * @evidence contracts/common.md#clear-and-simple-design The owner expands area membership into one gain buffer per touched skin surface; legacy pigmentation, fibre gains and final material lifting retain their separate existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-strength requests still validate named membership, hosts and vertices; unknown/empty/non-skin areas and invalid gain/strength refuse without clipping or repainting unrelated source surfaces.
 * @evidence contracts/common.md#meaningful-documentation The prose states immutable membership, lexical composition, source-resolution limits, caller ownership and downstream gain composition.
 * @evidence contracts/performance.md#efficient-algorithms For A requested names, sorting costs O(A log A); touched buffers initialize O(V) entries once per surface and area membership visits each declared vertex/XYZ gain once, without a full-triangle scan per area.
 * @evidence contracts/performance.md#reuse-equivalent-work Overlapping areas reuse the same invocation's surface gain buffer; current requested values are composed afresh because a matching area name alone does not imply equal reflectance or strength.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result maps/buffers belong to the caller and scale with touched resident surfaces; failed admission returns no result, and borrowed basis/input records are neither changed nor retained globally.
 */
export function createHumanFaceSkinRegionGains(
  basis: IAutoMovieHumanFaceBasis,
  input: Record<string, IAutoMovieHumanFaceSkinRegionAppearance> | undefined,
): Map<string, number[]> {
  const result: Map<string, number[]> = new Map<string, number[]>();
  const skinOwners: Set<string> = new Set(
    [
      basis.contact?.lips.surface,
      basis.periocular?.left.cage?.surface,
      basis.periocular?.right.cage?.surface,
    ].filter((surface: string | undefined): surface is string => surface !== undefined),
  );
  for (const name of Object.keys(input ?? {}).sort((a: string, b: string): 0 | 1 | -1  =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    const value: IAutoMovieHumanFaceSkinRegionAppearance = input![name];
    if (
      value.gain.length !== 3 ||
      value.gain.some((gain: number): boolean  => !Number.isFinite(gain) || gain < 0) ||
      !Number.isFinite(value.strength) ||
      value.strength < 0 ||
      value.strength > 1
    )
      throw new Error(
        "Named skin appearance needs nonnegative RGB gains and strength in [0,1]: " +
          name,
      );
    const area: IAutoMovieHumanSkinRegionImported | undefined = basis.skinRegions?.[name];
    const surface: IAutoMovieHumanFaceBasisSurfaceImported | undefined =
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
    let gains: number[] | undefined = result.get(surface.id);
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
      for (let channel: number = 0; channel < 3; channel++)
        gains[3 * vertex + channel] *=
          1 + value.strength * (value.gain[channel] - 1);
    }
  }
  return result;
}
