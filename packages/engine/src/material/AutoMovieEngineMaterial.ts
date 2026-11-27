import type {
  IAutoMovieMaterialWear,
  IAutoMovieProceduralSurface,
  IAutoMovieSampleProceduralSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hashPcg3d } from "./internal/hashPcg3d";
import { proceduralCellsImplementation } from "./internal/proceduralCellsImplementation";
import { proceduralFractalImplementation } from "./internal/proceduralFractalImplementation";
import { proceduralFrameImplementation } from "./internal/proceduralFrameImplementation";
import { proceduralHashImplementation } from "./internal/proceduralHashImplementation";
import { proceduralNoiseImplementation } from "./internal/proceduralNoiseImplementation";
import { proceduralPatternImplementation } from "./internal/proceduralPatternImplementation";
import { proceduralPieceOffsetImplementation } from "./internal/proceduralPieceOffsetImplementation";
import { wearWeightImplementation } from "./internal/wearWeightImplementation";
import { sampleProceduralSurfaceImplementation } from "./internal/sampleProceduralSurfaceImplementation";

/** Deterministic material sampling and procedural surface calculations. */
export namespace AutoMovieEngineMaterial {
  /** Hashes three unsigned 32-bit words with PCG3D. */
  export function pcg3d(
    x: number,
    y: number,
    z: number,
  ): [number, number, number] {
    return hashPcg3d(x, y, z);
  }

  /** Returns the nearest and second-nearest procedural cell distances. */
  export function proceduralCells(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): [number, number] {
    return proceduralCellsImplementation(seed, x, y, z);
  }

  /** Returns the four-octave procedural noise sum. */
  export function proceduralFractal(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): number {
    return proceduralFractalImplementation(seed, x, y, z);
  }

  /** Builds the normalized directional frame for a material axis. */
  export function proceduralFrame(
    axis: IAutoMovieVector3,
  ): ReturnType<typeof proceduralFrameImplementation> {
    return proceduralFrameImplementation(axis);
  }

  /** Hashes a procedural seed, salt and integer lattice cell. */
  export function proceduralHash(
    seed: number,
    salt: number,
    i: number,
    j: number,
    k: number,
  ): [number, number, number] {
    return proceduralHashImplementation(seed, salt, i, j, k);
  }

  /** Samples seeded three-dimensional gradient noise. */
  export function proceduralNoise(
    seed: number,
    salt: number,
    x: number,
    y: number,
    z: number,
  ): number {
    return proceduralNoiseImplementation(seed, salt, x, y, z);
  }

  /** Evaluates a procedural surface pattern at a point in sampling space. */
  export function proceduralPattern(
    surface: IAutoMovieProceduralSurface,
    point: readonly [number, number, number],
  ): number {
    return proceduralPatternImplementation(surface, point);
  }

  /** Returns the deterministic sheet-space offset for a procedural piece. */
  export function proceduralPieceOffset(
    seed: number,
    id: string,
    scale: number,
  ): [number, number, number] {
    return proceduralPieceOffsetImplementation(seed, id, scale);
  }

  /** Returns one material wear layer's weight at a bind-pose point. */
  export function wearWeight(
    layer: IAutoMovieMaterialWear.ILayer,
    distance: number,
    seed: number,
    point: IAutoMovieVector3,
  ): number {
    return wearWeightImplementation(layer, distance, seed, point);
  }

  /** Samples a procedural surface's colour, roughness and height. */
  export function sampleProceduralSurface(
    props: IAutoMovieSampleProceduralSurface.IProps,
  ): IAutoMovieSampleProceduralSurface.IResult {
    return sampleProceduralSurfaceImplementation(props);
  }
}
