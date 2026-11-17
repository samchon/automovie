import {
  type IAutoMovieResolvedBone,
  type IAutoMovieTwoBoneArticulation,
  Quaternion,
  Vector3,
  type poseJointCodec,
  twoBoneChainArticulation,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * One accepted interval of a compiled segment track (`HumanSegmentTrack`):
 * the quadratic through three exact displayed poses at its ends and its
 * middle, the range clamp, and the closed-form correction of every limb
 * planted at all three.
 *
 * Joint angles interpolate per clinical axis on their shorter arcs about the
 * middle value. Where the three values are monotone the curve is held inside
 * their hull, the monotonicity-preserving rule of Fritsch and Carlson (1980,
 * SIAM J. Numer. Anal. 17:238), so a bound the exact poses reach and keep,
 * such as an ankle stopped at its range, is not overshot; a turning value
 * keeps its quadratic peak. The root translates on the same quadratic per
 * component and turns on the quadratic of its rotation vectors about the
 * middle rotation, exact at all three poses. The result passes the body's
 * ordinary range projection, then each planted limb is turned by
 * `twoBoneChainArticulation` in its own bend plane so its end joint meets the
 * quadratic of its exact positions, its end bone keeping its world rotation,
 * and the projection runs again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interpolants, the hull rule with its source, the order of clamp and correction, and what the correction keeps.
 * @evidence contracts/development/design.md#principled-representation Clinical degrees per axis, world metres for root and contact targets, unit rotations for the root, the interval parameter u in [-1, 1] from start to end with 0 at the middle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Knot, context and leaf records plus create, emit and error, which the track alone reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's two-bone articulation, codec, quaternion and FK owners; no limb, body or action is named.
 */
export namespace HumanSegmentTrackLeaf {
  /**
   * One exact displayed pose of the track, owned by it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the film second, the owned pose copy and the planted limbs.
   * @evidence contracts/development/design.md#principled-representation An exact evaluation at one film second with the limbs its final refit held planted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by create or the track's knot-time return.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pose is a copy, so no caller of the exact path can change a curve built on it.
   */
  export interface IKnot {
    /** Film seconds. */
    seconds: number;

    /** The exact displayed pose, copied from the evaluator's result. */
    pose: IAutoMoviePose;

    /** The limbs whose goal was planted in that evaluation's final refit. */
    planted: ReadonlySet<IHumanPosture.Limb>;
  }

  /**
   * What every leaf of one person's track shares: the body, its range
   * projection and its clinical codec.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's owner and use.
   * @evidence contracts/development/design.md#principled-representation The unchanged performer body with the genuine projection and codec of its rig.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by emit's clamp and correction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses prepareHumanSegmentPose's projection and the engine's codec rather than a second ROM reader.
   */
  export interface IContext {
    /** The performer's body. */
    body: IHumanBody;

    /** The body's ordinary range-of-motion projection. */
    clamp(pose: IAutoMoviePose): IAutoMoviePose;

    /** Clinical angles to bone-local rotations and back on the body's rig. */
    codec: poseJointCodec.ICodec;
  }

  /**
   * A compiled interval: the coefficients of its curves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation Quadratic coefficients over u, with per-axis nullness and hull flags; the root is absent exactly where all three poses leave it null.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what emit evaluates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled pose is kept beyond the coefficients.
   */
  export interface ILeaf {
    /** The middle film second. */
    middle: number;

    /** Half the interval, seconds. */
    half: number;

    /** The rig the poses articulate. */
    skeleton: string;

    /** One curve per joint, in the first pose's order then later additions. */
    joints: ICurve[];

    /** The root's curves; null when every pose leaves the root null. */
    root: IRoot | null;

    /** The limbs planted at all three poses and their end-joint curves. */
    plants: IPlant[];
  }

  /**
   * One joint's three axis quadratics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coefficient meaning and the hull rule.
   * @evidence contracts/development/design.md#principled-representation Value c0 + c1 u + c2 u² in degrees per axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by emit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null stays null only where all three poses leave the axis null.
   */
  export interface ICurve {
    /** The joint's bone. */
    bone: AutoMovieHumanoidBone;

    /** Per axis, whether all three poses leave it null. */
    neutral: [boolean, boolean, boolean];

    /** Per axis, the coefficients [c0, c1, c2], degrees. */
    terms: [number, number, number][];

    /** Per axis, the hull [lo, hi] held where the three values are monotone, else null. */
    hull: ([number, number] | null)[];
  }

  /**
   * The root's quadratics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames and units of each member.
   * @evidence contracts/development/design.md#principled-representation World metres per component; the rotation as the middle rotation times the exponential of a quadratic rotation vector in radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by emit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The middle pose's scale is kept, since no displayed pose scales its root.
   */
  export interface IRoot {
    /** Per component [c0, c1, c2] of the translation, metres. */
    translation: [number, number, number][];

    /** The middle rotation. */
    rotation: IAutoMovieQuaternion;

    /** The rotation vector's linear and quadratic terms, radians. */
    turn: [IAutoMovieVector3, IAutoMovieVector3];

    /** The middle pose's scale. */
    scale: IAutoMovieVector3;
  }

  /**
   * One planted limb's correction target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chain and the target's frame.
   * @evidence contracts/development/design.md#principled-representation The limb's upper, lower and end bones and the quadratic of the end joint's exact world positions, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by emit's correction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The chain comes from HumanLimbFit.chain, the fit's own naming.
   */
  export interface IPlant {
    /** The limb's chain. */
    chain: HumanLimbFit.IChain;

    /** Per component [c0, c1, c2] of the end joint's world position, metres. */
    target: [number, number, number][];
  }

  /**
   * Compile the interval through three exact poses, or refuse one the
   * interpolants cannot express.
   *
   * @param context The person's shared body context.
   * @param a The pose at the interval's start.
   * @param m The pose at its middle.
   * @param b The pose at its end.
   * @returns The leaf; null when the poses name different rigs or only some leave the root null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three inputs, the refusals and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Lagrange quadratics through u = -1, 0, 1: c1 = (fb - fa) / 2 and c2 = (fa + fb) / 2 - fm, with angles unwrapped to the shorter arc about fm and root rotations as rotation vectors about the middle rotation; plant targets read the end joints of exact FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the union of joints, one root reading and one requested FK per pose for the planted ends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig or root mismatch refuses instead of guessing; null axes stay null only when all three agree.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) for J joints plus at most three requested FK reads when some limb is planted at all three poses.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure compilation of its three inputs; the track owns the knot sharing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The leaf keeps coefficients only, O(J), owned by its track node until the track is forgotten.
   */
  export function create(
    context: IContext,
    a: IKnot,
    m: IKnot,
    b: IKnot,
  ): ILeaf | null {
    if (a.pose.skeleton !== m.pose.skeleton || b.pose.skeleton !== m.pose.skeleton)
      return null;
    const roots: number = [a, m, b].filter((k: IKnot): boolean => k.pose.root === null).length;
    if (roots !== 0 && roots !== 3) return null;

    // The union of the three poses' joints; an unlisted bone is at rest,
    // which is clinical zero on every axis.
    const read: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>[] = [a, m, b].map(
      (k: IKnot): Map<AutoMovieHumanoidBone, IAutoMovieJointPose> =>
        new Map(k.pose.joints.map((j: IAutoMovieJointPose): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j])),
    );
    const bones: AutoMovieHumanoidBone[] = [];
    const seen: Set<AutoMovieHumanoidBone> = new Set();
    for (const joints of read)
      for (const bone of joints.keys())
        if (!seen.has(bone)) {
          seen.add(bone);
          bones.push(bone);
        }
    const joints: ICurve[] = bones.map((bone: AutoMovieHumanoidBone): ICurve => {
      const values: (IAutoMovieJointPose | undefined)[] = read.map(
        (joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>): IAutoMovieJointPose | undefined => joints.get(bone),
      );
      const curve: ICurve = { bone, neutral: [false, false, false], terms: [], hull: [] };
      (["flexion", "abduction", "twist"] as const).forEach((axis: "flexion" | "abduction" | "twist", k: number): void => {
        const raw: (number | null)[] = values.map(
          (j: IAutoMovieJointPose | undefined): number | null => j?.[axis] ?? null,
        );
        curve.neutral[k] = raw.every((v: number | null): boolean => v === null);
        const fm: number = raw[1] ?? 0;
        const fa: number = fm + wrap((raw[0] ?? 0) - fm);
        const fb: number = fm + wrap((raw[2] ?? 0) - fm);
        curve.terms.push(quadratic(fa, fm, fb));
        curve.hull.push(
          (fa <= fm && fm <= fb) || (fa >= fm && fm >= fb)
            ? [Math.min(fa, fb), Math.max(fa, fb)]
            : null,
        );
      });
      return curve;
    });
    return {
      middle: m.seconds,
      half: (b.seconds - a.seconds) / 2,
      skeleton: m.pose.skeleton,
      joints,
      root: roots === 3 ? null : root(a.pose.root!, m.pose.root!, b.pose.root!),
      plants: plants(context.body, a, m, b),
    };
  }

  /**
   * The interval's pose at a film second inside it.
   *
   * @param leaf The leaf.
   * @param seconds Film seconds within the leaf.
   * @param context The person's shared body context.
   * @returns A fresh pose the caller owns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input range and fresh output.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the leaf's quadratics at u = (t - middle) / half, holds monotone axes in their hull, projects through the body's range, then turns each planted limb by the closed-form two-bone articulation in its current bend plane onto its target and projects again, the order of the exact evaluator (clamp, then plants).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Interpolation, clamp, correction and clamp in sequence; the correction is a private helper.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No iterative fit runs: the correction is one law-of-cosines articulation per planted limb, and a straight or degenerate chain is left as interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) evaluation, two projections and, with plants, one requested FK of their chains and constant work per limb.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure evaluation; the caller owns any cache of its result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the pose is fresh.
   */
  export function emit(leaf: ILeaf, seconds: number, context: IContext): IAutoMoviePose {
    const u: number = (seconds - leaf.middle) / leaf.half;
    const joints: IAutoMovieJointPose[] = leaf.joints.map((curve: ICurve): IAutoMovieJointPose => {
      const axis = (k: number): number | null => {
        if (curve.neutral[k]) return null;
        const v: number = value(curve.terms[k]!, u);
        const hull: [number, number] | null = curve.hull[k]!;
        return hull === null ? v : Math.min(hull[1], Math.max(hull[0], v));
      };
      return { bone: curve.bone, flexion: axis(0), abduction: axis(1), twist: axis(2) };
    });
    let pose: IAutoMoviePose = context.clamp({
      skeleton: leaf.skeleton,
      root: leaf.root === null ? null : placed(leaf.root, u),
      joints,
    });
    if (leaf.plants.length === 0) return pose;
    pose = correct(context, pose, leaf.plants, u);
    return context.clamp(pose);
  }

  /**
   * How far one pose's bones lie from another's.
   *
   * @param body The body both articulate.
   * @param candidate The pose being judged.
   * @param exact The reference pose.
   * @returns The largest joint-centre distance, metres, and the largest bone turn, degrees, over every bone of the reference's FK.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both readings with units and the bone set.
   * @evidence contracts/development/implementation.md#principled-implementation World joint centres and orientations, the quantities every audit family reads, compared bone by bone with Quaternion.angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two full FK reads and one loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone missing from the candidate counts as infinitely far, so a dropped bone cannot pass.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two FK reads and O(B) comparisons.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure comparison of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Both FK maps are released on return.
   */
  export function error(
    body: IHumanBody,
    candidate: IAutoMoviePose,
    exact: IAutoMoviePose,
  ): { position: number; orientation: number } {
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, candidate);
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, exact);
    let position: number = 0;
    let orientation: number = 0;
    for (const [bone, reference] of theirs) {
      const found: IAutoMovieResolvedBone | undefined = mine.get(bone);
      if (found === undefined) return { position: Infinity, orientation: Infinity };
      position = Math.max(position, Vector3.distance(found.worldPosition, reference.worldPosition));
      orientation = Math.max(
        orientation,
        (Quaternion.angle(found.worldRotation, reference.worldRotation) * 180) / Math.PI,
      );
    }
    return { position, orientation };
  }
}

/** The difference of two angles on its shorter arc, degrees in (-180, 180]. */
const wrap = (degrees: number): number => degrees - 360 * Math.round(degrees / 360);

/** The coefficients [c0, c1, c2] of the quadratic through u = -1, 0, 1. */
const quadratic = (fa: number, fm: number, fb: number): [number, number, number] => [
  fm,
  (fb - fa) / 2,
  (fa + fb) / 2 - fm,
];

/** The Hamilton product of rotations, left to right. */
const product = (...rotations: IAutoMovieQuaternion[]): IAutoMovieQuaternion =>
  rotations.reduce((a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): IAutoMovieQuaternion => Quaternion.multiply(a, b));

/** A quadratic's value at u. */
const value = ([c0, c1, c2]: [number, number, number], u: number): number => c0 + u * (c1 + u * c2);

/** A point whose x, y and z each follow one quadratic, at u. */
const point = (curves: readonly [number, number, number][], u: number): IAutoMovieVector3 => ({
  x: value(curves[0]!, u),
  y: value(curves[1]!, u),
  z: value(curves[2]!, u),
});

/** The root's curves through three placements. */
function root(
  a: IAutoMovieTransform,
  m: IAutoMovieTransform,
  b: IAutoMovieTransform,
): HumanSegmentTrackLeaf.IRoot {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(m.rotation);
  const ra: IAutoMovieVector3 = log(Quaternion.multiply(inverse, a.rotation));
  const rb: IAutoMovieVector3 = log(Quaternion.multiply(inverse, b.rotation));
  return {
    translation: (["x", "y", "z"] as const).map(
      (c: "x" | "y" | "z"): [number, number, number] =>
        quadratic(a.translation[c], m.translation[c], b.translation[c]),
    ),
    rotation: m.rotation,
    turn: [Vector3.scale(Vector3.subtract(rb, ra), 0.5), Vector3.scale(Vector3.add(ra, rb), 0.5)],
    scale: { ...m.scale },
  };
}

/** The root's placement at u. */
function placed(root: HumanSegmentTrackLeaf.IRoot, u: number): IAutoMovieTransform {
  const [c1, c2]: [IAutoMovieVector3, IAutoMovieVector3] = root.turn;
  return {
    translation: point(root.translation, u),
    rotation: Quaternion.normalize(
      Quaternion.multiply(root.rotation, exp(Vector3.add(Vector3.scale(c1, u), Vector3.scale(c2, u * u)))),
    ),
    scale: { ...root.scale },
  };
}

/** The rotation vector of a unit rotation on its shorter arc, radians. */
function log(q: IAutoMovieQuaternion): IAutoMovieVector3 {
  const s: number = q.w < 0 ? -1 : 1;
  const sine: number = Math.hypot(q.x, q.y, q.z);
  if (sine < 1e-12) return { x: 2 * s * q.x, y: 2 * s * q.y, z: 2 * s * q.z };
  const angle: number = 2 * Math.atan2(sine, s * q.w);
  return { x: (s * q.x * angle) / sine, y: (s * q.y * angle) / sine, z: (s * q.z * angle) / sine };
}

/** The unit rotation of a rotation vector, radians. */
function exp(v: IAutoMovieVector3): IAutoMovieQuaternion {
  const angle: number = Vector3.length(v);
  if (angle < 1e-12) return Quaternion.normalize({ x: v.x / 2, y: v.y / 2, z: v.z / 2, w: 1 });
  const k: number = Math.sin(angle / 2) / angle;
  return { x: v.x * k, y: v.y * k, z: v.z * k, w: Math.cos(angle / 2) };
}

/** The limbs planted at all three knots, with their end joints' exact world curves. */
function plants(
  body: IHumanBody,
  a: HumanSegmentTrackLeaf.IKnot,
  m: HumanSegmentTrackLeaf.IKnot,
  b: HumanSegmentTrackLeaf.IKnot,
): HumanSegmentTrackLeaf.IPlant[] {
  const limbs: IHumanPosture.Limb[] = [...m.planted].filter(
    (limb: IHumanPosture.Limb): boolean => a.planted.has(limb) && b.planted.has(limb),
  );
  if (limbs.length === 0) return [];
  const chains: HumanLimbFit.IChain[] = limbs.map((limb: IHumanPosture.Limb): HumanLimbFit.IChain => HumanLimbFit.chain(limb));
  const ends: ReadonlySet<AutoMovieHumanoidBone> = new Set(chains.map((c: HumanLimbFit.IChain): AutoMovieHumanoidBone => c.effector));
  const placedEnds: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] = [a, m, b].map(
    (k: HumanSegmentTrackLeaf.IKnot): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(body, k.pose, undefined, ends),
  );
  return chains.map((chain: HumanLimbFit.IChain): HumanSegmentTrackLeaf.IPlant => {
    const at: IAutoMovieVector3[] = placedEnds.map(
      (bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): IAutoMovieVector3 => bones.get(chain.effector)!.worldPosition,
    );
    return {
      chain,
      target: (["x", "y", "z"] as const).map(
        (c: "x" | "y" | "z"): [number, number, number] => quadratic(at[0]![c], at[1]![c], at[2]![c]),
      ),
    };
  });
}

/**
 * Turn each planted limb onto its target. The articulation is applied as
 * artic' = artic · delta, the bone-local form the engine's two-bone owner
 * returns; the end bone's articulation is changed by the inverse of its
 * parent's world change, artic' = artic · W_E⁻¹ · W_L · W_L'⁻¹ · W_E with
 * W_L' = du · W_L · lower and du = W_U · upper · W_U⁻¹, so the hand or foot
 * keeps its world rotation.
 */
function correct(
  context: HumanSegmentTrackLeaf.IContext,
  pose: IAutoMoviePose,
  plants: readonly HumanSegmentTrackLeaf.IPlant[],
  u: number,
): IAutoMoviePose {
  const demand: Set<AutoMovieHumanoidBone> = new Set();
  for (const p of plants) {
    demand.add(p.chain.upper);
    demand.add(p.chain.lower);
    demand.add(p.chain.effector);
  }
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(context.body, pose, undefined, demand);
  const joints: IAutoMovieJointPose[] = pose.joints.map((j: IAutoMovieJointPose): IAutoMovieJointPose => ({ ...j }));
  const index: Map<AutoMovieHumanoidBone, number> = new Map(
    joints.map((j: IAutoMovieJointPose, i: number): [AutoMovieHumanoidBone, number] => [j.bone, i]),
  );
  const angles = (bone: AutoMovieHumanoidBone): [number, number, number] => {
    const j: IAutoMovieJointPose | undefined = joints[index.get(bone) ?? -1];
    return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
  };
  const write = (bone: AutoMovieHumanoidBone, rotation: IAutoMovieQuaternion): void => {
    const [flexion, abduction, twist]: [number, number, number] = context.codec.angles(bone, Quaternion.normalize(rotation));
    const joint: IAutoMovieJointPose = { bone, flexion, abduction, twist };
    const at: number | undefined = index.get(bone);
    if (at === undefined) {
      index.set(bone, joints.length);
      joints.push(joint);
    } else joints[at] = joint;
  };
  for (const p of plants) {
    const upper: IAutoMovieResolvedBone | undefined = bones.get(p.chain.upper);
    const lower: IAutoMovieResolvedBone | undefined = bones.get(p.chain.lower);
    const end: IAutoMovieResolvedBone | undefined = bones.get(p.chain.effector);
    if (upper === undefined || lower === undefined || end === undefined) continue;
    const target: IAutoMovieVector3 = point(p.target, u);
    if (Vector3.distance(end.worldPosition, target) <= 1e-9) continue;

    // The bend plane the limb already lies in; its normal's sign keeps the
    // middle joint on the side it bends to (the lift turns the reach axis
    // toward the upper segment about it).
    const normal: IAutoMovieVector3 = Vector3.cross(
      Vector3.subtract(end.worldPosition, upper.worldPosition),
      Vector3.subtract(lower.worldPosition, upper.worldPosition),
    );
    if (Vector3.length(normal) < 1e-9) continue;
    const turned: IAutoMovieTwoBoneArticulation | null = twoBoneChainArticulation({
      upper,
      lower,
      end: end.worldPosition,
      target,
      bendNormal: normal,
    });
    if (turned === null) continue;
    const codec: poseJointCodec.ICodec = context.codec;
    const du: IAutoMovieQuaternion = product(upper.worldRotation, turned.upper, Quaternion.inverse(upper.worldRotation));
    const keep: IAutoMovieQuaternion = product(Quaternion.inverse(end.worldRotation), lower.worldRotation,
      Quaternion.inverse(turned.lower), Quaternion.inverse(lower.worldRotation), Quaternion.inverse(du), end.worldRotation);
    write(p.chain.upper, Quaternion.multiply(codec.rotation(p.chain.upper, angles(p.chain.upper)), turned.upper));
    write(p.chain.lower, Quaternion.multiply(codec.rotation(p.chain.lower, angles(p.chain.lower)), turned.lower));
    write(p.chain.effector, Quaternion.multiply(codec.rotation(p.chain.effector, angles(p.chain.effector)), keep));
  }
  return { skeleton: pose.skeleton, root: pose.root, joints };
}
