import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { tessellateAutoMovieContourLoft64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourLoft64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { throwsError } from "../internal/throwsError.ts";
import type { assertContourLoftBoundaryCore } from "./assertContourLoftBoundaryCore";
import { contourLoftBoundaryOracle as B } from "./contourLoftBoundaryOracle";

const { rectangle, edges, aligned }: typeof B = B;

/**
 * Preserve explicit extrema, interior slits, empty input and global refusal scenarios.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the original portable loft calls and their actual mesh, construction, phase and omission assertions in the same order.
 * @evidence contracts/testing.md#independent-expectations Original polynomial formulas, oriented identity-edge counts and dimensioned expectations remain unchanged; no implementation snapshot supplies an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves this extracted scenario group's original positive, malformed and boundary cases without dropping assertions.
 * @evidence contracts/testing.md#execution-ownership Called by the existing discoverable named test; direct portable imports start no process, browser, GPU or native build and register no dynamic tests.
 */
export function assertContourLoftBoundaryCompletion(
  context: ReturnType<typeof assertContourLoftBoundaryCore>,
): void {
  const { sections, input, mergeAligned, mergeInserted }: typeof context =
    context;

  const coneSections: L.ISection[] = [
    { coordinateMm: 0, loops: [] },
    {
      coordinateMm: 2,
      loops: [{ curve: O.curve("cone", rectangle(2, 0, 2, 1)), winding: 1 }],
    },
    { coordinateMm: 4, loops: [] },
  ];

  const extrema: L.IEvent[] = ["minimum", "maximum"].map(
    (kind: string, i: number): L.IEvent => ({
      name: kind,
      kind: kind as "minimum" | "maximum",
      coordinateMm: 1 + 2 * i,
      beforeMm: 2 * i,
      afterMm: 2 + 2 * i,
      before: i === 0 ? [] : [0],
      after: i === 0 ? [0] : [],
      regular: true,
      terminal: [0, 1 + 2 * i, 0],
    }),
  );

  const cones: L.IResult = tessellateAutoMovieContourLoft64({
    sections: coneSections,
    events: extrema,
    chordToleranceMm: 0.25,
  });

  TestValidator.predicate(
    "only explicit isolated terminals close the finite ring",
    cones.unresolved.length === 0 &&
      cones.primitiveRanges?.length === 2 &&
      cones.primitiveRanges.every(
        (range: NonNullable<L.IResult["primitiveRanges"]>[number]): boolean =>
          range.kind === "cap",
      ) &&
      [...edges(cones).values()].every(
        (record: { uses: number; orientation: number }): boolean =>
          record.uses === 2 && record.orientation === 0,
      ),
  );

  const unmatched: L.IResult = tessellateAutoMovieContourLoft64({
    sections: coneSections,
    events: [],
    chordToleranceMm: 0.25,
  });

  TestValidator.predicate(
    "an unmatched finite ring is unresolved and receives no cap",
    unmatched.mesh.indices!.length === 0 && unmatched.unresolved.length === 2,
  );

  // Different rectangle depths force a strict interior closest slit. The linear
  // trace has position fraction 3t²-2t³, so chord fraction is not its source phase.
  for (const winding of [1, -1] as const) {
    const mergeSections: L.ISection[] = [
      {
        coordinateMm: 0,
        loops: [
          { curve: O.curve("left", rectangle(0, -2, 1, 2)), winding },
          { curve: O.curve("right", rectangle(0, 2, 1, 1)), winding },
        ],
      },
      {
        coordinateMm: 2,
        loops: [{ curve: O.curve("merged", rectangle(2, 0, 4, 3)), winding }],
      },
    ];
    const merge: L.IResult = tessellateAutoMovieContourLoft64({
      sections: mergeSections,
      intervals: [
        {
          beforeMm: 0,
          afterMm: 2,
          groups: [
            { before: [0, 1], after: [0], supported: true, reason: null },
          ],
        },
      ],
      events: [
        {
          name: "merge",
          coordinateMm: 1,
          beforeMm: 0,
          afterMm: 2,
          before: [0, 1],
          after: [0],
          kind: "saddle",
          regular: true,
          terminal: null,
        },
      ],
      chordToleranceMm: 0.25,
    });
    mergeInserted.push(
      merge.construction
        .slice(0, 2)
        .some(
          (ring: L.IResult["construction"][number]): boolean =>
            ring.points.length > 4,
        ),
    );
    mergeAligned.push(aligned(merge, mergeSections));
  }

  const empty: L.IResult = tessellateAutoMovieContourLoft64({
    sections: [],
    events: [],
    intervals: [],
    chordToleranceMm: 1,
  });

  TestValidator.predicate(
    "empty input is an empty admitted result",
    empty.mesh.positions.length === 0 &&
      empty.mesh.indices!.length === 0 &&
      empty.construction.length === 0 &&
      empty.unresolved.length === 0,
  );

  for (const tolerance of [0, -1, Number.NaN, Infinity])
    TestValidator.predicate(
      "nonpositive or nonfinite tolerance refuses",
      throwsError(
        (): L.IResult =>
          tessellateAutoMovieContourLoft64({
            ...input,
            chordToleranceMm: tolerance,
          }),
        "Positive physical",
      ),
    );

  TestValidator.predicate(
    "nonincreasing section addresses refuse",
    throwsError(
      (): L.IResult =>
        tessellateAutoMovieContourLoft64({
          ...input,
          sections: [...sections].reverse(),
        }),
      "Finite increasing",
    ),
  );

  const original: C.Cubic = sections[0].loops[0].curve;

  const disconnected: C.Cubic = {
    ...original,
    spans: original.spans.map(
      (span: C.Span, i: number): C.Span =>
        i === 0
          ? [
              [span[0][0] + 1, span[0][1], span[0][2]],
              span[1],
              span[2],
              span[3],
            ]
          : span,
    ),
  };

  const failed: L.IResult = tessellateAutoMovieContourLoft64({
    ...input,
    sections: [
      { ...sections[0], loops: [{ curve: disconnected, winding: 1 }] },
      ...sections.slice(1),
    ],
  });

  TestValidator.predicate(
    "C0-disconnected source remains a diagnosed local gap beside the valid interval",
    failed.unresolved.length === 1 &&
      failed.unresolved[0].reason?.includes("exact C0-connected") === true &&
      failed.primitiveRanges?.length === 1 &&
      failed.construction[0].points.length === 1,
  );

  TestValidator.predicate(
    "both winding senses exercise an inserted source knot",
    mergeInserted.length === 2 &&
      mergeInserted.every((value: boolean): boolean => value),
  );

  TestValidator.predicate(
    "interior slit knots retain their original cubic generating phase in both winding senses",
    mergeAligned.length === 4 &&
      mergeAligned.every((value: boolean): boolean => value),
  );
}
