import { AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";

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

    /**
     * The host's least radius of curvature under the footprint, mm: the base
     * sinks by the sagitta `e^2 / (2 R)` of the footprint's longest half
     * extent `e`, which a curved host falls away by under a flat base;
     * absent, the footprint's own longest half extent (a host curving at the
     * part's own scale).
     */
    host?: number;
  }

  /** Profile exponent of a part lower than its least half extent. */
  export const SHALLOW: number = 4;

  /** Layers of the sunk stem under the base. */
  export const STEM: number = 4;

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
  export function of(dome: IDome): IAutoMovieViewPart {
    const w: [number, number, number] = dome.outward;
    const u: [number, number, number] = dome.along;
    const v: [number, number, number] = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    // A sunk stem under the base, as wide as the base, twice as deep as the
    // host falls away under the footprint (its sagitta), so the base lies
    // inside the host across the whole footprint even where the host curves
    // faster than the estimate; the stem is hidden inside the host, and the
    // dome rises from the base as before, so the part above keeps its shape.
    const sink: number = 2 * sagitta(dome);

    // A part lower than its least half extent meets its host at a shallow
    // angle near its base, under the joins' grazing bound for a groove or a
    // lip; its profile is made quartic, so its wall stands up steeply from
    // the base while its crown keeps its height.
    const profile: number = dome.height < Math.min(...dome.extents) ? Math.max(dome.profile, SHALLOW) : dome.profile;
    const origin: [number, number, number] = [dome.origin[0] - sink * w[0], dome.origin[1] - sink * w[1], dome.origin[2] - sink * w[2]];
    const rise: number = Math.max(1e-3, dome.height);
    const h: number = sink + rise;
    const stem: number[] = sink > 0 ? Array.from({ length: STEM }, (_: unknown, k: number): number => (sink * k) / STEM) : [];
    const stations: number[] = [...stem, ...Array.from({ length: LAYERS + 1 }, (_: unknown, k: number): number => sink + (rise * k) / LAYERS)];
    const outline = (e0: number, sign: number): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((s: number, k: number): IAutoMovieViewPart.IKnot => ({
        site: `${dome.name}.${k}`,
        station: s,
        value: k === stations.length - 1 ? 0 : s <= sink ? sign * e0 : sign * e0 * (1 - ((s - sink) / rise) ** profile) ** (1 / profile),
      })),
    });
    return {
      name: dome.name,
      axis: AutoMovieViewAxis.straight(origin, u, v),
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

  /**
   * The depth a curved host falls away by under the footprint's longest half
   * extent: `e^2 / (2 R)`.
   *
   * @param dome The dome.
   * @returns Depth, mm.
   */
  export function sagitta(dome: IDome): number {
    const e: number = Math.max(...dome.extents);
    const R: number = dome.host ?? e;
    return R > 0 ? (e * e) / (2 * R) : 0;
  }
}
