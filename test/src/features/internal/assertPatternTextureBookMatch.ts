import {
  type IAutoMoviePatternPlacement,
  type IAutoMoviePatternPoint,
  type IAutoMoviePatternTextureTransform,
  type IAutoMoviePatternTexturing,
  type IAutoMovieSurfacePatternResult,
  type IAutoMovieSurfacePatternZone,
  autoMoviePatternTextureTransforms,
  generateAutoMovieSurfacePattern,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { pattern, rectangle, zone } from "./patternFixtures";
import { namedFacts, nclose } from "./predicates";

/** One slab per lattice column, flipped on the odd ones: a book match. */
const slabs: (flipOdd: boolean) => IAutoMovieSurfacePatternZone = (
  flipOdd: boolean,
): IAutoMovieSurfacePatternZone =>
  zone({
    id: "slab",
    region: rectangle(0, 0, 1.2, 1),
    origin: { u: 0, v: 0 },
    period: { u: 0.6, v: 2 },
    reach: { u: 0.61, v: 1.01 },
    material: "stone",
    generate: ({
      column,
      row,
      origin,
    }: {
      column: number;
      row: number;
      origin: IAutoMoviePatternPoint;
      period: { u: number; v: number };
    }): {
      id: string;
      center: { u: number; v: number };
      size: { u: number; v: number };
      rotationDeg: number;
      grainDeg: number;
      mirror: boolean;
    }[] =>
      row !== 0
        ? []
        : [
            {
              id: `s${column}`,
              center: { u: origin.u + 0.3, v: 0.5 },
              size: { u: 0.6, v: 1 },
              rotationDeg: 0,
              grainDeg: 0,
              mirror: flipOdd && column === 1,
            },
          ],
  });

/** Original texture scenarios 6 and 7, using the caller's independent UV oracle. */
export function assertPatternTextureBookMatch(
  sample: (
    transform: {
      offset: { x: number; y: number };
      scale: { x: number; y: number };
      rotationDeg: number;
    },
    u: number,
    v: number,
  ) => { x: number; y: number },
): void {
  const matched: IAutoMovieSurfacePatternResult =
    generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "book-match",
        zones: [slabs(true)],
        minimumPiece: 1,
        grainToleranceDeg: 0,
        adjacency: 0.01,
      }),
    });
  const book: IAutoMoviePatternTexturing = autoMoviePatternTextureTransforms({
    result: matched,
    tile: { u: 0.6, v: 1 },
    sheet: { kind: "module" },
  });
  const plain: IAutoMoviePatternTexturing = autoMoviePatternTextureTransforms({
    result: generateAutoMovieSurfacePattern({
      pattern: pattern({
        id: "unmatched",
        zones: [slabs(false)],
        minimumPiece: 1,
        grainToleranceDeg: 0,
        adjacency: 0.01,
      }),
    }),
    tile: { u: 0.6, v: 1 },
    sheet: { kind: "module" },
  });
  TestValidator.equals(
    "a book-matched slab reverses its own U axis and its twin does not",
    namedFacts([
      [
        "laid",
        (): boolean =>
          matched.placements
            .map((one: IAutoMoviePatternPlacement): string => one.module)
            .join() === "s0,s1",
      ],
      [
        "flagged",
        (): boolean =>
          matched.placements
            .map((one: IAutoMoviePatternPlacement): boolean => one.mirror)
            .join() === "false,true",
      ],
      [
        "left",
        (): boolean =>
          nclose(book.transforms[0]!.offset.x, 0, 1e-12) &&
          nclose(book.transforms[0]!.scale.x, 1, 1e-12),
      ],
      [
        "right",
        (): boolean =>
          nclose(book.transforms[1]!.offset.x, 1, 1e-12) &&
          nclose(book.transforms[1]!.scale.x, -1, 1e-12),
      ],
      [
        "reversed",
        (): boolean => {
          const near: { x: number; y: number } = sample(
            book.transforms[1]!,
            0,
            0.5,
          );
          const far: { x: number; y: number } = sample(
            book.transforms[1]!,
            1,
            0.5,
          );
          return nclose(near.x, 1, 1e-12) && nclose(far.x, 0, 1e-12);
        },
      ],
      [
        "unchangedV",
        (): boolean =>
          book.transforms.every(
            (one: IAutoMoviePatternTextureTransform): boolean =>
              nclose(one.offset.y, 0, 1e-12) &&
              nclose(one.scale.y, 1, 1e-12) &&
              nclose(one.rotationDeg, 0, 1e-12),
          ),
      ],
      [
        "twin",
        (): boolean =>
          plain.transforms.every(
            (one: IAutoMoviePatternTextureTransform): boolean =>
              nclose(one.offset.x, 0, 1e-12) && nclose(one.scale.x, 1, 1e-12),
          ),
      ],
    ]),
    {
      laid: true,
      flagged: true,
      left: true,
      right: true,
      reversed: true,
      unchangedV: true,
      twin: true,
    },
  );
  TestValidator.equals(
    "a mirror is not a grain turn, so the matched pair reports nothing",
    matched.findings.length,
    0,
  );
}
