import { AutoMovieConstructionViews, AutoMovieViewCurves, AutoMovieViewLoft, AutoMovieViewParallelAxis, type AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionKnot, IAutoMovieConstructionOutline, IAutoMovieConstructionParallelAxis } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Authored parallel planes keep their fixed chart axes while their source origin curves move, through tree conversion, source inspection and real lofting.
 *
 * Scenarios:
 * 1. Planes u=world Y and v=world X advance in Z while their origin Y follows the natural cubic through (0,10),(1,11),(2,10). At intermediate stations the basis remains fixed, the source point and final loft guide use the same independent closed-form origin, and no tangent-normal rotation is introduced.
 * 2. The same declaration at two metre scales a thousand apart preserves its basis and scales every origin/outline coordinate once. Open origin ends continue as their natural tangents.
 * 3. Invalid/nonfinite bases and malformed coordinate knots return named admission failures; modifying caller-owned directions after preparation cannot change the prepared axis.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the public parallel-axis record through ConstructionViews.frame, reads source edges through ViewCurves and lofts through ViewLoft, observing actual frames and surface guide positions rather than repository structure.
 * @evidence contracts/testing.md#independent-expectations The independent natural cubic ordinate is 10+1.5t-0.5t^3 for t in [0,1], reflected about t=1 on [1,2], with slopes +1.5/-1.5 beyond the ends. The fixed plane basis is input data, so source front-positive guide is (-3,Y(s)+2+s,s). Scale tolerance 2e-10 times the length scale covers binary64 conversion and periodic interpolation. This case proves the declared cubic course, not exact serialization of an arbitrary black-box axis.
 * @evidence contracts/testing.md#distinguishing-cases Fixed axes over a drifting origin reject tangent-normal transport; intermediate points reject knot-only inspection; two scales reject double/missing metre conversion; explicit invalid bases/knots and input mutation cover admission and ownership boundaries.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_parallel_axis, with synthetic source declarations and no Human generation, process, browser or GPU.
 */
export function test_construction_parallel_axis(): void {
  const failures: string[] = [];
  const compare = (label: string, actual: readonly number[], expected: readonly number[], scale: number): void => {
    if (actual.length !== expected.length || !expected.every(Number.isFinite) || !actual.every((v: number, c: number): boolean => nclose(v, expected[c]!, 2e-10 * scale))) failures.push(`${label}: ${actual}, expected ${expected}`);
  };
  const ordinate = (s: number): number => {
    if (s < 0) return 10 + 1.5 * s;
    if (s > 2) return 10 - 1.5 * (s - 2);
    const t: number = s <= 1 ? s : 2 - s;
    return 10 + 1.5 * t - 0.5 * t ** 3;
  };
  for (const scale of [1, 1000]) {
    const record: IAutoMovieConstructionParallelAxis = {
      type: "parallel", u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 },
      origin: { x: outline([0, 2], [-3, -3], scale / 1000), y: outline([0, 1, 2], [10, 11, 10], scale / 1000), z: outline([0, 2], [0, 2], scale / 1000) },
    };
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieConstructionViews.frame(record);
    if (typeof axis === "string") { failures.push(axis); continue; }
    for (const s of [-0.5, 0, 0.5, 1, 1.25, 2, 2.5]) {
      const frame: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(s * scale);
      compare(`origin ${scale}/${s}`, frame.origin, [-3 * scale, ordinate(s) * scale, s * scale], scale);
      compare(`basis ${scale}/${s}`, [...frame.u, ...frame.v], [0, 1, 0, 1, 0, 0], 1);
    }
    const edge = (a: number, b: number): IAutoMovieViewPart.IOutline => ({ knots: [{ site: "a", station: 0, value: a * scale }, { site: "b", station: 2 * scale, value: b * scale }] });
    const part: IAutoMovieViewPart = { name: "parallel", axis, stations: [0, 0.5, 1, 1.5, 2].map((s: number): number => s * scale), front: { positive: edge(2, 4), negative: edge(-2, -2) }, side: { positive: edge(1, 1), negative: edge(-1, -1) }, fullness: { kind: "shoulder", shoulder: { knots: [{ site: "a", station: 0, value: Math.SQRT2 - 1 }, { site: "b", station: 2 * scale, value: Math.SQRT2 - 1 }] } }, order: 32, samples: 64 };
    const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    if (source.diagnostics.length !== 0 || loft.diagnostics.length !== 0 || loft.surface === null) { failures.push(`parallel ${scale} does not admit a source and loft`); continue; }
    for (const s of [0.25, 0.5, 1, 1.25, 1.75]) {
      const expected: number[] = [-3 * scale, (ordinate(s) + 2 + s) * scale, s * scale];
      const point: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(source.curves[0]!, axis, s * scale);
      if (typeof point === "string") failures.push(point);
      else compare(`source guide ${scale}/${s}`, point.point, expected, scale);
      compare(`loft guide ${scale}/${s}`, loft.surface.jet(s * scale, 0).p, expected, scale);
    }
  }
  const origin: AutoMovieViewParallelAxis.IOrigin = { x: { knots: [{ site: "a", station: 0, value: 0 }, { site: "b", station: 1, value: 0 }] }, y: { knots: [{ site: "a", station: 0, value: 0 }, { site: "b", station: 1, value: 0 }] }, z: { knots: [{ site: "a", station: 0, value: 0 }, { site: "b", station: 1, value: 1 }] } };
  for (const [u, v] of [[[0, 2, 0], [1, 0, 0]], [[0, 1, 0], [0, 1, 0]], [[NaN, 1, 0], [1, 0, 0]]] as [[number, number, number], [number, number, number]][])
    if (typeof AutoMovieViewParallelAxis.create(origin, u, v) !== "string") failures.push("an invalid parallel basis was admitted");
  if (typeof AutoMovieViewParallelAxis.create({ ...origin, y: { knots: [] } }, [0, 1, 0], [1, 0, 0]) !== "string") failures.push("a missing origin curve was admitted");
  const u: [number, number, number] = [0, 1, 0];
  const fixed: AutoMovieViewAxis.IAxis | string = AutoMovieViewParallelAxis.create(origin, u, [1, 0, 0]);
  u[1] = 5;
  if (typeof fixed === "string") failures.push(fixed);
  else compare("copied input basis", fixed.at(0.5).u, [0, 1, 0], 1);
  TestValidator.predicate(`${failures.length} parallel-axis failures:\n${failures.join("\n")}`, (): boolean => failures.length === 0);
}

/** Synthetic coordinate source in metres, independent of the frame converter under test. */
function outline(stations: readonly number[], values: readonly number[], scale: number): IAutoMovieConstructionOutline {
  return { knots: stations.map((station: number, i: number): IAutoMovieConstructionKnot => ({ site: `site.${i}`, station: station * scale, value: values[i]! * scale })) };
}
