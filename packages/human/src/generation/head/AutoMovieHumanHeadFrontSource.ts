import { AutoMovieViewOutline, type AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/** A station identity, without a surrogate source value. */
type Site = Pick<IAutoMovieViewPart.IKnot, "site" | "station">;

/**
 * The head's actual front scalar, composed in one crown-root clock.
 * The neck's source and the independently prepared upper head own the
 * bridge's endpoint jets. Clinical C is a population tangent construction,
 * not an additional individual skin point or an invented flat skin jet.
 *
 * @evidence contracts/common.md#principled-implementation Reuses engine scalar preparations and their actual parameter jets; complete shared-jet restrictions preserve each cubic/quintic span in the same clock.
 * @evidence contracts/common.md#clear-and-simple-design One author returns the original front outline consumed by the mass, its section constraints and the production view.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no fitted mesh, private loft, derivative estimate, clinical-point clamp or failed-source fallback.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the source's geometric handover, original clock and anatomical endpoints from cohort means.
 * @evidence contracts/performance.md#efficient-algorithms Three bounded scalar preparations and one pass through the existing stations replace repeated profile handovers.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrows the prepared neck radius and actual axis; the upper and bridge sources each prepare once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every preparation is call-owned; only numeric original knots escape, without a cache or retained callback.
 */
export namespace AutoMovieHumanHeadFrontSource {
  /**
   * Compose the retained lower source, one regular bridge and the upper head.
   * The upper scalar is the original root-parameter spline of its anatomical
   * values, not an asserted exact replay of the analytic median between knots.
   *
   * @param plan Shared layout in calibration mm.
   * @param axis Actual original level-plane origin and basis.
   * @param sites Complete increasing mass stations with their original ids.
   * @param radius Already prepared actual neck source; absent only on a layout without neck curves.
   * @returns One source with complete normalized parameter jets at every knot.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual endpoint jets from the two owning scalar fields, joins them in the identical root clock and scales jets by the complete output span and its square.
   * @evidence contracts/common.md#clear-and-simple-design The returned declaration is the sole front scalar for original viewing, native sections and lofting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No population C point, physical-pole derivative, surrogate curve or independent natural derivative is inserted into the composed field.
   * @evidence contracts/common.md#meaningful-documentation Names the legacy constant prototype separately from the required current neck source and states the between-knot authority.
   * @evidence contracts/performance.md#efficient-algorithms Each source is prepared once; station reads use the engine's indexed quintic or natural reader.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller's radius and axis are borrowed unchanged and all final knots reuse those prepared fields.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied scalar records; temporary readers and spline preparations end with this call.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, axis: AutoMovieViewAxis.IAxis, sites: readonly Site[], radius: AutoMovieViewOutline.IOutline | null): IAutoMovieViewPart.IOutline {
    const neck: typeof plan.neck.curves = plan.neck.curves;
    if (neck !== undefined && radius === null) throw new Error("The head front requires its actual prepared neck radius");
    const first: number = sites[0]!.station;
    const lower: number = neck?.band[1] ?? plan.y0;
    if (!(first < lower && lower < plan.menton && plan.menton < plan.vertex)) throw new Error("The head front needs an increasing neck-band to menton to crown source interval");
    if (!sites.some((site: Site): boolean => site.station === lower) || !sites.some((site: Site): boolean => site.station === plan.menton)) throw new Error("The head front requires both original handover stations in its emitted partition");
    const parameter: NonNullable<IAutoMovieViewPart.IOutline["parameter"]> = { type: "root", end: "top", pole: plan.vertex };
    const scale: number = neck === undefined ? 1 : neck.extents[0] / neck.lateral;

    // A missing current source was refused above. The retired layout's
    // declared constant prototype is a different, explicit input case.
    const bottom: AutoMovieViewOutline.IOutline = radius ?? prepare({ parameter, knots: [first, lower].map((station: number): IAutoMovieViewPart.IKnot => ({ site: "neck.prototype", station, value: plan.neck.radius, jet: { first: 0, second: 0 } })) });
    const upper: AutoMovieViewOutline.IOutline = prepare({ parameter, knots: sites.filter((site: Site): boolean => site.station >= plan.menton).map((site: Site): IAutoMovieViewPart.IKnot => ({ site: site.site, station: site.station, value: site.station === plan.vertex ? 0 : AutoMovieHumanHeadMedianProfile.profileAt(plan, site.station) - axis.at(site.station).origin[0] })) });
    const a: AutoMovieViewOutline.IReading = read(bottom, lower);
    const b: AutoMovieViewOutline.IReading = read(upper, plan.menton);
    const bridgeSpan: number = Math.sqrt(plan.vertex - lower) - Math.sqrt(plan.vertex - plan.menton);
    const bridge: AutoMovieViewOutline.IOutline = prepare({ parameter, knots: [
      { site: "neck.cylinder.upper", station: lower, value: a.value * scale, jet: { first: a.parameterJet[0] * scale * bridgeSpan, second: a.parameterJet[1] * scale * bridgeSpan * bridgeSpan } },
      { site: "menton", station: plan.menton, value: b.value, jet: { first: b.parameterJet[0] * bridgeSpan, second: b.parameterJet[1] * bridgeSpan * bridgeSpan } },
    ] });
    const span: number = Math.sqrt(plan.vertex - first);

    // All incident pieces share each endpoint's actual two jets. Copying
    // every retained jet prevents a global natural refit at the handover.
    return { parameter, knots: sites.map((site: Site): IAutoMovieViewPart.IKnot => {
      const source: AutoMovieViewOutline.IOutline = site.station <= lower ? bottom : site.station < plan.menton ? bridge : upper;
      const factor: number = site.station <= lower ? scale : 1;
      const value: AutoMovieViewOutline.IReading = read(source, site.station);
      return { site: site.site, station: site.station, value: value.value * factor, jet: { first: value.parameterJet[0] * factor * span, second: value.parameterJet[1] * factor * span * span } };
    }) };
  }

  /** Prepare the declared scalar without replacing a failed source. */
  function prepare(outline: IAutoMovieViewPart.IOutline): AutoMovieViewOutline.IOutline {
    const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
    if ("detail" in source) throw new Error(`Head front source: ${source.detail}`);
    return source;
  }

  /** Keep parameter jets even where a physical station jet is singular. */
  function read(source: AutoMovieViewOutline.IOutline, station: number): AutoMovieViewOutline.IReading {
    const value: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(source, station);
    if (typeof value === "string") throw new Error(`Head front source: ${value}`);
    return value;
  }
}
