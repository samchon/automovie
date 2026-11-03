import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanPolarSection } from "../../lofting/AutoMovieHumanPolarSection";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import type { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;

/**
 * The seam at the ankle: the foot owns the ring the leg starts from, and the
 * leg reads it. The ring is the last layer of the chain `foot.<side>`; it is
 * read at the leg's phases, in the leg's polar form about its own centre, as a
 * radius and a height off its plane at each phase.
 *
 * Owner: the foot. Neighbour: the leg. The leg depends on neither the ring's
 * height rule nor the foot's own phases, only on the ring's points.
 */
export namespace AutoMovieHumanLegAnkleSeam {
  /**
   * The foot's top ring, world.
   *
   * @param calibration Calibration holding the foot chains.
   * @param side The leg's side.
   * @returns The ring at the leg's phases, one point per phase.
   */
  export function ring(calibration: IAutoMovieHumanBodyCalibration, side: "left" | "right"): Vec3[] {
    const foot: IAutoMovieHumanLoftChain = calibration.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === `foot.${side}`)!;
    return AutoMovieHumanLoftChain.ring(foot, foot.layers[foot.layers.length - 1]!.y, AutoMovieHumanLegSampling.PHASES);
  }

  /**
   * The ring's radius about a centre at each leg phase, less the leg law's own
   * radius there: the ring's difference from the law.
   *
   * @param ring The ring in the section plane, canonical, `[x, z]`.
   * @param centre The law's own centre at the ring.
   * @param radii The law's radii at the leg's phases.
   */
  export function residual(ring: readonly [number, number][], centre: readonly [number, number], radii: readonly number[]): number[] {
    return AutoMovieHumanLegSampling.PHASES.map(
      (t: number, j: number): number => AutoMovieHumanPolarSection.radius(ring, centre, t) - radii[j]!,
    );
  }

  /**
   * A ring's height off its plane at each canonical phase, read off its
   * nearest edge.
   *
   * @param ring The ring in the plane, `[x, z]`.
   * @param centre The centre the phases are read about.
   * @param world The ring's world points, one per ring point.
   * @param level Height of the plane.
   */
  export function lift(
    ring: readonly [number, number][],
    centre: readonly [number, number],
    world: readonly Vec3[],
    level: number,
  ): number[] {
    return AutoMovieHumanLegSampling.PHASES.map((t: number): number => {
      const r: number = AutoMovieHumanPolarSection.radius(ring, centre, t);
      const x: number = centre[0] + r * Math.cos(t);
      const z: number = centre[1] + r * Math.sin(t);
      let best: number = Infinity;
      let height: number = level;
      ring.forEach((p: readonly [number, number], i: number): void => {
        const k: number = (i + 1) % ring.length;
        const q: readonly [number, number] = ring[k]!;
        const ex: number = q[0] - p[0];
        const ez: number = q[1] - p[1];
        const f: number = Math.min(1, Math.max(0, ((x - p[0]) * ex + (z - p[1]) * ez) / (ex * ex + ez * ez || 1)));
        const d: number = (p[0] + f * ex - x) ** 2 + (p[1] + f * ez - z) ** 2;
        if (d < best) {
          best = d;
          height = world[i]![1] + f * (world[k]![1] - world[i]![1]);
        }
      });
      return height - level;
    });
  }
}
