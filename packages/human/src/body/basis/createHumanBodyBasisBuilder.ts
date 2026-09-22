import { resolvePose, validateModel, validatePose } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import typia from "typia";

import { humanFaceBasisRegion } from "../../face/basis/humanFaceBasisRegion";
import { portraitNormals } from "../../face/mesh/portraitNormals";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { assertHumanBodyBasis } from "./assertHumanBodyBasis";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Compile a caller-owned connected body basis into a deterministic builder.
 *
 * The playground's body editor consumes this builder in a worker and exports
 * the resident model through the static exporter. Offline modelling tools
 * supply the licensed geometry; none run here and no photograph is needed for
 * replay. The order per document is fixed and is what the specification
 * states: identity, channels, correctives (`evaluateHumanBodyShape`), then
 * landmarks to a rest skeleton (`resolveHumanBodySkeleton`), then the pose,
 * which is the document's clinical angles with the basis's declared
 * couplings added (`resolveHumanBodyCouplings`, called inside
 * `humanBodyBasisWeights` so the corrective ramps read the same coupled
 * angles), validated against each joint's clinical range and resolved by the
 * engine's forward kinematics with the basis's measured signs, then linear
 * blend skinning (`skinHumanBodySurface`), then common normals and material
 * regions. The couplings are added before validation so a girdle angle the
 * document wrote plus the rhythm an elevated arm adds is refused past the
 * girdle's range rather than clamped, and the document keeps only what the
 * author wrote. The face basis builder is the template; what differs is
 * everything after the shape.
 *
 * A new model owns its arrays and materials; neither basis nor document is
 * mutated. The returned model is static (no skeleton, no skin binding) so the
 * existing Float32 exporter admits it unchanged, and the rest skeleton and
 * per-bone transforms travel beside it for the tools that verify the rig.
 * Skinning does not establish collision-free or physiological movement.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Evaluates named shape edits on one reusable body prior without source images, refusing a document that names another basis revision.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Bends joints by clinical angles, the basis's declared couplings added, checked against their ranges and skins the surface with rigid bone transforms.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Runs the identity, channel, corrective, landmark, skeleton, pose and skin order once per document over an admitted basis.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Validates the sparse clinical pose after the couplings are added, resolves it through the engine with the basis's sign frames and recomputes normals after skinning.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This domain index also covers the editing screen, export and census review; the builder owns evaluation, not the complete authoring workflow.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications This index joins evaluation, measurement, document and later editor boundaries; the builder does not own the browser adapter or the review process.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-editor This renderer-independent evaluator exposes no DOM, camera or file picker; the playground body page binds those to it.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view The builder has no inputs, presets or display state; it evaluates the document the editor commits.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor The builder owns no transaction history or worker; the face editor's state owner and the playground worker do.
 */
export function createHumanBodyBasisBuilder(
  input: IAutoMovieHumanBodyBasis,
): (document: IAutoMovieHumanBodyBasisDocument) => IAutoMovieHumanBodyBuild {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanBodyBasis>(input),
  );
  assertHumanBodyBasis(basis);
  return (inputDocument) => {
    const document =
      typia.assertEquals<IAutoMovieHumanBodyBasisDocument>(inputDocument);
    if (
      document.basis !== basis.id ||
      [document.id, document.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Body edits need nonempty identities and the exact compiled basis revision.",
      );
    const state = humanBodyBasisWeights(basis, document);
    const shaped = evaluateHumanBodyShape(basis, state, document.identity);
    const { skeleton, rest, frames } = resolveHumanBodySkeleton(
      basis,
      shaped.landmarks,
    );
    const pose: IAutoMoviePose = {
      skeleton: skeleton.id,
      root: null,
      joints: state.pose,
    };
    const violations = validatePose({ pose, skeleton });
    if (violations.items.length > 0)
      throw new Error(
        "Body pose violates the skeleton or its clinical ranges: " +
          JSON.stringify(violations.items),
      );
    const transforms = new Map<
      AutoMovieHumanoidBone,
      {
        rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
        posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
      }
    >();
    for (const resolved of resolvePose(pose, skeleton, undefined, frames))
      transforms.set(resolved.bone, {
        rest: rest.get(resolved.bone)!,
        posed: {
          position: resolved.worldPosition,
          rotation: resolved.worldRotation,
        },
      });
    const materials = structuredClone(basis.materials);
    const materialMap = new Map(
      materials.map((material) => [material.id, material]),
    );
    for (const [id, override] of Object.entries(document.materials ?? {})) {
      const material = materialMap.get(id);
      const values = [
        ...Object.values(override.color ?? {}),
        ...(override.roughness === undefined ? [] : [override.roughness]),
      ];
      if (
        material === undefined ||
        values.some(
          (value) => !Number.isFinite(value) || value < 0 || value > 1,
        )
      )
        throw new Error(
          "Body material overrides need existing IDs and finite [0,1] values.",
        );
      if (override.color !== undefined)
        material.baseColor = {
          ...material.baseColor,
          ...override.color,
          hex: null,
        };
      if (override.roughness !== undefined)
        material.roughness = override.roughness;
    }
    const parts = basis.surfaces.flatMap((surface, index) => {
      const positions = skinHumanBodySurface(
        shaped.surfaces[index],
        surface.skin,
        transforms,
      );
      const normals = portraitNormals(positions, surface.indices);
      return surface.regions.map((region) => ({
        id: region.id,
        name: region.id,
        material: region.material,
        geometry: {
          type: "mesh" as const,
          mesh: humanFaceBasisRegion(positions, normals, region),
        },
        attachedBone: null,
        transform: null,
      }));
    });
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials,
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation = validateModel({ model });
    if (!validation.success)
      throw new Error(
        "The evaluated body basis is not a valid resident model: " +
          JSON.stringify(validation),
      );
    return {
      model,
      skeleton,
      bones: basis.joints
        .map((joint) => transforms.get(joint.bone)!)
        .map((transform, index) => ({
          bone: basis.joints[index].bone,
          rest: transform.rest,
          posed: transform.posed,
        })),
      landmarks: shaped.landmarks,
    };
  };
}
