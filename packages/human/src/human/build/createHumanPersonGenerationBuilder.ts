import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { applyHumanBodyShapeRows } from "../../body/basis/applyHumanBodyShapeRows";
import { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import { resolveHumanBodyShapeShoulderRest } from "../../body/basis/resolveHumanBodyShapeShoulderRest";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "../structures/IAutoMovieHumanPersonGenerationBuild";
import type { IAutoMovieHumanPersonGenerationBuilderProps } from "../structures/IAutoMovieHumanPersonGenerationBuilderProps";
import { clearHumanPersonHair } from "./clearHumanPersonHair";
import { compileHumanPersonGeneration } from "./compileHumanPersonGeneration";
import { createHumanPersonFaceBuilder } from "./createHumanPersonFaceBuilder";
import { createHumanPersonHeadTransform } from "./createHumanPersonHeadTransform";
import { deriveHumanPersonGenerationFace } from "./deriveHumanPersonGenerationFace";
import { formHumanPersonSkin } from "./formHumanPersonSkin";
import { humanPersonBodyEndpointGains } from "./humanPersonBodyEndpointGains";
import { placeHumanPersonSkinPart } from "./placeHumanPersonSkinPart";
import { readHumanPersonFaceRest } from "./readHumanPersonFaceRest";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";
import { prefixHumanPersonPart } from "./prefixHumanPersonPart";
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
 *    resident model.
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
 * @evidence contracts/common.md#principled-implementation The order follows data dependence: both partitions are evaluated before the rest skin can be formed, the rest skin before the one skinning, the posed halves before the one normal field, and the normals before the parts are read back; a shared sample is one value because both partitions' fields are summed once and then skinned once with one weight row.
 * @evidence contracts/common.md#clear-and-simple-design One orchestrator over the existing face, body, head-carry, skinning, normal and hair owners; the only tables compiled once are the shared-sample maps and the region corner tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a document, a vertex or a revision; incompatible views refuse by name, the source normal guards are used unchanged and the boundary disagreement is reported rather than corrected.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the stage order, the boundary rule, what is absent compared with the seam path and the cost of a posed document.
 * @evidence contracts/modeling.md#part-identity-and-grouping The person is a group of the two partitions' parts under `face:` and `body:` prefixes; the boundary introduces no third skin identity.
 * @evidence contracts/modeling.md#spatial-conventions One metre, Y-up, +Z-forward frame; the neutral-to-shaped conversion of the head is the head transform's named shift.
 * @evidence contracts/modeling.md#shared-boundaries Every shared sample has one rest value and one skinning row, so both halves read the same position, and one source normal field gives both the same normal.
 * @evidence contracts/modeling.md#emitted-geometry Emits the partition views' own triangles; no triangle is clipped, subdivided or dropped.
 * @evidenceExclude contracts/modeling.md#parameter-channels The evaluator consumes the partitions' channels through their owners and defines none.
 * @evidenceExclude contracts/modeling.md#rendered-observation Rendering is observed by the consumers of the model.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The evaluator carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The partitions' owners admit their documents.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The evaluator consumes the person document and adds no input.
 */
export function createHumanPersonGenerationBuilder(
  props: IAutoMovieHumanPersonGenerationBuilderProps,
): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild {
  const compiled = compileHumanPersonGeneration(props.generation);
  const {
    generation, faceProducer, bodyIndex, faceSource, bodySource, plan,
    restTargets, restNeutral, neutralAnchor, aliases, drivers, bodyRegions, sourceNormals,
  } = compiled;
  const { face: faceBasis, body: bodyBasis } = generation;
  const { faceCount, faceRegions } = plan;
  const bodySkin = bodyBasis.surfaces[bodyIndex];
  const bandSurface = plan.band?.surface;
  const buildFace = createHumanPersonFaceBuilder(faceProducer, props.occlusion);
  const buildBody = createHumanBodyBasisBuilder(bodyBasis, { physicalSource: "source-partition" });

  return (document) => {
    const bodyDocument = deriveHumanPersonBody({ document, faceMaterials: faceBasis.materials });
    const body = buildBody(bodyDocument);
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
      document,
      gains: humanPersonBodyEndpointGains(bodyBasis, state),
      aliases,
      drivers,
    });
    const bones = new Map(body.bones.map((one) => [one.bone, one]));
    const head = createHumanPersonHeadTransform({
      anchor: { neutral: neutralAnchor, shaped: humanPersonEyeCentre(body.landmarks) },
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });
    const frameOf = (face: IAutoMovieModel) => ({
      faceRest: readHumanPersonFaceRest(plan, face),
      shift: [head.shift.x, head.shift.y, head.shift.z],
      bodyRest,
      bones,
      bodyPosed: body.posedSurfaces[bodyIndex].positions,
    });

    const currentFace = buildFace(faceDocument);
    const face = currentFace.model;
    const skin = formHumanPersonSkin(plan, frameOf(face));
    const { facePosed, bodyPosed } = skin;
    // A fixed normal transport reads the mouthClose-zero reference of the same
    // shape, other expression and body; omission is zero at the face owner.
    const referenceExpression = { ...faceDocument.expression };
    delete referenceExpression.mouthClose;
    const reference = faceSource.normalTransport === undefined
      ? undefined
      : formHumanPersonSkin(plan, frameOf(buildFace({ ...faceDocument, expression: referenceExpression }).model));
    const normals = sourceNormals({
      face: facePosed,
      body: bodyPosed,
      bodyIndices: bodySkin.indices,
      reference: reference === undefined ? undefined : {
        generation: generation.id,
        face: reference.facePosed,
        body: reference.bodyPosed,
        bodyIndices: bodySkin.indices,
      },
    });

    const domain = humanPhysicalSourceDomain(document.id, generation.id);
    const placed = face.parts.filter((part) => part.id !== bandSurface).map((part) => {
      const mesh = meshOfHumanPart(part);
      const sources = faceRegions.get(part.id);
      return {
        ...part,
        geometry: {
          type: "mesh" as const,
          mesh: sources === undefined
            ? moveHumanMeshRigidly(mesh, head)
            : placeHumanPersonSkinPart({
                mesh,
                sources,
                positions: facePosed,
                normals,
                offset: 0,
                samples: faceSource.samples,
                origin: humanPhysicalSourceDomain(faceDocument.id, generation.id),
                domain,
              }),
        },
      };
    });
    clearHumanPersonHair({
      parts: placed,
      isGenerated: (id) => currentFace.hairPartIds.has(id),
      layers: faceDocument.hair?.layers ?? [],
      positions: bodyPosed,
      indices: bodySkin.indices,
    });
    const parts: IAutoMovieModel["parts"] = placed.map((part) =>
      prefixHumanPersonPart("face", part, meshOfHumanPart(part)),
    );
    for (const part of body.model.parts) {
      const mesh = meshOfHumanPart(part);
      const sources = bodyRegions.get(part.id);
      parts.push(prefixHumanPersonPart("body", part, sources === undefined ? mesh : placeHumanPersonSkinPart({
        mesh,
        sources,
        positions: bodyPosed,
        normals,
        offset: faceCount,
        samples: bodySource.samples,
        origin: humanPhysicalSourceDomain(bodyDocument.id, generation.id),
        domain,
      })));
    }
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials: [
        ...face.materials.map((material) => ({ ...material, id: "face:" + material.id })),
        ...body.model.materials.map((material) => ({ ...material, id: "body:" + material.id })),
      ],
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation = validateModel({ model });
    if (!validation.success)
      throw new Error("The evaluated person is not a valid resident model: " + JSON.stringify(validation));
    return {
      model,
      body,
      bones: [
        ...body.bones,
        ...resolveHumanPersonFaceBones({ basis: faceBasis, document: faceDocument, head }),
      ],
      boundary: { faceFieldMetres: skin.faceField, bodyFieldMetres: skin.bodyField },
    };
  };
}
