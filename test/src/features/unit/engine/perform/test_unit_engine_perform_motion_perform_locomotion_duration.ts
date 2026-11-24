import { compilePerformance, makeActorSynthesizer } from "@automovie/engine";
import {
  IAutoMovieActionCall,
  type IAutoMovieActorContext,
  IAutoMovieGait,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";
import { test12ValuesClose } from "../../../internal/test12ValuesClose";

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
 */
export function test_unit_engine_perform_motion_perform_locomotion_duration(): void {
  const walk = (
    duration: IAutoMovieActionCall["duration"],
    start = 0,
  ): IAutoMovieActionCall => ({
    verb: "locomote",
    actor: "hero",
    gait: "walk",
    to: { kind: "node", node: "exit" },
    duration,
    start,
  });
  const natural = synth(walk("auto"), "hero")!;
  TestValidator.predicate(
    "three one-metre strides",
    natural.duration === 3 &&
      nclose(arrival(natural), 3) &&
      natural.gaitCycle!.period === 1,
  );
  for (const seconds of [1.5, 3, 7.5]) {
    const result = synth(walk(seconds), "hero")!;
    TestValidator.predicate(
      "time scaling preserves stride count and endpoint",
      nclose(result.duration, seconds) &&
        nclose(result.gaitCycle!.period, seconds / 3) &&
        nclose(arrival(result), 3),
    );
    if (seconds === 3)
      TestValidator.predicate(
        "natural span preserves all samples",
        test12ValuesClose(result, natural),
      );
  }
  TestValidator.predicate(
    "compiled action ends at its placement plus span",
    nclose(
      compilePerformance([walk(7.5, 2.5)], synth).performances.hero!.duration,
      10,
    ),
  );
  for (const target of [
    { kind: "direction", headingDeg: 90 },
    { kind: "point", point: HERO.position },
  ] as const) {
    const action: IAutoMovieActionCall = {
      verb: "locomote",
      actor: "hero",
      gait: "walk",
      to: target,
      start: 0,
      duration: 4,
    };
    TestValidator.predicate(
      "relative or coincident destination steps in place for the declared span",
      nclose(synth(action, "hero")!.duration, 4) &&
        nclose(synth({ ...action, duration: "auto" }, "hero")!.duration, 1),
    );
  }
}
