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
 */
export function createHumanFaceFibreTint(
  basis: IAutoMovieHumanFaceBasis,
): (
  hair: IAutoMovieHumanFaceHair | null | undefined,
  materials: readonly IAutoMovieMaterial[],
  brows?: ReadonlyMap<string, readonly number[]>,
) => Map<string, number[]> {
  const scalp = createHumanFaceScalpTint(basis);
  return (hair, materials, brows) => {
    const tints = scalp(hair, materials);
    for (const [surface, gains] of brows ?? []) {
      const resident = tints.get(surface);
      tints.set(
        surface,
        resident === undefined
          ? [...gains]
          : resident.map((value, at) => value * gains[at]),
      );
    }
    return tints;
  };
}
