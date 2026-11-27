import { AutoMovieEngineSubjects, AutoMovieEngineQuaternion, AutoMovieEngineTransform, AutoMovieEngineBuiltEnvironmentWorkflow, AutoMovieEngineFilm, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentItem,
  IAutoMovieEnvironmentRecipe,
  IAutoMovieEnvironmentSupportReport,
  IAutoMovieModel,
  IAutoMoviePropSpec,
  IAutoMovieSpace,
  IAutoMovieStageSetPiece,
  IAutoMovieSubjectContribution,
  IAutoMovieTransform,
  IAutoMovieValidation,
  IAutoMovieVector3,
  IAutoMovieWallMount,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { deriveArchetypeSeed } from "../../core/internal/deriveArchetypeSeed";
import { requireEnvironmentFrame } from "./requireEnvironmentFrame";

/*
 * Place typed modules and prepare the stage and runtime pieces a shot uses.
 *
 * Item keys are stable within the recipe. References address an item's origin
 * or its named anchors. Each module is evaluated once after its inputs resolve.
 * Emitted arrays keep source item order even when a reference is forward.
 * Parameter recipe: Named items, optional seed and optional rigid world frame.
 * Returns: The stage set and space, compile runtime records, architectural
 * records, named world frames and the support of every set piece, judged
 * against the merged space, the other pieces, the walls furnishing relations
 * hung pieces on and each building's own sweep at its placement height.
 * For malformed identity or placement, missing or cyclic references,
 * conflicting emitted identities or invalid support or prop declarations.
 */
export function createEnvironment(
  recipe: IAutoMovieEnvironmentRecipe,
): IAutoMovieEnvironment {
  requirePath(recipe.id, "$input.id");
  const root: IAutoMovieTransform = recipe.frame ?? AutoMovieEngineTransform.identity();
  requireEnvironmentFrame(root, "$input.frame");

  const items: Map<string, IAutoMovieEnvironmentItem> = new Map(
    Object.entries(recipe.items),
  );
  for (const key of items.keys()) {
    if (key.includes("/"))
      throw new Error(
        `${itemPath(key)}: item keys must be single path segments`,
      );
    requirePath(key, itemPath(key));
  }

  const frames: Map<string, IAutoMovieTransform> = new Map();
  const resolved: Map<string, IAutoMovieEnvironmentContribution> = new Map();
  const stack: Set<string> = new Set();

  /*
   * Read a referenced item's origin or named anchor with the caller's
   * diagnostic path.
   */
  function anchor(reference: string, caller: string): IAutoMovieTransform {
    requirePath(reference, caller);
    const separator: number = reference.indexOf("/");
    const key: string =
      separator === -1 ? reference : reference.slice(0, separator);
    if (separator === -1) return place(key, caller);
    const name: string = reference.slice(separator + 1);
    const entries: IAutoMovieEnvironmentContribution["anchors"] = resolve(
      key,
      caller,
    ).anchors;
    if (entries === undefined || !Object.hasOwn(entries, name))
      throw new Error(`${caller}: unknown environment anchor "${reference}"`);
    return entries[name]!;
  }

  /*
   * Require a declared item, keeping the referring source path in a refusal.
   */
  function requireItem(key: string, caller: string): IAutoMovieEnvironmentItem {
    const item: IAutoMovieEnvironmentItem | undefined = items.get(key);
    if (item === undefined)
      throw new Error(`${caller}: unknown environment item "${key}"`);
    return item;
  }

  /*
   * Track one active dependency and release it even when a producer refuses.
   */
  function withTask<Value>(
    task: string,
    caller: string,
    run: () => Value,
  ): Value {
    if (stack.has(task))
      throw new Error(
        `${caller}: environment reference cycle ${[...stack, task].join(" -> ")}`,
      );
    stack.add(task);
    try {
      return run();
    } finally {
      stack.delete(task);
    }
  }

  /*
   * Resolve an item's world pose independently of geometry built at that pose.
   */
  function place(key: string, caller: string): IAutoMovieTransform {
    const existing: IAutoMovieTransform | undefined = frames.get(key);
    if (existing !== undefined) return existing;
    const task: string = `${key}/placement`;
    const item: IAutoMovieEnvironmentItem = requireItem(key, caller);
    return withTask(task, caller, (): IAutoMovieTransform => {
      const path: string = itemPath(key);
      const at: IAutoMovieEnvironmentItem["at"] = item.at;
      const localOrigin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      let offset: IAutoMovieVector3 = localOrigin;
      let parent: IAutoMovieTransform = root;
      if (at !== undefined) {
        if ("anchor" in at) {
          offset = at.offset ?? localOrigin;
          parent = anchor(at.anchor, `${path}.at`);
        } else offset = at;
      }
      const local: IAutoMovieTransform = AutoMovieEngineTransform.of(
        offset,
        item.rotation ?? AutoMovieEngineQuaternion.identity(),
      );
      requireEnvironmentFrame(local, `${path}.placement`);
      const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        parent,
        local,
      );
      requireEnvironmentFrame(frame, `${path}.frame`);
      frames.set(key, frame);
      return frame;
    });
  }

  /*
   * Resolve one contribution, evaluating its definition at most once.
   */
  function resolve(
    key: string,
    caller: string,
  ): IAutoMovieEnvironmentContribution {
    const existing: IAutoMovieEnvironmentContribution | undefined =
      resolved.get(key);
    if (existing !== undefined) return existing;
    const item: IAutoMovieEnvironmentItem = requireItem(key, caller);
    const frame: IAutoMovieTransform = place(key, caller);
    const task: string = `${key}/use`;
    const path: string = itemPath(key);
    return withTask(task, caller, (): IAutoMovieEnvironmentContribution => {
      const id: string = `${recipe.id}/${key}`;
      const contribution: IAutoMovieEnvironmentContribution = item.use({
        id,
        frame,
        seed:
          recipe.seed === undefined
            ? undefined
            : deriveArchetypeSeed(recipe.seed, id),
        anchor: (reference: string): IAutoMovieTransform =>
          anchor(reference, `${path}.use`),
      });
      for (const [name, value] of Object.entries(contribution.anchors ?? {})) {
        const anchorPath: string = `${path}.anchors[${JSON.stringify(name)}]`;
        requirePath(name, anchorPath);
        requireEnvironmentFrame(value, anchorPath);
      }
      resolved.set(key, contribution);
      return contribution;
    });
  }

  const anchors: Array<readonly [string, IAutoMovieTransform]> = [];
  const contributions: IAutoMovieEnvironmentContribution[] = [];
  const objectMotions: IAutoMovieClip[] = [];
  const mounts: IAutoMovieWallMount[] = [];
  const buildings: IAutoMovieEnvironmentSupportReport.IBuilding[] = [];
  for (const key of items.keys()) {
    const item: IAutoMovieEnvironmentContribution = resolve(key, itemPath(key));
    const frame: IAutoMovieTransform = place(key, itemPath(key));
    anchors.push([key, frame]);
    for (const [name, value] of Object.entries(item.anchors ?? {}))
      anchors.push([`${key}/${name}`, value]);
    contributions.push(item);
    for (const clip of item.objectMotions ?? []) objectMotions.push(clip);
    mounts.push(...(item.mounts ?? []));

    // A building's sweep grounds its bodies at its own placement height.
    for (const environment of item.builtEnvironments ?? [])
      buildings.push({ environment, groundY: frame.translation.y });
  }

  const merged: IAutoMovieSubjectContribution =
    AutoMovieEngineSubjects.mergeContributions(contributions);
  const set: readonly IAutoMovieStageSetPiece[] = merged.set ?? [];
  const props: readonly IAutoMoviePropSpec[] = merged.props ?? [];
  const builtEnvironments: readonly IAutoMovieBuiltEnvironment[] =
    merged.builtEnvironments ?? [];
  const models: Map<string, IAutoMovieModel> = new Map();
  for (const model of merged.models ?? []) {
    const prior: IAutoMovieModel | undefined = models.get(model.id);
    if (prior !== undefined && prior !== model)
      throw new Error(`$input.models: conflicting model "${model.id}"`);
    if (model.id.trim().length === 0)
      throw new Error("$input.models: model id must be nonblank");
    models.set(model.id, model);
  }
  requireUnique(
    set,
    (piece: IAutoMovieStageSetPiece): string => piece.node,
    "set",
  );
  requireUnique(
    builtEnvironments,
    (environment: IAutoMovieBuiltEnvironment): string => environment.id,
    "builtEnvironments",
  );
  requireUnique(
    objectMotions,
    (clip: IAutoMovieClip): string => clip.id,
    "objectMotions",
  );
  const piecesByModel: Map<string, number> = new Map();
  for (const piece of set)
    piecesByModel.set(piece.model, (piecesByModel.get(piece.model) ?? 0) + 1);
  for (const prop of props) {
    if (models.get(prop.node) !== prop.model)
      throw new Error(
        `$input.props: prop "${prop.node}" must publish its own model in the runtime`,
      );
    if (piecesByModel.get(prop.node) !== 1)
      throw new Error(
        `$input.props: prop "${prop.node}" must have exactly one staged model occurrence`,
      );
  }
  if (props.length !== 0)
    requireValid(AutoMovieEngineFilm.validatePropPlacements({ set, props, builtEnvironments }));

  const spaces: readonly IAutoMovieSpace[] = merged.spaces ?? [];
  requireUnique(spaces, (space: IAutoMovieSpace): string => space.id, "spaces");
  const space: IAutoMovieSpace | undefined =
    spaces.length !== 0 ? AutoMovieEngineBuiltEnvironmentWorkflow.mergeAutoMovieSpaces(recipe.id, spaces) : undefined;
  if (space !== undefined) requireValid(AutoMovieEngineValidation.validateSpace({ space }));

  const worldIds: ReadonlyArray<
    readonly [string, readonly { readonly id: string }[] | undefined]
  > = [
    ["surfaces", merged.surfaces],
    ["landmarks", merged.landmarks],
    ["routes", merged.routes],
    ["effectRecipes", merged.effectRecipes],
    ["effectZones", merged.effectZones],
    ["instanceSets", merged.instanceSets],
  ];
  for (const [label, values] of worldIds)
    requireUnique(
      values ?? [],
      (value: { readonly id: string }): string => value.id,
      `world.${label}`,
    );

  return {
    stage: {
      set: [...set],
      ...(space !== undefined ? { space } : {}),
    },
    runtime: {
      models: [...models.values()],
      props,
      objectMotions,
      world: {
        id: recipe.id,
        units: "meter",
        surfaces: [...(merged.surfaces ?? [])],
        landmarks: [...(merged.landmarks ?? [])],
        routes: [...(merged.routes ?? [])],
        effectRecipes: [...(merged.effectRecipes ?? [])],
        effectZones: [...(merged.effectZones ?? [])],
        ...(merged.instanceSets !== undefined
          ? { instanceSets: [...merged.instanceSets] }
          : {}),
      },
    },
    anchors: Object.fromEntries(anchors),
    builtEnvironments,
    support: AutoMovieEngineBuiltEnvironmentWorkflow.environmentSupportReport({
      set,
      models: [...models.values()],
      props,
      ...(space !== undefined ? { space } : {}),
      mounts,
      buildings,
    }),
  };
}

/*
 * Report a JSON-style item path even for source keys containing spaces or
 * quotes.
 */
function itemPath(key: string): string {
  return `$input.items[${JSON.stringify(key)}]`;
}

/*
 * Every authored path has at least one nonblank segment and no implicit
 * trimming.
 */
function requirePath(value: string, path: string): void {
  if (
    value
      .split("/")
      .some(
        (segment: string): boolean =>
          !segment.length || segment.trim() !== segment,
      )
  )
    throw new Error(`${path}: invalid environment path "${value}"`);
}

/*
 * Admit stable nonblank identities within a population of owned records.
 */
function requireUnique<Value>(
  values: readonly Value[],
  key: (value: Value) => string,
  label: string,
): void {
  const ids: Set<string> = new Set();
  for (const value of values) {
    const id: string = key(value);
    if (id.trim().length === 0 || ids.has(id))
      throw new Error(`$input.${label}: invalid or duplicate id "${id}"`);
    ids.add(id);
  }
}

/*
 * Keep the first error at the canonical support or prop gate's diagnostic path.
 */
function requireValid(validation: IAutoMovieValidation): void {
  if (validation.success) return;
  const error: IAutoMovieConstraintViolation | undefined =
    validation.violations.find(
      (violation: IAutoMovieConstraintViolation): boolean =>
        violation.severity !== "warning",
    );
  throw new Error(
    error === undefined
      ? "invalid environment"
      : `${error.path}: ${error.expected}`,
  );
}
