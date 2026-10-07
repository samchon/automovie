import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { readHumanSourcePlaneSections } from "./readHumanSourcePlaneSections.ts";
import type { IHumanSourceTongueRestEvaluation } from "./structures/IHumanSourceTongueRestEvaluation.ts";
import type { IHumanSourceTongueRestProblem } from "./structures/IHumanSourceTongueRestProblem.ts";

/**
 * Read a source tongue against every actual post-occlusion crown and the
 * normal lining field. T1 uses all native vertices and transversal triangle
 * crossings. T2 reads the most anterior source station in the lower incisor
 * height interval. T3 sections the actual tongue at each lower 4–7 station.
 * T4 includes native vertices and exact midline-strip edge intersections.
 *
 * The 0.3/1/4 mm conditions are existing source authoring conventions, not
 * clinical normal ranges. The palate field readings are explicitly sampled;
 * full curved-field/surface and rendered admission remains the normal consumer's
 * obligation, so this result is not called whole tongue feasibility. No
 * clinical volume or length mean replaces the actual source proxy.
 */
export function evaluateHumanSourceTongueRest(
  problem: IHumanSourceTongueRestProblem,
  positions: readonly number[],
): IHumanSourceTongueRestEvaluation {
  const point = (vertex: number): number[] =>
    positions.slice(3 * vertex, 3 * vertex + 3);
  const project = (
    p: readonly number[],
    direction: readonly number[],
  ): number =>
    direction.reduce(
      (sum, value, axis) =>
        sum + value * (p[axis] - problem.upper.origin[axis]),
      0,
    );
  const all = Array.from({ length: positions.length / 3 }, (_, vertex) =>
    point(vertex),
  );
  const mesh: IAutoMovieMesh = {
    positions: [...positions],
    indices: [...problem.indices],
    normals: null,
    uvs: null,
    skin: null,
  };
  const penetratingCrowns: string[] = [],
    crossingCrowns: string[] = [];
  let penetrationSquaredMetres = 0;
  for (const crown of problem.crowns) {
    let inside = false;
    for (const p of all) {
      const distance = crown.signedDistance(p);
      if (distance < 0) {
        inside = true;
        penetrationSquaredMetres += distance * distance;
      }
    }
    if (inside) penetratingCrowns.push(crown.id);
    if (measureAutoMovieMeshCrossings(mesh, crown.mesh).length !== 0)
      crossingCrowns.push(crown.id);
  }
  const forward = all.map((p) => project(p, problem.upper.forward));
  const greatest = Math.max(...forward),
    tips = all.filter((_, at) => forward[at] === greatest);
  const incisors = problem.crowns.filter(
    (crown) => crown.id === "31" || crown.id === "41",
  );
  if (incisors.length !== 2)
    throw new Error("Source tongue needs both actual lower central incisors.");
  let tipGapMetres = 0,
    tipHeightWithinIncisors = true;
  for (const tip of tips) {
    tipGapMetres = Math.max(
      tipGapMetres,
      Math.min(...incisors.map((crown) => crown.query(tip).distance)),
    );
    const heights = incisors.flatMap((crown) =>
      crown.vertices.map((vertex) =>
        project(
          crown.mesh.positions.slice(3 * vertex, 3 * vertex + 3),
          problem.upper.apical,
        ),
      ),
    );
    const height = project(tip, problem.upper.apical);
    tipHeightWithinIncisors &&=
      height >= Math.min(...heights) && height <= Math.max(...heights);
  }
  const lateralGapsMetres: number[] = [];
  for (const station of problem.lower.stations.filter(
    (one) => Number(one.id[1]) >= 4 && Number(one.id[1]) <= 7,
  )) {
    const origin = problem.lower.origin.map(
      (value, axis) => value + station.centre[1] * problem.lower.forward[axis],
    );
    const loops = readHumanSourcePlaneSections(
      positions,
      problem.indices,
      origin,
      problem.lower.forward,
    );
    if (loops.length !== 1)
      throw new Error(
        "Source tongue lateral station has no unique closed body section: " +
          station.id,
      );
    const side = Number(station.id[0]) === 3 ? 1 : -1;
    const lateral = (p: readonly number[]): number =>
      side * project(p, problem.upper.lateral);
    const extreme = loops[0].reduce((best, sample) =>
      lateral(sample.point) > lateral(best.point) ? sample : best,
    );
    const crown = problem.crowns.find((one) => one.id === station.id)!;
    lateralGapsMetres.push(crown.query(extreme.point).distance);
  }
  const samples = [...all];
  for (const u of [-0.005, 0.005]) {
    const origin = problem.upper.origin.map(
      (value, axis) => value + u * problem.upper.lateral[axis],
    );
    for (const loop of readHumanSourcePlaneSections(
      positions,
      problem.indices,
      origin,
      problem.upper.lateral,
    ))
      samples.push(...loop.map((sample) => sample.point));
  }
  const gap = (p: readonly number[]): number =>
    problem.palate.apical(
      project(p, problem.upper.lateral),
      project(p, problem.upper.forward),
    ) - project(p, problem.upper.apical);
  const central = samples.filter(
    (p) => Math.abs(project(p, problem.upper.lateral)) <= 0.005,
  );
  if (central.length === 0)
    throw new Error("Source tongue has no actual midline-strip material.");
  const highest = central.reduce((best, p) =>
    project(p, problem.upper.apical) > project(best, problem.upper.apical)
      ? p
      : best,
  );
  const dorsumPalateGapMetres = gap(highest),
    sampledPalateMinimumMetres = Math.min(...samples.map(gap));
  let symmetryMaximumMetres = 0;
  for (const p of all) {
    const u = project(p, problem.upper.lateral);
    const reflected = p.map(
      (value, axis) => value - 2 * u * problem.upper.lateral[axis],
    );
    symmetryMaximumMetres = Math.max(
      symmetryMaximumMetres,
      Math.min(
        ...all.map((q) =>
          Math.hypot(...q.map((value, axis) => value - reflected[axis])),
        ),
      ),
    );
  }
  const excesses = [
    Math.max(0, tipGapMetres - 0.0003),
    ...lateralGapsMetres.map((gap) => Math.max(0, gap - 0.001)),
    Math.max(0, -dorsumPalateGapMetres, dorsumPalateGapMetres - 0.004),
    Math.max(0, -sampledPalateMinimumMetres),
    Math.max(0, symmetryMaximumMetres - 0.00001),
  ];
  return {
    penetratingCrowns,
    crossingCrowns,
    penetrationSquaredMetres,
    tipGapMetres,
    tipHeightWithinIncisors,
    lateralGapsMetres,
    dorsumPalateGapMetres,
    sampledPalateMinimumMetres,
    symmetryMaximumMetres,
    excessSquaredMetres: excesses.reduce(
      (sum, value) => sum + value * value,
      0,
    ),
    sampledFeasible:
      penetratingCrowns.length === 0 &&
      crossingCrowns.length === 0 &&
      tipHeightWithinIncisors &&
      excesses.every((value) => value === 0),
    qualification:
      "Actual native source/crown contacts and exact source sections; analytic lining clearance sampled at native/strip points. Full-surface, shared-loop, Float32 and normal consumer/GPU admission remain open. No clinical normality is inferred.",
  };
}
