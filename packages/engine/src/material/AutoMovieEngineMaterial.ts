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
  /**
   * Hash three lattice coordinates with PCG3D using unsigned 32-bit words.
   *
   * The input conversion preserves the two's-complement bit pattern of
   * negative integer coordinates. The result contains three unsigned words.
   */
  export function pcg3d(
    x: number,
    y: number,
    z: number,
  ): [number, number, number] {
    return hashPcg3d(x, y, z);
  }

  /**
   * Return the two nearest procedural feature distances in lattice units.
   *
   * Supply a seed word and finite lattice coordinates. The search visits the
   * containing cube and its 26 neighbours. A returned distance up to one
   * lattice unit also holds for the full lattice. A larger distance
   * describes the searched neighbourhood.
   */
  export function proceduralCells(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): [number, number] {
    return proceduralCellsImplementation(seed, x, y, z);
  }

  /**
   * Sample four octaves of three-dimensional noise in lattice units.
   *
   * Frequencies double from 1 and amplitudes halve from 1. Supply a seed
   * word and coordinates that remain finite at those frequencies.
   * Normalization returns a value in [-1, 1].
   */
  export function proceduralFractal(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): number {
    return proceduralFractalImplementation(seed, x, y, z);
  }

  /**
   * Build the sample-space frame for a directional material.
   *
   * Use a finite nonzero axis with representable length. The along axis is
   * normalized. Across is along crossed with sampling Z, or sampling X when
   * that cross product is shorter than 1e-6. Normal is along crossed with
   * across.
   */
  export function proceduralFrame(
    axis: IAutoMovieVector3,
  ): ReturnType<typeof proceduralFrameImplementation> {
    return proceduralFrameImplementation(axis);
  }

  /**
   * Hash a seed, salt and three integer lattice coordinates to three words.
   *
   * The seed and salt select the purpose of the lookup. Coordinate bit
   * patterns are read as unsigned 32-bit words. The same seed, salt and cell
   * reproduce the same three unsigned words.
   */
  export function proceduralHash(
    seed: number,
    salt: number,
    i: number,
    j: number,
    k: number,
  ): [number, number, number] {
    return proceduralHashImplementation(seed, salt, i, j, k);
  }

  /**
   * Sample seeded three-dimensional gradient noise in lattice units.
   *
   * Supply seed and salt words and finite lattice coordinates. The noise
   * blends the gradients of the surrounding eight corners. Lattice corners
   * have value zero and the result is clamped to [-1, 1].
   */
  export function proceduralNoise(
    seed: number,
    salt: number,
    x: number,
    y: number,
    z: number,
  ): number {
    return proceduralNoiseImplementation(seed, salt, x, y, z);
  }

  /**
   * Sample an admitted material pattern at a point in sampling-space metres.
   *
   * Plaster and clay use fractal noise. Stone blends a cellular gap with
   * noise, wood uses its axis for rings, fabric uses its axis for the weave
   * and brushed metal uses it for streaks. The material scale sets feature
   * size and the result lies in [0, 1].
   */
  export function proceduralPattern(
    surface: IAutoMovieProceduralSurface,
    point: readonly [number, number, number],
  ): number {
    return proceduralPatternImplementation(surface, point);
  }

  /**
   * Derive a module occurrence's sheet-space offset in metres.
   *
   * Supply the occurrence ID, seed word and positive feature scale. The ID
   * is hashed as UTF-16 code units. Each U, V and normal component scales a
   * word fraction by 64 feature widths.
   */
  export function proceduralPieceOffset(
    seed: number,
    id: string,
    scale: number,
  ): [number, number, number] {
    return proceduralPieceOffsetImplementation(seed, id, scale);
  }

  /**
   * Weight an admitted wear layer at a bind-pose object-space point.
   *
   * Use metres for the distance to the layer's matching edge and for the
   * point. The layer width sets the band and the noise scale. The weight is
   * zero at and beyond the width when the amount and width give
   * representable band arithmetic.
   */
  export function wearWeight(
    layer: IAutoMovieMaterialWear.ILayer,
    distance: number,
    seed: number,
    point: IAutoMovieVector3,
  ): number {
    return wearWeightImplementation(layer, distance, seed, point);
  }

  /**
   * Sample an admitted procedural surface's colour, roughness and relief
   * height.
   *
   * A surface without a piece takes a finite bind-pose object point in
   * metres. A pattern piece takes finite UV0 and a normal offset in metres.
   * Face pieces use sheet coordinates and module pieces add their stable
   * occurrence offset.
   *
   * A mismatched sample form or a nonfinite transformed point throws. The
   * pattern value interpolates the colour and roughness endpoints and scales
   * the relief.
   */
  export function sampleProceduralSurface(
    props: IAutoMovieSampleProceduralSurface.IProps,
  ): IAutoMovieSampleProceduralSurface.IResult {
    return sampleProceduralSurfaceImplementation(props);
  }
}
