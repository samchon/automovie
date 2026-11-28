import { AutoMovieEngineCanonicalBoundary64 } from "@automovie/engine";
import type {
  IAutoMovieCanonicalBoundary64,
  IAutoMovieCanonicalBoundaryPhase64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Exact boundary addresses and interval incidence share a finite unit domain.
 *
 * The midpoint below the smallest positive binary64 has distinct exact identity
 * even though it rounds to zero. A decreasing map retains authored anchors and
 * locates an interior target. Two reversed fine intervals oppose their coarse
 * neighbour. Gaps remain diagnostics. Invalid normalized coordinates, keys,
 * authority and use identities, and walks throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the rounding tie, the descending map, directed coarse and fine incidence, an interior gap and the malformed input refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls phase, local, compare, inverse and partition through the public Engine owner with authored scalars, callback anchors and intervals. Checks exact keys, numbers and atom records.
 * @evidence contracts/development/testing.md#independent-expectations Half the least positive binary64 is 2 to the power -1075 and rounds to even zero. A decreasing affine map has inverse one minus its value. Reversing each fine interval changes its walk to -1, giving exactly one opposing use for each half interval.
 */
export function test_engine_geometry_canonical_boundary_admission(): void {
  const boundary = AutoMovieEngineCanonicalBoundary64;
  const zero = boundary.phase(-0, 1, 0);
  const half = boundary.phase(0, Number.MIN_VALUE, 0.5);
  TestValidator.predicate(
    "signed zero at the input endpoint",
    Object.is(zero.value, -0) && zero.key === "d:0p0",
  );
  TestValidator.equals(
    "exact interior address below the smallest positive binary64",
    [
      half,
      boundary.compare(half, zero),
      boundary.local(0, Number.MIN_VALUE, half),
      boundary.local(Number.MIN_VALUE, 0, half),
    ],
    [{ value: 0, key: "d:1p-1075" }, 1, 0.5, 0.5],
  );

  const decreasing = (local: number): IAutoMovieCanonicalBoundaryPhase64 =>
    boundary.phase(1, 0, local);
  const anchors: IAutoMovieCanonicalBoundary64.IInverseAnchors = [
    0, 0.25, 1,
  ].map((local: number) => ({ local, phase: decreasing(local) }));
  TestValidator.equals(
    "decreasing inverse at an anchor and a foreign phase",
    [
      boundary.inverse(decreasing, { value: 0.75, key: "d:3p-2" }, anchors),
      boundary.inverse(decreasing, { value: 0.25, key: "d:1p-2" }, anchors),
    ],
    [0.25, 0.75],
  );

  const uses: IAutoMovieCanonicalBoundary64.IPartitionUses = [
    { id: "right", authority: "seam", start: 1, end: 0.5, walk: 1 },
    { id: "coarse", authority: "seam", start: 0, end: 1, walk: 1 },
    { id: "left", authority: "seam", start: 0.5, end: 0, walk: 1 },
  ];
  TestValidator.equals(
    "coarse and two fine intervals",
    boundary.partition(uses),
    {
      atoms: [
        {
          authority: "seam",
          start: 0,
          end: 0.5,
          uses: ["coarse", "left"],
          walks: [1, -1],
        },
        {
          authority: "seam",
          start: 0.5,
          end: 1,
          uses: ["coarse", "right"],
          walks: [1, -1],
        },
      ],
      diagnostics: [],
    },
  );
  const gap = boundary.partition([
    { id: "first", authority: " a ", start: 0, end: 0.25, walk: 1 },
    { id: "second", authority: " a ", start: 0.75, end: 1, walk: -1 },
  ]);
  TestValidator.predicate(
    "exact authority name and explicit interior gap",
    gap.atoms[1]?.authority === " a " &&
      gap.atoms[1].start === 0.25 &&
      gap.atoms[1].end === 0.75 &&
      gap.atoms[1].uses.length === 0 &&
      gap.diagnostics[0]?.includes("Uncovered boundary atom") === true,
  );
  TestValidator.equals("empty partition", boundary.partition([]), {
    atoms: [],
    diagnostics: [],
  });

  const middle: IAutoMovieCanonicalBoundaryPhase64 = {
    value: 0.5,
    key: "d:1p-1",
  };
  const invalidAnchors: IAutoMovieCanonicalBoundary64.IInverseAnchors = [
    { local: 0, phase: anchors[2]!.phase },
    { local: Number.NaN, phase: middle },
    { local: 1, phase: anchors[0]!.phase },
  ];
  // This callback could otherwise legitimize the invalid authored coordinate
  // by giving it a finite address that matches the target.
  const forward = (local: number): IAutoMovieCanonicalBoundaryPhase64 =>
    Number.isNaN(local) ? middle : boundary.phase(0, 1, local);

  const first = uses[0]!;
  const unitDomain: string = "must be finite in [0,1]";
  const invalid: [string, () => unknown, string][] = [
    ["NaN phase fraction", () => boundary.phase(0, 1, Number.NaN), unitDomain],
    ["NaN phase start", () => boundary.phase(Number.NaN, 1, 0.5), unitDomain],
    ["infinite phase end", () => boundary.phase(0, Infinity, 0.5), unitDomain],
    [
      "NaN local interval",
      () => boundary.local(0, Number.NaN, middle),
      unitDomain,
    ],
    [
      "NaN anchor",
      () => boundary.inverse(forward, middle, invalidAnchors),
      unitDomain,
    ],
    [
      "NaN partition endpoint",
      () => boundary.partition([{ ...first, start: Number.NaN }]),
      unitDomain,
    ],
    [
      "empty use id",
      () => boundary.partition([{ ...first, id: "" }]),
      "nonempty IDs",
    ],
    [
      "empty authority",
      () => boundary.partition([{ ...first, authority: "" }]),
      "nonempty IDs",
    ],
    [
      "zero walk",
      () => boundary.partition([{ ...first, walk: 0 as unknown as 1 }]),
      "walk of -1 or 1",
    ],
    [
      "duplicate use across authorities",
      () => boundary.partition([first, { ...first, authority: "other" }]),
      "unique IDs",
    ],
    [
      "noncanonical key",
      () => boundary.compare({ value: 0.5, key: "d:2p-2" }, middle),
      "Noncanonical",
    ],
    [
      "unmatched view",
      () => boundary.local(0, 1, { value: 0.75, key: "d:1p-1" }),
      "key and numeric value disagree",
    ],
  ];
  TestValidator.equals(
    "admission refusals",
    invalid
      .filter(([, attempt, message]) => !throwsError(attempt, message))
      .map(([name]) => name),
    [],
  );
}
