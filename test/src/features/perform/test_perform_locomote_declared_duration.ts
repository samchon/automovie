import {
  IAutoMovieActorContext,
  compilePerformance,
  makeActorSynthesizer,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieGait,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** One second per cycle, so the natural sizing is countable by hand. */
const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [
    { bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 },
    { bone: "rightUpperLeg", phase: 0.5, duty: 0.5, amplitude: 25 },
  ],
};

/** 1 m/s over a 1 s cycle: the walk covers exactly one metre per stride. */
const HERO: IAutoMovieActorContext = {
  skeleton: "skeleton-1",
  gaits: [WALK],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0,
  eyeHeight: 1.6,
  restPose: makePose([joint("spine", { flexion: 0 })]),
};

/** Three metres straight ahead: three whole cycles, 3.0 s of natural walk. */
const EXIT: IAutoMovieVector3 = { x: 0, y: 0, z: 3 };

const NODES: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([
  ["hero", { x: 0, y: 0, z: 0 }],
  ["exit", EXIT],
]);

const synth: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
  new Map<string, IAutoMovieActorContext>([["hero", HERO]]),
  NODES,
);

const walkTo: (
  duration: number | "auto",
  start?: number,
) => IAutoMovieActionCall = (
  duration: number | "auto",
  start: number = 0,
): IAutoMovieActionCall => ({
  verb: "locomote",
  actor: "hero",
  gait: "walk",
  to: { kind: "node", node: "exit" },
  start,
  duration,
});

const stepInPlace: (duration: number | "auto") => IAutoMovieActionCall = (
  duration: number | "auto",
): IAutoMovieActionCall => ({
  verb: "locomote",
  actor: "hero",
  gait: "walk",
  // a relative target resolves to no point, so the gait steps where it stands
  to: { kind: "direction", headingDeg: 90 },
  start: 0,
  duration,
});

/** Where the travelling root ends up, in the actor's model space. */
const arrival: (motion: IAutoMovieMotion) => number = (
  motion: IAutoMovieMotion,
): number => {
  const last: IAutoMovieKeyframe =
    motion.keyframes[motion.keyframes.length - 1]!;
  return last.pose.root!.translation.z;
};

/**
 * Observe explicit locomotion duration controlling synthesized and compiled seconds without changing the authored destination. The unit inspects root endpoints and gait-cycle periods; no rendered cadence or previous-beat resumption runs here.
 *
 * The existing regression declares 7.5 seconds for a naturally three-second walk and places it at 2.5 seconds. Its expected final performance end is 10 rather than a natural-span substitution of 5.5; whole-shot overlap/anchor gates are outside this unit.
 *
 * The local one-second gait at 1 m/s and three-metre destination independently give three natural cycles. Explicit time scaling changes the observed cycle period; the natural-duration full-motion twin is a metamorphic preservation check, not an independent synthesis oracle.
 *
 * Scenarios:
 *
 * 1. The reproduction: `start: 2.5`, `duration: 7.5`, a target 3.0 s away at the
 *    gait's speed. The clip spans 7.5 s and the compiled performance ends at
 *    10.0 s, where it used to end at 5.5 s (2.5 + the substituted 3.0).
 * 2. The fit changes the cadence, NOT the path: the declared walk arrives at the
 *    same three metres the auto walk arrives at, and its `gaitCycle.period`
 *    scales with the clip (1 s → 2.5 s) so the recorded stride phase a later
 *    beat resumes from stays honest.
 * 3. `"auto"` keeps its meaning exactly: the same action sized by the engine still
 *    compiles the natural 3.0 s of three whole cycles.
 * 4. A quicker span works the same way in the other direction (1.5 s, half the
 *    natural), so the fit is not a one-sided "extend".
 * 5. The boundary: a declared duration equal to the natural one is a no-op, which
 *    is what makes the fit a scale rather than a rewrite.
 * 6. The step-in-place arms take the span too: a relative target (no resolvable
 *    point) and a destination the actor already stands on both honour an
 *    explicit duration, and both keep the single natural cycle under `"auto"`.
 *
 * @evidence contracts/testing.md#behavioral-verification Synthesizes long/auto/quick/natural-duration walks, compiles the offset long walk and observes final span, destination Z and cycle periods; relative and already-there targets must also honor explicit versus auto duration.
 * @evidence contracts/testing.md#independent-expectations Three metres at 1 m/s gives natural duration 3, scaling to 7.5 gives period 2.5 and scaling to 1.5 gives period 0.5. Literal destinations, 2.5+7.5=10 and in-place periods independently bound outputs. Existing test12ValuesClose keeps exact plain-field/finite numeric equivalence for the natural-duration twin with eps0 and no prototype/NaN/signed-zero claim.
 * @evidence contracts/testing.md#distinguishing-cases Retains longer/shorter/equal/auto spans, nonzero action start, root destination and period metadata, relative targets and already-there points. Invalid duration admission, rendered cadence and actual subsequent-beat phase resumption have separate owners.
 * @evidence contracts/testing.md#execution-ownership Module fixtures construct the existing reference callback once; this named synchronous body owns every actual synthesis and compile invocation. Local action/arrival readers register no extra cases and start no viewer, process or native artifact.
 */
export function test_perform_locomote_declared_duration(): void {
  // 1. the reproduction.
  const declared: IAutoMovieMotion = synth(walkTo(7.5, 2.5), "hero")!;
  TestValidator.predicate(
    "an explicit duration is the clip's span",
    nclose(declared.duration, 7.5),
  );
  const compiled: IAutoMovieMotion = compilePerformance(
    [walkTo(7.5, 2.5)],
    synth,
  ).performances.hero!;
  TestValidator.predicate(
    "the compiled performance ends at start + the declared duration",
    nclose(compiled.duration, 10),
  );

  // 2. same path, same arrival, different cadence.
  const auto: IAutoMovieMotion = synth(walkTo("auto"), "hero")!;
  TestValidator.equals(
    "fitting the span does not move where the walk arrives",
    namedFacts([
      ["ncloseArrivalDeclared", (): boolean => nclose(arrival(declared), 3)],
      ["ncloseArrivalAuto", (): boolean => nclose(arrival(auto), 3)],
    ]),
    { ncloseArrivalDeclared: true, ncloseArrivalAuto: true },
  );
  TestValidator.equals(
    "the gait cycle scales with the clip, so the stride phase stays honest",
    namedFacts([
      ["ncloseAutoGaitCycle", (): boolean => nclose(auto.gaitCycle!.period, 1)],
      [
        "ncloseDeclaredGaitCycle",
        (): boolean => nclose(declared.gaitCycle!.period, 2.5),
      ],
    ]),
    { ncloseAutoGaitCycle: true, ncloseDeclaredGaitCycle: true },
  );

  // 3. "auto" is untouched: the engine's own sizing, three whole cycles.
  TestValidator.predicate(
    "an auto duration still compiles the natural walk",
    nclose(auto.duration, 3),
  );

  // 4. the other direction: a span shorter than the natural one.
  const quick: IAutoMovieMotion = synth(walkTo(1.5), "hero")!;
  TestValidator.equals(
    "a shorter declared span compresses the same walk",
    namedFacts([
      ["ncloseQuickDuration", (): boolean => nclose(quick.duration, 1.5)],
      ["ncloseArrivalQuick", (): boolean => nclose(arrival(quick), 3)],
      [
        "ncloseQuickGaitCycle",
        (): boolean => nclose(quick.gaitCycle!.period, 0.5),
      ],
    ]),
    {
      ncloseQuickDuration: true,
      ncloseArrivalQuick: true,
      ncloseQuickGaitCycle: true,
    },
  );

  // 5. the boundary: declaring exactly the natural duration changes nothing.
  TestValidator.predicate(
    "declaring the natural duration is a no-op",
    test12ValuesClose(synth(walkTo(3), "hero"), auto),
  );

  // 6. the step-in-place arms honour the span as well.
  const stepping: IAutoMovieMotion = synth(stepInPlace(4), "hero")!;
  TestValidator.equals(
    "a relative target steps in place for the declared span",
    namedFacts([
      ["ncloseSteppingDuration", (): boolean => nclose(stepping.duration, 4)],
      [
        "ncloseSynthStepInPlace",
        (): boolean => nclose(synth(stepInPlace("auto"), "hero")!.duration, 1),
      ],
    ]),
    { ncloseSteppingDuration: true, ncloseSynthStepInPlace: true },
  );
  const standingStill: IAutoMovieActionCall = {
    verb: "locomote",
    actor: "hero",
    gait: "walk",
    to: { kind: "point", point: HERO.position },
    start: 0,
    duration: 4,
  };
  TestValidator.equals(
    "a destination the actor already stands on honours the span too",
    namedFacts([
      [
        "ncloseSynthStandingStill",
        (): boolean => nclose(synth(standingStill, "hero")!.duration, 4),
      ],
      [
        "ncloseSynthStandingStill2",
        (): boolean =>
          nclose(
            synth({ ...standingStill, duration: "auto" }, "hero")!.duration,
            1,
          ),
      ],
    ]),
    { ncloseSynthStandingStill: true, ncloseSynthStandingStill2: true },
  );
}
