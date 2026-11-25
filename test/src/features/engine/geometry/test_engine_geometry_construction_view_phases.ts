import {
  AutoMovieViewAxis,
  AutoMovieViewSection,
  compareCodeUnits,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A view part's declared ring phases (`IAutoMovieViewPart.phases`) are the
 * realized face's grid columns; a list that does not increase, or whose length
 * is not `samples`, is refused by the loft.
 *
 * Fixture: a tube of radius 20 mm along a horizontal course from station 0 to
 * 100, 16 phases round it, realized as a source leaf with its skin at a 1e-3
 * chord.
 *
 * Scenarios:
 *
 * 1. Declared none: the skin's vertex phases are the 16 phases 2 pi k / 16.
 * 2. Declared 16 phases clustered about 0 (ten within 0.6 rad of it): the vertex
 *    phases are exactly those, which differ from the uniform ones at 14 of 16.
 * 3. The clustered list reversed, and one short: a diagnostic naming the "ring
 *    phases".
 */
export function test_engine_geometry_construction_view_phases(): void {
  const outline = (sign: number): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "bottom", station: 0, value: 20 * sign },
      { site: "top", station: 100, value: 20 * sign },
    ],
  });
  const realize = (
    name: string,
    phases: number[] | undefined,
  ): IAutoMovieConstructionRealization.IRealization => {
    const part: IAutoMovieViewPart = {
      name: "phase-tube-" + name,
      axis: AutoMovieViewAxis.horizontal(),
      stations: [0, 25, 50, 75, 100],
      front: { positive: outline(1), negative: outline(-1) },
      side: { positive: outline(1), negative: outline(-1) },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [
            { site: "bottom", station: 0, value: AutoMovieViewSection.ELLIPSE },
            { site: "top", station: 100, value: AutoMovieViewSection.ELLIPSE },
          ],
        },
      },
      order: 16,
      samples: 16,
      ...(phases === undefined ? {} : { phases }),
    };
    return realizeAutoMovieConstruction(
      {
        name: "phase-tree",
        root: { type: "source", name: part.name, source: part.name },
      },
      { chord: 1e-3, sources: new Map([[part.name, part]]) },
    );
  };
  const turn = (phi: number): string =>
    (((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(9);
  const columns = (
    label: string,
    phases: number[] | undefined,
    expected: number[],
  ): void => {
    const real: IAutoMovieConstructionRealization.IRealization = realize(
      label,
      phases,
    );
    TestValidator.equals(`${label} diagnostics`, real.diagnostics, []);
    TestValidator.equals(`${label} one face`, real.mesh.owners.length, 1);
    const seen: Set<string> = new Set();
    for (let v: number = 2; v < real.mesh.coordinates.length; v += 3)
      seen.add(turn(real.mesh.coordinates[v]!));
    TestValidator.equals(
      `${label} phases`,
      [...seen].sort(compareCodeUnits),
      [...new Set(expected.map(turn))].sort(compareCodeUnits),
    );
  };
  const clustered: number[] = [
    ...Array.from({ length: 6 }, (_: unknown, k: number): number => 0.1 * k),
    ...Array.from(
      { length: 6 },
      (_: unknown, k: number): number =>
        0.6 + ((2 * Math.PI - 1.2) * (k + 0.5)) / 6,
    ),
    ...Array.from(
      { length: 4 },
      (_: unknown, k: number): number => 2 * Math.PI - 0.4 + 0.1 * k,
    ),
  ];

  // 1.
  columns(
    "uniform",
    undefined,
    Array.from(
      { length: 16 },
      (_: unknown, k: number): number => (2 * Math.PI * k) / 16,
    ),
  );

  // 2.
  columns("clustered", clustered, clustered);

  // 3.
  for (const [label, phases] of [
    ["decreasing", [...clustered].reverse()],
    ["short", clustered.slice(1)],
  ] satisfies [string, number[]][])
    TestValidator.predicate(
      `${label} refused`,
      realize(label, phases).diagnostics.some(
        (d: { detail: string }): boolean => d.detail.includes("ring phases"),
      ),
    );
}
