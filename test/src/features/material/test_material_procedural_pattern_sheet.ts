import { AutoMovieEngineMaterial, AutoMovieEngineArchitecture, AutoMovieEngineSurfaceMaterial } from "@automovie/engine";
import type {
  AutoMovieSurfacePatternGenerator,
  IAutoMovieColor,
  IAutoMoviePatternCandidate,
  IAutoMoviePatternPlacement,
  IAutoMoviePatternTextureTransform,
  IAutoMovieProceduralSurface,
  IAutoMovieSampleProceduralSurface,
  IAutoMovieSurfacePatternResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { pattern, rectangle, zone } from "../internal/patternFixtures";
import { throwsError } from "../internal/throwsError";

/**
 * A procedural finish on a laid surface pattern samples each piece where the
 * sheet kind says it was cut: one continuous sheet under `face`, a separately
 * made piece under `module`.
 *
 * The field is a 3 × 1 m running bond of 1 × 0.2 m boards, each row shifted
 * half a board, laid with grain 0° and no mirroring; the finish is wood with
 * its grain along sheet U and a 1 m tile.
 *
 * Scenarios:
 *
 * 1. Under `face`, two boards that share an end joint in one row, and two boards
 *    in neighbouring rows that share a long joint, sample base colours within
 *    1e-6 of each other at the same face point on that joint.
 * 2. Under `face`, renaming an occurrence's id leaves its samples unchanged.
 * 3. Under `module`, two boards with different ids sample different base colours
 *    at their centres, and one board samples the same values on every run.
 * 4. A sample whose form does not match the surface, a point for a piece or a UV
 *    for a surface without one, throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Lays a real pattern with `generateAutoMovieSurfacePattern`, takes each board's transform from `autoMoviePatternTextureTransforms` and samples through `sampleAutoMovieProceduralSurface`; a face sheet that added a per-piece offset, a module sheet that did not, or an id that entered a face sample fails.
 * @evidence contracts/development/testing.md#independent-expectations A face point is mapped to each board's own UV from the board's placement alone, `(point − corner) / size`, without the transform; continuity across joints then follows from the face sheet's definition, and module differences from its per-occurrence offset.
 * @evidence contracts/development/testing.md#distinguishing-cases End joints and long joints, face against module, and a renamed id; admission of zero tiles and missing UV0 is owned by `test_material_procedural_admission`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_material_procedural_pattern_sheet`, with in-memory inputs only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_material_procedural_pattern_sheet(): void {
  const field: IAutoMovieSurfacePatternResult = AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern(
    {
      pattern: pattern({
        zones: [
          zone({
            region: rectangle(0, 0, 3, 1),
            period: { u: 1, v: 0.2 },
            // A shifted board's far end lies 1.5 m from its cell origin; the
            // margin keeps rounded corners inside the declared reach.
            reach: { u: 2, v: 0.4 },
            generate: runningBond,
          }),
        ],
        minimumPiece: 0.05,
      }),
    },
  );
  const face: IAutoMovieTransformsById = transforms(field, "face");
  const module: IAutoMovieTransformsById = transforms(field, "module");
  const boards: IAutoMoviePatternPlacement[] = field.placements.filter(
    (placement: IAutoMoviePatternPlacement): boolean => face.has(placement.id),
  );
  const at: (u: number, v: number) => IAutoMoviePatternPlacement = (
    u: number,
    v: number,
  ): IAutoMoviePatternPlacement =>
    boards.find(
      (board: IAutoMoviePatternPlacement): boolean =>
        Math.abs(board.center.u - u) < 1e-9 &&
        Math.abs(board.center.v - v) < 1e-9,
    )!;

  // 1. End joint at u = 2 in the first row, long joint at v = 0.2 under u = 1.25.
  const left: IAutoMoviePatternPlacement = at(1.5, 0.1);
  const right: IAutoMoviePatternPlacement = at(2.5, 0.1);
  const above: IAutoMoviePatternPlacement = at(1, 0.3);
  const end: [IAutoMovieColor, IAutoMovieColor] = [
    sample(left, face.get(left.id)!, "face", 2, 0.13),
    sample(right, face.get(right.id)!, "face", 2, 0.13),
  ];
  const long: [IAutoMovieColor, IAutoMovieColor] = [
    sample(left, face.get(left.id)!, "face", 1.25, 0.2),
    sample(above, face.get(above.id)!, "face", 1.25, 0.2),
  ];
  TestValidator.predicate(
    "under face the grain runs across an end joint and a long joint",
    same(end[0], end[1]) && same(long[0], long[1]),
  );

  // 2. An id does not enter a face sample.
  const renamed: IAutoMoviePatternTextureTransform = {
    ...face.get(left.id)!,
    id: "elsewhere/renamed",
  };
  TestValidator.predicate(
    "renaming a face occurrence leaves its samples unchanged",
    same(
      sample(left, renamed, "face", 1.7, 0.05),
      sample(left, face.get(left.id)!, "face", 1.7, 0.05),
    ),
  );

  // 3. Module pieces differ by id and repeat by id.
  const a: IAutoMovieColor = sample(
    left,
    module.get(left.id)!,
    "module",
    1.5,
    0.1,
  );
  const b: IAutoMovieColor = sample(
    right,
    module.get(right.id)!,
    "module",
    2.5,
    0.1,
  );
  const again: IAutoMovieColor = sample(
    left,
    module.get(left.id)!,
    "module",
    1.5,
    0.1,
  );
  TestValidator.predicate(
    "under module two boards differ at their centres and one board repeats",
    !same(a, b) && a.r === again.r && a.g === again.g && a.b === again.b,
  );

  // 4. Sample form must match the surface.
  const surface: IAutoMovieProceduralSurface = finish(
    "face",
    face.get(left.id)!,
  );
  TestValidator.predicate(
    "a point for a piece throws",
    throwsError(() =>
      AutoMovieEngineMaterial.sampleProceduralSurface({
        surface,
        point: { x: 0, y: 0, z: 0 },
      }),
    ),
  );
  const plain: IAutoMovieProceduralSurface = { ...surface };
  delete plain.piece;
  TestValidator.predicate(
    "a UV for a surface without a piece throws",
    throwsError(() =>
      AutoMovieEngineMaterial.sampleProceduralSurface({
        surface: plain,
        uv: { u: 0, v: 0 },
        offset: 0,
      } as IAutoMovieSampleProceduralSurface.IPiece),
    ),
  );
}

/** Transforms of a field's occurrences by id. */
type IAutoMovieTransformsById = Map<string, IAutoMoviePatternTextureTransform>;

/** One board per module cell, every other row shifted half a board. */
const runningBond: AutoMovieSurfacePatternGenerator = ({
  column,
  row,
  origin,
}: Parameters<AutoMovieSurfacePatternGenerator>[0]): IAutoMoviePatternCandidate[] => [
  {
    id: `b-${column}-${row}`,
    center: {
      u: origin.u + 0.5 + (Math.abs(row) % 2 === 1 ? 0.5 : 0),
      v: origin.v + 0.1,
    },
    size: { u: 1, v: 0.2 },
    rotationDeg: 0,
    grainDeg: 0,
    mirror: false,
  },
];

/** The field's transforms on a 1 m sheet of a kind. */
function transforms(
  field: IAutoMovieSurfacePatternResult,
  kind: "face" | "module",
): IAutoMovieTransformsById {
  return new Map(
    AutoMovieEngineArchitecture.patternTextureTransforms({
      result: field,
      tile: { u: 1, v: 1 },
      sheet: kind === "face" ? { kind, origin: { u: 0, v: 0 } } : { kind },
    }).transforms.map(
      (
        transform: IAutoMoviePatternTextureTransform,
      ): [string, IAutoMoviePatternTextureTransform] => [
        transform.id,
        transform,
      ],
    ),
  );
}

/** The wood finish of one occurrence. */
function finish(
  sheet: "face" | "module",
  transform: IAutoMoviePatternTextureTransform,
): IAutoMovieProceduralSurface {
  const color: (value: number) => IAutoMovieColor = (
    value: number,
  ): IAutoMovieColor => ({
    r: value,
    g: value * 0.7,
    b: value * 0.4,
    a: 1,
    hex: null,
  });
  return {
    kind: "wood",
    seed: 77,
    scale: 0.01,
    colors: [color(0.2), color(0.6)],
    roughness: [0.5, 0.7],
    relief: 0.0005,
    axis: { x: 1, y: 0, z: 0 },
    piece: { sheet, tile: { u: 1, v: 1 }, transform },
  };
}

/**
 * A board's colour at a face point, mapped to the board's own UV by its
 * placement.
 */
function sample(
  board: IAutoMoviePatternPlacement,
  transform: IAutoMoviePatternTextureTransform,
  sheet: "face" | "module",
  u: number,
  v: number,
): IAutoMovieColor {
  return AutoMovieEngineMaterial.sampleProceduralSurface({
    surface: finish(sheet, transform),
    uv: {
      u: (u - (board.center.u - board.size.u / 2)) / board.size.u,
      v: (v - (board.center.v - board.size.v / 2)) / board.size.v,
    },
    offset: 0,
  }).color;
}

/** Two colours within 1e-6 per channel. */
function same(a: IAutoMovieColor, b: IAutoMovieColor): boolean {
  return (
    nclose(a.r, b.r, 1e-6) && nclose(a.g, b.g, 1e-6) && nclose(a.b, b.b, 1e-6)
  );
}
