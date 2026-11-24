import { tessellateAutoMovieContourStrip64 } from "@automovie/engine";
import type { IAutoMovieContourLoft64 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { contourStripOracle as O } from "../../../internal/contourStripOracle.ts";
import { nclose } from "../../../internal/nclose.ts";
import { throwsError } from "../../../internal/throwsError.ts";

/** Strip metadata before its enclosing loft adds a slab address. */
type Observation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;

/**
 * Identity-based sheet qualification and finite partial publication remain
 * distinct.
 *
 * Scenarios:
 *
 * 1. Two separate triangular boundaries connected by a doubled slit retain their
 *    repeated sheet occurrences, and their qualified tiling matches all
 *    exhaustive admissible paths.
 * 2. Distinct sheet vertices at an identical point create a collapsed physical
 *    edge; finite positive-area tiles remain visible with explicit unqualified
 *    omission diagnostics.
 * 3. Empty, singleton, collinear and nonfinite boundaries refuse before emission;
 *    missing and contradictory declared identities also refuse.
 * 4. Explicit unique identities preserve an ordinary qualified strip, separating
 *    identity admission from a blanket refusal.
 */
export function test_unit_engine_geometry_geometry_contour_strip_topology(): void {
  const left: O.V[] = O.polygon(3, 0, 0.5, 0.03, -2),
    right: O.V[] = O.polygon(3, 0, 0.5, 0, 2);
  const branch: O.V[] = [...left, left[0], ...right, right[0]];
  const upper: O.V[] = O.polygon(3, 2, 5);
  const expected: ReturnType<typeof O.minimum> = O.minimum(branch, upper);
  const tiles: O.Triangle[] = [];
  let qualified: boolean | undefined;
  tessellateAutoMovieContourStrip64(
    branch,
    upper,
    (a: O.V, b: O.V, c: O.V): void => {
      tiles.push([a, b, c]);
    },
    undefined,
    (record: Observation): void => {
      qualified = record.qualified;
    },
  );
  TestValidator.equals(
    "all branch paths are independently enumerated",
    expected.visited,
    165,
  );
  TestValidator.predicate(
    "a doubled slit retains qualified sheet incidence",
    qualified === true && O.admits(branch, upper, tiles),
  );
  TestValidator.predicate(
    "conflict search preserves the admissible area optimum",
    expected.admitted > 0 &&
      nclose(
        O.area(tiles),
        expected.area,
        expected.area * Number.EPSILON * 512 * 11,
      ),
  );

  const lower: O.V[] = O.polygon(3, 0),
    top: O.V[] = O.polygon(3, 1);
  const collapsed: O.V[] = [lower[0], [...lower[0]], ...lower.slice(1)];
  const retained: O.Triangle[] = [];
  let observation: Observation | undefined;
  tessellateAutoMovieContourStrip64(
    collapsed,
    top,
    (a: O.V, b: O.V, c: O.V): void => {
      retained.push([a, b, c]);
    },
    undefined,
    (record: Observation): void => {
      observation = record;
    },
  );
  TestValidator.predicate(
    "zero-area primitives are omitted while finite geometry remains displayable",
    retained.length > 0 &&
      retained.length < collapsed.length + top.length &&
      retained.every(
        (triangle: O.Triangle): boolean =>
          Math.hypot(...O.normal(triangle)) > 0,
      ),
  );
  TestValidator.predicate(
    "partial geometry is explicitly unqualified with collapse and omission reasons",
    observation?.qualified === false &&
      observation.diagnostics.some((reason: string): boolean =>
        reason.includes("zero-length physical edge"),
      ) &&
      observation.diagnostics.some((reason: string): boolean =>
        reason.includes("Zero-area contour primitive count omitted"),
      ),
  );

  const invalid: O.V[][] = [
    [],
    [[0, 0, 0]],
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ],
    [
      [Number.NaN, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  ];
  for (const boundary of invalid) {
    let calls: number = 0;
    TestValidator.predicate(
      "a nonrepresentable boundary refuses before publication",
      throwsError((): void =>
        tessellateAutoMovieContourStrip64(boundary, top, (): void => {
          calls++;
        }),
      ) && calls === 0,
    );
  }
  for (const identity of [
    (): undefined => undefined,
    (): string => "one-point",
  ]) {
    let calls: number = 0;
    TestValidator.predicate(
      "missing or contradictory identity refuses before publication",
      throwsError(
        (): void =>
          tessellateAutoMovieContourStrip64(
            lower,
            top,
            (): void => {
              calls++;
            },
            identity,
          ),
        "identity",
      ) && calls === 0,
    );
  }
  const points: O.V[] = [...lower, ...top],
    identified: O.Triangle[] = [];
  tessellateAutoMovieContourStrip64(
    lower,
    top,
    (a: O.V, b: O.V, c: O.V): void => {
      identified.push([a, b, c]);
    },
    (p: O.V): string => `sheet:${points.indexOf(p)}`,
  );
  TestValidator.predicate(
    "unique declared identities preserve the ordinary sheet",
    O.admits(lower, top, identified),
  );
}
