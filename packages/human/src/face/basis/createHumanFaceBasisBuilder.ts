import { validateModel } from "@automovie/engine";
import { createMeshPhysicalPartitionMatcher } from "@automovie/engine/math/createMeshPhysicalPartitionMatcher";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { applyHumanSkinFinish } from "../../common/skin/applyHumanSkinFinish";
import { buildHumanFaceBrowAssembly } from "../anatomy/brow/buildHumanFaceBrowAssembly";
import { createHumanFaceIrisPigment } from "../anatomy/eye/createHumanFaceIrisPigment";
import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createHumanFaceHairResultCache } from "../anatomy/hair/createHumanFaceHairResultCache";
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
import { createHumanFaceOcclusionCache } from "./createHumanFaceOcclusionCache";
import { createHumanFaceResidentParts } from "./createHumanFaceResidentParts";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { liftHumanFaceColours } from "./liftHumanFaceColours";
import { publishHumanFaceConstruction } from "./publishHumanFaceConstruction";
import { readHumanFaceAssemblyClearances } from "./readHumanFaceAssemblyClearances";
import { readHumanFaceOralLiningSpace } from "./readHumanFaceOralLiningSpace";
import { readHumanFacePartCensus } from "./readHumanFacePartCensus";
import { resolveHumanFaceAppearanceDocument } from "./resolveHumanFaceAppearanceDocument";

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
 * purely linear prior; a basis without contact stops after posing.
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
 * edits mutate. Model structure and materials are admitted on the prepared
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
 * With `occlusion`, each opaque material
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
 * @evidence contracts/common.md#principled-implementation The pose owner distinguishes legacy closure from fixed native/replayed source endpoints before rigid contact, passage and normals. Reuse is keyed by the inputs each stage reads: admitted geometry for pose, pose identity plus actual opaque material population for occlusion, and pose plus hair layers for hair. Each edit checks source incidence, alias agreement, legacy coordinate equivalence and coordinate-collapsed triangle participation; a change takes full model admission again.
 * @evidence contracts/common.md#clear-and-simple-design An orchestrator: it holds the caches and calls one named owner per stage; no stage's formula lives in it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached hair result is certified only after the full model passes validateModel, and identity collisions with resident geometry refuse; nothing is special-cased for a subject or a document.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the stage order with each owner, what is retained between edits, what is admitted once and per edit, and the limits of the contact stage.
 * @evidence contracts/modeling.md#emitted-geometry Each edit emits the basis's resident triangles split into their declared material regions plus generated hair; the count follows the basis and the numerical hair layers' own resolution parameters, not the number of authored controls.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the Y-up +Z-anterior head frame throughout; colour multipliers are linear RGB in [0,1] after liftHumanFaceColours.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The builder carries no anatomical value of its own; the stages that do (articulation, contact) answer for it.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of controls is delegated to humanFaceBasisWeights and the stage owners; the builder bounds no anatomical quantity itself.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The builder consumes a compact document of named channel weights, materials and layers; it defines no input, and the document schema owns the input vocabulary.
 */
export function createHumanFaceBasisBuilder(
  input: IAutoMovieHumanFaceBasis,
  options?: IAutoMovieHumanFaceBasisBuilderOptions,
): IAutoMovieHumanFaceBasisBuilder {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceBasis>(input),
  );
  assertHumanFaceBasis(basis);
  const buildHair = createHumanFaceHairResultCache(
    createHumanFaceHairBuilder(basis),
  );
  const fibreTint = createHumanFaceFibreTint(basis);
  const irisPigment = createHumanFaceIrisPigment(basis);
  const fibrePigment = createHumanFaceFibrePigment();
  const composeGenerated = createHumanFaceGeneratedComposition(basis);
  const evaluatePose = createHumanFaceBasisPoseCache(
    basis.channels,
    createHumanFaceBasisPoseEvaluator(basis),
  );
  const occlusion =
    options?.occlusion === undefined ? undefined : { ...options.occlusion };
  const bakeOcclusion =
    occlusion === undefined
      ? undefined
      : createHumanFaceOcclusionCache((model) =>
          bakeHumanFaceOcclusion(model, occlusion),
        );
  const gatherResidentParts = createHumanFaceResidentParts(basis);
  let partitions:
    | ReturnType<typeof createMeshPhysicalPartitionMatcher>[]
    | undefined;
  const stage = (
    inputDocument: IAutoMovieHumanFaceBasisDocument,
  ): IHumanFaceConstructionStage => {
    const document = resolveHumanFaceAppearanceDocument(
      basis,
      typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(inputDocument),
    );
    if (
      document.basis !== basis.id ||
      [document.id, document.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Facial edits need nonempty identities and the exact compiled basis revision.",
      );
    const surfaceIds = new Set(basis.surfaces.map((surface) => surface.id));
    for (const id of Object.keys(document.skin ?? {}))
      if (!surfaceIds.has(id))
        throw new Error("Pigmentation needs a resident basis surface: " + id);
    assertHumanFacePeriocularAvailable(basis, document);
    if (document.anatomical !== undefined)
      admitHumanFaceAnatomicalRequest(document.anatomical);
    const state = humanFaceBasisWeights(basis, document);
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
    applyHumanSkinFinish(materials);
    const pose = evaluatePose(state, document.shape, document);
    const checks = [...pose.checks];
    checks.push({
      owner: "oral-sampling",
      assert: () => {
        const unresolved = pose.oral?.liningUnresolvedEdges ?? 0;
        if (unresolved > 0)
          throw new Error(
            "Oral lining retains " +
              unresolved +
              " unresolved cervical-spacing or collar-chord edges.",
          );
      },
    });
    const { positions: posed, summary } = pose;
    const brows =
      document.brows === undefined
        ? undefined
        : (() => {
            if (pose.reference === undefined)
              throw new Error(
                "Brow assembly needs its actual shape-only source reference.",
              );
            const resting = buildHumanFaceBrowAssembly(
              basis,
              pose.reference,
              document,
              materials,
              "rest",
              pose.reference,
            );
            checks.push(...resting.checks);
            const performed = buildHumanFaceBrowAssembly(
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
    const lashes =
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
    if (lashes !== undefined)
      checks.push(
        createHumanFaceClearanceCheck(
          "lash-clearance",
          "Lash shaft penetrates its optical exterior or its free skin",
          () => readHumanFaceLashClearance(basis, posed, lashes, pose.optics),
        ),
        {
          owner: "lash-structure",
          assert: () => assertHumanFaceLashContact(lashes),
        },
      );
    const replacedLashes = new Set((lashes ?? []).map((row) => row.region));
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
    const readings =
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
      assert: () =>
        assertHumanFaceMeasurementTargets(
          readings,
          (document.anatomical?.targets ?? []).map(
            (target) => target.measurement,
          ),
        ),
    });
    checks.push({
      owner: "jaw-capacity",
      assert: () => assertHumanFaceJawCapacity(readings, document.anatomical),
    });
    const tints = fibreTint(document.hair, materials, brows?.tints);
    const skinGains = createHumanFaceSkinRegionGains(
      basis,
      document.skinAppearance,
    );
    const browReplacements =
      brows?.replacements ?? new Map<string, Set<number>>();
    const { parts, evaluated, sourceRegions } = gatherResidentParts({
      document,
      pose,
      browReplacements,
      replacedLashes,
      fibreTints: tints,
      skinGains,
    });
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
    composeGenerated({
      document,
      pose,
      lashes,
      brows,
      model,
      materialMap,
      checks,
    });
    // Admission reads these on the delivered model, after hair is composed.
    checks.push(
      createHumanFaceClearanceCheck(
        "oral-lining",
        "Oral lining intersects a dental crown",
        () => readHumanFaceOralLiningSpace({ basis, pose, model }),
      ),
    );
    if (options?.census === true)
      checks.push({
        owner: "assembly-census",
        assert: () => undefined,
        read: () => readHumanFaceAssemblyClearances({ basis, pose, model }),
        census: () => readHumanFacePartCensus(model),
      });
    // Fixed indices, UVs, references and resident finishes were admitted on the
    // neutral. Explicit source meaning and alias agreement, connectivity and
    // the current legacy partition govern reuse. Contact coordinates alone
    // cannot merge registered opposite points. After a fresh admission, capture
    // its actual instance rather than retaining the constructor's neutral ID.
    if (
      partitions === undefined ||
      partitions.length !== parts.length ||
      parts.some((part, index) => !partitions![index](part.geometry.mesh))
    ) {
      const validation = validateModel({ model });
      if (!validation.success)
        throw new Error(
          "The evaluated facial basis is not a valid resident model: " +
            JSON.stringify(validation),
        );
      partitions = parts.map((part) =>
        createMeshPhysicalPartitionMatcher(part.geometry.mesh),
      );
    }
    if (bakeOcclusion !== undefined)
      for (const [id, uri] of bakeOcclusion(pose, model))
        materialMap.get(id)!.occlusionTexture = uri;
    let hairPartIds: string[] = [];
    if (document.hair !== undefined && document.hair !== null) {
      assertHumanFaceHair(document.hair);
      const generated = buildHair(document.hair, evaluated, pose);
      const hair = generated.value;
      hairPartIds = hair.parts.map((part) => part.id);
      if (
        hair.parts.some((part) =>
          model.parts.some((resident) => resident.id === part.id),
        ) ||
        hair.materials.some((material) =>
          model.materials.some((resident) => resident.id === material.id),
        )
      )
        throw new Error(
          "Numerical hair identities collide with resident face geometry or finishes.",
        );
      // validateModel checks each part/material locally plus IDs and references.
      // A certified hair copy passed the full model gate for this exact pose
      // and hair document. Admit the current face/material changes separately
      // before composing it; the collision check above settles shared IDs.
      if (generated.certified) {
        const validation = validateModel({ model });
        if (!validation.success)
          throw new Error(
            "The numerical hairstyle did not form a valid resident model: " +
              JSON.stringify(validation),
          );
      }
      model.parts.push(...hair.parts);
      model.materials.push(...hair.materials);
      if (!generated.certified) {
        const validation = validateModel({ model });
        if (!validation.success)
          throw new Error(
            "The numerical hairstyle did not form a valid resident model: " +
              JSON.stringify(validation),
          );
        generated.certify();
      }
    }
    const value = {
      model,
      hairPartIds,
      reference: pose.reference,
      oral: oralRegistration,
      sourceRegions,
      browReplacements,
    };
    return {
      value,
      checks,
      publish: () =>
        publishHumanFaceConstruction(options, value, summary, readings),
      readMappings: () =>
        (pose.periocularTissues ?? []).flatMap((part) =>
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
  const build = createHumanFaceConstructionEntries(
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
