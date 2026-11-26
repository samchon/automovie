import type {
  AutoMovieRenderMetric,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieMaterial,
  IAutoMovieMeasureRenderInventory,
  IAutoMovieModel,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderInventory,
  IAutoMovieRenderModelCost,
  IAutoMovieRenderOwnerCost,
  IAutoMovieRenderSubject,
  IAutoMovieRenderTargetSettings,
  IAutoMovieRenderTotals,
  IAutoMovieRenderWaterBody,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
  IAutoMovieSpace,
} from "@automovie/interface";

/**
 * Orchestrate conservative one-frame render costs for budgets and reports.
 * Create one model cache and resource closure, then count staged populations
 * and simulated drawables in order. Resolve materials/textures
 * (`measureRenderTextures`) and resident geometry
 * (`measureRenderGeometryBytes`) only after both phases have named their
 * resources. Measure a directly rendered film's stage targets and the passes it
 * adds over the opaque frame (`measureAutoMovieRenderFilmStage`), then add
 * light, shadow, outline, feed and background passes (`measureRenderPasses`)
 * before sorting attribution rows and emitting the report. Each phase continues
 * the previous counts without reordering floating-point addition. Owned caches
 * and owner rows are mutable; the input subject is not. Null totals preserve
 * declared analysis gaps rather than treating unknowns as zero. Display
 * geometry, resource bytes and whole-frame pass costs differ, so changing one
 * requires checking its consumer in the viewer and budget report.
 */

import { autoMovieSemanticMaskNodeIndex } from "./autoMovieSemanticMaskNodeIndex";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { measureAutoMovieRenderFilmStage } from "../measureAutoMovieRenderFilmStage";
import { measureRenderGeometryBytes } from "../measureRenderGeometryBytes";
import { measureRenderPasses } from "../measureRenderPasses";
import { measureRenderPopulation } from "./measureRenderPopulation";
import { measureRenderSimulation } from "./measureRenderSimulation";
import { measureRenderTextures } from "../measureRenderTextures";
import { resolveAutoMovieMaterial } from "../resolveAutoMovieMaterial";

/**
 * Measure what one frame of a subject commits the renderer to.
 *
 * Everything here is exact or an explicit upper bound, and the difference is
 * stated per metric rather than left to a reader:
 *
 * - Counts of nodes, lights, slots, chunks and materials are exact;
 * - Texture allocations use the conservative union of sampler, environment and
 *   shadow consumers. Uncertified identities/profiles or unsafe counts remain
 *   null rather than an invented exact native allocation population;
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
 * already counted, such as a shadow view's depth pass or the outline guide
 * pass, is marked `pass` rather than `own`. The pass belongs in the
 * conservative one-frame peak and its own identity is worth keeping, but its
 * cost is the sum of every drawable that preceded it rather than the owner's
 * own complexity, so the report keeps its attribution without ranking it as an
 * editable owner.
 */
export function measureAutoMovieRenderInventory(
  props: IAutoMovieMeasureRenderInventory.IProps,
): IAutoMovieRenderInventory {
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
  const {
    casters,
    textures,
    textureBytes,
    textureAllocations,
  }: measureRenderTextures.IResult = measureRenderTextures({
    subject,
    ...(props.settings === undefined ? {} : { settings: props.settings }),
    byId,
    drawnModels,
    materials,
    defaultMaterials,
    add,
    gaps,
  });

  // --- geometry memory ------------------------------------------------------
  const geometryBytes: number = measureRenderGeometryBytes({
    base: groundBytes + simulatedBytes,
    byId,
    drawnModels,
    flattenedModels,
    costs,
    add,
  });

  // --- film stage targets and passes, over the opaque frame -----------------
  const film: measureAutoMovieRenderFilmStage.IResult =
    measureAutoMovieRenderFilmStage({
      subject,
      ...(props.settings === undefined ? {} : { settings: props.settings }),
      drawCalls,
      triangles,
      casters,
      add,
      gaps,
    });

  // --- lights, shadow maps, outline, feeds and background -------------------
  const passes: measureRenderPasses.IResult = measureRenderPasses({
    subject,
    casters,
    drawCalls,
    triangles,
    add,
  });
  const { shadowMaps, feeds }: measureRenderPasses.IResult = passes;
  drawCalls = passes.drawCalls;
  triangles = passes.triangles;

  const nodes: number =
    subject.scene.nodes.length + (space === null ? 0 : 1) + simulatedNodes;
  // A cluster whose drawn prototype nobody stated leaves an unknown share of
  // the geometry out, so the totals it belongs to are absent rather than a sum
  // that reads complete while missing a fern bed.
  const partial: boolean = unmeasured.length !== 0;
  const totals: IAutoMovieRenderTotals = {
    triangles:
      partial || film.triangles === null ? null : triangles + film.triangles,
    vertices: partial ? null : vertices,
    drawCalls: film.drawCalls === null ? null : drawCalls + film.drawCalls,
    materials: materials.size + defaultMaterials,
    textures:
      textureAllocations === null || film.targets === null
        ? null
        : textureAllocations + feeds.targets + film.targets,
    textureBytes:
      textureBytes === null || film.bytes === null
        ? null
        : textureBytes + feeds.bytes + film.bytes,
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
}
