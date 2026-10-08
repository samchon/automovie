import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { applyHumanBodyShapeRows } from "../../body/basis/applyHumanBodyShapeRows";
import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
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
 * Compile one source generation into an evaluator of whole people that reads
 * the face and the body as the head and body cells of one skin, with no seam
 * stage.
 *
 * The generation's two partition views share the registered neck boundary as
 * sample identities, and its one weight map covers both. Each evaluation:
 *
 * 1. Derives the body document's colour from the face and evaluates both
 *    partition views with their own builders (`deriveHumanPersonBody`,
 *    the face producer), so each partition's channels, correctives,
 *    expression, jaw and contact stay with their owner. With band rows the
 *    face view is extended over the band's body cells
 *    (`createHumanPersonBandFaceView`), so the face producer also evaluates
 *    its band rows, closure and attachments there. A face channel the
 *    generation defines once through a body channel (`aliases`) is refused in
 *    the face subtree. Body endpoints whose rows the face view holds (head
 *    skin, carried parts, face landmarks) reach the face producer through
 *    endpoint drivers (`drivers`) weighted by the body's own gain under its
 *    endpoint state (`humanBodyBasisWeights`), so they apply before the
 *    face's expression and articulation.
 * 2. Forms one rest skin. A head vertex is the face's evaluated position
 *    carried by the face frame's anchor (`createHumanPersonHeadTransform`'s
 *    rest shift: the body's eye-centre displacement). A body
 *    vertex is the body's own rest; on the band it also takes the face
 *    producer's displacement of that vertex. A shared boundary sample is the
 *    sum of both partitions' absolute fields there: the face position plus
 *    the body's own displacement of that sample, which already contains the
 *    carry, so both formulas meet at the cut.
 * 3. Poses the head cells with the generation's one weight map through the
 *    body's own dual quaternion skinning and the body's bones; the body cells
 *    keep the body builder's posing, which uses the same map and bones; a band
 *    vertex adds its face displacement through the same rigid skinning
 *    transform. Each shared sample takes the head-side result on both halves,
 *    one value.
 * 4. Evaluates one normal field over both halves through their shared source
 *    tree (`createHumanPersonSourceNormals`), whose guards refuse a performed
 *    cell opposing its source parent.
 * 5. Emits the face and body parts unclipped (the views are already the
 *    partition), keeps the face's hair off the posed body and validates the
 *    resident model. An optional final-face observer reads this validated
 *    model at export precision, undoing the actual head carry into the
 *    registry's canonical measurement frame. Internal reference evaluations
 *    publish no measurement; omission adds no measurement work.
 *
 * The final person's garment reads the formed skin and common normal field.
 * Its source compiler and rest coverage are shared with the independent body
 * garment. Without a registered skin-layer field, the returned body retains
 * its independent evaluation. With a field, it carries the final formed body
 * skin, garment and layers together, so those outputs share one exterior.
 *
 * There is no cut evaluation, collar conform, boundary subdivision or normal
 * fairing. What a seam stage absorbed is not hidden: where the two
 * partitions' channel fields disagree at the boundary (a generation without
 * band rows), the step lands in the rings next to it, and `boundary` reports
 * its size. The body rest of the shared samples and the band is the body's
 * shaped surface for the document's own endpoint state, the one its builder
 * skinned. The evaluator owns no anatomy and does
 * not judge head-to-stature or neck-girth relations.
 *
 * The explicit construction entry carries every requested face part into this
 * same person model with the face's unchanged admission report. The ordinary
 * callable refuses a rejected report. Source, schema, geometry, normal and
 * static resident-model checks still execute on their original boundaries.
 *
 * @evidence contracts/common.md#principled-implementation The order follows data dependence: both partitions are evaluated before the rest skin can be formed, the rest skin before the one skinning, the posed halves before the one normal field, and the normals before the parts are read back; a shared sample is one value because both partitions' fields are summed once and then skinned once with one weight row.
 * @evidence contracts/common.md#clear-and-simple-design One orchestrator over the existing face, body, head-carry, skinning, normal and hair owners; the only tables compiled once are the shared-sample maps and the region corner tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a document, a vertex or a revision; incompatible views refuse by name, the source normal guards are used unchanged and the boundary disagreement is reported rather than corrected.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the stage order, the boundary rule, what is absent compared with the seam path and the cost of a posed document.
 * @evidence contracts/modeling.md#part-identity-and-grouping The person is a group of the two partitions' parts under `face:` and `body:` prefixes; the boundary introduces no third skin identity.
 * @evidence contracts/modeling.md#spatial-conventions One metre, Y-up, +Z-forward frame; the neutral-to-shaped conversion of the head is the head transform's named shift.
 * @evidence contracts/modeling.md#shared-boundaries Every shared sample has one rest value and one skinning row, so both halves read the same position, and one source normal field gives both the same normal.
 * @evidence contracts/modeling.md#emitted-geometry Emits the partition views' own triangles; no triangle is clipped, subdivided or dropped.
 * @evidenceExclude contracts/modeling.md#parameter-channels The evaluator consumes the partitions' channels through their owners and defines none.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The evaluator carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The partitions' owners admit their documents.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The evaluator consumes the person document and adds no input.
 */
export function createHumanPersonGenerationBuilder(
  props: IAutoMovieHumanPersonGenerationBuilderProps,
): IAutoMovieHumanPersonGenerationBuilder {
  const compiled = compileHumanPersonGeneration(props.generation);
  const resolveHeadShape = createHumanPersonHeadShapeResolver(props.generation);
  const readFaceMeasurements =
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
  } = compiled;
  const { face: faceBasis, body: bodyBasis } = generation;
  const { faceCount, faceRegions } = plan;
  const bodySkin = bodyBasis.surfaces[bodyIndex];
  const anatomicalExteriorNeutral = [
    ...plan.faceNeutral,
    ...bodySkin.positions,
  ];
  const bandSurface = plan.band?.surface;
  const buildFace = createHumanPersonFaceBuilder(
    faceProducer,
    props.occlusion,
    readFaceMeasurements !== undefined,
    props.census === true,
    props.observeFaceConstructionProgress,
  );
  const faceSampleVertices = new Map(
    faceSource.samples.map((sample, vertex) => [sample, vertex]),
  );
  const buildBody = createHumanBodyBasisBuilder(bodyBasis, {
    physicalSource: "source-partition",
    endpointSource: createHumanPersonBodyEndpointSource(generation),
    observeProgress: props.observeBodyConstructionProgress,
  });

  const construct = (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonConstruction => {
    const effectiveDocument = resolveHeadShape(
      bodyBasis.anatomicalAssembly?.mode === "neutral-only"
        ? admitHumanPersonDocument(document, bodyBasis.anatomicalAssembly)
        : document,
    );
    const preparedBody = buildBody.prepare(
      deriveHumanPersonBody({
        document: effectiveDocument,
        faceMaterials: faceBasis.materials,
      }),
    );
    const bodySkinState = preparedBody.skin;
    props.observeStage?.("body-evaluated");
    const bodyDocument = bodySkinState.evaluatedDocument;
    // the body's own endpoint state, the one its builder skinned the shaped
    // surface with (pose correctives included)
    const state = humanBodyBasisWeights(
      bodyBasis,
      bodyDocument,
      resolveHumanBodyShapeShoulderRest(bodyBasis, bodyDocument.shape),
    );
    const bodyRest = restNeutral.slice();
    applyHumanBodyShapeRows(bodyBasis, state, bodyRest, restTargets);
    const faceDocument = deriveHumanPersonGenerationFace({
      document: effectiveDocument,
      gains: humanPersonBodyEndpointGains(bodyBasis, state),
      aliases,
      drivers,
    });
    const bones = new Map(bodySkinState.bones.map((one) => [one.bone, one]));
    const head = createHumanPersonHeadTransform({
      anchor: {
        neutral: neutralAnchor,
        shaped: humanPersonEyeCentre(bodySkinState.landmarks),
      },
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });
    const frameOf = (
      face: IAutoMovieModel | IAutoMovieHumanPersonFaceRest,
    ) => ({
      faceRest: "parts" in face ? readHumanPersonFaceRest(plan, face) : face,
      shift: [head.shift.x, head.shift.y, head.shift.z],
      bodyRest,
      bones,
      bodyPosed: bodySkinState.posedSurfaces[bodyIndex].positions,
    });

    const currentFace = buildFace.construct(faceDocument);
    props.observeStage?.("face-evaluated");
    const face = currentFace.model;
    const skin = formHumanPersonSkin(plan, frameOf(face));
    const { facePosed, bodyPosed } = skin;
    // The complete consumer exterior exists before any internal target solve.
    // All anatomical parts and quantities are constructed once by the same
    // prepared body's completion, with no preliminary body-only source solve.
    const body = preparedBody.finish(
      bodyBasis.anatomicalAssembly?.mode === "neutral-only" &&
        bodyBasis.anatomicalAssembly.exteriorBinding !== undefined
        ? {
            neutral: anatomicalExteriorNeutral,
            evaluated: [...facePosed, ...bodyPosed],
          }
        : undefined,
      "defer",
    );
    // A fixed normal transport reads the mouthClose-zero reference of the same
    // shape, other expression and body; omission is zero at the face owner.
    const reference =
      faceSource.normalTransport === undefined
        ? undefined
        : (faceDocument.expression.mouthClose ?? 0) === 0
          ? skin
          : (() => {
              const referenceExpression = { ...faceDocument.expression };
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
    const normals = sourceNormals({
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

    const dressedBody = dressHumanPersonBody({
      prepared: preparedBody, body, surface: bodyIndex,
      positions: bodyPosed, normals, faceVertices: faceCount,
    });
    const domain = humanPhysicalSourceDomain(document.id, generation.id);
    const placed = face.parts
      .filter((part) => part.id !== bandSurface)
      .map((part) => placeHumanLocalModelPart(part, (mesh) => {
        const sources = faceRegions.get(part.id);
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
      isGenerated: (id) => currentFace.hairPartIds.includes(id),
      contactLayouts: currentFace.hairContactLayouts,
      layers:
        resolveHumanFaceHairLayers(faceProducer,
          resolveHumanFaceAppearanceDocument(faceProducer, faceDocument)),
      positions: bodyPosed,
      indices: bodySkin.indices,
      observe: props.observeHairContact,
    });
    const parts: IAutoMovieModel["parts"] = placed.map((part) =>
      prefixHumanPersonPart("face", part, meshOfHumanPart(part)),
    );
    for (const part of dressedBody.model.parts) {
      const mesh = meshOfHumanPart(part);
      const sources = bodyRegions.get(part.id);
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
    const hasLayers = bodyBasis.surfaces.some((surface) => surface.layerThickness !== undefined);
    const completedBody = hasLayers
      ? completeHumanPersonBodyLayers({
          basis: bodyBasis, body: dressedBody, parts, domain, instance: document.id,
          surface: bodyIndex, faceRegions, bodyRegions, normals, faceVertices: faceCount,
        })
      : dressedBody;
    parts.push(...completedBody.model.parts.slice(dressedBody.model.parts.length).map((part) =>
      prefixHumanPersonPart("body", part, meshOfHumanPart(part)),
    ));
    const failures = [...currentFace.admission.failures, ...(completedBody.layerAdmission?.failures ?? [])];
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials: [
        ...face.materials.map((material) => ({
          ...material,
          id: "face:" + material.id,
        })),
        ...completedBody.model.materials.map((material) => ({
          ...material,
          id: "body:" + material.id,
        })),
      ],
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation = validateModel({ model });
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
        const headSurface = faceProducer.surfaces[compiled.faceProducerSkin].id;
        const sourceHead = currentFace.reference.get(headSurface);
        const referenceSkin =
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
          const values = currentFace.reference.get(surface.id);
          if (values === undefined) continue;
          if (surface.id === headSurface) {
            if (referenceSkin !== undefined)
              measuredReference.set(surface.id, referenceSkin.facePosed);
            continue;
          }
          const world: number[] = [];
          for (let at = 0; at < values.length; at += 3) {
            const point = head.point({
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
            (region) => region.surface !== bandSurface,
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
      body: hasLayers ? completedBody : body,
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
  const build = (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonGenerationBuild => {
    const result = construct(document);
    if (!result.admission.accepted)
      throw new Error(result.admission.failures[0].cause);
    return result;
  };
  return Object.assign(build, { construct });
}
