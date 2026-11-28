import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanAirborneShape,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { resolveHumanPostureSource } from "../../posture/internal/resolveHumanPostureSource";

/*
 * The body shapes held in flight: tuck, pike, layout, straddle and the twisting
 * arm sets, each a layer laid over a jump's flight window, so the flight pass
 * (`HumanPerformanceFlight`) reads the composed shape and turns the body by it:
 * a tuck turns faster than a layout by the ratio of their moments about the
 * somersault axis.
 *
 * Each shape holds clinical joint angles for the channels it claims, set over
 * what the flight holds there; a goal the flight holds on a limb the shape
 * claims is moved to where the shape's joints put that limb's end joint, since
 * a held tuck is a joint shape and not a foot placed somewhere, and a layer's
 * weight moves a goal both postures hold but keeps one only the base holds
 * until the full weight drops it at once, which would snap the limb mid-air.
 * The positions are the gymnastic and diving position names (tuck: hips and
 * knees bent; pike: hips bent, knees straight; layout: straight; straddle: legs
 * apart), with angles that are provisional: no rulebook or kinematic study was
 * read for them.
 *
 * Schedule a shape over the flight as a windowed layer, from the jump's
 * `takeoff` to its `touchdown`.
 */
export namespace HumanAirborneShape {
  /*
   * The shape names, as data.
   */
  export const SHAPES = [
    "tuck",
    "pike",
    "layout",
    "straddle",
    "armsIn",
    "armsUp",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanAirborneShape.Shape>[];

  /*
   * Each shape's clinical joint angles, degrees `[flexion, abduction, twist]`
   * (provisional).
   */
  export const ANGLES: Readonly<
    Record<
      IAutoMovieMotionHumanAirborneShape.Shape,
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >
  > = {
    tuck: {
      leftUpperLeg: [120, 0, 0],
      rightUpperLeg: [120, 0, 0],
      leftLowerLeg: [130, 0, 0],
      rightLowerLeg: [130, 0, 0],
    },
    pike: {
      leftUpperLeg: [110, 0, 0],
      rightUpperLeg: [110, 0, 0],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
    },
    layout: {
      leftUpperLeg: [0, 0, 0],
      rightUpperLeg: [0, 0, 0],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
    },
    straddle: {
      leftUpperLeg: [90, 40, 0],
      rightUpperLeg: [90, 40, 0],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
    },
    armsIn: {
      leftUpperArm: [30, -10, 0],
      rightUpperArm: [30, -10, 0],
      leftLowerArm: [120, 0, 0],
      rightLowerArm: [120, 0, 0],
    },
    armsUp: {
      leftUpperArm: [170, 0, 0],
      rightUpperArm: [170, 0, 0],
      leftLowerArm: [0, 0, 0],
      rightLowerArm: [0, 0, 0],
    },
  };

  /*
   * A shape as a layer.
   * Parameter shape: The shape.
   * Returns: The layer, named after the shape; it claims the legs or the arms
   * it shapes and reads the person's body from its context.
   */
  export function layer(
    shape: IAutoMovieMotionHumanAirborneShape.Shape,
  ): IAutoMovieMotionHumanLayer {
    const definition: IDefinition = build(shape);
    return {
      name: shape,
      channels: definition.channels,
      blend: definition.blend,
      lend: definition.blend,
      apply: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        context: IAutoMovieMotionHumanLayer.IContext,
      ): IAutoMovieMotionHumanPosture =>
        definition.blend(posture, seconds, context, 1),
    };
  }

  /*
   * Receive the projected joints and root during the same displayed evaluation.
   */
  export type Assembly = (direct: resolveHumanPostureSource.IAssembled) => void;

  /*
   * Apply a native shape at layer-local seconds and optionally lend the
   * assembly used to place its held goals. The context supplies the performing
   * body and the weight is the layer's blend fraction. The returned posture
   * uses the input posture's frame.
   */
  export type ShapeBlend = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    context: IAutoMovieMotionHumanLayer.IContext,
    weight: number,
    assembly?: Assembly,
  ) => IAutoMovieMotionHumanPosture;

  /*
   * The limb channels and posture blend for one airborne shape.
   */
  interface IDefinition {
    channels: AutoMovieHumanLimb[];
    blend: ShapeBlend;
  }

  /*
   * Construct the clinical keys, demanded limb chains and their native blend.
   */
  function build(shape: IAutoMovieMotionHumanAirborneShape.Shape): IDefinition {
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = ANGLES[shape];
    const legs: boolean = Object.keys(joints).some((b: string): boolean =>
      b.endsWith("Leg"),
    );
    const claimed: readonly AutoMovieHumanLimb[] = legs
      ? ["leftLeg", "rightLeg"]
      : ["leftArm", "rightArm"];
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    const demands: Partial<
      Record<AutoMovieHumanLimb, ReadonlySet<AutoMovieHumanoidBone>>
    > = {};
    for (const limb of claimed) {
      const chain: Set<AutoMovieHumanoidBone> = new Set(CHAIN[limb]);
      demands[limb] = chain;
      for (const bone of chain) requested.add(bone);
    }
    const blend: ShapeBlend = (
      posture: IAutoMovieMotionHumanPosture,
      _seconds: number,
      context: IAutoMovieMotionHumanLayer.IContext,
      weight: number,
      assembly?: Assembly,
    ): IAutoMovieMotionHumanPosture => {
      if (weight <= 0) return posture;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      const held: AutoMovieHumanLimb[] = [];
      for (const limb of claimed) {
        if (posture.limbs[limb] !== undefined) held.push(limb);
        delete limbs[limb];
      }
      const reader:
        | ReturnType<
            NonNullable<IAutoMovieMotionHumanLayer.IContext["resolution"]>
          >
        | undefined = held.length === 0 ? undefined : context.resolution?.();
      const projection:
        | ReturnType<
            NonNullable<IAutoMovieMotionHumanLayer.IContext["projection"]>
          >
        | undefined = held.length === 0 ? undefined : context.projection?.();
      const local: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
        ...joints,
      };
      // Fade in the body's clinical joint coordinates. A held endpoint follows
      // the joint arc below, including when the original foot came from IK.
      if (weight < 1) {
        const base: IAutoMoviePose | undefined =
          held.length === 0
            ? undefined
            : resolveHumanPosture.seeded(
                context.body,
                posture,
                undefined,
                undefined,
                reader,
                requested,
                projection,
              ).pose;
        for (const limb of claimed) {
          for (const bone of CHAIN[limb]) {
            const to: readonly [number, number, number] | undefined =
              joints[bone];
            if (to === undefined) continue;
            const actual: IAutoMovieJointPose | undefined = base?.joints.find(
              (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
            );
            const authored: readonly [number, number, number] | undefined =
              posture.joints[bone];
            const x: number = actual?.flexion ?? authored?.[0] ?? 0;
            const y: number = actual?.abduction ?? authored?.[1] ?? 0;
            const z: number = actual?.twist ?? authored?.[2] ?? 0;
            local[bone] = [
              x + weight * (to[0] - x),
              y + weight * (to[1] - y),
              z + weight * (to[2] - z),
            ];
          }
        }
      }
      const shaped: IAutoMovieMotionHumanPosture = {
        ...posture,
        joints: local,
        limbs,
      };
      if (held.length === 0) return shaped;
      const observed: ReadonlySet<AutoMovieHumanoidBone> =
        held.length === claimed.length ? requested : demands[held[0]!]!;

      // A held goal goes where the shape's joints put the end joint, posed
      // before the whole-body turn the goals are stated under, so a
      // fading layer moves the goal there and never drops it mid-air.
      const still: IAutoMovieMotionHumanPosture =
        shaped.rotation === undefined ? shaped : { ...shaped };
      if (still !== shaped) delete still.rotation;
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(reader);
      // No limb or digit changes the direct pose here. Its root and joints
      // are also those of the final authored goals added to limbs below.
      const direct: resolveHumanPostureSource.IAssembled | undefined =
        assembly !== undefined &&
        still === shaped &&
        still.digits === undefined &&
        Object.keys(limbs).length === 0
          ? resolveHumanPostureSource.assemble(
              context.body,
              still,
              undefined,
              projection,
            )
          : undefined;
      const pose: IAutoMoviePose =
        direct?.pose ??
        resolveHumanPosture.seeded(
          context.body,
          still,
          undefined,
          undefined,
          resolution,
          observed,
          projection,
        ).pose;
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(context.body, pose, resolution(), observed);
      const at: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
        bone: AutoMovieHumanoidBone,
      ): IAutoMovieVector3 => bones.get(bone)!.worldPosition;
      for (const limb of held) {
        const [upper, middle, end]: readonly [
          AutoMovieHumanoidBone,
          AutoMovieHumanoidBone,
          AutoMovieHumanoidBone,
        ] = CHAIN[limb];
        const top: IAutoMovieVector3 = at(upper);
        const joint: IAutoMovieVector3 = at(middle);
        const point: IAutoMovieVector3 = at(end);
        const axis: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(point, top);
        const along: number =
          AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(joint, top), axis) /
          AutoMovieEngineVector3.dot(axis, axis);
        const out: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          joint,
          AutoMovieEngineVector3.add(top, AutoMovieEngineVector3.scale(axis, along)),
        );
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[limb]!;
        limbs[limb] = {
          ...goal,
          point,
          bend:
            AutoMovieEngineVector3.length(out) >
            Math.sqrt(Number.EPSILON) * AutoMovieEngineVector3.length(axis)
              ? AutoMovieEngineVector3.add(joint, out)
              : goal.bend,
        };
      }
      if (direct !== undefined) assembly!(direct);
      return shaped;
    };
    return { channels: [...claimed], blend };
  }

  /*
   * Each limb's upper, middle and end joints' bones.
   */
  const CHAIN: Readonly<
    Record<
      AutoMovieHumanLimb,
      readonly [
        AutoMovieHumanoidBone,
        AutoMovieHumanoidBone,
        AutoMovieHumanoidBone,
      ]
    >
  > = {
    leftArm: ["leftUpperArm", "leftLowerArm", "leftHand"],
    rightArm: ["rightUpperArm", "rightLowerArm", "rightHand"],
    leftLeg: ["leftUpperLeg", "leftLowerLeg", "leftFoot"],
    rightLeg: ["rightUpperLeg", "rightLowerLeg", "rightFoot"],
  };
}
