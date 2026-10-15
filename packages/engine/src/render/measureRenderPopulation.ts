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
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieModel,
  IAutoMovieRenderModelCost,
  IAutoMovieRenderOwnerCost,
  IAutoMovieSemanticMaskEntry,
  IAutoMovieSpace,
} from "@automovie/interface";

import { tessellateSurface } from "../geometry/tessellateSurface";
import type { ITessellation } from "./../geometry/ITessellation";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { autoMovieSemanticMaskNodeIndex } from "./autoMovieSemanticMaskNodeIndex";
import { AUTOMOVIE_INDEX_BYTES } from "./constants/AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "./constants/AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "./constants/AUTOMOVIE_POSITION_BYTES";
import { measure } from "./measure";

/**
 * Account for staged and compact populations before simulation and frame passes.
 *
 * @evidence contracts/common.md#principled-implementation Count staged/ground geometry and compact populations using cached canonical model costs; every instance prototype tier contributes to resident model closure and each per-frame dimension takes its maximum, without assuming LOD cost decreases with distance.
 * @evidence contracts/common.md#clear-and-simple-design This phase owns population multipliers and appends semantic own rows, leaving simulation and frame passes to later inventory phases; promoted heroes are ordinary nodes and anonymous formation slots are counted separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing representations/models refuse and camera culling never reduces a preflight bound; independent maxima are conservative dimensions, not a claim that one tier realizes all maxima simultaneously. Prototype buffer totals do not certify full native clone/instance-stream residency.
 * @evidence contracts/common.md#meaningful-documentation Props identify shared request caches/sets/row appender and cumulative outputs; docs distinguish ground tessellation, resident tier closure and compact versus expanded populations.
 * @evidence contracts/performance.md#efficient-algorithms Work scales with staged nodes, ground tessellation and all prototype/tier citations, with cached first-model tessellation cost; output/cache storage is proportional to models and owner rows rather than per-slot objects.
 * @evidence contracts/performance.md#reuse-equivalent-work Each canonical model is measured once per request and reused across nodes/tier citations; drawn/flattened sets share complete resource closure with subsequent material/geometry phases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The orchestrator owns mutable caches/sets/rows through the request; only scalar cumulative counts return and no renderer geometry handle or population expansion is retained.
 */
export const measureRenderPopulation: (props: {
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
  triangles: number;
  vertices: number;
  drawCalls: number;
  space: IAutoMovieSpace | null;
  groundBytes: number;
  instanceSlots: number;
  instanceChunks: number;
  simulatedNodes: number;
} = (props: {
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
}): {
  triangles: number;
  vertices: number;
  drawCalls: number;
  space: IAutoMovieSpace | null;
  groundBytes: number;
  instanceSlots: number;
  instanceChunks: number;
  simulatedNodes: number;
} => {
  const {
    subject,
    nodeIndex,
    model,
    costs,
    drawnModels,
    flattenedModels,
    add,
  }: {
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
  } = props;
  // --- ordinary scene nodes -------------------------------------------------
  let triangles: number = 0;
  let vertices: number = 0;
  let drawCalls: number = 0;
  for (const node of subject.scene.nodes) {
    const cost: IAutoMovieRenderModelCost = measure(
      model(node.model, `scene node "${node.id}"`),
      costs,
    );
    drawnModels.add(cost.model);
    triangles += cost.triangles;
    vertices += cost.vertices;
    drawCalls += cost.parts;
    const entry: IAutoMovieSemanticMaskEntry | undefined = nodeIndex.get(
      node.id,
    );
    const owner: string = entry === undefined ? `node:${node.id}` : entry.id;
    // A staged prop is edited in the scene; a lowered building element is
    // edited in the building that produced it. Keying off the entry's KIND and
    // not merely its presence is what keeps a prop from being reported at a
    // building path nobody can open.
    const source: string =
      entry?.kind === "element"
        ? `builtEnvironments[].elements["${node.id}"]`
        : `scene.nodes["${node.id}"]`;
    add(owner, source, "triangles", cost.triangles);
    add(owner, source, "vertices", cost.vertices);
    add(owner, source, "drawCalls", cost.parts);
    add(owner, source, "nodes", 1);
  }

  // --- the standable ground -------------------------------------------------
  const space: IAutoMovieSpace | null = subject.scene.space ?? null;
  let groundBytes: number = 0;
  if (space !== null) {
    // Measured through the SAME tessellator the viewer draws the ground with,
    // so the ground is counted exactly rather than left out. Leaving it out was
    // the tempting shortcut and the wrong one: a triangle budget that quietly
    // excludes the floor is a budget that clears a scene it never measured.
    // A footprint enclosing no area tessellates to nothing and the viewer draws
    // no mesh for it, so it costs nothing here either.
    const owner: string = `node:${space.id}`;
    let groundTriangles: number = 0;
    let groundVertices: number = 0;
    let groundDraws: number = 0;
    for (const surface of space.surfaces) {
      const mesh: ITessellation | null = tessellateSurface(surface);
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
  let instanceSlots: number = 0;
  let instanceChunks: number = 0;
  for (const instanceSet of subject.instanceSets ?? []) {
    const prototypes: IAutoMovieCompiledInstancePrototype[] =
      instanceSet.prototypes ?? [
        {
          id: "default",
          model: instanceSet.model,
          weight: 1,
          lod: instanceSet.lod,
          projectionRadius: instanceSet.projectionRadius,
        },
      ];
    let worstTriangles: number = 0;
    let worstVertices: number = 0;
    let partsPerChunk: number = 0;
    for (const prototype of prototypes) {
      if (prototype.lod.length === 0)
        throw new Error(
          `render inventory cannot measure instance set "${instanceSet.id}": prototype "${prototype.id}" declares no level of detail`,
        );
      let prototypeParts: number = 0;
      for (const lod of prototype.lod) {
        const cost: IAutoMovieRenderModelCost = measure(
          model(
            lod.runtimeModel,
            `instance set "${instanceSet.id}" prototype "${prototype.id}" LOD "${lod.tier}"`,
          ),
          costs,
          lod.tier,
        );
        drawnModels.add(cost.model);
        flattenedModels.add(cost.model);
        worstTriangles = Math.max(worstTriangles, cost.triangles);
        worstVertices = Math.max(worstVertices, cost.vertices);
        prototypeParts = Math.max(prototypeParts, cost.parts);
      }
      partsPerChunk += prototypeParts;
    }
    const owner: string = `instance-set:${instanceSet.id}`;
    const source: string = `world.instanceSets["${instanceSet.id}"]`;
    const setDraws: number = instanceSet.chunks.length * partsPerChunk;
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

  let simulatedNodes: number = 0;

  // --- compact formations --------------------------------------------------
  // Promoted heroes are ordinary scene nodes above. Every other member is one
  // instance in exactly one camera-selected LOD batch, so the most expensive
  // tier times the anonymous population is the safe frame bound. A chunk can
  // select only one tier, which makes its draw bound the largest part count,
  // not the sum of every mutually-exclusive representation.
  for (const formation of subject.formations ?? []) {
    let worstTriangles: number = 0;
    let worstVertices: number = 0;
    let worstParts: number = 0;
    if (formation.lod.length === 0)
      throw new Error(
        `render inventory cannot measure formation "${formation.id}": it declares no level of detail`,
      );
    for (const lod of formation.lod) {
      const cost: IAutoMovieRenderModelCost = measure(
        model(
          lod.runtimeModel,
          `formation "${formation.id}" LOD "${lod.tier}"`,
        ),
        costs,
        lod.tier,
      );
      drawnModels.add(cost.model);
      flattenedModels.add(cost.model);
      worstTriangles = Math.max(worstTriangles, cost.triangles);
      worstVertices = Math.max(worstVertices, cost.vertices);
      worstParts = Math.max(worstParts, cost.parts);
    }
    const owner: string = `formation:${formation.id}`;
    const source: string = `formations["${formation.id}"]`;
    const formationTriangles: number =
      formation.anonymousCount * worstTriangles;
    const formationVertices: number = formation.anonymousCount * worstVertices;
    const formationDraws: number = formation.chunks.length * worstParts;
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
