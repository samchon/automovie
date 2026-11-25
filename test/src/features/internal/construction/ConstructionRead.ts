import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTrim,
} from "@automovie/interface";

/**
 * Lookups into a realized construction by the names its tree gave: a face's
 * surface by its view part's or join's name, a join by its name (its blend
 * chain's), a trim by the face it cuts.
 *
 * Each returns the realization's own object, or throws naming what is missing,
 * so a spec test that reads a part the realization left out fails with the
 * part's name rather than with an undefined value.
 */
export namespace ConstructionRead {
  /** A face's surface by its name. */
  export function surface(
    r: Omit<IAutoMovieConstructionRealization.IRealization, "mesh">,
    name: string,
  ): IAutoMovieSolidSurface {
    const found: IAutoMovieSolidSurface | undefined = r.surfaces.find(
      (s: IAutoMovieSolidSurface): boolean => s.name === name,
    );
    if (found === undefined)
      throw new Error(
        `the realization has no surface named ${name} (${r.surfaces.map((s: IAutoMovieSolidSurface): string => s.name).join(", ")})`,
      );
    return found;
  }

  /** Every surface by its name. */
  export function surfaces(
    r: IAutoMovieConstructionRealization.IRealization,
  ): Map<string, IAutoMovieSolidSurface> {
    return new Map(
      r.surfaces.map(
        (s: IAutoMovieSolidSurface): [string, IAutoMovieSolidSurface] => [
          s.name,
          s,
        ],
      ),
    );
  }

  /** A join by its name, the name of its blend's chain. */
  export function join(
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
  ): IAutoMovieConstructionRealization.IJoin {
    const found: IAutoMovieConstructionRealization.IJoin | undefined =
      r.joins.find(
        (j: IAutoMovieConstructionRealization.IJoin): boolean =>
          j.blend.chain.name === name,
      );
    if (found === undefined)
      throw new Error(`the realization has no join named ${name}`);
    return found;
  }

  /** The trim cut in a face. */
  export function trim(
    r: Omit<IAutoMovieConstructionRealization.IRealization, "mesh">,
    face: string,
  ): IAutoMovieSolidTrim.ITrim {
    const found: IAutoMovieSolidTrim.ITrim | undefined = r.trims.find(
      (t: IAutoMovieSolidTrim.ITrim): boolean => t.surface === face,
    );
    if (found === undefined)
      throw new Error(`the realization has no trim in ${face}`);
    return found;
  }

  /**
   * A realized surface read in metres: the realization's surfaces are in the
   * kernel's millimetres (station `u` and point), so this view calls the
   * surface at `1000 u` and scales its jet back: the point and the phase
   * derivatives by 1/1000, the station derivatives as the chain rule gives
   * (`p_u` unchanged, `p_uu` times 1000, `p_uv` unchanged).
   */
  export function metres(
    surface: IAutoMovieSolidSurface,
  ): IAutoMovieSolidSurface {
    return {
      ...surface,
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
        const j: IAutoMovieSolidSurface.IJet = surface.jet(1000 * u, v);
        const k: (
          a: readonly number[],
          f: number,
        ) => [number, number, number] = (
          a: readonly number[],
          f: number,
        ): [number, number, number] => [a[0]! * f, a[1]! * f, a[2]! * f];
        return {
          p: k(j.p, 1e-3),
          u: k(j.u, 1),
          v: k(j.v, 1e-3),
          uu: k(j.uu, 1e3),
          uv: k(j.uv, 1),
          vv: k(j.vv, 1e-3),
        };
      },
    };
  }

  /** A join's traced curve points in metres (the kernel traces in millimetres). */
  export function seam(
    j: IAutoMovieConstructionRealization.IJoin,
  ): [number, number, number][] {
    return j.join.curve.points.map(
      (q: { point: readonly number[] }): [number, number, number] => [
        q.point[0]! / 1000,
        q.point[1]! / 1000,
        q.point[2]! / 1000,
      ],
    );
  }

  /** The diagnostics as `node contract: detail` lines, for a failure message. */
  export function diagnostics(
    r: IAutoMovieConstructionRealization.IRealization,
  ): string {
    return r.diagnostics
      .map(
        (d: { node: string; contract: string; detail: string }): string =>
          `${d.node} ${d.contract}: ${d.detail}`,
      )
      .join("; ");
  }
}
