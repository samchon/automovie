import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedJointAngles,
  Quaternion,
  decomposeJointRotation,
  getConstraint,
  jointToQuaternion,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * A joint's clinical angles part of the way between two readings of them,
 * blended the way the joint moves: a ball joint as a rotation, a joint with
 * fewer freedoms angle by angle.
 *
 * A ball joint's rotation has more than one clinical triple: a raised upper
 * arm reads `[90, -30, -57]` and `[95, 112, 90]` for nearly the same arm, the
 * two charts of one rotation. A blend of the three numbers one by one
 * therefore depends on which chart each end happens to be written in, and
 * between a hanging arm and a raised one in the far chart it passes through
 * an arm no body holds. So each end is turned into the joint's rotation, the
 * two rotations are interpolated on the shorter arc (Shoemake 1985,
 * "Animating rotation with quaternion curves", SIGGRAPH), and the result is
 * read back as the clinical triple of the chart the joint's range of motion
 * admits best, the reading the limb fit gives its own solutions.
 *
 * A joint whose range lacks a freedom (the elbow with the forearm's turn has
 * no abduction, the wrist no twist, the knee only flexion) has one triple per
 * rotation, and the shorter arc between two of its rotations leaves the
 * freedoms it has: between an elbow at 12 degrees and one at 150 degrees
 * pronated 90 the arc passes through a forearm bent sideways, which reads
 * back as abduction the elbow does not own. Such a joint is therefore blended
 * angle by angle, each freedom moving on its own axis, and a freedom it lacks
 * stays where both ends hold it.
 *
 * @param body The body, for the joint's axes and range.
 * @param bone The joint.
 * @param from The `[flexion, abduction, twist]` at share 0, degrees.
 * @param to The same at share 1.
 * @param share How far from `from` to `to`, clamped to [0, 1].
 * @returns The blended `[flexion, abduction, twist]`, degrees; an end is returned as given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is blended, why the channels are not, the interpolation, the chart of the result, each argument with its unit, and what an end returns.
 * @evidence contracts/development/implementation.md#principled-implementation Spherical linear interpolation of the two joint rotations is the constant-speed shortest turn between them and does not depend on either end's chart; the triple is recovered by the engine's exact inverse. A joint with fewer than three freedoms moves only about its own axes, so its angles are its coordinates and are interpolated as such.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the joint's range, then either three linear blends or two forward conversions, one interpolation and one inverse; the single owner of a blend of joint triples, read by the arm's carry and by every reference blended between two solutions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is named: the joint's own range of motion says whether it is a ball joint. The share is clamped so the joint cannot pass either end, and an end keeps its own triple instead of a re-read one.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time per joint.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `jointToQuaternion`, `Quaternion.slerp` and `decomposeJointRotation` with the canonical axes and rest frames the limb fit reads.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function blendHumanJoint(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  share: number,
): readonly [number, number, number] {
  const s: number = Math.min(1, Math.max(0, share));
  if (s <= 0) return from;
  if (s >= 1) return to;
  const constraint: IAutoMovieJointConstraint | null = getConstraint(
    bone,
    body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
      ?.constraint ?? null,
  );
  if (
    constraint !== null &&
    (constraint.flexion === null ||
      constraint.abduction === null ||
      constraint.twist === null)
  )
    return [
      from[0] + (to[0] - from[0]) * s,
      from[1] + (to[1] - from[1]) * s,
      from[2] + (to[2] - from[2]) * s,
    ];
  const axes: IAutoMovieJointAxes | undefined = skeletonJointAxes(
    body.skeleton,
    HUMANOID_JOINT_AXES,
  )[bone];
  const rotation = (
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      jointToQuaternion(
        { flexion: of[0], abduction: of[1], twist: of[2] },
        axes,
        HUMANOID_REST_FRAME[bone],
      ),
    );
  const read: IAutoMovieResolvedJointAngles = decomposeJointRotation(
    Quaternion.normalize(Quaternion.slerp(rotation(from), rotation(to), s)),
    axes,
    HUMANOID_REST_FRAME[bone],
    { bone, constraint },
  );
  return [read.flexion, read.abduction, read.twist];
}
