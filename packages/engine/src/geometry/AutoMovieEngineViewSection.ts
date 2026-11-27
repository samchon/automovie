import type {
  IAutoMovieCurveLengthMeasurement64,
  IAutoMoviePolarSector,
  IAutoMovieQuarters,
  IAutoMovieViewSection,
  IAutoMovieViewSectionRange,
} from "@automovie/interface";

import { AutoMovieEngineConicArc } from "./AutoMovieEngineConicArc";
import { AutoMovieEngineConicFieldJet } from "./AutoMovieEngineConicFieldJet";
import { AutoMovieEngineIllinois } from "./AutoMovieEngineIllinois";
import { AutoMovieEngineViewConic } from "./AutoMovieEngineViewConic";
import { AutoMovieEngineViewSectionConic } from "./AutoMovieEngineViewSectionConic";
import { AutoMovieEngineViewSectionRange } from "./AutoMovieEngineViewSectionRange";

/**
 * One source section from four exact support extents and conic shoulders.
 *
 * Each rational quarter touches its two support lines with zero radial slope.
 * Its shoulder r has weight w=r/(1-r), with r=sqrt(2)-1 giving an ellipse.
 * Adjacent quarters keep their existing shared curvature, the smaller own
 * endpoint curvature. Incompatible ends use the convex rational G2 construction
 * in AutoMovieEngineViewConic, with a same-ray error bound of 1e-7 times the short
 * extent and support vanishing with curvature contrast.
 *
 * The conic is read directly. The knot list is a quadrature/inspection
 * partition, not a polar Hermite replacement. Girth measures the same rational
 * pieces with bounded native quadrature and geometric end enclosures; finite
 * measurement belongs to reach admission and every solved result must meet its
 * measured residual. Four exact guides and shoulder points retain their input
 * ownership. Final periodic phase fitting and station interpolation remain
 * separate from this source section.
 */
export namespace AutoMovieEngineViewSection {
  /** The conic shoulder of the ellipse, `sqrt(2) - 1`. */
  export const ELLIPSE: number = Math.SQRT2 - 1;

  /** Shared positive guide curvatures, inverse millimetres. */
  export function curvatures(
    box: IAutoMovieViewSection.IBox,
    shoulders: IAutoMovieQuarters<number>,
  ): IAutoMovieQuarters<number> {
    return AutoMovieEngineViewConic.curvatures(
      AutoMovieEngineConicFieldJet.NUMBER,
      box.extents,
      shoulders,
    );
  }

  /** Prepare the source section and its derived diagonal/girth observations. */
  export function of(
    box: IAutoMovieViewSection.IBox,
    shoulders: IAutoMovieQuarters<number>,
  ): IAutoMovieViewSection.ISection {
    const section: IAutoMovieViewSection.ISection = bare(box, shoulders);
    const e: IAutoMovieQuarters<number> = box.extents;
    section.diagonals = [0, 1, 2, 3].map(
      (q: number): number =>
        radius(
          section,
          section.guides[q]!.angle + Math.atan2(e[(q + 1) % 4]!, e[q]!),
        )[0],
    ) as IAutoMovieQuarters<number>;
    section.girth = length(section);
    return section;
  }

  /**
   * Prepare only the source and its observation partition; leave measures at
   * zero.
   */
  export function bare(
    box: IAutoMovieViewSection.IBox,
    shoulders: IAutoMovieQuarters<number>,
  ): IAutoMovieViewSection.ISection {
    return observations(AutoMovieEngineViewSectionConic.prepare(box, shoulders));
  }

  /** The original rational conic guide at native parameter t. */
  export function conic(
    a: number,
    b: number,
    r: number,
    t: number,
    start: number,
  ): IAutoMoviePolarSector.IGuide {
    return AutoMovieEngineConicArc.guide(a, b, r, t, start);
  }

  /** Actual source radius and its two angular derivatives at any periodic angle. */
  export function radius(
    section: IAutoMovieViewSection.ISection,
    phi: number,
  ): IAutoMoviePolarSector.Jet {
    return AutoMovieEngineViewConic.radius(section.conics, phi);
  }

  /**
   * Actual native-piece arclength, optionally in a fixed diagonal metric.
   * axisScale contains two finite nonzero dimensionless signed axis scales;
   * magnitudes determine the norm, and omitted scales preserve ordinary length.
   * Original sections/G2 controls stay unchanged; this returns no error bound.
   */
  export function length(
    section: IAutoMovieViewSection.ISection,
    axisScale: readonly [number, number] = [1, 1],
  ): number {
    return AutoMovieEngineViewSectionConic.length(section, axisScale);
  }

  /** Two actual native target-refinement observations of the same mapped source. */
  export function measure(
    section: IAutoMovieViewSection.ISection,
    axisScale: readonly [number, number] = [1, 1],
  ): IAutoMovieCurveLengthMeasurement64 {
    const coarse: number = AutoMovieEngineViewSectionConic.length(section, axisScale);
    const fine: number = AutoMovieEngineViewSectionConic.length(
      section,
      axisScale,
      5e-8,
    );
    return { lengthMm: fine, differenceMm: Math.abs(fine - coarse) };
  }

  /** The original source's finite, convexity and support diagnostic. */
  export function fault(
    section: IAutoMovieViewSection.ISection,
  ): string | null {
    return AutoMovieEngineViewSectionConic.fault(section);
  }

  /** Finite admitted common-shoulder reach with original quarter departures. */
  export function range(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieQuarters<number> = [0, 0, 0, 0],
  ): IAutoMovieViewSection.IRange | null {
    return AutoMovieEngineViewSectionRange.create(box, departures);
  }

  /**
   * Actual source section of a requested finite girth, or its explicit reach
   * diagnostic.
   */
  export function solve(
    producer: string,
    box: IAutoMovieViewSection.IBox,
    girth: number,
    departures: IAutoMovieQuarters<number> = [0, 0, 0, 0],
  ): IAutoMovieViewSection.ISolved {
    const e: IAutoMovieQuarters<number> = box.extents;
    const W: number = e[0] + e[2];
    const D: number = e[1] + e[3];
    const family: IAutoMovieViewSectionRange.IFamily =
      AutoMovieEngineViewSectionRange.nearby(box, departures, girth);
    if (family.accepted !== undefined)
      return { section: completed(family.accepted.source), diagnostics: [] };
    let local: boolean = family.range !== null;
    let reach: IAutoMovieViewSection.IRange | null =
      family.range ?? range(box, departures);

    // Only an admitted local solve may retry through the unchanged complete
    // reach path; original callback exceptions are never caught or replaced.
    for (;;) {
      if (reach === null)
        return {
          section: null,
          diagnostics: [
            {
              producer,
              level: 2,
              contract: "view section",
              detail: `the box [${e.join(", ")}] mm with departures [${departures.join(", ")}] has no finite admitted source/girth reach from the ellipse's shoulder`,
            },
          ],
        };
      const [lo, hi]: [number, number] = reach.girth;
      if (!(girth >= lo && girth <= hi)) {
        const end: number = girth < lo ? reach.shoulder[0] : reach.shoulder[1];
        return {
          section: completed(family.at(end).source),
          diagnostics: [
            {
              producer,
              level: 2,
              contract: "girth in reach",
              detail: `girth ${girth} mm outside the reach ${lo} to ${hi} mm of the box ${W} by ${D} mm (rhombus ${2 * Math.hypot(W, D)} mm, rectangle ${2 * (W + D)} mm); the section is the shoulder ${end}`,
            },
          ],
        };
      }
      let localRefusal: boolean = false;
      const r: number | null = AutoMovieEngineIllinois.root(
        (x: number): number => {
          const trial: IAutoMovieViewSectionRange.ITrial = family.at(x);
          if (local && trial.fault !== null) {
            localRefusal = true;
            return NaN;
          }
          return trial.source.girth - girth;
        },
        reach.shoulder[0],
        reach.shoulder[1],
        GIRTH_TOLERANCE,
        ITERATIONS,
      );
      // A refused local trial ends the bracket with no shoulder to read.
      const value: Measured | null =
        r === null || localRefusal ? null : family.at(r).source;
      const failure: string | null =
        value === null
          ? "no finite bracketed shoulder estimate"
          : AutoMovieEngineViewSectionConic.fault(value);
      const residual: number = value === null ? NaN : value.girth - girth;
      const section: IAutoMovieViewSection.ISection | null =
        value === null ? null : completed(value);
      const refused: boolean =
        localRefusal ||
        failure !== null ||
        Math.abs(residual) > GIRTH_TOLERANCE;
      if (local && refused) {
        local = false;
        reach = range(box, departures);
        continue;
      }
      if (refused)
        return {
          section,
          diagnostics: [
            {
              producer,
              level: 2,
              contract: "girth solve",
              detail: `girth ${girth} has no admitted residual within ${GIRTH_TOLERANCE}; residual ${residual}; ${failure ?? "iteration bound exhausted"}`,
            },
          ],
        };
      return { section, diagnostics: [] };
    }
  }

  /*
   * Public records retain every original observation, including failed-source
   * numbers.
   */
  function observations(value: Measured): IAutoMovieViewSection.ISection {
    return {
      box: value.box,
      shoulders: value.shoulders,
      guides: value.guides,
      conics: value.conics,
      knots: AutoMovieEngineViewConic.samples(value.conics),
      fullness: [0, 0, 0, 0],
      girth: value.girth,
      diagonals: [0, 0, 0, 0],
    };
  }

  /*
   * Decorate only a selected public section, retaining its already measured
   * girth.
   */
  function completed(value: Measured): IAutoMovieViewSection.ISection {
    const section: IAutoMovieViewSection.ISection = observations(value);
    const e: IAutoMovieQuarters<number> = value.box.extents;
    section.diagonals = [0, 1, 2, 3].map(
      (q: number): number =>
        radius(
          section,
          section.guides[q]!.angle + Math.atan2(e[(q + 1) % 4]!, e[q]!),
        )[0],
    ) as IAutoMovieQuarters<number>;
    return section;
  }
}

/*
 * Internal measured source; inspection observations are attached only to public
 * results.
 */
type Measured = Pick<
  IAutoMovieViewSection.ISection,
  "box" | "shoulders" | "guides" | "conics" | "girth"
>;

/*
 * Accepted measured girth residual, in source length units (kernel
 * millimetres).
 */
const GIRTH_TOLERANCE: number = AutoMovieEngineViewSectionRange.TOLERANCE;

/*
 * Bounded Illinois residual evaluations.
 */
const ITERATIONS: number = 100;
