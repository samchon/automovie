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
 * @evidence contracts/common.md#principled-implementation Uses the registered finish and actual generator meshes without guessing tissue colour or reusing an unrelated UV atlas.
 * @evidence contracts/common.md#clear-and-simple-design One composition owner emits parts and finishes together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source finishes refuse rather than silently selecting the first skin material.
 * @evidence contracts/common.md#meaningful-documentation Names the coarse appearance convention and exact geometry reuse.
 * @evidence contracts/modeling.md#part-identity-and-grouping Stable side and tissue role IDs identify all generated members.
 * @evidence contracts/modeling.md#spatial-conventions Publishes the producer's local mesh with its compensating ordinary part translation; internal head-frame geometry remains unchanged.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Copies already generated and Float32-admitted shell meshes without choosing another geometry population.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no shape, performance or anatomical control.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The shell generator owns capped boundaries; finishing preserves them exactly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source display painting does not supply a biological tissue colour claim.
 * @evidenceExclude contracts/anatomy.md#permitted-range Geometry admission belongs to the generator.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no anatomical input.
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
