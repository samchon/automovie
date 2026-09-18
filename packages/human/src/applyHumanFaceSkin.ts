import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceSkin } from "./IAutoMovieHumanFaceSkin";

/**
 * Give a built face the observed appearance authored for it.
 *
 * The result is a new model whose named materials carry the supplied maps.
 * Geometry, parts, part order and every material this appearance does not name
 * are untouched, so a face keeps its shape and an export written against the
 * untextured model finds the same surfaces in the same places.
 *
 * A mapped material also loses its base colour, which is the one change that is
 * not merely additive. The rendered colour is the factor times the map, so a
 * material still carrying an estimated skin colour would multiply it into a map
 * that already observed that skin: the face comes back darker and more
 * saturated than the photograph it was painted from, once for every channel.
 * The map is the colour, so the factor becomes white.
 *
 * A map for a material this face does not carry refuses. Ignoring it would
 * leave an author looking at an unchanged face with no way to tell whether the
 * appearance failed to load, named the wrong surface, or was applied and simply
 * looks like that.
 *
 * This applies an observation. The map was painted from one photograph through
 * one fitted camera, so what it carries is that view of that person under that
 * light, not a measured reflectance and not a likeness judgement.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Replaces an authored appearance profile without disturbing the shape it is worn on.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Applies complete map replacement over the resident material identities.
 * @author Samchon
 */
export function applyHumanFaceSkin(props: {
  model: IAutoMovieModel;
  skin: IAutoMovieHumanFaceSkin;
}): IAutoMovieModel {
  const resident = new Set(props.model.materials.map((item) => item.id));
  for (const id of Object.keys(props.skin.maps))
    if (resident.has(id) === false)
      throw new Error(
        "An appearance names a material this face does not carry: " + id,
      );
  return {
    ...props.model,
    materials: props.model.materials.map((material) => {
      const map = props.skin.maps[material.id];
      return map === undefined
        ? material
        : {
            ...material,
            baseColor: { r: 1, g: 1, b: 1, a: material.baseColor.a, hex: null },
            baseColorTexture: map.baseColorTexture,
          };
    }),
  };
}
