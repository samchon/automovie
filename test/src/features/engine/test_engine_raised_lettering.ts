import { buildAutoMovieRaisedLettering } from "@automovie/engine";
import { AutoMovieIngestFont } from "@automovie/ingest";
import type { IAutoMovieFont, IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * Raised lettering is a closed solid per letter whose volume is its ink area
 * times its depth, rising from the face.
 *
 * Scenarios:
 *
 * 1. The extruded `L` at 1 m per em and 0.01 m deep has volume 0.1 m² × 0.01 m =
 *    0.001 m³, the area its six written corners enclose times the depth, within
 *    10⁻⁹ relative error.
 * 2. Its z extent runs from 0 to the depth.
 * 3. A zero depth is refused.
 * 4. The same inputs give identical buffers on two runs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the lettering through the public engine function and measures its divergence-theorem volume and z range; it catches an open or inward mesh, a wrong depth, a letter not lifted onto the face and nondeterministic buffers.
 * @evidence contracts/development/testing.md#independent-expectations The L's area is 100 000 font units² from its written corners, so the prism volume is that area times the depth, per #4098's acceptance.
 * @evidence contracts/development/testing.md#distinguishing-cases A positive depth beside a zero depth, and a straight-edged glyph whose area is exact. Flat geometry is owned by test_engine_glyph_geometry.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test over a font written and decoded in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the expected result.
 */
export function test_engine_raised_lettering(): void {
  const font: IAutoMovieFont = AutoMovieIngestFont.decode(
    syntheticTrueTypeFont(),
  );
  const raise: (depth: number) => IAutoMovieMesh = (
    depth: number,
  ): IAutoMovieMesh =>
    buildAutoMovieRaisedLettering({
      font,
      text: "L",
      size: 1,
      box: { width: 1, height: 1 },
      depth,
    });
  const mesh: IAutoMovieMesh = raise(0.01);

  // 1. Volume by the divergence theorem.
  let volume: number = 0;
  const p: number[] = mesh.positions;
  const indices: number[] = mesh.indices!;
  for (let at: number = 0; at < indices.length; at += 3) {
    const [a, b, c]: [number, number, number] = [
      indices[at]! * 3,
      indices[at + 1]! * 3,
      indices[at + 2]! * 3,
    ];
    volume +=
      (p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) -
        p[a + 1]! * (p[b]! * p[c + 2]! - p[b + 2]! * p[c]!) +
        p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!)) /
      6;
  }
  TestValidator.predicate(
    "volume is area times depth",
    nclose(volume, 0.001, 1e-12),
  );

  // 2. Rises from the face.
  const zs: number[] = p.filter((_: number, i: number): boolean => i % 3 === 2);
  TestValidator.predicate(
    "z spans 0 to the depth",
    nclose(Math.min(...zs), 0, 1e-15) && nclose(Math.max(...zs), 0.01, 1e-15),
  );

  // 3. Depth refusal.
  TestValidator.predicate(
    "zero depth refuses",
    throwsError((): unknown => raise(0), "depth"),
  );

  // 4. Determinism.
  const again: IAutoMovieMesh = raise(0.01);
  TestValidator.predicate(
    "identical buffers",
    again.positions.length === p.length &&
      again.positions.every((v: number, i: number): boolean =>
        Object.is(v, p[i]),
      ) &&
      again.indices!.every((v: number, i: number): boolean =>
        Object.is(v, indices[i]),
      ),
  );
}
