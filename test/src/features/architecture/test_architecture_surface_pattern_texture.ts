import {
  type IAutoMoviePatternPlacement,
  type IAutoMoviePatternPoint,
  type IAutoMoviePatternTextureTransform,
  type IAutoMoviePatternTexturing,
  type IAutoMovieSurfacePatternResult,
  autoMoviePatternTextureTransforms,
  generateAutoMovieSurfacePattern,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { assertPatternTextureBookMatch } from "../internal/assertPatternTextureBookMatch";
import {
  pattern,
  rectangle,
  stackBond,
  zone,
} from "../internal/patternFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The sheet point a piece's own unit UV lands on.
 *
 * The viewer hands `offset`, `scale`, and `rotationDeg` to Three's texture
 * matrix, giving `diag(scale) · R(-rotation) · uv + offset` at zero centre.
 * Writing it out
 * here is what keeps these cases an independent check of the arithmetic rather
 * than a restatement of it.
 */
const sample: (
  transform: {
    offset: { x: number; y: number };
    scale: { x: number; y: number };
    rotationDeg: number;
  },
  u: number,
  v: number,
) => { x: number; y: number } = (
  transform: {
    offset: { x: number; y: number };
    scale: { x: number; y: number };
    rotationDeg: number;
  },
  u: number,
  v: number,
): { x: number; y: number } => {
  const angle: number = (-transform.rotationDeg * Math.PI) / 180;
  const cosine: number = Math.cos(angle);
  const sine: number = Math.sin(angle);
  return {
    x: transform.scale.x * (cosine * u - sine * v) + transform.offset.x,
    y: transform.scale.y * (sine * u + cosine * v) + transform.offset.y,
  };
};

/**
 * Laid pieces sample their material through the UV transform the PBR record
 * already carries.
 *
 * This case checks material `offset` / `scale` / `rotationDeg` records against
 * an independent UV matrix expression, including mirrored sampling endpoints.
 *
 * The default field is a 2 x 1 m rectangle of eight 0.5 m squares.
 *
 * Scenarios:
 *
 * 1. A sheet pinned to the module gives every piece the same image: the identity
 *    transform, once the texture turn is the module's own size.
 * 2. A sheet pinned to the face cuts every piece out of one image, so where a
 *    piece sits decides what it shows: the first square takes a quarter by a
 *    half at the origin, the last takes the far corner, and the eight of them
 *    walk the sheet once.
 * 3. Turning the grain turns the sheet the pieces are cut out of, so a field laid
 *    across a face sheet reads its offsets in the sheet's own axes rather than
 *    the face's; the straight twin of the same field does not turn at all.
 * 4. A piece flipped on a face sheet keeps the span it was cut from and swaps its
 *    two ends, which is what a mirror is: the same image, run the other way.
 * 5. A boundary cut leaves the transform alone: a piece cut in half samples the
 *    half of the sheet its whole module covered, because its mesh UV is its
 *    place in that module rather than in the sliver that survived.
 * 6. A mirrored piece reverses its own U axis: the scale goes negative and the
 *    offset moves to the far edge, so the image runs back the way it came. The
 *    unflipped twin of the same pair does not.
 * 7. The mirror is not a grain turn: a book-matched pair whose grain runs one way
 *    reports no grain break at a zero-degree tolerance.
 * 8. Grain rotates the sheet under the piece rather than the piece: a square laid
 *    square with its grain at 45 degrees samples a rotated image whose centre
 *    is still the piece's centre.
 * 9. A long piece turned off its grain by something other than a right angle needs
 *    a shear the transform has no term for and is reported by id, while a
 *    square piece at the same angle samples exactly.
 * 10. A non-positive texture turn and a non-finite sheet origin are refused.
 * 11. The same run transformed twice preserves structure and numeric components.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates square/slab/rotated-piece patterns and calls autoMoviePatternTextureTransforms for module/face sheets, inspecting identities, offsets/scales/turns, independently sampled UV endpoints/centres, retained cut-piece mappings, mirrored grain policy, shear partition, input refusals and replay.
 * @evidence contracts/testing.md#independent-expectations The zero-centre texture matrix diag(scale) times R(-rotation) supplies a separate sampling oracle, confirmed against the viewer binding and Three Matrix3.setUvTransform. Literal quarter-by-half face spans, 0.6-by-one slabs, mirrored endpoint swaps, centred 45-degree square sampling and fixed skewed-piece ids/dimensions anchor the expected records.
 * @evidence contracts/testing.md#distinguishing-cases Module versus face anchoring, straight versus 90/45-degree grain, flipped/unflipped twins, whole/boundary-cut mappings and non-square versus square off-grain pieces distinguish coordinate, mirror and shear policies. Zero/NaN tile values and infinite face origin must retain the stated refusal cause; replay uses the existing structural numeric comparator.
 * @evidence contracts/testing.md#execution-ownership Uses local generated declarations and synchronous numerical UV records/oracles without texture loading, rendering, resources, clocks, global replacement or an added host. Independent UV arithmetic and selected cases do not certify rendered book matching, cut-mesh UV authoring or every near-shear numerical boundary.
 */
export function test_architecture_surface_pattern_texture(): void {
  const field: IAutoMovieSurfacePatternResult = generateAutoMovieSurfacePattern(
    { pattern: pattern() },
  );
  const perModule: IAutoMoviePatternTexturing =
    autoMoviePatternTextureTransforms({
      result: field,
      tile: { u: 0.5, v: 0.5 },
      sheet: { kind: "module" },
    });

  TestValidator.equals(
    "a sheet pinned to the module shows every piece the same image",
    namedFacts([
      ["count", (): boolean => perModule.transforms.length === 8],
      ["sheared", (): boolean => perModule.sheared.length === 0],
      [
        "ids",
        (): boolean =>
          perModule.transforms
            .map((one: IAutoMoviePatternTextureTransform): string => one.id)
            .join() ===
          field.placements
            .map((one: IAutoMoviePatternPlacement): string => one.id)
            .join(),
      ],
      [
        "identity",
        (): boolean =>
          perModule.transforms.every(
            (one: IAutoMoviePatternTextureTransform): boolean =>
              nclose(one.offset.x, 0, 1e-12) &&
              nclose(one.offset.y, 0, 1e-12) &&
              nclose(one.scale.x, 1, 1e-12) &&
              nclose(one.scale.y, 1, 1e-12) &&
              nclose(one.rotationDeg, 0, 1e-12),
          ),
      ],
    ]),
    { count: true, sheared: true, ids: true, identity: true },
  );

  const perFace: IAutoMoviePatternTexturing = autoMoviePatternTextureTransforms(
    {
      result: field,
      tile: { u: 2, v: 1 },
      sheet: { kind: "face", origin: { u: 0, v: 0 } },
    },
  );
  TestValidator.equals(
    "a sheet pinned to the face cuts each piece out of one image",
    namedFacts([
      [
        "scale",
        (): boolean =>
          perFace.transforms.every(
            (one: IAutoMoviePatternTextureTransform): boolean =>
              nclose(one.scale.x, 0.25, 1e-12) &&
              nclose(one.scale.y, 0.5, 1e-12) &&
              nclose(one.rotationDeg, 0, 1e-12),
          ),
      ],
      [
        "walk",
        (): boolean =>
          test12ValuesClose(
            perFace.transforms.map(
              (
                one: IAutoMoviePatternTextureTransform,
              ): { x: number; y: number } => one.offset,
            ),
            [
              { x: 0, y: 0 },
              { x: 0.25, y: 0 },
              { x: 0.5, y: 0 },
              { x: 0.75, y: 0 },
              { x: 0, y: 0.5 },
              { x: 0.25, y: 0.5 },
              { x: 0.5, y: 0.5 },
              { x: 0.75, y: 0.5 },
            ],
          ),
      ],
      [
        "first",
        (): boolean => {
          const low: { x: number; y: number } = sample(
            perFace.transforms[0]!,
            0,
            0,
          );
          const high: { x: number; y: number } = sample(
            perFace.transforms[0]!,
            1,
            1,
          );
          return (
            nclose(low.x, 0, 1e-12) &&
            nclose(low.y, 0, 1e-12) &&
            nclose(high.x, 0.25, 1e-12) &&
            nclose(high.y, 0.5, 1e-12)
          );
        },
      ],
      [
        "last",
        (): boolean => {
          const high: { x: number; y: number } = sample(
            perFace.transforms[7]!,
            1,
            1,
          );
          return nclose(high.x, 1, 1e-12) && nclose(high.y, 1, 1e-12);
        },
      ],
    ]),
    { scale: true, walk: true, first: true, last: true },
  );

  const acrossSheet: IAutoMoviePatternTexturing =
    autoMoviePatternTextureTransforms({
      result: generateAutoMovieSurfacePattern({
        pattern: pattern({
          id: "across-grain",
          zones: [zone({ generate: stackBond(0.5, 90) })],
        }),
      }),
      tile: { u: 2, v: 1 },
      sheet: { kind: "face", origin: { u: 0, v: 0 } },
    });
  TestValidator.equals(
    "a sheet turned by the grain is read in the sheet's own axes",
    namedFacts([
      [
        "turnedBack",
        (): boolean =>
          nclose(acrossSheet.transforms[0]!.rotationDeg, 90, 1e-12) &&
          nclose(acrossSheet.transforms[0]!.scale.x, 0.25, 1e-12) &&
          nclose(acrossSheet.transforms[0]!.scale.y, 0.5, 1e-12),
      ],
      [
        "corner",
        (): boolean => {
          const low: { x: number; y: number } = sample(
            acrossSheet.transforms[0]!,
            0,
            0,
          );
          const high: { x: number; y: number } = sample(
            acrossSheet.transforms[0]!,
            1,
            1,
          );
          return (
            nclose(low.x, 0, 1e-12) &&
            nclose(low.y, 0, 1e-12) &&
            nclose(high.x, 0.25, 1e-12) &&
            nclose(high.y, -0.5, 1e-12)
          );
        },
      ],
      [
        "straightTwin",
        (): boolean => nclose(perFace.transforms[0]!.rotationDeg, 0, 1e-12),
      ],
    ]),
    { turnedBack: true, corner: true, straightTwin: true },
  );

  const flippedField: IAutoMoviePatternTexturing =
    autoMoviePatternTextureTransforms({
      result: generateAutoMovieSurfacePattern({
        pattern: pattern({
          id: "flipped-field",
          zones: [
            zone({
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
                mirror: true;
              }[] => [
                {
                  id: `t-${column}-${row}`,
                  center: { u: origin.u + 0.25, v: origin.v + 0.25 },
                  size: { u: 0.5, v: 0.5 },
                  rotationDeg: 0,
                  grainDeg: 0,
                  mirror: true,
                },
              ],
            }),
          ],
        }),
      }),
      tile: { u: 2, v: 1 },
      sheet: { kind: "face", origin: { u: 0, v: 0 } },
    });
  TestValidator.equals(
    "a flipped piece cut from a face sheet keeps its span and swaps its ends",
    namedFacts([
      [
        "swapped",
        (): boolean => {
          const low: { x: number; y: number } = sample(
            flippedField.transforms[0]!,
            0,
            0,
          );
          const high: { x: number; y: number } = sample(
            flippedField.transforms[0]!,
            1,
            1,
          );
          return (
            nclose(low.x, 0.25, 1e-12) &&
            nclose(low.y, 0, 1e-12) &&
            nclose(high.x, 0, 1e-12) &&
            nclose(high.y, 0.5, 1e-12)
          );
        },
      ],
      [
        "sameSpan",
        (): boolean =>
          nclose(flippedField.transforms[0]!.scale.x, -0.25, 1e-12) &&
          nclose(flippedField.transforms[0]!.scale.y, 0.5, 1e-12),
      ],
    ]),
    { swapped: true, sameSpan: true },
  );

  const narrowed: IAutoMoviePatternTexturing =
    autoMoviePatternTextureTransforms({
      result: generateAutoMovieSurfacePattern({
        pattern: pattern({
          id: "narrow",
          zones: [zone({ region: rectangle(0, 0, 1.75, 1) })],
          minimumPiece: 0.4,
        }),
      }),
      tile: { u: 2, v: 1 },
      sheet: { kind: "face", origin: { u: 0, v: 0 } },
    });
  TestValidator.equals(
    "a cut piece samples the module it was cut from, not the sliver it became",
    namedFacts([
      ["kept", (): boolean => narrowed.transforms.length === 8],
      [
        "unchanged",
        (): boolean =>
          test12ValuesClose(narrowed.transforms, perFace.transforms),
      ],
    ]),
    { kept: true, unchanged: true },
  );

  // 6-7. Book matching and grain retain the original sequential assertions.
  assertPatternTextureBookMatch(sample);

  const diagonal: IAutoMoviePatternTexturing =
    autoMoviePatternTextureTransforms({
      result: generateAutoMovieSurfacePattern({
        pattern: pattern({
          id: "diagonal-grain",
          zones: [
            zone({
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
                mirror: false;
              }[] => [
                {
                  id: `t-${column}-${row}`,
                  center: { u: origin.u + 0.25, v: origin.v + 0.25 },
                  size: { u: 0.5, v: 0.5 },
                  rotationDeg: 0,
                  grainDeg: 45,
                  mirror: false,
                },
              ],
            }),
          ],
        }),
      }),
      tile: { u: 0.5, v: 0.5 },
      sheet: { kind: "module" },
    });
  TestValidator.equals(
    "grain rotates the sheet under the piece, not the piece",
    namedFacts([
      [
        "straight",
        (): boolean => nclose(perModule.transforms[0]!.rotationDeg, 0, 1e-12),
      ],
      [
        "rotated",
        (): boolean => nclose(diagonal.transforms[0]!.rotationDeg, 45, 1e-12),
      ],
      ["sheared", (): boolean => diagonal.sheared.length === 0],
      [
        "scale",
        (): boolean =>
          diagonal.transforms.every(
            (one: IAutoMoviePatternTextureTransform): boolean =>
              nclose(one.scale.x, 1, 1e-12) && nclose(one.scale.y, 1, 1e-12),
          ),
      ],
      [
        "centred",
        (): boolean =>
          diagonal.transforms.every(
            (one: IAutoMoviePatternTextureTransform): boolean => {
              const middle: { x: number; y: number } = sample(one, 0.5, 0.5);
              return (
                nclose(middle.x, 0.5, 1e-12) && nclose(middle.y, 0.5, 1e-12)
              );
            },
          ),
      ],
    ]),
    {
      straight: true,
      rotated: true,
      sheared: true,
      scale: true,
      centred: true,
    },
  );

  const skewed: (size: {
    u: number;
    v: number;
  }) => IAutoMoviePatternTexturing = (size: {
    u: number;
    v: number;
  }): IAutoMoviePatternTexturing =>
    autoMoviePatternTextureTransforms({
      result: generateAutoMovieSurfacePattern({
        pattern: pattern({
          id: "skewed",
          zones: [
            zone({
              region: rectangle(0, 0, 1, 1),
              period: { u: 1, v: 1 },
              reach: { u: 1, v: 1 },
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
                mirror: false;
              }[] => [
                {
                  id: `t-${column}-${row}`,
                  center: { u: origin.u + 0.5, v: origin.v + 0.5 },
                  size,
                  rotationDeg: 45,
                  grainDeg: 0,
                  mirror: false,
                },
              ],
            }),
          ],
          minimumPiece: 0.01,
        }),
      }),
      tile: { u: 0.6, v: 0.15 },
      sheet: { kind: "module" },
    });
  const plank: IAutoMoviePatternTexturing = skewed({ u: 0.6, v: 0.15 });
  const square: IAutoMoviePatternTexturing = skewed({ u: 0.3, v: 0.3 });
  TestValidator.equals(
    "a long piece turned off its grain needs a shear, a square one does not",
    namedFacts([
      ["shearedIds", (): boolean => plank.sheared.join() === "field/t-0-0"],
      ["shearedEmpty", (): boolean => plank.transforms.length === 0],
      ["squareSheared", (): boolean => square.sheared.length === 0],
      ["squareCount", (): boolean => square.transforms.length === 1],
      [
        "squareRotation",
        (): boolean => nclose(square.transforms[0]!.rotationDeg, -45, 1e-12),
      ],
      [
        "squareScale",
        (): boolean =>
          nclose(square.transforms[0]!.scale.x, 0.5, 1e-12) &&
          nclose(square.transforms[0]!.scale.y, 2, 1e-12),
      ],
    ]),
    {
      shearedIds: true,
      shearedEmpty: true,
      squareSheared: true,
      squareCount: true,
      squareRotation: true,
      squareScale: true,
    },
  );

  TestValidator.equals(
    "a non-positive texture turn and a non-finite sheet origin are refused",
    namedFacts([
      [
        "tileU",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternTexturing =>
              autoMoviePatternTextureTransforms({
                result: field,
                tile: { u: 0, v: 0.5 },
                sheet: { kind: "module" },
              }),
            "pattern texture tile u must be a finite number > 0",
          ),
      ],
      [
        "tileV",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternTexturing =>
              autoMoviePatternTextureTransforms({
                result: field,
                tile: { u: 0.5, v: Number.NaN },
                sheet: { kind: "module" },
              }),
            "pattern texture tile v must be a finite number > 0",
          ),
      ],
      [
        "origin",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternTexturing =>
              autoMoviePatternTextureTransforms({
                result: field,
                tile: { u: 0.5, v: 0.5 },
                sheet: {
                  kind: "face",
                  origin: { u: 0, v: Number.POSITIVE_INFINITY },
                },
              }),
            "pattern texture sheet origin must be finite",
          ),
      ],
    ]),
    { tileU: true, tileV: true, origin: true },
  );

  TestValidator.predicate(
    "the same run transformed twice preserves structure and numeric components",
    test12ValuesClose(
      autoMoviePatternTextureTransforms({
        result: field,
        tile: { u: 2, v: 1 },
        sheet: { kind: "face", origin: { u: 0, v: 0 } },
      }),
      perFace,
    ),
  );
}
