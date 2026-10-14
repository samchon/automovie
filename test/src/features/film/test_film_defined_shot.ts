import {
  IAutoMovieBeatEndActorState,
  IAutoMovieCompiledContractRealization,
  IAutoMovieDefinedShot,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieAuthoringDiagnostic } from "@automovie/engine";
import { compileDefinedShot } from "@automovie/engine";
import { defineShot } from "@automovie/engine";
import { suggestCollisionResponse } from "@automovie/engine";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const program: () => IAutoMovieShotProgram = (): IAutoMovieShotProgram => {
  const blocking: ReturnType<typeof makeBlockingWrite> = makeBlockingWrite();
  const performance: ReturnType<typeof makePerformanceWrite> =
    makePerformanceWrite();
  blocking.camera.framing = "full";
  blocking.rationale =
    "full static keeps both required actor roots readable throughout the duel.";
  for (const action of performance.draft)
    if (action.verb === "frame") action.framing = "full";
  return {
    actors: [
      { node: "knightA", model: "knightA", speed: 1, eyeHeight: 1.6 },
      { node: "knightB", model: "knightB", speed: 1, eyeHeight: 1.6 },
    ],
    script: makeScriptWrite(),
    stage: makeStagingWrite(),
    blocking,
    performance,
    eventSamples: [],
  };
};

/**
 * A registered source module drives the full portable film pipeline.
 *
 * The registration owns the emitted shot id and scene/contract identity; the engine runs stage, blocking, thin-verb synthesis, ROM/artifact gates and opening/closing continuity measurement. D010 collision output remains data beside the result and is never silently applied to the compiled motions.
 *
 * Scenarios:
 *
 * 1. The registered id, scene and measured continuity survive a valid compile.
 * 2. Optional, accepted, modified and rejected collision advice remains data.
 * 3. Contract mismatch, unrealized predicates and runtime/continuity throws produce actionable diagnostics rather than escaping the boundary.
 * 4. Builder throws whose string conversion fails still become builder-failed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileDefinedShot through valid registration and failing builder/runtime phases, asserting output identity, nonempty measured realization, copied advice, advice-independent motion, and structured errors, including values that throw during error formatting.
 * @evidence contracts/testing.md#independent-expectations Submitted registration ids, two actor participants, and opening/review/closing samples supply identity and refusal expectations. Advice copies and paired compilation check carriage and noninterference rather than independently validating the collision-response formula; deliberate thrown values require builder-failed diagnostics even when JavaScript cannot coerce them.
 * @evidence contracts/testing.md#distinguishing-cases Preserves valid compilation, all advice decisions, mismatched registration, impossible predicates and participant, synthesizer failure and duplicate continuity plants; null-prototype and throwing-coercion errors distinguish diagnostic formatting from ordinary Error handling.
 * @evidence contracts/testing.md#execution-ownership The synchronous portable entry imports engine owners directly and reuses existing film fixtures; all cases execute under this function without a new runtime host, browser, GPU or Human observation.
 */
export function test_film_defined_shot(): void {
  const shot: IAutoMovieDefinedShot<unknown> = defineShot("SB-012", {
    scene: "scene-duel",
    contract: {
      beat: "beat-1",
      durationSeconds: 2,
      participants: [
        { kind: "actor", id: "knightA" },
        { kind: "actor", id: "knightB" },
      ],
      opening: [],
      closing: [],
      camera: {
        intent: "Keep the duel readable.",
        requiredSubjects: ["knightA", "knightB"],
        maxOcclusionRatio: 0.2,
      },
      events: [],
      reviewFrames: [{ id: "impact", time: 1, passes: ["beauty"] }],
    },
    build: program,
  });
  for (const thrown of [
    Object.create(null),
    {
      /** Deliberately refuses string coercion at the builder error boundary. */ toString(): never {
        throw new Error("coercion failed");
      },
    },
  ] as readonly unknown[]) {
    const failed: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
      shot: defineShot("SB-uninspectable", {
        scene: shot.scene,
        contract: shot.contract,
        build: (): never => {
          throw thrown;
        },
      }),
      context: undefined,
      runtime: {
        synthesize: validSynthesizer,
        skeleton: (): IAutoMovieSkeleton => createSkeleton(),
        frameFormat: { width: 1920, height: 1080 },
      },
    });
    TestValidator.predicate(
      "uninspectable builder throw remains diagnostic",
      failed.success === false &&
        failed.diagnostics.some(
          (diagnostic: IAutoMovieAuthoringDiagnostic): boolean =>
            diagnostic.code === "builder-failed" &&
            diagnostic.phase === "build" &&
            diagnostic.fact.includes("uninspectable thrown value") &&
            diagnostic.recovery.length !== 0,
        ),
    );
  }
  const advice: ReturnType<typeof suggestCollisionResponse> =
    suggestCollisionResponse({
      a: {
        mass: 80,
        velocity: { x: 0, y: 0, z: 3 },
        restitution: 0.1,
        hardness: 0.6,
        penetrability: 0,
      },
      b: {
        mass: 75,
        velocity: { x: 0, y: 0, z: 0 },
        restitution: 0.1,
        hardness: 0.4,
        penetrability: 0,
      },
      normal: { x: 0, y: 0, z: 1 },
      gainDegPerImpulse: 0.2,
    });
  const compiled: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
    shot,
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
      advice: [
        {
          id: "duel-contact",
          proposal: advice,
          decision: null,
          selected: null,
          rationale: null,
        },
      ],
    },
  });
  TestValidator.equals(
    "registered code reaches the complete engine pipeline",
    namedFacts([
      ["compiledSuccess", (): boolean => compiled.success],
      [
        "compiledSourceShot",
        (): boolean => compiled.success && compiled.source.shot.id === "SB-012",
      ],
      [
        "compiledSourceShot2",
        (): boolean =>
          compiled.success && compiled.source.shot.scene === "scene-duel",
      ],
      [
        "compiledContinuityOpening",
        (): boolean =>
          compiled.success && compiled.continuity.opening.shot === "SB-012",
      ],
      [
        "compiledContinuityClosing",
        (): boolean =>
          compiled.success && compiled.continuity.closing.shot === "SB-012",
      ],
      [
        "compiledRealizationCamera",
        (): boolean =>
          compiled.success &&
          compiled.realization.camera.length === 3 &&
          compiled.realization.camera.every(
            (
              outcome: IAutoMovieCompiledContractRealization["camera"][number],
            ): boolean => outcome.passed,
          ),
      ],
      [
        "compiledContinuityClosing2",
        (): boolean =>
          compiled.success &&
          compiled.continuity.closing.actors.length === 2 &&
          compiled.continuity.closing.actors.every(
            (actor: IAutoMovieBeatEndActorState): boolean =>
              "gaitPhase" in actor &&
              "rootVelocity" in actor &&
              "footPlants" in actor &&
              "mount" in actor,
          ),
      ],
    ]),
    {
      compiledSuccess: true,
      compiledSourceShot: true,
      compiledSourceShot2: true,
      compiledContinuityOpening: true,
      compiledContinuityClosing: true,
      compiledRealizationCamera: true,
      compiledContinuityClosing2: true,
    },
  );
  TestValidator.equals(
    "D010 response remains optional data",
    namedFacts([
      ["compiledSuccess", (): boolean => compiled.success],
      [
        "compiledAdviceId",
        (): boolean =>
          compiled.success && compiled.advice[0]?.id === "duel-contact",
      ],
      [
        "compiledAdviceDecision",
        (): boolean => compiled.success && compiled.advice[0].decision === null,
      ],
      [
        "compiledAdviceProposal",
        (): boolean =>
          compiled.success &&
          compiled.advice[0].decision === null &&
          compiled.advice[0].proposal.impact.impulse.z !== 0,
      ],
      [
        "compiledAdviceSelected",
        (): boolean =>
          compiled.success &&
          compiled.advice[0].decision === null &&
          compiled.advice[0].selected === null,
      ],
    ]),
    {
      compiledSuccess: true,
      compiledAdviceId: true,
      compiledAdviceDecision: true,
      compiledAdviceProposal: true,
      compiledAdviceSelected: true,
    },
  );

  const modifiedResponse: ReturnType<typeof suggestCollisionResponse> =
    structuredClone(advice);
  modifiedResponse.push.flexion = (modifiedResponse.push.flexion ?? 0) + 1;
  const decisions: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
    shot,
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
      advice: [
        {
          id: "accepted",
          proposal: advice,
          decision: "accepted",
          selected: {
            recoil: structuredClone(advice.recoil),
            push: structuredClone(advice.push),
            impact: structuredClone(advice.impact),
          },
          rationale: "The measured exchange serves the grounded hit.",
        },
        {
          id: "modified",
          proposal: advice,
          decision: "modified",
          selected: modifiedResponse,
          rationale: "The stylized recoil needs one more degree.",
        },
        {
          id: "rejected",
          proposal: advice,
          decision: "rejected",
          selected: null,
          rationale: "The contact is intentionally supernatural.",
        },
      ],
    },
  });
  TestValidator.equals(
    "D010 accepted, modified, and rejected decisions remain distinguishable",
    namedFacts([
      ["decisionsSuccess", (): boolean => decisions.success],
      [
        "decisionsAdviceDecision",
        (): boolean =>
          decisions.success && decisions.advice[0]?.decision === "accepted",
      ],
      [
        "decisionsAdviceDecision2",
        (): boolean =>
          decisions.success && decisions.advice[1]?.decision === "modified",
      ],
      [
        "decisionsAdviceSelected",
        (): boolean =>
          decisions.success &&
          nclose(
            decisions.advice[1].selected?.push.flexion ?? Number.NaN,
            modifiedResponse.push.flexion ?? Number.NaN,
            0,
          ),
      ],
      [
        "decisionsAdviceDecision3",
        (): boolean =>
          decisions.success && decisions.advice[2]?.decision === "rejected",
      ],
      [
        "decisionsAdviceSelected2",
        (): boolean =>
          decisions.success && decisions.advice[2].selected === null,
      ],
    ]),
    {
      decisionsSuccess: true,
      decisionsAdviceDecision: true,
      decisionsAdviceDecision2: true,
      decisionsAdviceSelected: true,
      decisionsAdviceDecision3: true,
      decisionsAdviceSelected2: true,
    },
  );

  TestValidator.predicate(
    "advice remains copied data without changing compiled actor motion",
    compiled.success &&
      decisions.success &&
      test12ValuesClose(compiled.advice[0]!.proposal, advice) &&
      test12ValuesClose(decisions.source.motions, compiled.source.motions),
  );

  const mismatched: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
    shot: defineShot("SB-013", {
      scene: "another-scene",
      contract: shot.contract,
      build: program,
    }),
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
    },
  });
  TestValidator.equals(
    "registration mismatch is an actionable diagnostic, not a throw",
    namedFacts([
      ["refused", (): boolean => mismatched.success === false],
      [
        "violated",
        (): boolean =>
          mismatched.success === false &&
          mismatched.diagnostics.some(
            (diagnostic: IAutoMovieAuthoringDiagnostic): boolean =>
              diagnostic.code === "contract-mismatch" &&
              diagnostic.path === "$program.stage.scene.id" &&
              diagnostic.recovery.includes("defineShot"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const unrealized: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
    shot: defineShot("SB-014", {
      scene: "scene-duel",
      contract: {
        ...shot.contract,
        participants: [
          ...shot.contract.participants,
          { kind: "actor", id: "ghost" },
        ],
        opening: [
          {
            id: "impossible-opening",
            description: "The authored actor must be far outside this scene.",
            predicates: [
              {
                kind: "position",
                subject: { kind: "node", id: "knightA" },
                axis: "x",
                operator: ">=",
                value: 99,
                tolerance: 0,
              },
            ],
          },
        ],
      },
      build: program,
    }),
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
    },
  });
  TestValidator.equals(
    "source output cannot self-certify an unrealized state contract",
    namedFacts([
      ["unrealizedSuccess", (): boolean => unrealized.success === false],
      [
        "unrealizedDiagnosticsDiagnostic",
        (): boolean =>
          unrealized.success === false &&
          unrealized.diagnostics.some(
            (diagnostic: IAutoMovieAuthoringDiagnostic): boolean =>
              diagnostic.code === "contract-realization-failed" &&
              diagnostic.fact.includes("impossible-opening"),
          ),
      ],
      [
        "unrealizedDiagnosticsDiagnostic2",
        (): boolean =>
          unrealized.success === false &&
          unrealized.diagnostics.some(
            (diagnostic: IAutoMovieAuthoringDiagnostic): boolean =>
              diagnostic.fact.includes('actor "ghost"'),
          ),
      ],
    ]),
    {
      unrealizedSuccess: true,
      unrealizedDiagnosticsDiagnostic: true,
      unrealizedDiagnosticsDiagnostic2: true,
    },
  );

  const runtimeFailure: ReturnType<typeof compileDefinedShot> =
    compileDefinedShot({
      shot,
      context: undefined,
      runtime: {
        synthesize: (): never => {
          throw new Error("synthesizer fixture failed");
        },
        skeleton: (): IAutoMovieSkeleton => createSkeleton(),
        frameFormat: { width: 1920, height: 1080 },
      },
    });
  TestValidator.equals(
    "runtime exceptions remain structured at the public authoring boundary",
    namedFacts([
      ["refused", (): boolean => runtimeFailure.success === false],
      [
        "violated",
        (): boolean =>
          runtimeFailure.success === false &&
          runtimeFailure.diagnostics.some(
            (diagnostic: IAutoMovieAuthoringDiagnostic): boolean =>
              diagnostic.code === "pipeline-failed" &&
              diagnostic.phase === "performance" &&
              diagnostic.fact.includes("synthesizer fixture failed") &&
              diagnostic.impact.length !== 0 &&
              diagnostic.recovery.length !== 0,
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const continuityFailure: ReturnType<typeof compileDefinedShot> =
    compileDefinedShot({
      shot,
      context: undefined,
      runtime: {
        synthesize: validSynthesizer,
        skeleton: (): IAutoMovieSkeleton => createSkeleton(),
        frameFormat: { width: 1920, height: 1080 },
        plants: [
          { node: "knightA", plants: [] },
          { node: "knightA", plants: [] },
        ],
      },
    });
  TestValidator.equals(
    "continuity exceptions remain structured at the public boundary",
    namedFacts([
      ["refused", (): boolean => continuityFailure.success === false],
      [
        "violated",
        (): boolean =>
          continuityFailure.success === false &&
          continuityFailure.diagnostics.some(
            (diagnostic: IAutoMovieAuthoringDiagnostic): boolean =>
              diagnostic.code === "pipeline-failed" &&
              diagnostic.phase === "continuity" &&
              diagnostic.fact.includes("duplicated"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
