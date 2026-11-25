import { worldHeightfield } from "@automovie/engine";
import type { IAutoMovieWorldHeightfield } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * World heightfield construction bakes a callback into a complete lattice.
 *
 * Scenarios:
 *
 * 1. Nine heights are written row-major from the authored origin.
 * 2. A bad pitch, origin, lattice size, or callback result prevents the write.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names lattice order and the five distinct refusal inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the owning builder and checks its nine actual stored samples and each refusal independently.
 * @evidence contracts/development/testing.md#independent-expectations The authored slope and ridge give the literal expected row-major samples without a second builder or height lookup.
 * @evidence contracts/development/testing.md#distinguishing-cases Varies zero pitch, infinite origin, one column, fractional rows and an unsampleable callback separately.
 * @evidence contracts/development/testing.md#execution-ownership Uses only resident input records and one pure terrain builder.
 */
export function test_engine_space_world_heightfield(): void {
  const input: IAutoMovieWorldHeightfield.IInput = {
    id: "ridge",
    polygon: [
      { x: -4, z: -4 },
      { x: 4, z: -4 },
      { x: 4, z: 4 },
      { x: -4, z: 4 },
    ],
    origin: { x: -4, z: -4 },
    spacing: { x: 4, z: 4 },
    columns: 3,
    rows: 3,
    height: ({ x, z }): number => z / 2 - Math.abs(x) / 4,
    walkable: true,
  };
  const field: ReturnType<typeof worldHeightfield> = worldHeightfield(input);
  const heights: readonly number[] = [-3, -2, -3, -1, 0, -1, 1, 2, 1];
  TestValidator.predicate(
    "samples are written row-major from the authored origin",
    field.height.kind === "heightfield" &&
      field.height.columns === 3 &&
      field.height.rows === 3 &&
      field.height.samples.length === heights.length &&
      field.height.samples.every((value, at): boolean =>
        nclose(value, heights[at]!, 0),
      ),
  );

  const malformed: readonly [
    string,
    Partial<IAutoMovieWorldHeightfield.IInput>,
    string,
  ][] = [
    ["zero pitch", { spacing: { x: 0, z: 1 } }, "positive"],
    ["infinite origin", { origin: { x: Infinity, z: 0 } }, "finite origin"],
    ["one column", { columns: 1 }, "at least two sample"],
    ["fractional rows", { rows: 2.5 }, "at least two sample"],
    [
      "non-finite callback height",
      { height: (): number => NaN },
      "non-finite height",
    ],
  ];
  for (const [label, fields, reason] of malformed)
    TestValidator.predicate(
      label,
      throwsError(() => worldHeightfield({ ...input, ...fields }), reason),
    );
}
