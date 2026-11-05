import { realizeAutoMovieConstruction, type AutoMovieConstructionRealization } from "@automovie/engine";

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
 * @evidence contracts/testing.md#behavioral-verification Realizes the assembly with `realizeAutoMovieConstruction` twice at one size and once at each of two sizes, and compares the skins' buffers. It catches hidden state between realizations (a cache keyed on something other than the tree, an order that depends on a map's insertion), and an absolute tolerance in the engine that changes the result at another size (a spline gap, a solve tolerance or a probe in metres rather than relative to the part); any realization that is a pure function of the tree, with tolerances relative to each part's size, passes.
 * @evidence contracts/testing.md#independent-expectations Determinism: a pure function gives equal outputs, compared with `Object.is` entry by entry. Scale: every construction length and the chord tolerance scale together, and the kernel states its tolerances are relative to each part's size, so the realized solid scales exactly up to rounding: positions within 1e-9 relative, the triangles identical.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the repeated and the scaled realizations. Negative: buffers of different sizes, and the wrong scale factor. Grouping belongs to `test_construction_nesting`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_determinism`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_determinism(): void {
  const failures: string[] = [];
  const realize: (k: number) => AutoMovieConstructionRealization.IRealization = (k: number): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root: ConstructionShapes.assembly(k, "left") }, { chord: 1e-4 * k });

  // 1. The same tree twice.
  const one: AutoMovieConstructionRealization.IRealization = realize(1);
  const two: AutoMovieConstructionRealization.IRealization = realize(1);
  for (const [name, a, b] of [
    ["positions", one.mesh.positions, two.mesh.positions],
    ["indices", one.mesh.indices, two.mesh.indices],
    ["coordinates", one.mesh.coordinates, two.mesh.coordinates],
  ] as [string, number[], number[]][])
    failures.push(...ConstructionChecks.identical(a, b).map((f: string): string => `twice, ${name}: ${f}`));

  // 2. A thousand times smaller.
  const small: AutoMovieConstructionRealization.IRealization = realize(0.001);
  failures.push(...ConstructionChecks.identical(small.mesh.indices, one.mesh.indices).map((f: string): string => `scaled, indices: ${f}`));
  const scaled: (factor: number) => string[] = (factor: number): string[] => {
    for (let i: number = 0; i < Math.min(small.mesh.positions.length, one.mesh.positions.length); i++) {
      const want: number = factor * small.mesh.positions[i]!;
      if (!(Math.abs(one.mesh.positions[i]! - want) <= 1e-9 * Math.max(1e-3, Math.abs(want)))) return [`position entry ${i}: ${one.mesh.positions[i]} against ${want}`];
    }
    return small.mesh.positions.length === one.mesh.positions.length ? [] : [`${small.mesh.positions.length} positions against ${one.mesh.positions.length}`];
  };
  failures.push(...scaled(1000).map((f: string): string => `scaled: ${f}`));

  // 3. Red.
  if (ConstructionChecks.identical(small.mesh.positions, one.mesh.positions).length === 0) failures.push("proof: buffers of two sizes read identical");
  if (scaled(1001).length === 0) failures.push("proof: positions read at a scale of 1001");
  if (failures.length !== 0) throw new Error(`${failures.length} determinism failures:\n${failures.join("\n")}`);
}
