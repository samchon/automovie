import { AutoMovieHumanSeam } from "../../lofting/AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The foot's section arcs between junctions (the junctions' curvature channel
 * is `AutoMovieHumanFootJunction`).
 *
 * A junction's jet (place, unit tangent in the sense the ring runs, curvature
 * toward the inside) is owned by the guide that stands there; every arc on
 * either side copies it through the shared joining rule
 * (`AutoMovieHumanSeam.adopt`: `q_v = lambda T`, `q_vv = lambda^2 kappa N`),
 * so neighbouring arcs meet G2. An arc is the quintic Hermite of its two ends'
 * copied jets.
 */
export namespace AutoMovieHumanFootArc {
  /** A junction's jet in a section's plane. */
  export interface IJet {
    /** Place, `[across, up]` mm. */
    point: G.Vec2;

    /** Unit tangent in the sense the ring runs. */
    tangent: G.Vec2;

    /** Curvature toward the inside, 1/mm. */
    curvature: number;
  }

  /**
   * The arc between two jets, `count + 1` points: the quintic Hermite of
   * their places, their tangents times the arc's speed and their curvature
   * vectors times its square. The speed is the quarter ellipse's arc on the
   * ends' extents along their tangents, `pi / 4 (a + b)`.
   */
  export function quintic(j0: IJet, j1: IJet, count: number): G.Vec2[] {
    const d: G.Vec2 = [j1.point[0] - j0.point[0], j1.point[1] - j0.point[1]];
    const speed: number =
      (Math.PI / 4) *
      (Math.abs(d[0] * j0.tangent[0] + d[1] * j0.tangent[1]) + Math.abs(d[0] * j1.tangent[0] + d[1] * j1.tangent[1]));
    const arcJet = (j: IJet): IAutoMovieHumanSeam.IArcJet => ({
      point: [...j.point],
      tangent: [...j.tangent],
      curvature: [j.curvature * j.tangent[1], -j.curvature * j.tangent[0]],
    });
    const first: ReturnType<typeof AutoMovieHumanSeam.adopt> = AutoMovieHumanSeam.adopt(arcJet(j0), speed);
    const last: ReturnType<typeof AutoMovieHumanSeam.adopt> = AutoMovieHumanSeam.adopt(arcJet(j1), speed);
    const v0: number[] = first[1];
    const a0: number[] = first[2];
    const v1: number[] = last[1];
    const a1: number[] = last[2];
    return Array.from({ length: count + 1 }, (_: unknown, i: number): G.Vec2 => {
      const s: number = i / count;
      const s2: number = s * s;
      const s3: number = s2 * s;
      const s4: number = s3 * s;
      const s5: number = s4 * s;
      const h0: number = 1 - 10 * s3 + 15 * s4 - 6 * s5;
      const h1: number = s - 6 * s3 + 8 * s4 - 3 * s5;
      const h2: number = 0.5 * (s2 - 3 * s3 + 3 * s4 - s5);
      const h3: number = 0.5 * (s3 - 2 * s4 + s5);
      const h4: number = -4 * s3 + 7 * s4 - 3 * s5;
      const h5: number = 10 * s3 - 15 * s4 + 6 * s5;
      return [0, 1].map(
        (c: number): number =>
          h0 * j0.point[c]! + h1 * v0[c]! + h2 * a0[c]! + h3 * a1[c]! + h4 * v1[c]! + h5 * j1.point[c]!,
      ) as G.Vec2;
    });
  }
}
