import {
  type IAutoMovieRecoverySectionsInput,
  type IAutoMovieRecoverySourceLineage,
  observeAutoMovieRecoverySections,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Named fixed planes retain all intersected components, physical frames and source-free Hermite coefficients.
 *
 * Scenarios:
 * 1. Unsorted planes cut both translated tetrahedra, retain an empty plane and report an isolated apex contact.
 * 2. A nonunit axis preserves original input direction while actual coordinates use the normalized physical frame.
 * 3. Closed, open, degenerate and failed contours retain original source-face lineage without adding source arrays to output.
 * 4. Reversing the axis and signed coordinates observes the same physical planes with reversed normal direction.
 * 5. Invalid, duplicate, sparse and empty coordinates are refused; observer exceptions and aborts return no value.
 * 6. A source-seeded distal tetrahedron observes its actual apex and brackets while retaining the other component in every additional cut; an open-ended tube cannot authorize a point tip.
 * 7. A single plane can request exact cutter-face lineage without adding a slab or changing its coefficient publication; malformed retention flags are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public fixed-section observer and asserts exact requested station populations, all-component counts, physical Hermite endpoint heights, original incidence, local failure records and terminal effects.
 * @evidence contracts/testing.md#independent-expectations Each authored tetrahedron occupies 0<=Y<=3; interior cuts meet its three side faces, Y=-1 is empty, and Y=3 is a single isolated apex. Translation by 10 mm in X creates a second disjoint component with triangle ordinals offset by four. A single triangle has one open interior cut. These geometric facts define expectations without a recovered-output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Unsorted interior, outside and tangent planes distinguish fixed requests from automatic sweep stations or largest-loop filtering. Nonunit and reversed axes distinguish physical projection from raw-axis multiplication. Open, degenerate, exhausted-fit, callback failure, cancellation and malformed inputs cover local and terminal paths; automatic topology belongs to existing recovery tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_fixed_sections entry uses only small generic CPU tetrahedra and triangles, with no Human data, acquisition host, process, GPU or filesystem; the central runner owns execution.
 */
export function test_recovery_fixed_sections(): void {
  const vertices: IAutoMovieRecoverySectionsInput["verticesMm"] = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 0, 3],
    [0, 3, 0],
  ];
  const triangles: IAutoMovieRecoverySectionsInput["triangles"] = [
    [0, 3, 1],
    [0, 2, 3],
    [0, 1, 2],
    [1, 3, 2],
  ];
  const input: IAutoMovieRecoverySectionsInput = {
    name: "two-components",
    coordinatesMm: [2, 0.5, -1, 3],
    verticesMm: [
      ...vertices,
      ...vertices.map(
        (p: [number, number, number]): [number, number, number] => [
          p[0] + 10,
          p[1],
          p[2],
        ],
      ),
    ],
    triangles: [
      ...triangles,
      ...triangles.map(
        (t: [number, number, number]): [number, number, number] => [
          t[0] + 4,
          t[1] + 4,
          t[2] + 4,
        ],
      ),
    ],
    axis: [0, 2, 0],
    reference: [2, 0, 0],
    toleranceMm: 0.01,
    maxSpans: 32,
    exactCoordinateAliases: false,
    sourceOrientationSign: 1,
    cornerDegrees: 45,
  };
  const before: string = JSON.stringify(input);
  const lineage: IAutoMovieRecoverySourceLineage[] = [];
  const observed: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(input, {
    curveFormat: "hermite",
    onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
      lineage.push(record);
    },
  });
  if (!("value" in observed))
    throw new Error("Named tetrahedron cuts must retain observations");
  TestValidator.equals(
    "selected contact remains partial",
    observed.status,
    "partial",
  );
  TestValidator.equals(
    "only requested cuts in original order",
    observed.value.sections.map(
      (section: (typeof observed.value.sections)[number]): number =>
        section.coordinateMm,
    ),
    [...input.coordinatesMm],
  );
  TestValidator.equals(
    "both components survive",
    observed.value.sections.map(
      (section: (typeof observed.value.sections)[number]): number =>
        section.loops.length,
    ),
    [2, 2, 0, 0],
  );
  TestValidator.equals(
    "original nonunit axis retained",
    observed.value.axis,
    input.axis,
  );
  TestValidator.equals(
    "actual normal is normalized",
    observed.value.frame.n,
    [0, 1, 0],
  );
  TestValidator.equals("source input unchanged", JSON.stringify(input), before);
  TestValidator.predicate(
    "two isolated apex contacts retained",
    observed.value.reports[3]!.isolatedContactsMm.length === 2,
  );
  TestValidator.predicate(
    "tangent lineage remains degenerate",
    lineage
      .filter(
        (record: IAutoMovieRecoverySourceLineage): boolean =>
          record.coordinateMm === 3,
      )
      .every(
        (record: IAutoMovieRecoverySourceLineage): boolean =>
          record.publication.kind === "degenerate",
      ),
  );
  for (const section of observed.value.sections) {
    for (const loop of section.loops) {
      TestValidator.equals(
        "Hermite basis is actual",
        loop.curve.type,
        "cubicHermite",
      );
      TestValidator.predicate(
        "collection names every contour",
        loop.curve.name.startsWith("two-components."),
      );
      TestValidator.predicate(
        "actual physical phase widths",
        loop.curve.phaseIntervals.every(
          (h: number): boolean => h > 0 && Number.isFinite(h),
        ),
      );
      for (const span of loop.curve.spans)
        TestValidator.predicate(
          "section endpoints stay on requested physical plane",
          nclose(span.start[1], section.coordinateMm, 1e-12) &&
            nclose(span.end[1], section.coordinateMm, 1e-12),
        );
    }
  }
  const interiorLineage: IAutoMovieRecoverySourceLineage[] = lineage.filter(
    (record: IAutoMovieRecoverySourceLineage): boolean =>
      record.coordinateMm === 0.5,
  );
  TestValidator.equals("one lineage per component", interiorLineage.length, 2);
  TestValidator.equals(
    "first component original side faces",
    [...interiorLineage[0]!.sourceTriangleIds].sort(
      (a: number, b: number): number => a - b,
    ),
    [0, 1, 3],
  );
  TestValidator.equals(
    "second component original side faces",
    [...interiorLineage[1]!.sourceTriangleIds].sort(
      (a: number, b: number): number => a - b,
    ),
    [4, 5, 7],
  );
  const exactLineage: IAutoMovieRecoverySourceLineage[] = [];
  const singlePlane: IAutoMovieRecoverySectionsInput = {
    ...input,
    coordinatesMm: [0.5],
  };
  const curveOnly: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(singlePlane, { curveFormat: "hermite" });
  const exact: ReturnType<typeof observeAutoMovieRecoverySections<"hermite">> =
    observeAutoMovieRecoverySections(
      { ...singlePlane, includeExactSourceLineage: true },
      {
        curveFormat: "hermite",
        onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
          exactLineage.push(record);
        },
      },
    );
  if (!("value" in curveOnly) || !("value" in exact))
    throw new Error(
      "Single-plane exact lineage must retain its coefficient publication",
    );
  TestValidator.equals(
    "exact retention adds no curve or plane",
    exact.value,
    curveOnly.value,
  );
  TestValidator.equals(
    "single-plane exact first component",
    [...(exactLineage[0]!.exactSourceTriangleIds ?? [])].sort(
      (a: number, b: number): number => a - b,
    ),
    [0, 1, 3],
  );
  TestValidator.equals(
    "single-plane exact second component",
    [...(exactLineage[1]!.exactSourceTriangleIds ?? [])].sort(
      (a: number, b: number): number => a - b,
    ),
    [4, 5, 7],
  );
  TestValidator.equals(
    "nonboolean retention flag refused",
    observeAutoMovieRecoverySections(
      { ...singlePlane, includeExactSourceLineage: 1 as unknown as boolean },
      { curveFormat: "hermite" },
    ).status,
    "refused",
  );
  const reversed: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(
    { ...input, axis: [0, -2, 0], coordinatesMm: [-2, -0.5, 1, -3] },
    { curveFormat: "hermite" },
  );
  if (!("value" in reversed))
    throw new Error("Reversed physical frame must remain supported");
  TestValidator.equals(
    "reversed normal retained",
    reversed.value.frame.n,
    [0, -1, 0],
  );
  TestValidator.equals(
    "reversed physical planes preserve components",
    reversed.value.sections.map(
      (section: (typeof reversed.value.sections)[number]): number =>
        section.loops.length,
    ),
    [2, 2, 0, 0],
  );
  const opened: ReturnType<typeof observeAutoMovieRecoverySections<"hermite">> =
    observeAutoMovieRecoverySections(
      {
        ...input,
        coordinatesMm: [0.5],
        verticesMm: [
          [0, 0, 0],
          [3, 0, 0],
          [0, 3, 0],
        ],
        triangles: [[0, 1, 2]],
      },
      {
        curveFormat: "hermite",
        onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
          lineage.push(record);
        },
      },
    );
  if (!("value" in opened))
    throw new Error("Open plane observation must retain partial coefficients");
  TestValidator.equals(
    "open source component retained",
    opened.value.reports[0]!.open.length,
    1,
  );
  TestValidator.equals(
    "open curve is Hermite",
    opened.value.reports[0]!.open[0]!.curve.type,
    "cubicHermite",
  );
  TestValidator.equals(
    "open publication lineage",
    lineage[lineage.length - 1]!.publication.kind,
    "open",
  );
  observeAutoMovieRecoverySections(
    { ...input, maxSpans: 1, coordinatesMm: [0.5] },
    {
      curveFormat: "hermite",
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        lineage.push(record);
      },
    },
  );
  TestValidator.equals(
    "exhausted fit retains source lineage",
    lineage[lineage.length - 1]!.publication.kind,
    "failed",
  );
  for (const coordinatesMm of [
    [],
    [0.5, 0.5],
    [Number.NaN],
    new Array<number>(1),
  ]) {
    const refused: ReturnType<
      typeof observeAutoMovieRecoverySections<"hermite">
    > = observeAutoMovieRecoverySections(
      { ...input, coordinatesMm },
      { curveFormat: "hermite" },
    );
    TestValidator.equals(
      "invalid coordinates refused",
      refused.status,
      "refused",
    );
    TestValidator.predicate(
      "refusal publishes no coefficients",
      !("value" in refused),
    );
  }
  const failed: ReturnType<typeof observeAutoMovieRecoverySections<"hermite">> =
    observeAutoMovieRecoverySections(input, {
      curveFormat: "hermite",
      onSourceLineage: (): void => {
        throw new Error("fixed lineage failed");
      },
    });
  TestValidator.equals(
    "lineage exception fails collection",
    failed.status,
    "failed",
  );
  TestValidator.equals("lineage error retained", failed.diagnostics, [
    "fixed lineage failed",
  ]);
  TestValidator.predicate(
    "observer failure publishes no value",
    !("value" in failed),
  );
  const controller: AbortController = new AbortController();
  let delivered: number = 0;
  const cancelled: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(input, {
    curveFormat: "hermite",
    signal: controller.signal,
    onSourceLineage: (): void => {
      delivered++;
      controller.abort();
    },
  });
  TestValidator.equals(
    "lineage abort cancels collection",
    cancelled.status,
    "cancelled",
  );
  TestValidator.equals("cancellation stops lineage", delivered, 1);
  TestValidator.predicate(
    "cancelled collection publishes no value",
    !("value" in cancelled),
  );
  const terminal: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(
    {
      ...input,
      coordinatesMm: [0.5],
      terminalSeeds: [{ coordinateMm: 0.5, loopIndex: 0 }],
    },
    { curveFormat: "hermite" },
  );
  if (!("value" in terminal))
    throw new Error("A closed source seed must publish distal observations");
  TestValidator.predicate(
    "source tetrahedron has one qualified tip",
    terminal.value.terminals?.[0]?.singleTipQualified === true,
  );
  TestValidator.predicate(
    "actual maximum is the source apex",
    nclose(
      terminal.value.terminals?.[0]?.maximum?.coordinateMm ?? Number.NaN,
      3,
      1e-12,
    ),
  );
  TestValidator.equals(
    "actual measured tip point",
    terminal.value.terminals?.[0]?.maximum?.pointsMm,
    [[0, 3, 0]],
  );
  TestValidator.predicate(
    "observed terminal and brackets append planes",
    terminal.value.sections.length === 4 &&
      terminal.value.sections[0]!.coordinateMm === 0.5 &&
      terminal.value.sections.some(
        (section: (typeof terminal.value.sections)[number]): boolean =>
          section.coordinateMm === 3,
      ),
  );
  TestValidator.predicate(
    "additional pre-tip cut retains both source components",
    terminal.value.sections.some(
      (section: (typeof terminal.value.sections)[number]): boolean =>
        section.coordinateMm > 0.5 &&
        section.coordinateMm < 3 &&
        section.loops.length === 2,
    ),
  );
  const tube: IAutoMovieRecoverySectionsInput = {
    ...input,
    coordinatesMm: [0.5],
    terminalSeeds: [{ coordinateMm: 0.5, loopIndex: 0 }],
    verticesMm: [
      [0, 0, 0],
      [3, 0, 0],
      [3, 0, 3],
      [0, 0, 3],
      [0, 3, 0],
      [3, 3, 0],
      [3, 3, 3],
      [0, 3, 3],
    ],
    triangles: [
      [0, 4, 1],
      [1, 4, 5],
      [1, 5, 2],
      [2, 5, 6],
      [2, 6, 3],
      [3, 6, 7],
      [3, 7, 0],
      [0, 7, 4],
    ],
  };
  const unqualified: ReturnType<
    typeof observeAutoMovieRecoverySections<"hermite">
  > = observeAutoMovieRecoverySections(tube, { curveFormat: "hermite" });
  if (!("value" in unqualified))
    throw new Error(
      "Open distal source must retain explicit unsupported observations",
    );
  TestValidator.predicate(
    "open source does not authorize point cap",
    unqualified.value.terminals?.[0]?.singleTipQualified === false,
  );
  TestValidator.predicate(
    "open source retains all tied extrema",
    unqualified.value.terminals?.[0]?.maximum?.pointsMm.length === 4,
  );
  TestValidator.predicate(
    "source boundary omission is explicit",
    unqualified.value.terminals?.[0]?.diagnostics.some(
      (diagnostic: string): boolean =>
        diagnostic.includes("boundary or nonmanifold"),
    ) === true,
  );
}
