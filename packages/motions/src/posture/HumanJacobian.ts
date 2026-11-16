import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieChainBone,
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
 * The established body-indexed rig snapshot requires that body's skeleton,
 * topology and clinical bases to remain unchanged for its lifetime; reads
 * retain that existing policy rather than introducing another global cache.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the variables, the twist with its source, the two read-outs, how each axis is found and what a range limit gives.
 * @evidence contracts/development/design.md#principled-representation A variable as a twist (an angular velocity through a point, or a linear velocity) with the bones it moves, the representation the geometric Jacobian is built from; segment twists and point columns both follow from it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Variable, motion and twist records serve the same Jacobian owner for floor fitting and arm planning. of preserves the motion-array surface, read also exposes projections the same candidate already used, and twist/velocity derive segment or point motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The axes, rest frames, ranges and composition orders are the engine's own, the ones forward kinematics reads.
 */
export namespace HumanJacobian {
  /**
   * A variable per its authored unit: root place per metre, and heading or
   * joint angles per degree. Joint axes 0, 1, 2 mean flexion, abduction, twist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each kind's unit, the three joint-axis indices and the closed root axis/heading names.
   * @evidence contracts/development/design.md#principled-representation A tagged coordinate identifies translation, root Euler heading or one clinical joint angle, exactly the variables the geometric Jacobian differentiates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface of/read consume the existing floor-fit variables and arm planner's clinical coordinates without a parallel coordinate type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed kind/axis unions carry an actual bone for a joint variable; no arbitrary derivative callback, target-specific flag or numerical fallback is encoded.
   */
  export type IVariable =
    | { kind: "place"; axis: "x" | "y" | "z" }
    | { kind: "heading"; axis: "yaw" | "pitch" | "roll" }
    | { kind: "angle"; bone: AutoMovieHumanoidBone; axis: 0 | 1 | 2 };

  /**
   * How one variable moves the body, per its unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world angular velocity, linear velocity at the world origin and the affected-bone set, including the all-bones null case.
   * @evidence contracts/development/design.md#principled-representation A spatial twist and its affected subtree determine every segment-origin and attached-point derivative for the same coordinate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface of/read produce the three fields consumed by twist and velocity; no pose copy or duplicate target Jacobian is carried.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record represents an actual coordinate derivative and bone membership, with units per the variable; it does not assert finite-difference agreement or optimization convergence by type alone.
   */
  export interface IMotion {
    /** The angular velocity of the bones it moves, radians; nought for a place. */
    angular: IAutoMovieVector3;

    /** The linear velocity it gives the world origin, metres; a place's direction, or the turn's at the origin. */
    linear: IAutoMovieVector3;

    /** The bones moved; null for every bone. */
    moves: ReadonlySet<AutoMovieHumanoidBone> | null;
  }

  /**
   * A segment's angular and origin linear velocity, per the variable's unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the angular and linear derivatives, the segment-origin reference point and per-coordinate units.
   * @evidence contracts/development/design.md#principled-representation Angular velocity together with origin velocity gives the velocity of any rigidly attached point by omega cross its offset.
   * @evidence contracts/development/design.md#minimal-and-owned-surface twist produces the same two fields arm planner columns and collision derivatives consume; world-origin bookkeeping remains in IMotion.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No alternate derivative law or convergence flag is represented; values remain physical derivatives of the requested coordinate.
   */
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to read and returns its motion array, keeping one owner for ordered variable formation and same-candidate preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angles are the clamped ones forward kinematics reads, so an angle set out of range moves the body as it is shown.
   * @evidence contracts/development/implementation.md#efficient-algorithms read performs one actual projection and at most two earlier factors per requested joint, then constant final work per variable, without FK. Initial legacy carried sets cost O(B squared) in a deep B-bone tree; candidate clamp preparation adds O(B), and numerical projection work remains. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The established weak body rig is unchanged; same-candidate joint preparation is shared only inside read, preserving every requested variable and its output order. Another candidate always enters another read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary per-read prefixes, clamps and the unused projected-joint map end after this wrapper returns. Motion moves sets borrow the existing weak body rig; only the caller-owned motion array escapes.
   */
  export function of(
    body: IHumanBody,
    posture: IHumanPosture,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieChainBone>,
    variables: readonly IVariable[],
  ): IMotion[] {
    return read(body, posture, bones, variables).motions;
  }

  /**
   * Read variable motions and the exact joints clamped while forming them.
   * The posture, body and resolved bones must describe the same current
   * candidate and remain unchanged until this synchronous read returns.
   * Repeated variables share only that candidate's completed joint preparation;
   * another finite-difference or optimization candidate needs another read.
   *
   * @param body The unchanged body described by its established rig snapshot.
   * @param posture The current clinical angles and root heading.
   * @param bones The same candidate's actual resolved bone frames.
   * @param variables Requested variables, including duplicates, in output order.
   * @returns Fresh motions and a map of the actual clamped joints used for angle variables.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States same-candidate input stability, ordered duplicate variables, clamped result provenance and the synchronous release boundary.
   * @evidence contracts/development/implementation.md#principled-implementation The same geometric Jacobian maps the clinical axis through its parent/rest frame and the preceding intrinsic-Euler factors. One actual rig projection and lazy quaternion-prefix chain per bone suffice for every requested axis of that unchanged candidate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure of delegates here; this read owns candidate-local preparation and ordered derivative formation, while rigOf, engine clamp preparation and twist/velocity retain their existing responsibilities.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Root heading and initial rig admission retain their original order. A bone is projected only at its first requested angle, earlier factors are computed only when first needed, and every variable still forms its own motion; no perturbed pose, derivative result or callback is memoized.
   * @evidence contracts/development/implementation.md#efficient-algorithms For D variables naming U joints, one O(B) canonical clamp index/axes preparation and U actual projections replace D scans/projections. Each bone computes at most two factors and three prefix frames; D final formations remain. The unchanged first body rig has worst-case O(B squared) carried sets; read-local state is O(B+U), and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same-candidate clinical triples, canonical frames, resolved parents and rig rest transforms prove per-bone preparation equivalence. Returned clamped joints let HumanArmJacobian reuse those exact projections instead of projecting the same candidate again; no state crosses reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources O(B+U) prefix/clamp preparation ends with this synchronous read. The caller owns motions and at most U clamped records; moves sets borrow the existing weak body rig, whose carried sets can total O(B squared). No new global cache, callback closure, task or handle is retained.
   */
  export function read(
    body: IHumanBody,
    posture: IHumanPosture,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieChainBone>,
    variables: readonly IVariable[],
  ): IReading {
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
    const clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
      clampJointToSkeleton.prepare(body.skeleton);
    const prepared: Map<AutoMovieHumanoidBone, IJointReading> = new Map();
    const clamped: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
    const turning: (
      axis: IAutoMovieVector3,
      pivot: IAutoMovieVector3,
      moves: ReadonlySet<AutoMovieHumanoidBone> | null,
    ) => IMotion = (
      axis: IAutoMovieVector3,
      pivot: IAutoMovieVector3,
      moves: ReadonlySet<AutoMovieHumanoidBone> | null,
    ): IMotion => ({
      angular: axis,
      linear: Vector3.cross(axis, Vector3.scale(pivot, -1)),
      moves,
    });
    const motions: IMotion[] = variables.map((variable: IVariable): IMotion => {
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
      let reading: IJointReading | undefined = prepared.get(bone);
      if (reading === undefined) {
        const def: IAutoMovieBone = rig.bones.get(bone)!;
        const basis: IAutoMovieJointAxes = rig.bases.get(bone)!;
        const set: readonly [number, number, number] = posture.joints[bone] ?? [
          0, 0, 0,
        ];
        const joint: IAutoMovieJointPose = clamp({
          bone,
          flexion: set[0],
          abduction: set[1],
          twist: set[2],
        });
        const frame: IAutoMovieRestFrame | undefined =
          HUMANOID_REST_FRAME[bone];
        const parent: IAutoMovieQuaternion =
          def.parent === null ? heading : bones.get(def.parent)!.worldRotation;
        const order: readonly Name[] =
          basis.twistPlacement === "distal"
            ? ["abduction", "flexion", "twist"]
            : ["twist", "abduction", "flexion"];
        reading = {
          joint,
          basis,
          frame,
          order,
          prefix: [Quaternion.multiply(parent, def.rest.rotation)],
        };
        clamped.set(bone, joint);
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
          Quaternion.rotateVector(reading.prefix[depth]!, reading.basis[name]),
          RADIAN / (reading.frame?.[name]?.sign ?? 1),
        ),
        bones.get(bone)!.worldPosition,
        rig.carried.get(bone)!,
      );
    });
    return { motions, clamped };
  }

  /**
   * A segment's twist under a motion.
   *
   * @param motion The motion.
   * @param bone The segment's bone.
   * @param origin The bone's origin, world metres.
   * @returns The segment's angular velocity and its origin's linear velocity; nought when the motion does not move the bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States segment membership, world-origin input and per-coordinate angular/linear output at the segment origin.
   * @evidence contracts/development/implementation.md#principled-implementation For an affected segment, v_origin equals the world-origin linear velocity plus omega cross origin; an unaffected segment has zero angular and linear derivative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One membership gate and one spatial-twist shift serve all segment consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual supplied origin and affected set without numerical perturbation, tolerance or named-bone exceptions.
   * @evidence contracts/development/implementation.md#efficient-algorithms One set membership and a fixed number of vector operations take constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's completed variable motion rather than forming another Jacobian; many segment probes can share this shifted twist.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh outer record, borrowing the motion's angular vector or shared zero and owning a newly composed nonzero linear vector; it retains no input, map or handle.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States attached-point world coordinates, per-variable metre derivative and unaffected-bone zero.
   * @evidence contracts/development/implementation.md#principled-implementation A spatial twist gives v_point equals v_world_origin plus omega cross world point, with the affected set deciding whether the coordinate carries that point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the IMotion representation with segment twist reading and performs only point evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No perturbed pose, contact proxy, tolerance or bone-specific branch replaces the supplied motion and point.
   * @evidence contracts/development/implementation.md#efficient-algorithms One membership lookup and fixed vector work take constant time and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's completed motion serves every point on its affected segments, with no repeated rig, clamp or axis preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a newly composed affected velocity or the existing shared zero; retains no point, motion, collection or resource handle.
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

  /** One candidate's result, without retaining the temporary prefix/clamp preparation. */
  interface IReading {
    /** Fresh motions in the requested variable order. */
    motions: IMotion[];

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

    /** Intrinsic composition order selected by twist placement. */
    order: readonly Name[];

    /** Parent/rest base followed by only the earlier factors actually requested. */
    prefix: IAutoMovieQuaternion[];
  }

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
    const carried: Map<
      AutoMovieHumanoidBone,
      Set<AutoMovieHumanoidBone>
    > = new Map();
    const carries: (
      bone: AutoMovieHumanoidBone,
    ) => Set<AutoMovieHumanoidBone> = (
      bone: AutoMovieHumanoidBone,
    ): Set<AutoMovieHumanoidBone> => {
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
