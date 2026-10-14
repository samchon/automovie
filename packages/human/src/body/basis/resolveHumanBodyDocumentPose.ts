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
 * The body editor uses this light rig path on its current draft. Named anatomical targets first pass through their existing solver, which can evaluate and allocate candidate skin for its instruments. Subsequent channel/corrective landmark and pose readout uses the builder's same owners without constructing another skin or using a previous worker reply. The supplied basis must already be admitted; this call admits the document, its shape and its motion. A refused draft throws to the editor's last-valid transaction owner. Named TT shoulders keep their own clinical owner and are absent from this generic Euler reading. No document, basis or source frame is mutated.
 *
 * The coordinates are the existing engine inverse's double-precision values, with its finite/gimbal limits. They establish source-rig admission, not a mathematically certified angle interval or personal clinical capacity.
 *
 * @evidence contracts/common.md#principled-implementation The editor draft follows the builder's document/anatomy/reference-goal/weight and landmark/pose owners, so actual source-rig clinical readout uses current draft state rather than an older worker result.
 * @evidence contracts/common.md#clear-and-simple-design After any anatomy solver's candidate evaluation, an admitted-basis light rig path reads landmarks and motion without another skin build, leaving TT shoulder readout with its separate owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Basis mismatch, unsupported shape and invalid shoulder/pose requests refuse to the editor's last-valid transaction; returned inverse coordinates certify no personal motion capacity or mathematically bounded angular uncertainty.
 * @evidence contracts/common.md#meaningful-documentation The prose states admitted basis, current draft, anatomy solve, rig-only work, excluded TT Euler slots, unchanged input and the source inverse's numerical limits.
 * @evidence contracts/performance.md#efficient-algorithms Anatomy preprocessing retains its candidate skin/instrument costs; subsequent reference/weight, sparse landmark and rig readout avoids a further skin position and material-region build.
 * @evidence contracts/performance.md#reuse-equivalent-work The same weight, shaped shoulder-rest, goal-preparation and pose owners are reused with the builder; any prepared reference-goal rig is passed into final pose resolution instead of rebuilding it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned clinical rows escape; prepared documents, weight maps, landmarks and rig temporaries expire with this call, while failure leaves caller-owned draft/basis unchanged and acquires no external resources.
 */
export function resolveHumanBodyDocumentPose(
  basis: IAutoMovieHumanBodyBasis,
  input: IAutoMovieHumanBodyBasisDocument,
): IAutoMovieJointPose[] {
  const admitted: IAutoMovieHumanBodyBasisDocument =
    admitHumanBodyBasisDocument(input, basis.anatomicalAssembly);
  let document: IAutoMovieHumanBodyBasisDocument =
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
  const referenceGoals: ReturnType<
    typeof prepareHumanBodyReferenceGoalDocument
  > = prepareHumanBodyReferenceGoalDocument(basis, document);
  document = referenceGoals.document;
  const rest: ReturnType<typeof resolveHumanBodyShapeShoulderRest> =
    resolveHumanBodyShapeShoulderRest(basis, document.shape);
  const state: ReturnType<typeof humanBodyBasisWeights> = humanBodyBasisWeights(
    basis,
    document,
    rest,
  );
  for (const shoulder of document.shoulders ?? []) {
    const contract: IAutoMovieHumanBodyBasis["joints"][number]["shoulder"] =
      basis.joints.find(
        (joint: IAutoMovieHumanBodyBasis["joints"][number]): boolean =>
          joint.bone === shoulder.bone,
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
