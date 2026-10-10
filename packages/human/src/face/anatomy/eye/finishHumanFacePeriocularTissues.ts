import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

import { createHumanLocalModelPart } from "../../../common/mesh/createHumanLocalModelPart";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFacePeriocularTissuePart } from "./structures/IHumanFacePeriocularTissuePart";

/**
 * Publish the actual tissue shells with their registered source host finish.
 * Texture coordinates are absent, so texture and opacity masks are removed;
 * source linear colour and roughness remain a declared coarse display convention
 * rather than inferred tarsal, muscular, septal or conjunctival pigmentation.
 * No geometry is regenerated and each semantic tissue keeps its own part ID.
 */
export function finishHumanFacePeriocularTissues(
  basis: IAutoMovieHumanFaceBasis,
  generated: readonly IHumanFacePeriocularTissuePart[],
  materials: readonly IAutoMovieMaterial[],
): Pick<IAutoMovieModel, "parts" | "materials"> {
  const result: Pick<IAutoMovieModel, "parts" | "materials"> = {
    parts: [],
    materials: [],
  };
  for (const part of generated) {
    const source = materials.find(
      (material) =>
        material.id === basis.periocular?.[part.side].cage?.material,
    );
    if (source === undefined)
      throw new Error(
        "Periocular tissue needs its registered display finish: " + part.side,
      );
    const id = "periocular:" + part.side + ":" + part.tissue;
    const finish = structuredClone(source);
    finish.id = id;
    finish.name = id;
    finish.baseColorTexture = null;
    finish.normalTexture = null;
    finish.occlusionTexture = null;
    finish.metallicRoughnessTexture = null;
    finish.opacity = 1;
    finish.alphaMode = "opaque";
    finish.doubleSided = false;
    finish.baseColor.a = 1;
    result.materials.push(finish);
    result.parts.push(createHumanLocalModelPart({
      id,
      name: id,
      material: id,
      geometry: { type: "mesh", mesh: part.mesh },
      attachedBone: null,
      transform: null,
    }, part.publication));
  }
  return result;
}
