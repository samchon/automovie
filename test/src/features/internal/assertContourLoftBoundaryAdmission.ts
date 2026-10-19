import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import { tessellateAutoMovieContourLoft64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourLoft64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { nclose } from "../internal/nclose.ts";
import { throwsError } from "../internal/throwsError.ts";
import { assertContourLoftMalformedCurves } from "./assertContourLoftMalformedCurves";
import { contourLoftBoundaryOracle as B } from "./contourLoftBoundaryOracle";

const { rectangle, intervalTriangles, aligned }: typeof B = B;

/**
 * Preserve local interval and event admission scenarios.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the original portable loft calls and their actual mesh, construction, phase and omission assertions in the same order.
 * @evidence contracts/testing.md#independent-expectations Original polynomial formulas, oriented identity-edge counts and dimensioned expectations remain unchanged; no implementation snapshot supplies an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves this extracted scenario group's original positive, malformed and boundary cases without dropping assertions.
 * @evidence contracts/testing.md#execution-ownership Called by the existing discoverable named test; direct portable imports start no process, browser, GPU or native build and register no dynamic tests.
 */
export function assertContourLoftBoundaryAdmission(): void {
  const localSections: L.ISection[] = [0, 2].map(
    (y: number, i: number): L.ISection => ({
      coordinateMm: y,
      loops: (i === 0 ? [0, 20] : [0]).map(
        (x: number, j: number): L.ISection["loops"][number] => ({
          curve: O.curve(`local-${i}-${j}`, rectangle(y, x, 1, 1)),
          winding: 1,
        }),
      ),
    }),
  );

  const localInterval: L.IInterval = {
    beforeMm: 0,
    afterMm: 2,
    groups: [
      { before: [0], after: [0], supported: true, reason: null },
      {
        before: [1],
        after: [],
        supported: false,
        reason: "No closed-to-open continuation witness",
      },
    ],
  };

  const local: L.IResult = tessellateAutoMovieContourLoft64({
    sections: localSections,
    intervals: [localInterval],
    events: [],
    chordToleranceMm: 0.25,
  });

  TestValidator.predicate(
    "unsupported closed-to-open continuation remains one exact local reason",
    local.unresolved.length === 1 &&
      nclose(local.unresolved[0].beforeMm, 0, 0) &&
      nclose(local.unresolved[0].afterMm, 2, 0) &&
      local.unresolved[0].incoming === 1 &&
      local.unresolved[0].outgoing === 0 &&
      local.unresolved[0].reason === "No closed-to-open continuation witness",
  );

  TestValidator.predicate(
    "supported neighbor remains visible without an invented cap",
    local.primitiveRanges?.length === 1 &&
      local.primitiveRanges[0].kind === "strip" &&
      local.mesh.indices!.length > 0 &&
      local.mesh.positions.every(
        (value: number, i: number): boolean => i % 3 !== 0 || value < 0.01,
      ),
  );

  const hidden: L.IResult = tessellateAutoMovieContourLoft64({
    sections: [
      { coordinateMm: 0, loops: [] },
      { coordinateMm: 2, loops: [] },
    ],
    events: [],
    intervals: [
      {
        beforeMm: 0,
        afterMm: 2,
        groups: [
          {
            before: [],
            after: [],
            supported: false,
            reason: "Unresolved open component",
          },
        ],
      },
    ],
    chordToleranceMm: 0.25,
  });

  TestValidator.predicate(
    "an unsupported hidden component survives without a fabricated boundary",
    hidden.mesh.indices!.length === 0 &&
      hidden.unresolved.length === 1 &&
      hidden.unresolved[0].incoming === 0 &&
      hidden.unresolved[0].outgoing === 0 &&
      hidden.unresolved[0].reason === "Unresolved open component",
  );

  const admissionSections: L.ISection[] = [0, 2, 4].map(
    (y: number, i: number): L.ISection => ({
      coordinateMm: y,
      loops: [0, 20].map(
        (x: number, j: number): L.ISection["loops"][number] => ({
          curve: O.curve(`admission-${i}-${j}`, rectangle(y, x, 1, 1)),
          winding: 1,
        }),
      ),
    }),
  );

  const complete: L.IInterval[] = [0, 2].map(
    (before: number): L.IInterval => ({
      beforeMm: before,
      afterMm: before + 2,
      groups: [0, 1].map((id: number): L.IInterval["groups"][number] => ({
        before: [id],
        after: [id],
        supported: true,
        reason: null,
      })),
    }),
  );

  const malformed: {
    name: string;
    intervals: L.IInterval[];
    firstTriangles: number;
  }[] = [
    {
      name: "missing group",
      intervals: [
        { ...complete[0], groups: [complete[0].groups[0]] },
        complete[1],
      ],
      firstTriangles: 8,
    },
    {
      name: "repeated local loop",
      intervals: [
        {
          ...complete[0],
          groups: [...complete[0].groups, complete[0].groups[1]],
        },
        complete[1],
      ],
      firstTriangles: 8,
    },
    {
      name: "out-of-range local loop",
      intervals: [
        {
          ...complete[0],
          groups: [
            complete[0].groups[0],
            { before: [99], after: [1], supported: true, reason: null },
          ],
        },
        complete[1],
      ],
      firstTriangles: 8,
    },
    {
      name: "missing whole interval",
      intervals: [complete[1]],
      firstTriangles: 0,
    },
  ];

  for (const scenario of malformed) {
    const retained: L.IResult = tessellateAutoMovieContourLoft64({
      sections: admissionSections,
      intervals: scenario.intervals,
      events: [],
      chordToleranceMm: 0.25,
    });
    const ranges: NonNullable<L.IResult["primitiveRanges"]> =
      retained.primitiveRanges ?? [];
    TestValidator.equals(
      `${scenario.name} preserves exactly the independently supported triangles`,
      intervalTriangles(retained),
      [scenario.firstTriangles, 16],
    );
    TestValidator.predicate(
      `${scenario.name} retains local diagnostics without an inferred cap`,
      retained.unresolved.some(
        (record: L.IResult["unresolved"][number]): boolean =>
          nclose(record.beforeMm, 0, 0) &&
          nclose(record.afterMm, 2, 0) &&
          typeof record.reason === "string" &&
          record.reason.length > 0,
      ) &&
        ranges.every(
          (range: NonNullable<L.IResult["primitiveRanges"]>[number]): boolean =>
            range.kind === "strip",
        ),
    );
    TestValidator.predicate(
      `${scenario.name} publishes only representable indexed geometry`,
      retained.mesh.positions.every(Number.isFinite) &&
        retained.mesh.indices!.every(
          (index: number): boolean =>
            Number.isSafeInteger(index) &&
            index >= 0 &&
            index < retained.mesh.positions.length / 3,
        ),
    );
    TestValidator.predicate(
      `${scenario.name} retains the original source construction`,
      aligned(retained, admissionSections),
    );
  }

  const birthSections: L.ISection[] = [0, 2, 4].map(
    (y: number, i: number): L.ISection => ({
      coordinateMm: y,
      loops: (i === 0 ? [0] : [0, 20]).map(
        (x: number, j: number): L.ISection["loops"][number] => ({
          curve: O.curve(`birth-${i}-${j}`, rectangle(y, x, 1, 1)),
          winding: 1,
        }),
      ),
    }),
  );

  const birthIntervals: L.IInterval[] = [
    {
      beforeMm: 0,
      afterMm: 2,
      groups: [
        { before: [0], after: [0], supported: true, reason: null },
        { before: [], after: [1], supported: true, reason: null },
      ],
    },
    complete[1],
  ];

  const birth: L.IEvent = {
    name: "birth-B",
    coordinateMm: 1,
    beforeMm: 0,
    afterMm: 2,
    before: [],
    after: [1],
    kind: "minimum",
    regular: true,
    terminal: [20, 1, 0],
  };

  const validBirth: L.IResult = tessellateAutoMovieContourLoft64({
    sections: birthSections,
    intervals: birthIntervals,
    events: [birth],
    chordToleranceMm: 0.25,
  });

  TestValidator.equals(
    "a valid declared birth contributes its four explicit cap triangles",
    intervalTriangles(validBirth),
    [12, 16],
  );

  const invalidEvents: { name: string; events: L.IEvent[] }[] = [
    { name: "missing terminal", events: [{ ...birth, terminal: null }] },
    {
      name: "nonfinite terminal",
      events: [{ ...birth, terminal: [20, Number.NaN, 0] }],
    },
    {
      name: "nonfinite critical coordinate",
      events: [{ ...birth, coordinateMm: Number.NaN }],
    },
    {
      name: "invalid incident ordinal",
      events: [{ ...birth, after: [1, 99] }],
    },
    { name: "empty incidence", events: [{ ...birth, after: [] }] },
    { name: "empty event name", events: [{ ...birth, name: "" }] },
    { name: "conflicting event names", events: [birth, { ...birth }] },
  ];

  for (const scenario of invalidEvents) {
    const retained: L.IResult = tessellateAutoMovieContourLoft64({
      sections: birthSections,
      intervals: birthIntervals,
      events: scenario.events,
      chordToleranceMm: 0.25,
    });
    TestValidator.equals(
      `${scenario.name} keeps the independent strip and next interval`,
      intervalTriangles(retained),
      [8, 16],
    );
    TestValidator.predicate(
      `${scenario.name} has an explicit event diagnostic in its known bracket`,
      retained.unresolved.some(
        (record: L.IResult["unresolved"][number]): boolean =>
          nclose(record.beforeMm, 0, 0) &&
          nclose(record.afterMm, 2, 0) &&
          record.reason?.toLowerCase().includes("event") === true,
      ),
    );
    TestValidator.predicate(
      `${scenario.name} invents no extremum cap`,
      retained.primitiveRanges!.every(
        (range: NonNullable<L.IResult["primitiveRanges"]>[number]): boolean =>
          range.kind === "strip",
      ),
    );
    TestValidator.predicate(
      `${scenario.name} preserves valid original curve construction`,
      aligned(retained, birthSections),
    );
  }

  for (const badBracket of [
    { ...birth, beforeMm: -2 },
    { ...birth, afterMm: 99 },
  ])
    TestValidator.predicate(
      "an event without identifiable saved brackets still refuses",
      throwsError(
        (): L.IResult =>
          tessellateAutoMovieContourLoft64({
            sections: birthSections,
            intervals: birthIntervals,
            events: [badBracket],
            chordToleranceMm: 0.25,
          }),
      ),
    );
  assertContourLoftMalformedCurves(admissionSections, complete);
}
