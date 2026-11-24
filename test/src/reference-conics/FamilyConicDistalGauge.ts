import { AutoMovieSolidVector as V, bracketedRoot } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple as Point,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

type Jet = IAutoMovieSolidSurface.IJet;

/** Continue a skeletal meridian's physical ray onto a recentered conic. */
export namespace FamilyConicDistalGauge {
  /**
   * Prepare the angular map at the protected ring, where the shifted conic
   * must still surround the skeletal centre. The implicit equation and its
   * two derivatives keep the same directed chart on the retained stock.
   */
  export function align(
    { origin, u, v }: IAutoMovieLoftSectionFrame,
    stock: Pick<IAutoMovieLoftViewFullSource.IReader, "pointAt" | "jet">,
    mark: number,
  ): (phase: number) => (station: number) => Jet {
    const point = stock.pointAt(mark);
    return (phi: number) => {
      const c: number = Math.cos(phi), s: number = Math.sin(phi);
      const e: Point = V.combine([[c, u], [s, v]]);
      const n: Point = V.combine([[-s, u], [c, v]]);
      const residual = (theta: number): number => V.dot(V.sub(point(theta), origin), n);
      const theta: number = bracketedRoot(
        residual,
        phi - Math.PI / 2,
        phi + Math.PI / 2,
        32 * Number.EPSILON * Math.max(1, Math.abs(phi)),
      );
      const at: Jet = stock.jet(mark, theta);
      const radius: number = V.dot(V.sub(at.p, origin), e);
      const slope: number = V.dot(at.v, n);
      if (!(slope > 0 && radius > 0))
        throw new Error("The protected conic leaves the directed skeletal meridian");
      const first: number = radius / slope;
      const second: number = (
        residual(theta) + 2 * V.dot(at.v, e) * first - V.dot(at.vv, n) * first ** 2
      ) / slope;
      return (station: number): Jet => {
        const raw: Jet = station === mark ? at : stock.jet(station, theta);
        return {
          ...raw,
          v: V.scale(raw.v, first),
          uv: V.scale(raw.uv, first),
          vv: V.combine([[first ** 2, raw.vv], [second, raw.v]]),
        };
      };
    };
  }
}
