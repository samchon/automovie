import { Quaternion, Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";

/** Apply the existing hips-only rhythm on the same resolved graph before sites and public projections are read. */
export function applyHumanBodySourcePelvicRhythm(
  input: IAutoMovieHumanBodySourceRigInput,
  bones: Map<AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform>,
): void {
  const tilt = input.pelvicRhythmContributionDegrees ?? 0;
  if (!Number.isFinite(tilt))
    throw new Error("Anatomical pelvic rhythm needs finite degrees.");
  if (tilt === 0) return;
  const registration = input.rig.pelvicRhythm;
  if (registration === undefined)
    throw new Error(
      "Anatomical source lacks the requested pelvic rhythm registration.",
    );
  const at = (id: AutoMovieHumanBodyBoneId, siteId: string) => {
    const frame = bones.get(id)?.posed;
    const site = input.rig.nodes
      .find((one) => one.id === id)
      ?.sites.find((one) => one.id === siteId);
    if (frame === undefined || site === undefined)
      throw new Error(
        "Anatomical pelvic rhythm lacks its registered hip site: " +
          id +
          "." +
          siteId,
      );
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, site.position),
    );
  };
  const left = at(registration.leftHipBone, registration.leftHipSite);
  const right = at(registration.rightHipBone, registration.rightHipSite);
  const line = Vector3.subtract(left, right);
  if (
    ![line.x, line.y, line.z].every(Number.isFinite) ||
    Vector3.length(line) === 0
  )
    throw new Error(
      "Anatomical pelvic rhythm needs distinct finite bilateral hip centres.",
    );
  // The existing hips primitive stands for the whole pelvic ring, not one
  // sacral mesh. Its actual members share the same turn while thighs/trunk stay.
  const turn = Quaternion.fromAxisAngle(Vector3.normalize(line), tilt);
  for (const id of registration.members) {
    const bone = bones.get(id);
    if (bone === undefined)
      throw new Error(
        "Anatomical pelvic rhythm lacks its registered member: " + id,
      );
    bones.set(id, {
      rest: bone.rest,
      posed: {
        position: Vector3.add(
          left,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(bone.posed.position, left),
          ),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(turn, bone.posed.rotation),
        ),
      },
    });
  }
}
