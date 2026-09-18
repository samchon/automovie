/**
 * Count scene nodes, ground and compact instance populations for inventory.
 * The inventory supplies the model cache, owned resource sets and row appender.
 * This phase fills those shared collections once and returns cumulative counts.
 * Ground uses the viewer's tessellator. Instancing uses conservative per-slot
 * geometry and per-chunk draw bounds without allocating individual scene nodes.
 * Scene, ground, instance-set and formation order is retained because later
 * resource measurement relies on this complete drawn/flattened model closure.
 */
import type {
  AutoMovieRenderMetric,
  IAutoMovieModel,
  IAutoMovieRenderModelCost,
  IAutoMovieRenderOwnerCost,
} from "@automovie/interface";

import { tessellateSurface } from "../geometry/tessellateSurface";
import { measure } from "./measure";
import { AUTOMOVIE_INDEX_BYTES } from "./AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "./AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "./AUTOMOVIE_POSITION_BYTES";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { autoMovieSemanticMaskNodeIndex } from "./autoMovieSemanticMaskNodeIndex";

/**
 * Account for staged and compact populations before simulation and frame passes.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Measures the declared geometry and resource population for conservative render admission.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps the measured cost and explicit unmeasured gaps in the one-frame preflight inventory.
 */
export const measureRenderPopulation = (props: {
  subject: IAutoMovieRenderSubject;
  nodeIndex: ReturnType<typeof autoMovieSemanticMaskNodeIndex>;
  model: (id: string, cited: string) => IAutoMovieModel;
  costs: Map<string, IAutoMovieRenderModelCost>;
  drawnModels: Set<string>;
  flattenedModels: Set<string>;
  add: (
    owner: string,
    source: string,
    metric: AutoMovieRenderMetric,
    cost: number,
    kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
  ) => void;
}) => {
  const {
    subject,
    nodeIndex,
    model,
    costs,
    drawnModels,
    flattenedModels,
    add,
  } = props;
  // --- ordinary scene nodes -------------------------------------------------
  let triangles = 0;
  let vertices = 0;
  let drawCalls = 0;
  for (const node of subject.scene.nodes) {
    const cost = measure(model(node.model, `scene node "${node.id}"`), costs);
    drawnModels.add(cost.model);
    triangles += cost.triangles;
    vertices += cost.vertices;
    drawCalls += cost.parts;
    const entry = nodeIndex.get(node.id);
    const owner = entry === undefined ? `node:${node.id}` : entry.id;
    // A staged prop is edited in the scene; a lowered building element is
    // edited in the building that produced it. Keying off the entry's KIND and
    // not merely its presence is what keeps a prop from being reported at a
    // building path nobody can open.
    const source =
      entry?.kind === "element"
        ? `builtEnvironments[].elements["${node.id}"]`
        : `scene.nodes["${node.id}"]`;
    add(owner, source, "triangles", cost.triangles);
    add(owner, source, "vertices", cost.vertices);
    add(owner, source, "drawCalls", cost.parts);
    add(owner, source, "nodes", 1);
  }

  // --- the standable ground -------------------------------------------------
  const space = subject.scene.space ?? null;
  let groundBytes = 0;
  if (space !== null) {
    // Measured through the SAME tessellator the viewer draws the ground with,
    // so the ground is counted exactly rather than left out. Leaving it out was
    // the tempting shortcut and the wrong one: a triangle budget that quietly
    // excludes the floor is a budget that clears a scene it never measured.
    // A footprint enclosing no area tessellates to nothing and the viewer draws
    // no mesh for it, so it costs nothing here either.
    const owner = `node:${space.id}`;
    let groundTriangles = 0;
    let groundVertices = 0;
    let groundDraws = 0;
    for (const surface of space.surfaces) {
      const mesh = tessellateSurface(surface);
      if (mesh === null) continue;
      ++groundDraws;
      groundTriangles += mesh.indices.length / 3;
      groundVertices += mesh.positions.length / 3;
      groundBytes +=
        (mesh.positions.length / 3) *
          (AUTOMOVIE_POSITION_BYTES + AUTOMOVIE_NORMAL_BYTES) +
        mesh.indices.length * AUTOMOVIE_INDEX_BYTES;
    }
    triangles += groundTriangles;
    vertices += groundVertices;
    drawCalls += groundDraws;
    add(owner, "scene.space.surfaces", "triangles", groundTriangles);
    add(owner, "scene.space.surfaces", "vertices", groundVertices);
    add(owner, "scene.space.surfaces", "drawCalls", groundDraws);
    add(owner, "scene.space.surfaces", "geometryBytes", groundBytes);
    add(owner, "scene.space.surfaces", "nodes", 1);
  }

  // --- instanced sets -------------------------------------------------------
  let instanceSlots = 0;
  let instanceChunks = 0;
  for (const instanceSet of subject.instanceSets ?? []) {
    const prototypes = instanceSet.prototypes ?? [
      {
        id: "default",
        modelRecipe: instanceSet.modelRecipe,
        weight: 1,
        lod: instanceSet.lod,
        projectionRadius: instanceSet.projectionRadius,
      },
    ];
    let worstTriangles = 0;
    let worstVertices = 0;
    let partsPerChunk = 0;
    for (const prototype of prototypes) {
      // Near-to-far order: the first tier is the most expensive representation
      // any slot of this prototype can select.
      const finest = prototype.lod[0];
      if (finest === undefined)
        throw new Error(
          `render inventory cannot measure instance set "${instanceSet.id}": prototype "${prototype.id}" declares no level of detail`,
        );
      const cost = measure(
        model(
          finest.model,
          `instance set "${instanceSet.id}" prototype "${prototype.id}"`,
        ),
        costs,
        finest.tier,
      );
      drawnModels.add(cost.model);
      flattenedModels.add(cost.model);
      worstTriangles = Math.max(worstTriangles, cost.triangles);
      worstVertices = Math.max(worstVertices, cost.vertices);
      partsPerChunk += cost.parts;
    }
    const owner = `instance-set:${instanceSet.id}`;
    const source = `world.instanceSets["${instanceSet.id}"]`;
    const setDraws = instanceSet.chunks.length * partsPerChunk;
    instanceSlots += instanceSet.count;
    instanceChunks += instanceSet.chunks.length;
    triangles += instanceSet.count * worstTriangles;
    vertices += instanceSet.count * worstVertices;
    drawCalls += setDraws;
    add(owner, source, "triangles", instanceSet.count * worstTriangles);
    add(owner, source, "vertices", instanceSet.count * worstVertices);
    add(owner, source, "drawCalls", setDraws);
    add(owner, source, "instanceSlots", instanceSet.count);
    add(owner, source, "instanceChunks", instanceSet.chunks.length);
    add(owner, source, "instanceSets", 1);
  }

  let simulatedNodes = 0;

  // --- compact formations --------------------------------------------------
  // Promoted heroes are ordinary scene nodes above. Every other member is one
  // instance in exactly one camera-selected LOD batch, so the most expensive
  // tier times the anonymous population is the safe frame bound. A chunk can
  // select only one tier, which makes its draw bound the largest part count,
  // not the sum of every mutually-exclusive representation.
  for (const formation of subject.formations ?? []) {
    let worstTriangles = 0;
    let worstVertices = 0;
    let worstParts = 0;
    if (formation.lod.length === 0)
      throw new Error(
        `render inventory cannot measure formation "${formation.id}": it declares no level of detail`,
      );
    for (const lod of formation.lod) {
      const cost = measure(
        model(lod.model, `formation "${formation.id}" LOD "${lod.tier}"`),
        costs,
        lod.tier,
      );
      drawnModels.add(cost.model);
      flattenedModels.add(cost.model);
      worstTriangles = Math.max(worstTriangles, cost.triangles);
      worstVertices = Math.max(worstVertices, cost.vertices);
      worstParts = Math.max(worstParts, cost.parts);
    }
    const owner = `formation:${formation.id}`;
    const source = `formations["${formation.id}"]`;
    const formationTriangles = formation.anonymousCount * worstTriangles;
    const formationVertices = formation.anonymousCount * worstVertices;
    const formationDraws = formation.chunks.length * worstParts;
    triangles += formationTriangles;
    vertices += formationVertices;
    drawCalls += formationDraws;
    instanceSlots += formation.anonymousCount;
    instanceChunks += formation.chunks.length;
    add(owner, source, "triangles", formationTriangles);
    add(owner, source, "vertices", formationVertices);
    add(owner, source, "drawCalls", formationDraws);
    add(owner, source, "instanceSlots", formation.anonymousCount);
    add(owner, source, "instanceChunks", formation.chunks.length);
    add(owner, source, "nodes", 1);
    ++simulatedNodes;
  }

  return {
    triangles,
    vertices,
    drawCalls,
    space,
    groundBytes,
    instanceSlots,
    instanceChunks,
    simulatedNodes,
  };
};
