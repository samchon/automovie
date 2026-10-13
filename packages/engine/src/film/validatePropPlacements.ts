import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieClearanceBox,
  IAutoMoviePropBox,
  IAutoMoviePropRelation,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieForgedProp } from "./IAutoMovieForgedProp";
import { forgeProp } from "./forgeProp";
import { propBoxAxisIsSound } from "./propBoxAxisIsSound";
import { validatePropPlacementGeometry } from "./validatePropPlacementGeometry";
import { validatePropAffordanceTarget } from "./validatePropAffordanceTarget";
import { validatePropSupportCycles } from "./validatePropSupportCycles";

/** A registry record and its index in the list that declared it. */
interface IIndexed<Value> {
  value: Value;
  index: number;
}

type Environments = ReadonlyMap<
  string,
  readonly IIndexed<IAutoMovieBuiltEnvironment>[]
>;

type Props = ReadonlyMap<string, readonly IIndexed<IAutoMoviePropSpec>[]>;

type GeometryEntry = Parameters<
  typeof validatePropPlacementGeometry
>[0]["entries"][number];

type BuildingTarget = Exclude<
  IAutoMoviePropRelationTarget,
  IAutoMoviePropRelationTarget.IPropAffordance
>;

/** Which target kinds each relation kind accepts. */
const RELATION_TARGETS: Readonly<
  Record<
    IAutoMoviePropRelation["kind"],
    readonly IAutoMoviePropRelationTarget["kind"][]
  >
> = {
  "in-space": ["space"],
  "on-support": ["surface", "prop-affordance"],
  "against-boundary": ["boundary"],
  "fill-opening": ["opening"],
  attached: ["element", "prop-affordance"],
  suspended: ["element", "prop-affordance"],
};

/** How a building target kind is named in a refusal. */
const BUILDING_TARGET_LABELS: Readonly<Record<BuildingTarget["kind"], string>> =
  {
    space: "logical space",
    element: "building element",
    boundary: "boundary",
    opening: "opening",
    surface: "support surface",
  };

/**
 * Validate a source-owned prop registry, its unique staged join, its typed
 * building relations, its support graph, the bearing of every prop on the face
 * it says holds it up, and every transformed volume it claims.
 *
 * Registry construction is deliberately a separate first pass. A lamp may cite
 * a table declared later without changing the result, while duplicate prop,
 * set-piece, or building-environment identities stay explicit rather than
 * being hidden by `Map`'s last-write-wins behavior. Each prop is forged with
 * `forgeProp`, whose violations are re-rooted at the prop's path, and must be
 * staged by exactly one set piece drawing its model.
 *
 * A relation must cite a target kind its relation kind accepts, a target that
 * resolves, and, for a prop affordance, a different, uniquely declared prop
 * whose affordance has the kind the relation needs: `stack-top` to rest on,
 * `socket` to attach, `hook` to hang. A prop occupies at most one space and
 * fills at most one opening, every building relation stays in the occupied
 * space's environment, a supporting prop stays there too, and contact
 * relations may not form a cycle. Footprints and clearances need finite,
 * positive extents and clearance ids are non-blank and unique per prop.
 *
 * Two silences are contractual. A prop that omits `placement` claims no
 * relation and is claimed by none, so it takes part in no containment, overlap
 * or passage judgment of its own. And a geometric judgment, delegated to
 * `validatePropPlacementGeometry`, is only made where the record can answer
 * it, so a cell-less logical space, an opening whose fill has no model, and a
 * prop whose staged join is missing or ambiguous are reported as what they are
 * rather than silently failing a spatial test they cannot be measured against.
 *
 * Where a prop's appearance came from changes nothing here. A prop drawing an
 * external asset (`IAutoMoviePropSpec.modelRef`) forges like any other, so it
 * is contained, borne, cleared, and judged against passages through exactly
 * these rules, read off the deterministic proxy `propOccupancyBounds` measures
 * and the affordances its own spec declares.
 *
 * @evidence contracts/common.md#principled-implementation Indexes every registry by id into lists before judging, so references resolve independent of declaration order and duplicates stay visible; relation targets are checked against a closed kind table, support cycles by `validatePropSupportCycles`' depth-first search, and geometry only for props whose forging, staging and footprint are sound.
 * @evidence contracts/common.md#clear-and-simple-design This file owns the registry, the staged join and the relation graph; volume judgments live in `validatePropPlacementGeometry`, prop-to-prop contact in `validatePropAffordanceTarget`, cycles in `validatePropSupportCycles`, forging in `forgeProp`, and the box-axis rule in `propBoxAxisIsSound`, so each rule has one owner and this gate reads as the list of checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicates and ambiguous references are reported rather than resolved by last-write-wins, unsound props are excluded from geometry so one fault is reported once, and no prop, model, building or relation kind is special-cased beyond the closed kind and affordance tables.
 * @evidence contracts/common.md#meaningful-documentation States every registry, join, relation, cycle and box rule, the two contractual silences, the delegation of geometry, and that external appearances are judged by the same rules.
 * @evidence contracts/performance.md#efficient-algorithms Linear indexing of props, set pieces and environments, then per-relation constant-time map lookups plus linear scans of one environment's id lists, a support-cycle search in `validatePropSupportCycles` linear in props and contact relations, and the geometry pass's `O(S²)` box tests over the tens of props a shot stages.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One validation per call; production runs it once per shot compile and every index is rebuilt from that shot's registry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the indexes and collector die with the call and the returned violations belong to the caller.
 */
export const validatePropPlacements = (props: {
  props: readonly IAutoMoviePropSpec[];
  set: readonly IAutoMovieStageSetPiece[];
  builtEnvironments: readonly IAutoMovieBuiltEnvironment[];
}): IAutoMovieValidation => {
  const out: ViolationCollector = new ViolationCollector();
  const byNode: Props = indexBy(
    props.props,
    (prop: IAutoMoviePropSpec): string => prop.node,
  );
  const setByNode: ReadonlyMap<
    string,
    readonly IIndexed<IAutoMovieStageSetPiece>[]
  > = indexBy(props.set, (piece: IAutoMovieStageSetPiece): string => piece.node);
  const environments: Environments = indexBy(
    props.builtEnvironments,
    (environment: IAutoMovieBuiltEnvironment): string => environment.id,
  );
  const unique: Map<string, IAutoMovieBuiltEnvironment> = new Map();
  for (const [id, matches] of environments)
    if (matches.length === 1) unique.set(id, matches[0]!.value);

  reportDuplicates(byNode, "$input.props", "node", "prop node", out);
  reportDuplicates(setByNode, "$input.set", "node", "staged set node", out);
  reportDuplicates(
    environments,
    "$input.builtEnvironments",
    "id",
    "built environment id",
    out,
  );

  const entries: GeometryEntry[] = props.props.map(
    (prop: IAutoMoviePropSpec, index: number): GeometryEntry => {
      const path: string = `$input.props[${index}]`;
      const forged: IAutoMovieForgedProp = forgeProp(prop);
      if (forged.success === false)
        for (const violation of forged.violations)
          out.items.push({
            ...violation,
            path: violation.path.replace("$input", path),
          });
      const pieces: readonly IIndexed<IAutoMovieStageSetPiece>[] =
        setByNode.get(prop.node) ?? [];
      if (pieces.length === 0)
        out.push(
          "type",
          `${path}.node`,
          `prop "${prop.node}" needs one staged set placement`,
          prop.node,
        );
      else if (pieces.length === 1 && pieces[0]!.value.model !== prop.model.id)
        out.push(
          "type",
          `$input.set[${pieces[0]!.index}].model`,
          `staged prop "${prop.node}" uses model "${pieces[0]!.value.model}" instead of "${prop.model.id}"`,
          pieces[0]!.value.model,
        );
      return {
        prop,
        index,
        piece: pieces.length === 1 ? pieces[0]!.value : undefined,
        forged: forged.success,
        // The prop indexed itself, so its own bucket always exists.
        unique: byNode.get(prop.node)!.length === 1,
        located: locatedEnvironment(prop, unique),
      };
    },
  );

  props.props.forEach((prop: IAutoMoviePropSpec, index: number): void => {
    if (prop.placement !== undefined)
      validatePlacement({ value: prop, index }, environments, unique, byNode, out);
  });
  validatePropSupportCycles(props.props, out);
  validatePropPlacementGeometry({ entries, environments: unique, out });
  return out.toValidation();
};

/** The environment a prop's `in-space` relation names, when declared exactly once. */
const locatedEnvironment = (
  prop: IAutoMoviePropSpec,
  unique: ReadonlyMap<string, IAutoMovieBuiltEnvironment>,
): IAutoMovieBuiltEnvironment | null => {
  for (const relation of prop.placement?.relations ?? [])
    if (relation.kind === "in-space" && relation.target.kind === "space")
      return unique.get(relation.target.environment) ?? null;
  return null;
};

/** The relation, box and clearance-id rules of one placement. */
const validatePlacement = (
  entry: IIndexed<IAutoMoviePropSpec>,
  environments: Environments,
  unique: ReadonlyMap<string, IAutoMovieBuiltEnvironment>,
  props: Props,
  out: ViolationCollector,
): void => {
  const prop: IAutoMoviePropSpec = entry.value;
  const path: string = `$input.props[${entry.index}]`;
  const placement: NonNullable<IAutoMoviePropSpec["placement"]> =
    prop.placement!;
  const located: IAutoMovieBuiltEnvironment | null = locatedEnvironment(
    prop,
    unique,
  );
  const seen: Set<string> = new Set<string>();
  let spaces: number = 0;
  let openings: number = 0;

  placement.relations.forEach(
    (relation: IAutoMoviePropRelation, index: number): void => {
      const rp: string = `${path}.placement.relations[${index}]`;
      const key: string = relationKey(relation);
      if (seen.has(key))
        out.push(
          "type",
          rp,
          `relation "${relation.kind}" is declared twice for the same target`,
          key,
        );
      seen.add(key);
      if (relation.kind === "in-space" && ++spaces > 1)
        out.push(
          "type",
          `${rp}.kind`,
          "a prop occupies at most one logical space",
          relation.kind,
        );
      if (relation.kind === "fill-opening" && ++openings > 1)
        out.push(
          "type",
          `${rp}.kind`,
          "a prop fills at most one opening",
          relation.kind,
        );
      if (!RELATION_TARGETS[relation.kind].includes(relation.target.kind)) {
        out.push(
          "type",
          `${rp}.target.kind`,
          `relation "${relation.kind}" does not accept a "${relation.target.kind}" target`,
          relation.target.kind,
        );
        return;
      }
      const target: IAutoMoviePropRelationTarget = relation.target;
      if (target.kind !== "prop-affordance") {
        validateBuildingTarget(target, rp, environments, out);
        if (located !== null && target.environment !== located.id)
          out.push(
            "type",
            `${rp}.target.environment`,
            `relation environment "${target.environment}" differs from occupied space environment "${located.id}"`,
            target.environment,
          );
        return;
      }
      const matches: readonly IIndexed<IAutoMoviePropSpec>[] =
        props.get(target.prop) ?? [];
      validatePropAffordanceTarget(
        { relation, target, path: rp, node: prop.node, matches },
        out,
      );
      if (matches.length !== 1 || located === null) return;
      const supporting: IAutoMovieBuiltEnvironment | null =
        locatedEnvironment(matches[0]!.value, unique);
      if (supporting !== null && supporting.id !== located.id)
        out.push(
          "type",
          `${rp}.target.prop`,
          `prop "${target.prop}" occupies environment "${supporting.id}" instead of "${located.id}"`,
          target.prop,
        );
    },
  );

  if (placement.footprint !== null)
    validateBox(placement.footprint, `${path}.placement.footprint`, out);
  const ids: Set<string> = new Set<string>();
  placement.clearance.forEach(
    (clearance: IAutoMovieClearanceBox, index: number): void => {
      const cp: string = `${path}.placement.clearance[${index}]`;
      out.nonEmpty(`${cp}.id`, clearance.id, "clearance id");
      if (ids.has(clearance.id))
        out.push(
          "type",
          `${cp}.id`,
          `clearance id "${clearance.id}" is duplicated`,
          clearance.id,
        );
      ids.add(clearance.id);
      validateBox(clearance, cp, out);
    },
  );
};

/** Gate a relation that cites the architecture graph. */
const validateBuildingTarget = (
  target: BuildingTarget,
  rp: string,
  environments: Environments,
  out: ViolationCollector,
): void => {
  const matches: readonly IIndexed<IAutoMovieBuiltEnvironment>[] =
    environments.get(target.environment) ?? [];
  if (matches.length !== 1) {
    out.push(
      "type",
      `${rp}.target.environment`,
      matches.length === 0
        ? `built environment "${target.environment}" does not resolve`
        : `built environment "${target.environment}" is ambiguous`,
      target.environment,
    );
    return;
  }
  const environment: IAutoMovieBuiltEnvironment = matches[0]!.value;
  const id: string = targetId(target);
  const declared: boolean =
    target.kind === "space"
      ? environment.spaces.some(
          (item: IAutoMovieBuiltEnvironment["spaces"][number]): boolean =>
            item.id === id,
        )
      : target.kind === "element"
        ? environment.elements.some(
            (item: IAutoMovieBuiltEnvironment["elements"][number]): boolean =>
              item.id === id,
          )
        : target.kind === "boundary"
          ? environment.boundaries.some(
              (
                item: IAutoMovieBuiltEnvironment["boundaries"][number],
              ): boolean => item.id === id,
            )
          : target.kind === "opening"
            ? environment.openings.some(
                (
                  item: IAutoMovieBuiltEnvironment["openings"][number],
                ): boolean => item.id === id,
              )
            : environment.surfaces.some(
                (
                  item: IAutoMovieBuiltEnvironment["surfaces"][number],
                ): boolean => item.surface.id === id,
              );
  if (!declared)
    out.push(
      "type",
      `${rp}.target.${target.kind}`,
      `${BUILDING_TARGET_LABELS[target.kind]} "${id}" does not resolve`,
      id,
    );
};

/** One key per relation kind and exact target, for duplicate detection. */
const relationKey = (relation: IAutoMoviePropRelation): string => {
  const target: IAutoMoviePropRelationTarget = relation.target;
  const tail: string =
    target.kind === "prop-affordance"
      ? `${target.prop}\0${target.affordance}`
      : `${target.environment}\0${targetId(target)}`;
  return `${relation.kind}\0${target.kind}\0${tail}`;
};

const targetId = (target: BuildingTarget): string => {
  switch (target.kind) {
    case "space":
      return target.space;
    case "element":
      return target.element;
    case "boundary":
      return target.boundary;
    case "opening":
      return target.opening;
    case "surface":
      return target.surface;
  }
};

/** Report every axis of a declared box that is not a finite positive extent. */
const validateBox = (
  box: IAutoMoviePropBox,
  path: string,
  out: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!propBoxAxisIsSound(box, axis))
      out.push(
        "range",
        `${path}.${axis}`,
        `${axis} bounds must be finite and min < max`,
        { min: box.min[axis], max: box.max[axis] },
      );
};

/** Group values by key, keeping each value's declaration index. */
const indexBy = <Value>(
  values: readonly Value[],
  key: (value: Value) => string,
): Map<string, IIndexed<Value>[]> => {
  const indexed: Map<string, IIndexed<Value>[]> = new Map();
  values.forEach((value: Value, index: number): void => {
    const id: string = key(value);
    const matches: IIndexed<Value>[] | undefined = indexed.get(id);
    if (matches === undefined) indexed.set(id, [{ value, index }]);
    else matches.push({ value, index });
  });
  return indexed;
};

/** Report every declaration of an id after its first. */
const reportDuplicates = <Value>(
  indexed: ReadonlyMap<string, readonly IIndexed<Value>[]>,
  path: string,
  field: string,
  label: string,
  out: ViolationCollector,
): void => {
  for (const [id, matches] of indexed)
    for (const match of matches.slice(1))
      out.push(
        "type",
        `${path}[${match.index}].${field}`,
        `${label} "${id}" is duplicated`,
        id,
      );
};
