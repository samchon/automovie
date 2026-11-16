import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedJointAngles,
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
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/** One bone's canonical axes and lazy admitted conversion/chart frames. */
interface IFrame {
  /** The actual raw declared-over-canonical entry, including an absent entry. */
  axes: IAutoMovieJointAxes | undefined;

  /** The basis admitted at the first original forward-conversion site. */
  basis: IAutoMovieJointAxes;

  /** A lazy explicit swing-twist frame, used only when the raw entry exists. */
  joint: swingTwistRange.IJoint;
}

/** The two metadata phases: constraint lookup precedes any ball-joint axes work. */
interface ILookup {
  /** First-match override/default resolution, without reading clinical axes. */
  constraint(
    body: IHumanBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointConstraint | null;

  /** Canonical frame metadata, requested only after the hinge branch. */
  frame(body: IHumanBody, bone: AutoMovieHumanoidBone): IFrame;
}

/** Stateless standalone dispatch preserves targeted lookup without a per-call full index. */
const COLD: ILookup = {
  constraint: (
    body: IHumanBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointConstraint | null =>
    getConstraint(
      bone,
      body.skeleton.bones.find(
        (candidate: IAutoMovieBone): boolean => candidate.bone === bone,
      )?.constraint ?? null,
    ),
  frame: (body: IHumanBody, bone: AutoMovieHumanoidBone): IFrame =>
    frameOf(bone, skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES)[bone]),
};

/** Keep one unchanged raw entry; admission and chart preparation remain lazy. */
function frameOf(
  bone: AutoMovieHumanoidBone,
  axes: IAutoMovieJointAxes | undefined,
): IFrame {
  let basis: IAutoMovieJointAxes | undefined;
  let joint: swingTwistRange.IJoint | undefined;
  return {
    axes,
    get basis(): IAutoMovieJointAxes {
      basis ??= normalizeJointAxes(
        axes === undefined ? DEFAULT_JOINT_AXES : axes,
        "jointToQuaternion axes",
      );
      return basis;
    },
    get joint(): swingTwistRange.IJoint {
      joint ??= swingTwistRange.prepare({
        axes: axes === undefined ? DEFAULT_JOINT_AXES : axes,
        frame: HUMANOID_REST_FRAME[bone],
      });
      return joint;
    },
  };
}

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
 * The arc between two rotations a joint can take may leave its range. A joint
 * whose range is stated by swing and twist (`IAutoMovieJointConstraint`
 * `swingTwist`: the shoulders and the hips) is blended inside it instead,
 * straight across the range's chart (`swingTwistRange.blend`): the chart
 * reads a rotation as its direction's place on the unit disc the region
 * spans about the rest direction and its twist inside its interval, which is
 * continuous and one to one over the range while the region stays short of
 * the rest direction's antipode (the shoulder's reach cap,
 * `DEFAULT_HUMANOID_ROM`). A straight line between two places of a disc
 * stays in the disc and an interval is convex, so the blend stays in the
 * range, moves continuously with both ends and meets each. Blended on the arc
 * and projected back, a shoulder carried from the nape read its twist 166,
 * -173 and -146 degrees on the way, was clamped to 135 and then to -110
 * between two frames, and swung the elbow 417 mm. The result is read back as
 * the triple the joint's three-angle box prefers, the reading the limb fit
 * gives its own solutions. Another ball joint (the spine, the neck, the head)
 * keeps the arc as it is: its range lies far from the flexion where two of
 * its angles turn about one axis, and the pose's clamp keeps it in its box.
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
 * @evidence contracts/development/common.md#meaningful-documentation States what is blended, why a ball joint is blended as a rotation, how a swing-twist range is kept with the measured case, why a joint with fewer freedoms is not, each argument with its unit, and what an end returns.
 * @evidence contracts/development/implementation.md#principled-implementation Spherical linear interpolation of the two joint rotations is the constant-speed shortest turn between them and depends on neither end's reading; a swing-twist joint is blended on its range's chart, a convex set on which the line between two ends stays, so the blend stays in the range and is continuous in its share and in both ends. A joint with fewer than three freedoms moves only about its own axes, so its angles are its coordinates and are interpolated as such.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation owner keeps endpoint and hinge ordering while standalone and prepared callers choose only metadata lookup; forward/inverse OnBasis primitives share one lazily admitted basis and swing frames use explicit operation preparation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is named: the joint's own range says whether it is a ball joint and whether it is gated by swing and twist. The share is clamped so the joint cannot pass either end, and an end keeps its own triple instead of a re-read one.
 * @evidence contracts/development/implementation.md#efficient-algorithms Standalone constraint lookup and a ball joint's axis merge are O(B) for B bones, followed by existing rotation/chart mathematics; one basis serves both endpoint conversions and decomposition, and one prepared swing frame serves its chart reads. A prepared multi-joint operation shares O(B+D) metadata across D requested names; no runtime speedup is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the actual interpolation owner and canonical mappings plus the inverse's existing box-preparation owner, with invariant basis/frame metadata reused inside this call; prepare additionally shares first-bone and axes metadata within one unchanged operation, never its from/to/share results.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a fresh interior triple or borrows the unchanged endpoint. Local frame/basis preparation ends with this call; the inverse's existing weak per-constraint cache owns its optional box copy, and a prepared blender's caller releases its own metadata with the synchronous operation. No input triple or blended result is retained.
 */
export function blendHumanJoint(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  share: number,
): readonly [number, number, number] {
  return blend(body, bone, from, to, share, COLD);
}

/**
 * Metadata preparation for a body's single synchronous multi-joint blend.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unchanged-body scope, endpoint/hinge admission order, actual per-input blending and caller-owned preparation lifetime on prepare.
 * @evidence contracts/development/design.md#principled-representation A local blender shares only first-bone constraints and canonical axis/basis/frame metadata, while the existing interpolation still evaluates every incoming endpoint pair and share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepare entry serves an overlay's actual multi-joint pass, while the standalone function retains its existing signature and targeted lookup path.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No mutable-body identity cache, blended-result table or alternate ROM representation is added; a new blend operation creates new preparation and the body stays unchanged until release.
 */
export namespace blendHumanJoint {
  /**
   * Prepare one body's metadata for a synchronous joint-blend pass; the body
   * and canonical ROM, axes and rest-frame mappings stay unchanged until release.
   * Endpoint shares still return the original from/to tuple before any rig
   * lookup, and hinge joints still blend linearly without reading axes.
   *
   * The first interior query lazily indexes B bones with first-match
   * constraint semantics. A ball query resolves the canonical axes table once
   * with its existing last-declared precedence; each requested name owns one
   * lazy admitted basis and prepared swing frame. Numerical from/to/share
   * interpolation and output allocation still run on every query.
   *
   * Metadata costs O(B+D) time and space for D queried names, plus each
   * actual blend's existing numerical cost. Release the returned function on
   * operation completion or failure; it holds only the body and this bounded
   * metadata, with no retained input tuples, outputs or global collection.
   *
   * @param body The unchanged body used by every joint of this operation.
   * @returns A joint blender whose endpoint tuples retain input identity.
   */
  export function prepare(
    body: IHumanBody,
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
        current: IHumanBody,
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
      frame: (current: IHumanBody, name: AutoMovieHumanoidBone): IFrame => {
        let frame: IFrame | undefined = frames.get(name);
        if (frame === undefined) {
          axes ??= skeletonJointAxes(current.skeleton, HUMANOID_JOINT_AXES);
          frame = frameOf(name, axes[name]);
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

/** One interpolation algorithm, with all original endpoint and hinge gates before frame admission. */
function blend(
  body: IHumanBody,
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
  const rig: IFrame = lookup.frame(body, bone);
  const axes: IAutoMovieJointAxes | undefined = rig.axes;
  const rotation: (
    of: readonly [number, number, number],
  ) => IAutoMovieQuaternion = (
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      jointToQuaternionOnBasis(
        { flexion: of[0], abduction: of[1], twist: of[2] },
        rig.basis,
        HUMANOID_REST_FRAME[bone],
      ),
    );
  // A joint ranged by swing and twist is blended inside its range
  // (`swingTwistRange.blend`); another ball joint on the shorter arc.
  const blended: IAutoMovieQuaternion =
    constraint !== null &&
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null &&
    axes !== undefined
      ? swingTwistRange.blend(
          rotation(from),
          rotation(to),
          s,
          constraint,
          rig.joint,
        )
      : Quaternion.normalize(Quaternion.slerp(rotation(from), rotation(to), s));
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
