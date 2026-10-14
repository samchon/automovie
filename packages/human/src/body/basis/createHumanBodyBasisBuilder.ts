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
import { applyHumanBodyUnderwearMaterial } from "./applyHumanBodyUnderwearMaterial";
import { assertHumanBodyBasis } from "./assertHumanBodyBasis";
import { createHumanBodySurfaceParts } from "./createHumanBodySurfaceParts";
import { createHumanBodyUnderwear } from "./createHumanBodyUnderwear";
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
 * The playground's body editor consumes this builder in a worker. Offline modelling tools supply licensed geometry; replay needs this basis and one admitted document, never a source image. The builder owns revision and document admission, the order of the domain stages and final model validation. A document carrying `anatomy` first has its bound measurements solved into channel weights (`resolveHumanBodyAnatomy`), remembered for the last authored weights and measurements, so the shape it evaluates meets them. It evaluates channels and correctives first, checks authored shoulder reach, and evaluates the shaped landmarks. The shaped landmarks feed `resolveHumanBodyBuildPose`; the shared rest and lean evaluations feed `createHumanBodyAppearance` and `createHumanBodySurfaceParts`; posed toe ray phalanges (`resolveHumanBodyToeRays`) join those transforms for skinning. Underwear is cut from the final skin and lifted along its normals after source and layer readings. Anatomy and contact continue to read the intact skin. The pose resolver owns clinical angles and pelvic rhythm, the appearance stage owns material caches, and the surface stage owns skinning and sag. Keeping their results in this order makes colour, relief, gravity and cloth refer to the same body revision and document state. Explicit `groundPlacement` then places every performed surface, static part and posed bone together against the fixed source floor. Its rest landmarks remain fixed and the person's head follows the placed bones. It is a vertical placement, not joint IK or balance.
 *
 * Ordinary calls prepare new model operands without mutating basis or document. An explicit neutral-only anatomical source supplies its actual held bone/site graph and boundaries beside the same native rest skin; performance requests refuse before geometry rather than implying missing public joint registration. This remains the normal editor/person builder, not a separately appended inspection model. The returned model is static (no skeleton, no skin binding), so the existing Float32 exporter can attempt portable conversion with its own rounding and precision refusal; static status does not imply unchanged admitted export. The rest skeleton and per-bone transforms travel beside it for rig inspection. The builder still does not establish collision-free or physiological movement. Recompiling for a different basis revision creates new appearance and sag caches; no cached result is shared across independent basis builders. The prepare entry lets a composition owner obtain skin and pose before choosing its complete exterior. Completing that prepared build constructs internal source parts and solves their targets once against the supplied exterior. Ordinary calls prepare and complete against the body's own rest skin. Preparation owns one admitted document snapshot, so later caller edits cannot combine already evaluated skin with different anatomy or placement. Its dress operation supplies that admitted choice's shared rest coverage; final composition cuts and lifts fabric without a second body evaluation. The optional physicalSource constructor mode registers actual native indexed incidence or declared canonical source samples before UV gathering. Omission preserves existing metadata absence. Registration changes no coordinates and supplies no clinical tissue certification.
 *
 * Prepared finish and dress callbacks can be called repeatedly: they are not single-use operations or persistent memoized completions. Repeated finish returns new outer model arrays while sharing that preparation's skin part/material records; consumers must retain their read-only ownership rather than assume independent mutable copies. Resident model validation does not establish successful portable export, global collision freedom or clinical/visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Schema and domain admission precede an owned basis/document snapshot; shared shape, pose, appearance and skin stages prepare one exterior before the selected assembly, placement, layers and final garment composition.
 * @evidence contracts/common.md#clear-and-simple-design The callable builder, inspectable construct and prepare/finish composition entries share one pipeline while preserving distinct layer-refusal and exterior-authority responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid revisions, shoulder requests and resident models refuse without mutating caller state; neutral-only source limitations and layer failures remain explicit, and validation does not prove anatomy, collision freedom or rendered success.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies stage order, owned snapshots, static model and accompanying rig, placement versus IK, optional source registration, cache revision and repeated completion limitations.
 * @evidence contracts/performance.md#efficient-algorithms Compilation copies and admits the source once; document work follows sparse shape and topology-sized skin stages plus owning anatomy/assembly/layer costs, and explicit preparation avoids recomputing exterior merely to choose its authority.
 * @evidence contracts/performance.md#reuse-equivalent-work One last shape/anatomy key reuses an equivalent solve, basis appearance/topology caches survive documents, and lazy rest/lean arrays serve the same preparation; repeated finish still rebuilds assembly and is not memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder retains one owned basis, compiled caches and last solve until unreachable; a prepared result retains its admitted snapshot and lazy geometry until released, with no external handles or background tasks owned here.
 */
export function createHumanBodyBasisBuilder(
  input: IAutoMovieHumanBodyBasis,
  options?: IAutoMovieHumanBodyBasisBuilderOptions,
): IHumanBodyBasisBuilder {
  const admittedOptions: IAutoMovieHumanBodyBasisBuilderOptions | undefined =
    options === undefined
      ? undefined
      : typia.assertEquals<IAutoMovieHumanBodyBasisBuilderOptions>(options);
  const source: IAutoMovieHumanBodyBasis =
    typia.assertEquals<IAutoMovieHumanBodyBasis>(input);
  admittedOptions?.observeProgress?.({
    basis: source.id,
    stage: "basis-schema-admitted",
  });
  const basis: IAutoMovieHumanBodyBasis = structuredClone(source);
  admittedOptions?.observeProgress?.({
    basis: basis.id,
    stage: "basis-copied",
  });
  assertHumanBodyBasis(basis, admittedOptions?.endpointSource);
  admittedOptions?.observeProgress?.({
    basis: basis.id,
    stage: "basis-admitted",
  });
  const physicalSource: IAutoMovieHumanBodyBasisBuilderOptions["physicalSource"] =
    admittedOptions?.physicalSource;
  const appearance: ReturnType<typeof createHumanBodyAppearance> =
    createHumanBodyAppearance(basis);
  // the underwear's per-vertex arm weights, on the first document wearing it
  let dress: ReturnType<typeof createHumanBodyUnderwear> | null = null;
  const surfaces: ReturnType<typeof createHumanBodySurfaceParts> =
    createHumanBodySurfaceParts(basis, physicalSource);
  // the last anatomy solve, keyed by the authored weights and measurements it
  // read, so pose, material and history edits do not repeat it
  let solved: IHumanBodyAnatomySolve | undefined;
  const prepare: IHumanBodyBasisBuilder["prepare"] = (
    inputDocument: IAutoMovieHumanBodyBasisDocument,
  ): IHumanBodyPreparedBuild => {
    const admitted: IAutoMovieHumanBodyBasisDocument = structuredClone(
      admitHumanBodyBasisDocument(inputDocument, basis.anatomicalAssembly),
    );
    const progress: (
      stage: IHumanBodyConstructionProgress["stage"],
      details?: Omit<
        IHumanBodyConstructionProgress,
        "basis" | "document" | "stage"
      >,
    ) => void = (
      stage: IHumanBodyConstructionProgress["stage"],
      details?: Pick<
        IHumanBodyConstructionProgress,
        | "part"
        | "path"
        | "completed"
        | "total"
        | "garmentFitting"
        | "garmentSurface"
        | "garmentComponent"
        | "garmentPhase"
        | "garmentRound"
        | "garmentWorkUsed"
        | "garmentWorkBound"
        | "garmentVariables"
        | "garmentRows"
        | "garmentEntries"
        | "garmentMinimumNonzeroCoefficient"
        | "garmentMaximumCoefficient"
        | "garmentFieldResidualMetres"
        | "garmentGeometryFailures"
        | "garmentFittingRound"
        | "garmentProposal"
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
      [admitted.id, admitted.name].some(
        (id: string): boolean => id.trim() === "",
      )
    )
      throw new Error(
        "Body edits need nonempty identities and the exact compiled basis revision.",
      );
    progress("document-admitted");
    let document: IAutoMovieHumanBodyBasisDocument = admitted;
    if (admitted.anatomy !== undefined) {
      const key: string = JSON.stringify([admitted.shape, admitted.anatomy]);
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
    const referenceGoals: ReturnType<
      typeof prepareHumanBodyReferenceGoalDocument
    > = prepareHumanBodyReferenceGoalDocument(basis, document);
    document = referenceGoals.document;
    // an omitted shoulder goal is the shaped body's own rest, which every
    // reader of the goal shares, so the arms are read before the pose weights
    const shoulderRestOf: (
      shape: Record<string, number>,
    ) => ReturnType<typeof resolveHumanBodyShapeShoulderRest> = (
      shape: Record<string, number>,
    ): ReturnType<typeof resolveHumanBodyShapeShoulderRest> =>
      resolveHumanBodyShapeShoulderRest(basis, shape);
    const state: ReturnType<typeof humanBodyBasisWeights> =
      humanBodyBasisWeights(basis, document, shoulderRestOf(document.shape));
    for (const shoulder of document.shoulders ?? []) {
      const contract: IAutoMovieHumanBodyBasis["joints"][number]["shoulder"] =
        basis.joints.find(
          (joint: IAutoMovieHumanBodyBasis["joints"][number]): boolean =>
            joint.bone === shoulder.bone,
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
    const shaped: ReturnType<typeof evaluateHumanBodyShape> =
      evaluateHumanBodyShape(basis, state);
    progress("shape-evaluated");
    // whether the document leaves the rest pose the basis was authored in,
    // and its shape at that rest pose
    const posed: boolean =
      (document.pose ?? []).length > 0 ||
      (document.shoulders ?? []).length > 0 ||
      (document.anatomicalMotion ?? []).length > 0 ||
      (document.toes ?? []).length > 0;
    const atRest: (
      shape: Record<string, number>,
    ) => ReturnType<typeof evaluateHumanBodyShape> = (
      shape: Record<string, number>,
    ): ReturnType<typeof evaluateHumanBodyShape> =>
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
    const restAll: () => ReturnType<
      typeof evaluateHumanBodyShape
    > = (): ReturnType<typeof evaluateHumanBodyShape> =>
      posed ? (restOnce ??= atRest(document.shape)) : shaped;
    const leans: Map<number, number[]> = new Map<number, number[]>();
    const leanOf: (index: number) => number[] = (index: number): number[] => {
      let lean: number[] | undefined = leans.get(index);
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
    }: ReturnType<typeof resolveHumanBodyBuildPose> = resolveHumanBodyBuildPose(
      {
        basis,
        document,
        poseRows: state.pose,
        landmarks: shaped.landmarks,
        rig: referenceGoals.rig,
      },
    );
    progress("pose-evaluated");
    const { materials, coloured }: ReturnType<typeof appearance> = appearance({
      document,
      pose: state.pose,
      restAll,
      leanOf,
    });
    // toe ray phalanges join the humanoid transforms only when one is posed
    const rays: NonNullable<
      IAutoMovieHumanBodyBuild["anatomicalRig"]
    >["toeProjections"] =
      sourceRigResult === undefined
        ? resolveHumanBodyToeRays({
            basis,
            toes: document.toes,
            landmarks: shaped.landmarks,
            transforms,
          })
        : sourceRigResult.toeProjections;
    const { parts, posedSurfaces }: ReturnType<typeof surfaces> = surfaces({
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
    const atlas: ReturnType<typeof createHumanBodyAtlasParts> =
      createHumanBodyAtlasParts({ basis, document, transforms });
    progress("skin-evaluated");
    parts.push(...atlas.parts);
    materials.push(...atlas.materials);
    const sourcePartOffset: number = parts.length;
    const sourceMaterialOffset: number = materials.length;
    // Rest coverage is prepared once; final skin consumers own cutting and lift.
    const garment:
      | ReturnType<ReturnType<typeof createHumanBodyUnderwear>>
      | undefined =
      document.underwear === undefined
        ? undefined
        : (dress ??= createHumanBodyUnderwear(basis))({
            underwear: document.underwear,
            rest: restAll(),
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
    const validation: ReturnType<typeof validateModel> = validateModel({
      model,
    });
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
        .map(
          (
            joint: IAutoMovieHumanBodyBasis["joints"][number],
          ): IAutoMovieHumanBodyBoneTransform => transforms.get(joint.bone)!,
        )
        .map(
          (
            transform: IAutoMovieHumanBodyBoneTransform,
            index: number,
          ): IAutoMovieHumanBodyBuild["bones"][number] => ({
            bone: basis.joints[index].bone,
            rest: transform.rest,
            posed: transform.posed,
          }),
        ),
      landmarks: shaped.landmarks,
    };
    const placedSkin: IAutoMovieHumanBodyBuild =
      document.groundPlacement === undefined
        ? skinBuild
        : placeHumanBodyOnGround({ basis, build: skinBuild });
    const { model: skinModel, ...skin }: typeof placedSkin = placedSkin;
    const wear: IHumanBodyPreparedBuild["wear"] = (
      completed: IAutoMovieHumanBodyBuild,
    ): IAutoMovieHumanBodyBuild => {
      if (garment === undefined) return completed;
      const dressedModel: IAutoMovieModel = {
        ...completed.model,
        parts: completed.model.parts.flatMap(
          (
            part: IAutoMovieModel["parts"][number],
          ): IAutoMovieModel["parts"] => {
            const region: ReturnType<typeof garment.regions.get> =
              garment.regions.get(part.id);
            return region === undefined
              ? [part]
              : applyHumanBodyUnderwearMaterial({
                  part,
                  field: region.field,
                  sources: region.sources,
                  material: garment.material,
                  offsetMetres: garment.offsetMetres,
                });
          },
        ),
        materials: [
          ...completed.model.materials.filter(
            (material: IAutoMovieModel["materials"][number]): boolean =>
              material.id !== garment.material.id,
          ),
          garment.material,
        ],
      };
      const dressedValidation: ReturnType<typeof validateModel> = validateModel(
        { model: dressedModel },
      );
      if (!dressedValidation.success)
        throw new Error(
          "Skin-attached underwear is not a valid resident model: " +
            JSON.stringify(dressedValidation),
        );
      progress("garment-evaluated");
      // Preserve the already evaluated, placed source-region model for the
      // strict contact partition. It is not inserted into rendered geometry.
      return {
        ...completed,
        model: dressedModel,
        sourceSkinModel: completed.sourceSkinModel ?? completed.model,
      };
    };
    return {
      skin: { ...skin, skinModel },
      wear,
      dress: (
        rest: Parameters<IHumanBodyPreparedBuild["dress"]>[0],
      ): ReturnType<IHumanBodyPreparedBuild["dress"]> =>
        document.underwear === undefined
          ? undefined
          : rest === undefined
            ? garment
            : (dress ??= createHumanBodyUnderwear(basis))({
                underwear: document.underwear,
                rest,
              }),
      finish: (
        exteriorRestReference: Parameters<IHumanBodyPreparedBuild["finish"]>[0],
        layers: Parameters<IHumanBodyPreparedBuild["finish"]>[1],
        garmentMode: Parameters<IHumanBodyPreparedBuild["finish"]>[2],
      ): IAutoMovieHumanBodyBuild => {
        const assembly:
          | ReturnType<typeof createHumanBodyAnatomicalAssemblyParts>
          | undefined =
          sourceRigResult === undefined
            ? undefined
            : createHumanBodyAnatomicalAssemblyParts({
                basis,
                document,
                rig: sourceRigResult,
                restSkin: restAll().surfaces[0],
                exteriorRestReference,
                observePartComplete: (
                  part: NonNullable<IHumanBodyConstructionProgress["part"]>,
                  completed: number,
                  total: number,
                ): void =>
                  progress("source-part-completed", { part, completed, total }),
                observeQuantityComplete: (
                  part: NonNullable<IHumanBodyConstructionProgress["part"]>,
                  path: string,
                ): void => progress("source-quantity-read", { part, path }),
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
        const completeValidation: ReturnType<typeof validateModel> =
          validateModel({ model: completeModel });
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
            : {
                anatomicalRig: assembly.rig,
                anatomicalQuantities: assembly.quantities,
              }),
        };
        const placed: IAutoMovieHumanBodyBuild =
          document.groundPlacement === undefined
            ? build
            : placeHumanBodyOnGround({ basis, build });
        const completed: IAutoMovieHumanBodyBuild =
          layers === "defer" ? placed : appendHumanBodyLayers(basis, placed);
        return garmentMode === "defer" ? completed : wear(completed);
      },
    };
  };
  const construct: IHumanBodyBasisBuilder["construct"] = (
    document: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanBodyBuild => prepare(document).finish();
  const build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild = (
    document: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanBodyBuild => {
    const result: IAutoMovieHumanBodyBuild = construct(document);
    if (result.layerAdmission?.accepted === false)
      throw new Error(result.layerAdmission.failures[0].cause);
    return result;
  };
  return Object.assign(build, { prepare, construct });
}
