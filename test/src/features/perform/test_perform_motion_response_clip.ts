import {
  makeActorSynthesizer,
  resolvePose,
  sampleMotion,
  validateMotion,
} from "@automovie/engine";
import type {
  IAutoMovieActorContext,
  IAutoMovieMotion,
  IAutoMovieReactAction,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton, makePose } from "../internal/fixtures";

/**
 * A generated balance response depends on the signal's amplitude, direction and rig.
 *
 * Scenarios:
 * 1. Larger and unbalanced inputs increase flexion while staying inside the rig limits.
 * 2. Mirrored signals produce opposite head displacements. A missing rig emits no clip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads generated clips, validation and resolved head positions.
 * @evidence contracts/development/testing.md#independent-expectations A reflected source must reflect displacement across the sagittal plane.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates timing, amplitude, sidedness and absent-rig admission.
 * @evidence contracts/development/testing.md#execution-ownership Uses one small authored skeleton.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the sampled response and directional twin.
 */
export function test_perform_motion_response_clip(): void {
  const rig = createSkeleton();
  const ctx: IAutoMovieActorContext = {
    skeleton: rig.id,
    rig,
    gaits: [],
    position: { x: 0, y: 0, z: 0 },
    speed: 1,
    facingDeg: 0,
    eyeHeight: 1.6,
    restPose: makePose([]),
  };
  const nodes = new Map<string, IAutoMovieVector3>([
    ["front", { x: 0, y: 0, z: 2 }],
    ["left", { x: 2, y: 0, z: 0 }],
    ["right", { x: -2, y: 0, z: 0 }],
  ]);
  const synth = makeActorSynthesizer(new Map([["actor", ctx]]), nodes);
  const signal = (
    force: number,
    node: string = "front",
    unbalance: boolean = false,
  ): IAutoMovieReactAction => ({
    verb: "react",
    actor: "actor",
    start: 0,
    duration: "auto",
    from: { kind: "node", node },
    force,
    unbalance,
  });
  const clip = (force: number, node?: string, unbalance?: boolean) =>
    synth(signal(force, node, unbalance), "actor")!;
  const peak = (motion: IAutoMovieMotion) =>
    Math.max(
      ...motion.keyframes.flatMap((k) =>
        k.pose.joints.map((j) => Math.abs(j.flexion ?? 0)),
      ),
    );
  const soft = clip(0.3),
    strong = clip(0.9);
  TestValidator.equals(
    "generated timing",
    [strong.keyframes.length, strong.duration, strong.loop],
    [3, 0.5, false],
  );
  TestValidator.predicate(
    "larger signal and unbalance increase amplitude",
    peak(strong) > peak(soft) &&
      peak(clip(0.6, "front", true)) > peak(clip(0.6)),
  );
  for (const motion of [soft, strong])
    TestValidator.equals(
      "rig-valid response",
      validateMotion({ motion, skeleton: rig }).success,
      true,
    );
  const read = (node: string) =>
    resolvePose(sampleMotion(clip(0.7, node), 0.16).pose, rig).find(
      (b) => b.bone === "head",
    )!.worldPosition.x;
  TestValidator.predicate(
    "mirrored displacements",
    read("left") < -0.01 && read("right") > 0.01,
  );
  const rigless = makeActorSynthesizer(
    new Map([["actor", { ...ctx, rig: undefined }]]),
    nodes,
  );
  TestValidator.equals("missing rig", rigless(signal(0.7), "actor"), null);
}
