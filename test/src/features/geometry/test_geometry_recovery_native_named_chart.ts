import { TestValidator } from "@nestia/e2e";

import { AutoMovieBernstein64 as B } from "../../../../packages/engine/src/geometry/curve/AutoMovieBernstein64";
import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";
import { realizeAutoMovieBicubicAtlas64 } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import { type IAutoMovieRecoveryEventChartInput, AutoMovieRecoveryEventCurve as E, compileAutoMovieRecoveryNativeNamedChart as compile, prepareAutoMovieRecoveryAnnularChart } from "@automovie/recovery";




/**
 * Native interval recipes survive actual canonical boundary admission and realization.
 *
 * Scenarios:
 * 1. Nonbinary partitions, translated coordinates and both winding signs reach the engine.
 * 2. Two periodic seam occurrences retain all aliases of their shared native endpoints.
 * 3. False endpoint aliases fail even when metre conversion hides a raw one-ULP difference.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles actual native-parent interval recipes and consumes them with the public atlas realizer. Unequal nonbinary partitions, both winding signs and translated thin strips expose duplicate restriction, reversal and unit-path conflicts.
 * @evidence contracts/testing.md#independent-expectations Splitting one cubic into two pieces preserves its exact-real curve. Two translated copies therefore define a nonempty strip independently of their split locations. A named endpoint cannot equal two different raw positions. Two aliases of the same explicitly named native endpoint must resolve to the same actual control ID.
 * @evidence contracts/testing.md#distinguishing-cases Covers two scales, two generic coordinate origins, both winding signs, nonbinary partial intervals, complete periodic seams, repeated native owners with additional endpoint aliases and false endpoint names including distinct raw coefficients that narrow to the same metre value. Source-fit and embedding qualifications are not inferred from finite output.
 * @evidence contracts/testing.md#execution-ownership Portable generic mathematical curves reach maintained compilers and the actual CPU geometry engine. No source asset, fit, anatomical fixture, disk, host process, viewer or GPU is used.
 */
export function test_geometry_recovery_native_named_chart(): void {
  const policy: Parameters<typeof compile>[1] = {
    maxPatches: 64,
    maxCells: 4096,
    maxVertices: 16384,
    toleranceMm: 0.01,
  };
  const tuple: (points: B.Poly) => C.Span = (points: B.Poly): C.Span => [
    points[0]!,
    points[1]!,
    points[2]!,
    points[3]!,
  ];
  for (const scale of [1, 1 / 256])
    for (const origin of [0, 1000])
      for (const winding of [1, -1] as const) {
        const curves: E.Arc[] = [0.13, 0.51].map(
          (q: number, row: number): E.Arc => {
            const y: number = origin + (row * scale) / 1024;
            const net: B.Poly = [
              [0.3 * scale, y, 0.3 * scale],
              [1 * scale, y, 0.7 * scale],
              [2 * scale, y, 1.1 * scale],
              [2.7 * scale, y, 0.8 * scale],
            ];
            const split: [B.Poly, B.Poly] = B.split(net, q);
            return E.fromCurve({
              type: "cubicBezier",
              name: `course${row}`,
              closed: false,
              unit: "mm",
              phaseUnit: "normalized",
              phaseIntervals: [q, 1 - q],
              canonicalKnots: [0, q, 1],
              spans: [tuple(split[0]), tuple(split[1])],
            });
          },
        );
        const bottom: E.Arc = curves[0]!,
          top: E.Arc = curves[1]!;
        const input: IAutoMovieRecoveryEventChartInput = {
          id: "native-strip",
          winding,
          chart: {
            bottom,
            top,
            left: E.line(
              bottom.pieces[0]!.net[0],
              top.pieces[0]!.net[0],
              "left",
            ),
            right: E.line(
              bottom.pieces.at(-1)!.net[3],
              top.pieces.at(-1)!.net[3],
              "right",
            ),
          },
        };
        const result: ReturnType<typeof compile> = compile(input, policy);
        if (!result.complete)
          throw new Error(
            "The bounded generic strip has only three tensor cells",
          );
        TestValidator.equals(
          "local opposite knots only",
          result.recipe.patches.length,
          3,
        );
        TestValidator.predicate(
          "proper native intervals retained",
          result.recipe.boundaryBindings!.some(
            (
              binding: NonNullable<
                typeof result.recipe.boundaryBindings
              >[number],
            ): boolean => binding.start !== 0 || binding.end !== 1,
          ),
        );
        const realized: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
          realizeAutoMovieBicubicAtlas64(result.recipe);
        TestValidator.equals(
          "canonical actual field complete",
          realized.complete,
          true,
        );
        TestValidator.predicate(
          "actual triangles remain",
          realized.mesh.indices!.length > 0,
        );
        TestValidator.predicate(
          "finite actual positions and normals",
          [...realized.mesh.positions, ...realized.mesh.normals!].every(
            Number.isFinite,
          ),
        );
        TestValidator.equals(
          "false coefficient conflict absent",
          realized.diagnostics.some((diagnostic: string): boolean =>
            diagnostic.includes("canonical-coefficient-conflict"),
          ),
          false,
        );
      }
  const loop: (name: string, y: number) => E.Arc = (
    name: string,
    y: number,
  ): E.Arc => {
    const points: C.Vector[] = [
      [0, y, 0],
      [3, y, 0],
      [3, y, 3],
      [0, y, 3],
    ];
    return E.fromCurve({
      type: "cubicBezier",
      name,
      closed: true,
      unit: "mm",
      phaseUnit: "normalized",
      phaseIntervals: [1, 1, 1, 1],
      spans: points.map(
        (point: C.Vector, i: number): C.Span =>
          E.line(point, points[(i + 1) % 4]!, `${name}-edge${i}`).pieces[0]!
            .net,
      ),
    });
  };
  const chart: ReturnType<typeof prepareAutoMovieRecoveryAnnularChart> =
    prepareAutoMovieRecoveryAnnularChart(loop("lower", 0), loop("upper", 3), "annulus");
  const aliasRight: E.Arc = {
    ...chart.right,
    pieces: chart.right.pieces.map(
      (piece: E.Piece): E.Piece => ({
        ...piece,
        source: {
          ...piece.source,
          endpointAuthorities: ["seam-start-alias", "seam-end-alias"],
        },
      }),
    ),
  };
  const periodic: ReturnType<typeof compile> = compile(
    { id: "periodic", winding: 1, chart: { ...chart, right: aliasRight } },
    policy,
  );
  if (!periodic.complete)
    throw new Error("The annular cut has four tensor cells");
  const identities: Map<string, number> = new Map(
    periodic.endpointControlOwners.map(
      (owner: { id: string; controlId: number }): [string, number] => [
        owner.id,
        owner.controlId,
      ],
    ),
  );
  TestValidator.equals(
    "repeated native owner retains new start alias",
    identities.get("seam-start-alias"),
    identities.get("lower.knot0"),
  );
  TestValidator.equals(
    "repeated native owner retains new end alias",
    identities.get("seam-end-alias"),
    identities.get("upper.knot0"),
  );
  TestValidator.equals(
    "periodic actual engine complete",
    realizeAutoMovieBicubicAtlas64(periodic.recipe).complete,
    true,
  );
  const wrongLeft: E.Arc = {
    ...chart.left,
    pieces: chart.left.pieces.map(
      (piece: E.Piece): E.Piece => ({
        ...piece,
        source: {
          ...piece.source,
          endpointAuthorities: [
            "lower.knot1",
            piece.source.endpointAuthorities[1],
          ],
        },
      }),
    ),
  };
  TestValidator.error(
    "distinct raw endpoints cannot share a name",
    (): void => {
      compile(
        { id: "wrong-alias", winding: 1, chart: { ...chart, left: wrongLeft } },
        policy,
      );
    },
  );
  // Just below the binade at two, the two adjacent raw values round to the same metre value.
  const lo: number = 2 - 2 * Number.EPSILON,
    hi: number = 2 - Number.EPSILON;
  TestValidator.equals(
    "unit conversion can hide one raw ULP",
    lo * 0.001,
    hi * 0.001,
  );
  const ulpBottom: E.Arc = E.line([lo, 0, 0], [hi, 0, 0], "ulp-bottom");
  ulpBottom.pieces[0]!.source.endpointAuthorities = [
    "false-raw-alias",
    "false-raw-alias",
  ];
  TestValidator.error("raw ULP conflict survives unit narrowing", (): void => {
    compile(
      {
        id: "ulp-conflict",
        winding: 1,
        chart: {
          bottom: ulpBottom,
          top: E.line([lo, 3, 0], [hi, 3, 0], "ulp-top"),
          left: E.line([lo, 0, 0], [lo, 3, 0], "ulp-left"),
          right: E.line([hi, 0, 0], [hi, 3, 0], "ulp-right"),
        },
      },
      policy,
    );
  });
}
