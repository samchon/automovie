import { AutoMovieEngineWorld } from "@automovie/engine";
import type {
  IAutoMovieWorldHeightfield,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * World heightfield construction bakes a callback into a complete lattice.
 *
 * Scenarios:
 *
 * 1. An offset rectangular lattice visits each coordinate once in row-major order,
 *    then stores matching samples and authored lattice metadata.
 * 2. An unfillable lattice refuses before any callback runs.
 * 3. A non-finite sample refuses at its authored cell and stops traversal.
 * 4. A coarse world origin visits distinct rounded knots and stores their
 *    corresponding callback values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the lattice visit order, stored header, rounded knot locations, and the callback effects of refused headers and samples.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public heightfield builder with a recording callback and checks its calls, returned metadata, and stored samples. Invalid pitches, counts, and origins leave the callback uncalled. A non-finite second sample stops the bake and identifies its cell.
 * @evidence contracts/development/testing.md#independent-expectations The 3-by-2 grid from (-4, -6) advances 4 m in X and 2 m in Z. Applying 2z + x/4 + |x|/8 gives the exact stored heights. At 2^53 a 3 m pitch gives rounded X offsets 0, 4, and 6. At 2^54 a 1 m pitch cannot advance the first coordinate.
 */
export function test_engine_space_world_heightfield(): void {
  const visited: IAutoMovieWorldHeightfield.IInput["origin"][] = [];
  const input: IAutoMovieWorldHeightfield.IInput = {
    id: "ridge",
    polygon: [
      { x: -4, z: -6 },
      { x: 4, z: -6 },
      { x: 4, z: -4 },
      { x: -4, z: -4 },
    ],
    origin: { x: -4, z: -6 },
    spacing: { x: 4, z: 2 },
    columns: 3,
    rows: 2,
    height: ({ x, z }): number => {
      visited.push({ x, z });
      return 2 * z + x / 4 + Math.abs(x) / 8;
    },
    walkable: true,
  };
  const field: IAutoMovieWorldSurface = AutoMovieEngineWorld.heightfield(input);
  const cells: readonly (readonly [number, number, number])[] = [
    [-4, -6, -12.5],
    [0, -6, -12],
    [4, -6, -10.5],
    [-4, -4, -8.5],
    [0, -4, -8],
    [4, -4, -6.5],
  ];
  TestValidator.predicate(
    "the callback is visited exactly once per cell in row-major world order",
    visited.length === cells.length &&
      cells.every(
        ([x, z], at): boolean =>
          nclose(visited[at]!.x, x, 0) && nclose(visited[at]!.z, z, 0),
      ),
  );
  TestValidator.predicate(
    "the output lattice records the authored header and ordered heights",
    field.height.kind === "heightfield" &&
      field.height.columns === 3 &&
      field.height.rows === 2 &&
      nclose(field.height.originX, -4, 0) &&
      nclose(field.height.originZ, -6, 0) &&
      nclose(field.height.spacingX, 4, 0) &&
      nclose(field.height.spacingZ, 2, 0) &&
      field.height.samples.length === cells.length &&
      field.height.samples.every((value, at): boolean =>
        nclose(value, cells[at]![2], 0),
      ),
  );
  const coarseOrigin: number = 2 ** 53;
  const rounded: IAutoMovieWorldSurface = AutoMovieEngineWorld.heightfield({
    ...input,
    origin: { x: coarseOrigin, z: -6 },
    spacing: { x: 3, z: 2 },
    height: ({ x }): number => x - coarseOrigin,
  });
  // Nearest-even rounds the first step of 3 m to 4 m at this origin.
  const offsets: readonly number[] = [0, 4, 6, 0, 4, 6];
  TestValidator.predicate(
    "each stored sample reflects the rounded world coordinate it was given",
    rounded.height.kind === "heightfield" &&
      rounded.height.samples.length === offsets.length &&
      rounded.height.samples.every((sample, index): boolean =>
        nclose(sample, offsets[index]!, 0),
      ),
  );

  const malformed: readonly [
    string,
    Partial<IAutoMovieWorldHeightfield.IInput>,
    string,
  ][] = [
    ["zero pitch", { spacing: { x: 0, z: 1 } }, "positive"],
    ["infinite origin", { origin: { x: Infinity, z: 0 } }, "finite origin"],
    [
      "rounded-together X positions",
      { origin: { x: 2 ** 54, z: -6 }, spacing: { x: 1, z: 2 } },
      "positive representable spacing",
    ],
    ["one column", { columns: 1 }, "at least two sample"],
    ["fractional rows", { rows: 2.5 }, "at least two sample"],
  ];
  const invalidHeaders: string[] = [];
  for (const [label, fields, reason] of malformed) {
    let calls: number = 0;
    const refused: boolean = throwsError(
      () =>
        AutoMovieEngineWorld.heightfield({
          ...input,
          ...fields,
          height: (): number => {
            ++calls;
            return 0;
          },
        }),
      reason,
    );
    if (!refused || calls !== 0) invalidHeaders.push(label);
  }
  TestValidator.equals(
    "all malformed headers refuse before sampling",
    invalidHeaders,
    [],
  );

  let sampled: number = 0;
  const refused: boolean = throwsError(
    () =>
      AutoMovieEngineWorld.heightfield({
        ...input,
        height: ({ x, z }): number => {
          ++sampled;
          return x === 0 && z === -6 ? NaN : 0;
        },
      }),
    "non-finite height at column 1, row 0",
  );
  TestValidator.predicate(
    "the first non-finite result refuses at its cell and stops traversal",
    refused && sampled === 2,
  );
}
