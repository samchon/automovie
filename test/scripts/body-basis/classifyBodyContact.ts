import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { BodyContactBones } from "./BodyContactBones";

/**
 * Whether a crossing pair is contact the pose owes and not a fold the tissue
 * gives: a distal limb segment (forearm, hand, digit, shank, foot, toes)
 * against a segment outside its own limb chain (same side, same limb).
 *
 * The forearm across the belly or the hand against the thigh behind the back
 * is a body meeting a body. A pad of skin that parted it would hide a contact
 * the editor's contact reading must report, so such a state is recorded as
 * limb contact and never pushed.
 */
export function isBodyLimbContact(a: string, b: string): boolean {
  const distal =
    /LowerArm|Hand|Thumb|Index|Middle|Ring|Little|LowerLeg|Foot|Toes/;
  const arm = /Shoulder|UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little/;
  const leg = /UpperLeg|LowerLeg|Foot|Toes/;
  const side = (bone: string): string =>
    bone.startsWith("left") ? "left" : bone.startsWith("right") ? "right" : "";
  const chain =
    side(a) !== "" &&
    side(a) === side(b) &&
    ((arm.test(a) && arm.test(b)) || (leg.test(a) && leg.test(b)));
  return (distal.test(a) || distal.test(b)) && !chain;
}

/**
 * Whether the head-to-tail segment of `bone` pierces any triangle of `skin`
 * (Moller-Trumbore, the segment bounded strictly inside the triangle and
 * between its ends).
 *
 * Tissue gives, bone does not: when one segment's bone passes through the
 * other segment's skin the body is passing through the body (a forearm
 * through the hip behind the back), which no pad of tissue can part, and the
 * solver records it and moves on. The bone's axis is its rotation's local Y
 * column and its length runs from the head; a bone with no frame pierces
 * nothing. `skin` lists corner indices into `positions`, three per triangle,
 * metres.
 */
export function isBoneThroughSkin(
  bones: BodyContactBones,
  bone: string,
  positions: number[],
  skin: number[],
): boolean {
  const frame = bones.get(bone as AutoMovieHumanoidBone);
  if (frame === undefined) return false;
  const { x, y, z, w } = frame.rotation;
  const along = [
    2 * (x * y - w * z) * frame.length,
    (1 - 2 * (x * x + z * z)) * frame.length,
    2 * (y * z + w * x) * frame.length,
  ];
  const head = [frame.position.x, frame.position.y, frame.position.z];
  for (let t = 0; t < skin.length; t += 3) {
    const [p0, p1, p2] = [0, 1, 2].map((k) => {
      const v = skin[t + k];
      return [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]];
    });
    const e1 = [0, 1, 2].map((k) => p1[k] - p0[k]);
    const e2 = [0, 1, 2].map((k) => p2[k] - p0[k]);
    const h = [
      along[1] * e2[2] - along[2] * e2[1],
      along[2] * e2[0] - along[0] * e2[2],
      along[0] * e2[1] - along[1] * e2[0],
    ];
    const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
    if (Math.abs(det) < 1e-15) continue;
    const s0 = [0, 1, 2].map((k) => head[k] - p0[k]);
    const u = (s0[0] * h[0] + s0[1] * h[1] + s0[2] * h[2]) / det;
    if (u <= 0 || u >= 1) continue;
    const qv = [
      s0[1] * e1[2] - s0[2] * e1[1],
      s0[2] * e1[0] - s0[0] * e1[2],
      s0[0] * e1[1] - s0[1] * e1[0],
    ];
    const v = (along[0] * qv[0] + along[1] * qv[1] + along[2] * qv[2]) / det;
    if (v <= 0 || u + v >= 1) continue;
    const at = (e2[0] * qv[0] + e2[1] * qv[1] + e2[2] * qv[2]) / det;
    if (at > 0 && at < 1) return true;
  }
  return false;
}
