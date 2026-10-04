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
 *
 * @evidence contracts/common.md#principled-implementation The shared primitive tessellator and placement guard create the same static source meshes for preview and export; model admission runs before returning caller-owned geometry.
 * @evidence contracts/common.md#clear-and-simple-design One model composes candidate spheres with one diagnostic finish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No skin or complete bone is inserted to conceal unavailable geometry and source pole faces are not filtered in human.
 * @evidence contracts/common.md#meaningful-documentation States absolute placement, precision ownership and the diagnostic finish's meaning.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each static part identifies one inspected head candidate, distinct from its complete bone.
 * @evidence contracts/modeling.md#parameter-channels The radius and centre are computed inspection output; the model does not introduce independent authoring controls.
 * @evidence contracts/modeling.md#emitted-geometry The engine's fixed 16-by-12 sphere grid emits 221 vertices and 384 triangles per candidate, including redundant poles; one to four admitted targets emit one to four meshes without a human-specific subdivision formula.
 * @evidence contracts/modeling.md#spatial-conventions Placement produces absolute metre positions in the reference frame and null part transforms prevent a second centre application.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Independent inspection spheres make no tissue join or contact claim.
 * @evidence contracts/modeling.md#rendered-observation The numerical request page displays this candidate-only model through the existing body viewport; its qualification remains distinct from whole-body or bone acceptance.
 * @evidence contracts/anatomy.md#anatomical-source A target sphere at a reference rig centre is a geometric candidate, never a registered bone surface or measured material.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inspection owner admits targets; this adapter validates emitted model structure rather than anatomical ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It consumes generated inspection records, not personal authored meshes.
 */
export function createHumanBodyArticularCandidateModel(
  props: IAutoMovieHumanBodyArticularCandidateModelProps,
): IAutoMovieModel {
  // Neutral linear-RGB diagnostic finish, not measured articular reflectance.
  const material = {
    id: "articular-inspection",
    name: "Provisional inspection finish",
    baseColor: { r: .7, g: .7, b: .7, a: 1, hex: null },
    roughness: .75,
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
      geometry: { type: "primitive", shape: { type: "sphere", radius: head.radiusMetres } },
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
    throw new Error("Invalid articular candidate dimensions: " + JSON.stringify(dimensions));
  model.parts = model.parts.map((part, index) => ({
    ...part,
    geometry: { type: "mesh", mesh: placeMeshPreservingFaces(
      tessellateToMesh({ type: "sphere", radius: props.inspection.candidates[index].radiusMetres }),
      { translation: props.inspection.candidates[index].center },
    ) },
    transform: null,
  }));
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error("Invalid articular candidate model: " + JSON.stringify(validation));
  return model;
}
