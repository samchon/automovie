import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/*
 * The body's joints whose range clamp gives a record it issued back bit for
 * bit, and that no writer of a resolved posture sets outside a clamp: a
 * displayed pose resolved from its posture alone holds, at these joints, the
 * clamp's own records, so its final clamp may keep them.
 *
 * `clampJointRom` clamps a box axis by `min`/`max`, which returns an angle in
 * its interval as it is, and an immobile axis to its zero; a swing cone whose
 * two anchors are zero (each axis's range holds zero, or the axis rests) writes
 * `0 + (v - 0) * t`, and `swingConeBlend` returns exactly 1 for a point inside
 * the cone, which a blended point is (the bracket's admitted end), so clamping
 * again gives `v` (a negative zero comes back positive, the same angle). A cone
 * anchored off zero and a swing-twist joint (projected again) are left out, and
 * so are the digits and the toes, which the digit fit and a foot contact's toe
 * edit write after the limbs.
 * Parameter skeleton: The body's rig, which the body reads this from once
 * (`IHumanBody.settled`).
 * Returns: Each such joint's bone.
 */
export function humanSettledJoints(
  skeleton: IAutoMovieSkeleton,
): ReadonlySet<AutoMovieHumanoidBone> {
  const out: Set<AutoMovieHumanoidBone> = new Set();
  const seen: Set<AutoMovieHumanoidBone> = new Set();
  for (const bone of skeleton.bones) {
    // The clamp reads the first record of a name.
    if (seen.has(bone.bone)) continue;
    seen.add(bone.bone);
    if (WRITTEN.test(bone.bone)) continue;
    if (idempotent(bone)) out.add(bone.bone);
  }
  return out;
}

/*
 * Whether the clamp of a bone's joint gives back a record it issued.
 */
function idempotent(bone: IAutoMovieBone): boolean {
  const constraint: IAutoMovieJointConstraint | null = AutoMovieEngineKinematics.getConstraint(
    bone.bone,
    bone.constraint ?? null,
  );
  if (constraint === null) return true;
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
    return false;
  if (constraint.swingDeg === undefined || constraint.swingDeg === null)
    return true;
  return holdsZero(constraint.flexion) && holdsZero(constraint.abduction);
}

/*
 * Whether an axis's cone anchor is zero (`clampJointRom`'s `nearestNeutral`): a
 * range holding zero, or an immobile axis.
 */
function holdsZero(range: IAutoMovieAngleRange | null): boolean {
  return range === null || (range.min <= 0 && range.max >= 0);
}

/*
 * The bones a resolved posture's later writers set outside the clamp: the
 * digits (the digit fit) and the toes (a foot contact's toe edit).
 */
const WRITTEN: RegExp = /(Thumb|Index|Middle|Ring|Little|Toes)/u;
