import { AutoMovieIllinois, AutoMovieViewOutline } from "@automovie/engine";
import type {
  IAutoMovieHumanArmBreadth,
  IAutoMovieHumanSectionSite,
  IAutoMovieHumanSectionSource,
  IAutoMovieViewOutline,
} from "@automovie/interface";

import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanArmInterim } from "./AutoMovieHumanArmInterim";

/**
 * The bideltoid owner in an explicitly straight, arms-down measuring frame. The
 * deltoid and biceps have a tape but no AP caliper. After solving their lateral
 * support, estimate the unconstrained AP depth with the ellipse that carries
 * the tape. The production section closes the exact tape afterward. GH,
 * stations, poles and the supplied distal calipers remain fixed. The source's
 * proximal cap through the humeral midpoint defines the search.
 */
export namespace AutoMovieHumanArmBreadth {
  /** Read the selected source's outward support using the common scalar owner. */
  export function maximum(
    input: IAutoMovieHumanSectionSource,
    side: "left" | "right",
    domain: IAutoMovieHumanArmBreadth.Domain,
  ): IAutoMovieHumanArmBreadth.IMaximumResult {
    const quarter: 1 | 3 = side === "left" ? 3 : 1;
    const sign: 1 | -1 = side === "left" ? -1 : 1;
    const pole: IAutoMovieHumanSectionSource["pole"] = input.pole;
    const ends: IAutoMovieViewOutline.IEnds =
      pole === undefined
        ? {}
        : pole.end === "both"
          ? { bottom: pole.bottom, top: pole.top }
          : pole.end === "bottom"
            ? { bottom: pole.station }
            : { top: pole.station };
    const curve:
      | IAutoMovieViewOutline.IOutline
      | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      AutoMovieHumanSiteViewPart.outline(input, quarter),
      ends,
    );
    if ("detail" in curve) return curve.detail;
    if (
      !(
        domain[0] >= curve.domain[0] &&
        domain[1] <= curve.domain[1] &&
        domain[1] > domain[0]
      )
    )
      return "Deltoid source domain lies outside its original curve";
    const stations: number[] = [
      domain[0],
      domain[1],
      ...curve.knots.map(
        (k: (typeof curve.knots)[number]): number => k.station,
      ),
      ...AutoMovieViewOutline.criticalStations(curve),
    ].filter((s: number): boolean => s >= domain[0] && s <= domain[1]);
    let radius: number = -Infinity;
    let station: number = NaN;
    for (const s of stations) {
      const value: number | string = AutoMovieViewOutline.value(curve, s);
      if (typeof value === "string" || !Number.isFinite(value))
        return `Nonfinite deltoid source support at ${s}: ${value}`;
      if (sign * value > radius) {
        radius = sign * value;
        station = s;
      }
    }
    return { radius, station };
  }

  /**
   * Solve the fixed source family's public width, then verify the actual
   * residual.
   */
  export function fit(
    input: IAutoMovieHumanSectionSource,
    side: "left" | "right",
    domain: IAutoMovieHumanArmBreadth.Domain,
    breadth: number,
    lateral: number,
  ): IAutoMovieHumanArmBreadth.IResult | string {
    const target: number = breadth / 2 - lateral;
    if (![breadth, lateral, target].every(Number.isFinite) || !(target > 0))
      return "Bideltoid leaves no positive outward support at the independently placed GH";
    const family = (scale: number): IAutoMovieHumanSectionSource => ({
      ...input,
      sites: input.sites.map(
        (site: IAutoMovieHumanSectionSite): IAutoMovieHumanSectionSite =>
          site.site === "deltoid" || site.site === "biceps"
            ? {
                ...site,
                edges: [
                  site.edges[0],
                  site.edges[1] * scale,
                  site.edges[2],
                  site.edges[3] * scale,
                ],
              }
            : site,
      ),
    });
    let failure: string | null = null;
    const residual = (scale: number): number => {
      const support: ReturnType<typeof maximum> = maximum(
        family(scale),
        side,
        domain,
      );
      if (typeof support === "string") {
        failure = support;
        return NaN;
      }
      return support.radius - target;
    };
    const lower: number = residual(0);
    let upper: number = 1;
    let value: number = residual(upper);
    for (
      let step: number = 0;
      step < 32 && Number.isFinite(value) && value < 0;
      step++
    )
      value = residual((upper *= 2));
    if (
      failure !== null ||
      !Number.isFinite(lower) ||
      !Number.isFinite(value) ||
      !(lower < 0 && value >= 0)
    )
      return (
        failure ??
        `Bideltoid fixed source family has no positive sign bracket: ${lower}, ${value}`
      );
    const scale: number | null = AutoMovieIllinois.root(
      residual,
      0,
      upper,
      1e-10,
      100,
    );
    if (scale === null || !Number.isFinite(scale) || !(scale > 0))
      return "Bideltoid fixed source family has no finite positive multiplier";
    const error: number = residual(scale);
    if (failure !== null || !Number.isFinite(error) || Math.abs(error) > 1e-9)
      return failure ?? `Bideltoid source residual ${error} mm exceeds 1e-9`;
    const changed: IAutoMovieHumanSectionSource = family(scale);
    const sites: IAutoMovieHumanSectionSite[] = [];
    for (const row of changed.sites) {
      if (
        (row.site !== "deltoid" && row.site !== "biceps") ||
        !("girth" in row.fullness)
      ) {
        sites.push(row);
        continue;
      }
      const width: number = row.edges[1] - row.edges[3];
      const tape: number = row.fullness.girth;
      if (!(2 * width < tape))
        return `Bideltoid gives ${row.site} breadth ${width} mm, requiring its circumference to exceed ${2 * width} mm; the tape is ${tape} mm`;
      try {
        const half: number =
          AutoMovieHumanArmInterim.ellipseDepth(width, tape) / 2;
        sites.push({
          ...row,
          edges: [half, row.edges[1], -half, row.edges[3]],
        });
      } catch (error: unknown) {
        const detail: string =
          error instanceof Error ? error.message : String(error);
        return `Bideltoid ${row.site} tape ${tape} mm and breadth ${width} mm: ${detail}`;
      }
    }
    return { input: { ...changed, sites }, scale };
  }
}
