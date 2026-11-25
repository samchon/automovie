import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  ROM_TOLERANCE,
  clampJointToSkeleton,
  decomposeJointRotationOnBasis,
  getConstraint,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import type { HumanArmGeometryTypes as T } from "./HumanArmGeometryTypes";
import { placeHumanArmGeometry } from "./placeHumanArmGeometry";
import { prepareHumanArmChain } from "./prepareHumanArmChain";
import { resolveHumanArmChain } from "./resolveHumanArmChain";

/** The record of `IArmRead`'s site. */
type IArmRead = { flexion: number; abduction: number; twist: number };

/** The record of `IEncodePlace`'s site. */
type IEncodePlace = { x: number; y: number; twist: number };

/** The alternatives of `PrepareHasKey2`'s site. */
type PrepareHasKey2 = "flexion" | "abduction" | "twist";

/** The alternatives of `PrepareHasKey`'s site. */
type PrepareHasKey = "flexion" | "abduction" | "twist";

/**
 * An arm's joint-space coordinates and what they place: the shoulder's
 * swing-twist chart (`swingTwistRange.chart`, continuous and one to one over
 * the range, scaled so a unit is near a degree of swing), the elbow's and the
 * wrist's clinical angles; the arm's forward kinematics from its shoulder in a
 * posed frame (`HumanArmFrame`) and its probes; the shapes in its way and the
 * probes' distances to them are `HumanArmShapes`'.
 */
export namespace HumanArmGeometry {
  /**
   * Coordinates of an arm: the shoulder's chart (two) and twist, the elbow's
   * and the wrist's clinical triples.
   */
  export const DIMENSIONS: number = 9;

  /** The chart's unit disc in coordinate units. */
  export const SCALE: number = 100;

  /** The probe on the elbow. */
  export const ELBOW: number = 2;

  /** The probe on the wrist. */
  export const WRIST: number = 5;

  /** The probe on the middle fingertip. */
  export const TIP: number = 7;

  /**
   * The first of the arm's collider probes among a placed arm's probes, after
   * its eight axis spheres.
   */
  export const SURFACE: number = 8;

  /**
   * The shared source pose and external colliders from which an arm frame is
   * built.
   */
  export interface IBase extends T.IBase {}

  /**
   * An arm's setup.
   *
   * @param body The body.
   * @param side The arm.
   * @returns The setup.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmGeometry.ISetup {
    const bones: IAutoMovieMotionHumanArmGeometry.ISetup["bones"] = {
      upper: `${side}UpperArm`,
      lower: `${side}LowerArm`,
      hand: `${side}Hand`,
    };
    const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
      skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES);
    const lowerBone: IAutoMovieBone = find(body, bones.lower);
    const lower: IAutoMovieJointConstraint | null = getConstraint(
      bones.lower,
      lowerBone.constraint ?? null,
    );
    const handBone: IAutoMovieBone = find(body, bones.hand);
    const hand: IAutoMovieJointConstraint | null = getConstraint(
      bones.hand,
      handBone.constraint ?? null,
    );
    const has: (
      c: IAutoMovieJointConstraint | null,
      key: PrepareHasKey,
    ) => boolean = (
      c: IAutoMovieJointConstraint | null,
      key: PrepareHasKey2,
    ): boolean => c === null || c[key] !== null;
    const bases: Map<AutoMovieHumanoidBone, IAutoMovieJointAxes> = new Map();
    for (const bone of [bones.upper, bones.lower, bones.hand])
      bases.set(
        bone,
        normalizeJointAxes(axes[bone] ?? DEFAULT_JOINT_AXES, `arm axes: ${bone}`),
      );
    const upperBone: IAutoMovieBone = find(body, bones.upper);
    const upperConstraint: IAutoMovieJointConstraint = getConstraint(
      bones.upper,
      upperBone.constraint ?? null,
    )!;
    return {
      body,
      bones,
      constraint: {
        upper: upperConstraint,
        lower,
        hand,
      },
      joint: swingTwistRange.prepare(
        bones.upper,
        swingTwistRange.fromAxes(bones.upper, axes[bones.upper])!,
        upperConstraint,
      ),
      axes,
      rest: {
        upper: upperBone.rest,
        lower: lowerBone.rest,
        hand: handBone.rest,
      },
      free: [
        true,
        true,
        true,
        has(lower, "flexion"),
        has(lower, "abduction"),
        has(lower, "twist"),
        has(hand, "flexion"),
        has(hand, "abduction"),
        has(hand, "twist"),
      ],
      clamp: clampJointToSkeleton.prepare(body.skeleton, axes),
      basis: (
        bone: AutoMovieHumanoidBone,
        path: string,
      ): IAutoMovieJointAxes => {
        return (
          bases.get(bone) ??
          normalizeJointAxes(axes[bone] ?? DEFAULT_JOINT_AXES, path)
        );
      },
    };
  }

  /**
   * A bone's parent.
   *
   * @param body The body.
   * @param bone The bone.
   * @returns Its parent bone.
   */
  export function parent(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieBone["parent"] {
    return find(body, bone).parent;
  }

  /**
   * A joint's articulation from its clinical triple, clamped to the skeleton's
   * range (`clampJointToSkeleton`), using the same clinical articulation as the
   * displayed posture, so the arm planned is the arm shown.
   *
   * @param setup The arm.
   * @param bone The joint's bone.
   * @param of Its flexion, abduction and twist, degrees.
   * @returns The rotation from the bone's rest.
   */
  export function rotation(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion {
    const [flexion, abduction, twist]: [number, number, number] = clamped(
      setup,
      bone,
      of,
    );
    return Quaternion.normalize(
      jointToQuaternionOnBasis(
        { flexion, abduction, twist },
        setup.basis(bone, "jointToQuaternion axes"),
        HUMANOID_REST_FRAME[bone],
      ),
    );
  }

  /**
   * A joint's clinical triple clamped to the skeleton's range, the angles
   * forward kinematics reads (`rotation`).
   *
   * @param setup The arm.
   * @param bone The joint's bone.
   * @param of Its flexion, abduction and twist, degrees.
   * @returns The clamped triple.
   */
  export function clamped(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ): [number, number, number] {
    const joint: IAutoMovieJointPose = setup.clamp({
      bone,
      flexion: of[0],
      abduction: of[1],
      twist: of[2],
    });
    return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
  }

  /**
   * An arm's coordinates.
   *
   * @param setup The arm.
   * @param arm Its clinical triples.
   * @returns The coordinates.
   */
  export function encode(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    arm: IAutoMovieMotionHumanArmClearance.IArm,
  ): number[] {
    const place: IEncodePlace = swingTwistRange.chart(
      rotation(setup, setup.bones.upper, arm.upper),
      setup.constraint.upper,
      setup.joint,
    );
    // An arm already past a range enters as it is shown, clamped.
    return [
      place.x * SCALE,
      place.y * SCALE,
      place.twist,
      ...clamped(setup, setup.bones.lower, arm.lower),
      ...clamped(setup, setup.bones.hand, arm.hand),
    ];
  }

  /**
   * The shoulder's articulation at coordinates. The chart is one to one up to
   * the rest direction's antipode, where a direction has no azimuth, so a place
   * whose swing would reach it is drawn back along its azimuth to a swing the
   * joints' resolution (`ROM_TOLERANCE`) short of 180 degrees; every rotation
   * an arm can show lies inside, so an arm's coordinates (`encode`) read back
   * as the arm itself.
   *
   * @param setup The arm.
   * @param c The coordinates.
   * @returns The shoulder's rotation from its rest.
   */
  export function shoulder(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    c: readonly number[],
  ): IAutoMovieQuaternion {
    const k: number = Math.hypot(c[0]!, c[1]!) / SCALE;
    const most: number =
      (180 - ROM_TOLERANCE) /
      swingTwistRange.radius(
        setup.joint,
        k > 0 ? (Math.atan2(c[1]!, c[0]!) * 180) / Math.PI : 0,
      );
    const scale: number = k > most ? most / k : 1;
    return swingTwistRange.placed(
      { x: (c[0]! * scale) / SCALE, y: (c[1]! * scale) / SCALE, twist: c[2]! },
      setup.joint,
    );
  }

  /**
   * An arm's clinical triples at coordinates.
   *
   * @param setup The arm.
   * @param c The coordinates.
   * @param turned The shoulder's rotation at these coordinates (`shoulder`)
   *   when the caller already holds it; computed when absent.
   * @returns The triples.
   */
  export function arm(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    c: readonly number[],
    turned: IAutoMovieQuaternion = shoulder(setup, c),
  ): IAutoMovieMotionHumanArmClearance.IArm {
    const read: IArmRead = decomposeJointRotationOnBasis(
      turned,
      setup.basis(setup.bones.upper, "decomposeJointRotation axes"),
      HUMANOID_REST_FRAME[setup.bones.upper],
      {
        bone: setup.bones.upper,
        constraint:
          setup.constraint.upper.swingTwist !== undefined &&
          setup.constraint.upper.swingTwist !== null
            ? setup.constraint.upper
            : { ...setup.constraint.upper, swingTwist: null },
      },
    );
    return {
      upper: [read.flexion, read.abduction, read.twist],
      lower: [c[3]!, c[4]!, c[5]!],
      hand: [c[6]!, c[7]!, c[8]!],
    };
  }

  /**
   * The actual arm chain at coordinates, without fingertip or probe
   * observations.
   *
   * @param setup The unchanged arm rig metadata.
   * @param at The instant's shoulder-parent frame.
   * @param c The nine arm coordinates.
   * @returns Fresh world joint positions in metres and segment rotations.
   */
  export function chain(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    c: readonly number[],
  ): Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> {
    return resolveHumanArmChain(setup, at, c, shoulder, rotation);
  }

  /**
   * Read chains during one synchronous derivative invocation, sharing only
   * completed identical local articulations under its unchanged setup/frame.
   *
   * @param setup The actual prepare-produced setup, unchanged for this
   *   derivative.
   * @param at This derivative's unchanged frame.
   * @returns A local chain reader, released when the derivative finishes or
   *   throws.
   */
  export function prepareChain(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
  ): (
    c: readonly number[],
  ) => Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> {
    return prepareHumanArmChain(setup, at, shoulder, rotation);
  }

  /**
   * The arm placed in a frame.
   *
   * @param setup The arm.
   * @param at The frame.
   * @param c The coordinates.
   * @param surface Whether to place the collider probes too.
   * @returns The arm placed.
   */
  export function placed(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    c: readonly number[],
    surface: boolean = true,
  ): IAutoMovieMotionHumanArmGeometry.IPlaced {
    return placeHumanArmGeometry(setup, at, chain(setup, at, c), surface);
  }
}

/** A bone of the body's skeleton. */
function find(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
): IAutoMovieBone {
  return readHumanBone(body, bone)!;
}
