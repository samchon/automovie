import {
  IAutoMovieActorContext,
  IAutoMovieActionSynthesizer,
  makeActorSynthesizer,
  resolvePose,
  sampleMotion,
  validateMotion,
} from "@automovie/engine";
import { IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMovieReactAction, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const baseCtx: IAutoMovieActorContext = {
  skeleton: "skeleton-1",
  gaits: [],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0, // faces +Z
  eyeHeight: 1.6,
  restPose: makePose([]),
  rig: createSkeleton(),
};

const nodes: Map<string, IAutoMovieVector3> = new Map<string, IAutoMovieVector3>([
  ["attacker", { x: 0, y: 0, z: 2 }], // dead ahead of the actor (+Z)
]);

const react: (force: number, overrides?: Partial<IAutoMovieReactAction>) => IAutoMovieReactAction = (
  force: number,
  overrides: Partial<IAutoMovieReactAction> = {},
): IAutoMovieReactAction => ({
  verb: "react",
  actor: "hero",
  start: 0,
  duration: 0.5,
  from: { kind: "node", node: "attacker" },
  force,
  ...overrides,
});

/** Largest absolute flexion across a clip's keyframes. */
const peakFlexion: (motion: IAutoMovieMotion | null) => number = (motion: IAutoMovieMotion | null): number =>
  motion === null
    ? 0
    : Math.max(
        ...motion.keyframes.flatMap((k: IAutoMovieKeyframe): number[] =>
          k.pose.joints.map((j: IAutoMovieJointPose): number => Math.abs(j.flexion ?? 0)),
        ),
      );

/**
 * Observe the actor synthesizer's ROM-bounded recoil heuristic through authored keyframes, peak flexion, motion validation and side-hit head FK. This is a flinch policy rather than an integrated physical collision simulation.
 *
 * Scenarios:
 *
 * 1. Force 0.7 produces three keyframes, no loop, duration 0.5 and peak flexion above 1; sampled head flexion exceeds spine flexion at 0.16.
 * 2. Force 0.9 has greater peak flexion than 0.3, and both clips pass validateMotion.
 * 3. Force 0.6 with unbalance has greater peak flexion than the upright twin.
 * 4. Missing rig produces null.
 * 5. Auto duration is 0.5; unresolvable direction and coincident source each still produce peak flexion above 1.
 * 6. Mirrored side sources at X ±2 produce resolved head X below -0.01 and above 0.01 respectively at 0.16.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual react synthesis and checks clip shape, duration, relative amplitudes, production motion legality and side-hit FK direction. Reversed force/unbalance scaling, null fallbacks or a mirrored side sign contradict these outputs.
 * @evidence contracts/testing.md#independent-expectations Expected count 3, duration 0.5, amplitude ordering, nontrivial threshold 1 and signed FK thresholds ±0.01 derive from the stated recoil policy and literal geometry, with original nclose tolerance. Validation and FK share production ROM/kinematics; amplitude relations are not an independent physical impulse oracle, and the fallback checks prove nontrivial flexion rather than its exact direction.
 * @evidence contracts/testing.md#distinguishing-cases Keeps front-hit force levels, unbalance twin, missing rig, auto duration, non-positional/coincident source and mirrored side sources with all original values/order. Rest endpoint values, global force monotonicity, arbitrary facing and dynamic collision response are not asserted here.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns synthesis, sampling, validation and resolvePose; a local side callback throws on absent clip/head rather than skipping assertions. Module initialization allocates fixtures only and no viewer, native artifact or dynamic case registration is used.
 */
export function test_perform_react_synthesis(): void {
  const rig: IAutoMovieSkeleton = createSkeleton();
  const synth: IAutoMovieActionSynthesizer = makeActorSynthesizer(new Map<string, IAutoMovieActorContext>([["hero", baseCtx]]), nodes);

  const hit: IAutoMovieMotion | null = synth(react(0.7), "hero");
  TestValidator.predicate("react produced a clip", hit !== null);
  if (hit === null) return;
  TestValidator.equals("rest → flinch → rest", hit.keyframes.length, 3);
  TestValidator.equals("not looped", hit.loop, false);
  TestValidator.predicate("lasts the duration", nclose(hit.duration, 0.5));
  TestValidator.predicate("the flinch actually deflects", peakFlexion(hit) > 1);
  const mid: ReturnType<typeof sampleMotion> = sampleMotion(hit, 0.16);
  const headFlex: number = Math.abs(
    mid.pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === "head")?.flexion ?? 0,
  );
  const spineFlex: number = Math.abs(
    mid.pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === "spine")?.flexion ?? 0,
  );
  TestValidator.predicate(
    "the head whips more than the spine (falloff down the chain)",
    headFlex > spineFlex,
  );

  const soft: IAutoMovieMotion | null = synth(react(0.3), "hero");
  const hard: IAutoMovieMotion | null = synth(react(0.9), "hero");
  TestValidator.predicate(
    "force is monotone (0.9 flinches harder than 0.3)",
    peakFlexion(hard) > peakFlexion(soft),
  );
  TestValidator.equals(
    "soft flinch is ROM-legal",
    validateMotion({ motion: soft!, skeleton: rig }).success,
    true,
  );
  TestValidator.equals(
    "hard flinch is ROM-legal",
    validateMotion({ motion: hard!, skeleton: rig }).success,
    true,
  );

  const floored: IAutoMovieMotion | null = synth(react(0.6, { unbalance: true }), "hero");
  const upright: IAutoMovieMotion | null = synth(react(0.6), "hero");
  TestValidator.predicate(
    "an unbalancing blow flinches harder",
    peakFlexion(floored) > peakFlexion(upright),
  );

  const rigless: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([["hero", { ...baseCtx, rig: undefined }]]),
    nodes,
  );
  TestValidator.equals("no rig, no flinch", rigless(react(0.7), "hero"), null);

  // 5. totality of the decomposition
  const auto: IAutoMovieMotion | null = synth(react(0.5, { duration: "auto" }), "hero");
  TestValidator.equals(
    "auto duration runs the default 0.5 s",
    namedFacts([
      ["auto", (): boolean => auto !== null],
      ["ncloseAutoDuration", (): boolean => auto !== null && nclose(auto.duration, 0.5)],
    ]),
    { auto: true, ncloseAutoDuration: true },
  );
  const directional: IAutoMovieMotion | null = synth(
    react(0.7, { from: { kind: "direction", headingDeg: 90 } }),
    "hero",
  );
  TestValidator.predicate(
    "an unresolvable source still snaps the actor back",
    peakFlexion(directional) > 1,
  );
  const onTop: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([
      ["hero", { ...baseCtx, position: { x: 0, y: 0, z: 2 } }], // on the attacker
    ]),
    nodes,
  );
  TestValidator.predicate(
    "a source on the actor falls back to a straight flinch",
    peakFlexion(onTop(react(0.7), "hero")) > 1,
  );

  // 6. side hits lean away, proven through FK
  const sideNodes: Map<string, IAutoMovieVector3> = new Map<string, IAutoMovieVector3>([
    ["leftSource", { x: 2, y: 0, z: 0 }], // the actor's left (+X at facing 0)
    ["rightSource", { x: -2, y: 0, z: 0 }],
  ]);
  const sideSynth: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([["hero", baseCtx]]),
    sideNodes,
  );
  const headWorldX: (source: string) => number = (source: string): number => {
    const flinch: IAutoMovieMotion | null = sideSynth(
      react(0.8, { from: { kind: "node", node: source } }),
      "hero",
    );
    if (flinch === null) throw new Error("side react must synthesize");
    const peak: ReturnType<typeof sampleMotion> = sampleMotion(flinch, 0.16);
    const head: ReturnType<typeof resolvePose>[number] | undefined = resolvePose(peak.pose, rig).find((b: ReturnType<typeof resolvePose>[number]): boolean => b.bone === "head");
    if (head === undefined) throw new Error("head must resolve");
    return head.worldPosition.x;
  };
  TestValidator.predicate(
    "a blow from the actor's left leans the head away (toward −X)",
    -0.01 > headWorldX("leftSource"),
  );
  TestValidator.predicate(
    "the mirrored blow from the right leans the head toward +X",
    headWorldX("rightSource") > 0.01,
  );
}
