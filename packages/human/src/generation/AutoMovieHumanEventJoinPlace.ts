import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEventJoinRing } from "./AutoMovieHumanEventJoinRing";
import { AutoMovieHumanEventJoinVector } from "./AutoMovieHumanEventJoinVector";

type Vec3 = AutoMovieHumanEventJoinVector.Vec3;
type IRing = AutoMovieHumanEventJoinRing.IRing;
const { cross, dot, norm, scale, smooth, sub } = AutoMovieHumanEventJoinVector;
const { nearest } = AutoMovieHumanEventJoinRing;

/**
 * The event join's first rule: the child's end ring moved onto the parent's
 * ring, each end point to its nearest point there, the move faded out over the
 * child's layers within {@link REACH} mm of the ring with the station slopes
 * the fade implies.
 */
export namespace AutoMovieHumanEventJoinPlace {
  /** Station reach over which the child's end-ring move fades out, mm. */
  export const REACH: number = 4;

  /** Distance past 0.5 mm over which a point leaves the parent's surface, mm. */
  export const FAR: number = 1;

  /** Child chain with its end ring moved onto the parent's, faded over its first layers. */
  export function place(
    ring: IRing,
    child: IAutoMovieHumanLoftChain,
    direction: "down" | "up",
  ): IAutoMovieHumanLoftChain {
    const k: number = direction === "down" ? child.layers.length - 1 : 0;
    const step: number = direction === "down" ? -1 : 1;
    const sc: number = child.layers[k]!.y;
    const N: number = child.order;
    const Q: number = 4 * N;
    const phases: number[] = Array.from(
      { length: Q },
      (_: unknown, i: number): number => (2 * Math.PI * i) / Q,
    );

    // World move of every end point; zero off the arcs or off the ring.
    // Consecutive end points lie near consecutive parent samples.
    let last: number | undefined;
    const moves: Vec3[] = AutoMovieHumanLoftChain.ring(child, sc, phases).map(
      (p: Vec3): Vec3 => {
        const [tau, q, distance, found] = nearest(ring, p, last);
        last = found;
        const w: number = ring.weight(tau) * (1 - smooth((distance - 0.5) / FAR));
        return scale(sub(q, p), w);
      },
    );
    if (moves.every((m: Vec3): boolean => norm(m) < 1e-6)) return child;

    // Fade over the layers within the reach, at least two besides the end.
    const second: number = k + 2 * step;
    const reach: number = Math.max(
      REACH,
      second >= 0 && second < child.layers.length
        ? 1.5 * Math.abs(child.layers[second]!.y - sc)
        : 0,
    );
    const layers: IAutoMovieHumanLoftChain.ILayer[] = child.layers.map(
      (
        layer: IAutoMovieHumanLoftChain.ILayer,
        j: number,
      ): IAutoMovieHumanLoftChain.ILayer => {
        const sigma: number = Math.abs(layer.y - sc);
        if (sigma >= reach) return layer;
        // Fade f(sigma) = 1 - smooth(sigma / reach) and its station derivative,
        // sigma growing into the child.
        const x: number = sigma / reach;
        const fade: number = 1 - smooth(x);
        const rate: number = (-6 * x * (1 - x) * step) / reach;
        const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
          child,
          layer.y,
        );
        const values: [number, number][] = moves.map(
          (m: Vec3): [number, number] => [fade * dot(m, f.u), fade * dot(m, f.v)],
        );
        const slopes: [number, number][] = moves.map(
          (m: Vec3): [number, number] => [rate * dot(m, f.u), rate * dot(m, f.v)],
        );
        const dc: number[] = AutoMovieHumanSplineCurve.project(values, N);
        const dm: number[] = AutoMovieHumanSplineCurve.project(slopes, N);

        // The law lifts sections off their planes, so part of a gap lies
        // along the frame normal and moves the lift instead.
        const normal: Vec3 = cross(f.v, f.u);
        const across: number[] = moves.map((m: Vec3): number => dot(m, normal));
        const lifted: boolean =
          layer.lift !== undefined ||
          across.some((v: number): boolean => Math.abs(v) > 1e-3);
        const dl: number[] = lifted
          ? AutoMovieHumanSplineCurve.project(
              across.map((v: number): [number, number] => [fade * v, fade * v]),
              N,
            ).slice(0, N)
          : [];
        const dr: number[] = lifted
          ? AutoMovieHumanSplineCurve.project(
              across.map((v: number): [number, number] => [rate * v, rate * v]),
              N,
            ).slice(0, N)
          : [];
        const lift: number[] = layer.lift ?? new Array<number>(N).fill(0);
        const liftSlopes: number[] =
          layer.liftSlopes ?? new Array<number>(N).fill(0);
        return {
          ...layer,
          coefficients: layer.coefficients.map(
            (v: number, i: number): number => v + dc[i]!,
          ),
          slopes:
            j === k
              ? layer.slopes
              : layer.slopes.map((v: number, i: number): number => v + dm[i]!),
          ...(lifted
            ? {
                lift: lift.map((v: number, i: number): number => v + dl[i]!),
                liftSlopes:
                  j === k
                    ? liftSlopes
                    : liftSlopes.map(
                        (v: number, i: number): number => v + dr[i]!,
                      ),
              }
            : {}),
        };
      },
    );
    return { ...child, layers };
  }
}