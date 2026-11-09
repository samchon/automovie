import type {
  IAutoMovieConstructionKnownPortSource,
  IAutoMovieSolidSurface,
} from "@automovie/engine";

/**
 * Independent plane/cylinder originals for a closed known-port analytic oracle.
 *
 * The retained plane is outside radius2 at y=0. The retained cylinder has
 * radius1 and y>=0; its actual original neighborhood extends to y=-1.
 * Original maps read plane radius2-w and cylinder stationw-1. The resulting
 * band has radius2-w+y(w), with y=-10w³+25w⁴-21w⁵+6w⁶. Its radius decreases
 * strictly before w=1, while at w=1 its vertical tangent is1. Consequently
 * this example is regular and injective modulo its declared angular period;
 * finite mesh observations do not supply that continuum argument.
 */
export namespace ConstructionKnownPortCircular {
  /** Actual independent original fields and maps, with no completed loft or contact search. */
  export function create(): IAutoMovieConstructionKnownPortSource {
    const parent: IAutoMovieSolidSurface = {
      name: "original.plane",
      domain: [-3, 3],
      orientation: -1,
      point: (a: number, b: number): [number, number, number] => [a, 0, b],
      jet: (a: number, b: number): IAutoMovieSolidSurface.IJet => ({
        p: [a, 0, b],
        u: [1, 0, 0],
        v: [0, 0, 1],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      }),
    };
    const child: IAutoMovieSolidSurface = {
      name: "original.cylinder",
      domain: [-1, 1],
      period: 2 * Math.PI,
      orientation: 1,
      point: (a: number, b: number): [number, number, number] => [
        Math.cos(b),
        a,
        Math.sin(b),
      ],
      jet: (a: number, b: number): IAutoMovieSolidSurface.IJet => ({
        p: [Math.cos(b), a, Math.sin(b)],
        u: [0, 1, 0],
        v: [-Math.sin(b), 0, Math.cos(b)],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-Math.cos(b), 0, -Math.sin(b)],
      }),
    };
    const plane: IAutoMovieConstructionKnownPortSource.IMap = {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (t: number, w: number): [number, number] => [
        (2 - w) * Math.cos(t),
        (2 - w) * Math.sin(t),
      ],
      jet: (
        t: number,
        w: number,
      ): IAutoMovieConstructionKnownPortSource.IJet => ({
        p: [(2 - w) * Math.cos(t), (2 - w) * Math.sin(t)],
        u: [-(2 - w) * Math.sin(t), (2 - w) * Math.cos(t)],
        v: [-Math.cos(t), -Math.sin(t)],
        uu: [-(2 - w) * Math.cos(t), -(2 - w) * Math.sin(t)],
        uv: [Math.sin(t), -Math.cos(t)],
        vv: [0, 0],
      }),
    };
    const cylinder: IAutoMovieConstructionKnownPortSource.IMap = {
      domain: [0, 2 * Math.PI],
      transverse: [0, 1],
      point: (t: number, w: number): [number, number] => [w - 1, t],
      jet: (
        t: number,
        w: number,
      ): IAutoMovieConstructionKnownPortSource.IJet => ({
        p: [w - 1, t],
        u: [0, 1],
        v: [1, 0],
        uu: [0, 0],
        uv: [0, 0],
        vv: [0, 0],
      }),
    };
    return {
      definition: {
        name: "known.circular",
        domain: [0, 2 * Math.PI],
        period: 2 * Math.PI,
        orientation: -1,
        parent: {
          field: "plane",
          map: "plane",
          boundary: "plane.port",
          material: "plane.material",
          binding: "skin.binding",
        },
        child: {
          field: "cylinder",
          map: "cylinder",
          boundary: "cylinder.port",
          material: "cylinder.material",
          binding: "skin.binding",
        },
      },
      fields: new Map([
        ["plane", parent],
        ["cylinder", child],
      ]),
      maps: new Map([
        ["plane", plane],
        ["cylinder", cylinder],
      ]),
    };
  }

  /** Closed-form differentiation of the stated radial/vertical polynomials, in kernel (w,t). */
  export function oracle(w: number, t: number): IAutoMovieSolidSurface.IJet {
    const y: number = -10 * w ** 3 + 25 * w ** 4 - 21 * w ** 5 + 6 * w ** 6;
    const dy: number = -30 * w ** 2 + 100 * w ** 3 - 105 * w ** 4 + 36 * w ** 5;
    const ddy: number = -60 * w + 300 * w ** 2 - 420 * w ** 3 + 180 * w ** 4;
    const r: number = 2 - w + y;
    const dr: number = dy - 1;
    const c: number = Math.cos(t);
    const s: number = Math.sin(t);
    return {
      p: [r * c, y, r * s],
      u: [dr * c, dy, dr * s],
      v: [-r * s, 0, r * c],
      uu: [ddy * c, ddy, ddy * s],
      uv: [-dr * s, 0, dr * c],
      vv: [-r * c, 0, -r * s],
    };
  }

  /** Reverse both rail ownership and the actual transverse map, preserving the physical outward side. */
  export function inverse(
    source: IAutoMovieConstructionKnownPortSource,
  ): IAutoMovieConstructionKnownPortSource {
    const maps: Map<string, IAutoMovieConstructionKnownPortSource.IMap> =
      new Map();
    for (const [key, map] of source.maps)
      maps.set(key, {
        domain: map.domain,
        transverse: map.transverse,
        point: (t: number, w: number): [number, number] => map.point(t, 1 - w),
        jet: (
          t: number,
          w: number,
        ): IAutoMovieConstructionKnownPortSource.IJet | null => {
          const value: IAutoMovieConstructionKnownPortSource.IJet | null =
            map.jet(t, 1 - w);
          return value === null
            ? null
            : {
                ...value,
                v: [-value.v[0], -value.v[1]],
                uv: [-value.uv[0], -value.uv[1]],
              };
        },
      });
    return {
      fields: source.fields,
      maps,
      definition: {
        ...structuredClone(source.definition),
        name: source.definition.name + ".inverse",
        parent: { ...source.definition.child },
        child: { ...source.definition.parent },
        orientation: source.definition.orientation === 1 ? -1 : 1,
      },
    };
  }

  /** The same exact original fields under an offset/scaled clock, with every chain-rule order retained. */
  export function clock(
    source: IAutoMovieConstructionKnownPortSource,
    domain: [number, number],
  ): IAutoMovieConstructionKnownPortSource {
    const factor: number = (2 * Math.PI) / (domain[1] - domain[0]);
    const maps: Map<string, IAutoMovieConstructionKnownPortSource.IMap> =
      new Map();
    const scale: (pair: [number, number], k: number) => [number, number] = (
      pair: [number, number],
      k: number,
    ): [number, number] => [k * pair[0], k * pair[1]];
    for (const [key, map] of source.maps)
      maps.set(key, {
        domain,
        transverse: map.transverse,
        point: (t: number, w: number): [number, number] =>
          map.point((t - domain[0]) * factor, w),
        jet: (
          t: number,
          w: number,
        ): IAutoMovieConstructionKnownPortSource.IJet | null => {
          const value: IAutoMovieConstructionKnownPortSource.IJet | null =
            map.jet((t - domain[0]) * factor, w);
          return value === null
            ? null
            : {
                ...value,
                u: scale(value.u, factor),
                uu: scale(value.uu, factor * factor),
                uv: scale(value.uv, factor),
              };
        },
      });
    return {
      fields: source.fields,
      maps,
      definition: {
        ...structuredClone(source.definition),
        name: source.definition.name + `.clock.${domain[0]}.${domain[1]}`,
        domain,
        period: domain[1] - domain[0],
      },
    };
  }
}
