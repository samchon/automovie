import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedJointAngles,
  Quaternion,
  decomposeJointRotation,
  getConstraint,
  jointToQuaternion,
  skeletonJointAxes,
  swingTwistRange,
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
 * two readings of one rotation. A blend of the numbers would depend on which
 * reading each end is written in, and a solver writes an end in either: a
 * drink's reach read its goal `85.8/145.4/87.1` and then `94.6/-26.7/-84.6`,
 * one rotation within a third of a degree, and a blend of angles stepped 7.8
 * degrees of abduction between them. So a ball joint is blended as its two
 * rotations, on the shorter arc between them (Shoemake 1985, "Animating
 * rotation with quaternion curves", SIGGRAPH), which no reading enters.
 *
 * A joint whose range is stated by swing and twist (`IAutoMovieJointConstraint`
 * `swingTwist`: the shoulders and the hips) is blended in them instead
 * (`swingTwistRange.blend`: its direction along the great circle between
 * the two, its twist between the two inside its interval). The arc between
 * two of its rotations can pass the far side of its twist interval, and the
 * projection that brings such a rotation back swaps the end it clamps to: a
 * shoulder carried from the nape stepped its twist from 135 to -110 degrees
 * between two frames. A blend whose swing leaves the region is brought back
 * as a rotation (`swingTwistRange.project`), which moves continuously. The
 * result is read back as the triple the joint's three-angle box prefers, the
 * reading the limb fit gives its own solutions. Another ball joint (the
 * spine, the neck, the head) keeps the arc as it is: its range lies far from
 * the flexion where two of its angles turn about one axis, and the pose's
 * clamp keeps it in its box.
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
 * @evidence contracts/development/common.md#meaningful-documentation States what is blended, why a ball joint is blended as a rotation with the measured case, why a swing-twist joint is blended in swing and twist with its measured case and how its range is kept, why a joint with fewer freedoms is not, each argument with its unit, and what an end returns.
 * @evidence contracts/development/implementation.md#principled-implementation Spherical linear interpolation of the two joint rotations is the constant-speed shortest turn between them and depends on neither end's reading; a joint ranged by swing and twist moves in them, its twist inside its interval, and the swing-twist projection is continuous in the rotation there, so the blend is continuous in its share and in both ends. A joint with fewer than three freedoms moves only about its own axes, so its angles are its coordinates and are interpolated as such.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the joint's freedoms, then three linear blends, or one arc (a swing-twist blend and its projection where the range is a swing and a twist), and one read back.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is named: the joint's own range says whether it is a ball joint and whether it is gated by swing and twist. The share is clamped so the joint cannot pass either end, and an end keeps its own triple instead of a re-read one.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time per joint: two conversions to rotations, one interpolation, at most one projection and one decomposition.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `jointToQuaternion`, `Quaternion.slerp`, `swingTwistRange.blend` and `project` and `decomposeJointRotation` with the canonical axes and rest frames the limb fit reads.
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
  const joint: swingTwistRange.IJoint | undefined =
    constraint !== null &&
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null &&
    axes !== undefined
      ? { axes, frame: HUMANOID_REST_FRAME[bone] }
      : undefined;
  const blended: IAutoMovieQuaternion =
    joint === undefined
      ? Quaternion.normalize(Quaternion.slerp(rotation(from), rotation(to), s))
      : swingTwistRange.project(
          swingTwistRange.blend(
            rotation(from),
            rotation(to),
            s,
            constraint!,
            joint,
          ),
          constraint!,
          joint,
        );
  const read: IAutoMovieResolvedJointAngles = decomposeJointRotation(
    blended,
    axes,
    HUMANOID_REST_FRAME[bone],
    {
      bone,
      constraint:
        constraint === null ? null : { ...constraint, swingTwist: null },
    },
  );
  return [read.flexion, read.abduction, read.twist];
}
