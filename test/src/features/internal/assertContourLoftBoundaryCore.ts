import { TestValidator } from "@nestia/e2e";

import { AutoMovieBernsteinSubdivision64 as S } from "../../../../packages/engine/src/geometry/curve/AutoMovieBernsteinSubdivision64.ts";
import { AutoMovieContourLoftCurves64 as Curves } from "../../../../packages/engine/src/geometry/curve/AutoMovieContourLoftCurves64.ts";
import type { IAutoMovieContourLoft64 as L } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { splitAutoMovieContourLeaf64 } from "../../../../packages/engine/src/geometry/curve/splitAutoMovieContourLeaf64.ts";
import { tessellateAutoMovieContourLoft64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourLoft64.ts";
import { contourStripOracle as O } from "../internal/contourStripOracle.ts";
import { nclose } from "../internal/nclose.ts";
import { throwsError } from "../internal/throwsError.ts";
import { contourLoftBoundaryOracle as B } from "./contourLoftBoundaryOracle";

const { rectangle, edges, aligned }: typeof B = B;

/**
 * Preserve source-restriction authority, prism area and shared middle-bank scenarios.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the original portable loft calls and their actual mesh, construction, phase and omission assertions in the same order.
 * @evidence contracts/testing.md#independent-expectations Original polynomial formulas, oriented identity-edge counts and dimensioned expectations remain unchanged; no implementation snapshot supplies an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves this extracted scenario group's original positive, malformed and boundary cases without dropping assertions.
 * @evidence contracts/testing.md#execution-ownership Called by the existing discoverable named test; direct portable imports start no process, browser, GPU or native build and register no dynamic tests.
 */
export function assertContourLoftBoundaryCore(): {
  sections: L.ISection[];
  input: L;
  mergeAligned: boolean[];
  mergeInserted: boolean[];
} {
  const coefficients: O.V[] = [0, 10, 0, 10].map((x: number): O.V => [x, 0, 0]);

  const coefficientSnapshot: O.V[] = coefficients.map(
    (point: O.V): O.V => [...point],
  );

  const leaf: Curves.Leaf = { net: coefficients, start: 0, end: 1, depth: 0 };

  const restriction: ReturnType<typeof splitAutoMovieContourLeaf64> =
    splitAutoMovieContourLeaf64(leaf, 0.25, 0.25);

  const childLeaves: Curves.Leaf[] = [
    ...restriction.before,
    ...restriction.after,
  ];

  TestValidator.predicate(
    "a source split evaluates the exact shared polynomial endpoint",
    nclose(restriction.point[0], 4.375, 0) &&
      nclose(restriction.point[1], 0, 0) &&
      nclose(restriction.point[2], 0, 0) &&
      [
        Curves.controls(restriction.before[restriction.before.length - 1]).at(
          -1,
        )!,
        Curves.controls(restriction.after[0])[0],
      ].every((point: O.V): boolean =>
        point.every((value: number, k: number): boolean =>
          nclose(value, restriction.point[k], 0),
        ),
      ),
  );

  TestValidator.predicate(
    "new child chords are repartitioned under the unchanged bound",
    childLeaves.length > 2 &&
      childLeaves.every((child: Curves.Leaf): boolean => {
        const net: O.V[] = Curves.controls(child),
          first: O.V = net[0],
          last: O.V = net[net.length - 1];
        const axis: O.V = [
          last[0] - first[0],
          last[1] - first[1],
          last[2] - first[2],
        ];
        const squared: number = axis.reduce(
          (sum: number, x: number): number => sum + x * x,
          0,
        );
        return net.every((point: O.V): boolean => {
          const projection: number =
            squared === 0
              ? 0
              : point.reduce(
                  (sum: number, value: number, k: number): number =>
                    sum + (value - first[k]) * axis[k],
                  0,
                ) / squared;
          const t: number = Math.min(1, Math.max(0, projection));
          const distance: number = Math.hypot(
            ...point.map(
              (value: number, k: number): number =>
                value - first[k] - t * axis[k],
            ),
          );
          return nclose(Math.max(0, distance - 0.25), 0, 0);
        });
      }),
  );

  TestValidator.predicate(
    "split source intervals retain ordered complete phase ownership",
    nclose(childLeaves[0].start, 0, 0) &&
      nclose(childLeaves[childLeaves.length - 1].end, 1, 0) &&
      nclose(restriction.before[restriction.before.length - 1].end, 0.25, 0) &&
      nclose(restriction.after[0].start, 0.25, 0) &&
      childLeaves.every(
        (child: Curves.Leaf, i: number): boolean =>
          child.start < child.end &&
          (i === 0 || nclose(childLeaves[i - 1].end, child.start, 0)),
      ),
  );

  TestValidator.predicate(
    "source splitting retains the limit on additional adaptive subdivision",
    throwsError(
      (): ReturnType<typeof splitAutoMovieContourLeaf64> =>
        splitAutoMovieContourLeaf64({ ...leaf, depth: 30 }, 0.25, 0.25),
    ),
  );

  const straight: O.V[] = [0, 1, 2, 3].map((x: number): O.V => [x, 0, 0]);

  for (const depth of [0, 29, 30, 31]) {
    const exact: ReturnType<typeof splitAutoMovieContourLeaf64> =
      splitAutoMovieContourLeaf64(
        { net: straight, start: 0, end: 1, depth },
        0.25,
        0.25,
      );
    TestValidator.predicate(
      "an already qualified exact restriction survives without resetting its ancestry",
      exact.before.length === 1 &&
        exact.after.length === 1 &&
        exact.before[0].depth === depth + 1 &&
        exact.after[0].depth === depth + 1 &&
        nclose(exact.point[0], 0.75, 0) &&
        Curves.controls(exact.before[0])[3].every(
          (x: number, k: number): boolean =>
            x === Curves.controls(exact.after[0])[0][k],
        ),
    );
  }

  TestValidator.predicate(
    "an unrepresentable compressed half path still refuses",
    throwsError((): Curves.Leaf[] =>
      Curves.partition(
        {
          original: [straight[0], straight[1], straight[2], straight[3]],
          path: 0,
          start: 0,
          end: 1,
          depth: 31,
        },
        0.25,
      ),
    ),
  );

  for (const phase of [0, 1, Number.NaN, Infinity])
    TestValidator.predicate(
      "an unresolved or noninterior split phase refuses",
      throwsError(
        (): ReturnType<typeof splitAutoMovieContourLeaf64> =>
          splitAutoMovieContourLeaf64(leaf, phase, 0.25),
        "strict interior",
      ),
    );

  TestValidator.predicate(
    "source splitting and refusal preserve caller coefficients",
    coefficients.every((point: O.V, i: number): boolean =>
      point.every((value: number, k: number): boolean =>
        nclose(value, coefficientSnapshot[i][k], 0),
      ),
    ),
  );

  const sections: L.ISection[] = [3, 5, 4].map(
    (count: number, i: number): L.ISection => ({
      coordinateMm: i * 2,
      loops: [
        {
          curve: O.curve(`ring-${i}`, O.polygon(count, i * 2, 2, 0.03 * i)),
          winding: 1,
        },
      ],
    }),
  );

  const intervals: L.IInterval[] = sections.slice(1).map(
    (section: L.ISection, i: number): L.IInterval => ({
      beforeMm: sections[i].coordinateMm,
      afterMm: section.coordinateMm,
      groups: [{ before: [0], after: [0], supported: true, reason: null }],
    }),
  );

  const input: L = { sections, events: [], intervals, chordToleranceMm: 0.25 };

  const result: L.IResult = tessellateAutoMovieContourLoft64(input);

  TestValidator.equals(
    "ordinary supported intervals resolve",
    result.unresolved,
    [],
  );

  TestValidator.equals(
    "one primitive range belongs to each interval",
    result.primitiveRanges!.length,
    2,
  );

  TestValidator.predicate(
    "ordinary construction retains exact source-phase meaning",
    aligned(result, sections),
  );

  const middle: L.IResult["construction"][number] = result.construction[1];

  const indices: number[] = middle.points.map((point: O.V): number => {
    const candidates: number[] = [];
    for (let i: number = 0; i < result.mesh.positions.length; i += 3)
      if (
        point.every((value: number, k: number): boolean =>
          nclose(value, result.mesh.positions[i + k], 0),
        )
      )
        candidates.push(i / 3);
    TestValidator.equals(
      "one physical middle knot uses one shared mesh index",
      candidates.length,
      1,
    );
    return candidates[0];
  });

  const incidence: ReturnType<typeof edges> = edges(result);

  TestValidator.predicate(
    "every middle-ring atomic edge is shared with opposite traversal",
    indices.every((id: number, i: number): boolean => {
      const record: { uses: number; orientation: number } | undefined =
        incidence.get(O.edge(id, indices[(i + 1) % indices.length]));
      return record?.uses === 2 && record.orientation === 0;
    }),
  );

  const mergeAligned: boolean[] = [],
    mergeInserted: boolean[] = [];

  for (const winding of [1, -1] as const) {
    const prismSections: L.ISection[] = [0, 3, 6].map(
      (y: number, i: number): L.ISection => {
        const curve: C.Cubic = O.curve(
          `prism-${i}`,
          rectangle(y, 0, 3, 1.5),
          [1, 2, 4, 8],
        );
        const spans: C.Span[] = curve.spans.flatMap(
          (span: C.Span): C.Span[] => {
            const halves: [O.V[], O.V[]] = S.split(
              span.map(
                (point: C.Vector): O.V => [point[0], point[1], point[2]],
              ),
              0.5,
            );
            return halves.map(
              (net: O.V[]): C.Span => [net[0], net[1], net[2], net[3]],
            );
          },
        );
        return {
          coordinateMm: y,
          loops: [
            {
              curve: {
                ...curve,
                spans,
                phaseIntervals: curve.phaseIntervals.flatMap(
                  (width: number): number[] => [width / 2, width / 2],
                ),
              },
              winding,
            },
          ],
        };
      },
    );
    const prism: L.IResult = tessellateAutoMovieContourLoft64({
      sections: prismSections,
      events: [],
      chordToleranceMm: 0.25,
    });
    const triangles: O.Triangle[] = [];
    for (let i: number = 0; i < prism.mesh.indices!.length; i += 3)
      triangles.push(
        prism.mesh
          .indices!.slice(i, i + 3)
          .map(
            (id: number): O.V =>
              prism.mesh.positions.slice(id * 3, id * 3 + 3) as O.V,
          ) as O.Triangle,
      );
    TestValidator.predicate(
      "exact restrictions preserve analytic prism area in square metres",
      nclose(
        O.area(triangles),
        2 * (6 + 3) * 6 * 1e-6,
        108e-6 * Number.EPSILON * 512,
      ),
    );
    TestValidator.predicate(
      "restricted nonuniform phase charts retain evaluated construction",
      aligned(prism, prismSections),
    );
  }

  for (const winding of [1, -1] as const) {
    const compositionSections: L.ISection[] = [
      {
        coordinateMm: 0,
        loops: [{ curve: O.curve("split-in", rectangle(0, 0, 4, 3)), winding }],
      },
      {
        coordinateMm: 2,
        loops: [
          { curve: O.curve("split-left", rectangle(2, -2, 1, 2)), winding },
          { curve: O.curve("split-right", rectangle(2, 2, 1, 1)), winding },
        ],
      },
      {
        coordinateMm: 4,
        loops: [
          { curve: O.curve("merge-out", rectangle(4, 0, 4, 3)), winding },
        ],
      },
    ];
    const composition: L.IResult = tessellateAutoMovieContourLoft64({
      sections: compositionSections,
      events: [
        {
          name: "split",
          coordinateMm: 1,
          beforeMm: 0,
          afterMm: 2,
          before: [0],
          after: [0, 1],
          kind: "saddle",
          regular: true,
          terminal: null,
        },
        {
          name: "merge",
          coordinateMm: 3,
          beforeMm: 2,
          afterMm: 4,
          before: [0, 1],
          after: [0],
          kind: "saddle",
          regular: true,
          terminal: null,
        },
      ],
      intervals: [
        {
          beforeMm: 0,
          afterMm: 2,
          groups: [
            { before: [0], after: [0, 1], supported: true, reason: null },
          ],
        },
        {
          beforeMm: 2,
          afterMm: 4,
          groups: [
            { before: [0, 1], after: [0], supported: true, reason: null },
          ],
        },
      ],
      chordToleranceMm: 0.25,
    });
    const compositionEdges: ReturnType<typeof edges> = edges(composition);
    let bankEdges: number = 0,
      badBankEdges: number = 0;
    for (const bank of composition.construction.slice(1, 3)) {
      const bankIds: number[] = bank.points.map((point: O.V): number => {
        const matching: number[] = [];
        for (let i: number = 0; i < composition.mesh.positions.length; i += 3)
          if (
            point.every((value: number, k: number): boolean =>
              nclose(value, composition.mesh.positions[i + k], 0),
            )
          )
            matching.push(i / 3);
        return matching.length === 1 ? matching[0] : -1;
      });
      for (let i: number = 0; i < bankIds.length; i++) {
        bankEdges++;
        const record: { uses: number; orientation: number } | undefined =
          compositionEdges.get(
            O.edge(bankIds[i], bankIds[(i + 1) % bankIds.length]),
          );
        if (
          bankIds[i] < 0 ||
          bankIds[(i + 1) % bankIds.length] < 0 ||
          record?.uses !== 2 ||
          record.orientation !== 0
        )
          badBankEdges++;
      }
    }
    const overfull: { edge: string; uses: number; orientation: number }[] = [
      ...compositionEdges,
    ]
      .filter(
        (entry: [string, { uses: number; orientation: number }]): boolean =>
          entry[1].uses > 2,
      )
      .map(
        ([edge, record]: [string, { uses: number; orientation: number }]): {
          edge: string;
          uses: number;
          orientation: number;
        } => ({ edge, ...record }),
      );
    console.log(
      JSON.stringify({
        schema: "generic-contour-composition-observation-v1",
        winding,
        finiteTriangles: composition.mesh.indices!.length / 3,
        rawBankEdges: bankEdges,
        badRawBankEdges: badBankEdges,
        overfull,
        stripsQualified: composition.stripObservations?.map(
          (
            record: NonNullable<L.IResult["stripObservations"]>[number],
          ): boolean => record.qualified,
        ),
      }),
    );
    TestValidator.predicate(
      "split/merge composition retains finite geometry and both shared contour banks",
      composition.mesh.indices!.length > 0 &&
        bankEdges > 0 &&
        badBankEdges === 0,
    );
    mergeAligned.push(aligned(composition, compositionSections));
  }
  return { sections, input, mergeAligned, mergeInserted };
}
