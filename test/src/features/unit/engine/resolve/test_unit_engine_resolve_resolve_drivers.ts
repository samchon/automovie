import { resolveDrivers } from "@automovie/engine";
import type {
  IAutoMovieChannel,
  IAutoMovieCopyDriver,
  IAutoMovieDrivenDriver,
  IAutoMovieDriver,
  IAutoMovieNode,
  IAutoMovieSampledChannel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** Rounding of one blend. */
const ROUNDING: number = 1e-12;

/** A group node at a place. */
const node: (id: string, x: number, y: number, z: number) => IAutoMovieNode = (
  id: string,
  x: number,
  y: number,
  z: number,
): IAutoMovieNode => ({
  id,
  name: null,
  parent: null,
  kind: "group",
  transform: {
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

/** The nodes: a at the origin, b at (2, 4, 6), c at the origin. */
const nodes: () => Map<string, IAutoMovieNode> = (): Map<
  string,
  IAutoMovieNode
> =>
  new Map(
    [node("a", 0, 0, 0), node("b", 2, 4, 6), node("c", 0, 0, 0)].map(
      (entry: IAutoMovieNode): [string, IAutoMovieNode] => [entry.id, entry],
    ),
  );

/** A copy of the translation of `source` onto `owner`. */
const copy: (
  owner: string,
  source: string,
  influence: number,
) => IAutoMovieCopyDriver = (
  owner: string,
  source: string,
  influence: number,
): IAutoMovieCopyDriver => ({
  type: "copy",
  owner,
  source,
  translation: true,
  rotation: false,
  scale: false,
  influence,
});

/** A scalar pointer channel. */
const scalar: (pointer: string) => IAutoMovieChannel = (
  pointer: string,
): IAutoMovieChannel => ({ kind: "pointer", pointer, valueType: "scalar" });

/** A sample holding a scalar on a pointer. */
const sample: (
  pointer: string,
  value: number,
) => Map<string, IAutoMovieSampledChannel> = (
  pointer: string,
  value: number,
): Map<string, IAutoMovieSampledChannel> =>
  new Map([[`ptr:${pointer}`, { channel: scalar(pointer), value: [value] }]]);

/** A driven driver from /in to /out. */
const driven: (
  change: Partial<IAutoMovieDrivenDriver>,
) => IAutoMovieDrivenDriver = (
  change: Partial<IAutoMovieDrivenDriver>,
): IAutoMovieDrivenDriver => ({
  type: "driven",
  output: scalar("/out"),
  source: scalar("/in"),
  ...change,
});

/** The value written to /out after one driver. */
const out: (
  source: number,
  change: Partial<IAutoMovieDrivenDriver>,
) => number = (
  source: number,
  change: Partial<IAutoMovieDrivenDriver>,
): number => {
  const sampled: Map<string, IAutoMovieSampledChannel> = sample("/in", source);
  resolveDrivers([driven(change)], sampled, nodes());
  return sampled.get("ptr:/out")!.value[0]!;
};

/**
 * `resolveDrivers` applies the value drivers (copy and driven) to a sample in
 * dependency order and hands back the drivers it does not apply.
 *
 * Scenarios:
 *
 * 1. A copy of the translation of b (2, 4, 6) onto a at influence 0.5 writes (1,
 *    2, 3) to a's translation; at influence 1 a chain given in reverse, c <- a
 *    then a <- b, ends with c at (2, 4, 6).
 * 2. A driven remap of 0..10 onto 0..100 writes 50 from 5; unclamped, 20 gives
 *    200, and clamped, 100. A curve (0 -> 0, 1 -> 10) writes 5 from 0.5.
 * 3. An IK driver is returned untouched.
 * 4. An influence of 2, a copy from a node that is not given, and a driven output
 *    on a translation are refused.
 */
export function test_unit_engine_resolve_resolve_drivers(): void {
  const half: Map<string, IAutoMovieSampledChannel> = new Map();
  resolveDrivers([copy("a", "b", 0.5)], half, nodes());
  TestValidator.equals(
    "a half copy",
    half
      .get("node:a:translation")!
      .value.map(
        (entry: number): number => Math.round(entry / ROUNDING) * ROUNDING,
      ),
    [1, 2, 3],
  );
  const chain: Map<string, IAutoMovieSampledChannel> = new Map();
  resolveDrivers([copy("c", "a", 1), copy("a", "b", 1)], chain, nodes());
  TestValidator.equals(
    "a chain in dependency order",
    chain.get("node:c:translation")!.value,
    [2, 4, 6],
  );
  TestValidator.equals(
    "remaps",
    [
      out(5, { inRange: [0, 10], outRange: [0, 100] }),
      out(20, { inRange: [0, 10], outRange: [0, 100] }),
      out(20, { inRange: [0, 10], outRange: [0, 100], clamp: true }),
      out(0.5, {
        curve: {
          points: [
            { source: 0, output: 0 },
            { source: 1, output: 10 },
          ],
        },
      }),
    ],
    [50, 200, 100, 5],
  );
  const ik: IAutoMovieDriver = {
    type: "ik",
    chain: ["a", "b"],
    goal: "c",
    pole: null,
    solver: "ccd",
    iterations: null,
    influence: 1,
  };
  TestValidator.predicate(
    "the deferred driver",
    resolveDrivers([ik], new Map(), nodes())[0] === ik,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): unknown => resolveDrivers([copy("a", "b", 2)], new Map(), nodes()),
      "influence must be between 0 and 1",
    ) &&
      throwsError(
        (): unknown =>
          resolveDrivers([copy("a", "missing", 1)], new Map(), nodes()),
        'node "missing" was not provided',
      ) &&
      throwsError(
        (): unknown =>
          resolveDrivers(
            [
              driven({
                output: { kind: "node", node: "a", path: "translation" },
                inRange: [0, 1],
                outRange: [0, 1],
              }),
            ],
            sample("/in", 0),
            nodes(),
          ),
        "must be a scalar channel",
      ),
  );
}
