import {
  type AutoMovieConstructionRealization,
  AutoMovieViewAxis,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A view part's declared ring phases are the realized face's grid columns.
 *
 * Scenario: a tube of radius 20 mm along a horizontal course from station 0 to 100, 16 phases round it. Declared uniform (no `phases`),
 * its realized skin's vertices on the tube face stand at the 16 phases `2 pi k / 16`; declared as 16 phases clustered about 0 (every
 * eighth of a turn from 1 to 7 eighths at half the density of those near 0), they stand at exactly those phases. A list that does not
 * increase, or whose length is not `samples`, is refused by the loft with a diagnostic and the tree realizes no face.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes a real source leaf through realizeAutoMovieConstruction with its skin and reads each emitted vertex's own chart phase from the mesh's coordinates.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the declared list itself, and the uniform list for the part that declares none; a realization that ignores the declaration emits the uniform phases, which differ from the clustered ones at 14 of 16.
 * @evidence contracts/development/testing.md#distinguishing-cases A uniform part, a clustered one, a decreasing list and a list one short.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous CPU question on made parts; no person, viewer or timing claim.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (a view part's declared ring phases are the realized face's grid columns) as stated in this comment.
 */
export function test_construction_view_phases(): void {
  const failures: string[] = [];
  const uniform: number[] = Array.from({ length: 16 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 16);
  // Ten phases within 0.6 rad either side of 0, six over the rest of the turn.
  const clustered: number[] = [
    ...Array.from({ length: 6 }, (_: unknown, k: number): number => 0.1 * k),
    ...Array.from({ length: 6 }, (_: unknown, k: number): number => 0.6 + ((2 * Math.PI - 1.2) * (k + 0.5)) / 6),
    ...Array.from({ length: 4 }, (_: unknown, k: number): number => 2 * Math.PI - 0.4 + 0.1 * k),
  ];
  const cases: { name: string; phases: number[] | undefined; expected: number[] | null }[] = [
    { name: "uniform", phases: undefined, expected: uniform },
    { name: "clustered", phases: clustered, expected: clustered },
    { name: "decreasing", phases: [...clustered].reverse(), expected: null },
    { name: "short", phases: clustered.slice(1), expected: null },
  ];
  for (const { name, phases, expected } of cases) {
    const part: IAutoMovieViewPart = { ...tube(name), ...(phases === undefined ? {} : { phases }) };
    const realized: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction(
      { name: "phase-tree", root: { type: "source", name: part.name, source: part.name } },
      { chord: 1e-3, sources: new Map([[part.name, part]]) },
    );
    if (expected === null) {
      if (!realized.diagnostics.some((d: { detail: string }): boolean => d.detail.includes("ring phases")))
        failures.push(`${name}: the loft did not refuse the declared phases (${JSON.stringify(realized.diagnostics)})`);
      continue;
    }
    if (realized.diagnostics.length !== 0) failures.push(`${name}: ${JSON.stringify(realized.diagnostics)}`);
    // Every vertex's chart phase, reduced to one turn and rounded to 1e-9: the tube is the tree's one face.
    if (realized.mesh.owners.length !== 1) failures.push(`${name}: the skin has ${realized.mesh.owners.length} faces, not the tube's one`);
    const seen: Set<string> = new Set();
    for (let v: number = 0; v * 3 < realized.mesh.coordinates.length; ++v) {
      const phi: number = realized.mesh.coordinates[v * 3 + 2]!;
      seen.add((((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(9));
    }
    const want: Set<string> = new Set(expected.map((phi: number): string => (((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(9)));
    const missing: string[] = [...want].filter((p: string): boolean => !seen.has(p));
    const extra: string[] = [...seen].filter((p: string): boolean => !want.has(p));
    if (missing.length !== 0 || extra.length !== 0) failures.push(`${name}: the face's vertices miss phases ${missing.join(" ")} and stand at others ${extra.join(" ")}`);
  }
  TestValidator.predicate(failures.join("\n"), (): boolean => failures.length === 0);
}

/** A 20 mm tube on the horizontal course, open at both ends, 16 phases round. */
function tube(name: string): IAutoMovieViewPart {
  const outline = (sign: number): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "bottom", station: 0, value: 20 * sign },
      { site: "top", station: 100, value: 20 * sign },
    ],
  });
  return {
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
  };
}
