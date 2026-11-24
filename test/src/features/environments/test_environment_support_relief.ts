import { createRock, createSeat } from "@automovie/archetypes";
import {
  createEnvironment,
  createEnvironmentProp,
  createTerrain,
} from "@automovie/archetypes/environments";
import {
  Matrix4,
  computeModelRestExtent,
  setPieceMatrix,
  surfaceHeightAt,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentItem,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieSetPieceSupport,
  IAutoMovieStageSetPiece,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/** Where each set piece stands: its model and its terrain amenity. */
const PIECES: Readonly<
  Record<string, { model: "rock" | "bench"; pad: number | null }>
> = {
  rockOnPad: { model: "rock", pad: 1 },
  benchOnPad: { model: "bench", pad: 0.5 },
  rockOnRelief: { model: "rock", pad: null },
  benchOnRelief: { model: "bench", pad: null },
};

/**
 * Set pieces on seeded noise relief rest on its level pads, and where the
 * relief slopes under them the support report finds them sunk by the ground
 * that rises under their footprint.
 *
 * The terrain is a 40 m by 30 m parcel of noise relief, amplitude 2 m,
 * wavelength 20 m and 3 octaves, with two 4 m square pads at 1 m and 0.5 m. A
 * boulder and a bench stand at the pads' centres and at two points of open
 * relief 20 m from either pad, each at a terrain amenity, which stands its
 * frame on the ground.
 *
 * Scenarios:
 *
 * 1. On its pad each piece stands at the pad's authored height and is `resting` on
 *    the terrain ground within the 1e-9 m support tolerance.
 * 2. On open relief the ground under each piece's footprint rises above its
 *    underside, and the piece is `sunk` into the terrain ground: its gap is its
 *    underside less the highest ground under its footprint's four corners and
 *    centre, within 1e-9 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Composes noise relief, pads, amenities and set pieces through the public environment producers and reads `support`, which catches a report that judges terrain at a flat height, reads the ground at one point only, misses the pad's plateau, or reports a sloped piece resting or floating.
 * @evidence contracts/development/testing.md#independent-expectations The pad heights are the recipe's; the expected gap is the support contract's signed gap, the underside of the piece's world box less the highest ground under the footprint probes the report shares with `propSupportGap`, read here from the stage space's ground through `surfaceHeightAt` and the model's rest box through `computeModelRestExtent`. The open-relief case first requires that ground to rise above the underside, so the sunk verdict is not vacuous.
 * @evidence contracts/development/testing.md#distinguishing-cases The same rock and bench on a level pad and on sloped relief, two pad heights and two piece shapes; `test_environment_support_report` owns level ground, attached, declared, wall-borne and building pieces, and `test_location_terrain_noise` the relief itself.
 * @evidence contracts/development/testing.md#execution-ownership A CPU-only feature scenario over in-memory environments; it starts no renderer or host.
 * @evidence contracts/development/common.md#meaningful-documentation States the terrain, the pads and the four placements, and the expected verdict and gap of each.
 */
export function test_environment_support_relief(): void {
  const models: Readonly<Record<"rock" | "bench", IAutoMovieModel>> = {
    rock: createRock({ kind: "boulder" }, "rock"),
    bench: createSeat({ kind: "bench" }, "bench"),
  };
  const square: (cx: number, cz: number) => [number, number][] = (
    cx: number,
    cz: number,
  ): [number, number][] => [
    [cx - 2, cz - 2],
    [cx + 2, cz - 2],
    [cx + 2, cz + 2],
    [cx - 2, cz + 2],
  ];
  const items: Record<string, IAutoMovieEnvironmentItem> = {
    land: {
      use: createTerrain({
        size: [40, 30],
        relief: { kind: "noise", amplitude: 2, wavelength: 20, octaves: 3 },
        pads: {
          high: { outline: square(8, 8), height: 1 },
          low: { outline: square(8, 22), height: 0.5 },
        },
        amenities: {
          rockOnPad: [8, 8],
          benchOnPad: [8, 22],
          rockOnRelief: [28, 8],
          benchOnRelief: [28, 22],
        },
      }),
    },
  };
  for (const [name, { model }] of Object.entries(PIECES))
    items[name] = {
      at: { anchor: `land/amenities/${name}` },
      use: createEnvironmentProp({ model: models[model] }),
    };
  const environment: IAutoMovieEnvironment = createEnvironment({
    id: "relief",
    seed: 7,
    items,
  });
  const ground: IAutoMovieSurface = environment.stage.space!.surfaces.find(
    (surface: IAutoMovieSurface): boolean =>
      surface.id === "relief/land/ground",
  )!;

  const failures: string[] = [];
  for (const [name, { pad }] of Object.entries(PIECES)) {
    const node: string = `relief/${name}`;
    const piece: IAutoMovieStageSetPiece = environment.stage.set.find(
      (entry: IAutoMovieStageSetPiece): boolean => entry.node === node,
    )!;
    const finding: IAutoMovieSetPieceSupport | undefined =
      environment.support.find(
        (entry: IAutoMovieSetPieceSupport): boolean => entry.node === node,
      );

    // The piece's world box: its model's rest box under its staged transform.
    const rest: IAutoMoviePropBox = computeModelRestExtent(
      environment.runtime.models.find(
        (model: IAutoMovieModel): boolean => model.id === piece.model,
      )!,
    )!;
    const matrix: number[] = setPieceMatrix(piece);
    const corners: IAutoMovieVector3[] = [];
    for (const x of [rest.min.x, rest.max.x])
      for (const y of [rest.min.y, rest.max.y])
        for (const z of [rest.min.z, rest.max.z])
          corners.push(Matrix4.transformPoint(matrix, { x, y, z }));
    const least: (axis: "x" | "y" | "z") => number = (
      axis: "x" | "y" | "z",
    ): number => Math.min(...corners.map((p: IAutoMovieVector3) => p[axis]));
    const most: (axis: "x" | "y" | "z") => number = (
      axis: "x" | "y" | "z",
    ): number => Math.max(...corners.map((p: IAutoMovieVector3) => p[axis]));

    // The highest ground under the footprint's four corners and centre.
    const highest: number = Math.max(
      ...[
        [least("x"), least("z")],
        [most("x"), least("z")],
        [most("x"), most("z")],
        [least("x"), most("z")],
        [(least("x") + most("x")) / 2, (least("z") + most("z")) / 2],
      ].map(([x, z]: number[]): number => surfaceHeightAt(ground, x!, z!)),
    );
    const gap: number = least("y") - highest;
    if (pad !== null) {
      if (!nclose(piece.position.y, pad, 1e-12))
        failures.push(`${name} stands at ${piece.position.y}, not ${pad}`);
      if (
        finding?.status !== "resting" ||
        finding.support !== ground.id ||
        !(Math.abs(finding.gap!) <= 1e-9)
      )
        failures.push(`${name} on its pad: ${JSON.stringify(finding)}`);
    } else if (
      !(gap < -1e-9) ||
      finding?.status !== "sunk" ||
      finding.support !== ground.id ||
      !nclose(finding.gap!, gap, 1e-9)
    )
      failures.push(
        `${name} on open relief, gap ${gap}: ${JSON.stringify(finding)}`,
      );
  }
  TestValidator.equals(
    "pieces rest on noise relief's pads and sink into its slopes",
    failures,
    [],
  );
}
