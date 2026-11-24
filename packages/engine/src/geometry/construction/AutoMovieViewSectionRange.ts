import type {
  IAutoMovieSource,
  IAutoMovieViewSection,
  IAutoMovieViewSectionRange,
} from "@automovie/interface";

import { AutoMovieViewSection } from "./AutoMovieViewSection";
import { AutoMovieViewSectionConic } from "./AutoMovieViewSectionConic";

/**
 * Existing finite native shoulder reach and its numerical source preparation.
 * The public ViewSection range and target solver share this calculation owner.
 */
export namespace AutoMovieViewSectionRange {
  /**
   * Original accepted native girth residual and reach search scale, in source
   * length units.
   */
  export const TOLERANCE: number = 1e-6;

  /**
   * Probe the actual ellipse and, when needed, one nearby candidate. The target
   * solve carries admitted observations as bracket endpoints.
   */
  export function nearby(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieViewSection.ISection["shoulders"],
    girth: number,
  ): IAutoMovieViewSectionRange.IFamily {
    const at: IAutoMovieViewSectionRange.IFamily["at"] = prepare(
      box,
      departures,
    );
    const ellipse: number = AutoMovieViewSection.ELLIPSE;
    const anchor: IAutoMovieViewSectionRange.ITrial | undefined =
      Number.isFinite(girth) && allowed(departures, ellipse)
        ? at(ellipse)
        : undefined;
    const accepted: boolean =
      anchor !== undefined &&
      anchor.fault === null &&
      Math.abs(anchor.source.girth - girth) <= TOLERANCE;
    const probe: number =
      girth < (anchor?.source.girth ?? NaN) ? ellipse / 2 : (ellipse + 1) / 2;
    const other: IAutoMovieViewSectionRange.ITrial | undefined =
      !accepted && anchor?.fault === null && allowed(departures, probe)
        ? at(probe)
        : undefined;
    const pair: IAutoMovieViewSectionRange.IBracket | null =
      anchor === undefined || other?.fault !== null
        ? null
        : probe < ellipse
          ? [other, anchor]
          : [anchor, other];
    return {
      at,
      ...(accepted ? { accepted: anchor } : {}),
      bracket:
        pair !== null &&
        pair[0].source.girth <= girth &&
        girth <= pair[1].source.girth
          ? pair
          : null,
      reach: (): IAutoMovieViewSectionRange.IBracket | null =>
        full(box, departures, at, anchor, other),
    };
  }

  /** Finite admitted common-shoulder reach with original quarter departures. */
  export function create(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieViewSection.ISection["shoulders"] = [0, 0, 0, 0],
  ): IAutoMovieViewSection.IRange | null {
    const endpoints: IAutoMovieViewSectionRange.IBracket | null = full(
      box,
      departures,
      prepare(box, departures),
    );
    return endpoints === null
      ? null
      : {
          shoulder: [endpoints[0].shoulder, endpoints[1].shoulder],
          girth: [endpoints[0].source.girth, endpoints[1].source.girth],
        };
  }

  /** Fix the box and departures before measuring the requested common shoulder. */
  function prepare(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieViewSection.ISection["shoulders"],
  ): IAutoMovieViewSectionRange.IFamily["at"] {
    return (shoulder: number): IAutoMovieViewSectionRange.ITrial => {
      const source: IAutoMovieSource = measure(
        box,
        departures.map(
          (d: number): number => shoulder + d,
        ) as IAutoMovieViewSection.ISection["shoulders"],
      );
      return {
        shoulder,
        source,
        fault: AutoMovieViewSectionConic.fault(source),
      };
    };
  }

  /** The admitted shoulder interval is open in each quarter. */
  function allowed(
    departures: IAutoMovieViewSection.ISection["shoulders"],
    shoulder: number,
  ): boolean {
    return departures.every(
      (d: number): boolean => shoulder + d > 0 && shoulder + d < 1,
    );
  }

  /**
   * Scale the original bisection count by the box's perimeter and pass its
   * final admitted endpoint trials directly to the target solve.
   */
  function full(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieViewSection.ISection["shoulders"],
    at: IAutoMovieViewSectionRange.IFamily["at"],
    anchor?: IAutoMovieViewSectionRange.ITrial,
    probe?: IAutoMovieViewSectionRange.ITrial,
  ): IAutoMovieViewSectionRange.IBracket | null {
    const ellipse: number = AutoMovieViewSection.ELLIPSE;
    if (!allowed(departures, ellipse)) return null;
    const initial: IAutoMovieViewSectionRange.ITrial = anchor ?? at(ellipse);
    if (initial.fault !== null) return null;
    const e: IAutoMovieViewSection.ISection["shoulders"] = box.extents;
    const steps: number = Math.min(
      64,
      Math.max(
        0,
        Math.ceil(Math.log2((2 * (e[0] + e[1] + e[2] + e[3])) / TOLERANCE)),
      ),
    );
    const low: IAutoMovieViewSectionRange.ITrial = edge(0);
    const high: IAutoMovieViewSectionRange.ITrial = edge(1);
    return Number.isFinite(low.source.girth) &&
      Number.isFinite(high.source.girth) &&
      low.source.girth < high.source.girth
      ? [low, high]
      : null;

    /** Return the last admitted edge of this one bisection bracket. */
    function edge(outside: number): IAutoMovieViewSectionRange.ITrial {
      let inside: IAutoMovieViewSectionRange.ITrial = initial;
      for (let i: number = 0; i < steps; i++) {
        const m: number = (inside.shoulder + outside) / 2;
        if (m === inside.shoulder || m === outside) break;
        const trial: IAutoMovieViewSectionRange.ITrial | null = !allowed(
          departures,
          m,
        )
          ? null
          : i === 0 && probe?.shoulder === m
            ? probe
            : at(m);
        if (trial?.fault === null) inside = trial;
        else outside = m;
      }
      return inside;
    }
  }

  /** Prepare and measure the identical numeric candidate before admission. */
  export function measure(
    box: IAutoMovieViewSection.IBox,
    shoulders: IAutoMovieViewSection.ISection["shoulders"],
  ): IAutoMovieSource {
    const value: IAutoMovieSource = AutoMovieViewSectionConic.prepare(
      box,
      shoulders,
    );
    value.girth = AutoMovieViewSectionConic.length(value);
    return value;
  }
}
