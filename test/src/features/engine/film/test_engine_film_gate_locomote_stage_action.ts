import { AutoMovieEngineViolationCollector, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieActionTarget,
  IAutoMovieEnginePerformShotActionPlan,
  IAutoMovieEnginePerformShotGateContext,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../internal/createSkeleton";

/**
 * Locomote admission reads the staged actor origin and checks horizontal
 * travel. Relative targets do not need a staged world point.
 *
 * Scenarios:
 *
 * 1. Destinations at the same world ground point and one metre to the right are
 *    accepted. A one-metre drop without horizontal travel is refused.
 * 2. A rigged bone destination is sampled at the action's start. A relative
 *    heading bypasses placement but still checks the actor's allowed gait.
 */
export function test_engine_film_gate_locomote_stage_action(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const start: IAutoMovieVector3 = { x: 3, y: 2, z: 1 };
  const reads: number[] = [];
  const context: IAutoMovieEnginePerformShotGateContext = {
    out,
    staged: {
      success: true,
      scene: { id: "stage", name: null, nodes: [], cameras: [], lights: [] },
      mounts: [],
    },
    performance: {
      beat: "travel",
      plan: "",
      draft: [],
      revise: { review: "", final: null },
      duration: 2,
    },
    base: "$input.draft",
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "mark" ? createSkeleton() : null,
    hasActorContext: undefined,
    gaits: (): string[] => ["walk"],
    nodeIds: new Set<string>(["actor", "mark"]),
    cameraIds: new Set<string>(),
    nodePositions: new Map<string, IAutoMovieVector3>([
      ["actor", start],
      ["mark", { x: 4, y: 2, z: 1 }],
    ]),
    formationById: new Map(),
    formationPoints: new Map(),
    targetAt: (
      target: IAutoMovieActionTarget,
      seconds: number,
    ): IAutoMovieVector3 | null => {
      reads.push(seconds);
      return target.kind === "bone" ? { x: 4, y: 2, z: 1 } : null;
    },
  };
  const plan: IAutoMovieEnginePerformShotActionPlan = {
    liveCamera: null,
    stageActions: [],
    stageActionPaths: [],
    frames: [],
    launches: [],
    attachments: [],
  };
  const admit = (
    to: IAutoMovieActionTarget,
    index: number,
    gait: string = "walk",
  ): void =>
    AutoMovieEngineFilm.gatePerformShotStageAction(
      context,
      plan,
      { verb: "locomote", actor: "actor", start: 0.75, duration: 1, gait, to },
      ["actor"],
      index,
    );
  admit({ kind: "point", point: start }, 0);
  admit({ kind: "point", point: { x: 3, y: 1, z: 1 } }, 1);
  admit({ kind: "bone", node: "mark", bone: "leftHand" }, 2);
  admit({ kind: "direction", headingDeg: 45 }, 3, "unknown-gait");
  TestValidator.equals(
    "every positional request resolves at the action start",
    reads,
    [0.75, 0.75, 0.75],
  );
  TestValidator.equals(
    "only the vertical movement and unavailable gait refuse",
    out.items.map(({ kind, path }) => [kind, path]),
    [
      ["range", "$input.draft[1].to"],
      ["type", "$input.draft[3].gait"],
    ],
  );
}
