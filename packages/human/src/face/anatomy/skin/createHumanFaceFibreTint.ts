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
 *
 * @evidence contracts/common.md#principled-implementation Gains are multiplicative factors on one albedo, so two independent occluding populations compose by their product, which keeps every gain in [0,1] when each factor is.
 * @evidence contracts/common.md#clear-and-simple-design One composition point; each population keeps its own coverage owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population is special-cased; an absent one contributes the factor one.
 * @evidence contracts/common.md#meaningful-documentation States what the gains mean, who computes each and how they compose.
 * @evidence contracts/modeling.md#shared-boundaries Both tints are stated on the vertices of the same skin surface, so where a temple's scalp hair meets a brow tail neither overwrites the other.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function composes colour gains and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Gains are dimensionless linear RGB factors; no unit or frame is converted.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder that draws the skin observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no authoring input.
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
