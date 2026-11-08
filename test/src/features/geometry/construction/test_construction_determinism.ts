import {
  type AutoMovieConstructionRealization,
  realizeAutoMovieConstruction,
} from "@automovie/engine";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * Realization is deterministic and free of absolute scale: the same tree
 * realizes to the same buffers bit for bit, and the same tree a thousand
 * times larger to the same triangles with every position a thousand times
 * the first.
 *
 * Scenarios:
 * 1. The four-part assembly realized twice: identical positions, indices and owner coordinates.
 * 2. The assembly at 0.001 times and at 1 times its size (a 0.03 mm beam and a 30 mm beam, chord tolerances scaled with it): the same indices, and every position of the larger within 1e-9 relative of a thousand times the smaller's.
 * 3. Red: the buffers of the assembly at two sizes read as identical fail, and positions read against a scale of 1001 fail.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the assembly twice at one size and once at each of two sizes, records named face-unavailability diagnostics and compares the original skin buffers. This distinguishes changed admission from ordering/covariance failures instead of letting a partial skin pass; original exact-index and relative-position checks remain unchanged.
 * @evidence contracts/development/testing.md#independent-expectations Determinism: a pure function gives equal outputs, compared with `Object.is` entry by entry. Scale: every construction length and the chord tolerance scale together, and the kernel states its tolerances are relative to each part's size, so the realized solid scales exactly up to rounding: positions within 1e-9 relative, the triangles identical.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the repeated and the scaled realizations. Negative: buffers of different sizes, and the wrong scale factor. Grouping belongs to `test_construction_nesting`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_determinism`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The four-part assembly realized twice: identical positions, indices and owner coordinates.).
 */
export function test_construction_determinism(): void {
  const failures: string[] = [];
  const realize: (
    k: number,
  ) => AutoMovieConstructionRealization.IRealization = (
    k: number,
  ): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction(
      { name: "made", root: ConstructionShapes.assembly(k, "left") },
      { chord: 1e-4 * k },
    );

  // 1. The same tree twice.
  const one: AutoMovieConstructionRealization.IRealization = realize(1);
  const two: AutoMovieConstructionRealization.IRealization = realize(1);
  for (const [name, a, b] of [
    ["positions", one.mesh.positions, two.mesh.positions],
    ["indices", one.mesh.indices, two.mesh.indices],
    ["coordinates", one.mesh.coordinates, two.mesh.coordinates],
  ] as [string, number[], number[]][])
    failures.push(
      ...ConstructionChecks.identical(a, b).map(
        (f: string): string => `twice, ${name}: ${f}`,
      ),
    );

  // 2. A thousand times smaller.
  const small: AutoMovieConstructionRealization.IRealization = realize(0.001);
  for (const [label, result] of [
    ["one", one],
    ["two", two],
    ["small", small],
  ] as [string, AutoMovieConstructionRealization.IRealization][]) {
    for (const diagnostic of result.diagnostics)
      if (diagnostic.contract === "face triangulation")
        failures.push(
          `${label}: unavailable face ${diagnostic.node}: ${diagnostic.detail}`,
        );
  }
  failures.push(
    ...ConstructionChecks.identical(small.mesh.indices, one.mesh.indices).map(
      (f: string): string => `scaled, indices: ${f}`,
    ),
  );
  const mismatch: number = small.mesh.indices.findIndex(
    (value: number, index: number): boolean =>
      value !== one.mesh.indices[index],
  );
  if (mismatch >= 0) {
    const triangle: number = Math.floor(mismatch / 3);
    failures.push(
      `scaled triangle ${triangle}: small ${indexContext(small, triangle)}; normal ${indexContext(one, triangle)}`,
    );
    failures.push(
      `scaled coordinate ordering: ${JSON.stringify(coordinateOrdering(small, one))}`,
    );
    failures.push(
      `scaled source records: ${JSON.stringify({
        small: sourceRecords(small),
        normal: sourceRecords(one),
      })}`,
    );
  }
  const scaled: (factor: number) => string[] = (factor: number): string[] => {
    for (
      let i: number = 0;
      i < Math.min(small.mesh.positions.length, one.mesh.positions.length);
      i++
    ) {
      const want: number = factor * small.mesh.positions[i]!;
      if (
        !(
          Math.abs(one.mesh.positions[i]! - want) <=
          1e-9 * Math.max(1e-3, Math.abs(want))
        )
      )
        return [
          `position entry ${i}: ${one.mesh.positions[i]} against ${want}`,
        ];
    }
    return small.mesh.positions.length === one.mesh.positions.length
      ? []
      : [
          `${small.mesh.positions.length} positions against ${one.mesh.positions.length}`,
        ];
  };
  failures.push(...scaled(1000).map((f: string): string => `scaled: ${f}`));

  // 3. Red.
  if (
    ConstructionChecks.identical(small.mesh.positions, one.mesh.positions)
      .length === 0
  )
    failures.push("proof: buffers of two sizes read identical");
  if (scaled(1001).length === 0)
    failures.push("proof: positions read at a scale of 1001");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} determinism failures:\n${failures.join("\n")}`,
    );
}

/** Record existing index/point/chart data at the first mismatch without inferring a face from a vertex's evaluator. */
function indexContext(
  result: AutoMovieConstructionRealization.IRealization,
  triangle: number,
): string {
  const vertices: number[] = result.mesh.indices.slice(
    3 * triangle,
    3 * triangle + 3,
  );
  return JSON.stringify({
    vertices,
    evaluatingOwners: vertices.map(
      (id: number): string | undefined =>
        result.mesh.owners[result.mesh.coordinates[3 * id]!],
    ),
    charts: vertices.map((id: number): number[] =>
      result.mesh.coordinates.slice(3 * id + 1, 3 * id + 3),
    ),
    positions: vertices.map((id: number): number[] =>
      result.mesh.positions.slice(3 * id, 3 * id + 3),
    ),
  });
}

/** Retain existing public boundary and output chart data without another surface evaluation or inferred face ownership. */
function sourceRecords(result: AutoMovieConstructionRealization.IRealization): {
  body: AutoMovieConstructionRealization.IRealization["body"];
  owners: string[];
  coordinates: number[];
} {
  return {
    body: result.body,
    owners: result.mesh.owners,
    coordinates: result.mesh.coordinates,
  };
}

/** Equality-group ranks are an observation of published owner charts, not a claim to identify each face's private ear walk. */
interface CoordinateOrdering {
  /** Published evaluator name; shared face charts remain in the separate body records. */
  owner: string;
  /** Station or phase component of the owner chart. */
  axis: 1 | 2;
  /** Distinct binary64 coordinate counts at the two sizes. */
  counts: [number, number];
  /** All same-ID rank differences, without coordinate snapping. */
  changes: {
    id: number;
    values: [number, number];
    ranks: [number | undefined, number | undefined];
  }[];
}

/** Compare exact equality-group ordering using only the already returned owner/chart arrays. */
function coordinateOrdering(
  left: AutoMovieConstructionRealization.IRealization,
  right: AutoMovieConstructionRealization.IRealization,
): CoordinateOrdering[] {
  const result: CoordinateOrdering[] = [];
  for (const owner of left.mesh.owners)
    for (const axis of [1, 2] as const) {
      const ids: number[] = [];
      for (let id: number = 0; 3 * id < left.mesh.coordinates.length; id++)
        if (
          left.mesh.owners[left.mesh.coordinates[3 * id]!] === owner &&
          right.mesh.owners[right.mesh.coordinates[3 * id]!] === owner
        )
          ids.push(id);
      const ranks: Map<number, number>[] = [left, right].map(
        (
          current: AutoMovieConstructionRealization.IRealization,
        ): Map<number, number> => {
          const values: number[] = [
            ...new Set(
              ids.map(
                (id: number): number =>
                  current.mesh.coordinates[3 * id + axis]!,
              ),
            ),
          ];
          values.sort((a: number, b: number): number => a - b);
          return new Map(
            values.map((value: number, rank: number): [number, number] => [
              value,
              rank,
            ]),
          );
        },
      );
      const changes: CoordinateOrdering["changes"] = [];
      for (const id of ids) {
        const a: number = left.mesh.coordinates[3 * id + axis]!;
        const b: number = right.mesh.coordinates[3 * id + axis]!;
        const ar: number | undefined = ranks[0]!.get(a);
        const br: number | undefined = ranks[1]!.get(b);
        if (ar !== br) changes.push({ id, values: [a, b], ranks: [ar, br] });
      }
      result.push({
        owner,
        axis,
        counts: [ranks[0]!.size, ranks[1]!.size],
        changes,
      });
    }
  return result;
}
