import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieClearanceBox,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMoviePropRelation,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";

import { builtElementRestMatrices } from "../architecture/builtElementRestMatrices";
import { builtPlacedPartBoxes } from "../architecture/builtPlacedPartBoxes";
import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMoviePassageBlockage } from "./IAutoMoviePassageBlockage";
import { IAutoMoviePropClearanceBounds } from "./IAutoMoviePropClearanceBounds";
import { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";
import { createPropPassageBlocker } from "./createPropPassageBlocker";
import { propBoundsOverlap } from "./propBoundsOverlap";
import { propBoxAxisIsSound } from "./propBoxAxisIsSound";
import { propClearanceBounds } from "./propClearanceBounds";
import { propOccupancyBounds } from "./propOccupancyBounds";
import { propSpaceContainsBounds } from "./propSpaceContainsBounds";
import { propSupportFace } from "./propSupportFace";
import { propSupportGap } from "./propSupportGap";
import { unionSubjectBoxes } from "./unionSubjectBoxes";

/** Tolerance for containment and support-contact comparisons, in metres. */
const PLACEMENT_EPSILON: number = 1e-9;

/**
 * Judge every volume the sound part of a prop registry claims: keep-out clearances, pairwise occupancy, support contact, space containment, opening fit and passage intrusion.
 *
 * "Sound" is deliberately narrow: a prop is measured only when it forged, when its node is declared once, when exactly one staged piece places it, and when any footprint it declares is a real volume. Measuring an ambiguous, unforged or degenerate prop would report a second failure caused by the first, and the author would correct the wrong line. Sound props without a `placement` are still measured as occupants others must clear and as hosts others rest on, but claim nothing themselves.
 *
 * Pairwise overlap is checked only when both staged props declare `placement`, and is refused unless one declares contact through a prop affordance. A prop is judged against the environment it occupies, or, when it names no space, the one building all its building relations cite; relations spanning two buildings name no single place and are not measured. An opening is fitted through the rest-pose world box of the element filling it, and a passage the prop fills is not reported as one it blocks. Violations go to `out` in prop declaration order within each check.
 *
 * @evidence contracts/common.md#principled-implementation Every judgment is an axis-aligned world-box predicate on the staged occupancy from `propOccupancyBounds`: strict-interior overlap through `propBoundsOverlap`, corner containment through `propSpaceContainsBounds`, the deepest support probe through `propSupportGap` within a nanometre, and opening fit against the fill's rest-pose part boxes from `builtElementRestMatrices` and `builtPlacedPartBoxes`, the same measurement `propBlockedPassages` takes of an opening.
 * @evidence contracts/common.md#clear-and-simple-design Split from `validatePropPlacements` so the registry and relation gate and the geometry judgment each stay one readable owner; private helpers hold clearances, pairwise overlap, supports and per-environment occupancy, each one claim family.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsound props, unstateable faces and model-less fills are skipped so one fault is reported once; a space subtree stating neither cells nor a shell adds no containment restriction, while shell-only volumes are measured. Declared contact exempts only the overlap between the two props that declare it; no prop, kind or building is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what "sound" means and why, which props are measured as occupants only, the overlap exemption, how the judged environment is chosen, how an opening is fitted, the filled-passage exemption, and the report order.
 * @evidence contracts/performance.md#efficient-algorithms Occupancy is measured once per sound prop; overlap and clearance add O(S² + S·C) box tests for S sound props and C clearances. Support, containment and opening relations add their delegated environment-list, footprint and part traversals, and each judged environment's passage query is prepared once. No small prop or relation count is enforced here.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares each prop's occupancy across its checks and prepares each judged environment's passage bounds once through createPropPassageBlocker, keyed by that environment object during the synchronous validation. Inputs stay unchanged for the call; no closure is reused across later mutable environment revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the sound-prop list and a lazy map of passage queries for at most the judged environments until return; each query retains that environment's measured passage boxes. All temporary lists, maps and queries are released after validation, while violations transfer to the caller's collector.
 */
export function validatePropPlacementGeometry(props: {
  /** Every registry entry in declaration order, with what the registry gate resolved for it. */
  entries: readonly {
    /** The registry's prop. */
    prop: IAutoMoviePropSpec;

    /** Its index in the registry, for violation paths. */
    index: number;

    /** The one set piece staging it, or `undefined` when zero or several do. */
    piece: IAutoMovieStageSetPiece | undefined;

    /** Whether `forgeProp` accepted it. */
    forged: boolean;

    /** Whether its node is declared once. */
    unique: boolean;

    /** The uniquely declared environment of its `in-space` target, or `null`. */
    located: IAutoMovieBuiltEnvironment | null;
  }[];

  /** Built environments by id, holding only ids declared exactly once. */
  environments: ReadonlyMap<string, IAutoMovieBuiltEnvironment>;

  /** Collector the violations are appended to. */
  out: ViolationCollector;
}): void {
  const staged: IStagedProp[] = [];
  for (const entry of props.entries) {
    if (!entry.forged || !entry.unique || entry.piece === undefined) continue;
    const footprint: IAutoMoviePropBox | null =
      entry.prop.placement?.footprint ?? null;
    if (footprint !== null && !soundBox(footprint)) continue;
    staged.push({
      prop: entry.prop,
      index: entry.index,
      piece: entry.piece,
      located: entry.located,
      occupancy: propOccupancyBounds({ prop: entry.prop, piece: entry.piece }),
    });
  }
  validateClearances(staged, props.out);
  validateOverlaps(staged, props.out);
  validateSupports(staged, props.environments, props.out);
  const passageQueries: Map<
    IAutoMovieBuiltEnvironment,
    (bounds: IAutoMoviePropBox) => IAutoMoviePassageBlockage[]
  > = new Map();
  for (const entry of staged) {
    if (entry.prop.placement === undefined) continue;
    const environment: IAutoMovieBuiltEnvironment | null = judgedEnvironment(
      entry,
      entry.prop.placement.relations,
      props.environments,
    );
    if (environment !== null) {
      let blocked:
        | ((bounds: IAutoMoviePropBox) => IAutoMoviePassageBlockage[])
        | undefined = passageQueries.get(environment);
      if (blocked === undefined) {
        blocked = createPropPassageBlocker(environment);
        passageQueries.set(environment, blocked);
      }
      validateOccupancy(entry, environment, props.out, blocked);
    }
  }
}

/**
 * A sound prop with the one piece staging it and its measured world occupancy, retained only during this validation call.
 *
 * @author Samchon
 */
interface IStagedProp {
  /** Borrowed registry spec whose forging and unique staging join passed. */
  prop: IAutoMoviePropSpec;

  /** Original registry position used to address every geometry finding. */
  index: number;

  /** The unique borrowed set piece placing this spec's model. */
  piece: IAutoMovieStageSetPiece;

  /** Admitted occupied environment, or null when no unique in-space join exists. */
  located: IAutoMovieBuiltEnvironment | null;

  /** World-axis-aligned box in metres, measured once for all geometry checks. */
  occupancy: IAutoMoviePropBox;
}

function soundBox(box: IAutoMoviePropBox): boolean {
  return (
    propBoxAxisIsSound(box, "x") &&
    propBoxAxisIsSound(box, "y") &&
    propBoxAxisIsSound(box, "z")
  );
}

/** Refuse every declared keep-out volume another staged prop's occupancy enters. */
function validateClearances(
  staged: readonly IStagedProp[],
  out: ViolationCollector,
): void {
  for (const entry of staged) {
    const declared: readonly IAutoMovieClearanceBox[] | undefined =
      entry.prop.placement?.clearance;
    if (declared === undefined) continue;
    propClearanceBounds({ prop: entry.prop, piece: entry.piece }).forEach(
      (clearance: IAutoMoviePropClearanceBounds, index: number): void => {
        if (!soundBox(declared[index]!)) return;
        for (const candidate of staged)
          if (
            candidate.index !== entry.index &&
            propBoundsOverlap(clearance, candidate.occupancy)
          )
            out.push(
              "range",
              `$input.props[${entry.index}].placement.clearance[${index}]`,
              `clearance "${clearance.id}" intersects staged prop "${candidate.prop.node}"`,
              candidate.prop.node,
            );
      },
    );
  }
}

/** Refuse two placed props sharing interior volume without a declared contact. */
function validateOverlaps(
  staged: readonly IStagedProp[],
  out: ViolationCollector,
): void {
  const contacts: Set<string> = new Set<string>();
  for (const entry of staged)
    for (const relation of entry.prop.placement?.relations ?? [])
      if (relation.target.kind === "prop-affordance")
        contacts.add(pairKey(entry.prop.node, relation.target.prop));
  for (let left: number = 0; left < staged.length; ++left)
    for (let right: number = left + 1; right < staged.length; ++right) {
      const a: IStagedProp = staged[left]!;
      const b: IStagedProp = staged[right]!;
      if (a.prop.placement === undefined || b.prop.placement === undefined)
        continue;
      if (contacts.has(pairKey(a.prop.node, b.prop.node))) continue;
      if (!propBoundsOverlap(a.occupancy, b.occupancy)) continue;
      out.push(
        "range",
        `$input.props[${b.index}].placement.footprint`,
        `staged occupancy overlaps prop "${a.prop.node}", which declares no contact with it`,
        a.prop.node,
      );
    }
}

/** Encode the sorted string pair as JSON, preserving symmetry without delimiter collisions in authored ids. */
function pairKey(left: string, right: string): string {
  return JSON.stringify(left < right ? [left, right] : [right, left]);
}

/**
 * Judge every `on-support` relation whose face the record can state.
 *
 * Support needs no logical space: a lamp that only says which table top it stands on has named a face, and that face is measurable whether or not the lamp also says which room it is in. Each relation is judged on its own, so a plank across two tables answers for both of them. A relation whose host is not itself soundly staged, one citing a face the record cannot state, and a prop citing itself, which the registry gate already refuses by name, are passed over rather than measured twice or guessed at.
 */
function validateSupports(
  staged: readonly IStagedProp[],
  environments: ReadonlyMap<string, IAutoMovieBuiltEnvironment>,
  out: ViolationCollector,
): void {
  const hosts: Map<string, IStagedProp> = new Map(
    staged.map((entry: IStagedProp): [string, IStagedProp] => [
      entry.prop.node,
      entry,
    ]),
  );
  for (const entry of staged)
    (entry.prop.placement?.relations ?? []).forEach(
      (relation: IAutoMoviePropRelation, index: number): void => {
        const target: IAutoMoviePropRelation["target"] = relation.target;
        if (relation.kind !== "on-support") return;
        if (target.kind !== "surface" && target.kind !== "prop-affordance")
          return;
        if (
          target.kind === "prop-affordance" &&
          target.prop === entry.prop.node
        )
          return;
        const host: IStagedProp | undefined =
          target.kind === "prop-affordance"
            ? hosts.get(target.prop)
            : undefined;
        const environment: IAutoMovieBuiltEnvironment | undefined =
          target.kind === "surface"
            ? environments.get(target.environment)
            : undefined;
        const face: IAutoMoviePropSupportFace | null = propSupportFace({
          target,
          environments: environment === undefined ? [] : [environment],
          props: host === undefined ? [] : [host.prop],
          set: host === undefined ? [] : [host.piece],
        });
        if (face === null) return;
        const gap: number | null = propSupportGap({
          face,
          bounds: entry.occupancy,
        });
        const path: string =
          `$input.props[${entry.index}].placement.relations[${index}].target.` +
          (target.kind === "surface" ? "surface" : "affordance");
        const label: string =
          target.kind === "surface"
            ? `support surface "${target.surface}"`
            : `prop "${target.prop}" affordance "${target.affordance}"`;
        if (gap === null)
          out.push(
            "range",
            path,
            `staged occupancy does not stand over ${label}`,
            target.kind === "surface" ? target.surface : target.affordance,
          );
        else if (gap < -PLACEMENT_EPSILON)
          out.push("range", path, `staged occupancy sinks into ${label}`, gap);
        else if (gap > PLACEMENT_EPSILON)
          out.push(
            "range",
            path,
            `staged occupancy floats above ${label}`,
            gap,
          );
      },
    );
}

/**
 * The environment a prop's geometry is judged against.
 *
 * The occupied space answers first, because that is the prop's own statement of where it is. A prop that names no space but cites one building anyway (a leaf that only declares which opening it fills) is still judged there: refusing to measure it would let the strongest claim a prop can make, that it fits a passage, go unchecked because a weaker one was left out.
 */
function judgedEnvironment(
  entry: IStagedProp,
  relations: readonly IAutoMoviePropRelation[],
  environments: ReadonlyMap<string, IAutoMovieBuiltEnvironment>,
): IAutoMovieBuiltEnvironment | null {
  if (entry.located !== null) return entry.located;
  const cited: Set<string> = new Set<string>();
  for (const relation of relations)
    if (relation.target.kind !== "prop-affordance")
      cited.add(relation.target.environment);
  if (cited.size !== 1) return null;
  return environments.get([...cited][0]!) ?? null;
}

/** Containment, opening fit, and passage intrusion for one located prop. */
function validateOccupancy(
  entry: IStagedProp,
  environment: IAutoMovieBuiltEnvironment,
  out: ViolationCollector,
  blocked: (bounds: IAutoMoviePropBox) => IAutoMoviePassageBlockage[],
): void {
  const path: string = `$input.props[${entry.index}]`;
  const bounds: IAutoMoviePropBox = entry.occupancy;
  const filled: Set<string> = new Set<string>();
  entry.prop.placement!.relations.forEach(
    (relation: IAutoMoviePropRelation, index: number): void => {
      const rp: string = `${path}.placement.relations[${index}]`;
      const target: IAutoMoviePropRelation["target"] = relation.target;
      if (
        relation.kind === "in-space" &&
        target.kind === "space" &&
        target.environment === environment.id
      ) {
        if (
          !environment.spaces.some(
            (space: IAutoMovieBuiltSpace): boolean => space.id === target.space,
          )
        )
          return;
        if (
          !propSpaceContainsBounds({ environment, space: target.space, bounds })
        )
          out.push(
            "range",
            `${rp}.target.space`,
            `staged occupancy leaves logical space "${target.space}"`,
            target.space,
          );
        return;
      }
      if (relation.kind !== "fill-opening" || target.kind !== "opening") return;
      if (target.environment !== environment.id) return;
      filled.add(target.opening);
      const reveal: IAutoMoviePropBox | null = openingFillBounds(
        environment,
        target.opening,
      );
      if (reveal !== null && !boxContains(reveal, bounds))
        out.push(
          "range",
          `${rp}.target.opening`,
          `staged occupancy does not fit the fill element of opening "${target.opening}"`,
          target.opening,
        );
    },
  );
  for (const blockage of blocked(bounds)) {
    if (blockage.kind === "opening" && filled.has(blockage.id)) continue;
    out.push(
      "range",
      `${path}.placement`,
      `staged occupancy blocks ${blockage.kind} "${blockage.id}"`,
      blockage.id,
    );
  }
}

/**
 * Rest-pose world bounds of the element filling an opening, or `null` when the opening is an open cut, its fill draws no model held by the record, or the fill's parent chain is missing or cyclic. First declarations win for duplicate ids, as validation refuses the duplicate on its own path.
 */
function openingFillBounds(
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): IAutoMoviePropBox | null {
  const opening: IAutoMovieBuiltOpening | undefined = environment.openings.find(
    (candidate: IAutoMovieBuiltOpening): boolean => candidate.id === id,
  );
  const fill: string | null = opening?.fill ?? null;
  if (fill === null) return null;
  const element: IAutoMovieBuiltElement | undefined = environment.elements.find(
    (candidate: IAutoMovieBuiltElement): boolean => candidate.id === fill,
  );
  const model: IAutoMovieModel | undefined =
    element === undefined || element.model === null
      ? undefined
      : environment.models.find(
          (candidate: IAutoMovieModel): boolean =>
            candidate.id === element.model,
        );
  if (model === undefined) return null;
  const matrix: number[] | null = builtElementRestMatrices(environment)(fill);
  return matrix === null
    ? null
    : unionSubjectBoxes(builtPlacedPartBoxes(model, matrix));
}

function boxContains(
  outer: IAutoMoviePropBox,
  inner: IAutoMoviePropBox,
): boolean {
  return (["x", "y", "z"] as const).every(
    (axis: "x" | "y" | "z"): boolean =>
      inner.min[axis] >= outer.min[axis] - PLACEMENT_EPSILON &&
      inner.max[axis] <= outer.max[axis] + PLACEMENT_EPSILON,
  );
}
