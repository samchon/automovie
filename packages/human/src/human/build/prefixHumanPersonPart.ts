import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * A face or body part placed in the person model: its id, name and material
 * under the owner's prefix, carrying the given mesh.
 *
 * Face and body parts share ids such as `skin`, so the person model names
 * every part and material after its owner (`face:skin`, `body:skin`).
 */
export function prefixHumanPersonPart(
  owner: "face" | "body",
  part: IAutoMovieModel["parts"][number],
  mesh: IAutoMovieMesh,
): IAutoMovieModel["parts"][number] {
  return {
    ...part,
    id: owner + ":" + part.id,
    name: owner + ":" + part.name,
    material: owner + ":" + part.material,
    geometry: { type: "mesh", mesh },
  };
}
