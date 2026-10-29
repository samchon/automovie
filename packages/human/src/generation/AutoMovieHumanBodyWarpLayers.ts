import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import { AutoMovieHumanBodyWarpPoint as P } from "./AutoMovieHumanBodyWarpPoint";

/** Retained Hermite layers, split at declared courses and transported by displacement. */
export namespace AutoMovieHumanBodyWarpLayers {
  /** A valid retained or transported chain, with invalid requests kept diagnostic. */
  export interface IOutput {
    /** Original object when no displacement is present. */
    chain: IAutoMovieHumanLoftChain;
    /** Whether the requested map had a finite increasing station representation. */
    valid: boolean;
  }
  /**
   * Move the existing control family. Inserting a plain cubic course uses
   * that same curve's exact value/slope (and scalar lift value/slope), so
   * the original family is unchanged before deformation. Framed/rich
   * intervals are not split: their neighbour-dependent plane rule differs.
   */
  export function apply(
    chain: IAutoMovieHumanLoftChain,
    field: AutoMovieHumanBodyWarpField.IField,
  ): IOutput {
    const plain: boolean = chain.layers.every(
      (l: IAutoMovieHumanLoftChain.ILayer): boolean =>
        l.frame === undefined && l.curvatures === undefined,
    );
    const source: IAutoMovieHumanLoftChain = plain
      ? split(chain, field.courses(chain.name))
      : chain;
    const moved: (IAutoMovieHumanLoftChain.ILayer | undefined)[] = source.layers.map(
      (l: IAutoMovieHumanLoftChain.ILayer): IAutoMovieHumanLoftChain.ILayer | undefined =>
        layer(source, l, field),
    );
    if (moved.some((l: IAutoMovieHumanLoftChain.ILayer | undefined): boolean =>
      l === undefined)) return { chain, valid: false };
    const layers: IAutoMovieHumanLoftChain.ILayer[] =
      moved as IAutoMovieHumanLoftChain.ILayer[];
    if (layers.every(
      (l: IAutoMovieHumanLoftChain.ILayer, i: number): boolean =>
        l === source.layers[i],
    )) return { chain, valid: true };
    if (!layers.every(
      (l: IAutoMovieHumanLoftChain.ILayer, i: number): boolean =>
        Number.isFinite(l.y) && (i === 0 || l.y > layers[i - 1]!.y),
    )) {
      field.diagnostics.push({
        name: chain.name, status: "incompatible",
        detail: "The requested station map is not increasing; this chain is retained.",
      });
      return { chain, valid: false };
    }
    return { chain: { ...chain, layers }, valid: true };
  }

  /** Exact subdivision of an unframed cubic family at explicit course addresses. */
  function split(
    chain: IAutoMovieHumanLoftChain,
    courses: readonly number[],
  ): IAutoMovieHumanLoftChain {
    const lo: number = chain.layers[0]!.y;
    const hi: number = chain.layers[chain.layers.length - 1]!.y;
    const added: IAutoMovieHumanLoftChain.ILayer[] = [];
    for (const station of new Set(courses)) {
      if (
        !(station > lo && station < hi) ||
        chain.layers.some(
          (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.y === station,
        )
      ) continue;
      const lift: number[] | null = Loft.lift(chain, station);
      added.push({
        y: station,
        coefficients: Loft.coefficients(chain, station),
        slopes: Loft.derivative(chain, station),
        ...(lift === null ? {} : {
          lift, liftSlopes: Loft.liftDerivative(chain, station)!,
        }),
      });
    }
    return added.length === 0 ? chain : {
      ...chain,
      layers: [...chain.layers, ...added].sort(
        (a: IAutoMovieHumanLoftChain.ILayer, b: IAutoMovieHumanLoftChain.ILayer): number =>
          a.y - b.y,
      ),
    };
  }

  /** Only the added displacement, expressed in the unchanged source axes. */
  interface IDelta {
    /** Change of the unframed source station. */
    y: number;
    /** Change of the source frame origin. */
    origin: P.V;
    /** Change of the section controls. */
    coefficients: number[];
    /** Change of scalar normal displacement. */
    lift: number[];
  }

  /** Sample displacement, avoiding re-projection of unchanged source geometry. */
  function delta(
    chain: IAutoMovieHumanLoftChain,
    station: number,
    framed: boolean,
    field: AutoMovieHumanBodyWarpField.IField,
  ): IDelta {
    const f: AutoMovieHumanLoftFrame.IFrame = Loft.frame(chain, station);
    const normal: P.V = P.cross(f.v, f.u);
    const c: number[] = Loft.coefficients(chain, station);
    const lift: number[] | null = Loft.lift(chain, station);
    const sourceOrigin: P.V = framed ? f.origin : Loft.axis(chain, station);
    const origin: P.V = P.sub(
      field.point(chain.name, station, sourceOrigin), sourceOrigin,
    );
    if (!framed) { origin[0] = 0; origin[2] = 0; }
    const coefficients: number[] = new Array<number>(2 * chain.order);
    const offset: number[] = new Array<number>(chain.order);
    for (let j: number = 0; j < chain.order; j++) {
      const p: P.V = P.add(f.origin, P.add(
        P.add(P.scale(f.u, c[j]!), P.scale(f.v, c[chain.order + j]!)),
        P.scale(normal, lift?.[j] ?? 0),
      ));
      const d: P.V = P.sub(
        P.sub(field.point(chain.name, station, p), p), origin,
      );
      coefficients[j] = P.dot(d, f.u);
      coefficients[chain.order + j] = P.dot(d, f.v);
      offset[j] = P.dot(d, normal);
    }
    return { y: framed ? 0 : origin[1], origin, coefficients, lift: offset };
  }

  /**
   * Preserve the source derivative and add only displacement derivatives.
   * Thus identity maps return the original layer object, including absent
   * lift, exact endpoint slopes and existing rich fields. Nonlinear point
   * maps still yield a moved-control approximation between stored layers.
   */
  function layer(
    chain: IAutoMovieHumanLoftChain,
    source: IAutoMovieHumanLoftChain.ILayer,
    field: AutoMovieHumanBodyWarpField.IField,
  ): IAutoMovieHumanLoftChain.ILayer | undefined {
    const lo: number = chain.layers[0]!.y;
    const hi: number = chain.layers[chain.layers.length - 1]!.y;
    const h: number = Math.min(0.25, (hi - lo) / 2);
    const s: number = source.y;
    const a: number = Math.max(lo, Math.min(s - h, hi - 2 * h));
    const positions: number[] = [a, a + h, a + 2 * h];
    const framed: boolean = chain.layers.some(
      (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.frame !== undefined,
    );
    const here: IDelta = delta(chain, s, framed, field);
    const probes: IDelta[] = positions.map(
      (t: number): IDelta => delta(chain, t, framed, field),
    );
    if ([here, ...probes].every(
      (d: IDelta): boolean =>
        d.y === 0 && d.origin.every((v: number): boolean => v === 0) &&
        d.coefficients.every((v: number): boolean => v === 0) &&
        d.lift.every((v: number): boolean => v === 0),
    )) return source;
    const weights: number[] = positions.map(
      (x: number, i: number): number => {
        const y: number = positions[(i + 1) % 3]!;
        const z: number = positions[(i + 2) % 3]!;
        return (2 * s - y - z) / ((x - y) * (x - z));
      },
    );
    const seconds: number[] = positions.map(
      (x: number, i: number): number =>
        2 / ((x - positions[(i + 1) % 3]!) * (x - positions[(i + 2) % 3]!)),
    );
    const rate: (pick: (d: IDelta) => number, second?: boolean) => number = (
      pick: (d: IDelta) => number, second: boolean = false,
    ): number => probes.reduce(
      (sum: number, d: IDelta, i: number): number =>
        sum + (second ? seconds : weights)[i]! * pick(d), 0,
    );
    const stationRate: number = 1 + rate((d: IDelta): number => d.y);
    const stationSecond: number = rate((d: IDelta): number => d.y, true);
    if (!(Number.isFinite(stationRate) && stationRate > 0)) {
      field.diagnostics.push({
        name: chain.name, status: "incompatible",
        detail: "The station derivative is not finite and positive; this chain is retained.",
      });
      return undefined;
    }
    const slopes: number[] = source.slopes.map(
      (v: number, k: number): number =>
        (v + rate((d: IDelta): number => d.coefficients[k]!)) / stationRate,
    );
    const lift: number[] = here.lift.map(
      (v: number, k: number): number => (source.lift?.[k] ?? 0) + v,
    );
    const liftSlopes: number[] = here.lift.map(
      (_: number, k: number): number =>
        ((source.liftSlopes?.[k] ?? 0) +
          rate((d: IDelta): number => d.lift[k]!)) / stationRate,
    );
    const result: IAutoMovieHumanLoftChain.ILayer = {
      ...source,
      y: s + here.y,
      coefficients: source.coefficients.map(
        (v: number, k: number): number => v + here.coefficients[k]!,
      ),
      slopes, lift, liftSlopes,
      ...(source.curvatures === undefined ? {} : {
        curvatures: source.curvatures.map(
          (v: number, k: number): number =>
            (v + rate((d: IDelta): number => d.coefficients[k]!, true) -
              slopes[k]! * stationSecond) / stationRate ** 2,
        ),
      }),
      ...(!framed ? {} : {
        frame: {
          ...Loft.frame(chain, s),
          origin: P.add(Loft.frame(chain, s).origin, here.origin),
        },
      }),
      ...(source.frameSlopes === undefined ? {} : {
        frameSlopes: {
          ...source.frameSlopes,
          origin: source.frameSlopes.origin.map(
            (v: number, k: number): number =>
              v + rate((d: IDelta): number => d.origin[k]!),
          ) as P.V,
        },
      }),
      ...(source.frameCurvatures === undefined ? {} : {
        frameCurvatures: {
          ...source.frameCurvatures,
          origin: source.frameCurvatures.origin.map(
            (v: number, k: number): number =>
              v + rate((d: IDelta): number => d.origin[k]!, true),
          ) as P.V,
        },
      }),
    };
    const values: number[] = [
      result.y, ...result.coefficients, ...result.slopes,
      ...(result.curvatures ?? []), ...(result.lift ?? []),
      ...(result.liftSlopes ?? []),
      ...flat(result.frameSlopes), ...flat(result.frameCurvatures),
      ...flat(result.frame),
    ];
    if (!values.every(Number.isFinite)) {
      field.diagnostics.push({
        name: chain.name, status: "invalid",
        detail: "The transported controls or derivatives are non-finite; this chain is retained.",
      });
      return undefined;
    }
    return result;
  }

  /** All physical frame components, including derivative frames. */
  function flat(frame: AutoMovieHumanLoftFrame.IFrame | undefined): number[] {
    return frame === undefined ? [] : [...frame.origin, ...frame.u, ...frame.v];
  }
}
