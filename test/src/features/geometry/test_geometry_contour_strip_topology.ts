import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import { tessellateAutoMovieContourStrip64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourStrip64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { nclose } from "../internal/nclose.ts";
import { throwsError } from "../internal/throwsError.ts";

/** Strip metadata before its enclosing loft adds a slab address. */
type Observation = Omit<
  NonNullable<L.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;

/**
 * Identity-based sheet qualification and finite partial publication remain distinct.
 *
 * Scenarios:
 *
 * 1. Two separate triangular boundaries connected by a doubled slit retain their repeated sheet occurrences, and their qualified tiling matches all exhaustive admissible paths.
 * 2. Distinct sheet vertices at an identical point create a collapsed physical edge; finite positive-area tiles remain visible with explicit unqualified omission diagnostics.
 * 3. Empty, singleton, collinear and nonfinite boundaries refuse before emission; missing and contradictory declared identities also refuse.
 * 4. Explicit unique identities preserve an ordinary qualified strip, separating identity admission from a blanket refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual strip receiver and checks finite publication, exhaustive branch area, independently reconstructed edge/link incidence, explicit degeneracy diagnostics and transactional refusal before any invalid boundary is emitted. It allows diagnostic partial geometry and distinct coincident sheets.
 * @evidence contracts/testing.md#independent-expectations A doubled slit traverses its two sheet edge occurrences in opposite directions; complete triangle-edge chains and connected vertex links supply the independent oracle. All 165 monotone paths for lengths eight and three are enumerated. A zero-length edge cannot bound positive-area triangles, so omission and lack of qualification are required while the noncollapsed remainder stays renderable. The oracle does not certify geometric injectivity.
 * @evidence contracts/testing.md#distinguishing-cases Covers repeated slit identities, a zero-length physical edge with distinct identities, four rank/finiteness failures, absent and conflicting identities and their unique-identity positive twin. Ordinary unequal-ring minima and scaling are owned by strip-minimum; cubic source phases and global shared boundaries are owned by loft-boundaries.
 * @evidence contracts/testing.md#execution-ownership This discoverable named unit entry calls portable source and mathematical helpers, with no consumer install, native build, host process, browser, GPU or dynamic registration. It observes real callbacks without replacing methods or globals.
 */
export function test_geometry_contour_strip_topology(): void {
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
          triangle.every((p: O.V): boolean => p.every(Number.isFinite)) &&
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
