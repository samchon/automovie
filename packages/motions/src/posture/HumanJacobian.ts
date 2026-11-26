import { DEFAULT_JOINT_AXES, HUMANOID_REST_FRAME, Quaternion, Vector3, clampJointToSkeleton, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieChainBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "./humanPostureHeading";

/**
 * The motions of variables on a posed body.
 *
 * @param body The body.
 * @param posture The posture posed, written by its joint angles alone.
 * @param bones Its resolved bones.
 * @param variables The variables.
 * @returns One motion per variable, in their order.
 */
export function HumanJacobian(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieChainBone>,
  variables: readonly IAutoMovieMotionHumanJacobian.IVariable[],
): IAutoMovieMotionHumanJacobian.IMotion[] {
  return HumanJacobian.read(body, posture, bones, variables).motions;
}

/**
 * The analytic Jacobian of a posed body: how each of a posture's variables (the
 * root's place, its yaw, pitch and roll, and any joint angle) moves the bones,
 * read from the one forward kinematics that posed them.
 *
 * Each variable is a twist: the bones it moves turn about a world axis through
 * a point, or move along a direction (Siciliano et al. 2009, section 3.1.3). A
 * bone's segment then has the twist's angular velocity and its origin the
 * linear velocity `v + ω × (o − pivot)`, and any point on it moves at
 * `v_origin
 *
 * - Ω × (p − o)`, so a caller with many probes on few segments reads each
 *   segment's twist once (`twist`) and a caller with few points reads their
 *   columns directly (`velocity`). The root's place moves every bone along its
 *   axis; its heading turns every bone about the root, yaw about the world's
 *   up, pitch about the yawed left axis and roll about the yawed and pitched
 *   forward axis (`humanPostureHeading`). A joint's three angles compose its
 *   rotation in the engine's order (`jointToQuaternion`): twist, abduction,
 *   flexion for a proximal twist, so the flexion axis is the basis axis turned
 *   by the twist and the abduction before it, and abduction, flexion, twist for
 *   a distal one. The frame before the joint is its parent's world rotation
 *   turned by its rest rotation, and a clinical angle is the rig's angle mapped
 *   by the rest frame, so a turn per clinical degree is the axis scaled by the
 *   frame's sign. The angles are the clamped ones forward kinematics reads, so
 *   at a range limit the motion is the one the joint makes inward. A joint's
 *   basis, bone and carried bones are read from the body's own prepared rig
 *   (`poseResolution.jointAxes`, `bones`, `topology`) where the read needs them.
 */
export namespace HumanJacobian {
  /**
   * Read variable motions and the exact joints clamped while forming them. The
   * posture, body and resolved bones must describe the same current candidate
   * and remain unchanged until this synchronous read returns. Repeated
   * variables share only that candidate's completed joint preparation; another
   * finite-difference or optimization candidate needs another read. An
   * operation may lend its actual canonical engine clamp factory for this same
   * unchanged skeleton; this shares metadata, not projected answers.
   *
   * @param body The unchanged body described by its established rig snapshot.
   * @param posture The current clinical angles and root heading.
   * @param bones The same candidate's actual resolved bone frames.
   * @param variables Requested variables, including duplicates, in output
   *   order.
   * @param projection Only clampJointToSkeleton.prepare for this same unchanged
   *   skeleton and canonical axes, borrowed from the current synchronous
   *   operation; omitted, angle demand prepares it locally.
   * @returns Fresh motions and a map of the actual clamped joints used for
   *   angle variables.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieChainBone>,
    variables: readonly IAutoMovieMotionHumanJacobian.IVariable[],
    projection?: (joint: IAutoMovieJointPose) => IAutoMovieJointPose,
  ): IReading {
    const yawed: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      posture.yaw,
    );
    const pitched: IAutoMovieQuaternion = Quaternion.multiply(
      yawed,
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, posture.pitch),
    );
    const heading: IAutoMovieQuaternion = humanPostureHeading(posture);
    let clamp:
      | ((joint: IAutoMovieJointPose) => IAutoMovieJointPose)
      | undefined = projection;
    let prepared: Map<AutoMovieHumanoidBone, IJointReading> | undefined;
    const clamped: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
    const turning: (
      axis: IAutoMovieVector3,
      pivot: IAutoMovieVector3,
      moves: ReadonlySet<AutoMovieHumanoidBone> | null,
    ) => IAutoMovieMotionHumanJacobian.IMotion = (
      axis: IAutoMovieVector3,
      pivot: IAutoMovieVector3,
      moves: ReadonlySet<AutoMovieHumanoidBone> | null,
    ): IAutoMovieMotionHumanJacobian.IMotion => ({
      angular: axis,
      linear: Vector3.cross(axis, Vector3.scale(pivot, -1)),
      moves,
    });
    const motions: IAutoMovieMotionHumanJacobian.IMotion[] = variables.map(
      (
        variable: IAutoMovieMotionHumanJacobian.IVariable,
      ): IAutoMovieMotionHumanJacobian.IMotion => {
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
        let reading: IJointReading | undefined = prepared?.get(bone);
        if (reading === undefined) {
          const def: IAutoMovieBone = body.bones.get(bone)!;
          const basis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
            body.poseResolution.jointAxes[bone] ?? DEFAULT_JOINT_AXES,
            bone,
          );
          const set: readonly [number, number, number] = posture.joints[
            bone
          ] ?? [0, 0, 0];
          clamp ??= clampJointToSkeleton.prepare(body.skeleton);
          const joint: IAutoMovieJointPose = clamp({
            bone,
            flexion: set[0],
            abduction: set[1],
            twist: set[2],
          });
          const frame: IAutoMovieRestFrame | undefined =
            HUMANOID_REST_FRAME[bone];
          const parent: IAutoMovieQuaternion =
            def.parent === null
              ? heading
              : bones.get(def.parent)!.worldRotation;
          const order: readonly Name[] =
            basis.rotationOrder === "flexion-abduction-twist"
              ? ["flexion", "abduction", "twist"]
              : basis.twistPlacement === "distal"
                ? ["abduction", "flexion", "twist"]
                : ["twist", "abduction", "flexion"];
          reading = {
            joint,
            basis,
            frame,
            order,
            prefix: [Quaternion.multiply(parent, def.rest.rotation)],
            carried: carriedBy(body, bone),
          };
          clamped.set(bone, joint);
          prepared ??= new Map();
          prepared.set(bone, reading);
        }
        const name: Name = NAMES[variable.axis];
        const depth: number = reading.order.indexOf(name);

        // Extend only the factors this requested axis has before it. A later
        // variable on this unchanged joint reuses the completed same prefix.
        while (reading.prefix.length <= depth) {
          const earlier: Name = reading.order[reading.prefix.length - 1]!;
          const factor: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            reading.basis[earlier],
            ((reading.joint[earlier] ?? 0) -
              (reading.frame?.[earlier]?.neutral ?? 0)) /
              (reading.frame?.[earlier]?.sign ?? 1),
          );
          reading.prefix.push(
            Quaternion.multiply(
              reading.prefix[reading.prefix.length - 1]!,
              factor,
            ),
          );
        }
        return turning(
          Vector3.scale(
            Quaternion.rotateVector(
              reading.prefix[depth]!,
              reading.basis[name],
            ),
            RADIAN / (reading.frame?.[name]?.sign ?? 1),
          ),
          bones.get(bone)!.worldPosition,
          reading.carried,
        );
      },
    );
    return { motions, clamped };
  }

  /**
   * A segment's twist under a motion.
   *
   * @param motion The motion.
   * @param bone The segment's bone.
   * @param origin The bone's origin, world metres.
   * @returns The segment's angular velocity and its origin's linear velocity;
   *   nought when the motion does not move the bone.
   */
  export function twist(
    motion: IAutoMovieMotionHumanJacobian.IMotion,
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
  ): IAutoMovieMotionHumanJacobian.ITwist {
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
   * @returns Metres per the variable's unit; nought when the motion does not
   *   move the bone.
   */
  export function velocity(
    motion: IAutoMovieMotionHumanJacobian.IMotion,
    bone: AutoMovieHumanoidBone,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (motion.moves !== null && !motion.moves.has(bone)) return ZERO;
    return Vector3.add(motion.linear, Vector3.cross(motion.angular, point));
  }

  /**
   * The world-Y component of velocity for a caller that needs height alone. It
   * uses the same affected-bone membership and cross/add grouping as velocity,
   * without forming its unused X/Z components or vector records.
   *
   * @param motion The completed coordinate motion.
   * @param bone The bone carrying the point.
   * @param point Its world point, metres.
   * @returns Vertical metres per variable unit, or positive zero when
   *   unaffected.
   */
  export function velocityY(
    motion: IAutoMovieMotionHumanJacobian.IMotion,
    bone: AutoMovieHumanoidBone,
    point: IAutoMovieVector3,
  ): number {
    if (motion.moves !== null && !motion.moves.has(bone)) return 0;
    return (
      motion.linear.y +
      (motion.angular.z * point.x - motion.angular.x * point.z)
    );
  }

  /** A joint's clinical axis. */
  type Name = "flexion" | "abduction" | "twist";

  /**
   * One candidate's result, without retaining the temporary prefix/clamp
   * preparation.
   */
  interface IReading {
    /** Fresh motions in the requested variable order. */
    motions: IAutoMovieMotionHumanJacobian.IMotion[];

    /** Exact actual projections already used while forming joint variables. */
    clamped: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose>;
  }

  /** Lazy fixed-joint preparation for one read's requested axes. */
  interface IJointReading {
    /** The same candidate's actual clamped articulation. */
    joint: IAutoMovieJointPose;

    /** The existing rig snapshot's admitted joint basis. */
    basis: IAutoMovieJointAxes;

    /** Canonical clinical affine map, absent when identity applies. */
    frame: IAutoMovieRestFrame | undefined;

    /**
     * Intrinsic composition order from the explicit chart or legacy twist
     * placement.
     */
    order: readonly Name[];

    /** Parent/rest base followed by only the earlier factors actually requested. */
    prefix: IAutoMovieQuaternion[];

    /** The bones the joint carries, its own included. */
    carried: ReadonlySet<AutoMovieHumanoidBone>;
  }

  /** The bones a bone carries, itself included, from the body's topology. */
  function carriedBy(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
  ): Set<AutoMovieHumanoidBone> {
    const out: Set<AutoMovieHumanoidBone> = new Set();
    const stack: AutoMovieHumanoidBone[] = [bone];
    while (stack.length !== 0) {
      const at: AutoMovieHumanoidBone = stack.pop()!;
      out.add(at);
      for (const child of body.topology.childrenByParent.get(at) ?? [])
        stack.push(child.bone);
    }
    return out;
  }

  /** Radians per degree. */
  const RADIAN: number = Math.PI / 180;

  /** A joint's axes by the angle's index. */
  const NAMES: readonly [Name, Name, Name] = ["flexion", "abduction", "twist"];

  /** No motion. */
  const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
}
