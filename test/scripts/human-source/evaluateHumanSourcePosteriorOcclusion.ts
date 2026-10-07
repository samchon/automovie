import { measureAutoMovieMeshCrossings } from "@automovie/engine";

import { createHumanSourceCrownSolids } from "./createHumanSourceCrownSolids.ts";
import { evaluateHumanSourcePosteriorPositions } from "./evaluateHumanSourcePosteriorPositions.ts";
import { measureHumanSourceCrownGap } from "./measureHumanSourceCrownGap.ts";
import { measureHumanSourceIncisorRelation } from "./measureHumanSourceIncisorRelation.ts";
import type { IHumanSourceOralPairReading } from "./structures/IHumanSourceOralPairReading.ts";
import type { IHumanSourcePosteriorOcclusionEvaluation } from "./structures/IHumanSourcePosteriorOcclusionEvaluation.ts";
import type { IHumanSourcePosteriorOcclusionProblem } from "./structures/IHumanSourcePosteriorOcclusionProblem.ts";

/** Authored geometry intervals, metres; retained from the oral owner's E2–E5. */
const POSTERIOR_GAP = 0.0002, ANTERIOR_GAP = 0.0005;
const OVERBITE_MIN = 0.0013, OVERBITE_MAX = 0.0043;
const OVERJET_MIN = 0.002, OVERJET_MAX = 0.004;

/**
 * Read every closed-source antagonist pair and every full-surface contact gap.
 *
 * A candidate is rebuilt from immutable source frames. Each of 256 pairs reads
 * every vertex in both directions and the existing triangle crossing owner;
 * unknown sides or arithmetic failures refuse through the closed query.
 * Crossed triangle surfaces have zero surface gap; other gaps use both vertex
 * directions and all eligible edge pairs. Search merits never relax these
 * predicates or the oral owner's authored intervals. This is represented-source
 * feasibility, not clinical normality or proof of a global optimum.
 */
export function evaluateHumanSourcePosteriorOcclusion(
  problem: IHumanSourcePosteriorOcclusionProblem,
  scales: readonly number[],
): IHumanSourcePosteriorOcclusionEvaluation {
  const start = performance.now();
  const positions = evaluateHumanSourcePosteriorPositions(problem, scales);
  const solids = createHumanSourceCrownSolids(problem.face, positions, problem.crownTopology);
  const prepared = performance.now();
  const upper = solids.filter((crown) => !crown.mandibular), lower = solids.filter((crown) => crown.mandibular);
  const overlaps: IHumanSourceOralPairReading[] = [];
  const gapOf = new Map<string, number>();
  const against = new Map<string, string>();
  let penetrationSquared = 0;
  let pairs = 0, vertexQueries = 0, eligibleGaps = 0, measuredGaps = 0;
  let vertexMilliseconds = 0, crossingMilliseconds = 0, gapMilliseconds = 0;
  for (const above of upper)
    for (const below of lower) {
      pairs++;
      let phaseStart = performance.now();
      let upperInside = 0, lowerInside = 0, deepest = 0;
      for (const vertex of above.vertices) {
        vertexQueries++;
        const distance = below.signedDistance(positions.slice(3 * vertex, 3 * vertex + 3));
        if (distance < 0) { upperInside++; deepest = Math.max(deepest, -distance); penetrationSquared += distance * distance; }
      }
      for (const vertex of below.vertices) {
        vertexQueries++;
        const distance = above.signedDistance(positions.slice(3 * vertex, 3 * vertex + 3));
        if (distance < 0) { lowerInside++; deepest = Math.max(deepest, -distance); penetrationSquared += distance * distance; }
      }
      vertexMilliseconds += performance.now() - phaseStart;
      phaseStart = performance.now();
      const crossings = measureAutoMovieMeshCrossings(above.mesh, below.mesh).length;
      crossingMilliseconds += performance.now() - phaseStart;
      if (upperInside !== 0 || lowerInside !== 0 || crossings !== 0)
        overlaps.push({ upper: above.id, lower: below.id, upperVerticesInsideLower: upperInside,
          lowerVerticesInsideUpper: lowerInside, deepestMetres: deepest, crossingTriangles: crossings });
      // E2 is lower posterior against the upper arch. E5 is specifically
      // lower anterior against upper anterior, as the source contract states.
      if (Number(below.id[1]) >= 4 || Number(above.id[1]) <= 3) {
        eligibleGaps++;
        phaseStart = performance.now();
        const gap = crossings === 0 ? measureHumanSourceCrownGap(above, below) : 0;
        if (crossings === 0) measuredGaps++;
        gapMilliseconds += performance.now() - phaseStart;
        if (gap < (gapOf.get(below.id) ?? Infinity)) { gapOf.set(below.id, gap); against.set(below.id, above.id); }
      }
    }
  const readings = lower.map((crown) => ({ crown: crown.id, distanceMetres: gapOf.get(crown.id)!, against: against.get(crown.id) }));
  const posterior = readings.filter((reading) => Number(reading.crown[1]) >= 4);
  const anterior = readings.filter((reading) => Number(reading.crown[1]) <= 3);
  const incisors = measureHumanSourceIncisorRelation(problem.face, positions, problem.direction, problem.forward);
  const intervalExcess = (value: number, minimum: number, maximum: number): number =>
    Math.max(0, minimum - value, value - maximum);
  const excesses = [...posterior.map((reading) => intervalExcess(reading.distanceMetres, 0, POSTERIOR_GAP)),
    ...anterior.map((reading) => intervalExcess(reading.distanceMetres, 0, ANTERIOR_GAP)),
    intervalExcess(incisors.overbiteMetres, OVERBITE_MIN, OVERBITE_MAX),
    intervalExcess(incisors.overjetMetres, OVERJET_MIN, OVERJET_MAX)];
  if (readings.some((reading) => !Number.isFinite(reading.distanceMetres)))
    throw new Error("Posterior source evaluation has an undefined crown gap.");
  const evaluation: IHumanSourcePosteriorOcclusionEvaluation = { scales: [...scales], objective: scales.reduce((sum, scale) => sum + (1 - scale) ** 2, 0), overlaps,
    penetrationSquaredMetres: penetrationSquared, posteriorContacts: posterior, anteriorClearances: anterior,
    excessSquaredMetres: excesses.reduce((sum, value) => sum + value * value, 0), incisors,
    feasible: overlaps.length === 0 && excesses.every((value) => value === 0) };
  // Wall-clock evidence stays outside the deterministic source result and
  // its generation fingerprint. Every count is from this completed reading.
  console.log("[human-source] oral-cost " + JSON.stringify({ crowns: solids.length, pairs, vertexQueries, eligibleGaps, measuredGaps,
    nativeVertices: solids.reduce((sum, crown) => sum + crown.vertices.length, 0),
    triangles: solids.reduce((sum, crown) => sum + crown.mesh.indices!.length / 3, 0),
    preparationMilliseconds: prepared - start, vertexMilliseconds, crossingMilliseconds, gapMilliseconds,
    elapsedMilliseconds: performance.now() - start }));
  return evaluation;
}
