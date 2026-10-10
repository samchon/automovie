import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { createHumanBodyAnatomicalAssemblyParts } from "../anatomy/assembly/createHumanBodyAnatomicalAssemblyParts";
import { createHumanBodyAtlasParts } from "../anatomy/atlas/createHumanBodyAtlasParts";
import { appendHumanBodyLayers } from "../anatomy/layer/appendHumanBodyLayers";
import { resolveHumanBodyAnatomy } from "../anatomy/resolveHumanBodyAnatomy";
import { admitHumanBodyBasisDocument } from "../document/admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisBuilderOptions } from "../structures/IAutoMovieHumanBodyBasisBuilderOptions";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyBasisBuilder } from "../structures/IHumanBodyBasisBuilder";
import type { IHumanBodyConstructionProgress } from "../structures/IHumanBodyConstructionProgress";
import type { IHumanBodyPreparedBuild } from "../structures/IHumanBodyPreparedBuild";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IHumanBodyAnatomySolve } from "./IHumanBodyAnatomySolve";
import { createHumanBodyAppearance } from "./appearance/createHumanBodyAppearance";
import { assertHumanBodyBasis } from "./assertHumanBodyBasis";
import { createHumanBodySurfaceParts } from "./createHumanBodySurfaceParts";
import { createHumanBodyUnderwear } from "./createHumanBodyUnderwear";
import { applyHumanBodyUnderwearMaterial } from "./applyHumanBodyUnderwearMaterial";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";
import { placeHumanBodyOnGround } from "./placeHumanBodyOnGround";
import { prepareHumanBodyReferenceGoalDocument } from "./prepareHumanBodyReferenceGoalDocument";
import { resolveHumanBodyBuildPose } from "./resolveHumanBodyBuildPose";
import { resolveHumanBodyShapeShoulderRest } from "./resolveHumanBodyShapeShoulderRest";
import { resolveHumanBodyToeRays } from "./resolveHumanBodyToeRays";

/**
 * Compile a caller-owned connected body basis into a deterministic builder.
 *
 * The playground's body editor consumes this builder in a worker. Offline
 * modelling tools supply licensed geometry; replay needs this basis and one
 * admitted document, never a source image. The builder owns revision and
 * document admission, the order of the domain stages and final model
 * validation. A document carrying `anatomy` first has its bound measurements
 * solved into channel weights (`resolveHumanBodyAnatomy`), remembered for
 * the last authored weights and measurements, so the shape it evaluates
 * meets them. It evaluates channels and correctives first, checks authored
 * shoulder reach, and evaluates the shaped landmarks. The shaped landmarks
 * feed `resolveHumanBodyBuildPose`; the shared rest and lean evaluations feed
 * `createHumanBodyAppearance` and `createHumanBodySurfaceParts`; posed toe
 * ray phalanges (`resolveHumanBodyToeRays`) join those transforms for skinning. Underwear is
 * assigned to complementary material regions of the final skin after source
 * and layer readings. The basic garment adds no displaced cloth surface.
 * The pose resolver owns clinical angles and pelvic rhythm, the appearance
 * stage owns material caches, and the surface stage owns skinning and sag.
 * Keeping their results in this order makes colour, relief, gravity and cloth
 * refer to the same body revision and document state.
 * Explicit `groundPlacement` then places every performed surface, static
 * part and posed bone together against the fixed source floor. Its rest
 * landmarks remain fixed and the person's head follows the placed bones.
 * It is a vertical placement, not joint IK or balance.
 *
 * A new model owns its arrays and materials; neither basis nor document is
 * mutated. An explicit neutral-only anatomical source supplies its actual
 * held bone/site graph and boundaries beside the same native rest skin;
 * performance requests refuse before geometry rather than implying missing
 * public joint registration. This remains the normal editor/person builder,
 * not a separately appended inspection model. The returned model is static
 * (no skeleton, no skin binding) so the
 * existing Float32 exporter admits it unchanged. The rest skeleton and
 * per-bone transforms travel beside it for rig inspection. The builder still
 * does not establish collision-free or physiological movement.
 * Recompiling for a different basis revision creates new appearance and sag
 * caches; no cached result is shared across independent basis builders.
 * The `prepare` entry lets a composition owner obtain skin and pose before
 * choosing its complete exterior. Completing that prepared build constructs
 * internal source parts and solves their targets once against the supplied
 * exterior. Ordinary calls prepare and complete against the body's own rest
 * skin. Preparation owns one admitted document snapshot, so later caller edits
 * cannot combine already evaluated skin with different anatomy or placement.
 * Its dress operation supplies that admitted choice's shared rest coverage;
 * final composition partitions its skin without a second body evaluation.
 * The optional physicalSource constructor mode registers actual native
 * indexed incidence or declared canonical source samples before UV gathering.
 * Omission preserves the existing model and metadata absence. Registration
 * changes no coordinates and supplies no clinical tissue certification.
 */
export function createHumanBodyBasisBuilder(
  input: IAutoMovieHumanBodyBasis,
  options?: IAutoMovieHumanBodyBasisBuilderOptions,
): IHumanBodyBasisBuilder {
  const admittedOptions =
    options === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanBodyBasisBuilderOptions>(options);
  const source = typia.assertEquals<IAutoMovieHumanBodyBasis>(input);
  admittedOptions?.observeProgress?.({
    basis: source.id,
    stage: "basis-schema-admitted",
  });
  const basis = structuredClone(source);
  admittedOptions?.observeProgress?.({
    basis: basis.id,
    stage: "basis-copied",
  });
  assertHumanBodyBasis(basis, admittedOptions?.endpointSource);
  admittedOptions?.observeProgress?.({
    basis: basis.id,
    stage: "basis-admitted",
  });
  const physicalSource = admittedOptions?.physicalSource;
  const appearance = createHumanBodyAppearance(basis);
  // the underwear's per-vertex arm weights, on the first document wearing it
  let dress: ReturnType<typeof createHumanBodyUnderwear> | null = null;
  const surfaces = createHumanBodySurfaceParts(basis, physicalSource);
  // the last anatomy solve, keyed by the authored weights and measurements it
  // read, so pose, material and history edits do not repeat it
  let solved: IHumanBodyAnatomySolve | undefined;
  const prepare = (
    inputDocument: IAutoMovieHumanBodyBasisDocument,
  ): IHumanBodyPreparedBuild => {
    const admitted = structuredClone(
      admitHumanBodyBasisDocument(inputDocument, basis.anatomicalAssembly),
    );
    const progress = (
      stage: IHumanBodyConstructionProgress["stage"],
      details?: Pick<
        IHumanBodyConstructionProgress,
        "part" | "path" | "completed" | "total" | "garmentFitting" |
        "garmentSurface" | "garmentComponent" | "garmentPhase" | "garmentRound" |
        "garmentWorkUsed" | "garmentWorkBound" | "garmentVariables" | "garmentRows" |
        "garmentEntries" | "garmentMinimumNonzeroCoefficient" | "garmentMaximumCoefficient" |
        "garmentFieldResidualMetres" | "garmentGeometryFailures" | "garmentFittingRound" | "garmentProposal"
      >,
    ): void =>
      admittedOptions?.observeProgress?.({
        basis: basis.id,
        document: admitted.id,
        stage,
        ...details,
      });
    if (
      admitted.basis !== basis.id ||
      [admitted.id, admitted.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Body edits need nonempty identities and the exact compiled basis revision.",
      );
    progress("document-admitted");
    let document = admitted;
    if (admitted.anatomy !== undefined) {
      const key = JSON.stringify([admitted.shape, admitted.anatomy]);
      if (solved?.key !== key)
        solved = {
          key,
          shape: resolveHumanBodyAnatomy(
            basis,
            admitted.shape,
            admitted.anatomy,
          ),
        };
      document = { ...admitted, shape: { ...solved.shape } };
    }
    const referenceGoals = prepareHumanBodyReferenceGoalDocument(
      basis,
      document,
    );
    document = referenceGoals.document;
    // an omitted shoulder goal is the shaped body's own rest, which every
    // reader of the goal shares, so the arms are read before the pose weights
    const shoulderRestOf = (shape: Record<string, number>) =>
      resolveHumanBodyShapeShoulderRest(basis, shape);
    const state = humanBodyBasisWeights(
      basis,
      document,
      shoulderRestOf(document.shape),
    );
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
    progress("shape-evaluated");
    // whether the document leaves the rest pose the basis was authored in,
    // and its shape at that rest pose
    const posed =
      (document.pose ?? []).length > 0 ||
      (document.shoulders ?? []).length > 0 ||
      (document.anatomicalMotion ?? []).length > 0 ||
      (document.toes ?? []).length > 0;
    const atRest = (shape: Record<string, number>) =>
      evaluateHumanBodyShape(
        basis,
        humanBodyBasisWeights(
          basis,
          {
            shape,
            pose: undefined,
            shoulders: undefined,
          },
          shoulderRestOf(shape),
        ),
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
    const {
      skeleton,
      transforms,
      anatomicalRig: sourceRigResult,
    } = resolveHumanBodyBuildPose({
      basis,
      document,
      poseRows: state.pose,
      landmarks: shaped.landmarks,
      rig: referenceGoals.rig,
    });
    progress("pose-evaluated");
    const { materials, coloured } = appearance({
      document,
      pose: state.pose,
      restAll,
      leanOf,
    });
    // toe ray phalanges join the humanoid transforms only when one is posed
    const rays =
      sourceRigResult === undefined
        ? resolveHumanBodyToeRays({
            basis,
            toes: document.toes,
            landmarks: shaped.landmarks,
            transforms,
          })
        : sourceRigResult.toeProjections;
    const { parts, posedSurfaces } = surfaces({
      document,
      shaped,
      posed,
      transforms:
        rays.size === 0
          ? transforms
          : new Map<string, IAutoMovieHumanBodyBoneTransform>([
              ...transforms,
              ...rays,
            ]),
      restAll,
      leanOf,
      coloured,
    });
    const atlas = createHumanBodyAtlasParts({ basis, document, transforms });
    progress("skin-evaluated");
    parts.push(...atlas.parts);
    materials.push(...atlas.materials);
    const sourcePartOffset = parts.length;
    const sourceMaterialOffset = materials.length;
    // Rest coverage is prepared once; final skin consumers own material clipping.
    const garment = document.underwear === undefined ? undefined
      : (dress ??= createHumanBodyUnderwear(basis))({
          underwear: document.underwear, rest: restAll(),
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
    const skinBuild: IAutoMovieHumanBodyBuild = {
      evaluatedDocument: structuredClone(document),
      ...(sourceRigResult === undefined
        ? {}
        : { anatomicalRig: sourceRigResult }),
      model,
      posedSurfaces,
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
    const placedSkin =
      document.groundPlacement === undefined
        ? skinBuild
        : placeHumanBodyOnGround({ basis, build: skinBuild });
    const { model: skinModel, ...skin } = placedSkin;
    const wear = (completed: IAutoMovieHumanBodyBuild): IAutoMovieHumanBodyBuild => {
      if (garment === undefined) return completed;
      const dressedModel: IAutoMovieModel = {
        ...completed.model,
        parts: completed.model.parts.flatMap((part) => {
          const region = garment.regions.get(part.id);
          return region === undefined ? [part] : applyHumanBodyUnderwearMaterial({
            part, field: region.field, sources: region.sources, material: garment.material,
          });
        }),
        materials: [...completed.model.materials.filter((material) => material.id !== garment.material.id), garment.material],
      };
      const dressedValidation = validateModel({ model: dressedModel });
      if (!dressedValidation.success)
        throw new Error("Skin-attached underwear is not a valid resident model: " + JSON.stringify(dressedValidation));
      progress("garment-evaluated");
      // Preserve the already evaluated, placed source-region model for the
      // strict contact partition. It is not inserted into rendered geometry.
      return { ...completed, model: dressedModel,
        sourceSkinModel: completed.sourceSkinModel ?? completed.model,
      };
    };
    return {
      skin: { ...skin, skinModel },
      wear,
      dress: (rest) => document.underwear === undefined ? undefined
        : rest === undefined ? garment : (dress ??= createHumanBodyUnderwear(basis))({
            underwear: document.underwear, rest,
          }),
      finish: (exteriorRestReference, layers, garmentMode) => {
        const assembly =
          sourceRigResult === undefined
            ? undefined
            : createHumanBodyAnatomicalAssemblyParts({
                basis,
                document,
                rig: sourceRigResult,
                restSkin: restAll().surfaces[0],
                exteriorRestReference,
                observePartComplete: (part, completed, total) =>
                  progress("source-part-completed", { part, completed, total }),
                observeQuantityComplete: (part, path) =>
                  progress("source-quantity-read", { part, path }),
              });
        progress("assembly-evaluated");
        const completeModel: IAutoMovieModel = {
          ...model,
          parts: [
            ...parts.slice(0, sourcePartOffset),
            ...(assembly?.parts ?? []),
            ...parts.slice(sourcePartOffset),
          ],
          materials: [
            ...materials.slice(0, sourceMaterialOffset),
            ...(assembly?.materials ?? []),
            ...materials.slice(sourceMaterialOffset),
          ],
        };
        const completeValidation = validateModel({ model: completeModel });
        if (!completeValidation.success)
          throw new Error(
            "The completed body basis is not a valid resident model: " +
              JSON.stringify(completeValidation),
          );
        progress("model-validated");
        const build: IAutoMovieHumanBodyBuild = {
          ...skinBuild,
          model: completeModel,
          ...(assembly === undefined
            ? {}
            : { anatomicalRig: assembly.rig, anatomicalQuantities: assembly.quantities }),
        };
        const placed = document.groundPlacement === undefined
          ? build
          : placeHumanBodyOnGround({ basis, build });
        const completed = layers === "defer" ? placed : appendHumanBodyLayers(basis, placed);
        return garmentMode === "defer" ? completed : wear(completed);
      },
    };
  };
  const construct = (document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild =>
    prepare(document).finish();
  const build = (document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild => {
    const result = construct(document);
    if (result.layerAdmission?.accepted === false)
      throw new Error(result.layerAdmission.failures[0].cause);
    return result;
  };
  return Object.assign(build, { prepare, construct });
}
