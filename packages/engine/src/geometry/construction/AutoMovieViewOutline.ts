import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewHermite,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE } from "./AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE";
import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieViewHermite } from "./AutoMovieViewHermite";
import { AutoMovieViewOutlineRead } from "./AutoMovieViewOutlineRead";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";
import { distanceAutoMovieViewOutline } from "./distanceAutoMovieViewOutline";
import { supportAutoMovieViewOutline } from "./supportAutoMovieViewOutline";

/**
 * The scalar source shared by lofting, origin placement and inspection: a
 * default natural cubic or explicitly requested C2 quintic knot jets/range, in
 * station or a selected root-distance/angle parameter. A closing part supplies
 * its pole parameter by default and separately requires zero radial knots.
 *
 * This is the input curve, before section admission and coefficient
 * interpolation. A natural cubic can overshoot its knots; an admitted requested
 * range bounds only the scalar on its knot span. A moving world half-space and
 * equality with the final loft between layers are not asserted. A source
 * parameter endpoint may have a nonzero finite value while its station
 * derivatives diverge. Parameter derivatives remain available there; radial
 * zero belongs only to actual part closure.
 */
export namespace AutoMovieViewOutline {
  /**
   * Prepare the original knots, returning a named premise failure rather than a
   * replacement curve.
   */
  export function create(
    outline: IAutoMovieViewPart.IOutline,
    ends: Readonly<IAutoMovieViewOutline.IEnds> = {},
  ): IAutoMovieViewOutline.IOutline | IAutoMovieViewOutline.IFailure {
    const knots: IAutoMovieViewPart.IKnot[] = outline.knots.map(
      (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
        ...k,
        ...(k.jet === undefined ? {} : { jet: { ...k.jet } }),
      }),
    );
    const xs: number[] = knots.map(
      (k: IAutoMovieViewPart.IKnot): number => k.station,
    );
    const gap: number = AutoMovieLoftContract.splineGap(xs);
    if (
      knots.length < 2 ||
      !knots.every(
        (k: IAutoMovieViewPart.IKnot, i: number): boolean =>
          i === 0 || (k.station > xs[i - 1]! && k.station - xs[i - 1]! >= gap),
      )
    )
      return {
        contract: "outline",
        detail: `knots ${knots.map((k: IAutoMovieViewPart.IKnot): string => `${k.site}@${k.station}=${k.value}`).join(", ")} are not at least two finite values by strictly increasing station`,
      };
    for (const end of ["bottom", "top"] as const) {
      const tip: number | undefined = ends[end];
      if (tip === undefined) continue;
      const knot: IAutoMovieViewPart.IKnot =
        end === "bottom" ? knots[0]! : knots[knots.length - 1]!;
      if (
        knot.station !== tip ||
        !(
          Math.abs(knot.value) <=
          AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE *
            Math.max(
              ...knots.map((k: IAutoMovieViewPart.IKnot): number =>
                Math.abs(k.value),
              ),
            )
        )
      )
        return {
          contract: "pole knot",
          detail: `its ${end} knot ${knot.site}@${knot.station}=${knot.value} is not 0 at the finite pole station ${tip}`,
        };
    }
    if (
      ends.bottom !== undefined &&
      ends.top !== undefined &&
      !(ends.top > ends.bottom)
    )
      return {
        contract: "pole knot",
        detail: "the top pole does not stand above the bottom pole",
      };
    const inferred: IAutoMovieConstructionOutlineParameter | undefined =
      ends.bottom !== undefined && ends.top !== undefined
        ? { type: "angle", bottom: ends.bottom, top: ends.top }
        : ends.bottom !== undefined
          ? { type: "root", end: "bottom", pole: ends.bottom }
          : ends.top !== undefined
            ? { type: "root", end: "top", pole: ends.top }
            : undefined;
    const chosen: IAutoMovieConstructionOutlineParameter | undefined | string =
      AutoMovieViewParameter.prepare(outline.parameter ?? inferred);
    if (typeof chosen === "string")
      return { contract: "outline", detail: chosen };
    if (inferred !== undefined && outline.parameter !== undefined) {
      const same: boolean =
        chosen?.type === "angle"
          ? (ends.bottom === undefined || chosen.bottom === ends.bottom) &&
            (ends.top === undefined || chosen.top === ends.top)
          : chosen?.type === "root" &&
            inferred.type === "root" &&
            chosen.end === inferred.end &&
            chosen.pole === inferred.pole;
      if (!same)
        return {
          contract: "pole parameter",
          detail:
            "the explicit source parameter does not match the closing part's pole parameter",
        };
    }
    const parameters: number[] = xs.map((s: number): number =>
      AutoMovieViewParameter.at(chosen, s),
    );
    if (
      !parameters.every(
        (s: number, i: number): boolean => i === 0 || s > parameters[i - 1]!,
      )
    )
      return {
        contract: "outline",
        detail: "source parameters do not increase through the source knots",
      };
    const spline: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
      parameters,
      knots.map((k: IAutoMovieViewPart.IKnot): number => k.value),
    );

    const requested: boolean =
      outline.range !== undefined ||
      knots.some((k: IAutoMovieViewPart.IKnot): boolean => k.jet !== undefined);
    const hermite: IAutoMovieViewHermite.ICurve | string | undefined = requested
      ? AutoMovieViewHermite.create(spline, knots, outline.range)
      : undefined;
    if (typeof hermite === "string")
      return { contract: "outline", detail: hermite };
    return {
      knots,
      domain: [xs[0]!, xs[xs.length - 1]!],
      ends: { ...ends },
      parameter: chosen,
      spline,
      ...(hermite === undefined ? {} : { hermite }),
    };
  }

  /**
   * Isolated interior zero-slope stations of source spans, alongside every
   * named knot. Constant spans have no isolated roots. Natural cubic derivative
   * quadratics and requested quintic derivative quartics have separate
   * bounded-degree solvers; source parameters are inverted analytically, never
   * inferred from sections.
   */
  export function criticalStations(
    outline: IAutoMovieViewOutline.IOutline,
  ): number[] {
    if (outline.hermite !== undefined)
      return AutoMovieViewHermite.critical(outline.hermite).map(
        (x: number): number =>
          AutoMovieViewParameter.station(outline.parameter, x),
      );
    const { xs, ys, curvatures } = outline.spline;
    const stations: number[] = [];
    for (let i: number = 0; i + 1 < xs.length; i++) {
      const h: number = xs[i + 1]! - xs[i]!;
      const raw: [number, number, number] = [
        (h * (curvatures[i + 1]! - curvatures[i]!)) / 2,
        h * curvatures[i]!,
        (ys[i + 1]! - ys[i]!) / h -
          (h * (2 * curvatures[i]! + curvatures[i + 1]!)) / 6,
      ];
      const scale: number = Math.max(...raw.map(Math.abs));
      if (scale === 0) continue;
      const [a, b, c]: number[] = raw.map((x: number): number => x / scale);
      const roots: number[] = [];
      if (a === 0) {
        if (b !== 0) roots.push(-c! / b!);
      } else {
        const discriminant: number = b! * b! - 4 * a! * c!;
        if (discriminant < 0) continue;
        const q: number =
          -(b! + (b! < 0 ? -1 : 1) * Math.sqrt(discriminant)) / 2;
        if (q === 0) roots.push(-b! / (2 * a!));
        else roots.push(q / a!, c! / q);
      }
      for (const root of roots)
        if (root > 0 && root < 1) {
          const x: number = xs[i]! + root * h;
          const s: number = AutoMovieViewParameter.station(
            outline.parameter,
            x,
          );
          stations.push(s);
        }
    }
    return [...new Set(stations)].sort((a: number, b: number): number => a - b);
  }

  /**
   * Candidate support stations of slope_s+valueScale_source(s) on a closed
   * source subdomain.
   */
  export function supportStations(
    outline: IAutoMovieViewOutline.IOutline,
    slope: number,
    valueScale: number = 1,
    domain: readonly [number, number] = outline.domain,
  ): number[] | string {
    return supportAutoMovieViewOutline(outline, slope, valueScale, domain);
  }

  /**
   * Candidate stations for squared distance from the original scalar graph to a
   * fixed point in the same orthonormal chart and length units.
   */
  export function distanceStations(
    outline: IAutoMovieViewOutline.IOutline,
    targetStation: number,
    targetValue: number,
    domain: readonly [number, number],
  ): number[] | string {
    return distanceAutoMovieViewOutline(
      outline,
      targetStation,
      targetValue,
      domain,
    );
  }

  /**
   * Value-only source reading for production callers that need no derivative or
   * reading record.
   */
  export function value(
    outline: IAutoMovieViewOutline.IOutline,
    station: number,
  ): number | string {
    return AutoMovieViewOutlineRead.value(outline, station);
  }

  /**
   * Read the original curve and analytic scalar jets; outside a closing domain
   * returns its premise failure.
   */
  export function at(
    outline: IAutoMovieViewOutline.IOutline,
    station: number,
  ): IAutoMovieViewOutline.IReading | string {
    return AutoMovieViewOutlineRead.at(outline, station);
  }

  /**
   * Convert source units without changing the interpolation coordinate or
   * scalar meaning.
   */
  export function scale(
    outline: IAutoMovieViewPart.IOutline,
    stationScale: number,
    valueScale: number,
  ): IAutoMovieViewPart.IOutline {
    if (!(stationScale > 0))
      throw new Error("outline unit conversion needs a positive station scale");
    const p: IAutoMovieConstructionOutlineParameter | undefined =
      outline.parameter;
    const converted: IAutoMovieConstructionOutlineParameter | undefined =
      p === undefined
        ? undefined
        : p.type === "root"
          ? { ...p, pole: p.pole * stationScale }
          : {
              ...p,
              bottom: p.bottom * stationScale,
              top: p.top * stationScale,
            };
    const range: IAutoMovieViewPart.IOutline["range"] =
      outline.range === undefined
        ? undefined
        : valueScale >= 0
          ? {
              minimum:
                outline.range.minimum === null
                  ? null
                  : outline.range.minimum * valueScale,
              maximum:
                outline.range.maximum === null
                  ? null
                  : outline.range.maximum * valueScale,
            }
          : {
              minimum:
                outline.range.maximum === null
                  ? null
                  : outline.range.maximum * valueScale,
              maximum:
                outline.range.minimum === null
                  ? null
                  : outline.range.minimum * valueScale,
            };
    return {
      knots: outline.knots.map(
        (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
          site: k.site,
          station: k.station * stationScale,
          value: k.value * valueScale,
          ...(k.jet === undefined
            ? {}
            : {
                jet: {
                  first: k.jet.first === null ? null : k.jet.first * valueScale,
                  second:
                    k.jet.second === null ? null : k.jet.second * valueScale,
                },
              }),
        }),
      ),
      ...(converted === undefined ? {} : { parameter: converted }),
      ...(range === undefined ? {} : { range }),
    };
  }
}
