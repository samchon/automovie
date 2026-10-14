import {
  IAutoMovieActionSynthesizer,
  IAutoMovieActorContext,
  compilePerformance,
  makeActorSynthesizer,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

const actorAt: (
  skeleton: string,
  position: IAutoMovieVector3,
  facingDeg: number,
) => IAutoMovieActorContext = (
  skeleton: string,
  position: IAutoMovieVector3,
  facingDeg: number,
): IAutoMovieActorContext => ({
  skeleton,
  gaits: [WALK],
  position,
  speed: 1,
  facingDeg,
  eyeHeight: 1.6,
  restPose: makePose([joint("spine", { flexion: 0 })]),
});

const bonesOf: (motion: IAutoMovieMotion) => Set<string> = (
  motion: IAutoMovieMotion,
): Set<string> =>
  new Set<string>(
    motion.keyframes.flatMap((k: IAutoMovieKeyframe): string[] =>
      k.pose.joints.map((j: IAutoMovieJointPose): string => j.bone),
    ),
  );

const hasExpression: (motion: IAutoMovieMotion) => boolean = (
  motion: IAutoMovieMotion,
): boolean =>
  motion.keyframes.some(
    (k: IAutoMovieKeyframe): boolean => k.expression !== null,
  );

/**
 * Observe a two-actor beat through the actual actor synthesizer and performance compiler: hero receives locomote/lookAt/emote actions, while guard receives lookAt/emote. This is portable composition of core semantics, not whole-engine or rendered-scene acceptance.
 *
 * Scenarios:
 *
 * 1. The five original actions produce exactly guard and hero performance entries.
 * 2. Hero's union of authored keyframe bones contains leftUpperLeg/head, at least one keyframe has an expression and the performance duration is 5.
 * 3. Guard's union contains head without leftUpperLeg and at least one keyframe has an expression.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles the original multi-actor action list with makeActorSynthesizer and checks actor entries, bone-channel presence, expression presence and hero duration. Dropping an actor, locomotion channel, gaze channel or every expression breaks these outputs.
 * @evidence contracts/testing.md#independent-expectations Literal actor ids, bone membership and duration 5 come from the authored beat, one-metre-per-second context and five-second gaze/face spans, with unchanged nclose tolerance. Bone sets union all keyframes and expression checks use some, so they do not prove simultaneous channel activity, exact presets/intensities, travel distance, held root position or gaze angles; duration alone cannot isolate locomotion timing from the other five-second actions.
 * @evidence contracts/testing.md#distinguishing-cases Retains hero's three actions versus guard's two, different skeleton identities/positions/facings and no guard locomotion, preserving all five actions and values. Single-verb geometry, overlap admission, per-frame continuity and final-shot rendering are covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns synthesizer construction, compilePerformance and output assertions; local readers only inspect returned keyframes. It registers no cases dynamically and starts no browser, GPU or native artifact.
 */
export function test_perform_scene(): void {
  const contexts: Map<string, IAutoMovieActorContext> = new Map<
    string,
    IAutoMovieActorContext
  >([
    ["hero", actorAt("hero-rig", { x: 0, y: 0, z: 0 }, 0)],
    ["guard", actorAt("guard-rig", { x: 0, y: 0, z: 5 }, 180)],
  ]);
  const nodes: Map<string, IAutoMovieVector3> = new Map<
    string,
    IAutoMovieVector3
  >([
    ["hero", { x: 0, y: 0, z: 0 }],
    ["guard", { x: 0, y: 0, z: 5 }],
  ]);
  const synth: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    contexts,
    nodes,
  );

  const actions: IAutoMovieActionCall[] = [
    {
      verb: "locomote",
      gait: "walk",
      to: { kind: "node", node: "guard" },
      actor: "hero",
      start: 0,
      duration: "auto",
    },
    {
      verb: "lookAt",
      to: { kind: "node", node: "guard" },
      actor: "hero",
      start: 0,
      duration: 5,
    },
    {
      verb: "emote",
      preset: "happy",
      intensity: 0.9,
      actor: "hero",
      start: 0,
      duration: 5,
    },
    {
      verb: "lookAt",
      to: { kind: "node", node: "hero" },
      actor: "guard",
      start: 0,
      duration: 5,
    },
    {
      verb: "emote",
      preset: "angry",
      intensity: 0.8,
      actor: "guard",
      start: 0,
      duration: 5,
    },
  ];

  const perf: ReturnType<typeof compilePerformance>["performances"] =
    compilePerformance(actions, synth).performances;

  TestValidator.equals(
    "both actors are performed",
    Object.keys(perf).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    ["guard", "hero"],
  );

  // Hero has leg/head content somewhere in the compiled keyframes and at least
  // one expression; the following readers do not compare simultaneous samples.
  const heroBones: Set<string> = bonesOf(perf.hero!);
  TestValidator.equals(
    "hero performance contains walking-leg and head channels",
    namedFacts([
      [
        "heroBonesHasLeftUpperLeg",
        (): boolean => heroBones.has("leftUpperLeg"),
      ],
      ["heroBonesHasHead", (): boolean => heroBones.has("head")],
    ]),
    { heroBonesHasLeftUpperLeg: true, heroBonesHasHead: true },
  );
  TestValidator.predicate(
    "hero carries an expression",
    hasExpression(perf.hero!),
  );
  TestValidator.predicate(
    "hero performance spans five seconds",
    nclose(perf.hero!.duration, 5),
  );

  // Guard has head content and an expression, without the walking leg channel.
  const guardBones: Set<string> = bonesOf(perf.guard!);
  TestValidator.predicate(
    "guard performance contains a head channel",
    guardBones.has("head"),
  );
  TestValidator.predicate(
    "guard does not walk (no leg drive)",
    !guardBones.has("leftUpperLeg"),
  );
  TestValidator.predicate(
    "guard carries an expression",
    hasExpression(perf.guard!),
  );
}
