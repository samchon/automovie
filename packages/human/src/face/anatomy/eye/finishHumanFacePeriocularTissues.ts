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
 *
 * @evidence contracts/common.md#principled-implementation Actual published source-registered tissue shells retain their source linear colour/roughness through opaque texture-free material copies.
 * @evidence contracts/common.md#clear-and-simple-design Canonical local-model publication owns Float32/TRS geometry while this adapter owns semantic part/material IDs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleared texture/opacity masks reflect absent UVs; colour is a coarse display convention rather than inferred tissue pigmentation.
 * @evidence contracts/common.md#meaningful-documentation The prose states registered finish, unchanged geometry and separate tissue identities.
 * @evidence contracts/performance.md#efficient-algorithms Each tissue performs material lookup, material clone and canonical local-part publication with costs driven by actual records/mesh arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing generated shell/publication data are reused without regenerating tissue geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned parts/material copies; lookup/cloning temporaries expire and input materials remain unchanged.
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
    const source: IAutoMovieMaterial | undefined = materials.find(
      (material: IAutoMovieMaterial): boolean =>
        material.id === basis.periocular?.[part.side].cage?.material,
    );
    if (source === undefined)
      throw new Error(
        "Periocular tissue needs its registered display finish: " + part.side,
      );
    const id: string = "periocular:" + part.side + ":" + part.tissue;
    const finish: IAutoMovieMaterial = structuredClone(source);
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
    result.parts.push(
      createHumanLocalModelPart(
        {
          id,
          name: id,
          material: id,
          geometry: { type: "mesh", mesh: part.mesh },
          attachedBone: null,
          transform: null,
        },
        part.publication,
      ),
    );
  }
  return result;
}
