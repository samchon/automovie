import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { applyHumanBodyShapeRows } from "../../body/basis/applyHumanBodyShapeRows";
import { evaluateHumanBodyShape } from "../../body/basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import { resolveHumanBodyShapeShoulderRest } from "../../body/basis/resolveHumanBodyShapeShoulderRest";
import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import { resolveHumanBodyBuildPose } from "../../body/basis/resolveHumanBodyBuildPose";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import { evaluateHumanFaceRest } from "../../face/basis/evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "../../face/basis/humanFaceBasisWeights";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonFormedSkin } from "../structures/IAutoMovieHumanPersonFormedSkin";
import { deriveHumanPersonGenerationFace } from "./deriveHumanPersonGenerationFace";
import { formHumanPersonSkin } from "./formHumanPersonSkin";
import { humanPersonBodyEndpointGains } from "./humanPersonBodyEndpointGains";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";

/**
 * Evaluate a person's skin at rest: shape only, no pose, neutral expression,
 * with the rest layers of both partitions and none of the build stages a
 * measurement does not read.
 *
 * The body view's shaped surface and landmarks come from the same endpoint
 * state the body builder skins with (`humanBodyBasisWeights`, the shape's own
 * shoulder rest). The face producer's rest layer (`evaluateHumanFaceRest`)
 * evaluates the person's derived face document, driver gains included. The
 * head carry is the shaped eye centre minus the neutral one, as in the full
 * evaluator. The two are formed into one skin by the evaluator's own forming
 * step (`formHumanPersonSkin`) under the body's own rest-document pose
 * (`resolveHumanBodyBuildPose`: the shape's shoulder rest, no authored pose). Parts, materials, normals, hair and closure stages are not
 * evaluated, so this is the full evaluator's rest skin only where those
 * stages leave the skin unchanged; a consumer compares the two before
 * relying on it.
 *
 * @evidence contracts/common.md#principled-implementation It reuses the full evaluator's compiled plan, document derivation and forming step, replacing only the stages the rest skin does not depend on.
 * @evidence contracts/common.md#clear-and-simple-design Body state, face rest, head carry, one forming call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states which build stages are skipped and that a consumer must compare against the full evaluator; no posed document is accepted silently, the pose is removed.
 * @evidence contracts/common.md#meaningful-documentation States each layer's source, the skipped stages and the comparison duty.
 * @evidence contracts/modeling.md#spatial-conventions Rest metres of the person frame; the head carry is the eye-centre translation.
 * @evidence contracts/modeling.md#shared-boundaries The forming step gives each shared sample one rest value.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function forms skin positions and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The partition owners evaluate the channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no model.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The partition owners admit the document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input.
 */
export function evaluateHumanPersonRestSkin(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanPersonFormedSkin {
  const { generation, plan } = compiled;
  const body = generation.body;
  const bodyDocument = deriveHumanPersonBody({ document, faceMaterials: generation.face.materials });
  delete bodyDocument.pose;
  delete bodyDocument.shoulders;
  const state = humanBodyBasisWeights(body, bodyDocument, resolveHumanBodyShapeShoulderRest(body, bodyDocument.shape));
  const shaped = evaluateHumanBodyShape(body, state);
  const bodyRest = compiled.restNeutral.slice();
  applyHumanBodyShapeRows(body, state, bodyRest, compiled.restTargets);
  const faceDocument = deriveHumanPersonGenerationFace({
    document: { ...document, face: { ...document.face, expression: {} } },
    gains: humanPersonBodyEndpointGains(body, state),
    aliases: compiled.aliases,
    drivers: compiled.drivers,
  });
  const face = evaluateHumanFaceRest(compiled.faceProducer, humanFaceBasisWeights(compiled.faceProducer, faceDocument));
  const anchor = humanPersonEyeCentre(shaped.landmarks);
  // the body's rest pose is not the identity everywhere: the shape's own
  // shoulder rest poses the shoulders, so the transforms are the body
  // builder's own rest-document pose
  const { transforms } = resolveHumanBodyBuildPose({
    basis: body,
    document: bodyDocument,
    poseRows: state.pose,
    landmarks: shaped.landmarks,
  });
  const bones = new Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBuild["bones"][number]>(
    [...transforms].map(([bone, frame]) => [bone, { bone, rest: frame.rest, posed: frame.posed }]),
  );
  return formHumanPersonSkin(plan, {
    faceRest: {
      head: face.surfaces[compiled.faceProducerSkin],
      band: compiled.faceProducerBand === undefined ? undefined : face.surfaces[compiled.faceProducerBand],
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
