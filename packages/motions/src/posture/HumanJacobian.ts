import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieRestFrame,
  Quaternion,
  Vector3,
  clampJointToSkeleton,
  normalizeJointAxes,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * The analytic Jacobian of a posed body: how each of a posture's variables
 * (the root's place, its yaw, pitch and roll, and any joint angle) moves
 * the bones, read from the one forward kinematics that posed them.
 *
 * Each variable is a twist: the bones it moves turn about a world axis
 * through a point, or move along a direction (Siciliano et al. 2009,
 * section 3.1.3). A bone's segment then has the twist's angular velocity
 * and its origin the linear velocity `v + ω × (o − pivot)`, and any point
 * on it moves at `v_origin + ω × (p − o)`, so a caller with many probes on
 * few segments reads each segment's twist once (`twist`) and a caller with
 * few points reads their columns directly (`velocity`). The root's place
 * moves every bone along its axis; its heading turns every bone about the
 * root, yaw about the world's up, pitch about the yawed left axis and roll
 * about the yawed and pitched forward axis (`resolveHumanPosture.heading`).
 * A joint's three angles compose its rotation in the engine's order
 * (`jointToQuaternion`): twist, abduction, flexion for a proximal twist, so
 * the flexion axis is the basis axis turned by the twist and the abduction
 * before it, and abduction, flexion, twist for a distal one. The frame
 * before the joint is its parent's world rotation turned by its rest
 * rotation, and a clinical angle is the rig's angle mapped by the rest
 * frame, so a turn per clinical degree is the axis scaled by the frame's
 * sign. The angles are the clamped ones forward kinematics reads, so at a
 * range limit the motion is the one the joint makes inward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the variables, the twist with its source, the two read-outs, how each axis is found and what a range limit gives.
 * @evidence contracts/development/design.md#principled-representation A variable as a twist (an angular velocity through a point, or a linear velocity) with the bones it moves, the representation the geometric Jacobian is built from; segment twists and point columns both follow from it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The variable, the motion, the twist and three reads (`of`, `twist`, `velocity`), the one owner of kinematic Jacobians for the floor fit and the arm planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The axes, rest frames, ranges and composition orders are the engine's own, the ones forward kinematics reads.
 */
export namespace HumanJacobian {
  /** A variable of a posture, per its own unit: the root's place per metre, its heading's angles and a joint's angles per degree. */
  export type IVariable =
    | { kind: "place"; axis: "x" | "y" | "z" }
    | { kind: "heading"; axis: "yaw" | "pitch" | "roll" }
    | { kind: "angle"; bone: AutoMovieHumanoidBone; axis: 0 | 1 | 2 };

  /** How one variable moves the body, per its unit. */
  export interface IMotion {
    /** The angular velocity of the bones it moves, radians; nought for a place. */
    angular: IAutoMovieVector3;

    /** The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. */
    linear: IAutoMovieVector3;

    /** The bones moved; null for every bone. */
    moves: ReadonlySet<AutoMovieHumanoidBone> | null;
  }

  /** A segment's twist under a motion: its angular velocity and its origin's linear velocity, per the variable's unit. */
  export interface ITwist {
    /** Radians. */
    angular: IAutoMovieVector3;

    /** Metres, at the bone's origin. */
    linear: IAutoMovieVector3;
  }

  /**
   * The motions of variables on a posed body.
   *
   * @param body The body.
   * @param posture The posture posed, written by its joint angles alone.
   * @param bones Its resolved bones.
   * @param variables The variables.
   * @returns One motion per variable, in their order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each joint axis is the frame before the joint, turned by the factors composed before the angle's own, applied to the angle's basis axis, scaled by the rest frame's sign and the degree; the root's from its heading's order; a turn's linear velocity at the origin is `−ω × pivot`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind of variable.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angles are the clamped ones forward kinematics reads, so an angle set out of range moves the body as it is shown.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per variable on the posed bones; no forward kinematics of its own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A body's bones, bases and carried sets are read once and kept with the body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The kept tables are weakly held by the body and released with it.
   */
  export function of(
    body: IHumanBody,
    posture: IHumanPosture,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    variables: readonly IVariable[],
  ): IMotion[] {
    const rig: IRig = rigOf(body);
    const yawed: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      posture.yaw,
    );
    const pitched: IAutoMovieQuaternion = Quaternion.multiply(
      yawed,
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, posture.pitch),
    );
    const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(posture);
    const turning = (
      axis: IAutoMovieVector3,
      pivot: IAutoMovieVector3,
      moves: ReadonlySet<AutoMovieHumanoidBone> | null,
    ): IMotion => ({
      angular: axis,
      linear: Vector3.cross(axis, Vector3.scale(pivot, -1)),
      moves,
    });
    return variables.map((variable: IVariable): IMotion => {
      if (variable.kind === "place")
        return {
          angular: ZERO,
          linear: {
            x: variable.axis === "x" ? 1 : 0,
            y: variable.axis === "y" ? 1 : 0,
            z: variable.axis === "z" ? 1 : 0,
          },
          moves: null,
        };
      if (variable.kind === "heading")
        return turning(
          Vector3.scale(
            variable.axis === "yaw"
              ? { x: 0, y: 1, z: 0 }
              : variable.axis === "pitch"
                ? Quaternion.rotateVector(yawed, { x: 1, y: 0, z: 0 })
                : Quaternion.rotateVector(pitched, { x: 0, y: 0, z: 1 }),
            RADIAN,
          ),
          posture.root,
          null,
        );
      const bone: AutoMovieHumanoidBone = variable.bone;
      const def: IAutoMovieBone = rig.bones.get(bone)!;
      const basis: IAutoMovieJointAxes = rig.bases.get(bone)!;
      const set: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      const joint: IAutoMovieJointPose = clampJointToSkeleton(
        { bone, flexion: set[0], abduction: set[1], twist: set[2] },
        body.skeleton,
      );
      const frame: IAutoMovieRestFrame | undefined = HUMANOID_REST_FRAME[bone];
      const factor = (name: Name): IAutoMovieQuaternion =>
        Quaternion.fromAxisAngle(
          basis[name],
          ((joint[name] ?? 0) - (frame?.[name]?.neutral ?? 0)) /
            (frame?.[name]?.sign ?? 1),
        );
      const parent: IAutoMovieQuaternion =
        def.parent === null ? heading : bones.get(def.parent)!.worldRotation;
      const name: Name = NAMES[variable.axis];
      // The factors composed before this angle's own, in the joint's order.
      const order: readonly Name[] =
        basis.twistPlacement === "distal"
          ? ["abduction", "flexion", "twist"]
          : ["twist", "abduction", "flexion"];
      let turned: IAutoMovieQuaternion = Quaternion.multiply(
        parent,
        def.rest.rotation,
      );
      for (const earlier of order.slice(0, order.indexOf(name)))
        turned = Quaternion.multiply(turned, factor(earlier));
      return turning(
        Vector3.scale(
          Quaternion.rotateVector(turned, basis[name]),
          RADIAN / (frame?.[name]?.sign ?? 1),
        ),
        bones.get(bone)!.worldPosition,
        rig.carried.get(bone)!,
      );
    });
  }

  /**
   * A segment's twist under a motion.
   *
   * @param motion The motion.
   * @param bone The segment's bone.
   * @param origin The bone's origin, world metres.
   * @returns The segment's angular velocity and its origin's linear velocity; nought when the motion does not move the bone.
   */
  export function twist(
    motion: IMotion,
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
  ): ITwist {
    if (motion.moves !== null && !motion.moves.has(bone))
      return { angular: ZERO, linear: ZERO };
    return {
      angular: motion.angular,
      linear: Vector3.add(motion.linear, Vector3.cross(motion.angular, origin)),
    };
  }

  /**
   * A point's velocity under a motion: a column of its point Jacobian.
   *
   * @param motion The motion.
   * @param bone The bone the point rides on.
   * @param point The point, world metres.
   * @returns Metres per the variable's unit; nought when the motion does not move the bone.
   */
  export function velocity(
    motion: IMotion,
    bone: AutoMovieHumanoidBone,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (motion.moves !== null && !motion.moves.has(bone)) return ZERO;
    return Vector3.add(motion.linear, Vector3.cross(motion.angular, point));
  }

  /** A joint's clinical axis. */
  type Name = "flexion" | "abduction" | "twist";

  /** A body's bones by name, each bone's normalised basis and the bones each carries, itself included. */
  interface IRig {
    /** The bones. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieBone>;

    /** Each bone's basis. */
    bases: Map<AutoMovieHumanoidBone, IAutoMovieJointAxes>;

    /** The bones each bone carries, itself included. */
    carried: Map<AutoMovieHumanoidBone, Set<AutoMovieHumanoidBone>>;
  }

  /** The rigs read, by body. */
  const RIGS: WeakMap<IHumanBody, IRig> = new WeakMap();

  /** A body's rig, read once. */
  function rigOf(body: IHumanBody): IRig {
    const known: IRig | undefined = RIGS.get(body);
    if (known !== undefined) return known;
    const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
      skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map(
      body.skeleton.bones.map(
        (b: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieBone] => [
          b.bone,
          b,
        ],
      ),
    );
    const bases: Map<AutoMovieHumanoidBone, IAutoMovieJointAxes> = new Map(
      body.skeleton.bones.map(
        (b: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieJointAxes] => [
          b.bone,
          normalizeJointAxes(axes[b.bone] ?? DEFAULT_JOINT_AXES, b.bone),
        ],
      ),
    );
    const carried: Map<AutoMovieHumanoidBone, Set<AutoMovieHumanoidBone>> =
      new Map();
    const carries = (bone: AutoMovieHumanoidBone): Set<AutoMovieHumanoidBone> => {
      const seen: Set<AutoMovieHumanoidBone> | undefined = carried.get(bone);
      if (seen !== undefined) return seen;
      const out: Set<AutoMovieHumanoidBone> = new Set([bone]);
      for (const child of body.topology.childrenByParent.get(bone) ?? [])
        for (const below of carries(child.bone)) out.add(below);
      carried.set(bone, out);
      return out;
    };
    for (const bone of bones.keys()) carries(bone);
    const rig: IRig = { bones, bases, carried };
    RIGS.set(body, rig);
    return rig;
  }

  /** Radians per degree. */
  const RADIAN: number = Math.PI / 180;

  /** A joint's axes by the angle's index. */
  const NAMES: readonly [Name, Name, Name] = ["flexion", "abduction", "twist"];

  /** No motion. */
  const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
}
