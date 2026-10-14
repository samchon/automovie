import { tessellateToMesh, validateModel } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { placeMeshPreservingFaces } from "../../../common/mesh/placeMeshPreservingFaces";
import type { IAutoMovieHumanBodyArticularCandidate } from "../generated/IAutoMovieHumanBodyArticularCandidate";
import type { IAutoMovieHumanBodyArticularCandidateModelProps } from "./IAutoMovieHumanBodyArticularCandidateModelProps";

/**
 * Draw the inspected target spheres, without substituting a whole body skin.
 *
 * Existing engine sphere tessellation and the face-preserving placement owner supply absolute metre coordinates once for both preview and static export. Source pole redundancy retains the shared precision policy. The finish is provisional diagnostic appearance, not measured articular tissue. The numerical request page displays these candidates with their qualification.
 *
 * @evidence contracts/common.md#principled-implementation Engine sphere tessellation and face-preserving placement generate static metre-space candidate meshes after primitive admission; final validation checks the emitted model.
 * @evidence contracts/common.md#clear-and-simple-design A single model builder owns candidate display and export geometry, delegating mesh topology and placement to their existing engine and Human owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed grey finish is explicitly diagnostic, and redundant sphere poles follow the existing shared precision policy rather than fixture-specific vertex repair.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre placement, static export parity, provisional appearance and the distinction between target spheres and whole-body skin.
 * @evidence contracts/performance.md#efficient-algorithms For H candidates and V tessellated vertices, model construction and validation scan O(HV) geometry; primitive and final checks cover distinct admitted representations and temporary meshes scale with output.
 * @evidence contracts/performance.md#reuse-equivalent-work All candidates share one material record within the model; tessellations are independent because their radii and centres vary, and no cross-call mesh cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned model owns its material and mesh arrays; provisional primitive parts and validation records are call-local, and failure leaves no retained GPU resources.
 */
export function createHumanBodyArticularCandidateModel(
  props: IAutoMovieHumanBodyArticularCandidateModelProps,
): IAutoMovieModel {
  // Neutral linear-RGB diagnostic finish, not measured articular reflectance.
  const material: IAutoMovieMaterial = {
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
    parts: props.inspection.candidates.map(
      (head: IAutoMovieHumanBodyArticularCandidate): IAutoMovieModelPart => ({
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
      }),
    ),
    materials: [material],
    skeleton: null,
    body: null,
    asset: null,
  };
  // Primitive admission owns finite positive radius and finite placement;
  // mesh topology's redundant-pole policy is not radius admission.
  const dimensions: ReturnType<typeof validateModel> = validateModel({ model });
  if (!dimensions.success)
    throw new Error(
      "Invalid articular candidate dimensions: " + JSON.stringify(dimensions),
    );
  model.parts = model.parts.map(
    (part: IAutoMovieModelPart, index: number): IAutoMovieModelPart => ({
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
    }),
  );
  const validation: ReturnType<typeof validateModel> = validateModel({ model });
  if (!validation.success)
    throw new Error(
      "Invalid articular candidate model: " + JSON.stringify(validation),
    );
  return model;
}
