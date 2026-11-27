import type { IAutoMovieSolidSurface } from "@automovie/interface";

import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";

/** Pre-evaluation admission of solver trials to an actually owned chart. */
export namespace AutoMovieEngineSolidDomain {
  /**
   * Chart membership without evaluating the surface: the bounded first
   * coordinate within its domain; the second coordinate is unbounded.
   */
  export function contains(
    surface: IAutoMovieSolidSurface,
    u: number,
  ): boolean {
    const bounds: [number, number] | undefined = surface.domain;
    return bounds === undefined || (u >= bounds[0] && u <= bounds[1]);
  }

  /** One admissible physical2 trial, or null before an unavailable evaluation. */
  export function jet(
    surface: IAutoMovieSolidSurface,
    u: number,
    v: number,
  ): IAutoMovieSolidSurface.IJet | null {
    if (!contains(surface, u)) return null;
    try {
      const value: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
      const rows: number[][] = [
        value.p,
        value.u,
        value.v,
        value.uu,
        value.uv,
        value.vv,
      ];
      const copied: [number, number, number][] = [];
      for (const row of rows) {
        if (row.length !== 3) return null;
        const owned: [number, number, number] = [0, 0, 0];
        for (let index: number = 0; index < 3; index++) {
          const component: number = row[index]!;
          owned[index] = component;
        }
        copied.push(owned);
      }
      return {
        p: copied[0]!,
        u: copied[1]!,
        v: copied[2]!,
        uu: copied[3]!,
        uv: copied[4]!,
        vv: copied[5]!,
      };
    } catch (error: unknown) {
      if (error instanceof AutoMovieEngineLoftAdmissionError) return null;
      throw error;
    }
  }
}
