import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";

/**
 * Wrap a transport in the object-returning path record.
 *
 * The record reads the transport as it stands at each query, so it follows a
 * later `update`, except `length`, which is copied when wrapped.
 *
 * @param transport An updated transport with frames, retained.
 * @returns The path.
 *
 * @evidence contracts/common.md#principled-implementation An adapter from the array interface to vector records over the same computation.
 * @evidence contracts/common.md#clear-and-simple-design Four closures sharing one twelve-number scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is cached beyond the length, which is stated.
 * @evidence contracts/common.md#meaningful-documentation States what follows an update and what does not.
 * @evidence contracts/performance.md#efficient-algorithms Each query is the transport's plus one returned record per vector.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An adapter; the transport is the reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the transport and twelve scratch numbers.
 */
export const pathAutoMovieSweepTransport: (
  transport: IAutoMovieSweepTransport,
) => IAutoMovieSweepPath = (
  transport: IAutoMovieSweepTransport,
): IAutoMovieSweepPath => {
  const out: Float64Array = new Float64Array(12);
  const vector = (at: number): IAutoMovieVector3 => ({
    x: out[at]!,
    y: out[at + 1]!,
    z: out[at + 2]!,
  });
  return {
    length: transport.length(),
    point: (u: number): IAutoMovieVector3 => {
      transport.point(u, out, 0);
      return vector(0);
    },
    tangent: (u: number): IAutoMovieVector3 => {
      transport.tangent(u, out, 0);
      return vector(0);
    },
    frame: (u: number): IAutoMovieSweepFrame => {
      transport.frame(u, out, 0);
      return {
        origin: vector(0),
        x: vector(3),
        y: vector(6),
        normal: vector(9),
      };
    },
  };
};
