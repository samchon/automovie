import {
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltSpace,
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectChange,
  IAutoMovieSubjectDescription,
  IAutoMovieSubjectDiff,
  IAutoMovieSubjectDiffFanout,
} from "@automovie/interface";

import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";
import { autoMovieSubjectMemberSummary } from "./autoMovieSubjectMemberSummary";
import { AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE } from "./constants/AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE";
import { createAutoMovieSubjectPartIndex } from "./createAutoMovieSubjectPartIndex";
import { describeAutoMovieSubjects } from "./describeAutoMovieSubjects";
import { instancePrototypeChoices } from "./populationRuntime/instancePrototypeChoices";
import { selectInstancePrototype } from "./populationRuntime/selectInstancePrototype";
import { compareAutoMovieRenderIds } from "./render/compareAutoMovieRenderIds";

/**
 * Compare two compiled subject inventories without rendering either artifact.
 *
 * Added and removed subjects are exclusive. A common subject may be both moved
 * and reshaped when its placement and reusable structure changed together.
 * Placement is the description's transform, owner, space and prototype; shape
 * is the model record for a prototype, compiled or owned by a built
 * environment, the part record for a part, the population law for an instance
 * set, the unit or space record for a building or space, and the kind, model,
 * materials and member page for an element. Prototype consequences and
 * per-slot prototype changes remain aggregate counts instead of member-sized
 * change arrays: a changed prototype or part counts the elements and compact
 * members drawing its model in the revision that has it, the later one when
 * both do, and a common instance set counts the slots whose drawn prototype
 * differs, plus the slots added or removed.
 *
 * One absolute `tolerance` (default 1e-6) is applied to every number compared,
 * whether a metre, a scale factor, a count or a seed, and to rotations as
 * `1 - |cos(half the angle between them)|`. Subjects are matched by id, and
 * lists come out in render-id order. `unchanged` is a summary: the total plus
 * at most `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT` sampled ids. A negative or
 * non-finite tolerance throws a `RangeError`.
 *
 * @param beforeArtifact Compiled artifact of the earlier revision.
 * @param afterArtifact Compiled artifact of the later revision.
 * @param tolerance Absolute comparison tolerance, as described above.
 * @returns The classified changes and the unchanged summary.
 *
 * @evidence contracts/common.md#principled-implementation Matches stable subject addresses and compares placement and shape projections with tolerance-aware equality, including quaternion sign equivalence. Slot selections use the runtime weighted draw and JSON tuples of selection status, prototype and model, so delimiters inside ids cannot merge distinct identities; absent explicit prototypes are detected by table membership.
 * @evidence contracts/common.md#clear-and-simple-design The diff owns classification and fan-out only; descriptions come from `describeAutoMovieSubjects`, addresses from `autoMovieSubjectAddress`, paging from `autoMovieSubjectMemberSummary`, and the prototype table rule from `instancePrototypeChoices`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or model is special-cased; a missing explicit prototype is keyed as missing by an explicit membership test instead of by matching the text of the selection's error, and environment-owned models are compared like compiled ones.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the exclusivity rules, what placement and shape mean per kind, how each fan-out count is formed and from which revision, the tolerance and its rotation metric, the matching and ordering, the unchanged summary, and the failure.
 * @evidence contracts/performance.md#efficient-algorithms Inventory construction delegates geometry, placement and material measurement to describeAutoMovieSubjects, then O(S log S) orders subject ids and structural equality visits compared values. Each queried model's parts are indexed once, avoiding quadratic part lookup. Lazy usage costs O(sum of slot count times prototype count), since each weighted or explicit slot selection scans its table; common-slot changes do the same. Each returned member summary also copies and sorts its supplied ids, including repeated fanout summaries.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one call each revision's inventory and record indexes are built once; part indexes are built only for models whose part shapes are compared, and usage only for prototype or part fanout. First duplicate parts preserve the previous find rule, and no mutable artifact cache survives across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inventories, requested part indexes and usage tables are call-local, bounded by artifact subjects, queried parts, models and sets. The returned diff holds changed descriptions and one bounded unchanged sample; descriptions may borrow nested artifact records.
 */
export const diffAutoMovieSubjects: (
  beforeArtifact: IAutoMovieSubjectArtifact,
  afterArtifact: IAutoMovieSubjectArtifact,
  tolerance?: number,
) => IAutoMovieSubjectDiff = (
  beforeArtifact: IAutoMovieSubjectArtifact,
  afterArtifact: IAutoMovieSubjectArtifact,
  tolerance: number = AUTOMOVIE_SUBJECT_DIFF_DEFAULT_TOLERANCE,
): IAutoMovieSubjectDiff => {
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new RangeError(
      "Subject diff tolerance must be finite and non-negative.",
    );
  const before: IRevision = indexRevision(beforeArtifact);
  const after: IRevision = indexRevision(afterArtifact);
  const ids: string[] = [
    ...new Set([...before.inventory.keys(), ...after.inventory.keys()]),
  ].sort(compareAutoMovieRenderIds);
  const added: IAutoMovieSubjectChange[] = [];
  const removed: IAutoMovieSubjectChange[] = [];
  const moved: IAutoMovieSubjectChange[] = [];
  const reshaped: IAutoMovieSubjectChange[] = [];
  const unchanged: string[] = [];
  for (const id of ids) {
    const previous: IAutoMovieSubjectDescription | undefined =
      before.inventory.get(id);
    const next: IAutoMovieSubjectDescription | undefined =
      after.inventory.get(id);
    if (previous === undefined) {
      added.push(changeOf(null, next!, before, after));
      continue;
    }
    if (next === undefined) {
      removed.push(changeOf(previous, null, before, after));
      continue;
    }
    const placementChanged: boolean = !tolerantEqual(
      placementOf(previous),
      placementOf(next),
      tolerance,
    );
    const shapeChanged: boolean = !tolerantEqual(
      shapeOf(before, previous),
      shapeOf(after, next),
      tolerance,
    );
    if (!placementChanged && !shapeChanged) {
      unchanged.push(id);
      continue;
    }
    const change: IAutoMovieSubjectChange = changeOf(
      previous,
      next,
      before,
      after,
    );
    if (placementChanged) moved.push(change);
    if (shapeChanged) reshaped.push(change);
  }
  return {
    version: 1,
    fromRevision: beforeArtifact.revision,
    toRevision: afterArtifact.revision,
    tolerance,
    added,
    removed,
    moved,
    reshaped,
    unchanged: autoMovieSubjectMemberSummary(unchanged, 0),
  };
};

/** One revision indexed once for every comparison of a diff. */
interface IRevision {
  artifact: IAutoMovieSubjectArtifact;
  inventory: Map<string, IAutoMovieSubjectDescription>;
  models: Map<string, IAutoMovieModel>;
  partOf: ReturnType<typeof createAutoMovieSubjectPartIndex>;
  sets: Map<string, IAutoMovieCompiledInstanceSet>;
  records: Map<string, IAutoMovieBuildingUnit | IAutoMovieBuiltSpace>;
  usage: Map<string, IModelUsage> | null;
}

/** Where one runtime model is drawn in a revision. */
interface IModelUsage {
  elements: number;
  instances: number;
  sets: string[];
}

const indexRevision: (artifact: IAutoMovieSubjectArtifact) => IRevision = (
  artifact: IAutoMovieSubjectArtifact,
): IRevision => {
  const models: Map<string, IAutoMovieModel> = new Map();
  const records: Map<string, IAutoMovieBuildingUnit | IAutoMovieBuiltSpace> =
    new Map();
  for (const model of artifact.compiled.models) models.set(model.id, model);
  for (const environment of artifact.compiled.builtEnvironments ?? []) {
    for (const model of environment.models) models.set(model.id, model);
    for (const space of environment.spaces)
      records.set(
        autoMovieSubjectAddress("space", environment.id, space.id),
        space,
      );
    for (const building of environment.buildings)
      records.set(
        autoMovieSubjectAddress("building", environment.id, building.id),
        building,
      );
  }
  return {
    artifact,
    inventory: new Map(
      describeAutoMovieSubjects(artifact).map(
        (
          description: IAutoMovieSubjectDescription,
        ): [string, IAutoMovieSubjectDescription] => [
          description.id,
          description,
        ],
      ),
    ),
    models,
    partOf: createAutoMovieSubjectPartIndex(models),
    sets: new Map(
      artifact.compiled.instanceSets.map(
        (
          set: IAutoMovieCompiledInstanceSet,
        ): [string, IAutoMovieCompiledInstanceSet] => [
          autoMovieSubjectAddress("instance-set", set.id),
          set,
        ],
      ),
    ),
    records,
    usage: null,
  };
};

const placementOf: (description: IAutoMovieSubjectDescription) => unknown = (
  description: IAutoMovieSubjectDescription,
): unknown => ({
  transform: description.transform,
  owner: description.owner,
  space: description.space,
  prototype: description.prototype,
});

const shapeOf: (
  revision: IRevision,
  description: IAutoMovieSubjectDescription,
) => unknown = (
  revision: IRevision,
  description: IAutoMovieSubjectDescription,
): unknown => {
  if (description.kind === "prototype")
    return revision.models.get(description.model!);
  if (description.kind === "part")
    return revision.partOf(description.model!, description.id);
  if (description.kind === "element")
    return {
      semanticKind: description.semanticKind,
      model: description.model,
      materials: description.materials,
      members: description.members,
    };
  if (description.kind === "instance-set") {
    const set: IAutoMovieCompiledInstanceSet = revision.sets.get(
      description.id,
    )!;
    return {
      count: set.count,
      model: set.model,
      prototypes: set.prototypes,
      layout: set.layout,
      route: set.route,
      seed: set.seed,
      variation: set.variation,
    };
  }
  // A building unit's shape is the unit record: which element hierarchy covers
  // it and which space tree indexes it. Its extent is not read here, because
  // the elements it is measured over report their own movement; a unit would
  // otherwise be reshaped every time one wall it owns moved a millimetre.
  return revision.records.get(description.id);
};

const changeOf: (
  previous: IAutoMovieSubjectDescription | null,
  next: IAutoMovieSubjectDescription | null,
  before: IRevision,
  after: IRevision,
) => IAutoMovieSubjectChange = (
  previous: IAutoMovieSubjectDescription | null,
  next: IAutoMovieSubjectDescription | null,
  before: IRevision,
  after: IRevision,
): IAutoMovieSubjectChange => {
  const description: IAutoMovieSubjectDescription = (next ?? previous)!;
  return {
    id: description.id,
    kind: description.kind,
    before: previous,
    after: next,
    fanout: fanoutOf(description, previous, next, before, after),
  };
};

const fanoutOf: (
  description: IAutoMovieSubjectDescription,
  previous: IAutoMovieSubjectDescription | null,
  next: IAutoMovieSubjectDescription | null,
  before: IRevision,
  after: IRevision,
) => IAutoMovieSubjectDiffFanout = (
  description: IAutoMovieSubjectDescription,
  previous: IAutoMovieSubjectDescription | null,
  next: IAutoMovieSubjectDescription | null,
  before: IRevision,
  after: IRevision,
): IAutoMovieSubjectDiffFanout => {
  if (description.kind === "instance-set") {
    const from: IAutoMovieCompiledInstanceSet | undefined = before.sets.get(
      description.id,
    );
    const to: IAutoMovieCompiledInstanceSet | undefined = after.sets.get(
      description.id,
    );
    return {
      elements: 0,
      instances: 0,
      instanceSets: autoMovieSubjectMemberSummary([], 0),
      prototypeChanges:
        previous !== null &&
        next !== null &&
        from !== undefined &&
        to !== undefined
          ? changedPrototypeSelections(from, to)
          : 0,
    };
  }
  if (description.kind !== "prototype" && description.kind !== "part")
    return {
      elements: 0,
      instances: 0,
      instanceSets: autoMovieSubjectMemberSummary([], 0),
      prototypeChanges: 0,
    };
  const usage: IModelUsage | undefined = usageOf(
    next !== null ? after : before,
  ).get(description.model!);
  return {
    elements: usage?.elements ?? 0,
    instances: usage?.instances ?? 0,
    instanceSets: autoMovieSubjectMemberSummary(usage?.sets ?? [], 0),
    prototypeChanges: 0,
  };
};

/**
 * Every runtime model's elements, compact members and drawing sets in one
 * revision, computed on first use by regenerating each slot's selection once.
 */
const usageOf: (revision: IRevision) => Map<string, IModelUsage> = (
  revision: IRevision,
): Map<string, IModelUsage> => {
  if (revision.usage !== null) return revision.usage;
  const usage: Map<string, IModelUsage> = new Map();
  const entry: (model: string) => IModelUsage = (
    model: string,
  ): IModelUsage => {
    let found: IModelUsage | undefined = usage.get(model);
    if (found === undefined) {
      found = { elements: 0, instances: 0, sets: [] };
      usage.set(model, found);
    }
    return found;
  };
  for (const node of revision.artifact.compiled.scene.nodes)
    entry(node.model).elements += 1;
  for (const set of revision.artifact.compiled.instanceSets) {
    const drawn: Set<string> = new Set();
    for (let slot: number = 0; slot < set.count; ++slot) {
      const model: string | null = selectedPrototype(set, slot).model;
      if (model === null) continue;
      entry(model).instances += 1;
      drawn.add(model);
    }
    for (const model of drawn)
      entry(model).sets.push(autoMovieSubjectAddress("instance-set", set.id));
  }
  revision.usage = usage;
  return usage;
};

const changedPrototypeSelections: (
  before: IAutoMovieCompiledInstanceSet,
  after: IAutoMovieCompiledInstanceSet,
) => number = (
  before: IAutoMovieCompiledInstanceSet,
  after: IAutoMovieCompiledInstanceSet,
): number => {
  let changed: number = Math.abs(before.count - after.count);
  const common: number = Math.min(before.count, after.count);
  for (let slot: number = 0; slot < common; ++slot)
    if (
      selectedPrototype(before, slot).key !== selectedPrototype(after, slot).key
    )
      ++changed;
  return changed;
};

/**
 * The prototype one compiled slot draws, keyed with the runtime model it draws.
 *
 * The draw is the instance member's own weighted selection, so a diff counts a
 * prototype change exactly where a regenerated member changes prototype. A diff
 * compares revisions nobody validated for it, so an explicit member naming a
 * prototype its table lacks is read as that missing prototype, which equals
 * only the same missing name in another revision, and draws no model.
 */
const selectedPrototype: (
  set: IAutoMovieCompiledInstanceSet,
  slot: number,
) => { key: string; model: string | null } = (
  set: IAutoMovieCompiledInstanceSet,
  slot: number,
): { key: string; model: string | null } => {
  const explicit: string | undefined =
    set.layout.kind === "explicit"
      ? set.layout.transforms[slot]?.prototype
      : undefined;
  if (
    explicit !== undefined &&
    !instancePrototypeChoices(set).some(
      (choice: Pick<IAutoMovieCompiledInstancePrototype, "id">): boolean =>
        choice.id === explicit,
    )
  )
    return { key: JSON.stringify(["missing", explicit]), model: null };
  const selected:
    | IAutoMovieCompiledInstancePrototype
    | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight"> =
    selectInstancePrototype(set, slot, explicit);
  const model: string | null =
    ("lod" in selected ? selected.lod : set.lod)[0]?.runtimeModel ?? null;
  return { key: JSON.stringify(["selected", selected.id, model]), model };
};

/**
 * Structural equality with an absolute numeric tolerance. Two quaternion-shaped
 * records compare as rotations, so a sign flip is no change; arrays compare
 * element by element; records compare every key either side defines, ignoring
 * keys that are `undefined` on both.
 */
const tolerantEqual: (
  left: unknown,
  right: unknown,
  tolerance: number,
) => boolean = (left: unknown, right: unknown, tolerance: number): boolean => {
  if (typeof left === "number" && typeof right === "number")
    return Math.abs(left - right) <= tolerance;
  if (left === right) return true;
  if (
    left === null ||
    right === null ||
    left === undefined ||
    right === undefined
  )
    return false;
  if (isQuaternion(left) && isQuaternion(right)) {
    const leftLength: number = Math.hypot(left.x, left.y, left.z, left.w);
    const rightLength: number = Math.hypot(right.x, right.y, right.z, right.w);
    if (leftLength === 0 || rightLength === 0)
      return (
        Math.abs(left.x - right.x) <= tolerance &&
        Math.abs(left.y - right.y) <= tolerance &&
        Math.abs(left.z - right.z) <= tolerance &&
        Math.abs(left.w - right.w) <= tolerance
      );
    const dot: number =
      (left.x * right.x +
        left.y * right.y +
        left.z * right.z +
        left.w * right.w) /
      (leftLength * rightLength);
    return 1 - Math.abs(dot) <= tolerance;
  }
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((value: unknown, index: number): boolean =>
        tolerantEqual(value, right[index], tolerance),
      )
    );
  if (typeof left !== "object" || typeof right !== "object") return false;
  const leftRecord: Record<string, unknown> = left as Record<string, unknown>;
  const rightRecord: Record<string, unknown> = right as Record<string, unknown>;
  for (const key of new Set([
    ...Object.keys(leftRecord),
    ...Object.keys(rightRecord),
  ]))
    if (!tolerantEqual(leftRecord[key], rightRecord[key], tolerance))
      return false;
  return true;
};

const isQuaternion: (
  value: unknown,
) => value is { x: number; y: number; z: number; w: number } = (
  value: unknown,
): value is { x: number; y: number; z: number; w: number } => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const record: Record<string, unknown> = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 4 &&
    typeof record.x === "number" &&
    typeof record.y === "number" &&
    typeof record.z === "number" &&
    typeof record.w === "number"
  );
};
