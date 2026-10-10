import type { IAutoMovieJointPose } from "@automovie/interface";

import { resolveHumanBodyAnatomy } from "../anatomy/resolveHumanBodyAnatomy";
import { admitHumanBodyBasisDocument } from "../document/admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { humanBodyShoulderReaches } from "./humanBodyShoulderReaches";
import { prepareHumanBodyReferenceGoalDocument } from "./prepareHumanBodyReferenceGoalDocument";
import { resolveHumanBodyBuildPose } from "./resolveHumanBodyBuildPose";
import { resolveHumanBodyShapeShoulderRest } from "./resolveHumanBodyShapeShoulderRest";

/**
 * Read the current document's admitted source-rig clinical coordinates.
 *
 * The body editor uses this light rig path on its current draft. It evaluates
 * the same channel/corrective landmarks and pose resolver as the skin builder,
 * after solving any named anatomical targets through the same owner,
 * without allocating skin or using a previous worker reply. The supplied basis
 * must already be admitted; this call admits the document, its shape and its
 * motion. A refused draft throws to the editor's last-valid transaction owner.
 * Named TT shoulders keep their own clinical owner and are absent from this
 * generic Euler reading. No document, basis or source frame is mutated.
 *
 * The coordinates are the existing engine inverse's double-precision values,
 * with its finite/gimbal limits. They establish source-rig admission, not a
 * mathematically certified angle interval or personal clinical capacity.
 */
export function resolveHumanBodyDocumentPose(
  basis: IAutoMovieHumanBodyBasis,
  input: IAutoMovieHumanBodyBasisDocument,
): IAutoMovieJointPose[] {
  const admitted = admitHumanBodyBasisDocument(input, basis.anatomicalAssembly);
  let document =
    admitted.anatomy === undefined
      ? admitted
      : {
          ...admitted,
          shape: resolveHumanBodyAnatomy(
            basis,
            admitted.shape,
            admitted.anatomy,
          ),
        };
  if (document.basis !== basis.id)
    throw new Error(
      "Body pose reading needs the exact compiled basis revision.",
    );
  const referenceGoals = prepareHumanBodyReferenceGoalDocument(basis, document);
  document = referenceGoals.document;
  const rest = resolveHumanBodyShapeShoulderRest(basis, document.shape);
  const state = humanBodyBasisWeights(basis, document, rest);
  for (const shoulder of document.shoulders ?? []) {
    const contract = basis.joints.find(
      (joint) => joint.bone === shoulder.bone,
    )?.shoulder;
    if (contract === undefined || !humanBodyShoulderReaches(contract, shoulder))
      throw new Error(
        "Body shoulder goal exceeds its thorax-tt clinical range: " +
          shoulder.bone,
      );
  }
  return resolveHumanBodyBuildPose({
    basis,
    document,
    poseRows: state.pose,
    landmarks: evaluateHumanBodyLandmarks(basis, state),
    rig: referenceGoals.rig,
  }).clinical;
}
