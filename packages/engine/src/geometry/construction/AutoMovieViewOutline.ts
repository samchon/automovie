import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieViewHermite } from "./AutoMovieViewHermite";
import { AutoMovieViewOutlineRead } from "./AutoMovieViewOutlineRead";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";
import { distanceAutoMovieViewOutline } from "./distanceAutoMovieViewOutline";
import { supportAutoMovieViewOutline } from "./supportAutoMovieViewOutline";

/**
 * The scalar source shared by lofting, origin placement and inspection: a default natural cubic or explicitly requested C2 quintic knot jets/range, in station or a selected root-distance/angle parameter. A closing part supplies its pole parameter by default and separately requires zero radial knots.
 *
 * This is the input curve, before section admission and coefficient interpolation. A natural cubic can overshoot its knots; an admitted requested range bounds only the scalar on its knot span. A moving world half-space and equality with the final loft between layers are not asserted. A source parameter endpoint may have a nonzero finite value while its station derivatives diverge. Parameter derivatives remain available there; radial zero belongs only to actual part closure.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing natural spline by default, requested shared-jet quintics only when explicit, and the published source parameter with analytic chain-rule derivatives. The two-pole parameter is 2 asin(sqrt((s-bottom)/(top-bottom))).
 * @evidence contracts/common.md#clear-and-simple-design One admission function and one reading function serve both construction and source-curve inspection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses malformed knots, missing zero pole knots and readings beyond a pole; no knot sorting, range clamp or finite derivative is invented at a singular endpoint.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the input curve from the final loft and station derivatives from parameter derivatives at a pole.
 * @evidence contracts/performance.md#efficient-algorithms Preparation uses the linear natural solve and optional linear Hermite preparation. Value/jet queries use O(log N) binary lookup for either source; combined natural readings share one interval lookup. Critical inspection visits the source once with bounded-degree root work.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepares natural curvatures and any requested quintic coefficients once for all scalar, jet and critical-station queries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A source owns one knot copy, natural spline and optional O(n) Hermite jets/coefficients; no global cache retains a part.
 */
export namespace AutoMovieViewOutline {
  /**
   * Closing stations in millimetres; absent ends remain open.
   *
   * @evidence contracts/common.md#principled-implementation Names the two possible endpoints of the published pole parameter.
   * @evidence contracts/common.md#clear-and-simple-design Optional bottom and top numbers represent open, single-pole and two-pole sources.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing means open; admission checks each declared endpoint instead of substituting one.
   * @evidence contracts/common.md#meaningful-documentation States station units and absent-end meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Endpoint data has no runtime algorithm; create owns admission.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Endpoint data coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The holding outline owns the two numbers.
   */
  export interface IEnds {
    /** Bottom closing station, when present. */
    bottom?: number;

    /** Top closing station, when present. */
    top?: number;
  }

  /**
   * An admitted source curve, independent of any emitted section.
   *
   * @evidence contracts/common.md#principled-implementation Stores the original named knots and the natural spline in their admitted station or pole parameter.
   * @evidence contracts/common.md#clear-and-simple-design One record retains source identity, span, closure and prepared scalar spline.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No surviving section, fitted points or mesh observations replace the input knots.
   * @evidence contracts/common.md#meaningful-documentation Members distinguish station domain and spline parameter and identify copied inputs.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no computation; create prepares it.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record exposes prepared state; reading reuse belongs to at and value.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its producer and caller own the knot and curvature arrays.
   */
  export interface IOutline {
    /** Named source knots, copied at admission. */
    knots: readonly IAutoMovieViewPart.IKnot[];

    /** First and last source knot stations, millimetres. */
    domain: readonly [number, number];

    /** Closing stations, copied at admission. */
    ends: Readonly<IEnds>;

    /** Admitted scalar interpolation parameter; its endpoints need not have zero values unless ends separately closes the part. */
    parameter: AutoMovieConstructionOutlineParameter | undefined;

    /** Natural spline in the admitted parameter. */
    spline: AutoMovieNaturalSpline.ISpline;

    /** Optional explicitly requested shared-jet/range quintic preparation; absent keeps the original natural cubic unchanged. */
    hermite?: AutoMovieViewHermite.ICurve;
  }

  /**
   * A source premise that failed before a spline could be prepared.
   *
   * @evidence contracts/common.md#principled-implementation Retains the existing outline or pole-knot construction contract and its input failure.
   * @evidence contracts/common.md#clear-and-simple-design A contract and detail suffice without an exception or substitute curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed source remains failed and named.
   * @evidence contracts/common.md#meaningful-documentation Identifies the contract discriminator and original input detail.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Diagnostic data has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Diagnostic data coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned strings.
   */
  export interface IFailure {
    /** Existing construction diagnostic contract. */
    contract: "outline" | "pole knot" | "pole parameter";

    /** The original premise and its input numbers. */
    detail: string;
  }

  /**
   * A finite source value and its explicitly qualified derivatives.
   *
   * @evidence contracts/common.md#principled-implementation Separates finite position from the station change of parameter, whose derivatives can be singular or exceed binary64 at a pole.
   * @evidence contracts/common.md#clear-and-simple-design One scalar reading carries both jet units and their availability status.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite jet is invented for a singular endpoint and no finite point is hidden for an unrepresentable station derivative.
   * @evidence contracts/common.md#meaningful-documentation Members state scalar units, parameter/station derivatives, absence status and tangent extension location.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Reading data has no algorithm; at produces it.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading data coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reading and its two fixed-size jets belong to the caller.
   */
  export interface IReading {
    /** Requested station, millimetres. */
    station: number;

    /** Station itself by default, otherwise the selected root/angle parameter. */
    parameter: number;

    /** Source scalar, with the outline's own units. */
    value: number;

    /** First and second derivatives in the spline parameter, including at a pole. */
    parameterJet: readonly [number, number];

    /** First and second derivatives in station, absent at a singular parameter endpoint or when their magnitude cannot be represented finitely. */
    stationJet: readonly [number, number] | null;

    /** Why the station jet is present or absent; a finite source point is not discarded for an unrepresentable derivative. */
    stationJetStatus:
      | "regular"
      | "singular-pole"
      | "singular-parameter"
      | "nonfinite";

    /** Knot-span location, parameter-tangent extension, radial closing pole, or a nonclosing singular parameter endpoint. */
    location:
      | "interior"
      | "endpoint"
      | "extension"
      | "pole"
      | "parameter-endpoint";
  }

  /**
   * Prepare the original knots, returning a named premise failure rather than a replacement curve.
   *
   * @evidence contracts/common.md#principled-implementation Admits finite ordered knots and zero radial pole knots at the source coordinate's same singular ends. An open retained end leaves that original coordinate unchanged. Explicit jet/range data alone selects shared-jet quintics through their owning validator; interval arithmetic must be representable.
   * @evidence contracts/common.md#clear-and-simple-design One admission path serves open and both pole forms and returns the existing diagnostic contract on failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sort, merge, clamp or replace malformed knots, and refuses unrepresentable parameter intervals or cubic coefficients.
   * @evidence contracts/common.md#meaningful-documentation Documents source ownership, pole units, explicit failures and the lack of a half-space guarantee.
   * @evidence contracts/performance.md#efficient-algorithms O(n) copying, admission and tridiagonal preparation, followed by one interval pass for finite polynomial arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Stores one spline whose curvature solve is reused by every value, jet and critical-station reading of the copied inputs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns O(n) copied knots and spline arrays; temporary parameter arrays belong to that preparation and no global state retains the source.
   */
  export function create(
    outline: IAutoMovieViewPart.IOutline,
    ends: Readonly<IEnds> = {},
  ): IOutline | IFailure {
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
          Number.isFinite(k.station) &&
          Number.isFinite(k.value) &&
          (i === 0 ||
            (k.station > xs[i - 1]! && k.station - xs[i - 1]! >= gap)),
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
      if (!Number.isFinite(tip) || knot.station !== tip || knot.value !== 0)
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
    const inferred: AutoMovieConstructionOutlineParameter | undefined =
      ends.bottom !== undefined && ends.top !== undefined
        ? { type: "angle", bottom: ends.bottom, top: ends.top }
        : ends.bottom !== undefined
          ? { type: "root", end: "bottom", pole: ends.bottom }
          : ends.top !== undefined
            ? { type: "root", end: "top", pole: ends.top }
            : undefined;
    const chosen: AutoMovieConstructionOutlineParameter | undefined | string =
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
        (s: number, i: number): boolean =>
          Number.isFinite(s) &&
          (i === 0 ||
            (s > parameters[i - 1]! &&
              Number.isFinite(s - parameters[i - 1]!))),
      )
    )
      return {
        contract: "outline",
        detail:
          "source parameters do not increase by finite intervals through the source knots",
      };
    const spline: AutoMovieNaturalSpline.ISpline =
      AutoMovieNaturalSpline.create(
        parameters,
        knots.map((k: IAutoMovieViewPart.IKnot): number => k.value),
      );
    if (!spline.curvatures.every(Number.isFinite))
      return {
        contract: "outline",
        detail: "the source spline has a nonfinite parameter curvature",
      };
    for (let i: number = 0; i + 1 < parameters.length; i++) {
      const h: number = parameters[i + 1]! - parameters[i]!;
      const m0: number = spline.curvatures[i]!;
      const m1: number = spline.curvatures[i + 1]!;
      if (
        ![
          (h * (m1 - m0)) / 2,
          h * m0,
          (knots[i + 1]!.value - knots[i]!.value) / h - (h * (2 * m0 + m1)) / 6,
        ].every(Number.isFinite)
      )
        return {
          contract: "outline",
          detail: `source interval ${i} has unrepresentable cubic derivative coefficients`,
        };
    }
    const requested: boolean =
      outline.range !== undefined ||
      knots.some((k: IAutoMovieViewPart.IKnot): boolean => k.jet !== undefined);
    const hermite: AutoMovieViewHermite.ICurve | string | undefined = requested
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
   * Isolated interior zero-slope stations of source spans, alongside every named knot. Constant spans have no isolated roots. Natural cubic derivative quadratics and requested quintic derivative quartics have separate bounded-degree solvers; source parameters are inverted analytically, never inferred from sections.
   *
   * @evidence contracts/common.md#principled-implementation Solves natural cubic derivative quadratics with the cancellation-avoiding q formula; explicit quintics delegate to their monotone-partition derivative-root owner. Both retain only interior roots and invert the same source parameter. These binary64 observations are not interval certificates.
   * @evidence contracts/common.md#clear-and-simple-design Returns only additional interior sampling stations; the caller already owns all named knots.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Constant spans yield no invented isolated root; no sampled fitting or extrema clamp is used.
   * @evidence contracts/common.md#meaningful-documentation States excluded knot endpoints, constant-span meaning and the numerical proof limit.
   * @evidence contracts/performance.md#efficient-algorithms One span pass plus bounded degree-four root work for requested quintics; the natural path sorts at most two roots per span. Whole-source work is O(n log n) or less, with no source-value sampling grid.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads one prepared source once; callers can retain this derived sample list while the source stays unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Natural spans return at most two roots; requested quintics can retain near-zero partition candidates, bounded by fifteen observations per span. No list is cached globally.
   */
  export function criticalStations(outline: IOutline): number[] {
    if (outline.hermite !== undefined)
      return AutoMovieViewHermite.critical(outline.hermite)
        .map((x: number): number =>
          AutoMovieViewParameter.station(outline.parameter, x),
        )
        .filter(Number.isFinite);
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
          if (Number.isFinite(s)) stations.push(s);
        }
    }
    return [...new Set(stations)].sort((a: number, b: number): number => a - b);
  }

  /**
   * Candidate support stations of slope*s+valueScale*source(s) on a closed source subdomain.
   *
   * @evidence contracts/common.md#principled-implementation Delegates analytic affine-station plus original-source differentiation to the fixed-chart support owner, retaining the actual pole sine term and binary64 critical-root limitations.
   * @evidence contracts/common.md#clear-and-simple-design One source API exposes endpoint/knot/critical candidates for a fixed affine origin; no world-frame or moving-axis interpreter is added.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace the original curve, use sampled maxima, clamp roots or claim interval-certified extrema.
   * @evidence contracts/common.md#meaningful-documentation The support owner specifies coefficient units, closed subdomain, constant-offset independence, returned candidates and numerical failures.
   * @evidence contracts/performance.md#efficient-algorithms One linear span pass with bounded-degree root work and sorting of O(n) candidates.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses this admitted source's natural/Hermite preparation and parameter inverse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only caller-owned station candidates or a failure string; retains no new state.
   */
  export function supportStations(
    outline: IOutline,
    slope: number,
    valueScale: number = 1,
    domain: readonly [number, number] = outline.domain,
  ): number[] | string {
    return supportAutoMovieViewOutline(outline, slope, valueScale, domain);
  }

  /**
   * Candidate stations for squared distance from the original scalar graph to a fixed point in the same orthonormal chart and length units.
   *
   * @evidence contracts/common.md#principled-implementation Delegates differentiation of (station-targetStation)^2+(source-targetValue)^2 in the original station/root parameter; the caller establishes the fixed chart and common units.
   * @evidence contracts/common.md#clear-and-simple-design One scalar-graph query returns closed-domain endpoints, named knots and numerical critical candidates without interpreting a world frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Angle parameters fail explicitly; moving frames and general three-dimensional compositions are outside this scalar signature. No source fitting, clamping or certified maximum is substituted.
   * @evidence contracts/common.md#meaningful-documentation The distance owner states the target/domain units, singleton meaning, polynomial degrees and binary64 limits.
   * @evidence contracts/performance.md#efficient-algorithms Visits n source spans with degree at most nine root work, then sorts O(n) candidates in O(n log n); the distance owner states the bounded per-span root cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted natural/Hermite coefficients and the exact source parameter inverse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns an invocation-owned station list or failure string and retains no new state.
   */
  export function distanceStations(
    outline: IOutline,
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
   * Value-only source reading for production callers that need no derivative or reading record.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same admitted natural or requested quintic source as at, including exact radial pole zeros and parameter-tangent extension at an open end.
   * @evidence contracts/common.md#clear-and-simple-design A scalar or explicit failure avoids constructing a jet record for lofting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-domain and nonfinite values remain failures; no range or endpoint-neighbour clamp is applied.
   * @evidence contracts/common.md#meaningful-documentation States the value-only use and the shared source semantics.
   * @evidence contracts/performance.md#efficient-algorithms One O(log n) natural or prepared-quintic lookup, with no derivative work, arrays or reading record on a successful query.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted spline and shared parameter/value helpers; changing knots requires a new preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing and returns a scalar or failure string.
   */
  export function value(outline: IOutline, station: number): number | string {
    return AutoMovieViewOutlineRead.value(outline, station);
  }

  /**
   * Read the original curve and analytic scalar jets; outside a closing domain returns its premise failure.
   *
   * @evidence contracts/common.md#principled-implementation Reads the shared natural or requested quintic scalar and analytic parameter derivatives, applying the exact first/second chain rule for root/angle parameters.
   * @evidence contracts/common.md#clear-and-simple-design One qualified reading supplies both parameter and station jets; value serves callers needing only a scalar.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pole station jets are absent, overflowing jets are named nonfinite, and a finite value is retained; no finite-difference derivative or substituted point is used.
   * @evidence contracts/common.md#meaningful-documentation Documents derivative units, pole status and source versus final-loft meaning.
   * @evidence contracts/performance.md#efficient-algorithms One combined O(log n) natural lookup or two O(log n) quintic searches supply value and derivatives. An exact pole keeps its input zero and only reads parameter derivatives.
   * @evidence contracts/performance.md#reuse-equivalent-work Natural value and derivatives share a selected interval; all readers retain the original curvature/parameter preparation without a mutable query cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one fixed-size reading and jets, retaining no previous query.
   */
  export function at(outline: IOutline, station: number): IReading | string {
    return AutoMovieViewOutlineRead.at(outline, station);
  }

  /**
   * Convert source units without changing the interpolation coordinate or scalar meaning.
   *
   * @evidence contracts/common.md#principled-implementation Scales stations and parameter endpoints together; values, normalized jets and range bounds use their scalar factor. A negative scalar factor exchanges lower/upper bounds, preserving the same source under unit conversion.
   * @evidence contracts/common.md#clear-and-simple-design One conversion owner serves tree-to-kernel and kernel-to-tree source records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves site identities and the declared parameter; no station sampling or implicit radial zero is introduced.
   * @evidence contracts/common.md#meaningful-documentation States independent station/value scales and finite-factor premise.
   * @evidence contracts/performance.md#efficient-algorithms O(n) knot copying and constant parameter conversion.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Converts one record once, with no effectful work to share.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh source knots and a copied parameter; no input object is retained.
   */
  export function scale(
    outline: IAutoMovieViewPart.IOutline,
    stationScale: number,
    valueScale: number,
  ): IAutoMovieViewPart.IOutline {
    if (
      !(
        Number.isFinite(stationScale) &&
        stationScale > 0 &&
        Number.isFinite(valueScale)
      )
    )
      throw new Error(
        "outline unit conversion needs finite factors and a positive station scale",
      );
    const p: AutoMovieConstructionOutlineParameter | undefined =
      outline.parameter;
    const converted: AutoMovieConstructionOutlineParameter | undefined =
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
