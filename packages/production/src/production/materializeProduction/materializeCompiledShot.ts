import { type IAutoMovieCompiledEffect, type IAutoMovieSceneNode, type IAutoMovieTransform, type IAutoMovieExplicitInstanceTransform, type IAutoMovieCompiledFormationLod, type IAutoMovieCompiledInstancePrototype, IAutoMovieCompiledFormation, IAutoMovieCompiledInstanceSet, IAutoMovieCompiledShotSource, IAutoMovieFormationDesign, IAutoMovieModel, IAutoMovieModelRecipe, IAutoMovieShotContract, IAutoMovieShotSourceOutput, IAutoMovieWorldDesign } from "@automovie/interface";
import { materializeCompiledEffects, materializeCompiledFormation } from "@automovie/engine";
import { compareCodeUnits } from "../contentIdentity";

/**
 * Join a cloned shot source with current effects, explicit heroes and compact formation/instance populations.
 *
 * @evidence contracts/common.md#principled-implementation Clones authored source, compiles effects, reuses supplied formation inventory or compiles it against world surfaces/radii, applies hero runtime models/transforms and gathers exactly referenced runtime/authored/LOD models.
 * @evidence contracts/common.md#clear-and-simple-design Shot composition owns source joining and reserved-id collision reporting; population layout, terrain placement and effect simulation remain engine responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anonymous members remain compact rather than expanded nodes. Missing formation/model facts keep existing skip behavior, and unknown referenced models are omitted for later gates; returned runtime models, compiled populations and hero transforms can remain borrowed references.
 * @evidence contracts/common.md#meaningful-documentation States source cloning, shared versus fallback population compilation, reserved slot ids, missing-input behavior and borrowed output references.
 * @evidence contracts/performance.md#efficient-algorithms Includes source clone/effect compilation and fallback formation costs. Formation/instance collision checks scan source nodes per population; referenced models are deduplicated and sorted, with cost driven by nodes, heroes, LODs and prototypes.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses supplied compiled formations and runtime models within the build; fallback formation compilation occurs only when no inventory entry is supplied, without a new cross-shot cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller owns cloned source arrays and result containers, while selected runtime models/population metadata and hero transforms retain their supplying owner's lifetime; no renderer or GPU buffer is allocated here.
 *
 * @author Samchon
 */
export function materializeCompiledShot(props: {
  /** Admitted shot participants and duration used by effect/population composition. */
  contract: IAutoMovieShotContract;

  /** Current declared formations addressed by participant id. */
  formations: ReadonlyMap<string, IAutoMovieFormationDesign>;

  /** Shared compiled entries; an absent selected entry invokes the existing engine fallback. */
  formationRuntime?: Readonly<Record<string, IAutoMovieCompiledFormation>>;

  /** Already-compiled general instance populations, omitted for none. */
  instanceSetRuntime?: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;

  /** Recipe/LOD metadata passed only when a formation is compiled here. */
  modelRecipes?: ReadonlyMap<string, IAutoMovieModelRecipe>;

  /** Build-owned runtime models; selected result objects can remain borrowed. */
  runtimeModels: ReadonlyMap<string, IAutoMovieModel>;

  /** Current effect/world data and the same terrain surfaces as shared population compilation. */
  world: IAutoMovieWorldDesign;

  /** Admitted positive frames per second; effects use its reciprocal fixed step in seconds. */
  fps: number;

  /** Authored shot output cloned before scene-node mutation; authored model ids override matching runtime ids in the result lookup. */
  source: IAutoMovieShotSourceOutput;

  /** Member radius in metres keyed by recipe id, for a formation compiled here. */
  projectionRadii?: ReadonlyMap<string, number>;
}): {
  value: IAutoMovieCompiledShotSource;
  collisions: string[];
} {
  const source: IAutoMovieShotSourceOutput = structuredClone(props.source);
  const effects: IAutoMovieCompiledEffect[] = materializeCompiledEffects({
    contract: props.contract,
    world: props.world,
    fixedStepSeconds: 1 / props.fps,
    cues: source.effectCues ?? [],
  });
  const nodes: Map<string, IAutoMovieSceneNode> = new Map(source.scene.nodes.map((node: IAutoMovieSceneNode) : [string, IAutoMovieSceneNode] => [node.id, node]));
  const collisions: string[] = [];
  const formations: IAutoMovieCompiledFormation[] = [];
  for (const participant of props.contract.participants) {
    if (participant.kind !== "formation") continue;
    const formation: IAutoMovieFormationDesign | undefined = props.formations.get(participant.id);
    if (formation === undefined) continue;
    const compiled: IAutoMovieCompiledFormation =
      props.formationRuntime?.[participant.id] ??
      materializeCompiledFormation({
        formation,
        recipes: props.modelRecipes,
        projectionRadii: props.projectionRadii,
        // The terrain a member stands on, so a unit compiled here rather than
        // taken from the shared inventory is the same unit either way.
        surfaces: props.world.surfaces,
      });
    const runtimeModel: IAutoMovieModel | undefined = props.runtimeModels.get(formation.modelRecipe);
    if (runtimeModel === undefined) continue;
    formations.push(compiled);
    const ordinaryPrefix: string = `formation:${formation.id}:slot:`;
    for (const node of source.scene.nodes) {
      if (node.id.startsWith(ordinaryPrefix) === false) continue;
      const suffix: string = node.id.slice(ordinaryPrefix.length);
      const slot: number = Number(suffix);
      if (
        /^\d{6}$/.test(suffix) &&
        Number.isSafeInteger(slot) &&
        slot >= 0 &&
        slot < formation.count &&
        formation.heroOverrides.some((hero: { slot: number; actor: string; }) : boolean => hero.slot === slot) === false
      )
        collisions.push(node.id);
    }
    for (const hero of compiled.heroes) {
      const existing: IAutoMovieSceneNode | undefined = nodes.get(hero.actor);
      if (existing !== undefined) {
        existing.model = runtimeModel.id;
        existing.transform = hero.transform;
        continue;
      }
      const node: { id: string; model: string; transform: IAutoMovieTransform; motion: null; pose: null; } = {
        id: hero.actor,
        model: runtimeModel.id,
        transform: hero.transform,
        motion: null,
        pose: null,
      };
      source.scene.nodes.push(node);
      nodes.set(node.id, node);
    }
  }
  for (const instanceSet of Object.values(props.instanceSetRuntime ?? {})) {
    const ordinaryPrefix: string = `instance:${instanceSet.id}:slot:`;
    const explicitIds: Set<string> = new Set(
      instanceSet.layout.kind === "explicit"
        ? instanceSet.layout.transforms.map(
            (transform: IAutoMovieExplicitInstanceTransform) : string => `instance:${instanceSet.id}:${transform.id}`,
          )
        : [],
    );
    for (const node of source.scene.nodes) {
      if (explicitIds.has(node.id)) {
        collisions.push(node.id);
        continue;
      }
      if (node.id.startsWith(ordinaryPrefix) === false) continue;
      const suffix: string = node.id.slice(ordinaryPrefix.length);
      const slot: number = Number(suffix);
      if (
        /^\d{6}$/.test(suffix) &&
        Number.isSafeInteger(slot) &&
        slot >= 0 &&
        slot < instanceSet.count
      )
        collisions.push(node.id);
    }
  }
  const modelByRuntimeId: Map<string, IAutoMovieModel> = new Map(
    [...props.runtimeModels.values()].map((model: IAutoMovieModel) : [string, IAutoMovieModel] => [model.id, model]),
  );
  for (const model of source.authoredModels ?? [])
    modelByRuntimeId.set(model.id, model);
  const models: IAutoMovieModel[] = [
    ...new Set([
      ...source.scene.nodes.map((node: IAutoMovieSceneNode) : string => node.model),
      ...formations.flatMap((formation: IAutoMovieCompiledFormation) : string[] =>
        formation.lod.map((lod: IAutoMovieCompiledFormationLod) : string => lod.model),
      ),
      ...Object.values(props.instanceSetRuntime ?? {}).flatMap((instanceSet: IAutoMovieCompiledInstanceSet) : string[] =>
        (instanceSet.prototypes ?? [{ lod: instanceSet.lod }]).flatMap(
          (prototype: IAutoMovieCompiledInstancePrototype | { lod: IAutoMovieCompiledFormationLod[]; }) : string[] => prototype.lod.map((lod: IAutoMovieCompiledFormationLod) : string => lod.model),
        ),
      ),
    ]),
  ]
    .sort(compareCodeUnits)
    .flatMap((id: string) : IAutoMovieModel[] => {
      const model: IAutoMovieModel | undefined = modelByRuntimeId.get(id);
      return model === undefined ? [] : [model];
    });
  return {
    value: {
      ...source,
      formationMotions: source.formationMotions ?? [],
      formationSlotMotions: source.formationSlotMotions ?? [],
      effects,
      models,
      formations,
      instanceSets: Object.values(props.instanceSetRuntime ?? {}).sort(
        (left: IAutoMovieCompiledInstanceSet, right: IAutoMovieCompiledInstanceSet) : number => compareCodeUnits(left.id, right.id),
      ),
    },
    collisions,
  };
}
