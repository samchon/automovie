import {
  FamilyConicCaptureViews as Views,
} from "../../../reference-conics/FamilyConicCaptureViews";
import {
  FamilyConicOriginalCatalog as Original,
} from "../../../reference-conics/FamilyConicOriginalCatalog";
import type {
  NodeCanvasTypes as N,
} from "../../../reference-conics/render/NodeCanvasTypes";
import type {
  IAutoMovieLoftRelief as Relief,
  IAutoMovieViewPart as Part,
} from "@automovie/interface";

/**
 * Original source observations survive unavailable physical2 and individual source failures.
 *
 * Scenarios:
 * 1. Native whole views include front/left/top while legacy direction order remains unchanged.
 * 2. An asymmetric source uses its actual axis and touch-aware guides, with mm/rad/share retained.
 * 3. Original interpolation controls and feature height/shift nets remain the same objects.
 * 4. Failed factories and one invalid scalar remain named, while other original readings survive without physical2.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual new source/view boundaries with one small made source, never a person constructor, renderer, reference file or realization.
 * @evidence contracts/development/testing.md#independent-expectations Literal source origin10/s/2mm and extreme2mm plus touch0.25mm give the independently expected world guide12/s/2.25mm; required front/left/top and distinct unit labels come from the inspection contract.
 * @evidence contracts/development/testing.md#distinguishing-cases The valid asymmetric source accompanies a duplicate-station scalar, a throwing factory and an unavailable axis2.
 * @evidence contracts/development/testing.md#execution-ownership Exercises source definitions and view selection with no whole person, filesystem, solver or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Four scenarios distinguish original controls, evaluated points and unavailable later construction stages.
 */
export function test_human_capture_originals(): void {
  const failures: string[] = [];
  const check: (condition: boolean, name: string) => void = (
    condition: boolean,
    name: string,
  ): void => {
    if (!condition) failures.push(name);
  };
  const outline: (value: number) => Part.IOutline = (
    value: number,
  ): Part.IOutline => ({
    knots: [
      { site: "start", station: 0, value, jet: { first: 0, second: 0 } },
      { site: "end", station: 10, value, jet: { first: 0, second: 0 } },
    ],
  });
  let axis2Reads: number = 0;
  let factories: number = 0;
  const relief: Relief = {
    name: "made-net",
    stations: [0, 10],
    phases: [0, 1],
    axis: [1, 0, 0],
    rows: 7,
    columns: 7,
    heights: Array.from({ length: 49 }, (_: unknown, i: number): number =>
      i === 24 ? 0.2 : 0,
    ),
    shift: Array.from({ length: 49 }, (_: unknown, i: number): number =>
      i === 24 ? 1 : 0,
    ),
  };
  const piece: Part.ISplit = {
    u: outline(1),
    v: outline(1),
    angle: outline(0.2),
    shoulder: outline(0.6),
  };
  const part: Part = {
    name: "made",
    axis: {
      at: (s: number): ReturnType<Part["axis"]["at"]> => ({
        origin: [10, s, 2],
        u: [1, 0, 0],
        v: [0, 0, 1],
      }),
      jet: (): never => {
        axis2Reads++;
        throw new Error("physical2 unavailable");
      },
    },
    stations: [0, 10],
    front: { positive: outline(2), negative: outline(-1) },
    side: { positive: outline(3), negative: outline(-2) },
    fullness: {
      kind: "top",
      shoulders: [outline(0.5), outline(0.5), outline(0.5), outline(0.5)],
      touch: [outline(0.25), outline(0.5), outline(-0.25), outline(-0.5)],
      pieces: [[piece], [], [], []],
    },
    order: 16,
    samples: 32,
    reliefs: [relief],
  };
  const bad: Part = {
    ...part,
    name: "bad-outline",
    front: {
      ...part.front,
      negative: {
        knots: [
          { site: "one", station: 0, value: -1 },
          { site: "duplicate", station: 0, value: -2 },
        ],
      },
    },
  };
  const before: string = JSON.stringify(part);
  const entries: Original.IEntry[] = [
    {
      id: "made",
      role: "family-original",
      read: (): Part => {
        factories++;
        return part;
      },
    },
    {
      id: "bad-outline",
      role: "family-original",
      read: (): Part => {
        factories++;
        return bad;
      },
    },
    {
      id: "broken-factory",
      role: "family-original",
      read: (): never => {
        factories++;
        throw new Error("factory unavailable");
      },
    },
  ];
  const actual: Original.IResult = Original.create(entries);
  check(
    factories === 3,
    "all original factories must be observed exactly once",
  );
  const axis: N.Curve | undefined = actual.curves.find(
    (curve: N.Curve): boolean => curve.id === "made/axis",
  );
  check(
    axis?.points[0]?.every(
      (value: number, i: number): boolean =>
        Math.abs(value - [0.01, 0, 0.002][i]!) < 1e-14,
    ) === true,
    "actual source axis was replaced or absent",
  );
  const guide: N.Curve | undefined = actual.curves.find(
    (curve: N.Curve): boolean => curve.id === "made/guide/front.positive",
  );
  check(
    guide?.points[0]?.every(
      (value: number, i: number): boolean =>
        Math.abs(value - [0.012, 0, 0.00225][i]!) < 1e-14,
    ) === true,
    "front extreme must include the original transverse touch",
  );
  const front: Original.IScalar | undefined = actual.scalars.find(
    (scalar: Original.IScalar): boolean => scalar.id === "made/front.positive",
  );
  check(
    front?.definition === part.front.positive &&
      front?.readings[0]?.value === 2 &&
      front.unit === "mm",
    "original knots and values were lost or reconstructed",
  );
  check(
    actual.scalars.some(
      (scalar: Original.IScalar): boolean =>
        scalar.id === "made/fullness.pieces[0][0].angle" &&
        scalar.unit === "rad",
    ),
    "angle source is absent or uses length units",
  );
  check(
    actual.scalars.some(
      (scalar: Original.IScalar): boolean =>
        scalar.id === "made/fullness.shoulders[0]" && scalar.unit === "share",
    ),
    "fullness source is absent or uses length units",
  );
  check(
    actual.nets.some(
      (net: Original.INet): boolean =>
        net.owner === "made" &&
        net.definition === relief &&
        net.definition.shift === relief.shift,
    ),
    "height and station-shift control net identity was lost",
  );
  check(
    actual.unavailable.some(
      (row: { id: string; cause: string }): boolean =>
        row.id === "broken-factory",
    ),
    "missing factory must stay unavailable",
  );
  check(
    actual.scalars.some(
      (scalar: Original.IScalar): boolean =>
        scalar.id === "bad-outline/front.negative" &&
        scalar.definition === bad.front.negative &&
        scalar.cause !== null,
    ),
    "failed original scalar and its controls must survive",
  );
  check(
    axis2Reads === 0 && JSON.stringify(part) === before,
    "source-only must not request physical2 or mutate controls",
  );
  check(
    ["front", "left", "top"].every((view: string): boolean =>
      Views.whole(true).includes(view),
    ),
    "native whole three-pass plan lacks a required view",
  );
  check(
    Views.whole(false).join(",") ===
      "front,back,left,right,high-oblique,low-oblique",
    "legacy whole direction order changed",
  );
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
