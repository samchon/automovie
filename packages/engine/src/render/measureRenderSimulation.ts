/**
 * Add bounded effects, cloth, planting and water to the render inventory.
 * Inputs include the cumulative population counts; local accumulation continues
 * their exact addition order and returns new counts without changing the subject.
 * The caller owns material resolution and appended owner/gap rows. Domain budget
 * functions supply simulation costs; prototype buffers are counted once per batch.
 * Missing prototype or solver costs remain explicit gaps that make the affected
 * final metrics null. A one-cell surface has no quad and creates no visible draw.
 * This phase must precede material closure, geometry memory and frame-wide passes.
 */
import type {
  AutoMovieRenderMetric,
  IAutoMovieFluidBudget,
  IAutoMovieFluidGrid,
  IAutoMoviePlantingBudget,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderOwnerCost,
  IAutoMovieSoftBodyBudget,
} from "@automovie/interface";

import { fluidDomainBudget } from "../fluid/fluidDomainBudget";
import { plantingBudget } from "../soft/plantingBudget";
import { softBodyBudget } from "../soft/softBodyBudget";
import type { IAutoMovieRenderPrototypeCost } from "./IAutoMovieRenderPrototypeCost";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { AUTOMOVIE_FLOW_BYTES } from "./constants/AUTOMOVIE_FLOW_BYTES";
import { AUTOMOVIE_INDEX_BYTES } from "./constants/AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "./constants/AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "./constants/AUTOMOVIE_POSITION_BYTES";
import { AUTOMOVIE_UV_BYTES } from "./constants/AUTOMOVIE_UV_BYTES";

/**
 * Extend prior counts with simulated drawable costs and explicit missing inputs.
 *
 * @evidence contracts/common.md#principled-implementation Add declared bounded effect planes, cloth lattice topology, planting branch/leaf upper counts and wet-surface lattice bounds to prior counts; null prototype or solver facts become explicit gaps without integrating any frame.
 * @evidence contracts/common.md#clear-and-simple-design Shared domain budget owners supply topology/population quantities while this phase owns drawn geometry/instance multipliers and delegates materials/attribution to orchestrator callbacks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A one-cell-width panel/surface has no quad draw; unknown planting prototype costs remain not-run and unproved water remains unsupported. Supplied particle-null without a domain currently follows the existing zero fallback rather than proving a measured particle population.
 * @evidence contracts/common.md#meaningful-documentation Docs identify cumulative phase order, worst-case instances, prototype buffers versus instance streams and explicit missing-input lists used to null final metrics.
 * @evidence contracts/performance.md#efficient-algorithms Declared effect/panel/body scans add budget-helper work, including cloth rest/travel scans and planting depth recurrence; no emitted plant tree or fluid step is generated, and output grows with attribution/gap rows.
 * @evidence contracts/performance.md#reuse-equivalent-work Each domain budget is read once for its drawable and per-batch prototype storage is counted once, not per instance; no cross-call result cache assumes mutable topology/host prototype facts remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The orchestrator owns callbacks and rows for the synchronous request; this phase returns counts/gap ids and retains no simulation buffers, native geometry or task.
 */
export const measureRenderSimulation: (props: {
  subject: IAutoMovieRenderSubject;
  triangles: number;
  vertices: number;
  drawCalls: number;
  instanceSlots: number;
  simulatedNodes: number;
  gaps: IAutoMovieRenderAnalysisGap[];
  add: (
    owner: string,
    source: string,
    metric: AutoMovieRenderMetric,
    cost: number,
    kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
  ) => void;
  cite: (
    material: string | null,
    owner: string,
    source: string,
    cited: string,
  ) => void;
}) => {
  triangles: number;
  vertices: number;
  drawCalls: number;
  instanceSlots: number;
  simulatedNodes: number;
  simulatedBytes: number;
  fluidCells: number;
  fluidParticles: number;
  unmeasured: string[];
  unsolved: IAutoMovieRenderWaterBody[];
} = (props: {
  subject: IAutoMovieRenderSubject;
  triangles: number;
  vertices: number;
  drawCalls: number;
  instanceSlots: number;
  simulatedNodes: number;
  gaps: IAutoMovieRenderAnalysisGap[];
  add: (
    owner: string,
    source: string,
    metric: AutoMovieRenderMetric,
    cost: number,
    kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
  ) => void;
  cite: (
    material: string | null,
    owner: string,
    source: string,
    cited: string,
  ) => void;
}): {
  triangles: number;
  vertices: number;
  drawCalls: number;
  instanceSlots: number;
  simulatedNodes: number;
  simulatedBytes: number;
  fluidCells: number;
  fluidParticles: number;
  unmeasured: string[];
  unsolved: IAutoMovieRenderWaterBody[];
} => {
  const {
    subject,
    gaps,
    add,
    cite,
  }: {
    subject: IAutoMovieRenderSubject;
    triangles: number;
    vertices: number;
    drawCalls: number;
    instanceSlots: number;
    simulatedNodes: number;
    gaps: IAutoMovieRenderAnalysisGap[];
    add: (
      owner: string,
      source: string,
      metric: AutoMovieRenderMetric,
      cost: number,
      kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
    ) => void;
    cite: (
      material: string | null,
      owner: string,
      source: string,
      cited: string,
    ) => void;
  } = props;
  let {
    triangles,
    vertices,
    drawCalls,
    instanceSlots,
    simulatedNodes,
  }: {
    subject: IAutoMovieRenderSubject;
    triangles: number;
    vertices: number;
    drawCalls: number;
    instanceSlots: number;
    simulatedNodes: number;
    gaps: IAutoMovieRenderAnalysisGap[];
    add: (
      owner: string,
      source: string,
      metric: AutoMovieRenderMetric,
      cost: number,
      kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
    ) => void;
    cite: (
      material: string | null,
      owner: string,
      source: string,
      cited: string,
    ) => void;
  } = props;
  let simulatedBytes: number = 0;
  // --- bounded billboard effects ------------------------------------------
  // The viewer uploads one four-vertex plane and instances it up to the
  // builder-owned cap. Time sampling may draw fewer (including zero), but a
  // preflight bound must hold at the cue's peak rather than at frame zero.
  for (const effect of subject.effects ?? []) {
    const cap: number = effect.recipe.budget.maxParticles;
    if (!Number.isSafeInteger(cap) || cap <= 0)
      throw new Error(
        `render inventory cannot measure effect "${effect.id}": maxParticles must be a positive safe integer, but was ${cap}`,
      );
    const owner: string = `effect:${effect.id}`;
    const source: string = `effects["${effect.id}"]`;
    const effectTriangles: number = cap * 2;
    const effectVertices: number = cap * 4;
    const effectDraws: number = 1;
    triangles += effectTriangles;
    vertices += effectVertices;
    drawCalls += effectDraws;
    instanceSlots += cap;
    simulatedBytes +=
      4 *
        (AUTOMOVIE_POSITION_BYTES +
          AUTOMOVIE_NORMAL_BYTES +
          AUTOMOVIE_UV_BYTES) +
      6 * AUTOMOVIE_INDEX_BYTES;
    ++simulatedNodes;
    add(owner, source, "triangles", effectTriangles);
    add(owner, source, "vertices", effectVertices);
    add(owner, source, "drawCalls", effectDraws);
    add(owner, source, "instanceSlots", cap);
    add(owner, source, "nodes", 1);
    cite(null, owner, source, `effect "${effect.id}"`);
  }

  // --- simulated drawables --------------------------------------------------
  // Cloth, planting and water are drawn by the same renderer as everything
  // above and are held by no scene node, so a subject that measured only nodes,
  // ground and instance sets would report a triangle count for a room the
  // curtain, the fern bed and the pond are missing from. Every count here is
  // derived from the domain record alone: no solve has to run, which is the
  // whole point of refusing a production before the first step is integrated.
  let fluidCells: number = 0;
  let fluidParticles: number = 0;
  const unmeasured: string[] = [];

  for (const panel of subject.softBodies ?? []) {
    const owner: string = `soft-body:${panel.domain.id}`;
    const source: string = `softBodies["${panel.domain.id}"]`;
    // One vertex per particle and two triangles per lattice quad, read from the
    // domain's own budget rather than recomputed: a second copy of that
    // arithmetic here would keep answering with the old shape the day the panel
    // geometry changes. A lattice one particle wide holds no quad, so it is a
    // cord, it draws nothing, and the viewer hides it rather than submitting a
    // degenerate mesh.
    const cost: IAutoMovieSoftBodyBudget = softBodyBudget(panel.domain);
    const panelVertices: number = cost.particles;
    const panelTriangles: number = cost.triangles;
    const panelDraws: 1 | 0 = panelTriangles === 0 ? 0 : 1;
    const panelBytes: number =
      panelVertices *
        (AUTOMOVIE_POSITION_BYTES +
          AUTOMOVIE_NORMAL_BYTES +
          AUTOMOVIE_UV_BYTES) +
      panelTriangles * 3 * AUTOMOVIE_INDEX_BYTES;
    triangles += panelTriangles;
    vertices += panelVertices;
    drawCalls += panelDraws;
    simulatedBytes += panelBytes;
    ++simulatedNodes;
    add(owner, source, "triangles", panelTriangles);
    add(owner, source, "vertices", panelVertices);
    add(owner, source, "drawCalls", panelDraws);
    add(owner, source, "geometryBytes", panelBytes);
    add(owner, source, "nodes", 1);
    // A hidden mesh binds no material the renderer ever has to prepare, so a
    // cord costs its buffers and nothing else.
    if (panelDraws !== 0)
      cite(panel.material, owner, source, `soft body "${panel.domain.id}"`);
  }

  for (const planting of subject.plantings ?? []) {
    const owner: string = `planting:${planting.cluster.id}`;
    const source: string = `plantings["${planting.cluster.id}"]`;
    const budget: IAutoMoviePlantingBudget = plantingBudget({
      domain: planting.domain,
      cluster: planting.cluster,
    });
    // Two instanced batches, never two draws per member: that is the whole
    // reason a bed of forty ferns is affordable. A batch with no instance is
    // never built, or is hidden, so it submits nothing and binds nothing.
    //
    // A branch is drawn as whatever solid the renderer sweeps along it, so the
    // per-instance geometry is a renderer fact and not a recipe fact. Stating
    // it is what turns the geometry metrics from unmeasured into measured, and
    // withholding it leaves them unmeasured rather than guessed.
    const batches: {
      part: string;
      instances: number;
      material: string | null;
      cost: IAutoMovieRenderPrototypeCost | null;
    }[] = [
      {
        part: "branch",
        instances: budget.worstCaseBranchInstances,
        material: planting.branchMaterial,
        cost: statedPrototype(
          planting.branch,
          `planting "${planting.cluster.id}" branch`,
        ),
      },
      {
        part: "leaf",
        instances: budget.worstCaseLeafInstances,
        material: planting.leafMaterial,
        cost: statedPrototype(
          planting.leaf,
          `planting "${planting.cluster.id}" leaf`,
        ),
      },
    ];
    let plantDraws: number = 0;
    let plantSlots: number = 0;
    let plantTriangles: number = 0;
    let plantVertices: number = 0;
    let plantBytes: number = 0;
    let stated: boolean = true;
    for (const batch of batches) {
      if (batch.instances === 0) continue;
      ++plantDraws;
      plantSlots += batch.instances;
      cite(
        batch.material,
        `${owner}/${batch.part}`,
        source,
        `planting "${planting.cluster.id}" ${batch.part}`,
      );
      if (batch.cost === null) {
        stated = false;
        continue;
      }
      plantTriangles += batch.instances * batch.cost.triangles;
      plantVertices += batch.instances * batch.cost.vertices;
      // The prototype buffers are uploaded once and reused by every instance,
      // which is exactly what makes instancing cheaper than duplication; the
      // per-instance matrices are the caller's stream and are not geometry.
      plantBytes += prototypeBytes(batch.cost);
    }
    drawCalls += plantDraws;
    instanceSlots += plantSlots;
    ++simulatedNodes;
    add(owner, source, "drawCalls", plantDraws);
    add(owner, source, "instanceSlots", plantSlots);
    add(owner, source, "nodes", 1);
    if (!stated) {
      unmeasured.push(planting.cluster.id);
      continue;
    }
    triangles += plantTriangles;
    vertices += plantVertices;
    simulatedBytes += plantBytes;
    add(owner, source, "triangles", plantTriangles);
    add(owner, source, "vertices", plantVertices);
    add(owner, source, "geometryBytes", plantBytes);
  }
  if (unmeasured.length !== 0)
    for (const metric of ["triangles", "vertices", "geometryBytes"] as const)
      gaps.push({
        metric,
        status: "not-run",
        reason: `${unmeasured.length} planting cluster(s) state no drawn prototype cost, starting with "${[...unmeasured].sort(compareAutoMovieRenderIds)[0]!}"`,
        remedy:
          "pass each planting cluster's branch and leaf prototype vertex and triangle counts, as the renderer builds them, in the subject's plantings list",
      });

  // --- water ----------------------------------------------------------------
  const bodies: readonly IAutoMovieRenderWaterBody[] =
    subject.waterBodies ?? [];
  const unsolved: IAutoMovieRenderWaterBody[] = bodies.filter(
    (body: IAutoMovieRenderWaterBody): boolean =>
      body.domain === null && body.cells === null,
  );
  if (unsolved.length !== 0)
    for (const metric of ["fluidCells", "fluidParticles"] as const)
      gaps.push({
        metric,
        status: "unsupported",
        reason: `${unsolved.length} declared water body/bodies carry no solver-proved cost, so this metric has no analysis behind it`,
        remedy:
          "bind each water body to its shallow-water domain, or supply its solver-derived cell and particle cost, or remove the declared water bodies",
      });
  for (const body of bodies) {
    const owner: string = `water-body:${body.id}`;
    const source: string = `waterBodies["${body.id}"]`;
    if (body.domain === null) {
      if (body.cells === null) continue;
      fluidCells += body.cells;
      fluidParticles += body.particles ?? 0;
      add(owner, source, "fluidCells", body.cells);
      add(owner, source, "fluidParticles", body.particles ?? 0);
      continue;
    }
    // A bound domain states its own cost exactly, so nothing is copied by hand
    // and nothing can drift from the record it describes.
    const budget: IAutoMovieFluidBudget = fluidDomainBudget(body.domain);
    fluidCells += budget.cells;
    fluidParticles += budget.sprayParticleCap;
    add(owner, source, "fluidCells", budget.cells);
    add(owner, source, "fluidParticles", budget.sprayParticleCap);
    // One vertex per cell, at the cell centre, and two triangles per quad whose
    // four corner cells are all wet. Dry and solid cells only ever drop quads,
    // so the full lattice is the upper bound a budget has to hold against.
    const { columns, rows }: IAutoMovieFluidGrid = body.domain.grid;
    const waterVertices: number = columns * rows;
    const waterTriangles: number = 2 * quads(columns) * quads(rows);
    const waterDraws: 1 | 0 = waterTriangles === 0 ? 0 : 1;
    const waterBytes: number =
      waterVertices *
        (AUTOMOVIE_POSITION_BYTES +
          AUTOMOVIE_NORMAL_BYTES +
          AUTOMOVIE_UV_BYTES +
          AUTOMOVIE_FLOW_BYTES) +
      waterTriangles * 3 * AUTOMOVIE_INDEX_BYTES;
    triangles += waterTriangles;
    vertices += waterVertices;
    drawCalls += waterDraws;
    simulatedBytes += waterBytes;
    ++simulatedNodes;
    add(owner, source, "triangles", waterTriangles);
    add(owner, source, "vertices", waterVertices);
    add(owner, source, "drawCalls", waterDraws);
    add(owner, source, "geometryBytes", waterBytes);
    add(owner, source, "nodes", 1);
    if (waterDraws !== 0)
      cite(body.material, owner, source, `water body "${body.id}"`);
  }

  return {
    triangles,
    vertices,
    drawCalls,
    instanceSlots,
    simulatedNodes,
    simulatedBytes,
    fluidCells,
    fluidParticles,
    unmeasured,
    unsolved,
  };
};
/**
 * Quads one grid axis of `count` cells spans.
 *
 * A single cell spans none, which is what makes a one-cell-wide pond a line
 * rather than a surface: it draws nothing at all, and inventing a sliver for it
 * would be inventing geometry. The panel beside it needs no such helper because
 * the soft-body domain publishes its own drawn triangle count; the fluid budget
 * states cells and faces but not the surface it draws, so this is derived here
 * from the grid the surface geometry reads.
 */
const quads: (count: number) => number = (count: number): number =>
  count > 1 ? count - 1 : 0;

/**
 * Read one stated prototype cost, refusing a value no renderer could hold.
 *
 * A fractional or negative vertex count is an authoring or adapter mistake, and
 * multiplying one by ten thousand instances would put a fabricated number into
 * the one report that exists to hold real ones.
 */
const statedPrototype: (
  cost: IAutoMovieRenderPrototypeCost | null,
  cited: string,
) => IAutoMovieRenderPrototypeCost | null = (
  cost: IAutoMovieRenderPrototypeCost | null,
  cited: string,
): IAutoMovieRenderPrototypeCost | null => {
  if (cost === null) return null;
  for (const [field, value] of [
    ["vertices", cost.vertices],
    ["triangles", cost.triangles],
  ] as const)
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(
        `render inventory cannot measure ${cited} prototype: ${field} must be a safe integer at or above zero, but was ${value}`,
      );
  return cost;
};

/** Device bytes one instanced prototype's own buffers occupy. */
const prototypeBytes: (cost: IAutoMovieRenderPrototypeCost) => number = (
  cost: IAutoMovieRenderPrototypeCost,
): number =>
  cost.vertices *
    (AUTOMOVIE_POSITION_BYTES + AUTOMOVIE_NORMAL_BYTES + AUTOMOVIE_UV_BYTES) +
  cost.triangles * 3 * AUTOMOVIE_INDEX_BYTES;
