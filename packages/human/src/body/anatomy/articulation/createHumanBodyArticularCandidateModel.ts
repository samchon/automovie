import { tessellateToMesh, validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { placeMeshPreservingFaces } from "../../../common/mesh/placeMeshPreservingFaces";
import type { IAutoMovieHumanBodyArticularCandidateModelProps } from "./IAutoMovieHumanBodyArticularCandidateModelProps";

/**
 * Draw the inspected target spheres, without substituting a whole body skin.
 *
 * Existing engine sphere tessellation and the face-preserving placement owner
 * supply absolute metre coordinates once for both preview and static export.
 * Source pole redundancy retains the shared precision policy. The finish is
 * provisional diagnostic appearance, not measured articular tissue. The
 * numerical request page displays these candidates with their qualification.
 */
export function createHumanBodyArticularCandidateModel(
  props: IAutoMovieHumanBodyArticularCandidateModelProps,
): IAutoMovieModel {
  // Neutral linear-RGB diagnostic finish, not measured articular reflectance.
  const material = {
    id: "articular-inspection",
    name: "Provisional inspection finish",
    baseColor: { r: 0.7, g: 0.7, b: 0.7, a: 1, hex: null },
    roughness: 0.75,
    metallic: 0,
    opacity: 1,
    emissive: null,
    baseColorTexture: null,
    doubleSided: true,
  };
  const model: IAutoMovieModel = {
    id: props.id,
    name: props.name,
    origin: "imported",
    parts: props.inspection.candidates.map((head) => ({
      id: head.part + "/head-candidate",
      name: head.part + " target head candidate",
      geometry: {
        type: "primitive",
        shape: { type: "sphere", radius: head.radiusMetres },
      },
      material: material.id,
      attachedBone: null,
      transform: {
        translation: { ...head.center },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    })),
    materials: [material],
    skeleton: null,
    body: null,
    asset: null,
  };
  // Primitive admission owns finite positive radius and finite placement;
  // mesh topology's redundant-pole policy is not radius admission.
  const dimensions = validateModel({ model });
  if (!dimensions.success)
    throw new Error(
      "Invalid articular candidate dimensions: " + JSON.stringify(dimensions),
    );
  model.parts = model.parts.map((part, index) => ({
    ...part,
    geometry: {
      type: "mesh",
      mesh: placeMeshPreservingFaces(
        tessellateToMesh({
          type: "sphere",
          radius: props.inspection.candidates[index].radiusMetres,
        }),
        { translation: props.inspection.candidates[index].center },
      ),
    },
    transform: null,
  }));
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error(
      "Invalid articular candidate model: " + JSON.stringify(validation),
    );
  return model;
}
