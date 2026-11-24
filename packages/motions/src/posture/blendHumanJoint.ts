import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  decomposeJointRotationOnBasis,
  getConstraint,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";

/** One bone's canonical axes and admitted conversion/chart frames. */
interface IFrame {
  /** The actual raw declared-over-canonical entry, including an absent entry. */
  axes: IAutoMovieJointAxes | undefined;

  /** The normalized basis the conversions read. */
  basis: IAutoMovieJointAxes;

  /** The swing-twist frame, present only where the raw entry exists. */
  joint: swingTwistRange.IPrepared | undefined;
}

/** The two metadata phases: constraint lookup precedes any ball-joint axes work. */
interface ILookup {
  /** First-match override/default resolution, without reading clinical axes. */
  constraint(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointConstraint | null;

  /** Canonical frame metadata, requested only after the hinge branch. */
  frame(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
  ): IFrame;
}

/**
 * Stateless standalone dispatch preserves targeted lookup without a per-call
 * full index.
 */
const COLD: ILookup = {
  constraint: (
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointConstraint | null =>
    getConstraint(bone, readHumanBone(body, bone)?.constraint ?? null),
  frame: (
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
  ): IFrame =>
    frameOf(
      bone,
      skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES)[bone],
      constraint,
    ),
};

/** One joint's raw axes with their normalized basis and swing-twist chart. */
function frameOf(
  bone: AutoMovieHumanoidBone,
  axes: IAutoMovieJointAxes | undefined,
  constraint: IAutoMovieJointConstraint | null,
): IFrame {
  const raw: IAutoMovieJointAxes =
    axes === undefined ? DEFAULT_JOINT_AXES : axes;
  return {
    axes,
    basis: normalizeJointAxes(raw, "jointToQuaternion axes"),
    joint:
      axes === undefined
        ? undefined
        : constraint === null
          ? undefined
          : swingTwistRange.prepare(
              bone,
              swingTwistRange.fromAxes(bone, axes)!,
              constraint,
            ),
  };
}

/**
 * A joint's clinical angles part of the way between two readings of them,
 * blended the way the joint moves: a ball joint as a rotation, a joint with
 * fewer freedoms angle by angle.
 *
 * A ball joint's rotation has more than one clinical triple: a raised upper arm
 * reads `[90, -30, -57]` and `[95, 112, 90]` for nearly the same arm, the two
 * readings of one rotation. A blend of the numbers would depend on which
 * reading each end is written in, and a solver writes an end in either: a
 * drink's reach read its goal `85.8/145.4/87.1` and then `94.6/-26.7/-84.6`,
 * one rotation within a third of a degree, and a blend of angles stepped 7.8
 * degrees of abduction between them. So a ball joint is blended as its two
 * rotations, on the shorter arc between them (Shoemake 1985, "Animating
 * rotation with quaternion curves", SIGGRAPH), which no reading enters.
 *
 * The arc between two rotations a joint can take may leave its range. A joint
 * whose range is stated by swing and twist (`IAutoMovieJointConstraint`
 * `swingTwist`: the shoulders and the hips) is blended inside it instead,
 * straight across the range's chart (`swingTwistRange.blend`): the chart reads
 * a rotation as its direction's place on the unit disc the region spans about
 * the rest direction and its twist inside its interval, which is continuous and
 * one to one over the range while the region stays short of the rest
 * direction's antipode (the shoulder's reach cap, `DEFAULT_HUMANOID_ROM`). A
 * straight line between two places of a disc stays in the disc and an interval
 * is convex, so the blend stays in the range, moves continuously with both ends
 * and meets each. Blended on the arc and projected back, a shoulder carried
 * from the nape read its twist 166, -173 and -146 degrees on the way, was
 * clamped to 135 and then to -110 between two frames, and swung the elbow 417
 * mm. The result is read back as the triple the joint's three-angle box
 * prefers, the reading the limb fit gives its own solutions. Another ball joint
 * (the spine, the neck, the head) keeps the arc as it is: its range lies far
 * from the flexion where two of its angles turn about one axis, and the pose's
 * clamp keeps it in its box.
 *
 * A joint whose range lacks a freedom (the elbow with the forearm's turn has no
 * abduction, the wrist no twist, the knee only flexion) has one triple per
 * rotation, and the shorter arc between two of its rotations leaves the
 * freedoms it has: between an elbow at 12 degrees and one at 150 degrees
 * pronated 90 the arc passes through a forearm bent sideways, which reads back
 * as abduction the elbow does not own. Such a joint is therefore blended angle
 * by angle, each freedom moving on its own axis, and a freedom it lacks stays
 * where both ends hold it.
 *
 * @param body The body, for the joint's axes and range.
 * @param bone The joint.
 * @param from The `[flexion, abduction, twist]` at share 0, degrees.
 * @param to The same at share 1.
 * @param share How far from `from` to `to`, clamped to [0, 1].
 * @returns The blended `[flexion, abduction, twist]`, degrees; an end is
 *   returned as given.
 */
export function blendHumanJoint(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  share: number,
): readonly [number, number, number] {
  return blend(body, bone, from, to, share, COLD);
}

/** Metadata preparation for a body's single synchronous multi-joint blend. */
export namespace blendHumanJoint {
  /**
   * Blend one unchanged endpoint pair while body, canonical rig and tuple
   * values stay unchanged. The pair's numerical branch (a hinge's line, a ball
   * joint's arc or its range-bounded swing and twist) is prepared once here;
   * each share keeps original clipping, endpoints return the supplied tuples,
   * and every interior share returns a fresh reading.
   */
  export function between(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
    from: readonly [number, number, number],
    to: readonly [number, number, number],
  ): (share: number) => readonly [number, number, number] {
    const read: (share: number) => readonly [number, number, number] = pair(
      body,
      bone,
      from,
      to,
      COLD,
    );
    return (share: number): readonly [number, number, number] => {
      const s: number = Math.min(1, Math.max(0, share));
      return s <= 0 ? from : s >= 1 ? to : read(s);
    };
  }

  /**
   * Prepare one body's metadata for a synchronous joint-blend pass; the body
   * and canonical ROM, axes and rest-frame mappings stay unchanged until
   * release. Endpoint shares still return the original from/to tuple before any
   * rig lookup, and hinge joints still blend linearly without reading axes.
   *
   * The first interior query lazily indexes B bones with first-match constraint
   * semantics. A ball query resolves the canonical axes table once with its
   * existing last-declared precedence; each requested name owns one lazy
   * admitted basis and prepared swing frame. Numerical from/to/share
   * interpolation and output allocation still run on every query.
   *
   * Metadata costs O(B+D) time and space for D queried names, plus each actual
   * blend's existing numerical cost. Release the returned function on operation
   * completion or failure; it holds only the body and this bounded metadata,
   * with no retained input tuples, outputs or global collection.
   *
   * @param body The unchanged body used by every joint of this operation.
   * @returns A joint blender whose endpoint tuples retain input identity.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
  ): (
    bone: AutoMovieHumanoidBone,
    from: readonly [number, number, number],
    to: readonly [number, number, number],
    share: number,
  ) => readonly [number, number, number] {
    let bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> | undefined;
    let axes:
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined;
    const constraints: Map<
      AutoMovieHumanoidBone,
      IAutoMovieJointConstraint | null
    > = new Map();
    const frames: Map<AutoMovieHumanoidBone, IFrame> = new Map();
    const lookup: ILookup = {
      constraint: (
        current: IAutoMovieMotionHumanBody,
        name: AutoMovieHumanoidBone,
      ): IAutoMovieJointConstraint | null => {
        let constraint: IAutoMovieJointConstraint | null | undefined =
          constraints.get(name);
        if (constraint === undefined) {
          if (bones === undefined) {
            bones = new Map();
            for (const candidate of current.skeleton.bones)
              if (!bones.has(candidate.bone))
                bones.set(candidate.bone, candidate);
          }
          constraint = getConstraint(name, bones.get(name)?.constraint ?? null);
          constraints.set(name, constraint);
        }
        return constraint;
      },
      frame: (
        current: IAutoMovieMotionHumanBody,
        name: AutoMovieHumanoidBone,
        constraint: IAutoMovieJointConstraint | null,
      ): IFrame => {
        let frame: IFrame | undefined = frames.get(name);
        if (frame === undefined) {
          axes ??= skeletonJointAxes(current.skeleton, HUMANOID_JOINT_AXES);
          frame = frameOf(name, axes[name], constraint);
          frames.set(name, frame);
        }
        return frame;
      },
    };
    return (
      bone: AutoMovieHumanoidBone,
      from: readonly [number, number, number],
      to: readonly [number, number, number],
      share: number,
    ): readonly [number, number, number] =>
      blend(body, bone, from, to, share, lookup);
  }
}

/**
 * One interpolation algorithm, with all original endpoint and hinge gates
 * before frame admission.
 */
function blend(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  share: number,
  lookup: ILookup,
): readonly [number, number, number] {
  const s: number = Math.min(1, Math.max(0, share));
  if (s <= 0) return from;
  if (s >= 1) return to;
  const constraint: IAutoMovieJointConstraint | null = lookup.constraint(
    body,
    bone,
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
  const rig: IFrame = lookup.frame(body, bone, constraint);
  const axes: IAutoMovieJointAxes | undefined = rig.axes;
  const gated: boolean =
    constraint !== null &&
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null &&
    axes !== undefined;
  const a: IAutoMovieQuaternion = rotationOf(from, rig, bone);
  const b: IAutoMovieQuaternion = rotationOf(to, rig, bone);
  // A joint ranged by swing and twist is blended inside its range
  // (`swingTwistRange.blend`); another ball joint on the shorter arc.
  const blended: IAutoMovieQuaternion = gated
    ? swingTwistRange.blend(a, b, s, constraint!, rig.joint!)
    : Quaternion.normalize(Quaternion.slerp(a, b, s));
  return readRotation(blended, rig, bone, constraint);
}

/**
 * One endpoint pair's interior reader, its branch prepared once: a joint with a
 * fixed freedom blends its angles linearly; a ball joint on the shorter arc of
 * its two rotations, or inside its swing-twist range where it declares one.
 */
function pair(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  lookup: ILookup,
): (share: number) => readonly [number, number, number] {
  const constraint: IAutoMovieJointConstraint | null = lookup.constraint(
    body,
    bone,
  );
  if (
    constraint !== null &&
    (constraint.flexion === null ||
      constraint.abduction === null ||
      constraint.twist === null)
  )
    return (at: number): readonly [number, number, number] => [
      from[0] + (to[0] - from[0]) * at,
      from[1] + (to[1] - from[1]) * at,
      from[2] + (to[2] - from[2]) * at,
    ];
  const rig: IFrame = lookup.frame(body, bone, constraint);
  const gated: boolean =
    constraint !== null &&
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null &&
    rig.axes !== undefined;
  const a: IAutoMovieQuaternion = rotationOf(from, rig, bone);
  const b: IAutoMovieQuaternion = rotationOf(to, rig, bone);
  const turn: (share: number) => IAutoMovieQuaternion = gated
    ? swingTwistRange.prepareBlend(a, b, constraint!, rig.joint!)
    : Quaternion.prepareSlerp(a, b);
  return (at: number): readonly [number, number, number] =>
    readRotation(
      gated ? turn(at) : Quaternion.normalize(turn(at)),
      rig,
      bone,
      constraint,
    );
}

/**
 * Original endpoint literal/axis/frame argument ordering without a per-read
 * closure.
 */
function rotationOf(
  of: readonly [number, number, number],
  rig: IFrame,
  bone: AutoMovieHumanoidBone,
): IAutoMovieQuaternion {
  return Quaternion.normalize(
    jointToQuaternionOnBasis(
      { flexion: of[0], abduction: of[1], twist: of[2] },
      rig.basis,
      HUMANOID_REST_FRAME[bone],
    ),
  );
}

/** Original chart-choice domain construction and clinical readback ordering. */
function readRotation(
  blended: IAutoMovieQuaternion,
  rig: IFrame,
  bone: AutoMovieHumanoidBone,
  constraint: IAutoMovieJointConstraint | null,
): readonly [number, number, number] {
  const read: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
    blended,
    rig.basis,
    HUMANOID_REST_FRAME[bone],
    {
      bone,
      constraint:
        constraint === null ||
        (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
          ? constraint
          : { ...constraint, swingTwist: null },
    },
  );
  return [read.flexion, read.abduction, read.twist];
}
