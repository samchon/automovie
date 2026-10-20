/**
 * Orchestrate conservative one-frame render costs for budgets and reports.
 * Create one model cache and resource closure, then count staged populations and
 * simulated drawables in order. Resolve materials/textures and resident geometry
 * only after both phases have named their resources. Finally add light, outline
 * and background passes before sorting attribution rows and emitting the report.
 * Each phase continues the previous counts without reordering floating-point
 * addition. Owned caches and owner rows are mutable; the input subject is not.
 * Null totals preserve declared analysis gaps rather than treating unknowns as
 * zero. Display geometry, resource bytes and whole-frame pass costs differ, so
 * changing one requires checking its consumer in the viewer and budget report.
 */
import type {
  AutoMovieRenderMetric,
  IAutoMovieAreaLight,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderInventory,
  IAutoMovieRenderModelCost,
  IAutoMovieRenderOwnerCost,
  IAutoMovieRenderTargetSettings,
  IAutoMovieRenderTextureCost,
  IAutoMovieRenderTotals,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
  IAutoMovieSpace,
} from "@automovie/interface";

import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";
import { autoMovieSemanticMaskNodeIndex } from "./autoMovieSemanticMaskNodeIndex";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { measureAutoMovieRenderTextureClosure } from "./measureAutoMovieRenderTextureClosure";
import { measureRenderPopulation } from "./measureRenderPopulation";
import { measureRenderSimulation } from "./measureRenderSimulation";
import { resolveAutoMovieMaterial } from "./resolveAutoMovieMaterial";
import { resolveAutoMovieShadowProfile } from "./resolveAutoMovieShadowProfile";
import { sumAutoMovieRenderTextureAllocations } from "./sumAutoMovieRenderTextureAllocations";

/**
 * Measure what one frame of a subject commits the renderer to.
 *
 * Everything here is exact or an explicit upper bound, and the difference is
 * stated per metric rather than left to a reader:
 *
 * - Counts of nodes, lights, slots, chunks and materials are exact;
 * - Texture allocations use the conservative union of sampler, environment
 *   and shadow consumers. Uncertified identities/profiles or unsafe counts
 *   remain null rather than an invented exact native allocation population;
 * - Triangles, vertices and draw calls for instanced sets are UPPER BOUNDS, taken
 *   over the most expensive level of detail and the most expensive prototype a
 *   slot could select, because level-of-detail selection and frustum culling
 *   are camera facts and a budget must hold for every camera;
 * - Texture bytes are conservative uncompressed-storage estimates from decoded
 *   facts and required target profiles. Unresolved dimensions, representation
 *   or residency facts remain null rather than invented storage.
 *
 * The upper-bound direction is the only safe one. A budget checked against an
 * average would pass a production that stutters whenever the camera turns
 * toward the crowd, which is exactly the frame anyone would have wanted the
 * budget to catch.
 *
 * Simulated drawables — cloth panels, planting clusters and water surfaces —
 * are measured beside the staged ones. They are held by no scene node, so
 * leaving them out was never "not yet supported": it was a triangle count for a
 * room the curtain, the fern bed and the pond are missing from, checked against
 * a budget and reported as cleared. Their cost comes from the domain record
 * alone and no solve has to run, which is what lets a production be refused
 * before the first step is integrated.
 *
 * Owners are the semantic ids of the mask, so a cost in the report and a colour
 * in the mask name the same thing. Shared resources that draw no pixels of
 * their own carry a `material:`, `texture:` or `light:` identity instead.
 *
 * A row that is one further whole-frame pass over geometry the other rows
 * already counted, such as a shadow view's depth pass or the outline guide pass,
 * is marked `pass` rather than `own`. The pass belongs in the conservative
 * one-frame peak and its own identity is worth keeping, but its cost is the sum
 * of every drawable that preceded it rather than the owner's own complexity, so
 * the report keeps its attribution without ranking it as an editable owner.
 *
 *
 * @evidence contracts/common.md#principled-implementation Measure populations then simulations with one model cache, complete resource closure, material resolution and shadow/outline/background passes, preserving phase addition order and explicit unknown totals. Frame bounds maximize supported tiers; geometryBytes covers declared prototype/surface buffers rather than all native chunk clones/instance streams.
 * @evidence contracts/common.md#clear-and-simple-design Population/simulation/resource policy owners feed one orchestrator and semantic node index, keeping owner attribution aligned with the mask without embedding a renderer or simulation host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing models/materials/shadow support refuse and missing decoded allocation/prototype/solver facts remain gaps; no fixture, invented byte estimate or camera culling silently lowers the report.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish exact logical counts, conservative displayed geometry/draw bounds, unknown resource facts and editable versus pass/runtime owner rows; the current measured buffer scope is stated explicitly.
 * @evidence contracts/performance.md#efficient-algorithms Work includes prototype tessellation, population/domain scans and texture closure, then owner/model sorting. Per-set draw reporting still scans owner rows; output/cache storage grows with measured resources and attributions, not expanded anonymous slots.
 * @evidence contracts/performance.md#reuse-equivalent-work Model/node indices, costs and validated material resolutions are reused within the request; the same material id is resolved once against the unchanged model population. Mutable subjects and host residency facts invalidate cross-call reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only inventory rows and shared request cost records transfer to the caller; model/material/cache maps and encoded facts are call-local, and no native resource or background measurement task is owned.
 */
export const measureAutoMovieRenderInventory: (props: {
  subject: IAutoMovieRenderSubject;
  mask: IAutoMovieSemanticMask;
  settings?: IAutoMovieRenderTargetSettings;
}) => IAutoMovieRenderInventory = (props: {
  /** The drawable world. */
  subject: IAutoMovieRenderSubject;
  /** Semantic palette derived from the same subject. */
  mask: IAutoMovieSemanticMask;
  /** Renderer fallback when the scene declares no environment. */
  settings?: IAutoMovieRenderTargetSettings;
}): IAutoMovieRenderInventory => {
  const {
    subject,
    mask,
  }: {
    subject: IAutoMovieRenderSubject;
    mask: IAutoMovieSemanticMask;
    settings?: IAutoMovieRenderTargetSettings;
  } = props;
  const nodeIndex: Map<string, IAutoMovieSemanticMaskEntry> =
    autoMovieSemanticMaskNodeIndex(mask);
  const byId: Map<string, IAutoMovieModel> = new Map(
    subject.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const model: (id: string, cited: string) => IAutoMovieModel = (
    id: string,
    cited: string,
  ): IAutoMovieModel => {
    const found: IAutoMovieModel | undefined = byId.get(id);
    if (found === undefined)
      throw new Error(
        `render inventory cannot measure ${cited}: model "${id}" is absent from the subject's models`,
      );
    return found;
  };

  const costs: Map<string, IAutoMovieRenderModelCost> = new Map<
    string,
    IAutoMovieRenderModelCost
  >();
  const owners: IAutoMovieRenderOwnerCost[] = [];
  const gaps: IAutoMovieRenderAnalysisGap[] = [];
  const drawnModels: Set<string> = new Set<string>();
  const flattenedModels: Set<string> = new Set<string>();
  const add: (
    owner: string,
    source: string,
    metric: AutoMovieRenderMetric,
    cost: number,
    kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
  ) => void = (
    owner: string,
    source: string,
    metric: AutoMovieRenderMetric,
    cost: number,
    // A row is the owner's own cost unless the caller says it is one further
    // pass over what the rows before it already counted. Only the frame passes
    // below say otherwise, and the report ranks the two differently.
    kind: NonNullable<IAutoMovieRenderOwnerCost["kind"]> = "own",
  ): void => {
    owners.push({ owner, source, metric, cost, kind });
  };

  // Every material the subject declares, drawn or not. A simulated drawable
  // names a material the way a model part does, and that name has to resolve
  // somewhere before its textures can be counted; resolving it against the
  // DRAWN models only would refuse a curtain fabric declared on a model this
  // shot does not stage.
  const materials: Map<string, IAutoMovieMaterial> = new Map<
    string,
    IAutoMovieMaterial
  >();
  let defaultMaterials: number = 0;
  /**
   * Count the material one simulated drawable binds.
   *
   * A named material is the same object a model part would bind, so it joins
   * the shared table and its textures are counted once however many drawables
   * name it. An unnamed one is a material the renderer creates for that
   * drawable alone, so it is counted once per drawable and binds no texture:
   * that is what the viewer actually builds, and reporting nothing for it would
   * put the compiled bound below what a live scene submits.
   */
  const cite: (
    material: string | null,
    owner: string,
    source: string,
    cited: string,
  ) => void = (
    material: string | null,
    owner: string,
    source: string,
    cited: string,
  ): void => {
    if (material === null) {
      ++defaultMaterials;
      add(`material:${owner}/default`, source, "materials", 1);
      return;
    }
    let found: IAutoMovieMaterial | undefined = materials.get(material);
    if (found === undefined) {
      try {
        found = resolveAutoMovieMaterial({
          models: subject.models,
          material,
        });
      } catch (error) {
        throw new Error(
          `render inventory cannot measure ${cited}: ${(error as Error).message}`,
        );
      }
      materials.set(material, found);
    }
  };

  const population: {
    triangles: number;
    vertices: number;
    drawCalls: number;
    space: IAutoMovieSpace | null;
    groundBytes: number;
    instanceSlots: number;
    instanceChunks: number;
    simulatedNodes: number;
  } = measureRenderPopulation({
    subject,
    nodeIndex,
    model,
    costs,
    drawnModels,
    flattenedModels,
    add,
  });
  const {
    space,
    groundBytes,
    instanceChunks,
  }: {
    triangles: number;
    vertices: number;
    drawCalls: number;
    space: IAutoMovieSpace | null;
    groundBytes: number;
    instanceSlots: number;
    instanceChunks: number;
    simulatedNodes: number;
  } = population;
  const simulation: {
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
  } = measureRenderSimulation({
    ...population,
    subject,
    gaps,
    add,
    cite,
  });
  let {
    triangles,
    drawCalls,
  }: {
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
  } = simulation;
  const {
    vertices,
    instanceSlots,
    simulatedNodes,
    simulatedBytes,
    fluidCells,
    fluidParticles,
    unmeasured,
    unsolved,
  }: {
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
  } = simulation;

  // --- materials and textures ----------------------------------------------
  const shadowProfile:
    | {
        success: false;
        violations: IAutoMovieConstraintViolation[];
        enabled?: undefined;
        type?: undefined;
        casters?: undefined;
      }
    | {
        success: true;
        enabled: boolean;
        type: "pcf" | "vsm";
        casters: { light: string; depthFaces: number; filterDraws: number }[];
        violations?: undefined;
      } = resolveAutoMovieShadowProfile({
    lights: subject.scene.lights,
    shadows:
      subject.scene.environment?.shadows ??
      (props.settings === undefined
        ? undefined
        : {
            enabled: props.settings.shadows,
            type:
              props.settings.shadowType === "none"
                ? "pcf"
                : props.settings.shadowType,
          }),
  });
  if (!shadowProfile.success)
    throw new Error(
      "Unsupported shadow profile: " + JSON.stringify(shadowProfile.violations),
    );
  const casters: { light: string; depthFaces: number; filterDraws: number }[] =
    shadowProfile.casters;
  for (const id of drawnModels) {
    const definition: IAutoMovieModel = byId.get(id)!;
    for (const part of definition.parts) {
      if (part.material === null) continue;
      const material: IAutoMovieMaterial | undefined =
        definition.materials.find(
          (candidate: IAutoMovieMaterial): boolean =>
            candidate.id === part.material,
        );
      if (material !== undefined && !materials.has(material.id))
        materials.set(material.id, material);
    }
  }
  for (const material of materials.values())
    add(
      `material:${material.id}`,
      `models[].materials["${material.id}"]`,
      "materials",
      1,
    );
  const textures: IAutoMovieRenderTextureCost[] =
    measureAutoMovieRenderTextureClosure({
      materials: materials.values(),
      sources: subject.textures ?? [],
      environment: subject.scene.environment?.image ?? null,
      defaultPbr:
        defaultMaterials > (subject.effects ?? []).length ||
        [...drawnModels].some(
          (id: string): boolean => byId.get(id)!.parts.length !== 0,
        ),
      residency: subject.textureResidency,
      shadowCasters: casters,
      areaLights: subject.scene.lights.some(
        (light: IAutoMovieLight): light is IAutoMovieAreaLight =>
          light.type === "area",
      ),
    });
  const missing: IAutoMovieRenderTextureCost[] = textures.filter(
    (texture: IAutoMovieRenderTextureCost): boolean => texture.bytes === null,
  );
  const textureBytes: number | null = sumBytes(textures);
  const textureAllocations: number | null =
    sumAutoMovieRenderTextureAllocations(textures);
  for (const texture of textures) {
    const owner: string =
      texture.asset === null
        ? texture.runtime === "data-texture"
          ? `runtime-texture:${JSON.stringify(texture.runtimeOwners)}`
          : `renderer:${texture.runtime}`
        : `texture:${texture.asset}`;
    const path: string =
      texture.asset === null
        ? texture.runtime === "data-texture"
          ? `renderer.runtimeTextures[${JSON.stringify(texture.runtimeOwners)}]`
          : `renderer.${texture.runtime}`
        : `assets["${texture.asset}"]`;
    if (texture.bytes !== null)
      add(
        owner,
        path,
        "textureBytes",
        texture.bytes,
        texture.asset === null ? "runtime" : "own",
      );
    if (texture.allocations !== null)
      add(
        owner,
        path,
        "textures",
        texture.allocations ?? 1,
        texture.asset === null ? "runtime" : "own",
      );
  }
  if (missing.length !== 0)
    gaps.push({
      metric: "textureBytes",
      status: "not-run",
      reason: `${missing.length} resident texture representation(s) have no safe decoded upload bound, starting with "${textureDiagnosticName(missing[0]!)}"`,
      remedy:
        "pass every resident source's decoded dimensions, upload format, sampling/mipmap facts and retained context extents from the capture host",
    });
  else if (textureBytes === null)
    gaps.push({
      metric: "textureBytes",
      status: "not-run",
      reason:
        "the combined resident texture representations exceed safe integer storage",
      remedy:
        "reduce resident upload dimensions or representation count before measuring the budget",
    });
  if (textureAllocations === null)
    gaps.push({
      metric: "textures",
      status: "not-run",
      reason: `the resident allocation population is uncertified or unsafe for ${textures.map(textureDiagnosticName).join(", ")}`,
      remedy:
        "supply actual host allocation authority and safe aggregate counts; current manual-mip properties cannot certify native sharing",
    });

  // --- geometry memory ------------------------------------------------------
  let geometryBytes: number = groundBytes + simulatedBytes;
  for (const id of [...drawnModels].sort(compareAutoMovieRenderIds)) {
    const cost: IAutoMovieRenderModelCost = costs.get(id)!;
    if (flattenedModels.has(id)) {
      // Flattening mixed RGB/bare parts gives every vertex a white-default RGB
      // triple. Count that resident padding once per prototype, not per slot.
      const coloredComponents: number = byId
        .get(id)!
        .parts.reduce(
          (sum: number, part: IAutoMovieModelPart): number =>
            sum +
            (part.geometry.type === "mesh" &&
            part.geometry.mesh.colors !== undefined
              ? part.geometry.mesh.positions.length
              : 0),
          0,
        );
      if (coloredComponents !== 0)
        cost.geometryBytes +=
          (cost.vertices * 3 - coloredComponents) *
          Float32Array.BYTES_PER_ELEMENT;
      // and mixed weighted/bare parts every vertex a relief factor of one
      const weightedVertices: number = byId
        .get(id)!
        .parts.reduce(
          (sum: number, part: IAutoMovieModelPart): number =>
            sum +
            (part.geometry.type === "mesh" &&
            part.geometry.mesh.reliefWeights !== undefined
              ? part.geometry.mesh.positions.length / 3
              : 0),
          0,
        );
      if (weightedVertices !== 0)
        cost.geometryBytes +=
          (cost.vertices - weightedVertices) * Float32Array.BYTES_PER_ELEMENT;
    }
    geometryBytes += cost.geometryBytes;
    add(`model:${id}`, `models["${id}"]`, "geometryBytes", cost.geometryBytes);
  }

  // --- lights and shadow maps ----------------------------------------------
  for (const light of subject.scene.lights) {
    add(`light:${light.id}`, `scene.lights["${light.id}"]`, "lights", 1);
  }
  // Depth faces repeat the conservative geometry closure; each VSM filtering
  // draw submits one fullscreen triangle. One light still owns one map. A pass
  // row is marked as one: its cost is by construction the sum of every drawable
  // before it, so the report has to keep it in the total and state the caster
  // separately without ranking that aggregate as the owner's own complexity.
  const shadowMaps: number = casters.length;
  const opaqueDraws: number = drawCalls;
  const opaqueTriangles: number = triangles;
  for (const caster of casters) {
    const shadowDraws: number =
      opaqueDraws * caster.depthFaces + caster.filterDraws;
    const shadowTriangles: number =
      opaqueTriangles * caster.depthFaces + caster.filterDraws;
    drawCalls += shadowDraws;
    triangles += shadowTriangles;
    add(
      `light:${caster.light}`,
      `scene.lights["${caster.light}"]`,
      "shadowMaps",
      1,
    );
    add(
      `light:${caster.light}`,
      `scene.lights["${caster.light}"]`,
      "drawCalls",
      shadowDraws,
      "pass",
    );
    add(
      `light:${caster.light}`,
      `scene.lights["${caster.light}"]`,
      "triangles",
      shadowTriangles,
      "pass",
    );
  }
  // Outline is another complete geometry pass. With no shadow caster it is
  // the frame-wide peak; with one it ties the beauty shadow pass, and with
  // several the shadow pass is already the larger conservative bound.
  if (casters.length === 0) {
    drawCalls += opaqueDraws;
    triangles += opaqueTriangles;
    add(
      "render-pass:outline",
      "render.pass.outline",
      "drawCalls",
      opaqueDraws,
      "pass",
    );
    add(
      "render-pass:outline",
      "render.pass.outline",
      "triangles",
      opaqueTriangles,
      "pass",
    );
  }
  const image: string | null = subject.scene.environment?.image ?? null;
  if (image !== null) {
    drawCalls += 1;
    triangles += 2;
    add(`texture:${image}`, "scene.environment.image", "drawCalls", 1);
    add(`texture:${image}`, "scene.environment.image", "triangles", 2);
  }

  const nodes: number =
    subject.scene.nodes.length + (space === null ? 0 : 1) + simulatedNodes;
  // A cluster whose drawn prototype nobody stated leaves an unknown share of
  // the geometry out, so the totals it belongs to are absent rather than a sum
  // that reads complete while missing a fern bed.
  const partial: boolean = unmeasured.length !== 0;
  const totals: IAutoMovieRenderTotals = {
    triangles: partial ? null : triangles,
    vertices: partial ? null : vertices,
    drawCalls,
    materials: materials.size + defaultMaterials,
    textures: textureAllocations,
    textureBytes,
    geometryBytes: partial ? null : geometryBytes,
    lights: subject.scene.lights.length,
    shadowMaps,
    nodes,
    instanceSets: (subject.instanceSets ?? []).length,
    instanceSlots,
    instanceChunks,
    fluidCells: unsolved.length !== 0 ? null : fluidCells,
    fluidParticles: unsolved.length !== 0 ? null : fluidParticles,
  };
  return {
    version: 1,
    models: [...costs.values()].sort(
      (
        left: IAutoMovieRenderModelCost,
        right: IAutoMovieRenderModelCost,
      ): number => compareAutoMovieRenderIds(left.model, right.model),
    ),
    textures,
    instanceSets: (subject.instanceSets ?? [])
      .map(
        (
          instanceSet: IAutoMovieCompiledInstanceSet,
        ): {
          instanceSet: string;
          slots: number;
          chunks: number;
          prototypes: number;
          drawCallUpperBound: number;
        } => ({
          instanceSet: instanceSet.id,
          slots: instanceSet.count,
          chunks: instanceSet.chunks.length,
          prototypes: (instanceSet.prototypes ?? [null]).length,
          drawCallUpperBound: owners
            .filter(
              (entry: IAutoMovieRenderOwnerCost): boolean =>
                entry.owner === `instance-set:${instanceSet.id}` &&
                entry.metric === "drawCalls",
            )
            .reduce(
              (sum: number, entry: IAutoMovieRenderOwnerCost): number =>
                sum + entry.cost,
              0,
            ),
        }),
      )
      .sort(
        (
          left: {
            instanceSet: string;
            slots: number;
            chunks: number;
            prototypes: number;
            drawCallUpperBound: number;
          },
          right: {
            instanceSet: string;
            slots: number;
            chunks: number;
            prototypes: number;
            drawCallUpperBound: number;
          },
        ): number =>
          compareAutoMovieRenderIds(left.instanceSet, right.instanceSet),
      ),
    totals,
    owners: owners.sort(
      (
        left: IAutoMovieRenderOwnerCost,
        right: IAutoMovieRenderOwnerCost,
      ): number =>
        compareAutoMovieRenderIds(left.owner, right.owner) ||
        compareAutoMovieRenderIds(left.metric, right.metric),
    ),
    gaps,
  };
};
const sumBytes: (
  textures: readonly IAutoMovieRenderTextureCost[],
) => number | null = (
  textures: readonly IAutoMovieRenderTextureCost[],
): number | null => {
  let sum: number = 0;
  for (const texture of textures) {
    if (texture.bytes === null) return null;
    sum += texture.bytes;
    if (!Number.isSafeInteger(sum)) return null;
  }
  return sum;
};

/** A source or generating runtime stays named even when its cost is unknown. */
const textureDiagnosticName: (
  texture: IAutoMovieRenderTextureCost,
) => string | undefined = (
  texture: IAutoMovieRenderTextureCost,
): string | undefined =>
  texture.asset ?? texture.runtimeOwners?.join(", ") ?? texture.variant;
