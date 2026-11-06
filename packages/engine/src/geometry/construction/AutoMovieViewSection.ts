import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieIllinois } from "./AutoMovieIllinois";
import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionConic } from "./AutoMovieViewSectionConic";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** The four ordered support directions and their corresponding source-quarter records. */
type Quarters<T> = IAutoMovieViewPart.IQuarters<T>;

/** Internal measured source; inspection observations are attached only to public results. */
type Measured = Pick<
  AutoMovieViewSection.ISection,
  "box" | "shoulders" | "guides" | "conics" | "girth"
>;

/**
 * One source section from four exact support extents and conic shoulders.
 *
 * Each rational quarter touches its two support lines with zero radial slope. Its shoulder r has weight w=r/(1-r), with r=sqrt(2)-1 giving an ellipse. Adjacent quarters keep their existing shared curvature, the smaller own endpoint curvature. Incompatible ends use the convex rational G2 construction in AutoMovieViewConic, with a same-ray error bound of 1e-7 times the short extent and support vanishing with curvature contrast.
 *
 * The conic is read directly. The knot list is a quadrature/inspection partition, not a polar Hermite replacement. Girth measures the same rational pieces with bounded native quadrature and geometric end enclosures; finite measurement belongs to reach admission and every solved result must meet its measured residual. Four exact guides and shoulder points retain their input ownership. Final periodic phase fitting and station interpolation remain separate from this source section.
 *
 * @evidence contracts/common.md#principled-implementation Exact rational quarters and admitted convex rational G2 ends preserve the four support jets, positive curvature and original shoulders; one actual-source girth selects a common shoulder by Illinois.
 * @evidence contracts/common.md#clear-and-simple-design Public sections own their complete observations; range and Illinois retain only the measured source until a public result is selected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input box, aspect exception, relaxed convexity threshold or sampled replacement curve hides failed source premises.
 * @evidence contracts/common.md#meaningful-documentation States source ownership, conic parameter, correction/error proof owner, numerical girth limit and separation from final loft fitting.
 * @evidence contracts/performance.md#efficient-algorithms Four bounded quarters/native partitions serve bounded quadrature and girth solving. Intermediate measurements omit unused inspection knots/diagonals while retaining every candidate fault observation.
 * @evidence contracts/performance.md#reuse-equivalent-work One source and observation partition serve section validity, source sampling and girth.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the section's O(1)-bounded source records and observations survive; quadrature scratch is invocation-local.
 */
export namespace AutoMovieViewSection {
  /** The conic shoulder of the ellipse, `sqrt(2) - 1`. */
  export const ELLIPSE: number = Math.SQRT2 - 1;

  /**
   * The finite positive support half extents about the source axis.
   *
   * @evidence contracts/common.md#principled-implementation Four positive extents identify the support lines at the cardinal chart angles.
   * @evidence contracts/common.md#clear-and-simple-design One tuple carries the four support identities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source extent is derived from a mesh or fitted for validity.
   * @evidence contracts/common.md#meaningful-documentation States chart directions and millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data has no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Data schedules no computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The section producer owns the tuple.
   */
  export interface IBox {
    /** Half extents along +u,+v,-u,-v, millimetres, finite and positive. */
    extents: Quarters<number>;
  }

  /**
   * One source section before periodic phase fitting.
   *
   * @evidence contracts/common.md#principled-implementation The box, original shoulders, shared main jets and admitted rational/corrected source describe the actual section function.
   * @evidence contracts/common.md#clear-and-simple-design One record separates source ownership from quadrature observations and derived girth/diagonals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Observation knots never replace the actual rational source and no failure is hidden.
   * @evidence contracts/common.md#meaningful-documentation Members name exact inputs, evaluator, observations and derived millimetre measures.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation and consumers own reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns its bounded conic and guide records.
   */
  export interface ISection {
    /** Original source support box. */
    box: IBox;

    /** Original conic shoulder per quarter. */
    shoulders: Quarters<number>;

    /** Four exact cardinal guide jets, including shared radial second derivatives. */
    guides: Quarters<AutoMoviePolarSector.IGuide>;

    /** Quadrature/inspection observations of the actual source, in increasing angle; these do not define an interpolant. */
    knots: AutoMoviePolarSector.IGuide[];

    /** The actual exact-conic/correction source, including an explicit admission failure. */
    conics: AutoMovieViewConic.ICurve;

    /** No extra polar bump; quarter fullness belongs to shoulders. */
    fullness: Quarters<number>;

    /** Numerical taut-tape girth in millimetres; zero in bare and nonfinite on quadrature failure. */
    girth: number;

    /** Radii along the four original corner directions, derived observations in millimetres. */
    diagonals: Quarters<number>;
  }

  /**
   * Finite admitted common-shoulder reach and its actual source girths.
   *
   * @evidence contracts/common.md#principled-implementation Valid source sections and finite actual-source quadrature define the two returned reach endpoints.
   * @evidence contracts/common.md#clear-and-simple-design One pair for shoulder and one for girth describe the range.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim mathematical reach beyond finite source/quadrature admission.
   * @evidence contracts/common.md#meaningful-documentation Members state shoulder shares and millimetre girths.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result contains no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The range producer owns preparation reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns four scalar results.
   */
  export interface IRange {
    /** Least and greatest admitted common shoulder before quarter departures. */
    shoulder: [number, number];

    /** Corresponding actual-source girths, millimetres. */
    girth: [number, number];
  }

  /**
   * A section selected by requested girth and any explicit reach diagnostic.
   *
   * @evidence contracts/common.md#principled-implementation The actual source girth selects the common shoulder, while an outside request retains the admitted endpoint with a diagnostic.
   * @evidence contracts/common.md#clear-and-simple-design One nullable section and diagnostic list represent success and named failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never silently rescales a box or hides an outside-range request.
   * @evidence contracts/common.md#meaningful-documentation States null and retained-endpoint meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The solver owns work reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the section and diagnostics.
   */
  export interface ISolved {
    /** Actual source section, an admitted outside-request endpoint, or null without finite admitted reach/estimate. A nonnull result can retain an unresolved-residual diagnostic. */
    section: ISection | null;

    /** Explicit reach/source/residual diagnostic; empty only after measured residual admission. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Shared positive guide curvatures, inverse millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Each guide uses the smaller of its two rational endpoint curvatures a/(2w^2*b^2), retaining the published guide law.
   * @evidence contracts/common.md#clear-and-simple-design Delegates to the shared NUMBER quarter policy in ViewConic; ArcField owns the rational endpoint law.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No aspect or output observation changes a guide curvature.
   * @evidence contracts/common.md#meaningful-documentation States the smaller-adjacent law and inverse-length units.
   * @evidence contracts/performance.md#efficient-algorithms Four fixed formula pairs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure scalar geometry schedules no effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one four-number tuple.
   */
  export function curvatures(
    box: IBox,
    shoulders: Quarters<number>,
  ): Quarters<number> {
    return AutoMovieViewConic.curvatures(
      AutoMovieConicFieldJet.NUMBER,
      box.extents,
      shoulders,
    );
  }

  /**
   * Prepare the source section and its derived diagonal/girth observations.
   *
   * @evidence contracts/common.md#principled-implementation Derived diagonals and girth read the admitted actual rational/corrected source, rather than an interpolated radius.
   * @evidence contracts/common.md#clear-and-simple-design One preparation followed by actual-source measures produces the section.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed conic or quadrature remains nonfinite/named for fault, never a fallback shape.
   * @evidence contracts/common.md#meaningful-documentation States source/measure ownership and validity through fault.
   * @evidence contracts/performance.md#efficient-algorithms Bounded preparation plus four diagonal reads and bounded quadrature.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the prepared source for every measure.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned section owns its source/observations; scratch is released.
   */
  export function of(box: IBox, shoulders: Quarters<number>): ISection {
    const section: ISection = bare(box, shoulders);
    const e: Quarters<number> = box.extents;
    section.diagonals = [0, 1, 2, 3].map(
      (q: number): number =>
        radius(
          section,
          section.guides[q]!.angle + Math.atan2(e[(q + 1) % 4]!, e[q]!),
        )[0],
    ) as Quarters<number>;
    section.girth = length(section);
    return section;
  }

  /**
   * Prepare only the source and its observation partition; leave measures at zero.
   *
   * @evidence contracts/common.md#principled-implementation Original support jets and shared geometric curvatures prepare four rational quarters with admitted convex G2 end approximations where necessary.
   * @evidence contracts/common.md#clear-and-simple-design A source-only preparation serves value readers; of adds actual arclength for range admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed source remains the conic owner's diagnostic, without an alternate section.
   * @evidence contracts/common.md#meaningful-documentation States that zero measures mean not yet evaluated.
   * @evidence contracts/performance.md#efficient-algorithms Bounded quarter preparation and at most 72 retained observation guides.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared source serves all later validity/value/girth consumers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns all returned conic/observation records; no global cache.
   */
  export function bare(box: IBox, shoulders: Quarters<number>): ISection {
    return observations(AutoMovieViewSectionConic.prepare(box, shoulders));
  }

  /** Public records retain every original observation, including failed-source numbers. */
  function observations(value: Measured): ISection {
    return {
      box: value.box,
      shoulders: value.shoulders,
      guides: value.guides,
      conics: value.conics,
      knots: AutoMovieViewConic.samples(value.conics),
      fullness: [0, 0, 0, 0],
      girth: value.girth,
      diagonals: [0, 0, 0, 0],
    };
  }

  /** Compute the identical native arclength before range/Illinois admission. */
  function measured(box: IBox, shoulders: Quarters<number>): Measured {
    const value: Measured = AutoMovieViewSectionConic.prepare(box, shoulders);
    value.girth = AutoMovieViewSectionConic.length(value);
    return value;
  }

  /** Decorate only a selected public section, retaining its already measured girth. */
  function completed(value: Measured): ISection {
    const section: ISection = observations(value);
    const e: Quarters<number> = value.box.extents;
    section.diagonals = [0, 1, 2, 3].map(
      (q: number): number =>
        radius(
          section,
          section.guides[q]!.angle + Math.atan2(e[(q + 1) % 4]!, e[q]!),
        )[0],
    ) as Quarters<number>;
    return section;
  }

  /**
   * The original rational conic guide at native parameter t.
   *
   * @evidence contracts/common.md#principled-implementation Delegates the original numerator/denominator derivative and polar chain rule to the common exact-conic owner.
   * @evidence contracts/common.md#clear-and-simple-design Preserves the public conic-guide signature through one implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not read section observations or estimate a tangent from neighbours.
   * @evidence contracts/common.md#meaningful-documentation States native unit parameter, local extents and angular offset.
   * @evidence contracts/performance.md#efficient-algorithms Constant native conic arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses one rational formula owner for guide and direct radius reads.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned fixed-size guide survives.
   */
  export function conic(
    a: number,
    b: number,
    r: number,
    t: number,
    start: number,
  ): AutoMoviePolarSector.IGuide {
    return AutoMovieConicArc.guide(a, b, r, t, start);
  }

  /**
   * Actual source radius and its two angular derivatives at any periodic angle.
   *
   * @evidence contracts/common.md#principled-implementation Reads the rational quarter and admitted rational G2 end approximation from the prepared source.
   * @evidence contracts/common.md#clear-and-simple-design One source evaluator serves all section consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No Hermite interpolation through observation guides, point clamp or aspect exception remains.
   * @evidence contracts/common.md#meaningful-documentation States angular derivatives and nonfinite failure propagation.
   * @evidence contracts/performance.md#efficient-algorithms One constant-work rational/correction query.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the section's prepared supports without repeating admission.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one three-number jet and retains no query state.
   */
  export function radius(
    section: ISection,
    phi: number,
  ): AutoMoviePolarSector.Jet {
    return AutoMovieViewConic.radius(section.conics, phi);
  }

  /**
   * Actual native-piece arclength, in source length units.
   *
   * @evidence contracts/common.md#principled-implementation Delegates the actual quadratic/cubic speeds to the single native quadrature owner.
   * @evidence contracts/common.md#clear-and-simple-design Public length keeps the section API while measurement mechanics remain with ViewSectionConic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed integral remains NaN, never a coarse or endpoint replacement.
   * @evidence contracts/common.md#meaningful-documentation The measurement owner documents its estimated tolerance, finite bounds and failure policy.
   * @evidence contracts/performance.md#efficient-algorithms Interior quadrature and each of at most eight end enclosures visit at most8192 panels, to depth24.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the section's prepared native partition and G2 controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one scalar survives the measurement's local scratch.
   */
  export function length(section: ISection): number {
    return AutoMovieViewSectionConic.length(section);
  }

  /**
   * The original source's finite, convexity and support diagnostic.
   *
   * @evidence contracts/common.md#principled-implementation Combines rational source admission with independent observations of the actual source.
   * @evidence contracts/common.md#clear-and-simple-design Delegates one diagnostic policy to the same owner as arclength.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains the existing curvature/support thresholds and original failure instead of substituting geometry.
   * @evidence contracts/common.md#meaningful-documentation Bare zero girth is unevaluated; computed nonfinite girth is a failure.
   * @evidence contracts/performance.md#efficient-algorithms At most388 prepared polar readings.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepared quarters serve every diagnostic read.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one string or null with no retained query state.
   */
  export function fault(section: ISection): string | null {
    return AutoMovieViewSectionConic.fault(section);
  }

  /**
   * Finite admitted common-shoulder reach with original quarter departures.
   *
   * @evidence contracts/common.md#principled-implementation Bisection from the ellipse shoulder finds each finite source-admission endpoint, then actual-source quadrature measures its girth.
   * @evidence contracts/common.md#clear-and-simple-design One nullable range separates failed admission from usable shoulder/girth bounds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move extents or hide invalid shoulders; nonfinite endpoint girth gives no claimed range.
   * @evidence contracts/common.md#meaningful-documentation States finite numerical reach rather than unrestricted mathematical conic reach.
   * @evidence contracts/performance.md#efficient-algorithms Bounded binary64 bisection with actual source and native-arclength admission on each candidate.
   * @evidence contracts/performance.md#reuse-equivalent-work Every admitted range candidate has finite native arclength; this avoids claiming a reach whose endpoint cannot be integrated.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary measured-source records are released; the caller owns four scalar bounds.
   */
  export function range(
    box: IBox,
    departures: Quarters<number> = [0, 0, 0, 0],
  ): IRange | null {
    const at: (r: number) => Measured | null = (r: number): Measured | null => {
      const s: Quarters<number> = departures.map(
        (d: number): number => r + d,
      ) as Quarters<number>;
      if (!s.every((x: number): boolean => x > 0 && x < 1)) return null;
      const section: Measured = measured(box, s);
      return AutoMovieViewSectionConic.fault(section) === null ? section : null;
    };
    if (at(ELLIPSE) === null) return null;

    // Scale the finite shoulder bracket's bisection count by the box's
    // perimeter. This is a numerical reach search, not a derivative or
    // girth-error certificate; solve checks its actual final residual.
    const e: Quarters<number> = box.extents;
    const steps: number = Math.min(
      64,
      Math.max(
        0,
        Math.ceil(
          Math.log2((2 * (e[0] + e[1] + e[2] + e[3])) / GIRTH_TOLERANCE),
        ),
      ),
    );
    const edge: (inside: number, outside: number) => number = (
      inside: number,
      outside: number,
    ): number => {
      let a: number = inside;
      let b: number = outside;
      for (let i: number = 0; i < steps; i++) {
        const m: number = (a + b) / 2;
        if (m === a || m === b) break;
        if (at(m) !== null) a = m;
        else b = m;
      }
      return a;
    };
    const lo: number = edge(ELLIPSE, 0);
    const hi: number = edge(ELLIPSE, 1);
    const shaped: (r: number) => Measured = (r: number): Measured =>
      measured(
        box,
        departures.map((d: number): number => r + d) as Quarters<number>,
      );
    const girths: [number, number] = [shaped(lo).girth, shaped(hi).girth];
    return girths.every(Number.isFinite) && girths[0] < girths[1]
      ? { shoulder: [lo, hi], girth: girths }
      : null;
  }

  /**
   * Actual source section of a requested finite girth, or its explicit reach diagnostic.
   *
   * @evidence contracts/common.md#principled-implementation Illinois on the continuous admitted source girth proposes a common shoulder; actual source validity and measured girth residual are checked before success. An outside request retains an endpoint with a diagnostic.
   * @evidence contracts/common.md#clear-and-simple-design One result carries a nullable actual section and named reach, shape or unresolved-residual diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No girth scaling, null-to-endpoint success or unchecked last estimate hides a failed solve.
   * @evidence contracts/common.md#meaningful-documentation States retained-endpoint and no-finite-range behavior.
   * @evidence contracts/performance.md#efficient-algorithms At most100 Illinois iterations after bounded range preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Each candidate source serves its identical length/fault checks; the selected source also supplies all final public observations without rebuilding its geometry.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the selected section and diagnostics survive; rejected candidates are invocation-local.
   */
  export function solve(
    producer: string,
    box: IBox,
    girth: number,
    departures: Quarters<number> = [0, 0, 0, 0],
  ): ISolved {
    const reach: IRange | null = range(box, departures);
    const e: Quarters<number> = box.extents;
    const W: number = e[0] + e[2];
    const D: number = e[1] + e[3];
    const shaped: (r: number) => Measured = (r: number): Measured =>
      measured(
        box,
        departures.map((d: number): number => r + d) as Quarters<number>,
      );
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
        section: completed(shaped(end)),
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
    const r: number | null = AutoMovieIllinois.root(
      (x: number): number => shaped(x).girth - girth,
      reach.shoulder[0],
      reach.shoulder[1],
      GIRTH_TOLERANCE,
      ITERATIONS,
    );
    const value: Measured | null =
      r === null || !Number.isFinite(r) ? null : shaped(r);
    const failure: string | null =
      value === null
        ? "no finite bracketed shoulder estimate"
        : AutoMovieViewSectionConic.fault(value);
    const residual: number = value === null ? NaN : value.girth - girth;
    const section: ISection | null = value === null ? null : completed(value);
    if (
      failure !== null ||
      !Number.isFinite(residual) ||
      Math.abs(residual) > GIRTH_TOLERANCE
    )
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

/** Accepted measured girth residual, in source length units (kernel millimetres). */
const GIRTH_TOLERANCE: number = 1e-6;

/** Bounded Illinois residual evaluations. */
const ITERATIONS: number = 100;
