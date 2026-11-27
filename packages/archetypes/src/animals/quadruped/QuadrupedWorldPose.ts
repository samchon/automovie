import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedSkeleton } from "../AutoMovieArchetypeQuadrupedSkeleton";
import { QuadrupedWorldPoseData } from "./internal/QuadrupedWorldPoseData";

/*
 * A quadruped's displayed pose as a world root frame and parent-local bone
 * rotations, the form an inertialized cut between two of its performances is
 * blended in.
 *
 * A performance of the shared quadruped body poses its 21 bars about fixed
 * parent-local attachments (`AutoMovieArchetypeQuadrupedSkeleton`), so its pose
 * at one second is the trunk's world frame and each bone's rotation relative to
 * its parent. `read` takes that pose from any emitted model and its placement;
 * `emit` lays a pose back onto the source animal through the same carriers,
 * under a chosen placement. `capture` and `blend` inertialize a cut between two
 * performances (Bollo, Inertialization: High-Performance Animation Transitions
 * in Gears of War, GDC 2018): at the cut the offset of the source from the
 * target and the offset's velocity are taken once, every rotation as a rotation
 * vector and the root translation per axis, and each decays to zero on the
 * engine's quintic (`inertializeOffset`), applied before the target, so the
 * displayed pose and its velocity are continuous at the cut and reach the
 * target at the decay's end. The full decay runs even for an offset already
 * heading to zero (`inertializeOffset`'s `through`): Bollo's overshoot clamp
 * would stop such a channel within milliseconds, a velocity step in all but
 * name, so the bounded follow-through is taken instead.
 * Parameter animal: The source animal in its neutral pose, never changed.
 * Parameter carriers: The bone carrying each non-bone part and each contact, as
 * `QuadrupedCarriage.of` gives them.
 * Returns: The prepared reader, emitter and blender.
 * When the animal lacks a bar of the shared quadruped
 * body.
 */
export function QuadrupedWorldPose<Id extends string, D extends string>(
  animal: AutoMovieArchetype<Id, D>,
  carriers: QuadrupedWorldPose.ICarriers,
): QuadrupedWorldPose.IPrepared<Id, D> {
  const rig: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone> =
    AutoMovieArchetypeQuadrupedSkeleton.of(animal);
  const neutral: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  > = AutoMovieEngineKinematics.prepareArticulatedRig(rig).read();
  const bones: readonly QuadrupedWorldPose.ILink[] = rig.bones.map(
    (
      bone: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>["bones"][number],
    ): QuadrupedWorldPose.ILink => ({
      bone: bone.bone,
      parent: bone.parent,
      attachment: { ...bone.rest.translation },
    }),
  );
  return { neutral, read, emit, capture, blend };

  /*
   * The trunk's world frame and every bone's rotation relative to its parent.
   */
  function read(
    model: AutoMovieArchetype<Id, D>,
    placement: IAutoMovieTransform,
  ): QuadrupedWorldPose.IPose {
    const local: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieQuaternion
    > = new Map();
    let root: IAutoMovieTransform | undefined;
    for (const bone of AutoMovieArchetypeQuadrupedSkeleton.of(model).bones)
      if (bone.parent === null)
        root = AutoMovieArchetypeFrame.compose(placement, bone.rest);
      else local.set(bone.bone, { ...bone.rest.rotation });
    return { root: root!, local };
  }

  /*
   * Lay a world pose on the source animal under a placement.
   */
  function emit(
    pose: QuadrupedWorldPose.IPose,
    placement: IAutoMovieTransform,
  ): AutoMovieArchetype<Id, D> {
    return AutoMovieArchetypeQuadrupedSkeleton.apply(
      animal,
      neutral,
      QuadrupedWorldPose.frames(bones, pose, placement),
      carriers.parts,
      carriers.contacts,
    );
  }

  /*
   * The offsets of a source from a target at a cut, with their rates.
   */
  function capture(
    source: QuadrupedWorldPose.IPose,
    sourceBefore: QuadrupedWorldPose.IPose,
    target: QuadrupedWorldPose.IPose,
    targetAfter: QuadrupedWorldPose.IPose,
    step: number,
  ): QuadrupedWorldPose.IOffset {
    const turn = (
      s: IAutoMovieQuaternion,
      s0: IAutoMovieQuaternion,
      t: IAutoMovieQuaternion,
      t1: IAutoMovieQuaternion,
    ): QuadrupedWorldPose.IChannel => {
      const ws: IAutoMovieVector3 = spin(s0, s);
      const wt: IAutoMovieVector3 = spin(t, t1);
      return {
        x: AutoMovieEngineMotionSampling.samplePoseVelocityRotationVector(
          AutoMovieEngineQuaternion.multiply(s, AutoMovieEngineQuaternion.inverse(t)),
        ),
        v: AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(ws, wt), 1 / step),
      };
    };
    const local: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      QuadrupedWorldPose.IChannel
    > = new Map();
    for (const [bone, rotation] of source.local)
      local.set(
        bone,
        turn(
          rotation,
          sourceBefore.local.get(bone)!,
          target.local.get(bone)!,
          targetAfter.local.get(bone)!,
        ),
      );
    return {
      shift: {
        x: AutoMovieEngineVector3.subtract(source.root.translation, target.root.translation),
        v: AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.subtract(
            AutoMovieEngineVector3.subtract(
              source.root.translation,
              sourceBefore.root.translation,
            ),
            AutoMovieEngineVector3.subtract(
              targetAfter.root.translation,
              target.root.translation,
            ),
          ),
          1 / step,
        ),
      },
      turn: turn(
        source.root.rotation,
        sourceBefore.root.rotation,
        target.root.rotation,
        targetAfter.root.rotation,
      ),
      local,
    };
  }

  /*
   * The target with the captured offsets decayed by the elapsed seconds.
   */
  function blend(
    offset: QuadrupedWorldPose.IOffset,
    duration: number,
    elapsed: number,
    target: QuadrupedWorldPose.IPose,
  ): QuadrupedWorldPose.IPose {
    const shift: IAutoMovieVector3 = decay(offset.shift, duration, elapsed);
    const local: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieQuaternion
    > = new Map();
    for (const [bone, rotation] of target.local) {
      const channel: QuadrupedWorldPose.IChannel | undefined =
        offset.local.get(bone);
      local.set(
        bone,
        channel === undefined
          ? rotation
          : AutoMovieEngineQuaternion.normalize(
              AutoMovieEngineQuaternion.multiply(
                exponent(decay(channel, duration, elapsed)),
                rotation,
              ),
            ),
      );
    }
    return {
      root: {
        translation: AutoMovieEngineVector3.add(target.root.translation, shift),
        rotation: AutoMovieEngineQuaternion.normalize(
          AutoMovieEngineQuaternion.multiply(
            exponent(decay(offset.turn, duration, elapsed)),
            target.root.rotation,
          ),
        ),
        scale: { ...target.root.scale },
      },
      local,
    };
  }
}

/*
 * Types and the forward kinematics of QuadrupedWorldPose.
 */
export namespace QuadrupedWorldPose {
  /*
   * One world axis.
   */
  export type Axis = "x" | "y" | "z";

  /*
   * The bone carrying each non-bone part and each contact.
   */
  export interface ICarriers {
    /*
     * Carrier bone by non-bone part id.
     */
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;

    /*
     * Carrier bone by contact id.
     */
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
  }

  /*
   * A bone, its parent and its fixed attachment in the parent's frame, metres.
   */
  export interface ILink {
    /*
     * The bone.
     */
    bone: AutoMovieArchetypeQuadrupedBody.Bone;

    /*
     * Its parent, null for the trunk.
     */
    parent: AutoMovieArchetypeQuadrupedBody.Bone | null;

    /*
     * Its joint origin in the parent's frame, metres.
     */
    attachment: IAutoMovieVector3;
  }

  /*
   * A displayed pose: the trunk's world frame and each other bone's rotation
   * relative to its parent.
   */
  export interface IPose {
    /*
     * The trunk's joint frame in the world, metres, unit scale.
     */
    root: IAutoMovieTransform;

    /*
     * Each non-trunk bone's rotation in its parent's frame.
     */
    local: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieQuaternion
    >;
  }

  /*
   * One channel's offset at a cut and the offset's rate, per world or parent
   * axis.
   */
  export interface IChannel {
    /*
     * Offset: metres for a translation, radians as a rotation vector for a
     * rotation.
     */
    x: IAutoMovieVector3;

    /*
     * Its rate per second.
     */
    v: IAutoMovieVector3;
  }

  /*
   * Every channel's offset at one cut.
   */
  export interface IOffset {
    /*
     * The root translation's offset.
     */
    shift: IChannel;

    /*
     * The root rotation's offset.
     */
    turn: IChannel;

    /*
     * Each bone's local rotation offset.
     */
    local: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, IChannel>;
  }

  /*
   * The prepared operations over one source animal.
   */
  export interface IPrepared<Id extends string, D extends string> {
    /*
     * The source's neutral model-space bone frames.
     */
    neutral: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >;

    /*
     * The world pose of an emitted model of this animal under its placement.
     */
    read: (
      model: AutoMovieArchetype<Id, D>,
      placement: IAutoMovieTransform,
    ) => IPose;

    /*
     * The source animal laid in a world pose, in the model space of a
     * placement.
     */
    emit: (
      pose: IPose,
      placement: IAutoMovieTransform,
    ) => AutoMovieArchetype<Id, D>;

    /*
     * The offsets of a source pose from a target pose at a cut, rates from
     * one-sided differences of `step` seconds: the source before the cut, the
     * target after it.
     */
    capture: (
      source: IPose,
      sourceBefore: IPose,
      target: IPose,
      targetAfter: IPose,
      step: number,
    ) => IOffset;

    /*
     * The target pose with the offsets decayed over `duration` seconds after
     * `elapsed` seconds.
     */
    blend: (
      offset: IOffset,
      duration: number,
      elapsed: number,
      target: IPose,
    ) => IPose;
  }

  /*
   * A placement carried across a cut from one root convention to another:
   * `from` at the cut's start to `to` at its end by minimum jerk, so the root
   * and its velocity stay continuous; a pose emitted in world space displays
   * the same under either.
   * Parameter from: The placement the cut leaves, at this second.
   * Parameter to: The placement the cut reaches, at this second.
   * Parameter share: The cut's elapsed share, clamped to [0, 1].
   * Returns: The carried placement.
   */
  export function bridge(
    from: IAutoMovieTransform,
    to: IAutoMovieTransform,
    share: number,
  ): IAutoMovieTransform {
    const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, share)));
    return {
      translation: AutoMovieEngineVector3.lerp(from.translation, to.translation, u),
      rotation: AutoMovieEngineQuaternion.slerp(from.rotation, to.rotation, u),
      scale: { ...to.scale },
    };
  }
  /*
   * Model-space bone frames of a world pose under a placement, parents first.
   * Parameter links: The bones in parent-first order with their attachments.
   * Parameter pose: The world pose.
   * Parameter placement: The placement whose model space the frames are in.
   * Returns: Every bone's model-space joint frame.
   */
  export function frames(
    links: readonly ILink[],
    pose: IPose,
    placement: IAutoMovieTransform,
  ): Map<AutoMovieArchetypeQuadrupedBody.Bone, IAutoMovieTransform> {
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      placement.rotation,
    );
    const result: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = new Map();
    for (const link of links) {
      if (link.parent === null) {
        result.set(link.bone, {
          translation: AutoMovieEngineQuaternion.rotateVector(
            inverse,
            AutoMovieEngineVector3.subtract(pose.root.translation, placement.translation),
          ),
          rotation: AutoMovieEngineQuaternion.multiply(inverse, pose.root.rotation),
          scale: { ...pose.root.scale },
        });
        continue;
      }
      const parent: IAutoMovieTransform = result.get(link.parent)!;
      result.set(link.bone, {
        translation: AutoMovieEngineVector3.add(
          parent.translation,
          AutoMovieEngineQuaternion.rotateVector(parent.rotation, link.attachment),
        ),
        rotation: AutoMovieEngineQuaternion.multiply(
          parent.rotation,
          pose.local.get(link.bone)!,
        ),
        scale: { ...AutoMovieArchetypeFrame.UNIT },
      });
    }
    return result;
  }
}

/*
 * The angular displacement from one rotation to a later one, as a rotation
 * vector.
 */
function spin(
  from: IAutoMovieQuaternion,
  to: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  return AutoMovieEngineMotionSampling.samplePoseVelocityRotationVector(
    AutoMovieEngineQuaternion.multiply(to, AutoMovieEngineQuaternion.inverse(from)),
  );
}

/*
 * A channel's decayed offset, per axis.
 */
function decay(
  channel: QuadrupedWorldPose.IChannel,
  duration: number,
  elapsed: number,
): IAutoMovieVector3 {
  const result: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const axis of QuadrupedWorldPoseData.AXES)
    result[axis] = AutoMovieEngineMotionSampling.inertializeOffset(
      channel.x[axis],
      channel.v[axis],
      duration,
      elapsed,
      true,
    ).value;
  return result;
}

/*
 * The rotation a rotation vector names.
 */
function exponent(turn: IAutoMovieVector3): IAutoMovieQuaternion {
  const angle: number = AutoMovieEngineVector3.length(turn);
  return angle < 1e-12
    ? AutoMovieEngineQuaternion.identity()
    : AutoMovieEngineQuaternion.fromAxisAngle(
        AutoMovieEngineVector3.scale(turn, 1 / angle),
        (angle * 180) / Math.PI,
      );
}
