import { DEFAULT_JOINT_AXES, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, Quaternion, swingTwistRange, AutoMovieEngineKinematics, AutoMovieEngineKinematicsJointRotation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationDomain,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";

/*
 * Stateless standalone dispatch preserves targeted lookup without a per-call
 * full index.
 */
const COLD: ILookup = {
  constraint: (
    body: IBlendBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointConstraint | null =>
    AutoMovieEngineKinematics.getConstraint(bone, readHumanBone(body, bone)?.constraint ?? null),
  frame: (
    body: IBlendBody,
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
  ): IFrame => frameOf(bone, axesOf(body, bone), constraint),
};

/*
 * Find one joint's last explicit axes, leaving earlier axes as fallback.
 */
function axesOf(
  body: IBlendBody,
  bone: AutoMovieHumanoidBone,
): IAutoMovieJointAxes | undefined {
  const rows: IAutoMovieBone[] = body.skeleton.bones;
  for (let i: number = rows.length - 1; i >= 0; --i) {
    const row: IAutoMovieBone | undefined = rows[i];
    const axes: IAutoMovieJointAxes | undefined =
      row?.bone === bone ? row.axes : undefined;
    if (axes !== undefined) return axes;
  }
  return HUMANOID_JOINT_AXES[bone];
}

/*
 * A fixed clinical axis makes interpolation linear in the remaining angles.
 */
function linear(constraint: IAutoMovieJointConstraint | null): boolean {
  return (
    constraint !== null &&
    (constraint.flexion === null ||
      constraint.abduction === null ||
      constraint.twist === null)
  );
}

/*
 * One joint's raw axes with their normalized basis and swing-twist chart.
 */
function frameOf(
  bone: AutoMovieHumanoidBone,
  axes: IAutoMovieJointAxes | undefined,
  constraint: IAutoMovieJointConstraint | null,
): IFrame {
  const basis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
    axes ?? DEFAULT_JOINT_AXES,
    "jointToQuaternion axes",
  );
  const swing: IAutoMovieJointConstraint["swingTwist"] = constraint?.swingTwist;
  const bounded: boolean = swing !== undefined && swing !== null;
  const joint: ReturnType<typeof swingTwistRange.fromAxes> = bounded
    ? swingTwistRange.fromAxes(bone, axes)
    : undefined;
  return {
    basis,
    rest: HUMANOID_REST_FRAME[bone],
    domain: {
      bone,
      constraint:
        constraint === null || swing === null
          ? constraint
          : { ...constraint, swingTwist: null },
    },
    range:
      joint === undefined || constraint === null
        ? undefined
        : {
            constraint,
            joint: swingTwistRange.prepare(bone, joint, constraint),
          },
  };
}

/*
 * Preserve endpoint returns when an interior frame would refuse its axes.
 */
function preparedFrame(
  bone: AutoMovieHumanoidBone,
  axes: IAutoMovieJointAxes | undefined,
  constraint: IAutoMovieJointConstraint | null,
): () => IFrame {
  try {
    const frame: IFrame = frameOf(bone, axes, constraint);
    return (): IFrame => frame;
  } catch (error) {
    return (): never => {
      throw error;
    };
  }
}

/*
 * Bind only the caller's selected metadata before its time reader escapes.
 */
function prepareLookup(
  body: IBlendBody,
  needed: ReadonlySet<AutoMovieHumanoidBone>,
): ILookup {
  const constraints: Map<
    AutoMovieHumanoidBone,
    IAutoMovieJointConstraint | null
  > = new Map();
  const axes: Map<AutoMovieHumanoidBone, IAutoMovieJointAxes | undefined> =
    new Map();
  for (const bone of needed) {
    const constraint: IAutoMovieJointConstraint | null = COLD.constraint(
      body,
      bone,
    );
    constraints.set(bone, constraint);
    if (!linear(constraint)) axes.set(bone, HUMANOID_JOINT_AXES[bone]);
  }

  if (axes.size !== 0)
    for (const row of body.skeleton.bones) {
      if (!axes.has(row.bone)) continue;
      const declared: IAutoMovieJointAxes | undefined = row.axes;
      if (declared !== undefined) axes.set(row.bone, declared);
    }
  const joints: ReadonlyMap<AutoMovieHumanoidBone, IPreparedJoint> = new Map(
    [...constraints].map(
      ([bone, constraint]): [AutoMovieHumanoidBone, IPreparedJoint] => [
        bone,
        {
          constraint,
          frame: axes.has(bone)
            ? preparedFrame(bone, axes.get(bone), constraint)
            : undefined,
        },
      ],
    ),
  );
  return {
    constraint: (
      current: IBlendBody,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieJointConstraint | null => {
      const prepared: IPreparedJoint | undefined = joints.get(bone);
      return prepared === undefined
        ? COLD.constraint(current, bone)
        : prepared.constraint;
    },
    frame: (
      current: IBlendBody,
      bone: AutoMovieHumanoidBone,
      constraint: IAutoMovieJointConstraint | null,
    ): IFrame =>
      joints.get(bone)?.frame?.() ?? COLD.frame(current, bone, constraint),
  };
}

/*
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
 * Parameter body: The body, for the joint's axes and range.
 * Parameter bone: The joint.
 * Parameter from: The `[flexion, abduction, twist]` at share 0, degrees.
 * Parameter to: The same at share 1.
 * Parameter share: How far from `from` to `to`, clamped to [0, 1].
 * Returns: The blended `[flexion, abduction, twist]`, degrees; an end is
 * returned as given.
 */
export function blendHumanJoint(
  body: IBlendBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  share: number,
): readonly [number, number, number] {
  return blend(body, bone, from, to, share, COLD);
}

/*
 * Metadata preparation for a body's single synchronous multi-joint blend.
 */
export namespace blendHumanJoint {
  /*
   * Blend one unchanged endpoint pair while body, canonical rig and tuple
   * values stay unchanged. The pair's numerical branch (a hinge's line, a ball
   * joint's arc or its range-bounded swing and twist) is prepared once here;
   * each share keeps original clipping, endpoints return the supplied tuples,
   * and every interior share returns a fresh reading.
   */
  export function between(
    body: IBlendBody,
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

  /*
   * Prepare the selected joints' constraints, conversion bases and bounded
   * swing regions. A selected hinge needs only its constraint. A name without
   * selected metadata uses the standalone blend, including canonical fallback
   * for an absent bone. The body, axes and ranges stay unchanged for the
   * reader. Each share borrows its input tuples and returns a fresh interior
   * reading.
   * Parameter body: The unchanged body for this operation.
   * Parameter needed: The joints bound before sampling, when known.
   * Returns: A joint blender whose clipped endpoints return the supplied
   * tuples.
   */
  export function prepare(
    body: IBlendBody,
    needed?: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    bone: AutoMovieHumanoidBone,
    from: readonly [number, number, number],
    to: readonly [number, number, number],
    share: number,
  ) => readonly [number, number, number] {
    const lookup: ILookup =
      needed === undefined || needed.size === 0
        ? COLD
        : prepareLookup(body, needed);
    return (
      bone: AutoMovieHumanoidBone,
      from: readonly [number, number, number],
      to: readonly [number, number, number],
      share: number,
    ): readonly [number, number, number] =>
      blend(body, bone, from, to, share, lookup);
  }
}

/*
 * One interpolation algorithm, with all original endpoint and hinge gates
 * before frame admission.
 */
function blend(
  body: IBlendBody,
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
  if (linear(constraint))
    return [
      from[0] + (to[0] - from[0]) * s,
      from[1] + (to[1] - from[1]) * s,
      from[2] + (to[2] - from[2]) * s,
    ];
  const rig: IFrame = lookup.frame(body, bone, constraint);
  const range: IRange | undefined = rig.range;
  const a: IAutoMovieQuaternion = rotationOf(from, rig);
  const b: IAutoMovieQuaternion = rotationOf(to, rig);
  // A joint ranged by swing and twist is blended inside its range
  // (`swingTwistRange.blend`); another ball joint on the shorter arc.
  const blended: IAutoMovieQuaternion =
    range === undefined
      ? Quaternion.normalize(Quaternion.slerp(a, b, s))
      : swingTwistRange.blend(a, b, s, range.constraint, range.joint);
  return readRotation(blended, rig);
}

/*
 * One endpoint pair's interior reader, its branch prepared once: a joint with a
 * fixed freedom blends its angles linearly; a ball joint on the shorter arc of
 * its two rotations, or inside its swing-twist range where it declares one.
 */
function pair(
  body: IBlendBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  lookup: ILookup,
): (share: number) => readonly [number, number, number] {
  const constraint: IAutoMovieJointConstraint | null = lookup.constraint(
    body,
    bone,
  );
  if (linear(constraint))
    return (at: number): readonly [number, number, number] => [
      from[0] + (to[0] - from[0]) * at,
      from[1] + (to[1] - from[1]) * at,
      from[2] + (to[2] - from[2]) * at,
    ];
  const rig: IFrame = lookup.frame(body, bone, constraint);
  const range: IRange | undefined = rig.range;
  const a: IAutoMovieQuaternion = rotationOf(from, rig);
  const b: IAutoMovieQuaternion = rotationOf(to, rig);
  const turn: (share: number) => IAutoMovieQuaternion =
    range === undefined
      ? Quaternion.prepareSlerp(a, b)
      : swingTwistRange.prepareBlend(a, b, range.constraint, range.joint);
  return (at: number): readonly [number, number, number] =>
    readRotation(
      range === undefined ? Quaternion.normalize(turn(at)) : turn(at),
      rig,
    );
}

/*
 * Original endpoint literal/axis/frame argument ordering without a per-read
 * closure.
 */
function rotationOf(
  of: readonly [number, number, number],
  rig: IFrame,
): IAutoMovieQuaternion {
  return Quaternion.normalize(
    AutoMovieEngineKinematicsJointRotation.jointToQuaternionOnBasis(
      { flexion: of[0], abduction: of[1], twist: of[2] },
      rig.basis,
      rig.rest,
    ),
  );
}

/*
 * Original chart-choice domain construction and clinical readback ordering.
 */
function readRotation(
  blended: IAutoMovieQuaternion,
  rig: IFrame,
): readonly [number, number, number] {
  const read: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(
    blended,
    rig.basis,
    rig.rest,
    rig.domain,
  );
  return [read.flexion, read.abduction, read.twist];
}

/*
 * The existing body records needed to choose a joint's blend.
 */
type IBlendBody = Pick<IAutoMovieMotionHumanBody, "bones" | "skeleton">;

/*
 * One bone's admitted conversion basis, clinical chart and optional range.
 */
interface IFrame {
  /*
   * The normalized basis the conversions read.
   */
  readonly basis: IAutoMovieJointAxes;

  /*
   * The clinical rest mapping used in both directions.
   */
  readonly rest: IAutoMovieRestFrame | undefined;

  /*
   * The preferred chart's domain for rotation readback.
   */
  readonly domain: IAutoMovieJointRotationDomain;

  /*
   * The prepared swing-twist range when both a range and raw axes exist.
   */
  readonly range: IRange | undefined;
}

/*
 * The constraint and chart a bounded rotation blend uses together.
 */
interface IRange {
  /*
   * The resolved range constraint.
   */
  readonly constraint: IAutoMovieJointConstraint;

  /*
   * Its geometric swing region.
   */
  readonly joint: swingTwistRange.IPrepared;
}

/*
 * Static metadata for one joint selected by the caller.
 */
interface IPreparedJoint {
  /*
   * Its first-match constraint, or null when no constraint applies.
   */
  readonly constraint: IAutoMovieJointConstraint | null;

  /*
   * Its admitted rotation frame or original admission failure.
   */
  readonly frame: (() => IFrame) | undefined;
}

/*
 * The two metadata phases: constraint lookup precedes any ball-joint axes work.
 */
interface ILookup {
  /*
   * First-match override/default resolution, without reading clinical axes.
   */
  constraint(
    body: IBlendBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointConstraint | null;

  /*
   * Canonical frame metadata, requested only after the hinge branch.
   */
  frame(
    body: IBlendBody,
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
  ): IFrame;
}
