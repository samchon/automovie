import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HUMAN_BODY_TOE_RANGE } from "../constants/HUMAN_BODY_TOE_RANGE";
import type { AutoMovieHumanBodyToeBone } from "../structures/rig/AutoMovieHumanBodyToeBone";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IHumanBodyToeRayInput } from "./IHumanBodyToeRayInput";

/**
 * Pose a body's toe ray phalanges on top of its humanoid toes bones.
 *
 * Each phalanx's rest position is its shaped `head` landmark. Its posed placement follows its parent's rigid frame, then turns about its own head: flexion around `up × direction` lowers the tip, and proximal splay turns around the perpendicular axis toward that foot's lateral side. Body coordinates are metres and requested angles are degrees; rest axes are carried by the parent's motion. A parent-before-child basis supplies the same frame chain used by skinning.
 *
 * A document pose refuses when the basis declares no rays, names an undeclared/repeated phalanx, splays an interphalangeal hinge or leaves HUMAN_BODY_TOE_RANGE. Those intervals are conventional rather than primary ray-by-ray clinical measurements. No requested ray returns an empty map so skinning retains its ordinary toes bone. A requested ray requires parent transforms, finite admitted landmarks and a nonvertical head-to-tail axis; the 1e-9 metre direction/bend threshold is numerical policy rather than anatomical accuracy. Neither caller data nor transforms are mutated, and the returned map owns new frame records.
 *
 * @evidence contracts/common.md#principled-implementation Named toe requests pass conventional flexion/splay admission before parent-first ray frames carry shaped head landmarks and apply foot-signed rest-axis rotations.
 * @evidence contracts/common.md#clear-and-simple-design Request admission precedes one declared-ray walk returning the same rest/posed transform representation consumed by skinHumanBodySurface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undeclared/repeated rays, hinge splay, missing frames/landmarks and near-vertical axes refuse; fixed motion intervals do not establish measured clinical toe capacity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre/degree frames, flexion/splay signs, conventional range provenance, empty-request fallback and parent-order premises.
 * @evidence contracts/performance.md#efficient-algorithms P requests search R declared rays and the R-ray posing walk searches P requests, giving O(PR+R) work with map-based parent lookup; omission avoids all posing work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing admitted parent transforms and shared quaternion/vector operations carry every ray, while a missing request retains the established whole-toes skinning path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local duplicate set expires and only the R-entry result map escapes; unchanged rest positions are borrowed, posed frames are new and no persistent cache or task is acquired.
 *
 * @author Samchon
 */
export function resolveHumanBodyToeRays(
  input: IHumanBodyToeRayInput,
): Map<AutoMovieHumanBodyToeBone, IAutoMovieHumanBodyBoneTransform> {
  const { basis, landmarks, transforms }: IHumanBodyToeRayInput = input;
  const rays: NonNullable<IHumanBodyToeRayInput["basis"]["toeRays"]> =
    basis.toeRays ?? [];
  const poses: NonNullable<IHumanBodyToeRayInput["toes"]> = input.toes ?? [];
  const result: Map<
    AutoMovieHumanBodyToeBone,
    IAutoMovieHumanBodyBoneTransform
  > = new Map<AutoMovieHumanBodyToeBone, IAutoMovieHumanBodyBoneTransform>();
  if (poses.length > 0 && rays.length === 0)
    throw new Error(
      "Body toe ray poses need a basis that declares toe rays: " +
        poses.map((one: (typeof poses)[number]): string => one.bone).join(", "),
    );
  const seen: Set<string> = new Set<string>();
  for (const pose of poses) {
    const ray: (typeof rays)[number] | undefined = rays.find(
      (one: (typeof rays)[number]): boolean => one.bone === pose.bone,
    );
    if (ray === undefined || seen.has(pose.bone))
      throw new Error(
        "Body toe pose names an undeclared or repeated phalanx: " + pose.bone,
      );
    seen.add(pose.bone);
    const proximal: boolean =
      ray.parent === "leftToes" || ray.parent === "rightToes";
    const flexion: readonly [number, number] = proximal
      ? HUMAN_BODY_TOE_RANGE.proximal.flexion
      : HUMAN_BODY_TOE_RANGE.interphalangeal.flexion;
    if (
      !Number.isFinite(pose.flexion) ||
      pose.flexion < flexion[0] ||
      pose.flexion > flexion[1]
    )
      throw new Error(
        `Body toe flexion of ${pose.bone} is outside ${flexion[0]} to ${flexion[1]} degrees: ${pose.flexion}`,
      );
    if (pose.abduction !== undefined) {
      const splay: readonly [number, number] =
        HUMAN_BODY_TOE_RANGE.proximal.abduction;
      if (!proximal)
        throw new Error(
          "Body toe splay exists only at a proximal phalanx: " + pose.bone,
        );
      if (
        !Number.isFinite(pose.abduction) ||
        pose.abduction < splay[0] ||
        pose.abduction > splay[1]
      )
        throw new Error(
          `Body toe splay of ${pose.bone} is outside ${splay[0]} to ${splay[1]} degrees: ${pose.abduction}`,
        );
    }
  }
  // no posed phalanx: the toes bone alone skins the toes, exactly as before
  if (poses.length === 0) return result;
  for (const ray of rays) {
    const parent: IAutoMovieHumanBodyBoneTransform | undefined =
      transforms.get(ray.parent) ??
      result.get(ray.parent as AutoMovieHumanBodyToeBone);
    const head: IAutoMovieVector3 | undefined = landmarks[ray.head];
    const tail: IAutoMovieVector3 | undefined = landmarks[ray.tail];
    if (parent === undefined || head === undefined || tail === undefined)
      throw new Error(
        "Body toe ray needs its parent transform and both landmarks: " +
          ray.bone,
      );
    const carry: IAutoMovieQuaternion = Quaternion.multiply(
      parent.posed.rotation,
      Quaternion.inverse(parent.rest.rotation),
    );
    const posedHead: IAutoMovieVector3 = Vector3.add(
      parent.posed.position,
      Quaternion.rotateVector(
        carry,
        Vector3.subtract(head, parent.rest.position),
      ),
    );
    const direction: IAutoMovieVector3 = Vector3.subtract(tail, head);
    const bend: IAutoMovieVector3 = Vector3.cross(
      Vector3.create(0, 1, 0),
      direction,
    );
    const directionLength: number = Vector3.length(direction);
    const bendLength: number = Vector3.length(bend);
    if (
      !Number.isFinite(directionLength) ||
      !Number.isFinite(bendLength) ||
      directionLength < 1e-9 ||
      bendLength < 1e-9
    )
      throw new Error(
        "Body toe ray needs a non-vertical phalanx axis: " + ray.bone,
      );
    const pose: (typeof poses)[number] | undefined = poses.find(
      (one: (typeof poses)[number]): boolean => one.bone === ray.bone,
    );
    const flexAxis: IAutoMovieVector3 = Vector3.normalize(bend);
    const splayAxis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(direction, flexAxis),
    );
    const lateral: number = ray.bone.startsWith("left") ? 1 : -1;
    const local: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle(splayAxis, lateral * (pose?.abduction ?? 0)),
      Quaternion.fromAxisAngle(flexAxis, pose?.flexion ?? 0),
    );
    const delta: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(carry, local),
    );
    result.set(ray.bone, {
      rest: { position: head, rotation: parent.rest.rotation },
      posed: {
        position: posedHead,
        rotation: Quaternion.normalize(
          Quaternion.multiply(delta, parent.rest.rotation),
        ),
      },
    });
  }
  return result;
}
