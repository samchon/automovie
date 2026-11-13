import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedJointAngles,
  Quaternion,
  alternateJointAngles,
  decomposeJointRotation,
  getConstraint,
  jointRomOvershoot,
  jointToQuaternion,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
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
 * two readings (charts) of one rotation. A blend of the three numbers one by
 * one therefore depends on which reading each end happens to be written in,
 * and between a hanging arm and a raised one in the far reading it goes a
 * long way round.
 *
 * The shorter arc between the two rotations (Shoemake 1985, "Animating
 * rotation with quaternion curves", SIGGRAPH) does not depend on the
 * readings, but it may leave the joint's range on the way: the range is a
 * box in the clinical angles, not a convex set of rotations. A pose resolved
 * from a triple outside the range is clamped, and it is clamped differently
 * in each reading, so where the better reading changes the limb jumps: a
 * reach across the body, whose solved shoulder lay on the edge of its twist,
 * stepped the wrist 33 mm over the last twenty-fifth of its carry, and an
 * arm raised forward from hanging read 18 degrees outside the range near
 * three quarters of its arc.
 *
 * So when both ends lie in the range, the ball joint goes by straight lines
 * of its angles, which stay in the box. One line between the ends as they
 * are written is the route when they share a reading. When they do not (a
 * hanging arm `[0, 5, 0]` and a reach `[130, 141, 90]`, which is
 * `[50, -39, -90]` in the hanging arm's reading, 9 degrees past its
 * adduction), the joint may instead go by two lines through a gate: the far
 * end's other reading brought into the range (`[50, -30, -90]`), which the
 * range also admits in its own other reading (`[130, 150, 90]`), so the
 * triple changes reading there and the rotation does not. Of the direct line
 * and the gates of either end, the route of the least turn is taken, and
 * the two lines of a gate share the way by their turns. The route is chosen
 * from the two ends alone, never from the share, so one blend takes one
 * path. When no gate lies in the range in both readings, the direct line is
 * the only route, however long.
 *
 * When an end lies outside the range no route stays inside it, and the
 * joint follows the shorter arc, read back as the triple the range admits
 * best, the reading the limb fit gives its own solutions.
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
 * @evidence contracts/development/implementation.md#principled-implementation A joint cannot leave its range, and a box of angles is convex in the angles, so between two ends inside it the path is made of lines of angles; the gate is where the box admits one rotation in both readings, the only place a path inside the range can change reading. Outside the range, spherical linear interpolation of the two rotations is the constant-speed shortest turn and does not depend on either end's reading; the triple is recovered by the engine's exact inverse. A joint with fewer than three freedoms moves only about its own axes, so its angles are its coordinates and are interpolated as such.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the joint's freedoms and one on the ends' place in the range, then the arc, or the least of at most three routes of lines; the single owner of a blend of joint triples, read by the arm's carry and by every reference blended between two solutions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is named: the joint's own range of motion says whether it is a ball joint. The share is clamped so the joint cannot pass either end, and an end keeps its own triple instead of a re-read one.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time per joint: one decomposition for the arc, or four other readings and about thirty conversions to rotations for the routes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `jointToQuaternion`, `Quaternion.slerp`, `decomposeJointRotation` and `alternateJointAngles` with the canonical axes and rest frames the limb fit reads.
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
  const a: IAutoMovieQuaternion = rotation(from);
  const b: IAutoMovieQuaternion = rotation(to);
  const arc = (at: number): IAutoMovieResolvedJointAngles =>
    decomposeJointRotation(
      Quaternion.normalize(Quaternion.slerp(a, b, at)),
      axes,
      HUMANOID_REST_FRAME[bone],
      { bone, constraint },
    );
  // The route is chosen from the two ends alone, so every share of one blend
  // takes the same path.
  const within = (of: readonly [number, number, number]): boolean =>
    constraint !== null &&
    jointRomOvershoot({ bone, ...triple(of) }, constraint) <= EDGE;
  if (constraint === null || !within(from) || !within(to)) {
    const read: IAutoMovieResolvedJointAngles = arc(s);
    return [read.flexion, read.abduction, read.twist];
  }

  // Both ends lie in the range, so the joint goes by straight lines of its
  // angles, which stay in the range's box: either one line between the ends
  // as they are written, or two lines through a gate, a rotation the range
  // admits in both of its readings, where the triple changes reading and the
  // rotation does not. The shortest turn of the three routes is taken.
  const ranges: readonly IAutoMovieAngleRange[] = [
    constraint.flexion!,
    constraint.abduction!,
    constraint.twist!,
  ];
  // The other reading of a triple, each angle on the full-turn alias nearest
  // the middle of its range, the one inside the range when any is.
  const other = (
    of: readonly [number, number, number],
  ): readonly [number, number, number] => {
    const read: IAutoMovieResolvedJointAngles = alternateJointAngles(
      triple(of),
      axes,
      HUMANOID_REST_FRAME[bone],
    );
    return [read.flexion, read.abduction, read.twist].map(
      (angle: number, i: number): number => {
        const middle: number = (ranges[i]!.min + ranges[i]!.max) / 2;
        return angle - 360 * Math.round((angle - middle) / 360);
      },
    ) as [number, number, number];
  };
  const clamped = (
    of: readonly [number, number, number],
  ): readonly [number, number, number] =>
    of.map((angle: number, i: number): number =>
      Math.min(ranges[i]!.max, Math.max(ranges[i]!.min, angle)),
    ) as [number, number, number];
  const turn = (
    p: readonly [number, number, number],
    q: readonly [number, number, number],
  ): number => {
    const u: IAutoMovieQuaternion = rotation(p);
    const v: IAutoMovieQuaternion = rotation(q);
    return (
      2 *
      Math.acos(
        Math.min(1, Math.abs(u.x * v.x + u.y * v.y + u.z * v.z + u.w * v.w)),
      )
    );
  };
  const line = (
    p: readonly [number, number, number],
    q: readonly [number, number, number],
    at: number,
  ): readonly [number, number, number] => [
    p[0] + (q[0] - p[0]) * at,
    p[1] + (q[1] - p[1]) * at,
    p[2] + (q[2] - p[2]) * at,
  ];
  // A gate in the reading of `from`, with its own other reading: the far
  // end's other reading brought into the range, or the near end's.
  const far: readonly [number, number, number] = clamped(other(to));
  const near: readonly [number, number, number] = clamped(other(from));
  let route: {
    length: number;
    legs: readonly [number, number];
    gate: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
    ];
  } | null = null;
  for (const gate of [
    [far, other(far)],
    [other(near), near],
  ] as const) {
    if (!within(gate[0]) || !within(gate[1])) continue;
    const legs: readonly [number, number] = [
      turn(from, gate[0]),
      turn(gate[1], to),
    ];
    const length: number = legs[0] + legs[1];
    if (route === null || length < route.length)
      route = { length, legs, gate };
  }
  if (route === null || turn(from, to) === 0) return line(from, to, s);
  // The direct line's turn is read along it, since its ends' rotations may
  // be near while the line between their triples is long.
  let direct: number = 0;
  for (let k: number = 0; k < ARC.length - 1; k++)
    direct += turn(line(from, to, ARC[k]!), line(from, to, ARC[k + 1]!));
  direct +=
    turn(from, line(from, to, ARC[0]!)) +
    turn(line(from, to, ARC[ARC.length - 1]!), to);
  if (direct <= route.length || route.length === 0) return line(from, to, s);
  const meet: number = route.legs[0] / route.length;
  return s < meet
    ? line(from, route.gate[0], s / meet)
    : line(route.gate[1], to, meet >= 1 ? 1 : (s - meet) / (1 - meet));
}

/** How far outside its range an end may read and still count as on its edge, degrees: a millionth, far above a rounding error and far below any turn that shows; without it an end a solver left on the edge would change the route with its rounding. */
const EDGE: number = 1e-6;

/** The shares between which the turn along a line of angles is summed. */
const ARC: readonly number[] = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

/** A triple as named angles. */
function triple(of: readonly [number, number, number]): {
  flexion: number;
  abduction: number;
  twist: number;
} {
  return { flexion: of[0], abduction: of[1], twist: of[2] };
}
