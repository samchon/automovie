import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * How the skeleton reads the chains it stands in: a chain's first and last
 * stations, its axis point clamped into it, its girth radius at a station,
 * the mean height of a ring, and the point arithmetic these use, in
 * calibration millimetres.
 */
export namespace AutoMovieHumanSkeletonChain {
  /** Point or vector, mm. */
  export type Vec3 = [number, number, number];

  /** Phases sampling a section for perimeters and extremities. */
  export const PHASES: number[] = Array.from(
    { length: 96 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 96,
  );

  /** Samples of a ring's arc. */
  export const RING: number = 512;

  /** First station of a chain. */
  export function start(chain: IAutoMovieHumanLoftChain): number {
    return chain.layers[0]!.y;
  }

  /** Last station of a chain. */
  export function stop(chain: IAutoMovieHumanLoftChain): number {
    return chain.layers[chain.layers.length - 1]!.y;
  }

  /** Axis point at a station, clamped into the chain. */
  export function axis(chain: IAutoMovieHumanLoftChain, s: number): Vec3 {
    return AutoMovieHumanLoftChain.axis(
      chain,
      Math.min(stop(chain), Math.max(start(chain), s)),
    );
  }

  /** Axis point at a chain end. */
  export function end(chain: IAutoMovieHumanLoftChain, which: "top" | "bottom"): Vec3 {
    return axis(chain, which === "top" ? stop(chain) : start(chain));
  }

  /** Girth radius, perimeter / 2pi, of the section at a station clamped into the chain. */
  export function girth(chain: IAutoMovieHumanLoftChain, s: number): number {
    const ring: Vec3[] = AutoMovieHumanLoftChain.ring(
      chain,
      Math.min(stop(chain), Math.max(start(chain), s)),
      PHASES,
    );
    let perimeter: number = 0;
    ring.forEach((p: Vec3, i: number): void => {
      perimeter += distance(ring[(i + 1) % ring.length]!, p);
    });
    return perimeter / (2 * Math.PI);
  }

  /** Mean height of a ring. */
  export function level(ring: Vec3[]): number {
    return mean(ring, 1);
  }

  /** Mean of one coordinate of points. */
  export function mean(points: Vec3[], c: number): number {
    return points.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / points.length;
  }

  /** Euclidean distance. */
  export function distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Linear interpolation a + (b - a) t. */
  export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }
}