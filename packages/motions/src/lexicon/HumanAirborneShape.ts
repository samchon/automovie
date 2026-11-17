import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
  ] as const;

  /**
   * One of the supported named flight joint sets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation SHAPES enumerates tuck, pike, layout, straddle and two arm arrangements; their units and provisional angles belong to ANGLES.
   * @evidence contracts/development/design.md#principled-representation A closed literal union selects existing joint-shape content without supplying an alternate solver or target representation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The layer accepts exactly these names and reads their corresponding ANGLES entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No body-specific selector, runtime cache key, tolerance or optional mode is added.
   */
  export type Shape = (typeof SHAPES)[number];

  /** Each shape's clinical joint angles, degrees `[flexion, abduction, twist]` (provisional). */
  export const ANGLES: Readonly<
    Record<
      Shape,
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare fixed per-chain/union demands once; each application collects held goals, selects their actual source frames and resolves through the original canonical owner. The same fresh shaped limb map receives point/pole requests while every other original goal field stays present, then its already owned posture is returned.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Claims only the table's limbs and preserves held goal rotation, reference, contact, planting and external constraints. An achieved point alone never certifies the later complete IK objective, and no fade, authored angle, sample or acceptance bound changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms K held goals demand exactly 3K chain frames/ancestry for K in {1,2}, with complete direct-joint admission. Per-chain/union sets and genuine fixed-name readers prepare membership/lookup/sorting once per unchanged body. The original dependency selector retains digit/attachment/reference/unsupported full fallback; K=0 requests no source solve/FK. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed shape/chain demand is shared; each actual body owns only its genuine static name readers. Explicit parent FK/projector loans share exact FK prerequisites/static ROM metadata across actual source resolution, fresh requested frames and parent consumers; every changed joint/dependency still resolves normally. Each chain frame supplies its point/pole construction once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer retains one table entry, two limbs and three fixed sets naming six distinct bones. A weak body key owns at most three bounded static demand readers, with no raw pose, query time, result or workspace. Local getter/source pose/fresh frames release on return/throw; FK/projector loans stay synchronous and K=0 demands neither lazy loan.
   */
  export function layer(shape: Shape): IHumanLayer {
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = ANGLES[shape];
    const legs: boolean = Object.keys(joints).some((b: string): boolean =>
      b.endsWith("Leg"),
    );
    const claimed: readonly IHumanPosture.Limb[] = legs
      ? ["leftLeg", "rightLeg"]
      : ["leftArm", "rightArm"];
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    const demands: Partial<Record<IHumanPosture.Limb, ReadonlySet<AutoMovieHumanoidBone>>> = {};
    for (const limb of claimed) {
      const chain: Set<AutoMovieHumanoidBone> = new Set(CHAIN[limb]);
      demands[limb] = chain;
      for (const bone of chain) requested.add(bone);
    }
    const readers: WeakMap<IHumanBody, Map<ReadonlySet<AutoMovieHumanoidBone>, ReturnType<typeof poseBones.prepare>>> = new WeakMap();
    return {
      name: shape,
      channels: [...claimed],
      apply: (
        posture: IHumanPosture,
        _seconds: number,
        context: IHumanLayer.IContext,
      ): IHumanPosture => {
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        const held: IHumanPosture.Limb[] = [];
        for (const limb of claimed) {
          if (posture.limbs[limb] !== undefined) held.push(limb);
          delete limbs[limb];
        }
        const shaped: IHumanPosture = {
          ...posture,
          joints: { ...posture.joints, ...joints },
          limbs,
        };
        if (held.length === 0) return shaped;
        const observed: ReadonlySet<AutoMovieHumanoidBone> = held.length === claimed.length
          ? requested : demands[held[0]!]!;

        // A held goal goes where the shape's joints put the end joint, posed
        // before the whole-body turn the goals are stated under, so a
        // fading layer moves the goal there and never drops it mid-air.
        const still: IHumanPosture = { ...shaped };
        delete still.rotation;
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(context.resolution);
        const pose: IAutoMoviePose = resolveHumanPosture.seeded(
          context.body, still, undefined, undefined, resolution, observed,
          context.projection?.(),
        ).pose;
        let byDemand: Map<ReadonlySet<AutoMovieHumanoidBone>, ReturnType<typeof poseBones.prepare>> | undefined = readers.get(context.body);
        if (byDemand === undefined) {
          byDemand = new Map();
          readers.set(context.body, byDemand);
        }
        let readBones: ReturnType<typeof poseBones.prepare> | undefined = byDemand.get(observed);
        if (readBones === undefined) {
          readBones = poseBones.prepare(context.body, observed);
          byDemand.set(observed, readBones);
        }
        const bones: ReadonlyMap<
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone
        > = readBones(pose, resolution());
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
          const goal: IHumanPosture.IGoal = posture.limbs[limb]!;
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
        return shaped;
      },
    };
  }

  /** Each limb's upper, middle and end joints' bones. */
  const CHAIN: Readonly<
    Record<
      IHumanPosture.Limb,
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
