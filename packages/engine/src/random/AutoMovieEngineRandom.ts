import type { IAutoMovieRandom } from "@automovie/interface";

import { createAutoMovieFractalNoise2 } from "./createAutoMovieFractalNoise2";
import { createAutoMovieFractalNoise3 } from "./createAutoMovieFractalNoise3";
import { createAutoMovieGradientNoise2 } from "./createAutoMovieGradientNoise2";
import { createAutoMovieGradientNoise3 } from "./createAutoMovieGradientNoise3";
import { createAutoMovieRandom } from "./createAutoMovieRandom";
import { deriveAutoMovieSeed } from "./deriveAutoMovieSeed";
import { hashAutoMovieFnv1a64 } from "./hashAutoMovieFnv1a64";
import { philoxAutoMovie4x32 } from "./philoxAutoMovie4x32";
import { AutoMovieEngineRandomBounds } from "./AutoMovieEngineRandomBounds";

/**
 * The Engine's deterministic counter streams, seed derivation and seeded noise.
 * Random streams implement the IAutoMovieRandom contract.
 */
export namespace AutoMovieEngineRandom {
  /** Largest admitted 2D gradient-noise lattice coordinate magnitude, cells. */
  export const GRADIENT_NOISE_2_BOUND: number =
    AutoMovieEngineRandomBounds.GRADIENT_NOISE_2;

  /** Largest admitted 3D gradient-noise lattice coordinate magnitude, cells. */
  export const GRADIENT_NOISE_3_BOUND: number =
    AutoMovieEngineRandomBounds.GRADIENT_NOISE_3;

  /**
   * Create seeded two-dimensional fractal noise.
   *
   * @param seed Sixteen hexadecimal digits, as deriveSeed returns.
   * @param octaves Number of octaves, a positive integer.
   * @param roughness Amplitude ratio between successive octaves, in (0, 1).
   * @returns A deterministic noise function over two coordinates.
   */
  export function createFractalNoise2(
    seed: string,
    octaves: number,
    roughness: number,
  ): (x: number, y: number) => number {
    return createAutoMovieFractalNoise2(seed, octaves, roughness);
  }

  /**
   * Create seeded three-dimensional fractal noise.
   *
   * @param seed Sixteen hexadecimal digits, as deriveSeed returns.
   * @param octaves Number of octaves, a positive integer.
   * @param roughness Amplitude ratio between successive octaves, in (0, 1).
   * @returns A deterministic noise function over three coordinates.
   */
  export function createFractalNoise3(
    seed: string,
    octaves: number,
    roughness: number,
  ): (x: number, y: number, z: number) => number {
    return createAutoMovieFractalNoise3(seed, octaves, roughness);
  }

  /**
   * Create seeded two-dimensional gradient noise.
   *
   * @param seed Sixteen hexadecimal digits, as deriveSeed returns.
   * @returns A deterministic noise function over two coordinates.
   */
  export function createGradientNoise2(
    seed: string,
  ): (x: number, y: number) => number {
    return createAutoMovieGradientNoise2(seed);
  }

  /**
   * Create seeded three-dimensional gradient noise.
   *
   * @param seed Sixteen hexadecimal digits, as deriveSeed returns.
   * @returns A deterministic noise function over three coordinates.
   */
  export function createGradientNoise3(
    seed: string,
  ): (x: number, y: number, z: number) => number {
    return createAutoMovieGradientNoise3(seed);
  }

  /**
   * Create an indexed counter-based stream implementing IAutoMovieRandom.
   *
   * @param seed Sixteen hexadecimal digits, as deriveSeed returns.
   * @returns A stream whose values depend on the seed and index alone.
   */
  export function createRandom(seed: string): IAutoMovieRandom {
    return createAutoMovieRandom(seed);
  }

  /**
   * Derive a 64-bit seed from a film seed and ordered stable ids.
   *
   * @param filmSeed The production's seed text.
   * @param ids Stable ids of the drawing stream, outermost first.
   * @returns Sixteen lowercase hexadecimal digits.
   */
  export function deriveSeed(filmSeed: string, ...ids: string[]): string {
    return deriveAutoMovieSeed(filmSeed, ...ids);
  }

  /**
   * Hash byte values with 64-bit FNV-1a.
   *
   * @param bytes The byte sequence.
   * @returns Sixteen lowercase hexadecimal digits.
   */
  export function hashFnv1a64(bytes: Iterable<number>): string {
    return hashAutoMovieFnv1a64(bytes);
  }

  /**
   * Produce a Philox4x32-10 counter block.
   *
   * @param counter Four unsigned 32-bit counter words, least significant first.
   * @param key Two unsigned 32-bit key words.
   * @returns Four unsigned 32-bit output words.
   */
  export function philox4x32(
    counter: readonly [number, number, number, number],
    key: readonly [number, number],
  ): [number, number, number, number] {
    return philoxAutoMovie4x32(counter, key);
  }
}