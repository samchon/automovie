import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";

/**
 * The trunk's bottom ring as the legs read it: each leg's arc of the ring
 * published as jets by arclength (rule J1), so a leg copies its top layer's
 * point, tangent and curvature along the arc instead of reading the ring's
 * samples. The trunk owns the ring; the legs take the left arc from the front
 * pinch (phase 0) to the back pinch (phase pi) and the right arc from the
 * back pinch round to the front one.
 */
export namespace AutoMovieHumanTrunkCrotchRing {
  /** One leg's arc. */
  export interface IArc {
    /** Phases the jets are given at, radians, rising along the arc. */
    phases: number[];

    /** The jet at each phase in the section plane `[x, z]`. */
    jets: IAutoMovieHumanSeam.IArcJet[];
  }

  /** Both legs' arcs and the pinches between them. */
  export interface IRing {
    /** The left leg's arc, phase 0 to pi. */
    left: IArc;

    /** The right leg's arc, phase pi to 2 pi. */
    right: IArc;

    /** The front and back pinch phases: where the legs part. */
    pinches: [number, number];
  }

  /** Jets per arc: one per two control spans, so every knot's neighbourhood is sampled. */
  const COUNT: number = 129;

  /**
   * The ring's arcs from its section's controls.
   *
   * @param controls The crotch section's 256 controls `[x_0 .. x_255, z_0 .. z_255]`.
   * @returns Both arcs' jets and the pinch phases.
   */
  export function read(controls: readonly number[]): IRing {
    const arc = (from: number, to: number): IArc => {
      const phases: number[] = Array.from({ length: COUNT }, (_: unknown, i: number): number => from + ((to - from) * i) / (COUNT - 1));

      return {
        phases,
        jets: phases.map((t: number): IAutoMovieHumanSeam.IArcJet => {
          const j: [number, number, number, number, number, number] = AutoMovieHumanSplineCurve.jet(
            controls,
            AutoMovieHumanTrunkQuadrant.ORDER,
            t,
          );

          return AutoMovieHumanSeam.publish([j[0], j[1]], [j[2], j[3]], [j[4], j[5]]);
        }),
      };
    };

    return { left: arc(0, Math.PI), right: arc(Math.PI, 2 * Math.PI), pinches: [0, Math.PI] };
  }
}
