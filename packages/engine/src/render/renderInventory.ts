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
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderInventory,
  IAutoMovieRenderModelCost,
  IAutoMovieRenderOwnerCost,
  IAutoMovieRenderTextureCost,
  IAutoMovieRenderTotals,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

import { resolveAutoMovieMaterial } from "./materialResolution";
import { compareAutoMovieRenderIds } from "./renderDigest";
import { texturesOf } from "./renderInventoryGeometry";
import { AUTOMOVIE_TEXEL_BYTES } from "./renderInventoryMetrics";
import { measureRenderPopulation } from "./renderInventoryPopulation";
import { measureRenderSimulation } from "./renderInventorySimulation";
import type { IAutoMovieRenderSubject } from "./renderSubject";
import { autoMovieSemanticMaskNodeIndex } from "./semanticMask";

export {
  AUTOMOVIE_RENDER_METRICS,
  AUTOMOVIE_POSITION_BYTES,
  AUTOMOVIE_NORMAL_BYTES,
  AUTOMOVIE_UV_BYTES,
  AUTOMOVIE_INDEX_BYTES,
  AUTOMOVIE_SKIN_BYTES,
  AUTOMOVIE_TEXEL_BYTES,
  AUTOMOVIE_FLOW_BYTES,
} from "./renderInventoryMetrics";
/**
 * Measure what one frame of a subject commits the renderer to.
 *
 * Everything here is exact or an explicit upper bound, and the difference is
 * stated per metric rather than left to a reader:
 *
 * - Counts of nodes, lights, slots, chunks, materials and textures are exact;
 * - Triangles, vertices and draw calls for instanced sets are UPPER BOUNDS, taken
 *   over the most expensive level of detail and the most expensive prototype a
 *   slot could select, because level-of-detail selection and frustum culling
 *   are camera facts and a budget must hold for every camera;
 * - Texture bytes are estimated from decoded dimensions, and are absent rather
 *   than invented when a bound asset's dimensions were not supplied.
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
 * already counted, such as a shadow map's depth pass or the outline guide pass,
 * is marked `pass` rather than `own`. The pass belongs in the conservative
 * one-frame peak and its own identity is worth keeping, but its cost is the sum
 * of every drawable that preceded it rather than the owner's own complexity, so
 * the report keeps its attribution without ranking it as an editable owner.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Measures geometry, decoded texture memory, lights, instances, fluids, and simulated drawables into one complete inventory.
 * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Reports the conservative one-frame peak per metric and its semantic owner without substituting an average or whole-film total.
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-identity Charges each enabled shadow map and its opaque depth passes to the stable id of the light that casts them.
 * @evidence requirements/lighting/budgets-and-representation.md#lighting-budget-cost-model Separates light population, shadow-map allocation, and the additional opaque draws induced by each shadow source.
 * @evidence requirements/production-design/budgets-and-feasibility.md#production-design-worst-case-budget Computes conservative one-frame geometry, population, simulation, memory, light, shadow, and draw costs instead of averaging them over the film.
 * @evidence requirements/production-design/budgets-and-feasibility.md#production-design-budget-measurement-status Separates exact or conservative totals from explicit unsupported and not-run gaps rather than counting an unmeasured cost as zero.
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-admission-estimate Produces the exact or conservative one-frame resource totals, dominant semantic owners, and explicit unmeasured gaps needed before render admission.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Produces exact counts or stated conservative upper bounds and explicit unsupported or not-run gaps for preflight.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Preserves the casting source identity in the staged branch of shadow-cost accounting.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-light-budget-selection Accounts for lights and their downstream shadow passes as distinct bounded cost dimensions.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-budget-measurement-worst-case Produces the one-frame conservative render-cost observation and explicit analysis-gap subset of worst-case budget measurement.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-budget-admission-estimate Implements the render-domain estimate subset without claiming queue, concurrency, or runtime enforcement ownership.
 * @evidence requirements/map/scale-and-populations.md#map-population-bound `measureAutoMovieRenderInventory` counts the realized subject population and attributes its conservative one-frame cost to stable semantic owners before rendering.
 * @evidence specifications/world-and-site/partition-lod-streaming-and-seams.md#world-site-population-bound-determinism The inventory supplies the deterministic realized-population and dominant-owner measurement subset without claiming world streaming or partition lifecycle.
 * @author Samchon
 */
export const measureAutoMovieRenderInventory = (props: {
  /** The drawable world. */
  subject: IAutoMovieRenderSubject;
  /** Semantic palette derived from the same subject. */
  mask: IAutoMovieSemanticMask;
}): IAutoMovieRenderInventory => {
  const { subject, mask } = props;
  const nodeIndex = autoMovieSemanticMaskNodeIndex(mask);
  const byId = new Map(subject.models.map((model) => [model.id, model]));
  const model = (id: string, cited: string): IAutoMovieModel => {
    const found = byId.get(id);
    if (found === undefined)
      throw new Error(
        `render inventory cannot measure ${cited}: model "${id}" is absent from the subject's models`,
      );
    return found;
  };

  const costs = new Map<string, IAutoMovieRenderModelCost>();
  const owners: IAutoMovieRenderOwnerCost[] = [];
  const gaps: IAutoMovieRenderAnalysisGap[] = [];
  const drawnModels = new Set<string>();
  const flattenedModels = new Set<string>();
  const add = (
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
  const materials = new Map<string, IAutoMovieMaterial>();
  let defaultMaterials = 0;
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
  const cite = (
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
    let found: IAutoMovieMaterial;
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
    if (!materials.has(material)) materials.set(material, found);
  };

  const population = measureRenderPopulation({
    subject,
    nodeIndex,
    model,
    costs,
    drawnModels,
    flattenedModels,
    add,
  });
  const { space, groundBytes, instanceChunks } = population;
  const simulation = measureRenderSimulation({
    ...population,
    subject,
    gaps,
    add,
    cite,
  });
  let { triangles, drawCalls } = simulation;
  const {
    vertices,
    instanceSlots,
    simulatedNodes,
    simulatedBytes,
    fluidCells,
    fluidParticles,
    unmeasured,
    unsolved,
  } = simulation;

  // --- materials and textures ----------------------------------------------
  for (const id of drawnModels)
    for (const material of byId.get(id)!.materials)
      if (!materials.has(material.id)) materials.set(material.id, material);
  const textureMaterials = new Map<string, Set<string>>();
  for (const material of materials.values()) {
    add(
      `material:${material.id}`,
      `models[].materials["${material.id}"]`,
      "materials",
      1,
    );
    for (const asset of texturesOf(material)) {
      const bucket = textureMaterials.get(asset);
      if (bucket === undefined)
        textureMaterials.set(asset, new Set([material.id]));
      else bucket.add(material.id);
    }
  }
  const sizes = new Map(
    (subject.textures ?? []).map((texture) => [texture.asset, texture]),
  );
  const missing: string[] = [];
  const textures: IAutoMovieRenderTextureCost[] = [...textureMaterials.keys()]
    .sort(compareAutoMovieRenderIds)
    .map((asset) => {
      const size = sizes.get(asset);
      if (size === undefined) missing.push(asset);
      const bytes =
        size === undefined
          ? null
          : Math.round(
              size.width *
                size.height *
                AUTOMOVIE_TEXEL_BYTES *
                (size.mipmapped ? 4 / 3 : 1),
            );
      if (bytes !== null)
        add(`texture:${asset}`, `assets["${asset}"]`, "textureBytes", bytes);
      add(`texture:${asset}`, `assets["${asset}"]`, "textures", 1);
      return {
        asset,
        materials: [...textureMaterials.get(asset)!].sort(
          compareAutoMovieRenderIds,
        ),
        bytes,
      };
    });
  if (missing.length !== 0)
    gaps.push({
      metric: "textureBytes",
      status: "not-run",
      reason: `${missing.length} bound texture asset(s) have no supplied dimensions, starting with "${missing.sort(compareAutoMovieRenderIds)[0]!}"`,
      remedy:
        "pass every bound asset's decoded width, height and mipmap policy in the subject's textures list",
    });

  // --- geometry memory ------------------------------------------------------
  let geometryBytes = groundBytes + simulatedBytes;
  for (const id of [...drawnModels].sort(compareAutoMovieRenderIds)) {
    const cost = costs.get(id)!;
    if (flattenedModels.has(id)) {
      // Flattening mixed RGB/bare parts gives every vertex a white-default RGB
      // triple. Count that resident padding once per prototype, not per slot.
      const coloredComponents = byId
        .get(id)!
        .parts.reduce(
          (sum, part) =>
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
    }
    geometryBytes += cost.geometryBytes;
    add(`model:${id}`, `models["${id}"]`, "geometryBytes", cost.geometryBytes);
  }

  // --- lights and shadow maps ----------------------------------------------
  const shadowsEnabled = subject.scene.environment?.shadows.enabled ?? true;
  const casters: string[] = [];
  for (const light of subject.scene.lights) {
    add(`light:${light.id}`, `scene.lights["${light.id}"]`, "lights", 1);
    // A rectangular area source is analytically integrated and rasterizes no
    // shadow camera, so it can never add a map however it is flagged.
    if (light.type === "area" || light.castShadow !== true || !shadowsEnabled)
      continue;
    casters.push(light.id);
    add(`light:${light.id}`, `scene.lights["${light.id}"]`, "shadowMaps", 1);
  }
  // Each shadow map is one further depth pass over every opaque draw already
  // counted, and the environment background costs one full-screen draw. A pass
  // row is marked as one: its cost is by construction the sum of every drawable
  // before it, so the report has to keep it in the total and state the caster
  // separately without ranking that aggregate as the owner's own complexity.
  const shadowMaps = casters.length;
  const opaqueDraws = drawCalls;
  const opaqueTriangles = triangles;
  for (const caster of casters) {
    drawCalls += opaqueDraws;
    triangles += opaqueTriangles;
    add(
      `light:${caster}`,
      `scene.lights["${caster}"]`,
      "drawCalls",
      opaqueDraws,
      "pass",
    );
    add(
      `light:${caster}`,
      `scene.lights["${caster}"]`,
      "triangles",
      opaqueTriangles,
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
  const image = subject.scene.environment?.image ?? null;
  if (image !== null) {
    drawCalls += 1;
    triangles += 2;
    add(`texture:${image}`, "scene.environment.image", "drawCalls", 1);
    add(`texture:${image}`, "scene.environment.image", "triangles", 2);
  }

  const nodes =
    subject.scene.nodes.length + (space === null ? 0 : 1) + simulatedNodes;
  // A cluster whose drawn prototype nobody stated leaves an unknown share of
  // the geometry out, so the totals it belongs to are absent rather than a sum
  // that reads complete while missing a fern bed.
  const partial = unmeasured.length !== 0;
  const totals: IAutoMovieRenderTotals = {
    triangles: partial ? null : triangles,
    vertices: partial ? null : vertices,
    drawCalls,
    materials: materials.size + defaultMaterials,
    textures: textures.length,
    textureBytes: missing.length !== 0 ? null : sumBytes(textures),
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
    models: [...costs.values()].sort((left, right) =>
      compareAutoMovieRenderIds(left.model, right.model),
    ),
    textures,
    instanceSets: (subject.instanceSets ?? [])
      .map((instanceSet) => ({
        instanceSet: instanceSet.id,
        slots: instanceSet.count,
        chunks: instanceSet.chunks.length,
        prototypes: (instanceSet.prototypes ?? [null]).length,
        drawCallUpperBound: owners
          .filter(
            (entry) =>
              entry.owner === `instance-set:${instanceSet.id}` &&
              entry.metric === "drawCalls",
          )
          .reduce((sum, entry) => sum + entry.cost, 0),
      }))
      .sort((left, right) =>
        compareAutoMovieRenderIds(left.instanceSet, right.instanceSet),
      ),
    totals,
    owners: owners.sort(
      (left, right) =>
        compareAutoMovieRenderIds(left.owner, right.owner) ||
        compareAutoMovieRenderIds(left.metric, right.metric),
    ),
    gaps,
  };
};
const sumBytes = (textures: readonly IAutoMovieRenderTextureCost[]): number =>
  textures.reduce((sum, texture) => sum + texture.bytes!, 0);
