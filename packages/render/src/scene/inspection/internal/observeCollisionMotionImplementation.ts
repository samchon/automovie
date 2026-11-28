import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import type { AutoMovieRenderInspection } from "../../AutoMovieRenderInspection";
import { AutoMovieRenderInspectionGeometry } from "../../AutoMovieRenderInspectionGeometry";
import { createCollisionFinding } from "./createCollisionFinding";
import { findCollisionWitness } from "./findCollisionWitness";
import { readCollisionMotion } from "./readCollisionMotion";
import { resolveCollisionHit } from "./resolveCollisionHit";

/*
 * Check the motion between the preceding output instant and the placed one for
 * crossings that neither placed frame shows, by bounded subdivision.
 *
 * Both endpoints are placed through the subject's own synchronous placement. A
 * pair is examined when it is external, neither endpoint confirms it, its
 * motion exceeds half the thinner part's thickness, and its conservative swept
 * bounds overlap: each endpoint box enlarged by half of the part's largest
 * feature displacement, which covers a rotation of up to half a turn. The
 * interval is bisected at placed instants until a midpoint confirms the pair,
 * every remaining span moves less than that half-thickness or leaves the swept
 * bounds apart, or the placement or depth limit is reached. No interval
 * crossing a cut or a declared break is examined. Cached bounds only select
 * candidates; a requested surface is read with its sample's scene placed.
 * The drawn instant is placed
 * again before returning, so every host keeps drawing it.
 * Parameter props: The span, its continuity, the placement and layer readers, the
 * contact query and the work limits.
 * Returns: Sub-frame findings with their bracketing span, and one coverage row
 * per layer and per unresolved pair.
 */
export function observeCollisionMotionImplementation(
  props: IProps,
): AutoMovieRenderInspection.IPlacedSceneCollisionResult {
  const findings: Diagnostic.IFinding[] = [];
  const coverage: Diagnostic.ICoverage[] = [];
  const to: number = props.time.filmSeconds;
  const from: number = props.fromSeconds;
  const required: Map<string, boolean> = new Map();
  for (const layer of props.layers(to))
    required.set(layer.id, layer.required ?? false);
  const row = (
    key: string,
    layer: string,
    status: Diagnostic.ICoverage["status"],
    reason: string,
    paths?: readonly string[],
  ): void => {
    const obligation: boolean = required.get(layer) ?? false;
    const location = { basis: "swept" as const, ...(paths === undefined ? {} : { paths }) };
    coverage.push(
      status === "checked"
        ? { check: "collision", key, required: obligation, status, ...location }
        : { check: "collision", key, required: obligation, status, reason },
    );
  };
  const layerRow = (
    status: Diagnostic.ICoverage["status"],
    reason: string,
  ): void => {
    for (const id of required.keys())
      row(JSON.stringify([id, "motion"]), id, status, reason);
  };
  if (!(from < to)) {
    layerRow("excluded", "no-preceding-motion");
    return { findings, coverage };
  }
  if (!props.continuous) {
    layerRow("excluded", "cut");
    return { findings, coverage };
  }
  const budget: ILimits = { ...props.limits };
  const instants: Map<number, IInstant> = new Map();
  let placed: IInstant;
  const readPlaced = (seconds: number): IInstant =>
    readInstant(seconds, props.layers(seconds), budget, props.geometry);
  const place = (seconds: number): IInstant | "budget" => {
    if (budget.placements === 0) return "budget";
    --budget.placements;
    props.place(seconds);
    return (placed = readPlaced(seconds));
  };
  const exact = (state: ILayerState): ILayerState | "budget" | undefined => {
    if (placed.seconds !== state.seconds && place(state.seconds) === "budget")
      return "budget";
    const current: ILayerState | undefined = placed.layers.get(state.layerId);
    return current?.localSeconds === state.localSeconds
      ? current
      : undefined;
  };
  const at = (seconds: number): IInstant | "budget" => {
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) return known;
    const instant: IInstant | "budget" = place(seconds);
    if (instant === "budget") return instant;
    instants.set(seconds, instant);
    return instant;
  };
  const limited: Set<string> = new Set();
  try {
    const end: IInstant = (placed = readPlaced(to));
    instants.set(to, end);
    const start: IInstant | "budget" = at(from);
    if (start === "budget") {
      layerRow("deferred", "motion-placement-limit");
      return { findings, coverage };
    }
    for (const [id, last] of end.layers) {
      const first: ILayerState | undefined = start.layers.get(id);
      if (first === undefined) continue;
      if (first.collected.truncated || last.collected.truncated) {
        limited.add(id);
        continue;
      }
      for (const [a, b] of candidates(first, last)) {
        const paths: readonly string[] = [a, b];
        const key: string = JSON.stringify([id, "motion", ...paths]);
        const begin: IAtOutcome = witnessAt(first, a, b, budget, exact);
        if (begin.kind === "witness") continue;
        const finish: IAtOutcome = witnessAt(last, a, b, budget, exact);
        if (finish.kind === "witness") continue;
        const outcome: IOutcome =
          begin.kind === "limit"
            ? begin
            : finish.kind === "limit"
              ? finish
              : bisect(
                  { id, a, b, at, exact, budget, depth: props.limits.depth },
                  from,
                  to,
                );
        if (outcome.kind === "clear") continue;
        if (outcome.kind === "limit") {
          limited.add(id);
          row(key, id, "deferred", outcome.reason, paths);
          continue;
        }
        row(key, id, "checked", "", paths);
        findings.push(
          createCollisionFinding(
            key,
            paths,
            "sweep",
            true,
            outcome.separation,
            0,
            outcome.point,
            {
              time: { filmSeconds: outcome.seconds },
              interval: { from: outcome.from, to: outcome.to },
            },
          ),
        );
      }
    }
  } finally {
    props.place(to);
  }
  for (const id of required.keys())
    row(
      JSON.stringify([id, "motion"]),
      id,
      limited.has(id) ? "deferred" : "checked",
      "motion-subdivision-limit",
    );
  if (props.spent !== undefined)
    for (const kind of LIMIT_KINDS) {
      const limit: number | undefined = props.limits[kind];
      const left: number | undefined = budget[kind];
      if (limit !== undefined && left !== undefined)
        props.spent[kind] = limit - left;
    }
  return { findings, coverage };
}
type ILayer = AutoMovieRenderInspection.IPlacedSceneCollisionMotionLayer;
type ILimits = AutoMovieRenderInspection.IPlacedSceneCollisionMotionLimits;

type IProps = AutoMovieRenderInspection.IPlacedSceneCollisionMotionProps;

/*
 * One placed instant: the collected parts and their memoized solids per layer.
 */
interface IInstant {
  readonly seconds: number;
  readonly layers: ReadonlyMap<string, ILayerState>;
}

/*
 * One layer at one placed instant.
 */
interface ILayerState {
  readonly seconds: number;
  readonly layerId: string;
  readonly localSeconds: number;
  readonly allowances: readonly Collision.IAllowance[] | undefined;
  readonly collected: AutoMovieRenderInspectionGeometry.IResult;
  readonly parts: ReadonlyMap<string, Collision.IPart>;
  readonly motion: ReadonlyMap<string, readCollisionMotion.IPose>;
  readonly solidOf: findCollisionWitness.IProps["solidOf"];
  readonly geometry: Pick<Geometry.IQueries, "contact">;
}

/*
 * Every kind of work an observation may spend.
 */
const LIMIT_KINDS: readonly (keyof ILimits)[] = [
  "placements",
  "depth",
  "comparisons",
  "posedVertices",
  "surfaceTriangles",
  "parts",
];

/*
 * Result of bisecting one pair's span.
 */
type IOutcome =
  | { kind: "clear" }
  | { kind: "limit"; reason: string }
  | {
      kind: "witness";
      seconds: number;
      from: number;
      to: number;
      point: { x: number; y: number; z: number };
      separation: number;
    };

/*
 * Collect every layer at the placed instant and record its feature poses.
 */
function readInstant(
  seconds: number,
  layers: readonly ILayer[],
  budget: { posedVertices: number; parts?: number },
  geometry: Pick<Geometry.IQueries, "contact">,
): IInstant {
  const states: Map<string, ILayerState> = new Map();
  for (const layer of layers) {
    const collected: AutoMovieRenderInspectionGeometry.IResult =
      AutoMovieRenderInspectionGeometry.collectCollisionParts(layer, budget);
    const parts: Map<string, Collision.IPart> = new Map(
      collected.parts.map(
        (part: Collision.IPart): [string, Collision.IPart] => [part.id, part],
      ),
    );
    const motion: Map<string, readCollisionMotion.IPose> = new Map();
    for (const part of collected.parts) {
      const pose: readCollisionMotion.IPose | null = readCollisionMotion(part);
      if (pose !== null) motion.set(part.id, pose);
    }
    const solids: Map<string, findCollisionWitness.ISolid | null | "budget"> =
      new Map();
    states.set(layer.id, {
      seconds,
      layerId: layer.id,
      localSeconds: layer.localSeconds,
      allowances: layer.allowances,
      geometry,
      collected,
      parts,
      motion,
      solidOf: (id: string): findCollisionWitness.ISolid | null | "budget" => {
        if (!solids.has(id))
          solids.set(
            id,
            findCollisionWitness.solid(
              parts.get(id),
              collected.surfaces.get(id),
            ),
          );
        return solids.get(id)!;
      },
    });
  }
  return { seconds, layers: states };
}

/*
 * External pairs whose motion over the span can carry one through the other:
 * moving more than half the thinner part's thickness, with overlapping swept
 * bounds. Sorted sweep on X keeps the search near-linear.
 */
function candidates(
  first: ILayerState,
  last: ILayerState,
): readonly (readonly [string, string])[] {
  const swept: { id: string; box: IAutoMovieSubjectBox; group?: string }[] = [];
  for (const [id, end] of last.motion) {
    const begin: readCollisionMotion.IPose | undefined = first.motion.get(id);
    if (begin === undefined) continue;
    const group: Collision.IGroup | undefined = last.parts.get(id)?.group;
    swept.push({
      id,
      box: readCollisionMotion.swept(begin, end),
      ...(group === undefined ? {} : { group: `${group.kind}:${group.id}` }),
    });
  }
  swept.sort((x, y): number => x.box.min.x - y.box.min.x);
  const pairs: [string, string][] = [];
  for (let i: number = 0; i < swept.length; ++i)
    for (let j: number = i + 1; j < swept.length; ++j) {
      const a = swept[i]!;
      const b = swept[j]!;
      if (b.box.min.x > a.box.max.x) break;
      if (a.group !== undefined && a.group === b.group) continue;
      if (!overlaps(a.box, b.box)) continue;
      const moved: number =
        readCollisionMotion.displacement(
          first.motion.get(a.id)!,
          last.motion.get(a.id)!,
        ) +
        readCollisionMotion.displacement(
          first.motion.get(b.id)!,
          last.motion.get(b.id)!,
        );
      const thinner: number = Math.min(
        last.motion.get(a.id)!.thickness,
        last.motion.get(b.id)!.thickness,
      );
      if (moved < thinner / 2) continue;
      pairs.push(a.id < b.id ? [a.id, b.id] : [b.id, a.id]);
    }
  return pairs;
}

/*
 * Bisect a pair's span at placed instants until a witness, clearance or a
 * limit.
 */
function bisect(
  pair: {
    id: string;
    a: string;
    b: string;
    at: (seconds: number) => IInstant | "budget";
    exact: (state: ILayerState) => ILayerState | "budget" | undefined;
    budget: ILimits;
    depth: number;
  },
  from: number,
  to: number,
): IOutcome {
  const spans: { from: number; to: number; depth: number }[] = [
    { from, to, depth: 0 },
  ];
  while (spans.length !== 0) {
    const span = spans.shift()!;
    const begin: IInstant | "budget" = pair.at(span.from);
    const end: IInstant | "budget" = pair.at(span.to);
    if (begin === "budget" || end === "budget")
      return { kind: "limit", reason: "motion-placement-limit" };
    if (!needsSplit(pair, begin, end)) continue;
    if (span.depth >= pair.depth)
      return { kind: "limit", reason: "motion-subdivision-limit" };
    const middle: number = (span.from + span.to) / 2;
    if (!(middle > span.from && middle < span.to)) continue;
    const placed: IInstant | "budget" = pair.at(middle);
    if (placed === "budget")
      return { kind: "limit", reason: "motion-placement-limit" };
    const state: ILayerState | undefined = placed.layers.get(pair.id);
    if (state !== undefined) {
      const found: IAtOutcome = witnessAt(
        state,
        pair.a,
        pair.b,
        pair.budget,
        pair.exact,
      );
      if (found.kind === "limit") return found;
      if (found.kind === "witness")
        return { ...found, seconds: middle, from: span.from, to: span.to };
    }
    spans.push(
      { from: span.from, to: middle, depth: span.depth + 1 },
      { from: middle, to: span.to, depth: span.depth + 1 },
    );
  }
  return { kind: "clear" };
}

/*
 * Whether the pair's motion over a span can still hide a crossing.
 */
function needsSplit(
  pair: { id: string; a: string; b: string },
  begin: IInstant,
  end: IInstant,
): boolean {
  const first: ILayerState | undefined = begin.layers.get(pair.id);
  const last: ILayerState | undefined = end.layers.get(pair.id);
  const a0 = first?.motion.get(pair.a);
  const a1 = last?.motion.get(pair.a);
  const b0 = first?.motion.get(pair.b);
  const b1 = last?.motion.get(pair.b);
  if (!a0 || !a1 || !b0 || !b1) return false;
  if (
    !overlaps(
      readCollisionMotion.swept(a0, a1),
      readCollisionMotion.swept(b0, b1),
    )
  )
    return false;
  const moved: number =
    readCollisionMotion.displacement(a0, a1) +
    readCollisionMotion.displacement(b0, b1);
  return moved >= Math.min(a1.thickness, b1.thickness) / 2;
}

/* The outcome of resolving one pair at its actual placed instant. */
type IAtOutcome =
  | { kind: "clear" }
  | { kind: "limit"; reason: string }
  | {
      kind: "witness";
      point: { x: number; y: number; z: number };
      separation: number;
    };

/* Resolve the saved broad pair, replaying only when it needs a drawn surface. */
function witnessAt(
  state: ILayerState,
  a: string,
  b: string,
  budget: ILimits,
  exact: (state: ILayerState) => ILayerState | "budget" | undefined,
): IAtOutcome {
  const first: Collision.IPart | undefined = state.parts.get(a);
  const second: Collision.IPart | undefined = state.parts.get(b);
  if (first === undefined || second === undefined || state.collected.truncated)
    return { kind: "limit", reason: "motion-part-unavailable" };
  const result: Collision.IResult =
    AutoMovieEngineValidation.measureSceneCollision({
      parts: [first, second],
      geometry: state.geometry,
      seconds: state.localSeconds,
      allowances: state.allowances,
      maxComparisons: Math.min(budget.comparisons, 16),
    });
  budget.comparisons -= Object.values(result.compared).reduce(
    (x: number, y: number): number => x + y,
    0,
  );
  for (const hit of result.findings) {
    if (
      hit.status === "proxy" ||
      (hit.status === "candidate" && hit.basis !== "displayed")
    ) {
      const replay: ILayerState | "budget" | undefined = exact(state);
      if (replay === "budget")
        return { kind: "limit", reason: "motion-placement-limit" };
      if (replay === undefined)
        return { kind: "limit", reason: "motion-layer-unavailable" };
      // Rebind IDs against the replayed graph; a seek may replace a mesh or a layer root.
      if (replay !== state) return witnessAt(replay, a, b, budget, exact);
    }
    const outcome: resolveCollisionHit.IResolution = resolveCollisionHit({
      hit,
      surfaces: state.collected.surfaces,
      solidOf: state.solidOf,
      allowances: state.allowances ?? [],
      seconds: state.localSeconds,
      budget,
    });
    if (outcome.kind === "witness") return outcome;
    if (outcome.kind === "budget")
      return { kind: "limit", reason: "motion-surface-witness-limit" };
    if (outcome.kind === "incomplete")
      return { kind: "limit", reason: "motion-surface-witness-incomplete" };
  }
  return result.budgetExhausted || result.unavailablePairs.length !== 0
    ? {
        kind: "limit",
        reason: result.budgetExhausted
          ? "motion-comparison-limit"
          : "motion-pair-unavailable",
      }
    : { kind: "clear" };
}

/*
 * Closed boxes overlap.
 */
function overlaps(a: IAutoMovieSubjectBox, b: IAutoMovieSubjectBox): boolean {
  return (
    a.min.x <= b.max.x &&
    b.min.x <= a.max.x &&
    a.min.y <= b.max.y &&
    b.min.y <= a.max.y &&
    a.min.z <= b.max.z &&
    b.min.z <= a.max.z
  );
}
