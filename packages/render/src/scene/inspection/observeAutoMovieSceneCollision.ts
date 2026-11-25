import { measureAutoMovieSceneCollision } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { collectAutoMovieCollisionParts } from "./collectAutoMovieCollisionParts.js";
import { createAutoMovieCollisionFinding } from "./createAutoMovieCollisionFinding.js";
import { findAutoMovieCollisionWitness } from "./findAutoMovieCollisionWitness.js";
import { observeAutoMovieSweptCollision } from "./observeAutoMovieSweptCollision.js";
import { resolveAutoMovieCollisionHit } from "./resolveAutoMovieCollisionHit.js";

/** Work one observation may spend, by kind. */
type ILimits = {
  /** Group, region, part, shape and witness comparisons. */
  comparisons: number;
  /** Posed surface vertices read for witnesses. */
  posedVertices: number;
  /** Triangle visits spent testing points against closed surfaces. */
  surfaceTriangles: number;
  /** Elementary motion intervals. */
  sweptCells: number;
  /** Collected parts, when bounded; a frame that runs out defers its layer. */
  parts?: number;
};

/** One source-owned layer, after its exact placement and world-matrix update. */
interface ILayer extends collectAutoMovieCollisionParts.ILayer {
  /** Distinct layer identity, the first element of every coverage key. */
  id: string;
  /** Layer-local seconds of this placement. */
  localSeconds: number;
  /** The layer's shot path, when known. */
  shotPath?: string;
  /**
   * Whether delivery requires every collision obligation of this layer to be
   * resolved.
   */
  required?: boolean;
  /** Named permitted contact, applied alike to placed frames and motion cells. */
  allowances?: readonly Collision.IAllowance[];
  /** Source-certified motion cells. Their allowed depth comes from `allowances`. */
  sweeps?: readonly observeAutoMovieSweptCollision.ICell[];
}

/** The observation request. */
interface IProps {
  /** The sample clock. */
  time: Diagnostic.ITime;
  /** The placed layers. */
  layers: readonly ILayer[];
  /** The initialized convex contact query. */
  geometry: Pick<Geometry.IQueries, "contact">;
  /** Broad-phase refinement of overlapping groups. */
  refinement?: Collision.IProps["refinement"];
  /** Work the observation may spend. */
  limits: ILimits;
  /** Filled at return with the work actually spent, for budget measurement. */
  spent?: ILimits;
}

/**
 * Observe one already placed scene frame for external contact and certified
 * interval violations. The caller supplies its active world layers.
 *
 * Every drawn object of a layer is collected once and the Engine layer search
 * proposes candidate pairs. Displayed shapes that only touch within the native
 * query's precision are clear. Any other candidate is confirmed by a drawn
 * surface point inside the other part's solid beyond the allowance at that
 * point, or cleared when both directions are searched completely; a budget or a
 * missing solid leaves it unresolved with its reason. Every unresolved row
 * inherits the layer's delivery requirement.
 *
 * @param props The clock, layers, contact query, refinement and work limits.
 * @returns Findings and coverage rows for the frame.
 */
export function observeAutoMovieSceneCollision(
  props: IProps,
): Pick<Diagnostic, "findings" | "coverage"> {
  const findings: Diagnostic.IFinding[] = [];
  const coverage: Diagnostic.ICoverage[] = [];
  const budget: ILimits = { ...props.limits };
  if (!Object.values(budget).every((n: number): boolean => n >= 0))
    throw new Error("Invalid placed collision clock or work limit");
  const layers: Set<string> = new Set();
  for (const layer of props.layers) {
    if (!layer.id.trim() || layers.has(layer.id))
      throw new Error(
        "Placed collision layers need distinct nonempty identities",
      );
    layers.add(layer.id);
    observeLayer(props, layer, budget, findings, coverage);
  }
  if (props.spent !== undefined)
    for (const kind of LIMIT_KINDS) {
      const limit: number | undefined = props.limits[kind];
      const left: number | undefined = budget[kind];
      if (limit !== undefined && left !== undefined)
        props.spent[kind] = limit - left;
    }
  return { findings, coverage };
}

/** Every kind of work an observation may spend. */
const LIMIT_KINDS: readonly (keyof ILimits)[] = [
  "comparisons",
  "posedVertices",
  "surfaceTriangles",
  "sweptCells",
  "parts",
];

/** Collect, search and witness one layer, then check its motion cells. */
function observeLayer(
  props: IProps,
  layer: ILayer,
  budget: ILimits,
  findings: Diagnostic.IFinding[],
  coverage: Diagnostic.ICoverage[],
): void {
  const required: boolean = layer.required ?? false;
  const shotPath: string | undefined =
    layer.shotPath ??
    (props.layers.length === 1 ? props.time.shot?.path : undefined);
  const key = (...parts: string[]): string =>
    JSON.stringify([layer.id, ...parts]);
  const report = (
    identity: string,
    status: Diagnostic.ICoverage["status"],
    reason: string,
    obligation: boolean = required,
  ): void => {
    coverage.push(
      status === "checked"
        ? { check: "collision", key: identity, required: obligation, status }
        : {
            check: "collision",
            key: identity,
            required: obligation,
            status,
            reason,
          },
    );
  };
  const collected: collectAutoMovieCollisionParts.IResult =
    collectAutoMovieCollisionParts(layer, budget);
  const byId: Map<string, Collision.IPart> = new Map(
    collected.parts.map((part: Collision.IPart): [string, Collision.IPart] => [
      part.id,
      part,
    ]),
  );
  const result: Collision.IResult = measureAutoMovieSceneCollision({
    parts: collected.parts,
    geometry: props.geometry,
    seconds: layer.localSeconds,
    allowances: layer.allowances,
    refinement: props.refinement,
    maxComparisons: budget.comparisons,
  });
  budget.comparisons -= Object.values(result.compared).reduce(
    (a: number, b: number): number => a + b,
    0,
  );
  report(
    key("layer"),
    result.budgetExhausted || collected.truncated ? "deferred" : "checked",
    collected.truncated ? "part-limit" : "comparison-limit",
  );
  for (const id of result.unboundedParts)
    report(
      key("part", id),
      "unsupported",
      collected.reasons.get(id) ?? "no-displayed-geometry",
    );
  for (const id of result.proxyParts)
    report(key("part", id, "proxy"), "deferred", "proxy-geometry-only");
  for (const group of result.internalGroups)
    report(key("group", group.kind, group.id), "excluded", group.kind);
  for (const pair of result.unavailablePairs)
    report(
      key("frame", pair.first, pair.second),
      "deferred",
      "native-query-unavailable",
    );
  const solids: Map<
    string,
    findAutoMovieCollisionWitness.ISolid | null | "budget"
  > = new Map();
  const solidOf = (
    id: string,
  ): findAutoMovieCollisionWitness.ISolid | null | "budget" => {
    if (!solids.has(id))
      solids.set(
        id,
        findAutoMovieCollisionWitness.solid(
          byId.get(id),
          collected.surfaces.get(id),
        ),
      );
    return solids.get(id)!;
  };
  for (const hit of result.findings) {
    const identity: string = key("frame", hit.first, hit.second);
    const outcome: resolveAutoMovieCollisionHit.IResolution =
      resolveAutoMovieCollisionHit({
        hit,
        surfaces: collected.surfaces,
        solidOf,
        allowances: layer.allowances ?? [],
        seconds: layer.localSeconds,
        budget,
      });
    if (outcome.kind === "permitted") {
      report(identity, "excluded", "named-contact-allowance");
      continue;
    }
    if (outcome.kind === "clear") {
      report(identity, "checked", "");
      continue;
    }
    const confirmed: boolean = outcome.kind === "witness";
    report(
      identity,
      confirmed ? "checked" : "deferred",
      outcome.kind === "budget"
        ? "surface-witness-limit"
        : hit.basis === "displayed"
          ? "surface-witness-incomplete"
          : `${hit.basis}-geometry-without-solid`,
    );
    const separation: number | null =
      outcome.kind === "witness" ? outcome.separation : hit.separation;
    const point: IAutoMovieVector3 | null =
      outcome.kind === "witness" ? outcome.point : hit.point;
    if (confirmed || separation === null || separation < 0)
      findings.push(
        createAutoMovieCollisionFinding(
          identity,
          [hit.first, hit.second],
          "frame",
          confirmed,
          separation,
          hit.allowance ?? 0,
          point,
          {
            time: {
              filmSeconds: props.time.filmSeconds,
              outputFrame: props.time.outputFrame,
              ...(shotPath === undefined
                ? {}
                : { shot: { path: shotPath, seconds: layer.localSeconds } }),
            },
          },
        ),
      );
  }
  observeAutoMovieSweptCollision({
    sweeps: layer.sweeps,
    allowances: layer.allowances ?? [],
    groups: new Map(
      collected.parts.flatMap(
        (part: Collision.IPart): [string, Collision.IGroup][] =>
          part.group === undefined ? [] : [[part.id, part.group]],
      ),
    ),
    budget,
    key,
    report,
    findings,
    ...(shotPath === undefined ? {} : { shotPath }),
  });
}
