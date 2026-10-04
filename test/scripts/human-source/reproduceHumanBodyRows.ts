import { createHumanSourceBodyRecipes } from "./createHumanSourceBodyRecipes.ts";
import { denseHumanSourceRows } from "./denseHumanSourceRows.ts";
import { measureHumanSourceError } from "./measureHumanSourceError.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceBodyInput } from "./structures/IHumanSourceBodyInput.ts";
import type { IHumanSourceBodyReproduction } from "./structures/IHumanSourceBodyReproduction.ts";
import type { IHumanSourceLoss } from "./structures/IHumanSourceLoss.ts";
import type { IHumanSourceReproductionError } from "./structures/IHumanSourceReproductionError.ts";
import type { IHumanSourceReproductionRow } from "./structures/IHumanSourceReproductionRow.ts";

/**
 * Reproduce the published body skin endpoints on the source generation.
 *
 * Every published body vertex is an exact source vertex, so the one-skin
 * carry keeps all of them. The P1 body surface is the source complement of
 * the frozen cut: it drops published vertices on the head side and gains
 * body-side source vertices the published body never had plus the W samples.
 *
 * A value at a source vertex is the published row where the published body
 * has the vertex, else the upstream recipe rounded as the extractor stored
 * rows (micrometres, half to even), else unknown. A W sample is the stencil of
 * its two ends. An endpoint without a recipe whose unknown vertices border
 * published vertices where it moves is unavailable there; the rows at those
 * vertices are omitted and the reason recorded, never filled with zero. When
 * the endpoint is zero on every bordering published vertex, the zero
 * extension is recorded as such.
 */
export function reproduceHumanBodyRows(input: IHumanSourceBodyInput): IHumanSourceBodyReproduction {
  const { body, cut, reader, field } = input;
  const surface = body.surfaces[0];
  const count = surface.positions.length / 3;
  const n = cut.originalVertices;
  const kept = cut.r16ToSource;
  if (kept.length !== count) throw new Error("The body vertex map does not describe the published skin.");
  const r16Of = new Int32Array(n).fill(-1);
  kept.forEach((source, v) => (r16Of[source] = v));
  const p1Count = cut.p1BodySamples.length;
  const inP1 = new Uint8Array(n);
  for (const s of cut.p1BodySamples) if (s.a === s.b) inP1[s.a] = 1;
  const newOriginals: number[] = [];
  for (let x = 0; x < n; x++) if (inP1[x] === 1 && r16Of[x] < 0) newOriginals.push(x);
  const droppedR16: number[] = [];
  for (let v = 0; v < count; v++) if (inP1[kept[v]] === 0) droppedR16.push(v);
  const p1UnknownCandidates = new Uint8Array(p1Count);
  cut.p1BodySamples.forEach((s, j) => {
    if (s.a !== s.b || r16Of[s.a] < 0) p1UnknownCandidates[j] = 1;
  });
  const band = new Set<number>();
  for (let i = 0; i < cut.p1BodyIndices.length; i += 3) {
    const ids = [0, 1, 2].map((k) => cut.p1BodyIndices[i + k]);
    if (!ids.some((j) => p1UnknownCandidates[j] === 1)) continue;
    for (const j of ids) {
      const s = cut.p1BodySamples[j];
      if (s.a === s.b && r16Of[s.a] >= 0) band.add(r16Of[s.a]);
    }
  }

  const recipeOf = createHumanSourceBodyRecipes(reader, field);
  const correctiveTargets = new Set((body.correctives ?? []).map((c) => c.target));
  const zero = (vertices: number): IHumanSourceReproductionError => ({
    maximumMetres: 0,
    rmsMetres: 0,
    float32MaximumMetres: 0,
    comparedVertices: vertices,
    differingVertices: 0,
  });
  const rows: IHumanSourceReproductionRow[] = [];
  const losses: IHumanSourceLoss[] = [];
  const g1Targets: Record<string, number[]> = {};
  const p1Targets: Record<string, number[]> = {};
  const unavailable: Record<string, string> = {};
  const value = new Float64Array(3);

  for (const [name, published] of Object.entries(surface.targets)) {
    const d = denseHumanSourceRows(published, count);
    const recipe = recipeOf(name);
    const rounded = recipe === null ? null : recipe.skin.map((x) => roundHalfEven(x, 6));
    let regeneration: IHumanSourceReproductionError | null = null;
    if (rounded !== null) {
      const candidate = new Float64Array(3 * count);
      for (let v = 0; v < count; v++)
        for (let c = 0; c < 3; c++) candidate[3 * v + c] = rounded[3 * kept[v] + c];
      regeneration = measureHumanSourceError({ published: d, candidate, neutral: surface.positions });
    }
    const known = (x: number): boolean => r16Of[x] >= 0 || rounded !== null;
    const read = (x: number, out: Float64Array, weight: number): void => {
      const v = r16Of[x];
      for (let c = 0; c < 3; c++) out[c] += weight * (v >= 0 ? d[3 * v + c] : rounded![3 * x + c]);
    };
    const evaluate = (a: number, b: number, t: number): boolean => {
      value.fill(0);
      if (a === b) {
        if (!known(a)) return false;
        read(a, value, 1);
        return true;
      }
      if (!known(a) || !known(b)) return false;
      read(a, value, 1 - t);
      read(b, value, t);
      return true;
    };

    // P1 surface rows and unknown population.
    const p1: number[] = [];
    let unknownP1 = 0;
    cut.p1BodySamples.forEach((s, j) => {
      if (!evaluate(s.a, s.b, s.t)) {
        unknownP1++;
        return;
      }
      if (value[0] !== 0 || value[1] !== 0 || value[2] !== 0) p1.push(j, value[0], value[1], value[2]);
    });
    let bandMagnitude = 0;
    let bandMoving = 0;
    if (unknownP1 > 0)
      for (const v of band) {
        const m = Math.hypot(d[3 * v], d[3 * v + 1], d[3 * v + 2]);
        if (m > 0) bandMoving++;
        bandMagnitude = Math.max(bandMagnitude, m);
      }
    const isUnavailable = unknownP1 > 0 && bandMoving > 0;
    if (isUnavailable) {
      unavailable[name] = `${unknownP1} P1 body vertices have no source value; the endpoint moves ${bandMoving} bordering published vertices`;
      losses.push({
        basis: "body",
        surface: "Human",
        row: name,
        kind: "unavailable-at-new-support",
        vertices: unknownP1,
        maximumMetres: bandMagnitude,
        reason: "post-extraction field without a tracked producer; values at new neck vertices and cut samples need the producer reimplemented",
      });
    }
    p1Targets[name] = p1;

    // One-skin rows: every published vertex, new originals, W samples.
    const g1: number[] = [];
    const g1Rows: [number, number, number, number][] = [];
    for (let v = 0; v < count; v++)
      if (d[3 * v] !== 0 || d[3 * v + 1] !== 0 || d[3 * v + 2] !== 0)
        g1Rows.push([kept[v], d[3 * v], d[3 * v + 1], d[3 * v + 2]]);
    if (rounded !== null)
      for (const x of newOriginals)
        if (rounded[3 * x] !== 0 || rounded[3 * x + 1] !== 0 || rounded[3 * x + 2] !== 0)
          g1Rows.push([x, rounded[3 * x], rounded[3 * x + 1], rounded[3 * x + 2]]);
    cut.intersections.forEach((s, i) => {
      if (evaluate(s.a, s.b, s.t) && (value[0] !== 0 || value[1] !== 0 || value[2] !== 0))
        g1Rows.push([n + i, value[0], value[1], value[2]]);
    });
    g1Rows.sort((x, y) => x[0] - y[0]);
    for (const row of g1Rows) g1.push(...row);
    g1Targets[name] = g1;

    // P1 carry: published vertices the complement drops.
    const p1Carried = Float64Array.from(d);
    let droppedMagnitude = 0;
    let droppedMoving = 0;
    for (const v of droppedR16) {
      const m = Math.hypot(d[3 * v], d[3 * v + 1], d[3 * v + 2]);
      if (m > 0) droppedMoving++;
      droppedMagnitude = Math.max(droppedMagnitude, m);
      p1Carried.fill(0, 3 * v, 3 * v + 3);
    }
    if (droppedMoving > 0)
      losses.push({
        basis: "body",
        surface: "Human",
        row: name,
        kind: "p1-dropped-overlap",
        vertices: droppedMoving,
        maximumMetres: droppedMagnitude,
        reason: "published body vertices above the frozen cut belong to the head partition; P1 drops them, P2 keeps them",
      });
    rows.push({
      basis: "body",
      surface: "Human",
      row: name,
      role: correctiveTargets.has(name) ? "corrective" : "channel-endpoint",
      provenance: recipe === null ? "carried-published" : "upstream-recipe",
      recipe: recipe === null ? null : recipe.state,
      regeneration,
      p2: zero(count),
      p1: measureHumanSourceError({ published: d, candidate: p1Carried, neutral: surface.positions }),
      newSupport: rounded !== null ? "regenerated" : isUnavailable ? "unavailable" : "not-needed",
      note:
        rounded !== null
          ? "new support regenerated from the recipe"
          : unknownP1 > 0 && !isUnavailable
            ? "zero extension: the endpoint is zero on every published vertex bordering the unknown support"
            : isUnavailable
              ? "unavailable at new support"
              : "no unknown support",
    });
    if (recipe === null) {
      let magnitude = 0;
      let moving = 0;
      for (let v = 0; v < count; v++) {
        const m = Math.hypot(d[3 * v], d[3 * v + 1], d[3 * v + 2]);
        if (m > 0) moving++;
        magnitude = Math.max(magnitude, m);
      }
      losses.push({
        basis: "body",
        surface: "Human",
        row: name,
        kind: "not-regenerated-from-upstream",
        vertices: moving,
        maximumMetres: magnitude,
        reason: "authored after extraction (r16 individuality, envelope, definition, pose or state correctives); value carried from the published body",
      });
    }
  }
  return {
    rows,
    losses,
    g1Targets,
    p1Targets,
    unavailable,
    newOriginals,
    droppedR16,
    checks: {
      bodyVertices: count,
      p1BodyVertices: p1Count,
      newOriginals: newOriginals.length,
      droppedPublishedVertices: droppedR16.length,
      bandPublishedVertices: band.size,
      p1UnknownCandidateVertices: p1UnknownCandidates.reduce((a, b) => a + b, 0),
    },
  };
}
