import {
  type AutoMovieConstructionRealization,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type { IAutoMovieConstructionFill } from "@automovie/interface";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A construction's fills fair the drawn skin about their datum points (`IAutoMovieConstruction.fills`).
 *
 * Scenarios:
 * 1. The merged assembly with a fill of radius 5 mm at one of its own skin vertices: no diagnostic, the same indices, some vertex moved, and every moved vertex within three radii of the point.
 * 2. The same assembly with a fill whose point stands 0.1 m off the skin: one `fill` diagnostic and the skin of the plain assembly, unchanged.
 * 3. Red: before fills were read, scenario 1 moved no vertex and scenario 2 recorded no diagnostic.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the assembly with `realizeAutoMovieConstruction` with and without fills and compares the published skins vertex by vertex.
 * @evidence contracts/development/testing.md#independent-expectations A fill is local by its declaration: the fairing moves only vertices within its disc and two rings, all inside three radii, and changes no index; a point off the skin is refused by the declaration's own rule.
 * @evidence contracts/development/testing.md#distinguishing-cases A fill on the skin, a fill off it, and the plain assembly as the reference.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_fill`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios and what each pins.
 */
export function test_construction_fill(): void {
  const failures: string[] = [];
  const realize = (fills: IAutoMovieConstructionFill[]): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made.fill", root: ConstructionShapes.assembly(1, "left"), fills }, { chord: 1e-4 });
  const plain: AutoMovieConstructionRealization.IRealization = realize([]);
  const p: number[] = plain.mesh.positions;
  const v: number = Math.floor(p.length / 6);
  const point: [number, number, number] = [p[3 * v]!, p[3 * v + 1]!, p[3 * v + 2]!];
  const radius: number = 0.005;

  // 1. A fill on the skin.
  const filled: AutoMovieConstructionRealization.IRealization = realize([{ point, radius }]);
  if (filled.diagnostics.length !== 0) failures.push(`fill on the skin: diagnostics ${ConstructionRead.diagnostics(filled)}`);
  if (filled.mesh.indices.length !== plain.mesh.indices.length || filled.mesh.indices.some((x: number, k: number): boolean => x !== plain.mesh.indices[k])) failures.push("fill on the skin: the indices changed");
  let moved: number = 0;
  for (let k: number = 0; 3 * k < p.length; k++) {
    const d: number = Math.hypot(filled.mesh.positions[3 * k]! - p[3 * k]!, filled.mesh.positions[3 * k + 1]! - p[3 * k + 1]!, filled.mesh.positions[3 * k + 2]! - p[3 * k + 2]!);
    if (!(d > 0)) continue;
    ++moved;
    const far: number = Math.hypot(p[3 * k]! - point[0], p[3 * k + 1]! - point[1], p[3 * k + 2]! - point[2]);
    if (!(far <= 3 * radius)) failures.push(`fill on the skin: vertex ${k} ${far} m from the point moved by ${d}`);
  }
  if (moved === 0) failures.push("fill on the skin: no vertex moved");

  // 2. A fill off the skin.
  const off: AutoMovieConstructionRealization.IRealization = realize([{ point: [point[0] + 0.1, point[1], point[2]], radius }]);
  if (off.diagnostics.length !== 1 || off.diagnostics[0]!.contract !== "fill") failures.push(`fill off the skin: diagnostics ${ConstructionRead.diagnostics(off)}, expected one fill`);
  if (off.mesh.positions.some((x: number, k: number): boolean => x !== p[k])) failures.push("fill off the skin: the skin changed");

  if (failures.length !== 0) throw new Error(`${failures.length} fill failures:\n${failures.slice(0, 20).join("\n")}`);
}
