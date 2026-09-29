/**
 * Resolve one shaped body's retargetable humanoid pose and its skin transforms.
 * The caller has already admitted shoulder goals before shape evaluation.
 * This owner builds the shaped rest skeleton, validates both document clinical
 * angles and pelvic-relative rhythm angles, resolves TT humeral goals after
 * the girdle, and turns the pelvis about the two hip centres. The transforms
 * share the builder's Y-up, Z-forward metre frame; no mesh is moved here.
 */
import { Quaternion, Vector3, resolvePose, validatePose } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { resolveHumanBodyPelvifemoralRhythm } from "./resolveHumanBodyPelvifemoralRhythm";
import { resolveHumanBodyShoulders } from "./resolveHumanBodyShoulders";
import { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";

/**
 * Give skinning its rest-to-posed transforms only after every clinical reading
 * of the requested pose is valid. The pelvis uses the one bilateral hip line
 * after shoulder resolution and before transforms are published, so the
 * thorax and each authored thigh keep their world orientation.
 * This function allocates a new transform map for each document and leaves
 * the basis and authored pose untouched. The caller has already checked the
 * named TT shoulder goal against its basis range.
 */
export function resolveHumanBodyBuildPose(input: {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
  poseRows: IAutoMovieJointPose[];
  landmarks: Record<string, IAutoMovieVector3>;
}) {
  const { basis, document, poseRows, landmarks } = input;
  const { skeleton, rest, frames, axes } = resolveHumanBodySkeleton(
    basis,
    landmarks,
  );
  // The coupled document pose is what forward kinematics turns, and its
  // angles are judged against the clinical ranges. With a pelvifemoral
  // rhythm the legs' document flexion is trunk-relative, so the rig's
  // pelvic-relative hips and lumbar joint (the rhythm's additions applied)
  // are judged too: a request must hold under both readings.
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: poseRows,
  };
  const rhythm = resolveHumanBodyPelvifemoralRhythm(basis, poseRows);
  const violations = [
    ...validatePose({ pose, skeleton }).items,
    ...(rhythm.contributions.length === 0
      ? []
      : validatePose({ pose: { ...pose, joints: rhythm.joints }, skeleton })
          .items),
  ];
  if (violations.length > 0)
    throw new Error(
      "Body pose violates the skeleton or its clinical ranges: " +
        JSON.stringify(violations),
    );
  const transforms = new Map<
    AutoMovieHumanoidBone,
    {
      rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
      posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
    }
  >();
  // The rhythm leaves the trunk and both thighs where the document put
  // them relative to the trunk and turns only the pelvis, posteriorly by
  // the tilt about the line through both hip centres, which leaves the hip
  // centres, the lifted thigh's authored direction and the other foot in
  // place while the pelvis-to-thigh and pelvis-to-lumbar angles change.
  const tilt = -(
    rhythm.contributions.find((one) => one.bone === "hips")?.degrees ?? 0
  );
  const resolvedBones = resolveHumanBodyShoulders(
    basis,
    document.shoulders ?? [],
    rest,
    resolvePose(pose, skeleton, axes, frames),
  );
  if (tilt !== 0) {
    const at = (bone: AutoMovieHumanoidBone) =>
      resolvedBones.find((one) => one.bone === bone)!;
    const left = at("leftUpperLeg").worldPosition;
    const axis = Vector3.normalize(
      Vector3.subtract(left, at("rightUpperLeg").worldPosition),
    );
    // about +X (the subject's left) a positive angle carries the top of
    // the pelvis forward; a posterior tilt is the negative one
    const turn = Quaternion.fromAxisAngle(axis, -tilt);
    const pelvis = at("hips");
    pelvis.worldPosition = Vector3.add(
      left,
      Quaternion.rotateVector(
        turn,
        Vector3.subtract(pelvis.worldPosition, left),
      ),
    );
    pelvis.worldRotation = Quaternion.normalize(
      Quaternion.multiply(turn, pelvis.worldRotation),
    );
  }
  for (const resolved of resolvedBones)
    transforms.set(resolved.bone, {
      rest: rest.get(resolved.bone)!,
      posed: {
        position: resolved.worldPosition,
        rotation: resolved.worldRotation,
      },
    });
  return { skeleton, transforms };
}
