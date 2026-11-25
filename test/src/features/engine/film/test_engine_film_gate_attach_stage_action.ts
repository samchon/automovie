import {
  ViolationCollector,
  gatePerformShotStageAction,
} from "@automovie/engine";
import type {
  IAutoMovieAttachAction,
  IAutoMovieEnginePerformShotActionPlan,
  IAutoMovieEnginePerformShotGateContext,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../internal/createSkeleton";

/**
 * The attachment gate admits a child distinct from its rigged parent, with an
 * existing parent bone and unit orientation on any supplied offset.
 *
 * Scenarios:
 *
 * 1. The offset's nonunit quaternion is reported before admission.
 * 2. A missing bone, an unstaged parent and a self attachment are refused.
 * 3. A valid job follows earlier refusals and retains its source index and
 *    original bone-local offset.
 */
export function test_engine_film_gate_attach_stage_action(): void {
  const out: ViolationCollector = new ViolationCollector();
  const rig: IAutoMovieSkeleton = createSkeleton();
  const context: IAutoMovieEnginePerformShotGateContext = {
    out,
    staged: {
      success: true,
      scene: { id: "stage", name: null, nodes: [], cameras: [], lights: [] },
      mounts: [],
    },
    performance: {
      beat: "handoff",
      plan: "",
      draft: [],
      revise: { review: "", final: null },
      duration: 2,
    },
    base: "$input.draft",
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "carrier" ? rig : null,
    hasActorContext: undefined,
    gaits: undefined,
    nodeIds: new Set<string>(["prop", "carrier"]),
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
  const authored: IAutoMovieAttachAction = {
    verb: "attachTo",
    actor: "prop",
    parent: "carrier",
    bone: "leftHand",
    start: 0,
    duration: 1,
    offset: {
      position: { x: 0.25, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  const requests: IAutoMovieAttachAction[] = [
    {
      ...authored,
      offset: {
        position: { x: 0.25, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 2 },
      },
    },
    { ...authored, bone: "rightHand" },
    { ...authored, parent: "missing" },
    { ...authored, actor: "carrier" },
    authored,
  ];
  requests.forEach((request: IAutoMovieAttachAction, index: number): void =>
    gatePerformShotStageAction(
      context,
      plan,
      request,
      [index === 3 ? "carrier" : "prop"],
      index,
    ),
  );
  TestValidator.equals(
    "each rejected attachment addresses its own failed premise",
    out.items.map(({ path }) => path),
    [
      "$input.draft[0].offset.rotation",
      "$input.draft[1].bone",
      "$input.draft[2].parent",
      "$input.draft[3].actor",
    ],
  );
  TestValidator.predicate(
    "only the admitted job retains the original action and index",
    plan.attachments.length === 1 &&
      plan.attachments[0]?.index === 4 &&
      plan.attachments[0]?.action === authored,
  );
}
