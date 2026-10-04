import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { admitHumanBodyBasisDocument } from "../document/admitHumanBodyBasisDocument";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";
import { resolveHumanBodyBuildPose } from "./resolveHumanBodyBuildPose";
import { resolveHumanBodyShapeShoulderRest } from "./resolveHumanBodyShapeShoulderRest";

/**
 * Read the current document's admitted source-rig clinical coordinates.
 *
 * The body editor uses this light rig path on its current draft. It evaluates
 * the same channel/corrective landmarks and pose resolver as the skin builder,
 * without allocating skin or using a previous worker reply. The supplied basis
 * must already be admitted; this call admits the document, its shape and its
 * motion. A refused draft throws to the editor's last-valid transaction owner.
 * Named TT shoulders keep their own clinical owner and are absent from this
 * generic Euler reading. No document, basis or source frame is mutated.
 *
 * The coordinates are the existing engine inverse's double-precision values,
 * with its finite/gimbal limits. They establish source-rig admission, not a
 * mathematically certified angle interval or personal clinical capacity.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the builder's weights, landmark evaluation and complete pose resolution; every displayed coordinate therefore follows the same shaped skeleton and actual post-pelvis parent frames.
 * @evidence contracts/common.md#clear-and-simple-design A rig-only orchestration over existing owners, with no skin generation or cached prior document result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture or angle correction is substituted for the shared pose resolver; the current document is admitted before it is read.
 * @evidence contracts/common.md#meaningful-documentation States the admitted-basis precondition, current-draft use, refusal ownership, TT exclusion and numerical qualification.
 * @evidence contracts/modeling.md#spatial-conventions Inputs retain the basis's metre landmarks and clinical-degree conventions; output clinical degrees use the same shaped axes/rest frames as skinning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidence contracts/modeling.md#parameter-channels The document's existing named shape channels and joint/TT motions retain their own neutral and side rules; this query reads their combined source-rig state and introduces no new authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no skin or primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Supplies the numerical readout; the assembly owner observes its unchanged supported surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Preserves the admitted source rig's conventions without supplying a new anatomical value.
 * @evidence contracts/anatomy.md#permitted-range The shared pose resolver judges both authored coordinates and actual changed parent-relative coordinates; unsupported TT goals are refused through their own reach owner.
 * @evidence contracts/anatomy.md#parametric-authority Reads named document motions and channel-shaped landmarks, without personal vertex or curve inputs.
 */
export function resolveHumanBodyDocumentPose(
  basis: IAutoMovieHumanBodyBasis,
  input: IAutoMovieHumanBodyBasisDocument,
): IAutoMovieJointPose[] {
  const document = admitHumanBodyBasisDocument(input);
  if (document.basis !== basis.id)
    throw new Error("Body pose reading needs the exact compiled basis revision.");
  const rest = resolveHumanBodyShapeShoulderRest(basis, document.shape);
  const state = humanBodyBasisWeights(basis, document, rest);
  for (const shoulder of document.shoulders ?? []) {
    const contract = basis.joints.find((joint) => joint.bone === shoulder.bone)?.shoulder;
    if (contract === undefined || !humanBodyShoulderReaches(contract, shoulder))
      throw new Error("Body shoulder goal exceeds its thorax-tt clinical range: " + shoulder.bone);
  }
  return resolveHumanBodyBuildPose({
    basis,
    document,
    poseRows: state.pose,
    landmarks: evaluateHumanBodyLandmarks(basis, state),
  }).clinical;
}
