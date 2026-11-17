import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieJointAxes, IAutoMovieJointConstraint, IAutoMovieMotionHumanArmClearance, IAutoMovieMotionHumanArmGeometry, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanColliders, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  clampJointToSkeleton,
  decomposeJointRotation,
  getConstraint,
  jointToQuaternion,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";

/**
 * An arm's joint-space coordinates and what they place: the shoulder's
 * swing-twist chart (`swingTwistRange.chart`, continuous and one to one over
 * the range, scaled so a unit is near a degree of swing), the elbow's and
 * the wrist's clinical angles; the arm's forward kinematics from its
 * shoulder in a posed frame (`HumanArmFrame`) and its probes; the shapes
 * in its way and the probes' distances to them are `HumanArmShapes`'.
 */
export namespace HumanArmGeometry {
  /** Coordinates of an arm: the shoulder's chart (two) and twist, the elbow's and the wrist's clinical triples. */
  export const DIMENSIONS: number = 9;

  /** The chart's unit disc in coordinate units. */
  export const SCALE: number = 100;

  /** The probe on the elbow. */
  export const ELBOW: number = 2;

  /** The probe on the wrist. */
  export const WRIST: number = 5;

  /** The probe on the middle fingertip. */
  export const TIP: number = 7;

  /** The first of the arm's collider probes among a placed arm's probes, after its eight axis spheres. */
  export const SURFACE: number = 8;

  /** The pose an arm is read in and another body's colliders in its way. */
  export interface IBase {
    /** The pose, the arms of the problem in it ignored. */
    pose: IAutoMoviePose;
    /** Another body's placed colliders. */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * An arm's setup.
   *
   * @param body The body.
   * @param side The arm.
   * @returns The setup.
   */
  export function prepare(body: IAutoMovieMotionHumanBody, side: "left" | "right"): IAutoMovieMotionHumanArmGeometry.ISetup {
    const bones: IAutoMovieMotionHumanArmGeometry.ISetup["bones"] = {
      upper: `${side}UpperArm`,
      lower: `${side}LowerArm`,
      hand: `${side}Hand`,
    };
    const constraint = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieJointConstraint | null =>
      getConstraint(bone, find(body, bone).constraint ?? null);
    let axes:
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined = AXES.get(body.skeleton);
    if (axes === undefined) {
      axes = skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES);
      AXES.set(body.skeleton, axes);
    }
    const lower: IAutoMovieJointConstraint | null = constraint(bones.lower);
    const hand: IAutoMovieJointConstraint | null = constraint(bones.hand);
    const has = (
      c: IAutoMovieJointConstraint | null,
      key: "flexion" | "abduction" | "twist",
    ): boolean => c === null || c[key] !== null;
    return {
      body,
      bones,
      constraint: { upper: constraint(bones.upper)!, lower, hand },
      joint: swingTwistRange.of(bones.upper, body.skeleton)!,
      axes,
      rest: {
        upper: find(body, bones.upper).rest,
        lower: find(body, bones.lower).rest,
        hand: find(body, bones.hand).rest,
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
  ): AutoMovieHumanoidBone {
    return find(body, bone).parent as AutoMovieHumanoidBone;
  }

  /**
   * A joint's articulation from its clinical triple, clamped to the
   * skeleton's range as the engine's forward kinematics clamps it
   * (`clampJointToSkeleton`), so the arm planned is the arm shown.
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
      jointToQuaternion(
        { flexion, abduction, twist },
        setup.axes[bone],
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
    const joint: ReturnType<typeof clampJointToSkeleton> = clampJointToSkeleton(
      { bone, flexion: of[0], abduction: of[1], twist: of[2] },
      setup.body.skeleton,
    );
    return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
  }

  /**
   * An arm's coordinates.
   *
   * @param setup The arm.
   * @param arm Its clinical triples.
   * @returns The coordinates.
   */
  export function encode(setup: IAutoMovieMotionHumanArmGeometry.ISetup, arm: IAutoMovieMotionHumanArmClearance.IArm): number[] {
    const place: { x: number; y: number; twist: number } =
      swingTwistRange.chart(
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
   * The shoulder's articulation at coordinates. The chart is one to one up
   * to the rest direction's antipode, where a direction has no azimuth, so a
   * place whose swing would reach it is drawn back along its azimuth to a
   * swing the joints' resolution (`ROM_TOLERANCE`) short of 180 degrees;
   * every rotation an arm can show lies inside, so an arm's coordinates
   * (`encode`) read back as the arm itself.
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
        setup.constraint.upper,
        setup.joint,
        k > 0 ? (Math.atan2(c[1]!, c[0]!) * 180) / Math.PI : 0,
      );
    const scale: number = k > most ? most / k : 1;
    return swingTwistRange.placed(
      { x: (c[0]! * scale) / SCALE, y: (c[1]! * scale) / SCALE, twist: c[2]! },
      setup.constraint.upper,
      setup.joint,
    );
  }

  /**
   * An arm's clinical triples at coordinates.
   *
   * @param setup The arm.
   * @param c The coordinates.
   * @returns The triples.
   */
  export function arm(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    c: readonly number[],
  ): IAutoMovieMotionHumanArmClearance.IArm {
    const read: { flexion: number; abduction: number; twist: number } =
      decomposeJointRotation(
        shoulder(setup, c),
        setup.axes[setup.bones.upper],
        HUMANOID_REST_FRAME[setup.bones.upper],
        {
          bone: setup.bones.upper,
          constraint: { ...setup.constraint.upper, swingTwist: null },
        },
      );
    return {
      upper: [read.flexion, read.abduction, read.twist],
      lower: [c[3]!, c[4]!, c[5]!],
      hand: [c[6]!, c[7]!, c[8]!],
    };
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
    const rest: IAutoMovieMotionHumanArmGeometry.ISetup["rest"] = setup.rest;
    const parent: IAutoMovieMotionHumanArmGeometry.IFrame["parent"] = at.parent;
    const wu: IAutoMovieQuaternion = Quaternion.multiply(
      parent.rotation,
      Quaternion.multiply(rest.upper.rotation, shoulder(setup, c)),
    );
    const pu: IAutoMovieVector3 = Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, rest.upper.translation),
    );
    const wl: IAutoMovieQuaternion = Quaternion.multiply(
      wu,
      Quaternion.multiply(
        rest.lower.rotation,
        rotation(setup, setup.bones.lower, [c[3]!, c[4]!, c[5]!]),
      ),
    );
    const pl: IAutoMovieVector3 = Vector3.add(
      pu,
      Quaternion.rotateVector(wu, rest.lower.translation),
    );
    const wh: IAutoMovieQuaternion = Quaternion.multiply(
      wl,
      Quaternion.multiply(
        rest.hand.rotation,
        rotation(setup, setup.bones.hand, [c[6]!, c[7]!, c[8]!]),
      ),
    );
    const ph: IAutoMovieVector3 = Vector3.add(
      pl,
      Quaternion.rotateVector(wl, rest.hand.translation),
    );
    const tip: IAutoMovieVector3 = Vector3.add(
      ph,
      Quaternion.rotateVector(wh, at.tip),
    );
    const m: IAutoMovieMotionHumanBody["measure"] = setup.body.measure;
    return {
      probes: [
        [Vector3.lerp(pu, pl, 0.5), m.upperArmRadius],
        [Vector3.lerp(pu, pl, 0.8), (m.upperArmRadius + m.forearmRadius) / 2],
        [pl, m.forearmRadius],
        [Vector3.lerp(pl, ph, 1 / 3), m.forearmRadius * 0.9],
        [Vector3.lerp(pl, ph, 2 / 3), m.forearmRadius * 0.8],
        [ph, m.forearmRadius * 0.7],
        [Vector3.lerp(ph, tip, 0.5), m.forearmRadius * 0.6],
        [tip, m.forearmRadius * 0.4],
        ...(surface ? at.surface : []).map(
          (
            s: IAutoMovieVector3,
            i: number,
          ): readonly [IAutoMovieVector3, number] => {
            const owner: "upper" | "lower" | "hand" = at.owners[i]!;
            const [o, w]: [IAutoMovieVector3, IAutoMovieQuaternion] =
              owner === "upper"
                ? [pu, wu]
                : owner === "lower"
                  ? [pl, wl]
                  : [ph, wh];
            return [Vector3.add(o, Quaternion.rotateVector(w, s)), 0];
          },
        ),
      ],
      shoulder: pu,
      elbow: pl,
      upper: wu,
      lower: wl,
      wrist: ph,
      hand: wh,
    };
  }
}

/** The skeleton's joint axes, read once per skeleton. */
const AXES: WeakMap<
  object,
  Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
> = new WeakMap();

/** A bone of the body's skeleton. */
function find(body: IAutoMovieMotionHumanBody, bone: AutoMovieHumanoidBone): IAutoMovieBone {
  return body.skeleton.bones.find(
    (b: IAutoMovieBone): boolean => b.bone === bone,
  )!;
}
