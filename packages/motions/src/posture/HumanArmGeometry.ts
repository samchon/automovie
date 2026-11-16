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
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanArmClearance } from "./HumanArmClearance";
import type { HumanColliders } from "./HumanColliders";

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

  /** A shape in an arm's way, placed, with its bounding sphere. */
  export interface IShape {
    /** The bone the shape's segment rides on. */
    bone: AutoMovieHumanoidBone;
    /** The frame's collider part: the body's audit indices first, then the external placed segments in their order in the base. */
    part: number;
    /** The segment's world pose. */
    pose: HumanColliders.IPlaced["pose"];
    /** The shape in the segment's frame. */
    shape: HumanColliders.IPlaced["shapes"][number];
    /** Its bounding sphere's world centre. */
    centre: IAutoMovieVector3;
    /** Its bounding sphere's radius, metres. */
    radius: number;
  }

  /** What an arm's coordinates are read with, built once per body and side. */
  export interface ISetup {
    /** The body. */
    body: IHumanBody;
    /** The arm's three bones. */
    bones: {
      /** The upper arm. */
      upper: AutoMovieHumanoidBone;
      /** The forearm. */
      lower: AutoMovieHumanoidBone;
      /** The hand. */
      hand: AutoMovieHumanoidBone;
    };
    /** Each joint's range; the elbow's and the wrist's may be absent. */
    constraint: {
      /** The shoulder's, with its swing-twist record. */
      upper: IAutoMovieJointConstraint;
      /** The elbow's. */
      lower: IAutoMovieJointConstraint | null;
      /** The wrist's. */
      hand: IAutoMovieJointConstraint | null;
    };
    /** The shoulder's swing-twist frame. */
    joint: swingTwistRange.IJoint;
    /** The skeleton's joint axes. */
    axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
    /** Each bone's rest transform from its parent. */
    rest: {
      /** The upper arm's. */
      upper: IAutoMovieBone["rest"];
      /** The forearm's. */
      lower: IAutoMovieBone["rest"];
      /** The hand's. */
      hand: IAutoMovieBone["rest"];
    };
    /** Whether each coordinate is a freedom of its joint. */
    free: boolean[];
  }

  /** What the arm is read against at one instant (`HumanArmFrame.of`). */
  export interface IFrame {
    /** The shoulder's parent's world rotation and position. */
    parent: {
      /** Its world rotation. */
      rotation: IAutoMovieQuaternion;
      /** Its world position. */
      position: IAutoMovieVector3;
    };
    /** The middle fingertip in the hand's frame from the wrist. */
    tip: IAutoMovieVector3;
    /** The arm's collider probes (the tangle audit's corners), each in the frame of the arm's segment it rides on (`owners`). */
    surface: IAutoMovieVector3[];
    /** The segment of the arm each surface probe rides on. */
    owners: ("upper" | "lower" | "hand")[];
    /** A sphere about each segment's surface probes, in that segment's frame: the broad phase that spares the probes of a segment far from a shape. */
    bounds: Record<
      "upper" | "lower" | "hand",
      { centre: IAutoMovieVector3; radius: number }
    >;
    /** The tangle audit's part each surface probe belongs to, by the order the colliders are placed. */
    segments: number[];
    /** Each surface probe's index among its part's own probes, for the audit's reference depth of it. */
    corners: number[];
    /** Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion. */
    related: boolean[][];
    /** The arm's own collider segments, each in the frame of the arm's segment it rides on: what another moving arm keeps clear of. */
    colliders: {
      /** The arm's segment it rides on. */
      owner: "upper" | "lower" | "hand";
      /** Its bone. */
      bone: AutoMovieHumanoidBone;
      /** The tangle audit's part it is. */
      part: number;
      /** Its pose in the riding segment's frame. */
      pose: HumanColliders.IPlaced["pose"];
      /** Its shapes. */
      shapes: HumanColliders.IPlaced["shapes"];
    }[];
    /** The shapes in the arm's way. */
    shapes: IShape[];
    /** The collider probes in the arm's way (the tangle audit's corners), in the world, the solved arms left out: each one's point, frame part, index among that part's probes, and bone. Includes external bodies, whose frame parts follow the body's audit parts and have no own-body reference depth. The audit reads a pair both ways, so these are read inside the arm's own colliders as the arm's are inside the shapes. */
    body: {
      point: IAutoMovieVector3;
      part: number;
      corner: number;
      bone: AutoMovieHumanoidBone;
    }[];
  }

  /** The arm placed: its probes and its segments' world frames. */
  export interface IPlaced {
    /** Each probe's world point and radius: eight axis spheres (two on the upper arm, four on the forearm to the wrist, two on the hand), then the collider probes with radius 0. */
    probes: readonly (readonly [IAutoMovieVector3, number])[];
    /** The shoulder's world point. */
    shoulder: IAutoMovieVector3;
    /** The elbow's world point. */
    elbow: IAutoMovieVector3;
    /** The upper arm's world rotation. */
    upper: IAutoMovieQuaternion;
    /** The forearm's world rotation. */
    lower: IAutoMovieQuaternion;
    /** The wrist's world point. */
    wrist: IAutoMovieVector3;
    /** The hand's world rotation. */
    hand: IAutoMovieQuaternion;
  }

  /** The pose an arm is read in and another body's colliders in its way. */
  export interface IBase {
    /** The pose, the arms of the problem in it ignored. */
    pose: IAutoMoviePose;
    /** Another body's placed colliders. */
    others: readonly HumanColliders.IPlaced[];
  }

  /**
   * An arm's setup.
   *
   * @param body The body.
   * @param side The arm.
   * @returns The setup.
   */
  export function prepare(body: IHumanBody, side: "left" | "right"): ISetup {
    const bones: ISetup["bones"] = {
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
    body: IHumanBody,
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
    setup: ISetup,
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
    setup: ISetup,
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
  export function encode(setup: ISetup, arm: HumanArmClearance.IArm): number[] {
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
    setup: ISetup,
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
    setup: ISetup,
    c: readonly number[],
  ): HumanArmClearance.IArm {
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
    setup: ISetup,
    at: IFrame,
    c: readonly number[],
    surface: boolean = true,
  ): IPlaced {
    const rest: ISetup["rest"] = setup.rest;
    const parent: IFrame["parent"] = at.parent;
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
    const m: IHumanBody["measure"] = setup.body.measure;
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
function find(body: IHumanBody, bone: AutoMovieHumanoidBone): IAutoMovieBone {
  return body.skeleton.bones.find(
    (b: IAutoMovieBone): boolean => b.bone === bone,
  )!;
}
