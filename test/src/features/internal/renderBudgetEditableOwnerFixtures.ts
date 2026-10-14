import {
  type IAutoMovieRenderSubject,
  deriveAutoMovieSemanticMask,
  evaluateAutoMovieRenderBudget,
  measureAutoMovieRenderInventory,
  sealAutoMovieRenderTarget,
} from "@automovie/engine";
import type {
  AutoMovieRenderMetric,
  IAutoMovieModel,
  IAutoMovieRenderBudget,
  IAutoMovieRenderInventory,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
  IAutoMovieScene,
  IAutoMovieTransform,
} from "@automovie/interface";

import { boxModel, modelsFixture } from "./renderFixtures";

/** The identity placement every node and light in this scenario uses. */
function pose(): IAutoMovieTransform {
  return {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
}

/** A three-part hall beside the one-part models the shared fixture declares. */
function models(): IAutoMovieModel[] {
  return [
    ...modelsFixture(),
    boxModel({ id: "hall-model", parts: 3 }),
  ];
}

/** One staged node whose id selects the existing hall or prop model. */
function staged(id: "hall" | "stool"): IAutoMovieScene["nodes"][number] {
  return {
    id,
    model: id === "hall" ? "hall-model" : "prop-model",
    transform: pose(),
    motion: null,
    pose: null,
  };
}

/** One subject staging the given nodes under the given lights. */
function staging(props: {
  nodes: IAutoMovieScene["nodes"];
  lights: IAutoMovieScene["lights"];
}): IAutoMovieRenderSubject {
  return {
    scene: {
      id: "budget-scene",
      name: null,
      nodes: props.nodes,
      cameras: [],
      lights: props.lights,
    },
    models: models(),
  };
}

/** A budget generous everywhere but the one metric a case is testing. */
function budget(metric: AutoMovieRenderMetric, limit: number): IAutoMovieRenderBudget {
  return {
    version: 1,
    tier: "review",
    limits: {
      triangles: 1_000_000,
      vertices: 1_000_000,
      drawCalls: 1_000_000,
      materials: 1_000_000,
      textures: 1_000_000,
      textureBytes: 1_000_000,
      geometryBytes: 1_000_000,
      lights: 1_000_000,
      shadowMaps: 1_000_000,
      nodes: 1_000_000,
      instanceSets: 1_000_000,
      instanceSlots: 1_000_000,
      instanceChunks: 1_000_000,
      fluidCells: 1_000_000,
      fluidParticles: 1_000_000,
      [metric]: limit,
    },
  };
}

/** The same target premises, freshly sealed for every report invocation. */
function target(): IAutoMovieRenderTarget {
  return sealAutoMovieRenderTarget({
    renderer: { api: "webgl2", vendor: "test", device: "swiftshader" },
    settings: {
      width: 640,
      height: 360,
      pixelRatio: 1,
      shadows: true,
      shadowType: "pcfSoft",
      toneMapping: "acesFilmic",
      exposure: 1,
    },
    assets: [],
  });
}

/** Measure one subject and read back the finding of one metric. */
function report(props: {
  subject: IAutoMovieRenderSubject;
  metric: AutoMovieRenderMetric;
  limit: number;
}): IAutoMovieRenderReport["findings"][number] {
  const inventory: IAutoMovieRenderInventory = measureAutoMovieRenderInventory({
    subject: props.subject,
    mask: deriveAutoMovieSemanticMask(props.subject),
  });
  return evaluateAutoMovieRenderBudget({
    inventory,
    budget: budget(props.metric, props.limit),
    mask: {
      version: 2,
      protocol: "automovie.semantic-mask.v2",
      background: "#000000",
      entries: [],
      unaddressed: [],
      digest: `sha256:${"0".repeat(64)}`,
    },
    target: target(),
  }).findings.find((finding: IAutoMovieRenderReport["findings"][number]): boolean => finding.metric === props.metric)!;
}

/** Verdict, accounting and authored owner/pass recovery projections. */
function shape(finding: IAutoMovieRenderReport["findings"][number]): Record<string, unknown> {
  return {
    status: finding.status,
    measured: finding.measured,
    excess: finding.excess,
    owner: finding.contributors[0]?.owner,
    source: finding.contributors[0]?.source,
    cost: finding.contributors[0]?.cost,
    omittedContributors: finding.omittedContributors,
    omittedCost: finding.omittedCost,
    accounted:
      finding.contributors.reduce((sum: number, entry: IAutoMovieRenderReport["findings"][number]["contributors"][number]): number => sum + entry.cost, 0) +
      finding.omittedCost,
    namesTheOwner: (finding.recovery ?? "").includes(
      `the largest owner is "${finding.contributors[0]?.owner ?? "!"}"`,
    ),
    namesThePass: (finding.recovery ?? "").includes("is frame passes redrawing"),
    sendsNobodyToAPass: finding.contributors.every(
      (entry: IAutoMovieRenderReport["findings"][number]["contributors"][number]): boolean => !entry.owner.startsWith("render-pass:"),
    ),
  };
}

/**
 * Original editable-owner arrangements and observation projection.
 *
 * @evidence contracts/testing.md#behavioral-verification Shares the original identity transforms, model population, staging, per-metric budget, fresh sealed target and actual inventory/evaluation calls. shape observes the same verdict/accounting/contributor/recovery fields without deciding expected values.
 * @evidence contracts/testing.md#independent-expectations The owning test supplies hand-computed integer tessellation/pass counts and literal owner/source/recovery expectations. These helpers remain arrangement and observation code, never an independent oracle or a replacement budget algorithm.
 * @evidence contracts/testing.md#distinguishing-cases The existing six scenario groups consume unlit/lit/tied geometry, shadow/light counts and resident instance/fluid costs. Each factory still returns its own original fresh records, and report measures once then evaluates once in the same order.
 * @evidence contracts/testing.md#execution-ownership This single internal export is reached explicitly by test_render_budget_editable_owner; it registers no cases and opens no process, filesystem, browser or GPU. The caller owns returned records, while module function references share no mutable scenario state.
 */
export const renderBudgetEditableOwnerFixtures: {
  pose: typeof pose;
  models: typeof models;
  staged: typeof staged;
  staging: typeof staging;
  budget: typeof budget;
  target: typeof target;
  report: typeof report;
  shape: typeof shape;
} = { pose, models, staged, staging, budget, target, report, shape };
