import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { createHumanFaceScalpTint } from "../hair/createHumanFaceScalpTint";

/**
 * Compile the one rule by which fibres that grow on the face skin tint the
 * skin under them: scalp hair over its growth domain and brow shafts over
 * their band.
 *
 * Both tints say the same thing, the share of the skin a fibre population
 * hides where a view cannot resolve single fibres, as per-vertex RGB gains on
 * the skin's own finish. The scalp owner computes its gains from the
 * hairstyle document; the brow assembly computes its gains from the shafts it
 * emitted. This function multiplies them per vertex and channel, so the face
 * builder attaches one gain field to the skin. A surface only one population
 * tints keeps that population's gains, and a surface neither tints has no
 * entry. The scalp owner's map is the one returned and is extended in place;
 * the brow gains are read only.
 * Both supplied gain buffers must use the same resident XYZ-aligned layout;
 * this combiner does not independently validate their length or optical meaning.
 *
 * @evidence contracts/common.md#principled-implementation Independent scalp and emitted-brow coverage gains multiply channelwise on matching resident skin vertices, leaving surfaces with only one contribution unchanged except for an owned brow-only copy.
 * @evidence contracts/common.md#clear-and-simple-design One combiner owns the product while scalp and brow producers retain their different population/coverage derivations; the builder applies the result to skin finish downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage is a visual fibre proxy, not measured follicle density; matching gain layouts are a producer premise and no foreign method or fixture-specific surface alters the multiplication.
 * @evidence contracts/common.md#meaningful-documentation The comment gives tint ownership, channelwise composition, omitted contributions, read-only brows and the unchecked matching-layout premise.
 * @evidence contracts/performance.md#efficient-algorithms Scalp evaluation includes layer/domain vertex scans; combining brows visits their gain entries once, expected O(B) extra time and owned replacement buffers for matching populations.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiled scalp domain reader is retained across calls, while current hair/materials/brow gains are reevaluated because their finish and coverage inputs may change; no composed result is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns the scalp reader for the builder lifetime; each evaluation returns its owned tint map/buffers and retains no brow input afterward or external task/handle.
 */
export function createHumanFaceFibreTint(
  basis: IAutoMovieHumanFaceBasis,
): (
  hair: IAutoMovieHumanFaceHair | null | undefined,
  materials: readonly IAutoMovieMaterial[],
  brows?: ReadonlyMap<string, readonly number[]>,
) => Map<string, number[]> {
  const scalp: (hair: IAutoMovieHumanFaceHair | null | undefined, materials: readonly IAutoMovieMaterial[]) => Map<string, number[]> = createHumanFaceScalpTint(basis);
  return (hair: IAutoMovieHumanFaceHair | null | undefined, materials: readonly IAutoMovieMaterial[], brows: ReadonlyMap<string, readonly number[]> | undefined): Map<string, number[]>  => {
    const tints: Map<string, number[]> = scalp(hair, materials);
    for (const [surface, gains] of brows ?? []) {
      const resident: number[] | undefined = tints.get(surface);
      tints.set(
        surface,
        resident === undefined
          ? [...gains]
          : resident.map((value: number, at: number): number  => value * gains[at]),
      );
    }
    return tints;
  };
}
