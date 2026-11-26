import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { collectAutoMovieCollisionParts } from "./collectAutoMovieCollisionParts.js";
import { createAutoMovieCollisionFinding } from "./createAutoMovieCollisionFinding.js";
import { findAutoMovieCollisionWitness } from "./findAutoMovieCollisionWitness.js";
import { readAutoMovieCollisionMotion } from "./readAutoMovieCollisionMotion.js";
import { resolveAutoMovieCollisionHit } from "./resolveAutoMovieCollisionHit.js";

/** One placed instant: the collected parts and their memoized solids per layer. */
interface IInstant {
  readonly layers: ReadonlyMap<string, ILayerState>;
}

/** One layer at one placed instant. */
interface ILayerState {
  readonly layer: observeAutoMovieCollisionMotion.ILayer;
  readonly collected: collectAutoMovieCollisionParts.IResult;
  readonly parts: ReadonlyMap<string, Collision.IPart>;
  readonly motion: ReadonlyMap<string, readAutoMovieCollisionMotion.IPose>;
  readonly solidOf: findAutoMovieCollisionWitness.IProps["solidOf"];
  readonly geometry: Pick<Geometry.IQueries, "contact">;
}

/**
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
 * crossing a cut or a declared break is examined. The drawn instant is placed
 * again before returning, so every host keeps drawing it.
 *
 * @param props The span, its continuity, the placement and layer readers, the
 *   contact query and the work limits.
 * @returns Sub-frame findings with their bracketing span, and one coverage row
 *   per layer and per unresolved pair.
 */
export function observeAutoMovieCollisionMotion(
  props: observeAutoMovieCollisionMotion.IProps,
): Pick<Diagnostic, "findings" | "coverage"> {
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
  ): void => {
    const obligation: boolean = required.get(layer) ?? false;
    coverage.push(
      status === "checked"
        ? { check: "collision", key, required: obligation, status }
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
  const budget: observeAutoMovieCollisionMotion.ILimits = { ...props.limits };
  const instants: Map<number, IInstant> = new Map();
  const at = (seconds: number): IInstant | "budget" => {
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) return known;
    if (budget.placements === 0) return "budget";
    --budget.placements;
    props.place(seconds);
    const instant: IInstant = readInstant(
      props.layers(seconds),
      budget,
      props.geometry,
    );
    instants.set(seconds, instant);
    return instant;
  };
  const limited: Set<string> = new Set();
  try {
    const end: IInstant = readInstant(props.layers(to), budget, props.geometry);
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
        const key: string = JSON.stringify([id, "motion", a, b]);
        if (confirmedAt(first, a, b, budget) || confirmedAt(last, a, b, budget))
          continue;
        const outcome: IOutcome = bisect(
          { id, a, b, at, budget, depth: props.limits.depth },
          from,
          to,
        );
        if (outcome.kind === "clear") continue;
        if (outcome.kind === "limit") {
          limited.add(id);
          row(key, id, "deferred", outcome.reason);
          continue;
        }
        row(key, id, "checked", "");
        findings.push(
          createAutoMovieCollisionFinding(
            key,
            [a, b],
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

/** Every kind of work an observation may spend. */
const LIMIT_KINDS: readonly (keyof observeAutoMovieCollisionMotion.ILimits)[] =
  [
    "placements",
    "depth",
    "comparisons",
    "posedVertices",
    "surfaceTriangles",
    "parts",
  ];

/** The span, placement, layers and limits of one motion observation. */
export namespace observeAutoMovieCollisionMotion {
  /** A collision layer readable at any placed instant. */
  export interface ILayer extends collectAutoMovieCollisionParts.ILayer {
    /** Distinct layer identity, shared with the placed-frame rows. */
    readonly id: string;
    /** Layer-local seconds at this instant. */
    readonly localSeconds: number;
    /** Whether delivery requires this layer's collision obligations. */
    readonly required?: boolean;
    /** Named permitted contact. */
    readonly allowances?: readonly Collision.IAllowance[];
  }

  /** Work the observation may spend. */
  export interface ILimits {
    /** Extra instants that may be placed, including the preceding one. */
    placements: number;
    /** Halvings of the span allowed for one pair. */
    depth: number;
    /** Pair and witness comparisons. */
    comparisons: number;
    /** Posed surface vertices read for witnesses. */
    posedVertices: number;
    /** Triangle visits spent on closed surfaces. */
    surfaceTriangles: number;
    /** Collected parts over every placed instant, when bounded. */
    parts?: number;
  }

  /** One motion observation. */
  export interface IProps {
    /** The drawn sample's clock. */
    readonly time: Diagnostic.ITime;
    /** Film seconds of the preceding output instant. */
    readonly fromSeconds: number;
    /** Whether the span between the two instants has a physical path. */
    readonly continuous: boolean;
    /** Places the scene at a film second through the playback placement. */
    readonly place: (filmSeconds: number) => void;
    /** The collision layers of the placed scene at a film second. */
    readonly layers: (filmSeconds: number) => readonly ILayer[];
    /** The initialized convex contact query. */
    readonly geometry: Pick<Geometry.IQueries, "contact">;
    /** Work the observation may spend. */
    readonly limits: ILimits;
    /** Filled at return with the work spent. */
    readonly spent?: ILimits;
  }
}

/** Result of bisecting one pair's span. */
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

/** Collect every layer at the placed instant and record its feature poses. */
function readInstant(
  layers: readonly observeAutoMovieCollisionMotion.ILayer[],
  budget: { posedVertices: number; parts?: number },
  geometry: Pick<Geometry.IQueries, "contact">,
): IInstant {
  const states: Map<string, ILayerState> = new Map();
  for (const layer of layers) {
    const collected: collectAutoMovieCollisionParts.IResult =
      collectAutoMovieCollisionParts(layer, budget);
    const parts: Map<string, Collision.IPart> = new Map(
      collected.parts.map(
        (part: Collision.IPart): [string, Collision.IPart] => [part.id, part],
      ),
    );
    const motion: Map<string, readAutoMovieCollisionMotion.IPose> = new Map();
    for (const part of collected.parts) {
      const pose: readAutoMovieCollisionMotion.IPose | null =
        readAutoMovieCollisionMotion(part);
      if (pose !== null) motion.set(part.id, pose);
    }
    const solids: Map<
      string,
      findAutoMovieCollisionWitness.ISolid | null | "budget"
    > = new Map();
    states.set(layer.id, {
      layer,
      geometry,
      collected,
      parts,
      motion,
      solidOf: (
        id: string,
      ): findAutoMovieCollisionWitness.ISolid | null | "budget" => {
        if (!solids.has(id))
          solids.set(
            id,
            findAutoMovieCollisionWitness.solid(
              parts.get(id),
              collected.surfaces.get(id),
            ),
          );
        return solids.get(id)!;
      },
    });
  }
  return { layers: states };
}

/**
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
    const begin: readAutoMovieCollisionMotion.IPose | undefined =
      first.motion.get(id);
    if (begin === undefined) continue;
    const group: Collision.IGroup | undefined = last.parts.get(id)?.group;
    swept.push({
      id,
      box: readAutoMovieCollisionMotion.swept(begin, end),
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
        readAutoMovieCollisionMotion.displacement(
          first.motion.get(a.id)!,
          last.motion.get(a.id)!,
        ) +
        readAutoMovieCollisionMotion.displacement(
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

/**
 * Bisect a pair's span at placed instants until a witness, clearance or a
 * limit.
 */
function bisect(
  pair: {
    id: string;
    a: string;
    b: string;
    at: (seconds: number) => IInstant | "budget";
    budget: observeAutoMovieCollisionMotion.ILimits;
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
      const found = witnessAt(state, pair.a, pair.b, pair.budget);
      if (found !== null)
        return {
          kind: "witness",
          seconds: middle,
          from: span.from,
          to: span.to,
          ...found,
        };
    }
    spans.push(
      { from: span.from, to: middle, depth: span.depth + 1 },
      { from: middle, to: span.to, depth: span.depth + 1 },
    );
  }
  return { kind: "clear" };
}

/** Whether the pair's motion over a span can still hide a crossing. */
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
      readAutoMovieCollisionMotion.swept(a0, a1),
      readAutoMovieCollisionMotion.swept(b0, b1),
    )
  )
    return false;
  const moved: number =
    readAutoMovieCollisionMotion.displacement(a0, a1) +
    readAutoMovieCollisionMotion.displacement(b0, b1);
  return moved >= Math.min(a1.thickness, b1.thickness) / 2;
}

/** Whether a placed instant already confirms the pair. */
function confirmedAt(
  state: ILayerState,
  a: string,
  b: string,
  budget: observeAutoMovieCollisionMotion.ILimits,
): boolean {
  return witnessAt(state, a, b, budget) !== null;
}

/** The pair's witness at one placed instant, by the placed-frame resolution. */
function witnessAt(
  state: ILayerState,
  a: string,
  b: string,
  budget: observeAutoMovieCollisionMotion.ILimits,
): { point: { x: number; y: number; z: number }; separation: number } | null {
  const first: Collision.IPart | undefined = state.parts.get(a);
  const second: Collision.IPart | undefined = state.parts.get(b);
  if (first === undefined || second === undefined) return null;
  const result: Collision.IResult = AutoMovieEngineValidation.measureSceneCollision({
    parts: [first, second],
    geometry: state.geometry,
    seconds: state.layer.localSeconds,
    allowances: state.layer.allowances,
    maxComparisons: Math.min(budget.comparisons, 16),
  });
  budget.comparisons -= Object.values(result.compared).reduce(
    (x: number, y: number): number => x + y,
    0,
  );
  for (const hit of result.findings) {
    const outcome: resolveAutoMovieCollisionHit.IResolution =
      resolveAutoMovieCollisionHit({
        hit,
        surfaces: state.collected.surfaces,
        solidOf: state.solidOf,
        allowances: state.layer.allowances ?? [],
        seconds: state.layer.localSeconds,
        budget,
      });
    if (outcome.kind === "witness")
      return { point: outcome.point, separation: outcome.separation };
  }
  return null;
}

/** Closed boxes overlap. */
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
