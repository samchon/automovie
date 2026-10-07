import { Quaternion, Vector3 } from "@automovie/engine";

import { HUMAN_BODY_TOE_RANGE } from "../constants/HUMAN_BODY_TOE_RANGE";
import type { AutoMovieHumanBodyToeBone } from "../structures/rig/AutoMovieHumanBodyToeBone";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IHumanBodyToeRayInput } from "./IHumanBodyToeRayInput";

/**
 * Pose a body's toe ray phalanges on top of its humanoid toes bones.
 *
 * Each phalanx's rest position is its shaped `head` landmark. Its posed
 * placement follows the bone it hangs from (`parent`), then turns about its
 * own head by its document pose: flexion about the horizontal axis
 * perpendicular to the phalanx (`up × direction`, so positive flexion lowers
 * the tip on either foot), and, at a proximal phalanx, splay about the axis
 * perpendicular to both, signed so positive moves the toe toward the foot's
 * lateral side. Both axes are taken at rest and carried by the parent's
 * motion. With every ray at rest each phalanx moves exactly as its parent,
 * so a ray vertex moves as the toes bone moved it before rays existed.
 *
 * A document pose refuses by name when the basis declares no rays, names an
 * undeclared or repeated phalanx, splays an interphalangeal hinge, or leaves
 * `HUMAN_BODY_TOE_RANGE` (a convention). A basis without rays and a document
 * without toe poses return an empty map, so skinning keeps the one toes bone
 * and its output is unchanged to the bit.
 *
 * @evidence contracts/common.md#principled-implementation The rays compose on the toes bone's own transform, so existing toes poses keep their meaning and rays at rest reproduce them exactly.
 * @evidence contracts/common.md#clear-and-simple-design One parent-before-child pass over the declared rays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undeclared, repeated, out-of-range and hinge-splay poses refuse instead of being clamped or ignored.
 * @evidence contracts/common.md#meaningful-documentation States the axes, signs, composition and every refusal.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each phalanx keeps its own transform under its named parent.
 * @evidence contracts/modeling.md#parameter-channels Flexion and splay are named motions per phalanx.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Skinning applies these transforms; this owner emits none.
 * @evidence contracts/modeling.md#spatial-conventions Metres and degrees in the basis frame (+Y up, +Z forward, +X anatomical left).
 * @evidenceExclude contracts/modeling.md#shared-boundaries The skin owns the shared surface.
 * @evidence contracts/modeling.md#rendered-observation The posed toes are read in the body viewer's side, bottom and close frames.
 * @evidence contracts/anatomy.md#anatomical-source Rig landmarks stand for the joint centres; the ranges are a stated convention without a clinical source yet.
 * @evidence contracts/anatomy.md#permitted-range Each phalanx's flexion and the proximal splay are admitted within the convention ranges and refused with their cause beyond them.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are named phalanx motions in degrees only.
 * @author Samchon
 */
export function resolveHumanBodyToeRays(
  input: IHumanBodyToeRayInput,
): Map<AutoMovieHumanBodyToeBone, IAutoMovieHumanBodyBoneTransform> {
  const { basis, landmarks, transforms } = input;
  const rays = basis.toeRays ?? [];
  const poses = input.toes ?? [];
  const result = new Map<
    AutoMovieHumanBodyToeBone,
    IAutoMovieHumanBodyBoneTransform
  >();
  if (poses.length > 0 && rays.length === 0)
    throw new Error(
      "Body toe ray poses need a basis that declares toe rays: " +
        poses.map((one) => one.bone).join(", "),
    );
  const seen = new Set<string>();
  for (const pose of poses) {
    const ray = rays.find((one) => one.bone === pose.bone);
    if (ray === undefined || seen.has(pose.bone))
      throw new Error(
        "Body toe pose names an undeclared or repeated phalanx: " + pose.bone,
      );
    seen.add(pose.bone);
    const proximal = ray.parent === "leftToes" || ray.parent === "rightToes";
    const flexion = proximal
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
      const splay = HUMAN_BODY_TOE_RANGE.proximal.abduction;
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
    const parent =
      transforms.get(ray.parent) ??
      result.get(ray.parent as AutoMovieHumanBodyToeBone);
    const head = landmarks[ray.head];
    const tail = landmarks[ray.tail];
    if (parent === undefined || head === undefined || tail === undefined)
      throw new Error(
        "Body toe ray needs its parent transform and both landmarks: " +
          ray.bone,
      );
    const carry = Quaternion.multiply(
      parent.posed.rotation,
      Quaternion.inverse(parent.rest.rotation),
    );
    const posedHead = Vector3.add(
      parent.posed.position,
      Quaternion.rotateVector(
        carry,
        Vector3.subtract(head, parent.rest.position),
      ),
    );
    const direction = Vector3.subtract(tail, head);
    const bend = Vector3.cross(Vector3.create(0, 1, 0), direction);
    if (Vector3.length(direction) < 1e-9 || Vector3.length(bend) < 1e-9)
      throw new Error(
        "Body toe ray needs a non-vertical phalanx axis: " + ray.bone,
      );
    const pose = poses.find((one) => one.bone === ray.bone);
    const flexAxis = Vector3.normalize(bend);
    const splayAxis = Vector3.normalize(Vector3.cross(direction, flexAxis));
    const lateral = ray.bone.startsWith("left") ? 1 : -1;
    const local = Quaternion.multiply(
      Quaternion.fromAxisAngle(splayAxis, lateral * (pose?.abduction ?? 0)),
      Quaternion.fromAxisAngle(flexAxis, pose?.flexion ?? 0),
    );
    const delta = Quaternion.normalize(Quaternion.multiply(carry, local));
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
