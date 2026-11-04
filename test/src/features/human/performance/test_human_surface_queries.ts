import { TestValidator } from "@nestia/e2e";

import { HumanAnatomySurface } from "../../internal/HumanAnatomySurface";
import type { HumanAnatomy } from "../../internal/HumanAnatomy";
import { HumanAnatomyMirror } from "../../internal/HumanAnatomyMirror";
import { HumanAnatomyShared } from "../../internal/HumanAnatomyShared";
import { HumanAnatomyVector } from "../../internal/HumanAnatomyVector";
import { nclose } from "../../internal/nclose";

/** Independent emitted skin consumed by the anatomy observers. */
type Skin = HumanAnatomy.ISkin;

/** Position in the observer's millimetre frame. */
type Point = HumanAnatomy.V3;

/**
 * The anatomy observers' spatial acceleration preserves ray measurements
 * and finds the globally nearest skin. These are independent mesh queries,
 * not a construction or a fit of a Human figure.
 *
 * Scenarios:
 * 1. Empty skin gives no ray crossings and infinite distances. A single plane triangle gives one forward crossing and none backward or outside its support.
 * 2. Cubes of half side 20, 80, 320 and 3200 mm have one exit from an interior point in each signed axis direction, and two or zero crossings from an exterior point; nearest distances follow their plane equations. One reference per triangle and a derived linear typed-capacity bound hold; increasing coordinate extent cannot increase storage at the same triangle population. A smaller valid index is admitted. Resource readings impose no host-dependent timing or heap limit.
 * 3. Distance queries return the analytic distance near and far from a cube face, on either side of the former grid-cell boundary and at the cube's centre. A nonempty skin always has a finite nearest distance, including a large asymmetry that the mirror observers must report.
 * 4. All seven closest-point Voronoi regions of a right triangle, exact ray-origin/face/diagonal boundaries, repeated triangle centroids, a translated asymmetric cube and fresh skin identities distinguish distance, traversal and reuse decisions. Repeated queries share one index; an empty point request acquires none.
 * 5. Collapsed points, repeated-vertex segments, collinear triangles and thin nonzero-area faces retain their closed-set distance under all six vertex orders and rigid axis changes. Mixed normal/collapsed leaves cannot poison the global minimum with NaN.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual HumanAnatomySurface ray and distance entries on made meshes, testing both signed directions on all axes, empty skin, one triangle and near/far nearest-distance queries. It catches omitted candidates, changed crossing counts, changed nearest-hit distances and a search horizon that hides a large skin departure.
 * @evidence contracts/testing.md#independent-expectations Plane equations give cube exits, triangle hits and face distances. Pythagoras and clamping to the literal line endpoints give collapsed distances; a point over the interior of a 1000 by 0.000001 mm thin face is its authored perpendicular height away. Coordinate permutations, sign flips and translations preserve those distances. Both public distance consumers require distance to the nearest skin, so an acceleration cell boundary cannot suppress an outlying point.
 * @evidence contracts/testing.md#distinguishing-cases Positive and negative rays, all axes, empty and single-triangle meshes, four coordinate scales, seven triangle regions, near/far queries, exact boundaries, equal centroids, changed skin identity and both real mirror consumers are covered. Direct leaf and actual index queries cover point, repeated-vertex segment, collinear and thin faces under six vertex permutations and three rigid frames, plus mixed normal/collapsed candidates in both orders. Shared-edge ties retain per-triangle counts; invalid mesh admission remains separate.
 * @evidence contracts/testing.md#execution-ownership One synchronous portable CPU test reached by --include human_surface_queries, generating no person and starting no renderer, process or browser. Its memory readings observe its own process and assert no machine-specific resource number.
 */
export function test_human_surface_queries(): void {
  const failures: string[] = [];

  /** Collect every failed contract without stopping the remaining probes. */
  const verify: (label: string, valid: boolean) => void = (label: string, valid: boolean): void => {
    try {
      TestValidator.predicate(label, valid);
    } catch (error) {
      failures.push((error as Error).message);
    }
  };

  /** Collect every scalar mismatch while allowing its floating-point rounding. */
  const check: (label: string, actual: number, expected: number) => void = (label: string, actual: number, expected: number): void =>
    verify(`${label}: ${actual}, expected ${expected}`, Number.isFinite(expected) ? nclose(actual, expected, 1e-10 * Math.max(1, Math.abs(expected))) : actual === expected);
  const empty: Skin = mesh([], []);
  check("empty crossings", HumanAnatomySurface.ray(empty, [0, 0, 0], 0, 1).crossings, 0);
  check("empty nearest", HumanAnatomySurface.ray(empty, [0, 0, 0], 0, 1).nearest, Infinity);
  check("empty distance", HumanAnatomySurface.distances(empty, [[0, 0, 0]])[0]!, Infinity);

  const triangle: Skin = mesh([0, -4, -4, 0, 4, -4, 0, 0, 4], [0, 1, 2]);
  check("triangle forward crossing", HumanAnatomySurface.ray(triangle, [-3, 0, 0], 0, 1).crossings, 1);
  check("triangle forward nearest", HumanAnatomySurface.ray(triangle, [-3, 0, 0], 0, 1).nearest, 3);
  check("triangle backward", HumanAnatomySurface.ray(triangle, [-3, 0, 0], 0, -1).crossings, 0);
  check("triangle outside", HumanAnatomySurface.ray(triangle, [-3, 6, 0], 0, 1).crossings, 0);
  check("triangle distance", HumanAnatomySurface.distances(triangle, [[3, 0, 0]])[0]!, 3);

  let firstCubeBytes: number | undefined;
  for (const radius of [20, 80, 320, 3200]) {
    const skin: Skin = cube(radius);
    const inside: Point = [radius / 7, radius / 11, radius / 13];
    const before: NodeJS.MemoryUsage = process.memoryUsage();
    const started: number = performance.now();
    for (let axis: number = 0; axis < 3; axis++)
      for (const sign of [1, -1] as const) {
        const read: { crossings: number; nearest: number } = HumanAnatomySurface.ray(skin, inside, axis, sign);
        check(`cube ${radius} axis ${axis} sign ${sign} exits`, read.crossings, 1);
        check(`cube ${radius} axis ${axis} sign ${sign} nearest`, read.nearest, radius - sign * inside[axis]!);
      }
    const outside: Point = [3 * radius, radius / 7, radius / 11];
    check(`cube ${radius} outside toward crossings`, HumanAnatomySurface.ray(skin, outside, 0, -1).crossings, 2);
    check(`cube ${radius} outside toward nearest`, HumanAnatomySurface.ray(skin, outside, 0, -1).nearest, 2 * radius);
    check(`cube ${radius} outside away`, HumanAnatomySurface.ray(skin, outside, 0, 1).crossings, 0);
    const near: Point = [radius + 2, radius / 7, radius / 11];
    check(`cube ${radius} near-face distance`, HumanAnatomySurface.distances(skin, [near])[0]!, 2);
    const retained: HumanAnatomySurface.IStatistics = HumanAnatomySurface.statistics(skin);
    check(`cube ${radius} shares one index`, retained.indexes, 1);
    check(`cube ${radius} keeps one reference per triangle`, retained.triangleReferences, skin.I.length / 3);
    verify(`cube ${radius} typed capacity respects the derived linear bound`, Number.isSafeInteger(retained.typedBytes) && retained.typedBytes >= 0 && retained.typedBytes <= 188 * (skin.I.length / 3) + 256);
    verify(`cube ${radius} extent cannot increase typed storage`, firstCubeBytes === undefined || retained.typedBytes <= firstCubeBytes);
    firstCubeBytes ??= retained.typedBytes;
    const after: NodeJS.MemoryUsage = process.memoryUsage();
    console.log(JSON.stringify({ halfSideMm: radius, triangles: skin.I.length / 3, index: retained, legacyRayReferences: rayReferences(skin), elapsedMs: performance.now() - started, heapDelta: after.heapUsed - before.heapUsed, externalDelta: after.external - before.external }));
  }

  const boundary: Skin = cube(20);
  const readings: number[] = HumanAnatomySurface.distances(boundary, [[29.5, 0.3, 0.4], [30, 0.3, 0.4], [60, 0.3, 0.4], [0, 0, 0]]);
  check("nearest distance before former cell boundary", readings[0]!, 9.5);
  check("nearest distance on former cell boundary", readings[1]!, 10);
  check("far nearest distance remains measured", readings[2]!, 40);
  check("cube centre nearest distance", readings[3]!, 20);

  // 4. A single right triangle has seven independently known closest regions.
  const right: Skin = mesh([0, 0, 0, 10, 0, 0, 0, 10, 0], [0, 1, 2]);
  const cases: [Point, number][] = [[[2, 2, 3], 3], [[-2, -2, 0], Math.sqrt(8)], [[12, -2, 0], Math.sqrt(8)], [[-2, 12, 0], Math.sqrt(8)], [[5, -2, 0], 2], [[-2, 5, 0], 2], [[6, 6, 0], Math.SQRT2]];
  for (const [p, expected] of cases) check(`right triangle closest region ${p.join(",")}`, HumanAnatomySurface.distances(right, [p])[0]!, expected);

  const collapsed: [Point[], [Point, number][]][] = [
    [[[2, 3, 4], [2, 3, 4], [2, 3, 4]], [[[2, 6, 8], 5], [[2, 3, 4], 0]]],
    [[[0, 0, 0], [0, 0, 0], [10, 0, 0]], [[[5, 3, 4], 5], [[-2, 3, 4], Math.sqrt(29)], [[12, 3, 4], Math.sqrt(29)], [[5, 0, 0], 0]]],
    [[[0, 0, 0], [4, 0, 0], [10, 0, 0]], [[[5, 3, 4], 5], [[-2, 3, 4], Math.sqrt(29)], [[12, 3, 4], Math.sqrt(29)], [[5, 0, 0], 0]]],
    [[[0, 0, 0], [1000, 0, 0], [500, 1e-6, 0]], [[[500, 0.5e-6, 1e-7], 1e-7], [[500, 0.5e-6, 0], 0], [[500, -2e-6, 0], 2e-6]]],
  ];
  for (let fixture: number = 0; fixture < collapsed.length; fixture++) {
    const [vertices, probes]: [Point[], [Point, number][]] = collapsed[fixture]!;
    for (const order of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]])
      for (let frame: number = 0; frame < 3; frame++) {
        const transformed: Point[] = order.map((i: number): Point => rigid(vertices[i]!, frame));
        const made: Skin = mesh(transformed.flat(), [0, 1, 2]);
        for (const [probe, expected] of probes) {
          const p: Point = rigid(probe, frame);
          const label: string = `closed triangle ${fixture} order ${order.join("")} frame ${frame} at ${probe.join(",")}`;
          check(`${label} leaf`, HumanAnatomyVector.triangleDistance(p, transformed[0]!, transformed[1]!, transformed[2]!), expected);
          check(`${label} index`, HumanAnatomySurface.distances(made, [p])[0]!, expected);
        }
      }
  }
  for (const order of [[0, 1, 2, 3, 4, 5], [3, 4, 5, 0, 1, 2]]) {
    const mixed: Skin = mesh([0, 0, 0, 10, 0, 0, 0, 10, 0, 100, 0, 0, 100, 0, 0, 110, 0, 0], order);
    check("normal leaf survives a collapsed neighbour", HumanAnatomySurface.distances(mixed, [[2, 2, 3]])[0]!, 3);
    check("collapsed leaf can be globally nearest", HumanAnatomySurface.distances(mixed, [[105, 3, 4]])[0]!, 5);
  }
  check("ray starting on its face outward", HumanAnatomySurface.ray(boundary, [20, 2, 3], 0, 1).crossings, 0);
  check("ray starting on its face inward", HumanAnatomySurface.ray(boundary, [20, 2, 3], 0, -1).nearest, 40);
  check("shared diagonal keeps both triangle hits", HumanAnatomySurface.ray(boundary, [0, 0, 0], 0, 1).crossings, 2);
  check("ray on projected box boundary", HumanAnatomySurface.ray(boundary, [0, 20, 3], 0, 1).crossings, 1);
  const duplicate: Skin = mesh([0, -4, -4, 0, 4, -4, 0, 0, 4], new Array<number>(8).fill(0).flatMap((): number[] => [0, 1, 2]));
  check("equal centroid partition retains every triangle", HumanAnatomySurface.ray(duplicate, [-3, 0, 0], 0, 1).crossings, 8);

  const fresh: Skin = cube(20);
  check("fresh skin has no index", HumanAnatomySurface.statistics(fresh).indexes, 0);
  check("empty point list", HumanAnatomySurface.distances(fresh, []).length, 0);
  check("empty request acquires no index", HumanAnatomySurface.statistics(fresh).indexes, 0);
  for (const offset of [39, 40, 41]) check(`far query ${offset} mm retains nearest`, HumanAnatomySurface.distances(fresh, [[20 + offset, 0.3, 0.4]])[0]!, offset);
  const reused: HumanAnatomySurface.IStatistics = HumanAnatomySurface.statistics(fresh);
  check("repeated queries share one index", reused.indexes, 1);
  check("repeated queries keep one reference per triangle", reused.triangleReferences, fresh.I.length / 3);
  verify("repeated queries retain linear typed capacity", reused.typedBytes <= 188 * (fresh.I.length / 3) + 256);

  const shifted: Skin = { ...fresh, P: Float64Array.from(fresh.P, (value: number, i: number): number => value + (i % 3 === 2 ? 40 : 0)) };
  check("copied skin has independent index identity", HumanAnatomySurface.statistics(shifted).indexes, 0);
  check("unchanged symmetric skin", HumanAnatomyMirror.offset(fresh, /^made$/, (_chain: string, q: Point): Point => q), 0);
  const offset: number = HumanAnatomyMirror.offset(shifted, /^made$/, (_chain: string, q: Point): Point => q);
  const symmetry: number = HumanAnatomyShared.symmetry("made", shifted, /^made$/, "translated cube")[0]!.value;
  try {
    TestValidator.predicate("both mirror consumers retain the translated cube's 40 to 80 mm departure", offset >= 40 - 1e-10 && offset <= 80 + 1e-10 && symmetry >= 40 - 1e-10 && symmetry <= 80 + 1e-10);
  } catch (error) {
    failures.push((error as Error).message);
  }
  if (failures.length !== 0) throw new Error(`${failures.length} surface-query findings:\n${failures.join("\n")}`);
}

/**
 * Three independently specified rigid frames preserve Euclidean distance.
 *
 * @evidence contracts/testing.md#behavioral-verification Moves each literal triangle and probe together before the real leaf and hierarchy queries.
 * @evidence contracts/testing.md#independent-expectations Axis permutations, sign flips and a common translation preserve the Euclidean norm; no observer calculation supplies this transform.
 * @evidence contracts/testing.md#distinguishing-cases Identity and two translated axis changes move the collapsed and thin fixtures off their original plane without changing the analytic expectations.
 * @evidence contracts/testing.md#execution-ownership Local synchronous tuple arithmetic with no generation, cache, process or retained state.
 */
function rigid(p: Point, frame: number): Point {
  if (frame === 0) return [...p];
  if (frame === 1) return [p[2] + 17, p[0] - 30, p[1] + 50];
  return [-p[1] + 10, p[2] + 200, -p[0] - 5];
}

/**
 * A mesh fixture has no generated joints or anatomical chain dependencies.
 *
 * @evidence contracts/testing.md#behavioral-verification Constructs only the declared observer input; the owning test exercises its ray and distance results.
 * @evidence contracts/testing.md#independent-expectations Copies literal coordinates and indices without reading the observer or generating a person.
 * @evidence contracts/testing.md#distinguishing-cases Supplies both the empty and single-triangle inputs as well as the cube's topology.
 * @evidence contracts/testing.md#execution-ownership A local synchronous fixture constructor owned by test_human_surface_queries, with no host or retained cache.
 */
function mesh(positions: number[], indices: number[]): Skin {
  return { name: "made", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["made"], joints: new Map() };
}

/**
 * Six planar square faces, each split across its diagonal.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the closed mesh whose signed-axis exits and plane distances the owning test measures.
 * @evidence contracts/testing.md#independent-expectations Its eight corners are the independent Cartesian product of plus/minus the requested half side, and its twelve triangles cover the six boundary squares.
 * @evidence contracts/testing.md#distinguishing-cases Called at four coordinate scales and for near/far queries; empty and singleton fixtures are separate.
 * @evidence contracts/testing.md#execution-ownership One call-owned literal-topology CPU fixture used only by test_human_surface_queries.
 */
function cube(radius: number): Skin {
  const positions: number[] = [];
  for (const x of [-radius, radius]) for (const y of [-radius, radius]) for (const z of [-radius, radius]) positions.push(x, y, z);
  return mesh(positions, [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3]);
}

/**
 * Number of triangle references the former 4 mm ray grid must store, derived
 * from each projected bounding rectangle without allocating its cells.
 *
 * @evidence contracts/testing.md#behavioral-verification Reports the old acceleration strategy's resident-reference population beside the actual query resource reading; it asserts no timing or memory threshold.
 * @evidence contracts/testing.md#independent-expectations Counts the integer cells intersected by each projected bounding rectangle from its extrema. Query correctness comes from the owning test's plane equations, not this diagnostic count.
 * @evidence contracts/testing.md#distinguishing-cases Reports each of four scaled cubes with the same triangle population, distinguishing coordinate-area growth from triangle-count growth.
 * @evidence contracts/testing.md#execution-ownership A local allocation-free-in-cell-count diagnostic owned by the synchronous CPU query test.
 */
function rayReferences(skin: Skin): number {
  let references: number = 0;
  for (let t: number = 0; t < skin.I.length; t += 3) {
    const spans: number[] = [];
    for (let axis: number = 0; axis < 3; axis++) {
      const coordinates: number[] = [0, 1, 2].map((k: number): number => skin.P[3 * skin.I[t + k]! + axis]!);
      spans.push(Math.floor(Math.max(...coordinates) / 4) - Math.floor(Math.min(...coordinates) / 4) + 1);
    }
    references += spans[0]! * spans[1]! + spans[1]! * spans[2]! + spans[2]! * spans[0]!;
  }
  return references;
}
