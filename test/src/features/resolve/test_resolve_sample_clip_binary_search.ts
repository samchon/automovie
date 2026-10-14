import { sampleClip } from "../../../../packages/engine/src/resolve/sampleClip";
import { IAutoMovieChannel, IAutoMovieClip, IAutoMovieTrack } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { type IAutoMovieSampledChannel } from "../../../../packages/engine/src/resolve/IAutoMovieSampledChannel";

/**
 * The track sampler now binary-searches the enclosing keyframe segment instead
 * of scanning front to back on the general channel path. Segment lookup is
 * logarithmic, but sampleClip also validates every track payload per query;
 * this numerical sweep is not a complexity or timing measurement. A
 * closed-form ramp on a vec3 translation track (value.x = i at time
 * i·dt, linear) gives an exact oracle: the sampled x equals time/dt across the
 * whole 240-key array.
 *
 * Scenarios:
 *
 * 1. Dense sweep (segment midpoints, exact interior keys, off-grid points) → the
 *    sampled x equals time/dt to 1e-9, y and z stay 0.
 * 2. Exact keyframe times return that keyframe's value verbatim.
 */

const DT: number = 0.1;
const N: number = 240;

const TRANSLATION: IAutoMovieChannel = {
  kind: "node",
  node: "n",
  path: "translation",
};
const KEY: string = "node:n:translation";

const rampClip: () => IAutoMovieClip = (): IAutoMovieClip => {
  const times: number[] = [];
  const values: number[] = [];
  for (let i: number = 0; i < N; ++i) {
    times.push(i * DT);
    values.push(i, 0, 0);
  }
  const track: IAutoMovieTrack = {
    channel: TRANSLATION,
    times,
    values,
    interpolation: "linear",
  };
  return {
    id: "c",
    name: null,
    duration: (N - 1) * DT,
    loop: false,
    tracks: [track],
  };
};

const xAt: (t: number) => number[] = (t: number): number[] => {
  const hit: IAutoMovieSampledChannel | undefined = sampleClip(rampClip(), t).get(KEY);
  if (hit === undefined) throw new Error(`${KEY} missing`);
  return hit.value;
};

/**
 * @evidence contracts/testing.md#behavioral-verification Samples a 240-key translation ramp through sampleClip and checks midpoint, exact-key and off-grid coordinates, catching incorrect enclosing-segment/tie selection or altered inactive axes.
 * @evidence contracts/testing.md#independent-expectations Authored x=i at time i*DT makes linear x=time/DT with y=z=0; exact keys137/200 have literal endpoint values. This value oracle cannot establish whether the implementation uses binary rather than linear search.
 * @evidence contracts/testing.md#distinguishing-cases Every existing interior segment midpoint/key plus three off-grid queries and two exact-key vectors exercises dense segment selection; loop/clamp and malformed tracks belong to test_resolve_sample_clip.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_sample_clip_binary_search entry owns synchronous portable numerical queries through the actual sampler, without performance instrumentation or a new runtime validation driver.
 */
export function test_resolve_sample_clip_binary_search(): void {
  const last: number = (N - 1) * DT;

  const queries: number[] = [];
  for (let i: number = 0; i < N - 1; ++i) queries.push((i + 0.5) * DT); // midpoints
  for (let i: number = 1; i < N - 1; ++i) queries.push(i * DT); // interior keys
  queries.push(last * 0.137, last * 0.611, last * 0.909); // off-grid

  for (const t of queries) {
    const v: number[] = xAt(t);
    TestValidator.equals(
      `translation.x ramp is exact at t=${t.toFixed(4)}`,
      namedFacts([
        ["ncloseVT", (): boolean  => nclose(v[0]!, t / DT, 1e-9)],
        ["v", (): boolean  => v[1] === 0],
        ["v2", (): boolean  => v[2] === 0],
      ]),
      { ncloseVT: true, v: true, v2: true },
    );
  }

  // Endpoint tie: an exact interior key returns that key's value verbatim.
  TestValidator.predicate(
    "exact key 137 returns x=137",
    sameValues(xAt(137 * DT), [137, 0, 0]),
  );
  TestValidator.predicate(
    "exact key 200 returns x=200",
    sameValues(xAt(200 * DT), [200, 0, 0]),
  );
}

/** Compare array length and finite scalar values with zero absolute tolerance. */
function sameValues(actual: number[], expected: number[]): boolean {
  return actual.length === expected.length && actual.every((value: number, index: number): boolean => nclose(value, expected[index]!, 0));
}
