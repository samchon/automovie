import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAirborneShape,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The body shapes held in flight (#3428): tuck, pike, layout, straddle and
 * the twisting arm sets, each a layer laid over a jump's flight window, so
 * the flight pass (`HumanPerformanceFlight`) reads the composed shape and
 * turns the body by it: a tuck turns faster than a layout by the ratio of
 * their moments about the somersault axis.
 *
 * Each shape holds clinical joint angles for the channels it claims, set
 * over what the flight holds there; a goal the flight holds on a limb the
 * shape claims is moved to where the shape's joints put that limb's end
 * joint, since a held tuck is a joint shape and not a foot placed
 * somewhere, and a layer's weight moves a goal both postures hold but
 * keeps one only the base holds until the full weight drops it at once,
 * which would snap the limb mid-air. The positions are the gymnastic and diving
 * position names (tuck: hips and knees bent; pike: hips bent, knees
 * straight; layout: straight; straddle: legs apart), with angles that are
 * provisional: no rulebook or kinematic study was read for them.
 *
 * Schedule a shape over the flight as a windowed layer, from the jump's
 * `takeoff` to its `touchdown`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a shape is, why it is a layer, what it claims and drops, the positions' names and that the angles are provisional.
 * @evidence contracts/development/design.md#principled-representation One table of joint angles per shape and one layer that sets them, the form a held additive shape has.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shape names, their table and the layer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The turning is the flight pass's; a shape only shapes the body.
 */
export namespace HumanAirborneShape {
  /** The shape names, as data. */
  export const SHAPES = [
    "tuck",
    "pike",
    "layout",
    "straddle",
    "armsIn",
    "armsUp",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanAirborneShape.Shape>[];

  /** Each shape's clinical joint angles, degrees `[flexion, abduction, twist]` (provisional). */
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

  /**
   * A shape as a layer.
   *
   * @param shape The shape.
   * @returns The layer, named after the shape; it claims the legs or the arms it shapes and reads the person's body from its context.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the layer and what it claims.
   * @evidence contracts/development/implementation.md#principled-implementation The shape's joints are set over the posture's; a claimed limb's held goal is moved to the end joint the resolver poses for those joints, before the whole-body turn the goals are stated under, bending toward the middle joint's side of the limb's line (or as the goal bent, for a limb straight to rounding), so the layer's weight carries the goal continuously; a claimed limb with no goal is posed by the joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table read, one posture copy, and one pose for the held goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A shape claims only the limbs its table names, and never drops a held goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution and one pose per call, only when a claimed limb holds a goal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently; nothing is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer closes over one table entry.
   */
  export function layer(
    shape: IAutoMovieMotionHumanAirborneShape.Shape,
  ): IAutoMovieMotionHumanLayer {
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = ANGLES[shape];
    const legs: boolean = Object.keys(joints).some((b: string): boolean =>
      b.endsWith("Leg"),
    );
    const claimed: readonly IAutoMovieMotionHumanPosture.Limb[] = legs
      ? ["leftLeg", "rightLeg"]
      : ["leftArm", "rightArm"];
    return {
      name: shape,
      channels: [...claimed],
      apply: (
        posture: IAutoMovieMotionHumanPosture,
        _seconds: number,
        context: IAutoMovieMotionHumanLayer.IContext,
      ): IAutoMovieMotionHumanPosture => {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        for (const limb of claimed) delete limbs[limb];
        const shaped: IAutoMovieMotionHumanPosture = {
          ...posture,
          joints: { ...posture.joints, ...joints },
          limbs,
        };
        const held: IAutoMovieMotionHumanPosture.Limb[] = claimed.filter(
          (limb: IAutoMovieMotionHumanPosture.Limb): boolean =>
            posture.limbs[limb] !== undefined,
        );
        if (held.length === 0) return shaped;

        // A held goal goes where the shape's joints put the end joint, posed
        // before the whole-body turn the goals are stated under, so a
        // fading layer moves the goal there and never drops it mid-air.
        const still: IAutoMovieMotionHumanPosture = { ...shaped };
        delete still.rotation;
        const bones: ReadonlyMap<
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone
        > = poseBones(context.body, resolveHumanPosture(context.body, still));
        const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
          bones.get(bone)!.worldPosition;
        for (const limb of held) {
          const [upper, middle, end] = CHAIN[limb];
          const top: IAutoMovieVector3 = at(upper);
          const axis: IAutoMovieVector3 = Vector3.subtract(at(end), top);
          const along: number =
            Vector3.dot(Vector3.subtract(at(middle), top), axis) /
            Vector3.dot(axis, axis);
          const out: IAutoMovieVector3 = Vector3.subtract(
            at(middle),
            Vector3.add(top, Vector3.scale(axis, along)),
          );
          const goal: IAutoMovieMotionHumanPosture.IGoal = posture.limbs[limb]!;
          limbs[limb] = {
            ...goal,
            point: at(end),
            bend:
              Vector3.length(out) >
              Math.sqrt(Number.EPSILON) * Vector3.length(axis)
                ? Vector3.add(at(middle), out)
                : goal.bend,
          };
        }
        return { ...shaped, limbs };
      },
    };
  }

  /** Each limb's upper, middle and end joints' bones. */
  const CHAIN: Readonly<
    Record<
      IAutoMovieMotionHumanPosture.Limb,
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
