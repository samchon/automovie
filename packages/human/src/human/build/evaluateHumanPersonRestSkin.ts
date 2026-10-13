import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { resolveHumanBodyAnatomy } from "../../body/anatomy/resolveHumanBodyAnatomy";
import { applyHumanBodyShapeRows } from "../../body/basis/applyHumanBodyShapeRows";
import { evaluateHumanBodyShape } from "../../body/basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import { resolveHumanBodyBuildPose } from "../../body/basis/resolveHumanBodyBuildPose";
import { resolveHumanBodyShapeShoulderRest } from "../../body/basis/resolveHumanBodyShapeShoulderRest";
import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyBoneTransform } from "../../body/structures/rig/IAutoMovieHumanBodyBoneTransform";
import { evaluateHumanFaceRest } from "../../face/basis/evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "../../face/basis/humanFaceBasisWeights";
import { createHumanPersonHeadShapeResolver } from "../document/createHumanPersonHeadShapeResolver";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonFormedSkin } from "../structures/IAutoMovieHumanPersonFormedSkin";
import { deriveHumanPersonGenerationFace } from "./deriveHumanPersonGenerationFace";
import { formHumanPersonSkin } from "./formHumanPersonSkin";
import { humanPersonBodyEndpointGains } from "./humanPersonBodyEndpointGains";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";

/**
 * Evaluate source rest skin with authored shape and neutral expression, removing explicit body pose/motion goals. The body's shape-dependent shoulder-rest pose still executes; rest does not mean identity bone frames.
 *
 * Body anatomy solving, actual endpoint gains and the face producer's rest layer feed the same one-skin forming owner with shaped-eye carry and actual body rest-document transforms. Parts, materials, normals, hair and closure stages are omitted, so equality with a full neutral build requires a consumer comparison where omitted stages may alter skin. Input source/document arrays remain unchanged; owned formed coordinates use common metre/Y-up/Z-forward frame. Source rest geometry is not a clinical measurement or current rendered qualification.
 *
 * @evidence contracts/common.md#principled-implementation Existing body anatomy/endpoint and face rest owners feed actual shoulder-rest frames and the same registered one-skin field combination as full generation assembly.
 * @evidence contracts/common.md#clear-and-simple-design This measurement-facing evaluator selects rest stages only; trait conversion, anatomy, pose transforms and shared skin formation retain their normal owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted contact/closure stages are not claimed equivalent to full neutral geometry, and rest shoulder transforms are not replaced with identity frames.
 * @evidence contracts/common.md#meaningful-documentation Prose states neutral-expression/authored-pose distinction, metre frame, omitted-stage comparison and unchanged input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Each call pays trait registration, actual anatomy/endpoint solving, body/face rest row evaluation and body/head/band skinning; compact rest-row copies and J-bone map creation add their actual sizes.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied compiled correspondence/rest tables and existing owner algorithms serve this rest path; omitted material/hair/contact production is not redundantly executed for a rest measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Derived documents, shape buffers and bone maps are call-local; only owned formed skin/field receipts escape, with no retained evaluator task or geometry cache.
 */
export function evaluateHumanPersonRestSkin(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanPersonFormedSkin {
  const { generation, plan }: IAutoMovieHumanPersonCompiledGeneration = compiled;
  const effectiveDocument: IAutoMovieHumanPersonDocument =
    createHumanPersonHeadShapeResolver(generation)(document);
  const body: IAutoMovieHumanPersonCompiledGeneration["generation"]["body"] = generation.body;
  const bodyDocument: ReturnType<typeof deriveHumanPersonBody> = deriveHumanPersonBody({
    document: effectiveDocument,
    faceMaterials: generation.face.materials,
  });
  if (bodyDocument.anatomy !== undefined)
    bodyDocument.shape = resolveHumanBodyAnatomy(
      body,
      bodyDocument.shape,
      bodyDocument.anatomy,
    );
  delete bodyDocument.pose;
  delete bodyDocument.shoulders;
  delete bodyDocument.anatomicalMotion;
  delete bodyDocument.toes;
  delete bodyDocument.thighGoals;
  const state: ReturnType<typeof humanBodyBasisWeights> = humanBodyBasisWeights(
    body,
    bodyDocument,
    resolveHumanBodyShapeShoulderRest(body, bodyDocument.shape),
  );
  const shaped: ReturnType<typeof evaluateHumanBodyShape> = evaluateHumanBodyShape(body, state);
  const bodyRest: number[] = compiled.restNeutral.slice();
  applyHumanBodyShapeRows(body, state, bodyRest, compiled.restTargets);
  const faceDocument: ReturnType<typeof deriveHumanPersonGenerationFace> = deriveHumanPersonGenerationFace({
    document: {
      ...effectiveDocument,
      face: { ...effectiveDocument.face, expression: {} },
    },
    gains: humanPersonBodyEndpointGains(body, state),
    aliases: compiled.aliases,
    drivers: compiled.drivers,
  });
  const face: ReturnType<typeof evaluateHumanFaceRest> = evaluateHumanFaceRest(
    compiled.faceProducer,
    humanFaceBasisWeights(compiled.faceProducer, faceDocument),
  );
  const anchor: ReturnType<typeof humanPersonEyeCentre> = humanPersonEyeCentre(shaped.landmarks);
  // the body's rest pose is not the identity everywhere: the shape's own
  // shoulder rest poses the shoulders, so the transforms are the body
  // builder's own rest-document pose
  const { transforms }: ReturnType<typeof resolveHumanBodyBuildPose> = resolveHumanBodyBuildPose({
    basis: body,
    document: bodyDocument,
    poseRows: state.pose,
    landmarks: shaped.landmarks,
  });
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBuild["bones"][number]> = new Map<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBuild["bones"][number]
  >(
    [...transforms].map(([bone, frame]: [AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneTransform]): [AutoMovieHumanoidBone, IAutoMovieHumanBodyBuild["bones"][number]] => [
      bone,
      { bone, rest: frame.rest, posed: frame.posed },
    ]),
  );
  return formHumanPersonSkin(plan, {
    faceRest: {
      head: face.surfaces[compiled.faceProducerSkin],
      band:
        compiled.faceProducerBand === undefined
          ? undefined
          : face.surfaces[compiled.faceProducerBand],
    },
    shift: [
      anchor.x - compiled.neutralAnchor.x,
      anchor.y - compiled.neutralAnchor.y,
      anchor.z - compiled.neutralAnchor.z,
    ],
    bodyRest,
    bones,
    bodyPosed: skinHumanBodySurface(
      shaped.surfaces[compiled.bodyIndex],
      body.surfaces[compiled.bodyIndex].skin,
      body.joints,
      bones,
    ),
  });
}
