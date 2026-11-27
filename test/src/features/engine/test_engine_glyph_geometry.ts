import { AutoMovieEngineTypography } from "@automovie/engine";
import { AutoMovieIngestFont } from "@automovie/ingest";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieFont,
  IAutoMovieFontGlyph,
  IAutoMovieFontSegment,
  IAutoMovieTessellation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * Glyph outlines flatten within their chord tolerance and triangulate to
 * exactly their ink.
 *
 * Scenarios:
 *
 * 1. A quadratic with |P0 − 2P1 + P2| = 0.03 m at a 0.05 mm tolerance takes
 *    ⌈√(0.03 / 0.0002)⌉ = 13 steps, and its arc departs from the chords by at
 *    most 0.03 / (4 × 169) m = 0.044 mm, measured at 1000 samples per step.
 * 2. The triangulated `O` at 1 m per em covers its flattened outer ring's area
 *    minus its hole's within 10⁻⁹ relative error, and lies within the
 *    flattening bound of the exact 0.25 m² of its arcs.
 * 3. The `+`, two crossing bars, is refused naming U+002B.
 * 4. Every triangle of "LO" faces `+z` with positive area, and every normal is
 *    `+z`.
 * 5. The same inputs give identical buffers on two runs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public flattening and text geometry and measures chord deviation and triangle area; it catches too few steps, a missing hole, a hole drawn as ink, flipped triangles and nondeterministic buffers.
 * @evidence contracts/development/testing.md#independent-expectations The step count and bound follow from the quadratic's constant second derivative, per #4098; the flattened-ring area is a shoelace sum independent of the triangulator, and the exact O area is the closed form of its arcs, 0.35 − 0.10 m².
 * @evidence contracts/development/testing.md#distinguishing-cases A curved segment, a glyph with a hole, a glyph with crossing contours and a two-glyph run. Layout is owned by test_engine_text_layout and extrusion by test_engine_raised_lettering.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test over a font written and decoded in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the geometry and the expected result.
 */
export function test_engine_glyph_geometry(): void {
  // 1. Flattening bound.
  const p0: AutoMovieVector2Tuple = [0, 0];
  const p1: AutoMovieVector2Tuple = [0.1, 0.015];
  const p2: AutoMovieVector2Tuple = [0.2, 0];
  const tolerance: number = 0.00005;
  const chords: AutoMovieVector2Tuple[] = AutoMovieEngineTypography.flattenQuadratic(
    p0,
    p1,
    p2,
    tolerance,
  );
  TestValidator.equals("13 steps", chords.length - 1, 13);
  const bound: number = 0.03 / (4 * 169);
  let worst: number = 0;
  for (let step: number = 0; step < 13; ++step)
    for (let sample: number = 0; sample <= 1000; ++sample) {
      const t: number = (step + sample / 1000) / 13;
      const u: number = 1 - t;
      const point: AutoMovieVector2Tuple = [
        u * u * p0[0] + 2 * t * u * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * t * u * p1[1] + t * t * p2[1],
      ];
      worst = Math.max(
        worst,
        distanceToSegment(point, chords[step]!, chords[step + 1]!),
      );
    }
  TestValidator.predicate(
    "chord deviation within 0.044 mm",
    worst <= bound + 1e-15 && worst > 0.9 * bound,
  );

  // 2. The O covers outer minus hole.
  const font: IAutoMovieFont = AutoMovieIngestFont.decode(
    syntheticTrueTypeFont(),
  );
  const build: (text: string) => IAutoMovieTessellation = (
    text: string,
  ): IAutoMovieTessellation =>
    AutoMovieEngineTypography.buildTextGeometry({
      font,
      text,
      size: 1,
      box: { width: 2, height: 1 },
    });
  const o: IAutoMovieTessellation = build("O");
  const glyph: IAutoMovieFontGlyph = font.glyphs.find(
    (g: IAutoMovieFontGlyph): boolean => g.codePoint === 0x4f,
  )!;
  const rings: number[] = glyph.contours.map(
    (contour: IAutoMovieFontSegment[]): number => {
      const ring: AutoMovieVector2Tuple[] = contour.flatMap(
        (s: IAutoMovieFontSegment): AutoMovieVector2Tuple[] =>
          AutoMovieEngineTypography.flattenQuadratic(
            [s.start[0] / 1000, s.start[1] / 1000],
            [s.control[0] / 1000, s.control[1] / 1000],
            [s.end[0] / 1000, s.end[1] / 1000],
            tolerance,
          ).slice(0, -1),
      );
      return Math.abs(shoelace(ring));
    },
  );
  const covered: number = triangleAreas(o).reduce(
    (a: number, b: number): number => a + b,
    0,
  );
  TestValidator.predicate(
    "O covers outer minus hole",
    Math.abs(covered - (rings[0]! - rings[1]!)) <= 1e-9 * covered,
  );
  TestValidator.predicate(
    "O within the flattening bound of its exact area",
    nclose(covered, 0.25, (2.6 + 1.4) * tolerance),
  );

  // 3. Crossing contours.
  TestValidator.predicate(
    "crossing contours are refused by code point",
    throwsError((): unknown => build("+"), ["U+002B", "touch or cross"]),
  );

  // 4. Facing.
  const lo: IAutoMovieTessellation = build("LO");
  TestValidator.predicate(
    "every triangle faces +z",
    triangleAreas(lo).every((a: number): boolean => a > 0),
  );
  TestValidator.predicate(
    "every normal is +z",
    lo.normals.every(
      (n: number, i: number): boolean => n === (i % 3 === 2 ? 1 : 0),
    ),
  );

  // 5. Determinism.
  const again: IAutoMovieTessellation = build("LO");
  TestValidator.predicate(
    "identical buffers",
    same(lo.positions, again.positions) &&
      same(lo.indices, again.indices) &&
      same(lo.normals, again.normals),
  );
}

/** Distance from a point to a closed segment. */
function distanceToSegment(
  p: AutoMovieVector2Tuple,
  a: AutoMovieVector2Tuple,
  b: AutoMovieVector2Tuple,
): number {
  const dx: number = b[0] - a[0];
  const dy: number = b[1] - a[1];
  const t: number = Math.max(
    0,
    Math.min(
      1,
      ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

/** Signed shoelace area of a closed ring. */
function shoelace(ring: AutoMovieVector2Tuple[]): number {
  let twice: number = 0;
  for (let i: number = 0; i < ring.length; ++i) {
    const a: AutoMovieVector2Tuple = ring[i]!;
    const b: AutoMovieVector2Tuple = ring[(i + 1) % ring.length]!;
    twice += a[0] * b[1] - b[0] * a[1];
  }
  return twice / 2;
}

/** Signed XY area of each triangle of a mesh. */
function triangleAreas(mesh: IAutoMovieTessellation): number[] {
  const areas: number[] = [];
  const p: number[] = mesh.positions;
  for (let at: number = 0; at < mesh.indices.length; at += 3) {
    const [a, b, c]: [number, number, number] = [
      mesh.indices[at]! * 3,
      mesh.indices[at + 1]! * 3,
      mesh.indices[at + 2]! * 3,
    ];
    areas.push(
      ((p[b]! - p[a]!) * (p[c + 1]! - p[a + 1]!) -
        (p[b + 1]! - p[a + 1]!) * (p[c]! - p[a]!)) /
        2,
    );
  }
  return areas;
}

/** Bitwise equality of two number lists. */
function same(a: readonly number[], b: readonly number[]): boolean {
  return (
    a.length === b.length &&
    a.every((v: number, i: number): boolean => Object.is(v, b[i]))
  );
}
