import type { AutoMovieHumanoidBone } from "@automovie/interface";

/** The zones a pose-defect census reports, in reading order. */
export const BODY_POSE_DEFECT_ZONES = [
  "trunk",
  "shoulder",
  "arm",
  "hand",
  "leg",
  "foot",
] as const;

/** One census zone. */
export type BodyPoseDefectZone = (typeof BODY_POSE_DEFECT_ZONES)[number];

/**
 * The census zone a skin vertex belongs to, read from the bone that carries
 * most of its weight at rest.
 *
 * The trunk is the pelvis, the spine and chest and the neck; the shoulder is
 * the clavicle bone (`leftShoulder`, `rightShoulder`) that the girdle rides
 * on; the arm is the upper and lower arm; the hand and the foot own every
 * finger and toe bone. The zones exist so that a reader can say where a pose
 * defect stands (a belly fold is the trunk's, a shoulder fold the shoulder's)
 * without a second list of vertices: the bone names come from the basis'
 * own skin joints, so a renamed or added bone lands in the trunk only when it
 * is none of the others, and the census then shows it in the trunk column.
 */
export function bodyPoseDefectZone(
  bone: AutoMovieHumanoidBone,
): BodyPoseDefectZone {
  if (/Shoulder$/.test(bone)) return "shoulder";
  if (/(UpperArm|LowerArm)$/.test(bone)) return "arm";
  if (/(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)) return "hand";
  if (/(UpperLeg|LowerLeg)$/.test(bone)) return "leg";
  if (/(Foot|Toes)$/.test(bone)) return "foot";
  return "trunk";
}
