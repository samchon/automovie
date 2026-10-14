import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  IAutoMovieActionSynthesizer,
  IAutoMovieActorContext,
  makeActorSynthesizer,
  resolvePose,
  sampleMotion,
} from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieReachAction,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton, makePose } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

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
 * @evidence contracts/testing.md#behavioral-verification Calls the actual actor synthesizer, samples the held reach and resolves hand FK back into world space. Incorrect placement/facing inversion or a non-reaching canned pose breaks the target residual; unsupported-chain/target checks require null.
 * @evidence contracts/testing.md#independent-expectations Literal staged lever points and actor placement define the hand targets, with original vclose 2e-3 component tolerances, literal keyframe count/loop flag and nclose duration expectations. World reconstruction uses elementary Y rotation, but model FK and clinical tables are production helpers, so the oracle is not independent of all engine kinematics. Three keyframes alone do not assert every rest/extend/hold intermediate pose.
 * @evidence contracts/testing.md#distinguishing-cases Preserves off-origin actor placement, facings 0/90 with distinct reachable targets, absent rig, direction, absent right chain and auto duration. All original values/cases/order remain; dynamic tracking, ROM refusal and rendered contact belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns synthesis, sampling and FK calls through local fixture callbacks. The initial null predicate fails before its defensive return, and later non-null assertions fail naturally on absent clips; no dynamic registration, native artifact or viewer is needed.
 */
export function test_perform_reach_synthesis(): void {
  const lever: IAutoMovieVector3 = nodes.get("lever")!;

  const s0: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([["hero", ctx(0)]]),
    nodes,
  );
  const clip: IAutoMovieMotion | null = s0(reach(), "hero");
  TestValidator.predicate("reach produced a clip", clip !== null);
  if (clip === null) return;
  TestValidator.equals("rest → extend → hold", clip.keyframes.length, 3);
  TestValidator.equals("not looped", clip.loop, false);
  TestValidator.predicate("lasts the duration", nclose(clip.duration, 0.6));
  TestValidator.predicate(
    "the held hand lands on the world target (facing 0)",
    vclose(
      worldHand(sampleMotion(clip, 0.6).pose, 0, { x: 1, y: 0, z: 2 }),
      lever,
      2e-3,
    ),
  );

  const lever90: IAutoMovieVector3 = nodes.get("lever90")!;
  const s90: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([["hero", ctx(90)]]),
    nodes,
  );
  const turned: IAutoMovieMotion = s90(
    reach({ to: { kind: "node", node: "lever90" } }),
    "hero",
  )!;
  TestValidator.predicate(
    "the held hand lands on the world target (facing 90)",
    vclose(
      worldHand(sampleMotion(turned, 0.6).pose, 90, { x: 1, y: 0, z: 2 }),
      lever90,
      2e-3,
    ),
  );

  const rigless: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([
      ["hero", { ...ctx(0), rig: undefined }],
    ]),
    nodes,
  );
  TestValidator.equals("no rig, no reach", rigless(reach(), "hero"), null);
  TestValidator.equals(
    "a relative reach target → null",
    s0(reach({ to: { kind: "direction", headingDeg: 45 } }), "hero"),
    null,
  );
  TestValidator.equals(
    "a reach with no arm chain (right, no rightHand) → null",
    s0(reach({ hand: "right" }), "hero"),
    null,
  );
  const auto: IAutoMovieMotion | null = s0(reach({ duration: "auto" }), "hero");
  TestValidator.equals(
    "an auto-duration reach runs the default 0.6 s",
    namedFacts([
      ["auto", (): boolean => auto !== null],
      [
        "ncloseAutoDuration",
        (): boolean => auto !== null && nclose(auto.duration, 0.6),
      ],
    ]),
    { auto: true, ncloseAutoDuration: true },
  );
}
