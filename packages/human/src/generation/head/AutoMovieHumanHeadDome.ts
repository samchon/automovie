import { AutoMovieHumanViewAxis } from "../../lofting/AutoMovieHumanViewAxis";
import type { IAutoMovieHumanViewPart } from "../../lofting/IAutoMovieHumanViewPart";

/**
 * A small part rising from its base to an apex along its own axis, drawn
 * from its views: the shared form of the face's masses (brow ridge, zygoma,
 * cheek, chin pad, jaw angle), the nose's and the lips' bodies, the auricle,
 * and of the cutters that hollow the face (orbit, temple, sulci).
 *
 * In the part's frame the axis `w` leaves the host along its outward normal
 * at the part's landmark; `u` is the footprint's long direction and
 * `v = u x w`. The base section, inside the host by `depth`, has the
 * footprint's four half extents; each extent falls to the apex along the
 * quarter super-ellipse `e(s) = e0 (1 - (s/h)^p)^(1/p)`, the part's
 * projection profile in its side views, and the apex is the part's pole.
 * Each quarter's fullness is one conic shoulder.
 */
export namespace AutoMovieHumanHeadDome {
  /** A dome's views. */
  export interface IDome {
    /** Chain name. */
    name: string;

    /** Centre of the base section, inside the host, world mm. */
    origin: [number, number, number];

    /** Unit axis out of the host. */
    outward: [number, number, number];

    /** Unit long direction of the footprint, square to `outward`. */
    along: [number, number, number];

    /** Half extents of the base along `+u`, `+v`, `-u`, `-v`, mm, positive. */
    extents: [number, number, number, number];

    /** Height from the base to the apex, mm. */
    height: number;

    /** Exponent of the projection profile, 2 for the ellipse. */
    profile: number;

    /** Conic shoulder of every quarter. */
    shoulder: number;
  }

  /** Layers from the base to the apex. */
  export const LAYERS: number = 16;

  /** Control points per section, a multiple of 4. */
  export const ORDER: number = 16;

  /** Ring samples of the emitted chain. */
  export const SAMPLES: number = 64;

  /**
   * The dome as a view part.
   *
   * @param dome Its views.
   * @returns The part, its top a pole at the apex.
   */
  export function of(dome: IDome): IAutoMovieHumanViewPart {
    const w: [number, number, number] = dome.outward;
    const u: [number, number, number] = dome.along;
    const v: [number, number, number] = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const h: number = Math.max(1e-3, dome.height);
    const stations: number[] = Array.from({ length: LAYERS + 1 }, (_: unknown, k: number): number => (h * k) / LAYERS);
    const outline = (e0: number, sign: number): IAutoMovieHumanViewPart.IOutline => ({
      knots: stations.map((s: number, k: number): IAutoMovieHumanViewPart.IKnot => ({
        site: `${dome.name}.${k}`,
        station: s,
        value: k === LAYERS ? 0 : sign * e0 * (1 - (s / h) ** dome.profile) ** (1 / dome.profile),
      })),
    });
    return {
      name: dome.name,
      axis: AutoMovieHumanViewAxis.straight(dome.origin, u, v),
      stations,
      front: { positive: outline(dome.extents[0], 1), negative: outline(dome.extents[2], -1) },
      side: { positive: outline(dome.extents[1], 1), negative: outline(dome.extents[3], -1) },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [
            { site: `${dome.name}.base`, station: 0, value: dome.shoulder },
            { site: `${dome.name}.apex`, station: h, value: dome.shoulder },
          ],
        },
      },
      pole: "top",
      order: ORDER,
      samples: SAMPLES,
    };
  }
}
