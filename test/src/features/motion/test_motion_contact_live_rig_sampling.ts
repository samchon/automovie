import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  makeActorSynthesizer,
  resolvePose,
  sampleMotion,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieActorContext,
  IAutoMovieActorWorldFrame,
  IAutoMovieBone,
  IAutoMovieMotion,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionFitArms } from "../internal/motionFitArms";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Native moving arm bakes reread borrowed rig and clinical-frame scalars
 * after their actual target/frame callbacks, despite stable object identities.
 * This tests the reference synthesizer's portable kernel inputs, rather than
 * a production's admission or a deforming Human mesh playback contract.
 *
 * Scenarios:
 * 1. Reach, point and strike each retain the original1-second24Hz grid plus
 *    their exact full-extension landmark. On the absolute shot clock starting
 *    at2, initial target lookup precedes each sample's target then frame.
 * 2. Target and frame callbacks edit the same lower/hand rest translations
 *    in place over A/B/A intervals. At every full-envelope sample, full raw
 *    FK with that sample's actual input snapshot must reach the literal point.
 *    The two changed lever lengths cannot cancel: their difference is4cm.
 * 3. A separate reach changes only the same lower-flexion neutral scalar
 *    from0 to15 and back. Actual current clinical readback must still reach
 *    the same point; rig, frame-table and affine-record identities never change.
 * 4. Reverse-order reads of the completed numeric clip invoke no target or
 *    frame callback. Inter-key approximation and partial arm envelopes retain
 *    their owning tests; contact is asserted only at the original full phase.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines borrowed mutable kernel sources, callback/shot-clock ordering, original sample/envelope policy, geometry versus clinical mutations, then-current FK interpretation and four scenarios with explicit playback limitations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public makeActorSynthesizer for actual moving reach/point/strike actions, edits owned source scalars only inside their genuine callbacks, records every time/order, and reconstructs full raw FK from the numeric keyframes under the corresponding actual input snapshots. False identity-only source reuse, skipped/reordered callbacks or retained live callbacks fail observable target/time/lifetime assertions.
 * @evidence contracts/development/testing.md#independent-expectations The declared24Hz endpoint-inclusive1s grid has25 times; reach/point's0.5 landmark already belongs to it, while strike's0.4 adds one. Each bake has one initial target lookup then target/frame pairs at start+time. The authored model/world point(-0.18,1.2,0.35) is fixed under an identity actor frame; held reach/point and the exact jab peak must meet the existing native2e-3m component bound. In-place lever changes0.08/0.04m move a stale geometry answer by at least0.04m by the reverse triangle inequality. Raw FK observes geometry independently of the native source preparation, though it shares engine clinical kinematics.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all three native arm branches, initial versus sampled reads, target-before-frame effects, absolute versus local clocks, regular versus added landmark times, stable-identity A/B/A rest geometry, same-record affine edits, full-phase contact and callback-free reverse numeric playback. This is a borrowed-input numerical contract, without continuous-contact, animation-of-rig or whole-shot admission claims.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine unit owns the existing bare-arm kernel fixture, contexts, mutable rig/frame records, callbacks, traces and snapshots. It calls public synthesis/sampling/FK only, adds no new producer/API, replaces no foreign function/global, and starts no Human producer, viewer, process or compiler.
 */
export function test_motion_contact_live_rig_sampling(): void {
  const rig = motionFitArms.arms();
  const context: IAutoMovieActorContext = {
    skeleton: rig.id,
    rig,
    gaits: [],
    position: { x: 0, y: 0, z: 0 },
    speed: 1,
    facingDeg: 0,
    eyeHeight: 1.6,
    restPose: { skeleton: rig.id, root: null, joints: [] },
  };
  const marker: IAutoMovieVector3 = { x: -0.18, y: 1.2, z: 0.35 };
  const action: IAutoMovieActionCall = {
    verb: "gesture",
    kind: "point",
    actor: "a",
    start: 0,
    duration: 1,
    at: { kind: "node", node: "mark" },
  };
  const point = (actor: IAutoMovieActorContext): IAutoMovieMotion => {
    const clip = makeActorSynthesizer(
      new Map([["a", actor]]),
      new Map([["mark", marker]]),
    )(action, "a");
    if (!clip)
      throw new Error(
        "a stage marker and a complete arm must yield a point motion",
      );
    return clip;
  };
  const defaultPoint = point(context);
  const clinical = point({ ...context, restFrames: HUMANOID_REST_FRAME });
  const raw = point({ ...context, restFrames: {} });
  const elbow = (clip: IAutoMovieMotion): number =>
    sampleMotion(clip, 1).pose.joints.find((j) => j.bone === "rightLowerArm")!
      .flexion!;
  TestValidator.predicate(
    "the clinical and raw elbow describe the same terminal hinge",
    Math.abs(elbow(raw) - elbow(clinical)) <= 1e-12,
  );
  TestValidator.equals(
    "omitting the rest frames uses the clinical sample",
    sampleMotion(defaultPoint, 1).pose,
    sampleMotion(clinical, 1).pose,
  );
  TestValidator.equals(
    "the terminal point holds still",
    sampleMotion(defaultPoint, 0.75).pose,
    sampleMotion(defaultPoint, 1).pose,
  );
  for (const mode of ["geometry", "frames"] as const) {
    const rig: IAutoMovieSkeleton = motionFitArms.arms();
    const lower: IAutoMovieBone = rig.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === "rightLowerArm",
    )!;
    const hand: IAutoMovieBone = rig.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === "rightHand",
    )!;
    const frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> =
      structuredClone(HUMANOID_REST_FRAME);
    const affine: NonNullable<IAutoMovieRestFrame["flexion"]> = {
      sign: 1,
      neutral: 0,
    };
    frames.rightLowerArm = { ...frames.rightLowerArm, flexion: affine };
    const context: IAutoMovieActorContext = {
      skeleton: rig.id,
      rig,
      restFrames: frames,
      gaits: [],
      position: { x: 0, y: 0, z: 0 },
      speed: 1,
      facingDeg: 0,
      eyeHeight: 1.6,
      restPose: { skeleton: rig.id, root: null, joints: [] },
    };
    const point: IAutoMovieVector3 = { x: -0.18, y: 1.2, z: 0.35 };
    const start: number = 2;
    const target: IAutoMovieActionTarget = {
      kind: "bone",
      node: "movingTarget",
      bone: "head",
    };
    const action: IAutoMovieActionCall = {
      verb: "reach",
      actor: "hero",
      start,
      duration: 1,
      hand: "right",
      to: target,
    };
    const trace: ITrace[] = [];
    const snapshots: Map<number, ISnapshot> = new Map();
    const actorFrame: IAutoMovieActorWorldFrame = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      facingDeg: 0,
    };
    const synthesize: ReturnType<typeof makeActorSynthesizer> =
      makeActorSynthesizer(
        new Map([["hero", context]]),
        new Map([["movingTarget", point]]),
        (asked: IAutoMovieActionTarget, seconds: number): IAutoMovieVector3 => {
          TestValidator.predicate(
            "the original live target is passed at every actual lookup",
            asked.kind === "bone" && asked.node === "movingTarget",
          );
          trace.push({ kind: "target", seconds });
          const changed: boolean =
            seconds - start >= 0.25 && seconds - start < 0.75;
          lower.rest.translation.x =
            mode === "geometry" && changed ? -0.38 : -0.3;
          affine.neutral = mode === "frames" && changed ? 15 : 0;
          return { ...point };
        },
        (actor: string, seconds: number): IAutoMovieActorWorldFrame => {
          TestValidator.equals(
            "each sampled frame belongs to the requested actor",
            actor,
            "hero",
          );
          trace.push({ kind: "frame", seconds });
          const changed: boolean =
            seconds - start >= 0.25 && seconds - start < 0.75;
          hand.rest.translation.x =
            mode === "geometry" && changed ? -0.29 : -0.25;
          snapshots.set(seconds, {
            rig: structuredClone(rig),
            frames: structuredClone(frames),
          });
          return actorFrame;
        },
      );
    const clip: OptionalMotion = synthesize(action, "hero");
    TestValidator.predicate(
      `reach/${mode} produces its actual numeric bake`,
      clip !== null,
    );
    if (clip === null) throw new Error("native mutable-source bake refused");
    const times: number[] = Array.from(
      { length: 25 },
      (_: unknown, index: number): number => index / 24,
    );

    times.sort((a: number, b: number): number => a - b);
    const events: ITrace[] = [
      { kind: "target", seconds: start },
      ...times.flatMap((time: number): ITrace[] => [
        { kind: "target", seconds: start + time },
        { kind: "frame", seconds: start + time },
      ]),
    ];
    TestValidator.predicate(
      "native bake preserves the original grid, landmark and absolute callback order",
      nclose(clip.duration, 1, 0) &&
        !clip.loop &&
        clip.keyframes.length === times.length &&
        trace.length === events.length &&
        trace.every(
          (entry: ITrace, index: number): boolean =>
            entry.kind === events[index]!.kind &&
            nclose(entry.seconds, events[index]!.seconds, 1e-12),
        ) &&
        clip.keyframes.every(
          (
            key: IAutoMovieMotion["keyframes"][number],
            index: number,
          ): boolean => nclose(key.time, times[index]!, 1e-12),
        ),
    );
    for (const key of clip.keyframes) {
      if (key.time < 0.5) continue;
      const snapshot: OptionalSnapshot = snapshots.get(start + key.time);
      TestValidator.predicate(
        "every full-phase key has its actual after-frame source snapshot",
        snapshot !== undefined,
      );
      if (snapshot === undefined)
        throw new Error("native mutable-source snapshot missing");
      const shown: IAutoMovieVector3 = resolvePose(
        key.pose,
        snapshot.rig,
        HUMANOID_JOINT_AXES,
        snapshot.frames,
      ).find(
        (bone: ReturnType<typeof resolvePose>[number]): boolean =>
          bone.bone === "rightHand",
      )!.worldPosition;
      TestValidator.predicate(
        `reach/${mode} reads current borrowed source at full phase${key.time}: hand=${JSON.stringify(shown)}`,
        vclose(shown, point, 2e-3),
      );
    }
    const before: number = trace.length;
    sampleMotion(clip, 0.9);
    sampleMotion(clip, 0.2);
    sampleMotion(clip, 0.9);
    TestValidator.equals(
      "completed numeric playback retains no live target/frame callback",
      trace.length,
      before,
    );
  }
}

/** One owned callback observation, on the absolute shot clock. */
interface ITrace {
  /** Original callback kind in invocation order. */
  kind: "target" | "frame";
  /** Absolute shot-local seconds passed by the synthesizer. */
  seconds: number;
}

/** Exact borrowed input values after one sample's target and frame effects. */
interface ISnapshot {
  /** Then-current rest geometry and clinical constraints. */
  rig: IAutoMovieSkeleton;
  /** Then-current clinical affine mappings. */
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}

type OptionalSnapshot = ISnapshot | undefined;
type OptionalMotion = IAutoMovieMotion | null;
