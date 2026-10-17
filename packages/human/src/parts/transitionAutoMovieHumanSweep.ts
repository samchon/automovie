import {
  IAutoMovieSurfaceNetwork,
  layoutAutoMovieSurfaceTransition,
} from "@automovie/engine";

import { gridAutoMovieHumanSweep } from "./gridAutoMovieHumanSweep";

/**
 * Lay the engine's quad reduction strip on a sweep's named meridians.
 *
 * The reduction topology is unchanged. `turn` maps its evenly spaced domain
 * columns onto a monotone fan: a metacarpal guide can approach its finger root
 * throughout the palm instead of shearing only in the last band. Every corner
 * and side remains an address on the defining sweep, shared by both neighbours;
 * no emitted vertex or reference mesh index is authored here.
 *
 * @param props The sweep, band, counts and shared angular address field
 * @returns One Coons patch per reduction quad and its sweep-domain corners
 */
export function transitionAutoMovieHumanSweep(props: {
  sweep: string;
  name: string;
  u: [number, number];
  start: number;
  end: number;
  rows: number;
  turn: (u: number, v: number) => number;
}): gridAutoMovieHumanSweep.IOutput {
  const patches: IAutoMovieSurfaceNetwork.ICoonsPatch[] = [];
  const corners: IAutoMovieSurfaceNetwork.IDomainPoint[][] = [];
  layoutAutoMovieSurfaceTransition(props.start, props.end, props.rows).forEach(
    (quad: Array<{ s: number; t: number }>, index: number): void => {
      const points: IAutoMovieSurfaceNetwork.IDomainPoint[] = quad.map(
        (point: {
          s: number;
          t: number;
        }): IAutoMovieSurfaceNetwork.IDomainPoint => {
          const u: number = props.u[0] + (props.u[1] - props.u[0]) * point.t;
          return { u, v: props.turn(u, point.s) };
        },
      );
      patches.push({
        type: "coons",
        name: `${props.name}.${index}`,
        sides: [0, 1, 2, 3].map(
          (side: number): IAutoMovieSurfaceNetwork.ISweepEdge => ({
            type: "sweep",
            sweep: props.sweep,
            from: points[side]!,
            to: points[(side + 1) % 4]!,
            segments: ONE,
          }),
        ) as [
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
        ],
      });
      corners.push(points);
    },
  );
  return { patches, corners };
}

/** Every source reduction quad is one declaration at all tiers. */
const ONE: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 1,
  low: 1,
  medium: 1,
  high: 1,
};
