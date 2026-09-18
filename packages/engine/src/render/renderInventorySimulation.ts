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
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderOwnerCost,
} from "@automovie/interface";

import { fluidDomainBudget } from "../fluid/fluidDomainBudget";
import { plantingBudget } from "../soft/plantingBudget";
import { softBodyBudget } from "../soft/softBodyBudget";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { AUTOMOVIE_FLOW_BYTES } from "./AUTOMOVIE_FLOW_BYTES";
import { AUTOMOVIE_INDEX_BYTES } from "./AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "./AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "./AUTOMOVIE_POSITION_BYTES";
import { AUTOMOVIE_UV_BYTES } from "./AUTOMOVIE_UV_BYTES";
import type { IAutoMovieRenderPrototypeCost } from "./IAutoMovieRenderPrototypeCost";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";

/**
 * Extend prior counts with simulated drawable costs and explicit missing inputs.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Measures the declared geometry and resource population for conservative render admission.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps the measured cost and explicit unmeasured gaps in the one-frame preflight inventory.
 */
export const measureRenderSimulation = (props: {
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
  const { subject, gaps, add, cite } = props;
  let { triangles, vertices, drawCalls, instanceSlots, simulatedNodes } = props;
  let simulatedBytes = 0;
  // --- bounded billboard effects ------------------------------------------
  // The viewer uploads one four-vertex plane and instances it up to the
  // builder-owned cap. Time sampling may draw fewer (including zero), but a
  // preflight bound must hold at the cue's peak rather than at frame zero.
  for (const effect of subject.effects ?? []) {
    const cap = effect.recipe.budget.maxParticles;
    if (!Number.isSafeInteger(cap) || cap <= 0)
      throw new Error(
        `render inventory cannot measure effect "${effect.id}": maxParticles must be a positive safe integer, but was ${cap}`,
      );
    const owner = `effect:${effect.id}`;
    const source = `effects["${effect.id}"]`;
    const effectTriangles = cap * 2;
    const effectVertices = cap * 4;
    const effectDraws = 1;
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
  let fluidCells = 0;
  let fluidParticles = 0;
  const unmeasured: string[] = [];

  for (const panel of subject.softBodies ?? []) {
    const owner = `soft-body:${panel.domain.id}`;
    const source = `softBodies["${panel.domain.id}"]`;
    // One vertex per particle and two triangles per lattice quad, read from the
    // domain's own budget rather than recomputed: a second copy of that
    // arithmetic here would keep answering with the old shape the day the panel
    // geometry changes. A lattice one particle wide holds no quad, so it is a
    // cord, it draws nothing, and the viewer hides it rather than submitting a
    // degenerate mesh.
    const cost = softBodyBudget(panel.domain);
    const panelVertices = cost.particles;
    const panelTriangles = cost.triangles;
    const panelDraws = panelTriangles === 0 ? 0 : 1;
    const panelBytes =
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
    const owner = `planting:${planting.cluster.id}`;
    const source = `plantings["${planting.cluster.id}"]`;
    const budget = plantingBudget({
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
    const batches = [
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
    let plantDraws = 0;
    let plantSlots = 0;
    let plantTriangles = 0;
    let plantVertices = 0;
    let plantBytes = 0;
    let stated = true;
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
  const bodies = subject.waterBodies ?? [];
  const unsolved = bodies.filter(
    (body) => body.domain === null && body.cells === null,
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
    const owner = `water-body:${body.id}`;
    const source = `waterBodies["${body.id}"]`;
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
    const budget = fluidDomainBudget(body.domain);
    fluidCells += budget.cells;
    fluidParticles += budget.sprayParticleCap;
    add(owner, source, "fluidCells", budget.cells);
    add(owner, source, "fluidParticles", budget.sprayParticleCap);
    // One vertex per cell, at the cell centre, and two triangles per quad whose
    // four corner cells are all wet. Dry and solid cells only ever drop quads,
    // so the full lattice is the upper bound a budget has to hold against.
    const { columns, rows } = body.domain.grid;
    const waterVertices = columns * rows;
    const waterTriangles = 2 * quads(columns) * quads(rows);
    const waterDraws = waterTriangles === 0 ? 0 : 1;
    const waterBytes =
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
const quads = (count: number): number => (count > 1 ? count - 1 : 0);

/**
 * Read one stated prototype cost, refusing a value no renderer could hold.
 *
 * A fractional or negative vertex count is an authoring or adapter mistake, and
 * multiplying one by ten thousand instances would put a fabricated number into
 * the one report that exists to hold real ones.
 */
const statedPrototype = (
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
const prototypeBytes = (cost: IAutoMovieRenderPrototypeCost): number =>
  cost.vertices *
    (AUTOMOVIE_POSITION_BYTES + AUTOMOVIE_NORMAL_BYTES + AUTOMOVIE_UV_BYTES) +
  cost.triangles * 3 * AUTOMOVIE_INDEX_BYTES;
