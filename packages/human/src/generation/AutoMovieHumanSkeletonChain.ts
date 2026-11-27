import { AutoMovieEngineLoftChain } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftChain,
} from "@automovie/interface";

/**
 * How the skeleton reads the chains it stands in: a chain's first and last
 * stations, its axis point clamped into it, its girth radius at a station,
 * the mean height of a ring, and the point arithmetic these use, in
 * calibration millimetres.
 */
export namespace AutoMovieHumanSkeletonChain {
  /** Phases sampling a section for perimeters and extremities. */
  export const PHASES: number[] = Array.from(
    { length: 96 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 96,
  );

  /** Samples of a ring's arc. */
  export const RING: number = 512;

  /** First station of a chain. */
  export function start(chain: IAutoMovieLoftChain): number {
    return chain.layers[0]!.y;
  }

  /** Last station of a chain. */
  export function stop(chain: IAutoMovieLoftChain): number {
    return chain.layers[chain.layers.length - 1]!.y;
  }

  /** Axis point at a station, clamped into the chain. */
  export function axis(
    chain: IAutoMovieLoftChain,
    s: number,
  ): AutoMovieVector3Tuple {
    return AutoMovieEngineLoftChain.axis(
      chain,
      Math.min(stop(chain), Math.max(start(chain), s)),
    );
  }

  /** Axis point at a chain end. */
  export function end(
    chain: IAutoMovieLoftChain,
    which: "top" | "bottom",
  ): AutoMovieVector3Tuple {
    return axis(chain, which === "top" ? stop(chain) : start(chain));
  }

  /** Girth radius, perimeter / 2pi, of the section at a station clamped into the chain. */
  export function girth(chain: IAutoMovieLoftChain, s: number): number {
    const ring: AutoMovieVector3Tuple[] = AutoMovieEngineLoftChain.ring(
      chain,
      Math.min(stop(chain), Math.max(start(chain), s)),
      PHASES,
    );
    let perimeter: number = 0;
    ring.forEach((p: AutoMovieVector3Tuple, i: number): void => {
      perimeter += distance(ring[(i + 1) % ring.length]!, p);
    });
    return perimeter / (2 * Math.PI);
  }

  /** Mean height of a ring. */
  export function level(ring: AutoMovieVector3Tuple[]): number {
    return mean(ring, 1);
  }

  /** Mean of one coordinate of points. */
  export function mean(points: AutoMovieVector3Tuple[], c: number): number {
    return (
      points.reduce(
        (s: number, p: AutoMovieVector3Tuple): number => s + p[c]!,
        0,
      ) / points.length
    );
  }

  /** Euclidean distance. */
  export function distance(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Linear interpolation a + (b - a) t. */
  export function lerp(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    t: number,
  ): AutoMovieVector3Tuple {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }
}
