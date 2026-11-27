import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,

  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieRenderInspectionGeometry } from "../../AutoMovieRenderInspectionGeometry";
import type { AutoMovieRenderInspection } from "../../AutoMovieRenderInspection";
import { createCollisionFinding } from "./createCollisionFinding";
import { findCollisionWitness } from "./findCollisionWitness";
import { observeSweptCollision } from "./observeSweptCollision";
import { resolveCollisionHit } from "./resolveCollisionHit";

/*
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
 * Parameter props: The clock, layers, contact query, refinement and work limits.
 * Returns: Findings and coverage rows for the frame.
 */
export function observeSceneCollisionImplementation(
  props: IProps,
): AutoMovieRenderInspection.IPlacedSceneCollisionResult {
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
type ILimits = AutoMovieRenderInspection.IPlacedSceneCollisionLimits;
type ILayer = AutoMovieRenderInspection.IPlacedSceneCollisionLayer;
type IProps = AutoMovieRenderInspection.IPlacedSceneCollisionProps;

/*
 * Every kind of work an observation may spend.
 */
const LIMIT_KINDS: readonly (keyof ILimits)[] = [
  "comparisons",
  "posedVertices",
  "surfaceTriangles",
  "sweptCells",
  "parts",
];

/*
 * Collect, search and witness one layer, then check its motion cells.
 */
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
  const collected: AutoMovieRenderInspectionGeometry.IResult =
    AutoMovieRenderInspectionGeometry.collectCollisionParts(layer, budget);
  const byId: Map<string, Collision.IPart> = new Map(
    collected.parts.map((part: Collision.IPart): [string, Collision.IPart] => [
      part.id,
      part,
    ]),
  );
  const result: Collision.IResult = AutoMovieEngineValidation.measureSceneCollision({
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
    findCollisionWitness.ISolid | null | "budget"
  > = new Map();
  const solidOf = (
    id: string,
  ): findCollisionWitness.ISolid | null | "budget" => {
    if (!solids.has(id))
      solids.set(
        id,
        findCollisionWitness.solid(
          byId.get(id),
          collected.surfaces.get(id),
        ),
      );
    return solids.get(id)!;
  };
  for (const hit of result.findings) {
    const identity: string = key("frame", hit.first, hit.second);
    const outcome: resolveCollisionHit.IResolution =
      resolveCollisionHit({
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
        createCollisionFinding(
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
  observeSweptCollision({
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
