import {
  type AutoMovieLoftFrame,
  AutoMovieViewLoft,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { HumanDebugReferenceCut } from "../../../../../packages/human/debug/compare/HumanDebugReferenceCut";
import { HumanDebugViewDeviation } from "../../../../../packages/human/debug/compare/HumanDebugViewDeviation";
import type { HumanDebugViewParts } from "../../../../../packages/human/debug/compare/HumanDebugViewParts";
import type { IHumanDebugReferencePack } from "../../../../../packages/human/debug/contracts/IHumanDebugReferencePack";

/**
 * A selected diagnostic keeps the whole request's row while excluding unrelated station work.
 *
 * Two unit-circle raw lofts stand 100 mm apart over matching 48-segment circles. Their touch
 * and sampled-ring distances are zero independently of the name selector. Empty selections,
 * absent raw lofts and missing reference support must remain unavailable, not zero-distance passes.
 *
 * @evidence contracts/testing.md#behavioral-verification Uses real ViewLoft, reference flattening and the diagnostic owner; checks full/scoped rows, actual query counts and complete/partial/unavailable coverage.
 * @evidence contracts/testing.md#independent-expectations Unit circles have radius one at every angle; the four cardinal points and 48 equal-angle ring points coincide with reference vertices. Selecting one of two two-station sources halves cuts and 52-query station groups without changing its row.
 * @evidence contracts/testing.md#distinguishing-cases Covers default whole scope, a single part, no match, a null raw loft, no reference support and a reference supporting only one of two stations. Source geometry/diagnostics remain unchanged; this proves no anatomical fit or hardware display.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU unit under --include human_debug_view_deviation, with analytic raw parts only; no person generation, file, slot, browser or GPU is started.
 */
export function test_human_debug_view_deviation(): void {
  const parts: HumanDebugViewParts.IPart[] = [0, 100].map(
    (offset: number, i: number): HumanDebugViewParts.IPart => {
      const line = (value: number): IAutoMovieViewPart.IOutline => ({
        knots: [0, 10].map(
          (station: number): IAutoMovieViewPart.IKnot => ({
            site: "s" + station,
            station,
            value,
          }),
        ),
      });
      const part: IAutoMovieViewPart = {
        name: i === 0 ? "a" : "b",
        axis: {
          at: (station: number): AutoMovieLoftFrame.IFrame => ({
            origin: [offset, station, 0],
            u: [1, 0, 0],
            v: [0, 0, 1],
          }),
        },
        stations: [0, 10],
        front: { positive: line(1), negative: line(-1) },
        side: { positive: line(1), negative: line(-1) },
        fullness: { kind: "shoulder", shoulder: line(Math.SQRT2 - 1) },
        order: 16,
        samples: 48,
      };
      return { name: part.name, part, loft: AutoMovieViewLoft.create(part) };
    },
  );
  const built: HumanDebugViewParts.IOutput = {
    parts,
    scale: 1,
    repeats: {},
    diagnostics: {
      body: parts.flatMap(
        (
          part: HumanDebugViewParts.IPart,
        ): NonNullable<typeof part.loft>["diagnostics"] =>
          part.loft!.diagnostics,
      ),
      head: [],
    },
    sourceRecords: [],
    observation: {
      stage: "source-definition",
      finalRealization: "not-run",
      treeParts: ["a", "b"],
      studies: [],
      definitionOnlyParts: [],
      unavailableParts: [],
    },
  };
  if (
    parts.some(
      (part: HumanDebugViewParts.IPart): boolean =>
        part.loft?.sections.length !== 2,
    )
  )
    throw new Error("The analytic two-station premise failed");
  const pack: IHumanDebugReferencePack = {
    id: "analytic",
    stature: 10,
    step: 1,
    regions: [
      {
        name: "head",
        sections: [0, 10].map(
          (y: number): IHumanDebugReferencePack.ISection => ({
            y,
            loops: [0, 100].map((offset: number): number[] =>
              Array.from({ length: 48 }, (_: unknown, i: number): number[] => [
                offset + Math.cos((2 * Math.PI * i) / 48),
                Math.sin((2 * Math.PI * i) / 48),
              ]).flat(),
            ),
          }),
        ),
      },
    ],
  };
  const before: string = JSON.stringify(built);
  const regions: HumanDebugReferenceCut.IRegion[] =
    HumanDebugReferenceCut.regions(pack);
  const whole: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    built,
    regions,
  );
  const selected: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    built,
    regions,
    ["a"],
  );
  const failures: string[] = [];
  if (
    whole.scope.status !== "complete" ||
    !whole.scope.allSourceParts ||
    whole.rows.length !== 2 ||
    whole.work.cutQueries !== 4 ||
    whole.work.distanceQueries !== 208
  )
    failures.push(
      "Whole diagnostic coverage or work count differs from four supported stations",
    );
  if (
    selected.scope.status !== "complete" ||
    selected.scope.allSourceParts ||
    selected.scope.parts.join(",") !== "a" ||
    selected.rows.length !== 1 ||
    selected.work.cutQueries !== 2 ||
    selected.work.distanceQueries !== 104
  )
    failures.push("Single-part selection still reads unrelated stations");
  if (
    JSON.stringify(selected.rows[0]) !==
    JSON.stringify(
      whole.rows.find(
        (row: HumanDebugViewDeviation.IRow): boolean => row.name === "a",
      ),
    )
  )
    failures.push("Selecting a part changed its diagnostic row");
  if (
    whole.rows.some(
      (row: HumanDebugViewDeviation.IRow): boolean =>
        row.touch.max > 1e-6 || row.ring.max > 1e-6,
    )
  )
    failures.push("Analytic coincident circle distances are nonzero");
  const empty: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    built,
    regions,
    ["missing"],
  );
  if (
    empty.scope.status !== "unavailable" ||
    !empty.scope.emptySelection ||
    empty.rows.length !== 0 ||
    empty.work.cutQueries !== 0
  )
    failures.push("An empty selection became complete or performed cuts");
  const unlofted: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    { ...built, parts: [{ ...parts[0]!, loft: null }] },
    regions,
    ["a"],
  );
  if (
    unlofted.scope.status !== "unavailable" ||
    unlofted.scope.unavailableParts.join(",") !== "a" ||
    unlofted.rows.length !== 0 ||
    unlofted.work.cutQueries !== 0
  )
    failures.push("A null raw loft became a zero-distance row");
  const absent: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    built,
    [],
    ["a"],
  );
  if (
    absent.scope.status !== "unavailable" ||
    absent.work.cutQueries !== 2 ||
    absent.work.distanceQueries !== 0 ||
    absent.rows[0]!.measuredStations !== 0
  )
    failures.push("Missing reference support became complete");
  const onePlane: IHumanDebugReferencePack = {
    ...pack,
    regions: [{ name: "head", sections: [pack.regions[0]!.sections[0]!] }],
  };
  // Stations 100 mm apart exceed the cut's maximum 24 mm half-slab.
  const line100: (value: number) => IAutoMovieViewPart.IOutline = (value: number): IAutoMovieViewPart.IOutline => ({
    knots: [0, 100].map(
      (station: number): IAutoMovieViewPart.IKnot => ({
        site: "s" + station,
        station,
        value,
      }),
    ),
  });
  const original: IAutoMovieViewPart | null = parts[0]!.part;
  if (original === null) throw new Error("The deviation fixture needs its actual complete original");
  const spaced: IAutoMovieViewPart = {
    ...original,
    stations: [0, 100],
    front: { positive: line100(1), negative: line100(-1) },
    side: { positive: line100(1), negative: line100(-1) },
    fullness: { kind: "shoulder", shoulder: line100(Math.SQRT2 - 1) },
  };
  const separated: HumanDebugViewParts.IOutput = {
    ...built,
    parts: [
      { name: "a", part: spaced, loft: AutoMovieViewLoft.create(spaced) },
    ],
  };
  const partial: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    separated,
    HumanDebugReferenceCut.regions(onePlane),
    ["a"],
  );
  if (
    partial.scope.status !== "partial" ||
    partial.scope.partiallyMeasuredParts.join(",") !== "a" ||
    partial.work.cutQueries !== 2 ||
    partial.work.distanceQueries !== 52
  )
    failures.push(
      "Partial reference support became complete or lost its work count",
    );
  if (JSON.stringify(built) !== before)
    failures.push("Selection mutated source geometry or diagnostics");
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
