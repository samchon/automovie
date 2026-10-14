import {
  IAutoMovieActionCall,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveBeatEnd } from "../../../../packages/engine/src/film/resolveBeatEnd";
import { sampleMotion } from "../../../../packages/engine/src/motion/sampleMotion";
import { IAutoMovieActionSynthesizer } from "../../../../packages/engine/src/perform/IAutoMovieActionSynthesizer";
import { IAutoMovieActorContext } from "../../../../packages/engine/src/perform/IAutoMovieActorContext";
import { compilePerformance } from "../../../../packages/engine/src/perform/compilePerformance";
import { makeActorSynthesizer } from "../../../../packages/engine/src/perform/makeActorSynthesizer";
import { IDENTITY_TRANSFORM, joint, makePose } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

const ctx: IAutoMovieActorContext = {
  skeleton: "skeleton-1",
  gaits: [WALK],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0,
  eyeHeight: 1.6,
  restPose: makePose([joint("spine", { flexion: 0 })]),
};

const contexts: Map<string, IAutoMovieActorContext> = new Map<
  string,
  IAutoMovieActorContext
>([["hero", ctx]]);
const nodes: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([["door", { x: 0, y: 0, z: 5 }]]);

const locomote: IAutoMovieActionCall = {
  verb: "locomote",
  gait: "walk",
  to: { kind: "node", node: "door" },
  actor: "hero",
  start: 0,
  duration: "auto",
};

const lookAt: IAutoMovieActionCall = {
  verb: "lookAt",
  to: { kind: "node", node: "door" },
  actor: "hero",
  start: 0,
  duration: 1,
};

const gesture: IAutoMovieActionCall = {
  verb: "gesture",
  kind: "bow",
  actor: "hero",
  start: 0,
  duration: "auto",
};

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "hero",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

const shotOf: (motionId: string, duration: number) => IAutoMovieShot = (
  motionId: string,
  duration: number,
): IAutoMovieShot => ({
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: motionId, startOffset: 0 }],
  objectMotions: [],
  duration,
});

/**
 * Compiled locomotion carries a resumable cycle through composition and layering.
 *
 * Scenarios:
 * 1. Compile locomotion and read half-stride phase at 3.5 seconds.
 * 2. Compare the composite leg pose with the source cycle at that phase.
 * 3. Preserve the single cycle through locomotion/lookAt layering and return null for a gesture-only performance.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs makeActorSynthesizer, compilePerformance, resolveBeatEnd and sampleMotion, checking cycle metadata, phase and leg flexion consistency, catching a dropped clock in non-looping arranged or layered output.
 * @evidence contracts/testing.md#independent-expectations The authored one-second walk makes 3.5 seconds a .5-second phase. Comparing composite and source samples checks composition consistency with shared sampling, not independent gait geometry; gesture-only input declares no cycle.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes one locomotion region, layered locomotion/lookAt and noncyclic gesture, with an explicit phase resample; malformed carried scalars and period boundaries remain in gait_phase_degenerate.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns the portable synthesis/compile/snapshot composition. It does not call performShot itself or run the render ladder, browser or GPU.
 */
export function test_film_gait_phase_pipeline(): void {
  const synthesize: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    contexts,
    nodes,
  );

  const walking: Record<string, IAutoMovieMotion> = compilePerformance(
    [locomote],
    synthesize,
  ).performances;
  const hero: IAutoMovieMotion = walking["hero"]!;
  TestValidator.predicate(
    "the compiled composite carries the cycle",
    hero.gaitCycle !== undefined &&
      hero.gaitCycle !== null &&
      nclose(hero.gaitCycle.period, 1) &&
      nclose(hero.gaitCycle.phaseAt, 0),
  );

  const end: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(hero.id, 3.5),
    motions: [hero],
  });
  const heroEnd: IAutoMovieBeatEndActorState = end.actors.find(
    (a: IAutoMovieBeatEndActorState): boolean => a.node === "hero",
  )!;
  TestValidator.predicate(
    "resolveBeatEnd reads a live stride phase off the real ladder",
    (): boolean => heroEnd.gaitPhase !== null && nclose(heroEnd.gaitPhase, 0.5),
  );

  const atEnd: IAutoMoviePose = sampleMotion(hero, 3.5).pose;
  const cycleClip: IAutoMovieMotion = synthesize(locomote, "hero")!; // the travel composite
  const atPhase: IAutoMoviePose = sampleMotion(
    cycleClip,
    heroEnd.gaitPhase!,
  ).pose;
  const legAtEnd: IAutoMovieJointPose = atEnd.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftUpperLeg",
  )!;
  const legAtPhase: IAutoMovieJointPose = atPhase.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftUpperLeg",
  )!;
  TestValidator.predicate(
    "the carried phase re-samples to the same stride",
    nclose(legAtEnd.flexion ?? 0, legAtPhase.flexion ?? 0),
  );

  const layered: IAutoMovieMotion = compilePerformance(
    [locomote, lookAt],
    synthesize,
  ).performances["hero"]!;
  TestValidator.predicate(
    "layered regions keep the single striding clock",
    layered.gaitCycle !== undefined &&
      layered.gaitCycle !== null &&
      nclose(layered.gaitCycle.period, 1) &&
      nclose(layered.gaitCycle.phaseAt, 0),
  );

  const gestureOnly: IAutoMovieMotion = compilePerformance(
    [gesture],
    synthesize,
  ).performances["hero"]!;
  const gestureEnd: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(gestureOnly.id, 0.5),
    motions: [gestureOnly],
  });
  TestValidator.equals(
    "a gesture-only performance stays phase-null",
    gestureEnd.actors.find(
      (a: IAutoMovieBeatEndActorState): boolean => a.node === "hero",
    )!.gaitPhase,
    null,
  );
}
