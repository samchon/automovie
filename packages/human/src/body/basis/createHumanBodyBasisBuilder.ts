import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { admitHumanBodyBasisDocument } from "../document/admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { assertHumanBodyBasis } from "./assertHumanBodyBasis";
import { createHumanBodyAppearance } from "./createHumanBodyAppearance";
import { createHumanBodySurfaceParts } from "./createHumanBodySurfaceParts";
import { createHumanBodyUnderwear } from "./createHumanBodyUnderwear";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";
import { resolveHumanBodyBuildPose } from "./resolveHumanBodyBuildPose";

/**
 * Compile a caller-owned connected body basis into a deterministic builder.
 *
 * The playground's body editor consumes this builder in a worker. Offline
 * modelling tools supply licensed geometry; replay needs this basis and one
 * admitted document, never a source image. The builder owns revision and
 * document admission, the order of the domain stages and final model
 * validation. It evaluates channels and correctives first, checks authored
 * shoulder reach, and evaluates the shaped landmarks. The shaped landmarks
 * feed `resolveHumanBodyBuildPose`; the shared rest and lean evaluations feed
 * `createHumanBodyAppearance` and `createHumanBodySurfaceParts`. Underwear is
 * cut from the resulting unsplit posed skin after every material region.
 * The pose resolver owns clinical angles and pelvic rhythm, the appearance
 * stage owns material caches, and the surface stage owns skinning and sag.
 * Keeping their results in this order makes colour, relief, gravity and cloth
 * refer to the same body revision and document state.
 *
 * A new model owns its arrays and materials; neither basis nor document is
 * mutated. The returned model is static (no skeleton, no skin binding) so the
 * existing Float32 exporter admits it unchanged. The rest skeleton and
 * per-bone transforms travel beside it for rig inspection. The builder still
 * does not establish collision-free or physiological movement.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Evaluates named shape edits on one reusable body prior without source images, refusing a document that names another basis revision.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Bends non-humeral joints by clinical angles and each humerus by its total thorax-relative TT goal, range checks both and skins the resulting transforms.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Runs the named channel, corrective, landmark, skeleton, pose and skin order once per document over an admitted basis.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Validates the coupled sparse pose, resolves TT shoulder goals after the girdle and recomputes normals after skinning.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This domain index also covers the editing screen, export and census review; the builder owns evaluation, not the complete authoring workflow.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications This index joins evaluation, measurement, document and later editor boundaries; the builder does not own the browser adapter or the review process.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor The builder owns no transaction history or worker; the face editor's state owner and the playground worker do.
 */
export function createHumanBodyBasisBuilder(
  input: IAutoMovieHumanBodyBasis,
): (document: IAutoMovieHumanBodyBasisDocument) => IAutoMovieHumanBodyBuild {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanBodyBasis>(input),
  );
  assertHumanBodyBasis(basis);
  const appearance = createHumanBodyAppearance(basis);
  // the underwear's per-vertex arm weights, on the first document wearing it
  let dress: ReturnType<typeof createHumanBodyUnderwear> | null = null;
  const surfaces = createHumanBodySurfaceParts(basis);
  return (inputDocument) => {
    const document = admitHumanBodyBasisDocument(inputDocument);
    if (
      document.basis !== basis.id ||
      [document.id, document.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Body edits need nonempty identities and the exact compiled basis revision.",
      );
    const state = humanBodyBasisWeights(basis, document);
    for (const shoulder of document.shoulders ?? []) {
      const contract = basis.joints.find(
        (joint) => joint.bone === shoulder.bone,
      )?.shoulder;
      if (
        contract === undefined ||
        !humanBodyShoulderReaches(contract, shoulder)
      )
        throw new Error(
          "Body shoulder goal exceeds its thorax-tt clinical range: " +
            shoulder.bone,
        );
    }
    const shaped = evaluateHumanBodyShape(basis, state);
    // whether the document leaves the rest pose the basis was authored in,
    // and its shape at that rest pose
    const posed =
      (document.pose ?? []).length > 0 || (document.shoulders ?? []).length > 0;
    const atRest = (shape: Record<string, number>) =>
      evaluateHumanBodyShape(
        basis,
        humanBodyBasisWeights(basis, {
          ...document,
          shape,
          pose: undefined,
          shoulders: undefined,
        }),
      );
    // each is evaluated once, on first use: the document at rest (the
    // shaped body itself when it is not posed) and each surface's lean self
    let restOnce: ReturnType<typeof atRest> | undefined;
    const restAll = () =>
      posed ? (restOnce ??= atRest(document.shape)) : shaped;
    const leans = new Map<number, number[]>();
    const leanOf = (index: number): number[] => {
      let lean = leans.get(index);
      if (lean === undefined) {
        lean = atRest({
          ...document.shape,
          ...basis.surfaces[index].sag!.lean,
        }).surfaces[index];
        leans.set(index, lean);
      }
      return lean;
    };
    const { skeleton, transforms } = resolveHumanBodyBuildPose({
      basis,
      document,
      poseRows: state.pose,
      landmarks: shaped.landmarks,
    });
    const { materials, coloured } = appearance({
      document,
      pose: state.pose,
      restAll,
      leanOf,
    });
    const { parts, posedSurfaces } = surfaces({
      document,
      shaped,
      posed,
      transforms,
      restAll,
      leanOf,
      coloured,
    });
    // the underwear, cut from the posed skin after every skin region
    if (document.underwear !== undefined) {
      const dressed = (dress ??= createHumanBodyUnderwear(basis))({
        underwear: document.underwear,
        rest: restAll(),
        posed: posedSurfaces,
      });
      materials.push(dressed.material);
      parts.push(...dressed.parts);
    }
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
