import type { IAutoMovieRandom } from "@automovie/interface";

import { createFractalNoise2Implementation } from "./internal/createFractalNoise2Implementation";
import { createFractalNoise3Implementation } from "./internal/createFractalNoise3Implementation";
import { createGradientNoise2Implementation } from "./internal/createGradientNoise2Implementation";
import { createGradientNoise3Implementation } from "./internal/createGradientNoise3Implementation";
import { createRandomImplementation } from "./internal/createRandomImplementation";
import { deriveSeedValue } from "./internal/deriveSeedValue";
import { hashFnv1a64Implementation } from "./internal/hashFnv1a64Implementation";
import { philox4x32Implementation } from "./internal/philox4x32Implementation";
import { AutoMovieEngineRandomBounds } from "./internal/AutoMovieEngineRandomBounds";

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
    return createFractalNoise2Implementation(seed, octaves, roughness);
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
    return createFractalNoise3Implementation(seed, octaves, roughness);
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
    return createGradientNoise2Implementation(seed);
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
    return createGradientNoise3Implementation(seed);
  }

  /**
   * Create a deterministic stream from sixteen hexadecimal seed digits.
   *
   * Read any nonnegative safe integer index in any order. The block gives four
   * unsigned words, uint32 gives its first word and float uses its first two
   * words for a result in [0, 1). The stream stores the seed in lowercase and
   * derives child streams from that text and the supplied ordered IDs.
   */
  export function createRandom(seed: string): IAutoMovieRandom {
    return createRandomImplementation(seed);
  }

  /**
   * Derive a 64-bit seed from the film seed and ordered stable IDs.
   *
   * Hash UTF-8 bytes with FNV-1a. A 0xff byte follows the film seed and each
   * ID, including empty fields. Pass IDs from the outermost owner inward.
   * The result contains sixteen lowercase hexadecimal digits.
   */
  export function deriveSeed(filmSeed: string, ...ids: string[]): string {
    return deriveSeedValue(filmSeed, ...ids);
  }

  /**
   * Hash a byte iterable with 64-bit FNV-1a.
   *
   * Read each value's low eight bits after integer conversion. The result
   * contains sixteen lowercase hexadecimal digits. An empty iterable returns
   * the FNV-1a offset basis.
   */
  export function hashFnv1a64(bytes: Iterable<number>): string {
    return hashFnv1a64Implementation(bytes);
  }

  /**
   * Produce a Philox4x32-10 block from four counter words and two key words.
   *
   * Supply the counter least-significant word first. Each input word is
   * converted to an unsigned 32-bit integer. The returned four words depend
   * only on the supplied counter and key.
   */
  export function philox4x32(
    counter: readonly [number, number, number, number],
    key: readonly [number, number],
  ): [number, number, number, number] {
    return philox4x32Implementation(counter, key);
  }
}
