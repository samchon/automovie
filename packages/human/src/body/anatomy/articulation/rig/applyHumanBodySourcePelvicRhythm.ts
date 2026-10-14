import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourcePelvicRhythm } from "./IAutoMovieHumanBodySourcePelvicRhythm";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import type { IAutoMovieHumanBodySourceSite } from "./IAutoMovieHumanBodySourceSite";

/**
 * Apply the existing hips-only rhythm on the same resolved graph before sites and public projections are read.
 *
 * The caller owns bones and receives committed updates only after every declared member resolves. The signed degree contribution turns about the right-to-left hip line; positive tilts the pelvis forward. Missing registration, sites or members and degenerate hip lines throw without changing bones. Other graph frames remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A normalized line between registered posed hip sites defines the degree-axis rotation applied only to declared pelvic-ring members; nonfinite or coincident endpoints refuse.
 * @evidence contracts/common.md#clear-and-simple-design One in-place map operation applies the final hips-only transition before site and projection reads; source registration owns its member list and hip sites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual registered sites define the line and other trunk/thigh frames are untouched; all member updates are prepared before committing, so a missing member leaves the caller's map unchanged.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies hips-only ordering, caller-owned map mutation, degree direction, missing-registration refusal and unchanged state on failure.
 * @evidence contracts/performance.md#efficient-algorithms Two node/site searches cost O(N+S), followed by O(M) constant-size rotations and one O(M) commit for M pelvic members; O(M) staged records preserve failure atomicity and the zero-angle path returns before graph searches.
 * @evidence contracts/performance.md#reuse-equivalent-work Both endpoints and the one turn quaternion are reused across pelvic members; no previous pose is reused because the supplied map's frames define the current line.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the mutated map; staged updates, endpoints and turn quaternion are call-local and released on completion or refusal, with no geometry population or background work retained.
 */
export function applyHumanBodySourcePelvicRhythm(
  input: IAutoMovieHumanBodySourceRigInput,
  bones: Map<AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform>,
): void {
  const tilt: number = input.pelvicRhythmContributionDegrees ?? 0;
  if (!Number.isFinite(tilt))
    throw new Error("Anatomical pelvic rhythm needs finite degrees.");
  if (tilt === 0) return;
  const registration: IAutoMovieHumanBodySourcePelvicRhythm | undefined =
    input.rig.pelvicRhythm;
  if (registration === undefined)
    throw new Error(
      "Anatomical source lacks the requested pelvic rhythm registration.",
    );
  const at: (
    id: AutoMovieHumanBodyBoneId,
    siteId: string,
  ) => IAutoMovieVector3 = (
    id: AutoMovieHumanBodyBoneId,
    siteId: string,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieHumanBodyBoneWorldRest | undefined =
      bones.get(id)?.posed;
    const site: IAutoMovieHumanBodySourceSite | undefined = input.rig.nodes
      .find((one: IAutoMovieHumanBodySourceBoneNode): boolean => one.id === id)
      ?.sites.find(
        (one: IAutoMovieHumanBodySourceSite): boolean => one.id === siteId,
      );
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
  const left: IAutoMovieVector3 = at(
    registration.leftHipBone,
    registration.leftHipSite,
  );
  const right: IAutoMovieVector3 = at(
    registration.rightHipBone,
    registration.rightHipSite,
  );
  const line: IAutoMovieVector3 = Vector3.subtract(left, right);
  if (
    ![line.x, line.y, line.z].every(Number.isFinite) ||
    Vector3.length(line) === 0
  )
    throw new Error(
      "Anatomical pelvic rhythm needs distinct finite bilateral hip centres.",
    );
  // The existing hips primitive stands for the whole pelvic ring, not one
  // sacral mesh. Its actual members share the same turn while thighs/trunk stay.
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    Vector3.normalize(line),
    tilt,
  );
  const updates: Map<
    AutoMovieHumanBodyBoneId,
    IAutoMovieHumanBodyBoneTransform
  > = new Map();
  for (const id of registration.members) {
    const bone: IAutoMovieHumanBodyBoneTransform | undefined = bones.get(id);
    if (bone === undefined)
      throw new Error(
        "Anatomical pelvic rhythm lacks its registered member: " + id,
      );
    updates.set(id, {
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
  for (const [id, update] of updates) bones.set(id, update);
}
