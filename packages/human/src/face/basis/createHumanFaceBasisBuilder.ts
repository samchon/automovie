import { validateModel } from "@automovie/engine";
import { createMeshPhysicalPartitionMatcher } from "@automovie/engine/math/createMeshPhysicalPartitionMatcher";
import type { IAutoMovieModel, IAutoMovieMaterial as IAutoMovieMaterialImported, IAutoMovieValidation as IAutoMovieValidationImported, IAutoMovieMesh as IAutoMovieMeshImported } from "@automovie/interface";
import typia from "typia";

import { buildHumanFaceBrowAssembly } from "../anatomy/brow/buildHumanFaceBrowAssembly";
import { createHumanFaceIrisPigment } from "../anatomy/eye/createHumanFaceIrisPigment";
import { assertHumanFaceLashContact } from "../anatomy/lash/assertHumanFaceLashContact";
import { buildHumanFaceLashRows } from "../anatomy/lash/buildHumanFaceLashRows";
import { readHumanFaceLashClearance } from "../anatomy/lash/readHumanFaceLashClearance";
import type { IHumanFaceOralMeasurementRegistration } from "../anatomy/oral/IHumanFaceOralMeasurementRegistration";
import { admitHumanFaceAnatomicalRequest } from "../anatomy/resolution/admitHumanFaceAnatomicalRequest";
import { assertHumanFaceJawCapacity } from "../anatomy/resolution/assertHumanFaceJawCapacity";
import { assertHumanFaceMeasurementTargets } from "../anatomy/resolution/assertHumanFaceMeasurementTargets";
import { createHumanFaceMeasurementContext } from "../anatomy/resolution/createHumanFaceMeasurementContext";
import { readHumanFaceMeasurements } from "../anatomy/resolution/readHumanFaceMeasurements";
import { createHumanFaceFibreTint } from "../anatomy/skin/createHumanFaceFibreTint";
import { createHumanFaceSkinRegionGains } from "../anatomy/skin/createHumanFaceSkinRegionGains";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisBuilder } from "../structures/IAutoMovieHumanFaceBasisBuilder";
import type { IAutoMovieHumanFaceBasisBuilderOptions } from "../structures/IAutoMovieHumanFaceBasisBuilderOptions";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFaceConstructionStage } from "./IHumanFaceConstructionStage";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { assertHumanFacePeriocularAvailable } from "./assertHumanFacePeriocularAvailable";
import { bakeHumanFaceOcclusion } from "./bakeHumanFaceOcclusion";
import { createHumanFaceBasisPoseCache } from "./createHumanFaceBasisPoseCache";
import { createHumanFaceBasisPoseEvaluator } from "./createHumanFaceBasisPoseEvaluator";
import { createHumanFaceClearanceCheck } from "./createHumanFaceClearanceCheck";
import { createHumanFaceConstructionEntries } from "./createHumanFaceConstructionEntries";
import { createHumanFaceFibrePigment } from "./createHumanFaceFibrePigment";
import { createHumanFaceGeneratedComposition } from "./createHumanFaceGeneratedComposition";
import { createHumanFaceHairComposition } from "./createHumanFaceHairComposition";
import type { IHumanFaceHairContactLayout } from "../anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";
import { createHumanFaceOcclusionCache } from "./createHumanFaceOcclusionCache";
import { createHumanFaceResidentParts } from "./createHumanFaceResidentParts";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { liftHumanFaceColours } from "./liftHumanFaceColours";
import { publishHumanFaceConstruction } from "./publishHumanFaceConstruction";
import { readHumanFaceAssemblyClearances } from "./readHumanFaceAssemblyClearances";
import { readHumanFaceOralLiningSpace } from "./readHumanFaceOralLiningSpace";
import { readHumanFacePartCensus } from "./readHumanFacePartCensus";
import { resolveHumanFaceAppearanceDocument } from "./resolveHumanFaceAppearanceDocument";
import type { IAutoMovieHumanFaceHair as IAutoMovieHumanFaceHairImported, IAutoMovieHumanFaceIris as IAutoMovieHumanFaceIrisImported, IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported, IHumanConstructionCheck as IHumanConstructionCheckImported, IAutoMovieHumanConstructionClearanceReading as IAutoMovieHumanConstructionClearanceReadingImported, AutoMovieHumanFaceMeasurementReading as AutoMovieHumanFaceMeasurementReadingImported, IAutoMovieHumanFaceMeasurementTarget as IAutoMovieHumanFaceMeasurementTargetImported, IAutoMovieHumanConstructionPartReading as IAutoMovieHumanConstructionPartReadingImported } from "../../index";

import type { IHumanFaceGeneratedCompositionInput as IHumanFaceGeneratedCompositionInputImported } from "./IHumanFaceGeneratedCompositionInput";
import type { IHumanFacePoseGeometry as IHumanFacePoseGeometryImported } from "./IHumanFacePoseGeometry";
import type { IHumanFacePoseResult as IHumanFacePoseResultImported } from "./IHumanFacePoseResult";
import type { IHumanFaceResidentPartsInput as IHumanFaceResidentPartsInputImported } from "./IHumanFaceResidentPartsInput";
import type { IHumanFaceResidentParts as IHumanFaceResidentPartsImported } from "./IHumanFaceResidentParts";
import type { IHumanFaceBrowAssembly as IHumanFaceBrowAssemblyImported } from "../anatomy/brow/IHumanFaceBrowAssembly";
import type { IHumanFaceLashRow as IHumanFaceLashRowImported } from "../anatomy/lash/structures/IHumanFaceLashRow";
import type { IHumanFaceResidentPart as IHumanFaceResidentPartImported } from "./IHumanFaceResidentPart";
import type { IHumanFaceResidentSourceRegion as IHumanFaceResidentSourceRegionImported } from "./IHumanFaceResidentSourceRegion";
import type { IHumanFacePeriocularMappingReading as IHumanFacePeriocularMappingReadingImported } from "../anatomy/eye/structures/IHumanFacePeriocularMappingReading";
import type { IHumanFacePeriocularTissuePart as IHumanFacePeriocularTissuePartImported } from "../anatomy/eye/structures/IHumanFacePeriocularTissuePart";


/**
 * Compile a caller-owned connected facial prior into a deterministic builder.
 * The playground's connected-basis editor consumes this builder and exports its
 * resident model through exportHumanFace. Offline modelling tools supply the
 * licensed geometry; none run here and no source photo is needed for replay.
 *
 * One construction stage creates every requested part before the original
 * physical admission tasks run. The ordinary callable still refuses and
 * publishes no successful observers on failed admission. Its explicit
 * `construct` method returns the same complete geometry with every refusal,
 * so a product construction draft can display it without becoming accepted.
 * `construct` always carries the unchanged judged relations. With
 * `options.census`, it also carries report-only spatial relations and the
 * census of each part; the ordinary callable runs the same conditions.
 *
 * The order per document is fixed:
 * channel weights and corrective activations (`humanFaceBasisWeights`), then
 * the rest layer of every surface and landmark (`evaluateHumanFaceRest`:
 * `p + sum(|weight| * endpoint) + sum(activation * corrective)`, the closure
 * channel of a contact basis excepted), then the articulation read off the
 * shaped landmarks (`resolveHumanFaceArticulation`), then on a contact basis
 * the apertures of the posed vertex pairs (`measureHumanFaceAperture`) and
 * the closure rows added to the rest layer scaled by weight and aperture
 * ratio, then each attached surface posed through its sparse weights
 * (`poseHumanFaceSurface`), then soft tissue held outside the dental
 * colliders (`resolveHumanFaceContact`), then final apertures and the tongue's
 * passage judged on those corrected positions (`evaluateHumanFacePassage`),
 * then common normals and region
 * separation. Shape is identity, a joint's centre is identity, and the
 * expression rows of an articulated basis are rest-space residuals over the
 * joint motion, so a mandibular arch stays a rigid body on the arc at every
 * fraction of opening and the lips, lining and tongue bound to it take the
 * same transform before their own tissue rows are added. A basis without
 * articulation evaluates the same rest layer and poses nothing, which is the
 * purely linear prior; a basis without contact omits its rigid-contact and
 * passage stage while common normals and downstream composition still run.
 * A sourceSpan uses the pose owner's separate fixed closure-zero/one native
 * paths with identical other inputs, refinement replay, one source endpoint
 * blend and then the same rigid contact, passage and normal stages. The
 * legacy aperture-scaled residual above remains the path without sourceSpan.
 *
 * The pose evaluator owns that sequence in one module. The builder retains
 * only the latest channel-weight vector and its posed positions, contact
 * summary and common normals. An appearance-only change reuses those arrays,
 * while each emitted region still gathers owned copies. Hair is generated
 * again when the pose or its own numerical layers change; other edits receive
 * a copy of the last generated cards and finish. Shape or expression changes
 * replace the cached pose. Observers receive a copy of the contact summary
 * so they cannot modify a later reused report. A hair result is certified only
 * after the complete resident model passes validateModel. On a certified hit,
 * the current base model still takes the model gate, and the part/material ID
 * collision check still runs before composition; the engine's model validator
 * has no cross-part geometry test beyond references and unique IDs.
 *
 * Pigmentation is sampled on immutable neutral source coordinates, then
 * gathered with the same region correspondence; the scalp under a hair
 * document's populations is tinted toward the hair colour by
 * `createHumanFaceFibreTint`, as a further gain on it. It changes no position or
 * normal and follows both shape and articulated expression. A document's iris
 * pigments repaint only the anatomical iris disc of the eye texture
 * (`createHumanFaceIrisPigment`) after the material overrides, so an override
 * of the eye's colour still multiplies the repainted texture. Fields contain no
 * image data. A new model owns its arrays and materials; neither basis nor
 * edits mutate. Source materials retain their authored scattering; facial
 * construction adds no implicit skin finish. Model structure and materials
 * are admitted on the prepared
 * neutral. Registered surfaces gather their canonical physical samples through
 * the region's UV table in the document instance and source-generation domain.
 * Opposite contact samples stay distinct; UV and normal aliases keep one ID.
 * Repeated edits check connectivity, source meaning and the current legacy
 * partition; a changed partition takes the full model gate again. Finite
 * normal construction and channel/material domains remain per-edit checks.
 *
 * Export still admits Float32. The contact stage establishes only the floor
 * rule it states and the passage it refuses; the crossing census still
 * measures the rest. An `observe` callback receives each successful build's
 * contact summary, or null on a basis without contact, so a runtime can
 * report it without evaluating twice.
 *
 * With `occlusion`, each alpha-mode-classified opaque material
 * with UVs of the finished face (before any hair) takes the ambient
 * occlusion baked from the evaluated geometry (`bakeHumanFaceOcclusion`) as
 * its occlusion texture. The resulting image is reused while the admitted
 * pose and actual opaque mesh-material population stay the same. Generated
 * brow and lash profiles enter the pose identity; composed material alpha
 * modes enter the opaque population. Colour and roughness do not change these
 * bake inputs. Without the option no texture is baked.
 *
 * A skin field that
 * lightens a region past its material (a gain over one) is folded into the
 * material's base colour so vertex colours stay in [0, 1] and every albedo
 * is kept (`liftHumanFaceColours`); an albedo past one refuses.
 *
 * @evidence contracts/common.md#principled-implementation Exact-schema admission and a private basis clone fix source connectivity before the shared pose, appearance, generated-part and physical-check stages. Neutral model admission establishes reusable structural partitions; each current document still supplies admitted domains, source correspondence and unchanged original physical checks, without proving clinical anatomy or viewer acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One compiled stage is shared by the callable and construct entries; pose, resident gathers, generated finish, hair and publication have distinct current owners while this builder coordinates their required order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching physical partition skips only established structural model work, never the original contact/measurement checks. Drafts retain refusals, generated ids remain checked, authored source endpoints remain authored motion, and no unavailable source or GPU evidence is manufactured.
 * @evidence contracts/common.md#meaningful-documentation Prose explains source ownership, fixed pose/contact/appearance order, neutral admission, draft versus publish behavior, observer copies, cache equivalence, AO approximation and unchanged normalized albedo products.
 * @evidence contracts/performance.md#efficient-algorithms Compilation clones/admit-scans the full basis and builds one neutral; edits pay weight/key scans, current owned gathers/materials, original physical checks and any invalidated geometry/texture/hair work. Downstream costs include margin solves, source replay, spatial queries and AO rays, so cache coordination does not remove their population-dependent cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Latest geometry is keyed by admitted weights/profiles; source gathers and painting factories belong to the fixed clone, structural matchers verify current partitions, AO includes opaque membership, and hair includes pose/numerical layers. Current observers and admission conditions remain request-specific effects rather than cached successes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned builder retains its private source, compiled gathers, current matchers and bounded latest pose/AO/hair entries plus fixed-palette texture caches. Replacements release old internal references; caller-held models/drafts remain caller-owned, and no viewer/worker/GPU handle is acquired.
 */
export function createHumanFaceBasisBuilder(
  input: IAutoMovieHumanFaceBasis,
  options?: IAutoMovieHumanFaceBasisBuilderOptions,
): IAutoMovieHumanFaceBasisBuilder {
  const basis: IAutoMovieHumanFaceBasis = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceBasis>(input),
  );
  assertHumanFaceBasis(basis);
  const composeHair: (document: IAutoMovieHumanFaceBasisDocument, positions: ReadonlyMap<string, readonly number[]>, pose: object, model: IAutoMovieModel, progress?: (owner: string) => void, contactLayouts?: Map<string, IHumanFaceHairContactLayout>) => string[] = createHumanFaceHairComposition(basis);
  const fibreTint: (hair: IAutoMovieHumanFaceHairImported | null | undefined, materials: readonly IAutoMovieMaterialImported[], brows?: ReadonlyMap<string, readonly number[]>) => Map<string, number[]> = createHumanFaceFibreTint(basis);
  const irisPigment: (iris: IAutoMovieHumanFaceIrisImported | null | undefined, materials: IAutoMovieMaterialImported[], excludedOwners?: ReadonlySet<string>) => void = createHumanFaceIrisPigment(basis);
  const fibrePigment: (overrides: IAutoMovieHumanFaceBasisDocument["materials"], materials: IAutoMovieMaterialImported[]) => void = createHumanFaceFibrePigment();
  const composeGenerated: (input: IHumanFaceGeneratedCompositionInputImported) => void = createHumanFaceGeneratedComposition(basis);
  const evaluatePose: (state: ReturnType<typeof humanFaceBasisWeights>, shape: IAutoMovieHumanFaceBasisDocument["shape"], geometry?: IHumanFacePoseGeometryImported, progress?: (owner: string) => void) => IHumanFacePoseResultImported = createHumanFaceBasisPoseCache(
    basis.channels,
    createHumanFaceBasisPoseEvaluator(basis),
  );
  const occlusion: { rays: number; size: number; } | undefined =
    options?.occlusion === undefined ? undefined : { ...options.occlusion };
  const bakeOcclusion: ((pose: object, model: IAutoMovieModel) => Map<string, string>) | undefined =
    occlusion === undefined
      ? undefined
      : createHumanFaceOcclusionCache((model: IAutoMovieModel): Map<string, string>  =>
          bakeHumanFaceOcclusion(model, occlusion),
        );
  const gatherResidentParts: (input: IHumanFaceResidentPartsInputImported) => IHumanFaceResidentPartsImported = createHumanFaceResidentParts(basis);
  let partitions:
    | ReturnType<typeof createMeshPhysicalPartitionMatcher>[]
    | undefined;
  const stage: (inputDocument: IAutoMovieHumanFaceBasisDocument) => IHumanFaceConstructionStage = (
    inputDocument: IAutoMovieHumanFaceBasisDocument,
  ): IHumanFaceConstructionStage => {
    const document: IAutoMovieHumanFaceBasisDocument = resolveHumanFaceAppearanceDocument(
      basis,
      typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(inputDocument),
    );
    if (
      document.basis !== basis.id ||
      [document.id, document.name].some((id: string): boolean  => id.trim() === "")
    )
      throw new Error(
        "Facial edits need nonempty identities and the exact compiled basis revision.",
      );
    const geometryProgress: (owner: string) => void = (owner: string): void =>
      options?.observeConstructionProgress?.({
        documentId: document.id,
        basis: document.basis,
        phase: "geometry-owner-finished",
        geometryOwner: owner,
      });
    const surfaceIds: Set<string> = new Set(basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported): string  => surface.id));
    for (const id of Object.keys(document.skin ?? {}))
      if (!surfaceIds.has(id))
        throw new Error("Pigmentation needs a resident basis surface: " + id);
    assertHumanFacePeriocularAvailable(basis, document);
    if (document.anatomical !== undefined)
      admitHumanFaceAnatomicalRequest(document.anatomical);
    const state: { weights: Map<string, number>; activations: { target: string; activation: number; shapeOnly: boolean; }[]; } = humanFaceBasisWeights(basis, document);
    const materials: IAutoMovieMaterialImported[] = structuredClone(basis.materials);
    const materialMap: Map<string, IAutoMovieMaterialImported> = new Map(
      materials.map((material: IAutoMovieMaterialImported): [string, IAutoMovieMaterialImported]  => [material.id, material]),
    );
    for (const [id, override] of Object.entries(document.materials ?? {})) {
      const material: IAutoMovieMaterialImported | undefined = materialMap.get(id);
      const values: number[] = [
        ...Object.values(override.color ?? {}),
        ...(override.roughness === undefined ? [] : [override.roughness]),
      ];
      if (
        material === undefined ||
        values.some(
          (value: number): boolean  => !Number.isFinite(value) || value < 0 || value > 1,
        )
      )
        throw new Error(
          "Facial material overrides need existing IDs and finite [0,1] values.",
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
    fibrePigment(document.materials, materials);
    irisPigment(
      document.iris,
      materials,
      document.eyes === undefined
        ? undefined
        : new Set(["leftEye", "rightEye"]),
    );
    const pose: IHumanFacePoseResultImported = evaluatePose(
      state,
      document.shape,
      document,
      options?.observeConstructionProgress === undefined ? undefined : geometryProgress,
    );
    geometryProgress("pose");
    const checks: IHumanConstructionCheckImported[] = [...pose.checks];
    checks.push({
      owner: "oral-sampling",
      assert: (): void  => {
        const unresolved: number = pose.oral?.liningUnresolvedEdges ?? 0;
        if (unresolved > 0)
          throw new Error(
            "Oral lining retains " +
              unresolved +
              " unresolved cervical-spacing or collar-chord edges.",
          );
      },
    });
    const { positions: posed, summary }: IHumanFacePoseResultImported = pose;
    const brows: IHumanFaceBrowAssemblyImported | undefined =
      document.brows === undefined
        ? undefined
        : ((): IHumanFaceBrowAssemblyImported  => {
            if (pose.reference === undefined)
              throw new Error(
                "Brow assembly needs its actual shape-only source reference.",
              );
            const resting: IHumanFaceBrowAssemblyImported = buildHumanFaceBrowAssembly(
              basis,
              pose.reference,
              document,
              materials,
              "rest",
              pose.reference,
            );
            checks.push(...resting.checks);
            const performed: IHumanFaceBrowAssemblyImported = buildHumanFaceBrowAssembly(
              basis,
              posed,
              document,
              materials,
              "performed",
              pose.reference,
            );
            checks.push(...performed.checks);
            return performed;
          })();
    if (brows !== undefined) geometryProgress("brows");
    const lashes: IHumanFaceLashRowImported[] | undefined =
      document.lashes === undefined
        ? undefined
        : buildHumanFaceLashRows(
            basis,
            state,
            posed,
            document.lashes,
            document.id,
            pose.optics,
          );
    if (lashes !== undefined) geometryProgress("lashes");
    if (lashes !== undefined)
      checks.push(
        createHumanFaceClearanceCheck(
          "lash-clearance",
          "Lash shaft penetrates its optical exterior or its free skin",
          (): IAutoMovieHumanConstructionClearanceReadingImported[]  => readHumanFaceLashClearance(basis, posed, lashes, pose.optics),
        ),
        {
          owner: "lash-structure",
          assert: (): void  => assertHumanFaceLashContact(lashes),
        },
      );
    const replacedLashes: Set<string> = new Set((lashes ?? []).map((row: IHumanFaceLashRowImported): string  => row.region));
    const oralRegistration: IHumanFaceOralMeasurementRegistration | undefined =
      pose.oral === undefined ||
      (options?.observeOralMeasurements === undefined &&
        options?.observeMeasurements === undefined &&
        document.anatomical === undefined)
        ? undefined
        : {
            generation: pose.oral.generation,
            dentalNativeSha256: pose.oral.dentalNativeSha256,
            dentalSurface: pose.oral.dentalSurface,
            absentDentalVertices: [...pose.oral.absentDentalVertices],
          };
    const readings: AutoMovieHumanFaceMeasurementReadingImported[] =
      options?.observeMeasurements !== undefined ||
      document.anatomical !== undefined
        ? readHumanFaceMeasurements(
            createHumanFaceMeasurementContext(basis, posed, {
              optics: pose.optics,
              reference: pose.reference,
              lashes,
              oral: oralRegistration,
              brows,
            }),
            document.anatomical,
          )
        : [];
    checks.push({
      owner: "measurement-targets",
      assert: (): void  =>
        assertHumanFaceMeasurementTargets(
          readings,
          (document.anatomical?.targets ?? []).map(
            (target: IAutoMovieHumanFaceMeasurementTargetImported): string  => target.measurement,
          ),
        ),
    });
    checks.push({
      owner: "jaw-capacity",
      assert: (): void  => assertHumanFaceJawCapacity(readings, document.anatomical),
    });
    const tints: Map<string, number[]> = fibreTint(document.hair, materials, brows?.tints);
    const skinGains: Map<string, number[]> = createHumanFaceSkinRegionGains(
      basis,
      document.skinAppearance,
    );
    const browReplacements: ReadonlyMap<string, ReadonlySet<number>> =
      brows?.replacements ?? new Map<string, Set<number>>();
    const { parts, evaluated, sourceRegions }: IHumanFaceResidentPartsImported = gatherResidentParts({
      document,
      pose,
      browReplacements,
      replacedLashes,
      fibreTints: tints,
      skinGains,
    });
    geometryProgress("source-regions");
    // Before validation, which a fixed weld partition may skip: a vertex
    // colour never leaves [0, 1].
    liftHumanFaceColours(parts, materialMap);
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
    const materialAttachments: Map<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>> = new Map<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>();
    composeGenerated({
      document,
      pose,
      lashes,
      brows,
      model,
      materialMap,
      checks,
      materialAttachments,
    });
    geometryProgress("generated-composition");
    // Admission reads these on the delivered model, after hair is composed.
    checks.push(
      createHumanFaceClearanceCheck(
        "oral-lining",
        "Oral lining intersects a dental crown",
        (): IAutoMovieHumanConstructionClearanceReadingImported[]  => readHumanFaceOralLiningSpace({ basis, pose, model }),
      ),
    );
    if (options?.census === true)
      checks.push({
        owner: "assembly-census",
        assert: (): undefined  => undefined,
        read: (): IAutoMovieHumanConstructionClearanceReadingImported[]  => readHumanFaceAssemblyClearances({ basis, pose, model }),
        census: (): IAutoMovieHumanConstructionPartReadingImported[]  => readHumanFacePartCensus(model),
      });
    // Fixed indices, UVs, references and resident finishes were admitted on the
    // neutral. Explicit source meaning and alias agreement, connectivity and
    // the current legacy partition govern reuse. Contact coordinates alone
    // cannot merge registered opposite points. After a fresh admission, capture
    // its actual instance rather than retaining the constructor's neutral ID.
    if (
      partitions === undefined ||
      partitions.length !== parts.length ||
      parts.some((part: IHumanFaceResidentPartImported, index: number): boolean  => !partitions![index](part.geometry.mesh))
    ) {
      const validation: IAutoMovieValidationImported = validateModel({ model });
      if (!validation.success)
        throw new Error(
          "The evaluated facial basis is not a valid resident model: " +
            JSON.stringify(validation),
        );
      partitions = parts.map((part: IHumanFaceResidentPartImported): (candidate: IAutoMovieMeshImported) => boolean  =>
        createMeshPhysicalPartitionMatcher(part.geometry.mesh),
      );
    }
    if (bakeOcclusion !== undefined)
      for (const [id, uri] of bakeOcclusion(pose, model))
        materialMap.get(id)!.occlusionTexture = uri;
    if (bakeOcclusion !== undefined) geometryProgress("occlusion");
    const hairContactLayouts: Map<string, IHumanFaceHairContactLayout> = new Map<string, IHumanFaceHairContactLayout>();
    const hairPartIds: string[] = composeHair(document, evaluated, pose, model, geometryProgress, hairContactLayouts);
    const value: { model: IAutoMovieModel; hairPartIds: string[]; hairContactLayouts: Map<string, IHumanFaceHairContactLayout>; materialAttachments: Map<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>; reference: ReadonlyMap<string, readonly number[]> | undefined; oral: IHumanFaceOralMeasurementRegistration | undefined; sourceRegions: readonly IHumanFaceResidentSourceRegionImported[]; browReplacements: ReadonlyMap<string, ReadonlySet<number>>; } = {
      model,
      hairPartIds,
      hairContactLayouts,
      materialAttachments,
      reference: pose.reference,
      oral: oralRegistration,
      sourceRegions,
      browReplacements,
    };
    return {
      value,
      checks,
      publish: (): void  =>
        publishHumanFaceConstruction(options, value, summary, readings),
      readMappings: (): { subject: string; reading: IHumanFacePeriocularMappingReadingImported; }[]  =>
        (pose.periocularTissues ?? []).flatMap((part: IHumanFacePeriocularTissuePartImported): { subject: string; reading: IHumanFacePeriocularMappingReadingImported; }[]  =>
          part.readMapping === undefined
            ? []
            : [
                {
                  subject: "periocular:" + part.side + ":" + part.tissue,
                  reading: part.readMapping(),
                },
              ],
        ),
    };
  };
  const build: IAutoMovieHumanFaceBasisBuilder = createHumanFaceConstructionEntries(
    stage,
    options?.observeConstructionProgress,
  );
  build({
    id: basis.id,
    name: basis.id,
    basis: basis.id,
    shape: {},
    expression: {},
  });
  return build;
}
