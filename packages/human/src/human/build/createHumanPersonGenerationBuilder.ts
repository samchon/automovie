import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieMaterial, IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { applyHumanBodyShapeRows } from "../../body/basis/applyHumanBodyShapeRows";
import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import { composeHumanPersonUnderwearParts } from "./composeHumanPersonUnderwearParts";
import { resolveHumanBodyShapeShoulderRest } from "../../body/basis/resolveHumanBodyShapeShoulderRest";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import { placeHumanLocalModelPart } from "../../common/mesh/placeHumanLocalModelPart";
import { resolveHumanFaceAppearanceDocument } from "../../face/basis/resolveHumanFaceAppearanceDocument";
import { resolveHumanFaceHairLayers } from "../../face/basis/resolveHumanFaceHairLayers";
import { admitHumanPersonDocument } from "../document/admitHumanPersonDocument";
import { createHumanPersonHeadShapeResolver } from "../document/createHumanPersonHeadShapeResolver";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import { dressHumanPersonBody } from "./dressHumanPersonBody";
import { createHumanPersonFaceMeasurementReader } from "../measure/createHumanPersonFaceMeasurementReader";
import type { IAutoMovieHumanPersonConstruction } from "../structures/IAutoMovieHumanPersonConstruction";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonFaceRest } from "../structures/IAutoMovieHumanPersonFaceRest";
import type { IAutoMovieHumanPersonGenerationBuild } from "../structures/IAutoMovieHumanPersonGenerationBuild";
import type { IAutoMovieHumanPersonGenerationBuilder } from "../structures/IAutoMovieHumanPersonGenerationBuilder";
import type { IAutoMovieHumanPersonGenerationBuilderProps } from "../structures/IAutoMovieHumanPersonGenerationBuilderProps";
import { clearHumanPersonHair } from "./clearHumanPersonHair";
import { compileHumanPersonGeneration } from "./compileHumanPersonGeneration";
import { completeHumanPersonBodyLayers } from "./completeHumanPersonBodyLayers";
import { createHumanPersonBodyEndpointSource } from "./createHumanPersonBodyEndpointSource";
import { createHumanPersonFaceBuilder } from "./createHumanPersonFaceBuilder";
import { createHumanPersonHeadTransform } from "./createHumanPersonHeadTransform";
import { deriveHumanPersonGenerationFace } from "./deriveHumanPersonGenerationFace";
import { formHumanPersonSkin } from "./formHumanPersonSkin";
import { humanPersonBodyEndpointGains } from "./humanPersonBodyEndpointGains";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { placeHumanPersonMixedSourceMesh } from "./placeHumanPersonMixedSourceMesh";
import { placeHumanPersonSkinPart } from "./placeHumanPersonSkinPart";
import { prefixHumanPersonPart } from "./prefixHumanPersonPart";
import { readHumanPersonFaceRest } from "./readHumanPersonFaceRest";
import { resolveHumanPersonFaceBones } from "./resolveHumanPersonFaceBones";

/**
 * Compile one source generation into an evaluator of whole people that reads the face and the body as the head and body cells of one skin, with no seam stage.
 *
 * The generation's two partition views share the registered neck boundary as sample identities, and its one weight map covers both. Each evaluation:
 *
 * 1. Derives the body document's colour from the face and evaluates both partition views with their own builders (`deriveHumanPersonBody`, the face producer), so each partition's channels, correctives, expression, jaw and contact stay with their owner. With band rows the face view is extended over the band's body cells (`createHumanPersonBandFaceView`), so the face producer also evaluates its band rows, closure and attachments there. A face channel the generation defines once through a body channel (`aliases`) is refused in the face subtree. Body endpoints whose rows the face view holds (head skin, carried parts, face landmarks) reach the face producer through endpoint drivers (`drivers`) weighted by the body's own gain under its endpoint state (`humanBodyBasisWeights`), so they apply before the face's expression and articulation.
 * 2. Forms one rest skin. A head vertex is the face's evaluated position carried by the face frame's anchor (`createHumanPersonHeadTransform`'s rest shift: the body's eye-centre displacement). A body vertex is the body's own rest; on the band it also takes the face producer's displacement of that vertex. A shared boundary sample is the sum of both partitions' absolute fields there: the face position plus the body's own displacement of that sample, which already contains the carry, so both formulas meet at the cut.
 * 3. Poses the head cells with the generation's one weight map through the body's own skinning owner and bones; the body cells keep the body builder's posing. A band vertex adds the difference between skinning its body rest position with and without the actual face-view displacement, including the skinning owner's position-dependent twist behavior. Each shared sample takes the head-side result on both halves, one value.
 * 4. Evaluates one normal field over both halves through their shared source tree (`createHumanPersonSourceNormals`), whose guards refuse a performed cell opposing its source parent.
 * 5. Emits the face and body parts unclipped (the views are already the partition), keeps the face's hair off the posed body and validates the resident model. When the face admission is accepted, an optional final-face observer reads this statically validated model at export precision, undoing the actual head carry into the registry's canonical measurement frame. A later ordinary-call refusal from the combined body-layer admission does not undo that face measurement publication. Internal reference evaluations publish no measurement; omission adds no measurement work, and observer exceptions propagate.
 *
 * The final person's garment reads the formed skin and common normal field. Its source compiler and rest coverage are shared with the independent body garment. Without a registered skin-layer field, the returned body retains its independent evaluation. With a field, it carries the final formed body skin, garment and layers together, so those outputs share one exterior. The derived `sourceSkinModel` retains these same final joined parts before fabric cutting and lift, in the same placed frame, for source/layer observation.
 *
 * There is no cut evaluation, collar conform, boundary subdivision or normal fairing. Where the two partitions' channel fields disagree at the boundary without band rows, the shared sample still takes one head-side value and disagreement can remain in adjacent rings. The `boundary` fields report maximal requested face rest displacement and body rest displacement after subtracting the eye-anchor carry, in metres; they do not bound the performed adjacent-ring step. The body rest of the shared samples and the band is the body's shaped surface for the document's own endpoint state, the one its builder skinned. The evaluator owns no anatomy and does not judge head-to-stature or neck-girth relations.
 *
 * The explicit construction entry carries every requested face part into this same person model with the face's unchanged admission report. The ordinary callable refuses a rejected report. Source, schema, geometry, normal and static resident-model checks still execute on their original boundaries. Compiled generation inputs remain unchanged. Completed stage events describe executed owners, not viewer health or a current GPU appearance qualification.
 *
 * @evidence contracts/common.md#principled-implementation Same-generation canonical shared samples and one head weight map form/pose one skin, then a shared performed normal field and exact source-corner placement emit both partitions without a seam fit or coordinate weld.
 * @evidence contracts/common.md#clear-and-simple-design Invariants compile once and one construct path owns document phase order; face/body anatomy, skin formation, normal transport, final layers and measurement instruments stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected face/layer admission remains rejected in the ordinary callable, boundary field disagreement remains a reported step, and source/static validity supplies no clinical proportion or current GPU proof.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies one-skin metre frame, alias/driver ownership, optional band/reference/layer semantics, sourceSkinModel timing and admission-versus-progress boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Each construct pays body/face anatomy, shared skin and normal work, optional mouthClose-zero reference, mixed-source placement, body-hair queries, layer/fabric construction and full resident validation; requested measurement/census adds actual instrument and model-population cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled sample/rest/band tables and anatomy producers serve unchanged generations; zero mouthClose reuses current skin for reference while other reference states are separately evaluated, and one final normal field serves all regions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder retains compiled invariants and supplied observers until dropped; construct buffers/results scale with source/generated topology and caller-retained observations, with no coordinator task or timer.
 */
export function createHumanPersonGenerationBuilder(
  props: IAutoMovieHumanPersonGenerationBuilderProps,
): IAutoMovieHumanPersonGenerationBuilder {
  const compiled: ReturnType<typeof compileHumanPersonGeneration> = compileHumanPersonGeneration(props.generation);
  const resolveHeadShape: ReturnType<typeof createHumanPersonHeadShapeResolver> = createHumanPersonHeadShapeResolver(props.generation);
  const readFaceMeasurements: ReturnType<typeof createHumanPersonFaceMeasurementReader> | undefined =
    props.observeFaceMeasurements === undefined
      ? undefined
      : createHumanPersonFaceMeasurementReader(compiled);
  const {
    generation,
    faceProducer,
    bodyIndex,
    faceSource,
    bodySource,
    plan,
    restTargets,
    restNeutral,
    neutralAnchor,
    aliases,
    drivers,
    bodyRegions,
    sourceNormals,
  }: typeof compiled = compiled;
  const { face: faceBasis, body: bodyBasis }: typeof generation = generation;
  const { faceCount, faceRegions }: typeof plan = plan;
  const bodySkin: typeof bodyBasis.surfaces[number] = bodyBasis.surfaces[bodyIndex];
  const anatomicalExteriorNeutral: number[] = [
    ...plan.faceNeutral,
    ...bodySkin.positions,
  ];
  const bandSurface: string | undefined = plan.band?.surface;
  const buildFace: ReturnType<typeof createHumanPersonFaceBuilder> = createHumanPersonFaceBuilder(
    faceProducer,
    props.occlusion,
    readFaceMeasurements !== undefined,
    props.census === true,
    props.observeFaceConstructionProgress,
  );
  const faceSampleVertices: Map<number, number> = new Map(
    faceSource.samples.map((sample: number, vertex: number): [number, number] => [sample, vertex]),
  );
  const buildBody: ReturnType<typeof createHumanBodyBasisBuilder> = createHumanBodyBasisBuilder(bodyBasis, {
    physicalSource: "source-partition",
    endpointSource: createHumanPersonBodyEndpointSource(generation),
    observeProgress: props.observeBodyConstructionProgress,
  });

  const construct: (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonConstruction = (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonConstruction => {
    const effectiveDocument: IAutoMovieHumanPersonDocument = resolveHeadShape(
      bodyBasis.anatomicalAssembly?.mode === "neutral-only"
        ? admitHumanPersonDocument(document, bodyBasis.anatomicalAssembly)
        : document,
    );
    const preparedBody: ReturnType<typeof buildBody.prepare> = buildBody.prepare(
      deriveHumanPersonBody({
        document: effectiveDocument,
        faceMaterials: faceBasis.materials,
      }),
    );
    const bodySkinState: typeof preparedBody.skin = preparedBody.skin;
    props.observeStage?.("body-evaluated");
    const bodyDocument: typeof bodySkinState.evaluatedDocument = bodySkinState.evaluatedDocument;
    // the body's own endpoint state, the one its builder skinned the shaped
    // surface with (pose correctives included)
    const state: ReturnType<typeof humanBodyBasisWeights> = humanBodyBasisWeights(
      bodyBasis,
      bodyDocument,
      resolveHumanBodyShapeShoulderRest(bodyBasis, bodyDocument.shape),
    );
    const bodyRest: number[] = restNeutral.slice();
    applyHumanBodyShapeRows(bodyBasis, state, bodyRest, restTargets);
    const faceDocument: ReturnType<typeof deriveHumanPersonGenerationFace> = deriveHumanPersonGenerationFace({
      document: effectiveDocument,
      gains: humanPersonBodyEndpointGains(bodyBasis, state),
      aliases,
      drivers,
    });
    const bones: Parameters<typeof formHumanPersonSkin>[1]["bones"] = new Map(bodySkinState.bones.map((one: typeof bodySkinState.bones[number]): [typeof one.bone, typeof one] => [one.bone, one]));
    const head: ReturnType<typeof createHumanPersonHeadTransform> = createHumanPersonHeadTransform({
      anchor: {
        neutral: neutralAnchor,
        shaped: humanPersonEyeCentre(bodySkinState.landmarks),
      },
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });
    const frameOf: (face: IAutoMovieModel | IAutoMovieHumanPersonFaceRest) => Parameters<typeof formHumanPersonSkin>[1] = (
      face: IAutoMovieModel | IAutoMovieHumanPersonFaceRest,
    ): Parameters<typeof formHumanPersonSkin>[1] => ({
      faceRest: "parts" in face ? readHumanPersonFaceRest(plan, face) : face,
      shift: [head.shift.x, head.shift.y, head.shift.z],
      bodyRest,
      bones,
      bodyPosed: bodySkinState.posedSurfaces[bodyIndex].positions,
    });

    const currentFace: ReturnType<typeof buildFace.construct> = buildFace.construct(faceDocument);
    props.observeStage?.("face-evaluated");
    const face: IAutoMovieModel = currentFace.model;
    const skin: ReturnType<typeof formHumanPersonSkin> = formHumanPersonSkin(plan, frameOf(face));
    const { facePosed, bodyPosed }: ReturnType<typeof formHumanPersonSkin> = skin;
    // The complete consumer exterior exists before any internal target solve.
    // All anatomical parts and quantities are constructed once by the same
    // prepared body's completion, with no preliminary body-only source solve.
    const body: ReturnType<typeof preparedBody.finish> = preparedBody.finish(
      bodyBasis.anatomicalAssembly?.mode === "neutral-only" &&
        bodyBasis.anatomicalAssembly.exteriorBinding !== undefined
        ? {
            neutral: anatomicalExteriorNeutral,
            evaluated: [...facePosed, ...bodyPosed],
          }
        : undefined,
      "defer",
      "defer",
    );
    // A fixed normal transport reads the mouthClose-zero reference of the same
    // shape, other expression and body; omission is zero at the face owner.
    const reference: ReturnType<typeof formHumanPersonSkin> | undefined =
      faceSource.normalTransport === undefined
        ? undefined
        : (faceDocument.expression.mouthClose ?? 0) === 0
          ? skin
          : ((): ReturnType<typeof formHumanPersonSkin> => {
              const referenceExpression: typeof faceDocument.expression = { ...faceDocument.expression };
              delete referenceExpression.mouthClose;
              return formHumanPersonSkin(
                plan,
                frameOf(
                  buildFace.construct({
                    ...faceDocument,
                    expression: referenceExpression,
                  }).model,
                ),
              );
            })();
    props.observeStage?.("skin-formed");
    const normals: number[] = sourceNormals({
      face: facePosed,
      body: bodyPosed,
      bodyIndices: bodySkin.indices,
      reference:
        reference === undefined
          ? undefined
          : {
              generation: generation.id,
              face: reference.facePosed,
              body: reference.bodyPosed,
              bodyIndices: bodySkin.indices,
            },
    });

    const { body: dressedBody, garment }: ReturnType<typeof dressHumanPersonBody> = dressHumanPersonBody({
      prepared: preparedBody, body,
    });
    const domain: string = humanPhysicalSourceDomain(document.id, generation.id);
    const placed: IAutoMovieModel["parts"] = face.parts
      .filter((part: IAutoMovieModel["parts"][number]): boolean => part.id !== bandSurface)
      .map((part: IAutoMovieModel["parts"][number]): IAutoMovieModel["parts"][number] => placeHumanLocalModelPart(part, (mesh: IAutoMovieMesh): IAutoMovieMesh => {
        const sources: readonly number[] | undefined = faceRegions.get(part.id);
        return sources === undefined
                ? placeHumanPersonMixedSourceMesh({
                    mesh,
                    head,
                    samples: faceSampleVertices,
                    positions: facePosed,
                    origin: humanPhysicalSourceDomain(
                      faceDocument.id,
                      generation.id,
                    ),
                    domain,
                    surface: faceProducer.surfaces[compiled.faceProducerSkin].id,
                    materialAttachments: currentFace.materialAttachments,
                  })
                : placeHumanPersonSkinPart({
                    mesh,
                    sources,
                    positions: facePosed,
                    normals,
                    offset: 0,
                    samples: faceSource.samples,
                    origin: humanPhysicalSourceDomain(
                      faceDocument.id,
                      generation.id,
                    ),
                    domain,
                  });
      }));
    clearHumanPersonHair({
      parts: placed,
      isGenerated: (id: string): boolean => currentFace.hairPartIds.includes(id),
      contactLayouts: currentFace.hairContactLayouts,
      layers:
        resolveHumanFaceHairLayers(faceProducer,
          resolveHumanFaceAppearanceDocument(faceProducer, faceDocument)),
      positions: bodyPosed,
      indices: bodySkin.indices,
      observe: props.observeHairContact,
    });
    const parts: IAutoMovieModel["parts"] = placed.map((part: IAutoMovieModel["parts"][number]): IAutoMovieModel["parts"][number] =>
      prefixHumanPersonPart("face", part, meshOfHumanPart(part)),
    );
    const garmentFields: Map<string, { field: readonly number[]; sources: readonly number[] }> = new Map<string, { field: readonly number[]; sources: readonly number[] }>();
    for (const part of dressedBody.model.parts) {
      const mesh: IAutoMovieMesh = meshOfHumanPart(part);
      const sources: readonly number[] | undefined = bodyRegions.get(part.id);
      const garmentRegion: ReturnType<NonNullable<typeof garment>["regions"]["get"]> = garment?.regions.get(part.id);
      if (garmentRegion !== undefined) garmentFields.set("body:" + part.id, garmentRegion);
      parts.push(
        prefixHumanPersonPart(
          "body",
          part,
          sources === undefined
            ? mesh
            : placeHumanPersonSkinPart({
                mesh,
                sources,
                positions: bodyPosed,
                normals,
                offset: faceCount,
                samples: bodySource.samples,
                origin: humanPhysicalSourceDomain(
                  bodyDocument.id,
                  generation.id,
                ),
                domain,
              }),
        ),
      );
    }
    const hasLayers: boolean = bodyBasis.surfaces.some((surface: typeof bodyBasis.surfaces[number]): boolean => surface.layerThickness !== undefined);
    const completedBody: typeof dressedBody = hasLayers
      ? completeHumanPersonBodyLayers({
          basis: bodyBasis, body: dressedBody, parts, domain, instance: document.id,
          surface: bodyIndex, faceRegions, bodyRegions, normals, faceVertices: faceCount,
        })
      : dressedBody;
    parts.push(...completedBody.model.parts.slice(dressedBody.model.parts.length).map((part: IAutoMovieModel["parts"][number]): IAutoMovieModel["parts"][number] =>
      prefixHumanPersonPart("body", part, meshOfHumanPart(part)),
    ));
    const failures: IAutoMovieHumanPersonConstruction["admission"]["failures"] = [...currentFace.admission.failures, ...(completedBody.layerAdmission?.failures ?? [])];
    // Layer/source readings use the original joined skin before its material split.
    const renderedParts: IAutoMovieModel["parts"] = composeHumanPersonUnderwearParts({ parts, garment, regions: garmentFields });
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts: renderedParts,
      materials: [
        ...face.materials.map((material: IAutoMovieMaterial): IAutoMovieMaterial => ({
          ...material,
          id: "face:" + material.id,
        })),
        ...completedBody.model.materials.map((material: IAutoMovieMaterial): IAutoMovieMaterial => ({
          ...material,
          id: "body:" + material.id,
        })),
      ],
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation: ReturnType<typeof validateModel> = validateModel({ model });
    if (!validation.success)
      throw new Error(
        "The evaluated person is not a valid resident model: " +
          JSON.stringify(validation),
      );
    props.observeStage?.("model-validated");
    if (readFaceMeasurements !== undefined && currentFace.admission.accepted) {
      let measuredReference: Map<string, readonly number[]> | undefined;
      if (currentFace.reference !== undefined) {
        measuredReference = new Map();
        const headSurface: string = faceProducer.surfaces[compiled.faceProducerSkin].id;
        const sourceHead: readonly number[] | undefined = currentFace.reference.get(headSurface);
        const referenceSkin: ReturnType<typeof formHumanPersonSkin> | undefined =
          sourceHead === undefined
            ? undefined
            : formHumanPersonSkin(
                plan,
                frameOf({
                  head: sourceHead.slice(),
                  band:
                    compiled.faceProducerBand === undefined
                      ? undefined
                      : currentFace.reference
                          .get(
                            faceProducer.surfaces[compiled.faceProducerBand].id,
                          )
                          ?.slice(),
                }),
              );
        for (const surface of faceBasis.surfaces) {
          const values: readonly number[] | undefined = currentFace.reference.get(surface.id);
          if (values === undefined) continue;
          if (surface.id === headSurface) {
            if (referenceSkin !== undefined)
              measuredReference.set(surface.id, referenceSkin.facePosed);
            continue;
          }
          const world: number[] = [];
          for (let at: number = 0; at < values.length; at += 3) {
            const point: IAutoMovieVector3 = head.point({
              x: values[at],
              y: values[at + 1],
              z: values[at + 2],
            });
            world.push(point.x, point.y, point.z);
          }
          measuredReference.set(surface.id, world);
        }
      }
      props.observeFaceMeasurements!(
        readFaceMeasurements({
          model,
          document,
          head,
          sourceRegions: currentFace.sourceRegions.filter(
            (region: typeof currentFace.sourceRegions[number]): boolean => region.surface !== bandSurface,
          ),
          browReplacements: currentFace.browReplacements,
          reference: measuredReference,
          oral: currentFace.oral,
        }),
      );
    }
    return {
      admission: { ...currentFace.admission, accepted: failures.length === 0, failures },
      faceAdmission: currentFace.admission,
      model,
      sourceSkinModel: { ...model, parts },
      body: preparedBody.wear(hasLayers ? completedBody : body),
      bones: [
        ...body.bones,
        ...resolveHumanPersonFaceBones({
          basis: faceBasis,
          document: faceDocument,
          head,
        }),
      ],
      boundary: {
        faceFieldMetres: skin.faceField,
        bodyFieldMetres: skin.bodyField,
      },
    };
  };
  const build: (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild = (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonGenerationBuild => {
    const result: IAutoMovieHumanPersonConstruction = construct(document);
    if (!result.admission.accepted)
      throw new Error(result.admission.failures[0].cause);
    return result;
  };
  return Object.assign(build, { construct });
}
