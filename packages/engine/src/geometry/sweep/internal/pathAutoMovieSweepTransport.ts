import {
  type IAutoMovieSweepFrame,
  type IAutoMovieSweepPath,
  type IAutoMovieSweepTransport,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Wrap a transport in the object-returning path record.
 *
 * The record reads the transport as it stands at each query, so it follows a
 * later `update`, except `length`, which is copied when wrapped.
 *
 * @param transport An updated transport with frames, retained.
 * @returns The path.
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
