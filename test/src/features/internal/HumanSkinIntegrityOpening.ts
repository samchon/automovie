import type { IAutoMovieHumanLoftAperture } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import type { HumanSkinIntegrityTopology } from "./HumanSkinIntegrityTopology";
import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

/**
 * The openings a body declares open, and which boundary loop of a skin is the
 * margin of which opening.
 */
export namespace HumanSkinIntegrityOpening {
  /** Points at which each margin is evaluated. */
  const SAMPLES: number = 256;

  /**
   * The openings a body declares open: every aperture without a closing
   * pocket. Each margin is its own harmonic series, `[a0, a1, b1, .. aK, bK]`
   * for each of x, y and z in turn, evaluated at {@link SAMPLES} points.
   */
  export function evaluate(apertures: readonly IAutoMovieHumanLoftAperture[]): HumanSkinIntegrity.IOpening[] {
    return apertures
      .filter((a: IAutoMovieHumanLoftAperture): boolean => !((a.pocket ?? 0) > 0))
      .map((a: IAutoMovieHumanLoftAperture): HumanSkinIntegrity.IOpening => {
        // The margin as a closed polyline.
        const width: number = 2 * a.order + 1;
        const margin: Vec.V3[] = [];

        for (let s: number = 0; s < SAMPLES; s++) {
          const theta: number = (2 * Math.PI * s) / SAMPLES;
          const p: Vec.V3 = [0, 0, 0];

          for (let axis: number = 0; axis < 3; axis++) {
            const c: number[] = a.coefficients.slice(axis * width, (axis + 1) * width);
            let value: number = c[0]!;

            for (let k: number = 1; k <= a.order; k++)
              value += c[2 * k - 1]! * Math.cos(k * theta) + c[2 * k]! * Math.sin(k * theta);

            p[axis] = value;
          }

          margin.push(p);
        }

        // Its centre, the unit direction it faces and the radius it spans round that axis.
        const centre: Vec.V3 = [0, 1, 2].map(
          (axis: number): number => margin.reduce((sum: number, p: Vec.V3): number => sum + p[axis]!, 0) / margin.length,
        ) as Vec.V3;
        const length: number = Math.hypot(...a.forward);
        const forward: Vec.V3 = [a.forward[0] / length, a.forward[1] / length, a.forward[2] / length];
        const radius: number = Math.max(...margin.map((p: Vec.V3): number => Vec.radial(p, centre, forward)));

        return { name: a.name, centre, forward, radius };
      });
  }

  /**
   * The opening whose margin a boundary loop is, or -1: a closed simple loop
   * that lies within the opening's radius of its axis and of its plane and
   * winds once round the axis. An opening in `used` already has its loop.
   */
  export function declared(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    group: number[],
    openings: readonly HumanSkinIntegrity.IOpening[],
    used: Set<number>,
  ): number {
    const loop: number[] | null = topo.loop(group);

    if (loop === null) return -1;

    const points: Vec.V3[] = loop.map((v: number): Vec.V3 => Vec.at(mesh.P, v));

    for (let k: number = 0; k < openings.length; k++) {
      if (used.has(k)) continue;

      const o: HumanSkinIntegrity.IOpening = openings[k]!;

      if (points.some((p: Vec.V3): boolean => Vec.radial(p, o.centre, o.forward) > o.radius)) continue;

      if (points.some((p: Vec.V3): boolean => Math.abs(Vec.dot(Vec.sub(p, o.centre), o.forward)) > o.radius)) continue;

      if (Math.abs(Math.round(winding(points, o.centre, o.forward))) === 1) return k;
    }

    return -1;
  }

  /** The turns of a closed polygon round an axis. */
  function winding(points: Vec.V3[], centre: Vec.V3, axis: Vec.V3): number {
    const [u, w]: [Vec.V3, Vec.V3] = Vec.basis(axis);
    let total: number = 0;
    let previous: number = NaN;

    for (let k: number = 0; k <= points.length; k++) {
      // The angle of each vertex round the axis, and the shortest signed step from the last.
      const r: Vec.V3 = Vec.sub(points[k % points.length]!, centre);
      const angle: number = Math.atan2(Vec.dot(r, w), Vec.dot(r, u));

      if (!Number.isNaN(previous)) {
        let step: number = angle - previous;

        if (step > Math.PI) step -= 2 * Math.PI;

        if (step < -Math.PI) step += 2 * Math.PI;

        total += step;
      }

      previous = angle;
    }

    return total / (2 * Math.PI);
  }
}
