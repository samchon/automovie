import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  makeActorSynthesizer,
  resolvePose,
  sampleMotion,
} from "@automovie/engine";
import {
  type IAutoMovieActionSynthesizer,
  type IAutoMovieActorContext,
  IAutoMovieMotion,
  IAutoMovieReachAction,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton, makePose } from "../../../../features/internal/fixtures";
import { nclose, vclose } from "../../../../features/internal/predicates";

const ctx: (facingDeg: number) => IAutoMovieActorContext = (
  facingDeg: number,
): IAutoMovieActorContext => ({
  skeleton: "skeleton-1",
  gaits: [],
  position: { x: 1, y: 0, z: 2 }, // placed away from the origin
  speed: 1,
  facingDeg,
  eyeHeight: 1.6,
  restPose: makePose([]),
  rig: createSkeleton(),
});

// Each lever is placed so its model-space image (after undoing the actor's
// facing) sits inside the 0.55 m arm reach for that facing: a fixed world
// point maps to a different arm distance as the actor turns.
const nodes: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([
  ["lever", { x: 1.35, y: 1.2, z: 2.25 }], // reachable facing 0
  ["lever90", { x: 1.2, y: 1.3, z: 1.7 }], // reachable facing 90
]);

const reach: (
  overrides?: Partial<IAutoMovieReachAction>,
) => IAutoMovieReachAction = (
  overrides: Partial<IAutoMovieReachAction> = {},
): IAutoMovieReachAction => ({
  verb: "reach",
  actor: "hero",
  start: 0,
  duration: 0.6,
  hand: "left",
  to: { kind: "node", node: "lever" },
  ...overrides,
});

/**
 * Read the sampled left hand through humanoid clinical axes/rest frames, then rotate by actor facing about Y and add the literal placement. Contexts deliberately omit restFrames; the reach producer's default is the matching clinical frame. This numerical FK observation shares production kinematics, and does not render a hand.
 */
const worldHand: (
  pose: ReturnType<typeof sampleMotion>["pose"],
  facingDeg: number,
  position: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  pose: ReturnType<typeof sampleMotion>["pose"],
  facingDeg: number,
  position: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const model: IAutoMovieVector3 = resolvePose(
    pose,
    createSkeleton(),
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  ).find(
    (b: ReturnType<typeof resolvePose>[number]): boolean =>
      b.bone === "leftHand",
  )!.worldPosition;
  const f: number = (facingDeg * Math.PI) / 180;
  const cos: number = Math.cos(f);
  const sin: number = Math.sin(f);
  // model → world: rotate by +facing about Y, then translate by position
  return {
    x: position.x + (model.x * cos + model.z * sin),
    y: position.y + model.y,
    z: position.z + (-model.x * sin + model.z * cos),
  };
};

/**
 * Observe static reach synthesis from world targets through model-space IK and sampled hand FK for a placed actor with two facings.
 *
 * Scenarios:
 *
 * 1. Facing 0 yields three keyframes, no loop, duration 0.6 and a held hand within 2e-3 of lever.
 * 2. Facing 90 reaches the separate lever90 world point within 2e-3 after placement/facing reconstruction.
 * 3. Missing rig, direction target and missing right-hand chain return null; auto duration returns a clip lasting the default 0.6.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual actor synthesizer, samples the held reach and resolves hand FK back into world space. Incorrect placement/facing inversion or a non-reaching canned pose breaks the target residual; unsupported-chain/target checks require null.
 * @evidence contracts/development/testing.md#independent-expectations Literal staged lever points and actor placement define the hand targets, with original vclose 2e-3 component tolerances, literal keyframe count/loop flag and nclose duration expectations. World reconstruction uses elementary Y rotation, but model FK and clinical tables are production helpers, so the oracle is not independent of all engine kinematics. Three keyframes alone do not assert every rest/extend/hold intermediate pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves off-origin actor placement, facings 0/90 with distinct reachable targets, absent rig, direction, absent right chain and auto duration. All original values/cases/order remain; dynamic tracking, ROM refusal and rendered contact belong elsewhere.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous entry owns synthesis, sampling and FK calls through local fixture callbacks. The initial null predicate fails before its defensive return, and later non-null assertions fail naturally on absent clips; no dynamic registration, native artifact or viewer is needed.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Facing 0 yields three keyframes, no loop, duration 0.6 and a held hand within 2e-3 of lever.).
 */
export function test_motion_contact_world_reach(): void {
  for (const [facing, node] of [
    [0, "lever"],
    [90, "lever90"],
  ] as const) {
    const actor: IAutoMovieActorContext = ctx(facing);
    const synth: IAutoMovieActionSynthesizer = makeActorSynthesizer(
      new Map([["hero", actor]]),
      nodes,
    );
    const source: IAutoMovieReachAction = reach({
      to: { kind: "node", node },
      duration: "auto",
    });
    const clip: OptionalMotion = synth(source, "hero");
    if (clip === null)
      throw new Error("A reachable stage marker produced no motion");
    TestValidator.predicate(
      "automatic duration and terminal hold",
      !clip.loop && nclose(clip.duration, 0.6) && clip.keyframes.length === 3,
    );
    for (const time of [clip.keyframes[1]!.time, clip.duration]) {
      const displayed = worldHand(
        sampleMotion(clip, time).pose,
        facing,
        actor.position,
      );
      TestValidator.predicate(
        "displayed hand reaches " + node + " at " + time,
        vclose(displayed, nodes.get(node)!, 0.002),
      );
    }
    if (facing !== 0) continue;
    TestValidator.equals(
      "a directional target provides no endpoint",
      synth(reach({ to: { kind: "direction", headingDeg: 45 } }), "hero"),
      null,
    );
    TestValidator.equals(
      "a missing limb cannot reach",
      synth(reach({ hand: "right" }), "hero"),
      null,
    );
    const missing = makeActorSynthesizer(
      new Map([["hero", { ...actor, rig: undefined }]]),
      nodes,
    );
    TestValidator.equals(
      "a missing rig cannot reach",
      missing(source, "hero"),
      null,
    );
  }
}
/** A request may be unavailable on the given skeleton. */
type OptionalMotion = IAutoMovieMotion | null;
