import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { tessellateAutoMovieContourLoft64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourLoft64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { nclose } from "../internal/nclose.ts";
import { contourLoftBoundaryOracle as B } from "./contourLoftBoundaryOracle";

const { intervalTriangles, aligned }: typeof B = B;

/**
 * Preserve malformed endpoint, phase metadata and spatial-unit admission scenarios.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the original portable loft calls and their actual mesh, construction, phase and omission assertions in the same order.
 * @evidence contracts/testing.md#independent-expectations Original polynomial formulas, oriented identity-edge counts and dimensioned expectations remain unchanged; no implementation snapshot supplies an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves this extracted scenario group's original positive, malformed and boundary cases without dropping assertions.
 * @evidence contracts/testing.md#execution-ownership Called by the existing discoverable named test; direct portable imports start no process, browser, GPU or native build and register no dynamic tests.
 */
export function assertContourLoftMalformedCurves(
  admissionSections: L.ISection[],
  complete: L.IInterval[],
): void {
  const originalCurve: C.Cubic = admissionSections[0].loops[1].curve;

  /** Replace only caller-owned first-point data; untouched spans remain the same mathematical fixture. */
  const firstPointCurve: (point: O.V) => C.Cubic = (point: O.V): C.Cubic => ({
    ...originalCurve,
    spans: originalCurve.spans.map(
      (span: C.Span, i: number): C.Span =>
        i === 0 ? [point, span[1], span[2], span[3]] : span,
    ),
  });

  // A widened mutable view intentionally creates malformed caller-owned data.
  // No global, foreign method or production object is replaced by these fixtures.
  const shortPoint: O.V = [...originalCurve.spans[0][0]],
    shortStorage: number[] = shortPoint;

  shortStorage.length = 2;

  const sparsePoint: O.V = [...originalCurve.spans[0][0]],
    sparseStorage: number[] = sparsePoint;

  sparseStorage.length = 0;

  sparseStorage.length = 3;

  sparseStorage[1] = 0;

  sparseStorage[2] = -1;

  const missingPhases: C.Cubic = { ...originalCurve };

  const missingMetadata: { phaseIntervals?: readonly number[] } = missingPhases;

  delete missingMetadata.phaseIntervals;

  const invalidPhases: C.Cubic = { ...originalCurve };

  const invalidMetadata: { phaseIntervals: unknown } = invalidPhases;

  invalidMetadata.phaseIntervals = {};

  const wrongUnit: C.Cubic = { ...originalCurve };

  const unitMetadata: { unit: string } = wrongUnit;

  unitMetadata.unit = "m";

  const invalidCurves: {
    name: string;
    curve: C.Cubic;
    diagnosticPoints: number;
  }[] = [
    {
      name: "empty coefficients",
      curve: { ...originalCurve, spans: [], phaseIntervals: [] },
      diagnosticPoints: 0,
    },
    {
      name: "NaN endpoint",
      curve: firstPointCurve([Number.NaN, 0, -1]),
      diagnosticPoints: 0,
    },
    {
      name: "infinite endpoint",
      curve: firstPointCurve([Infinity, 0, -1]),
      diagnosticPoints: 0,
    },
    {
      name: "short endpoint",
      curve: firstPointCurve(shortPoint),
      diagnosticPoints: 0,
    },
    {
      name: "sparse endpoint",
      curve: firstPointCurve(sparsePoint),
      diagnosticPoints: 0,
    },
    {
      name: "missing phase metadata",
      curve: missingPhases,
      diagnosticPoints: 1,
    },
    {
      name: "non-array phase metadata",
      curve: invalidPhases,
      diagnosticPoints: 1,
    },
    { name: "wrong spatial unit", curve: wrongUnit, diagnosticPoints: 0 },
  ];

  const invalidCurveId: string = `${originalCurve.name}.section.0.loop.1`;

  for (const scenario of invalidCurves) {
    const changed: L.ISection[] = [
      {
        ...admissionSections[0],
        loops: [
          admissionSections[0].loops[0],
          { curve: scenario.curve, winding: 1 },
        ],
      },
      ...admissionSections.slice(1),
    ];
    const retained: L.IResult = tessellateAutoMovieContourLoft64({
      sections: changed,
      intervals: complete,
      events: [],
      chordToleranceMm: 0.25,
    });
    TestValidator.equals(
      `${scenario.name} keeps independent strip geometry`,
      intervalTriangles(retained),
      [8, 16],
    );
    TestValidator.predicate(
      `${scenario.name} has an explicit local source diagnostic`,
      retained.unresolved.some(
        (record: L.IResult["unresolved"][number]): boolean =>
          nclose(record.beforeMm, 0, 0) &&
          nclose(record.afterMm, 2, 0) &&
          record.reason?.toLowerCase().includes("curve") === true,
      ),
    );
    const diagnostic: L.IResult["construction"][number] | undefined =
      retained.construction.find(
        (record: L.IResult["construction"][number]): boolean =>
          record.id === invalidCurveId,
      );
    TestValidator.predicate(
      `${scenario.name} retains only an actual interpretable diagnostic endpoint`,
      diagnostic !== undefined &&
        diagnostic.points.length === scenario.diagnosticPoints &&
        (scenario.diagnosticPoints === 0 ||
          diagnostic.points[0].every((value: number, k: number): boolean =>
            nclose(value, originalCurve.spans[0][0][k] * 0.001, 0),
          )),
    );
    TestValidator.predicate(
      `${scenario.name} never publishes nonfinite mesh or construction data`,
      retained.mesh.positions.every(Number.isFinite) &&
        retained.mesh.normals!.every(Number.isFinite) &&
        retained.construction.every(
          (record: L.IResult["construction"][number]): boolean =>
            record.points.every(
              (point: O.V): boolean =>
                point.length === 3 &&
                [0, 1, 2].every((k: number): boolean =>
                  Number.isFinite(point[k]),
                ),
            ),
        ),
    );
    TestValidator.predicate(
      `${scenario.name} leaves valid neighbors on their original source curves`,
      aligned(
        {
          ...retained,
          construction: retained.construction.filter(
            (record: L.IResult["construction"][number]): boolean =>
              record.id !== invalidCurveId,
          ),
        },
        admissionSections,
      ),
    );
  }
}
