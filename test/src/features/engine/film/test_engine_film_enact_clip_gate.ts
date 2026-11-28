import { AutoMovieEngineViolationCollector, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieEnginePerformShotActionPlan,
  IAutoMovieEnginePerformShotGateContext,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The stage action gate checks the clip id that the host will resolve for an
 * authored enact action.
 *
 * Scenarios:
 *
 * 1. A nonblank clip id adds no violation.
 * 2. An empty or whitespace-only id adds a type violation at its clip field.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify a nonblank external clip reference and the invalid authored clip field.
 * @evidence contracts/development/testing.md#behavioral-verification The test sends enact choices through the public stage-action gate and observes the recorded type violations for valid, empty and whitespace identifiers.
 * @evidence contracts/development/testing.md#independent-expectations The host receives the literal admitted ID. A string with visible characters can address a clip, while an empty string or a string stripped to empty cannot. The authored action index fixes the reported field.
 */
export function test_engine_film_enact_clip_gate(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const context: IAutoMovieEnginePerformShotGateContext = {
    out,
    staged: {
      success: true,
      scene: { id: "studio", name: null, nodes: [], cameras: [], lights: [] },
      mounts: [],
    },
    performance: {
      beat: "entrance",
      plan: "",
      draft: [],
      revise: { review: "", final: null },
      duration: 1,
    },
    base: "$input.draft",
    skeleton: (): null => null,
    hasActorContext: undefined,
    gaits: undefined,
    nodeIds: new Set<string>(["actor"]),
    cameraIds: new Set<string>(),
    nodePositions: new Map(),
    formationById: new Map(),
    formationPoints: new Map(),
    targetAt: undefined,
  };
  const plan: IAutoMovieEnginePerformShotActionPlan = {
    liveCamera: null,
    stageActions: [],
    stageActionPaths: [],
    frames: [],
    launches: [],
    attachments: [],
  };
  ["entrance-move", "", " \t"].forEach((clip: string, index: number): void =>
    AutoMovieEngineFilm.gatePerformShotStageAction(
      context,
      plan,
      { verb: "enact", actor: "actor", start: 0, duration: 1, clip },
      ["actor"],
      index,
    ),
  );
  TestValidator.equals(
    "only the two blank clip ids receive a type violation",
    out.items.map(({ kind, path }) => ({ kind, path })),
    [
      { kind: "type", path: "$input.draft[1].clip" },
      { kind: "type", path: "$input.draft[2].clip" },
    ],
  );
}
