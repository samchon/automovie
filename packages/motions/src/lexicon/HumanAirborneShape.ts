import { Vector3 } from "@automovie/engine";
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

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The claimed limbs' bone sets are built once per layer; each application sets the joints, resolves the shaped posture once for the held limbs' chains and moves each held goal's point and bend there, every other field of the goal kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Claims only the table's limbs and keeps a held goal's rotation, contact, planting and attachment; the angles are the table's provisional ones.
   * @evidence contracts/development/implementation.md#efficient-algorithms With no claimed limb holding a goal, no resolution; otherwise one posture resolution limited to the held chains' three bones each and their ancestors.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The bone sets depend on the shape alone and are shared by every application; the caller's forward-kinematics reader and range-of-motion projector serve the resolution.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer holds one table entry, its claimed limbs and three bone sets of at most six names; each application's resolution ends with it.
   */
  export function layer(shape: IAutoMovieMotionHumanAirborneShape.Shape): IAutoMovieMotionHumanLayer {
    return new NativeLayer(shape);
  }

  /**
   * Receive the projected joints and root during the same displayed evaluation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents which assembly is received and when the receiver may use it.
   * @evidence contracts/development/design.md#principled-representation The callback receives the resolver's assembled pose and joint rotations in their existing frames. The native blend supplies it from the current evaluation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanSegmentLayer uses this receiver to pass one live assembly to its leaf. The caller gives the receiver no independent pose inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback uses the resolver's assembly type without a widened payload or a validity flag.
   */
  export type Assembly = (direct: resolveHumanPostureSource.IAssembled) => void;

  /**
   * Apply a native shape at layer-local seconds and optionally lend the assembly used
   * to place its held goals. The context supplies the performing body and the weight
   * is the layer's blend fraction. The returned posture uses the input posture's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the timebase, blend weight, reading context, output frame and optional assembly receiver.
   * @evidence contracts/development/design.md#principled-representation Reuses the authored posture, layer context and resolver assembly contracts. Callable provenance is checked at runtime by prepared.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The airborne shape owns the callable. HumanSegmentLayer uses the four standard blend arguments and the optional receiver during its current evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The independent optional receiver does not change the input or result type and carries no fixture-specific branch.
   */
  export type ShapeBlend = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    context: IAutoMovieMotionHumanLayer.IContext,
    weight: number,
    assembly?: Assembly,
  ) => IAutoMovieMotionHumanPosture;

  /**
   * Read the original blend only for the layer that constructed it. Its private
   * callback can create an assembly only from the actual projected posture.
   * An external layer, wrapped function, changed property or proxy has no loan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies which native shape can lend its direct assembly and the ordinary fallback for foreign, wrapped or edited layers.
   * @evidence contracts/development/implementation.md#principled-implementation The constructor accepts only a shape name and creates its own blend. A private field establishes provenance and the current own data property must still name that exact function.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private-field admission precedes one own-property comparison; foreign layers and proxies are never inspected.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A caller cannot register a callback, supply a readiness flag, recover a stored pose, or pass a copied native callback as another layer.
   * @evidence contracts/development/implementation.md#efficient-algorithms The constant-time identity test allows the next leaf to fit its actual new goals on the same projected joints, avoiding one direct assembly per accepted evaluation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the exact factory blend can supply its actual authored posture and direct pose; the leaf verifies that same posture before the single fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner holds its own callable for its layer lifetime. The receiver and assembly remain on one displayed evaluation, with no global registry or history.
   */
  export function prepared(layer: IAutoMovieMotionHumanLayer): ShapeBlend | undefined {
    return NativeLayer.read(layer);
  }

  /** The definition returned by the native shape constructor. */
  interface IDefinition {
    channels: AutoMovieHumanLimb[];
    blend: ShapeBlend;
  }

  /** Each layer owns its actual callable; its constructor accepts only a shape name. */
  class NativeLayer implements IAutoMovieMotionHumanLayer {
    public readonly name: IAutoMovieMotionHumanAirborneShape.Shape;
    public readonly channels: AutoMovieHumanLimb[];
    public readonly blend: ShapeBlend;
    public readonly apply: IAutoMovieMotionHumanLayer["apply"];
    readonly #original: ShapeBlend;

    public constructor(shape: IAutoMovieMotionHumanAirborneShape.Shape) {
      const definition: IDefinition = build(shape);
      this.name = shape;
      this.channels = definition.channels;
      this.blend = definition.blend;
      this.#original = definition.blend;
      this.apply = (posture: IAutoMovieMotionHumanPosture, seconds: number, context: IAutoMovieMotionHumanLayer.IContext): IAutoMovieMotionHumanPosture =>
        definition.blend(posture, seconds, context, 1);
    }

    public static read(layer: IAutoMovieMotionHumanLayer): ShapeBlend | undefined {
      if (!(#original in layer)) return undefined;
      const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(layer, "blend");
      return field?.value === layer.#original ? layer.#original : undefined;
    }
  }

  /** Construct the clinical keys, demanded limb chains and their native blend. */
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
    const demands: Partial<Record<AutoMovieHumanLimb, ReadonlySet<AutoMovieHumanoidBone>>> = {};
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
      const reader: ReturnType<NonNullable<IAutoMovieMotionHumanLayer.IContext["resolution"]>> | undefined = held.length === 0 ? undefined : context.resolution?.();
      const projection: ReturnType<NonNullable<IAutoMovieMotionHumanLayer.IContext["projection"]>> | undefined = held.length === 0 ? undefined : context.projection?.();
      const local: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints, ...joints };
      // Fade in the body's clinical joint coordinates. A held endpoint follows
      // the joint arc below, including when the original foot came from IK.
      if (weight < 1) {
        const base: IAutoMoviePose | undefined = held.length === 0 ? undefined :
          resolveHumanPosture.seeded(context.body, posture, undefined, undefined, reader, requested, projection).pose;
        for (const limb of claimed) {
          for (const bone of CHAIN[limb]) {
            const to: readonly [number, number, number] | undefined = joints[bone];
            if (to === undefined) continue;
            const actual: IAutoMovieJointPose | undefined = base?.joints.find((joint: IAutoMovieJointPose): boolean => joint.bone === bone);
            const authored: readonly [number, number, number] | undefined = posture.joints[bone];
            const x: number = actual?.flexion ?? authored?.[0] ?? 0;
            const y: number = actual?.abduction ?? authored?.[1] ?? 0;
            const z: number = actual?.twist ?? authored?.[2] ?? 0;
            local[bone] = [x + weight * (to[0] - x), y + weight * (to[1] - y), z + weight * (to[2] - z)];
          }
        }
      }
      const shaped: IAutoMovieMotionHumanPosture = {
        ...posture,
        joints: local,
        limbs,
      };
      if (held.length === 0) return shaped;
      const observed: ReadonlySet<AutoMovieHumanoidBone> = held.length === claimed.length
        ? requested : demands[held[0]!]!;

      // A held goal goes where the shape's joints put the end joint, posed
      // before the whole-body turn the goals are stated under, so a
      // fading layer moves the goal there and never drops it mid-air.
      const still: IAutoMovieMotionHumanPosture = shaped.rotation === undefined ? shaped : { ...shaped };
      if (still !== shaped) delete still.rotation;
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(reader);
      // No limb or digit changes the direct pose here. Its root and joints
      // are also those of the final authored goals added to limbs below.
      const direct: resolveHumanPostureSource.IAssembled | undefined =
        assembly !== undefined && still === shaped && still.digits === undefined &&
        Object.keys(limbs).length === 0 && prepareHumanPoseResolution.isNativeSource(reader)
          ? resolveHumanPostureSource.assemble(context.body, still, undefined, projection) : undefined;
      const pose: IAutoMoviePose = direct?.pose ?? resolveHumanPosture.seeded(
        context.body, still, undefined, undefined, resolution, observed,
        projection,
      ).pose;
      const bones: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone
      > = poseBones(context.body, pose, resolution(), observed);
      const at: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        bones.get(bone)!.worldPosition;
      for (const limb of held) {
        const [upper, middle, end]: readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone, AutoMovieHumanoidBone] = CHAIN[limb];
        const top: IAutoMovieVector3 = at(upper);
        const joint: IAutoMovieVector3 = at(middle);
        const point: IAutoMovieVector3 = at(end);
        const axis: IAutoMovieVector3 = Vector3.subtract(point, top);
        const along: number =
          Vector3.dot(Vector3.subtract(joint, top), axis) /
          Vector3.dot(axis, axis);
        const out: IAutoMovieVector3 = Vector3.subtract(
          joint,
          Vector3.add(top, Vector3.scale(axis, along)),
        );
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[limb]!;
        limbs[limb] = {
          ...goal,
          point,
          bend:
            Vector3.length(out) >
            Math.sqrt(Number.EPSILON) * Vector3.length(axis)
              ? Vector3.add(joint, out)
              : goal.bend,
        };
      }
      if (direct !== undefined) assembly!(direct);
      return shaped;
    };
    return { channels: [...claimed], blend };
  }

  /** Each limb's upper, middle and end joints' bones. */
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
