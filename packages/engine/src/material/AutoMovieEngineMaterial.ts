import type {
  IAutoMovieMaterialWear,
  IAutoMovieProceduralSurface,
  IAutoMovieSampleProceduralSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMoviePcg3d } from "./internal/autoMoviePcg3d";
import { autoMovieProceduralCells } from "./internal/autoMovieProceduralCells";
import { autoMovieProceduralFractal } from "./internal/autoMovieProceduralFractal";
import { autoMovieProceduralFrame } from "./internal/autoMovieProceduralFrame";
import { autoMovieProceduralHash } from "./internal/autoMovieProceduralHash";
import { autoMovieProceduralNoise } from "./internal/autoMovieProceduralNoise";
import { autoMovieProceduralPattern } from "./internal/autoMovieProceduralPattern";
import { autoMovieProceduralPieceOffset } from "./internal/autoMovieProceduralPieceOffset";
import { autoMovieWearWeight } from "./internal/autoMovieWearWeight";
import { sampleAutoMovieProceduralSurface } from "./internal/sampleAutoMovieProceduralSurface";

/** Deterministic material sampling and procedural surface calculations. */
export namespace AutoMovieEngineMaterial {
  /** Hashes three unsigned 32-bit words with PCG3D. */
  export function pcg3d(
    x: number,
    y: number,
    z: number,
  ): [number, number, number] {
    return autoMoviePcg3d(x, y, z);
  }

  /** Returns the nearest and second-nearest procedural cell distances. */
  export function proceduralCells(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): [number, number] {
    return autoMovieProceduralCells(seed, x, y, z);
  }

  /** Returns the four-octave procedural noise sum. */
  export function proceduralFractal(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): number {
    return autoMovieProceduralFractal(seed, x, y, z);
  }

  /** Builds the normalized directional frame for a material axis. */
  export function proceduralFrame(
    axis: IAutoMovieVector3,
  ): ReturnType<typeof autoMovieProceduralFrame> {
    return autoMovieProceduralFrame(axis);
  }

  /** Hashes a procedural seed, salt and integer lattice cell. */
  export function proceduralHash(
    seed: number,
    salt: number,
    i: number,
    j: number,
    k: number,
  ): [number, number, number] {
    return autoMovieProceduralHash(seed, salt, i, j, k);
  }

  /** Samples seeded three-dimensional gradient noise. */
  export function proceduralNoise(
    seed: number,
    salt: number,
    x: number,
    y: number,
    z: number,
  ): number {
    return autoMovieProceduralNoise(seed, salt, x, y, z);
  }

  /** Evaluates a procedural surface pattern at a point in sampling space. */
  export function proceduralPattern(
    surface: IAutoMovieProceduralSurface,
    point: readonly [number, number, number],
  ): number {
    return autoMovieProceduralPattern(surface, point);
  }

  /** Returns the deterministic sheet-space offset for a procedural piece. */
  export function proceduralPieceOffset(
    seed: number,
    id: string,
    scale: number,
  ): [number, number, number] {
    return autoMovieProceduralPieceOffset(seed, id, scale);
  }

  /** Returns one material wear layer's weight at a bind-pose point. */
  export function wearWeight(
    layer: IAutoMovieMaterialWear.ILayer,
    distance: number,
    seed: number,
    point: IAutoMovieVector3,
  ): number {
    return autoMovieWearWeight(layer, distance, seed, point);
  }

  /** Samples a procedural surface's colour, roughness and height. */
  export function sampleProceduralSurface(
    props: IAutoMovieSampleProceduralSurface.IProps,
  ): IAutoMovieSampleProceduralSurface.IResult {
    return sampleAutoMovieProceduralSurface(props);
  }
}
