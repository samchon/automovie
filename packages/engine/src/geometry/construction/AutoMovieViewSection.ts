import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieIllinois } from "./AutoMovieIllinois";
import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionConic } from "./AutoMovieViewSectionConic";
import { AutoMovieViewSectionRange } from "./AutoMovieViewSectionRange";
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
 * @evidence contracts/common.md#principled-implementation Exact rational quarters and admitted convex rational G2 ends preserve the four support jets, positive curvature and original shoulders; actual native validity and girth residual admit an ellipse candidate directly or select a common shoulder by bracketed Illinois.
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
   * Actual native-piece arclength, optionally in a fixed diagonal metric.
   * axisScale contains two finite nonzero dimensionless signed axis scales;
   * magnitudes determine the norm, and omitted scales preserve ordinary length.
   * Original sections/G2 controls stay unchanged; this returns no error bound.
   *
   * @evidence contracts/common.md#principled-implementation Delegates the actual quadratic/cubic speeds to the single native quadrature owner.
   * @evidence contracts/common.md#clear-and-simple-design Public length keeps the section API while measurement mechanics remain with ViewSectionConic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed integral remains NaN, never a coarse or endpoint replacement.
   * @evidence contracts/common.md#meaningful-documentation The measurement owner documents its estimated tolerance, finite bounds and failure policy.
   * @evidence contracts/performance.md#efficient-algorithms Interior quadrature and each of at most eight end enclosures visit at most8192 panels, to depth24.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the section's prepared native partition and G2 controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one scalar survives the measurement's local scratch.
   */
  export function length(
    section: ISection,
    axisScale: readonly [number, number] = [1, 1],
  ): number {
    return AutoMovieViewSectionConic.length(section, axisScale);
  }

  /**
   * Two actual native target-refinement observations of the same mapped source.
   *
   * @evidence contracts/common.md#principled-implementation Measures the identical source at native estimated targets1e-7 and5e-8 in source length units, returning the finer result and actual absolute difference; this observation is neither a bound nor the polar GL8 K/2K rule.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the single native quadrature/enclosure owner twice, without preparing a new section or adding an integrator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not manufacture zero error; coincident answers can yield an observed zero. Invalid map/source or exhausted numeric admission stays NaN, and original getter exceptions propagate.
   * @evidence contracts/common.md#meaningful-documentation The signed finite nonzero diagonal scale is dimensionless; lengths/difference retain source units, normally mm. Both targets and the observation-only meaning are explicit.
   * @evidence contracts/performance.md#efficient-algorithms Two bounded native measurements retain the existing8192-panel/depth24 limits per measurement; no polar inverse is evaluated at quadrature nodes.
   * @evidence contracts/performance.md#reuse-equivalent-work Both measurements share the same original prepared rational/G2 functions, partitions and controls with no source reconstruction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only two returned scalars survive; each measurement releases its bounded local panel stacks.
   */
  export function measure(
    section: ISection,
    axisScale: readonly [number, number] = [1, 1],
  ): {
    /** Finer native-target measurement in source units, normally mm; NaN on numeric refusal. */
    lengthMm: number;
    /** Actual absolute difference of the two native estimated targets, not a bound or polar K/2K result. */
    differenceMm: number;
  } {
    const coarse: number = AutoMovieViewSectionConic.length(section, axisScale);
    const fine: number = AutoMovieViewSectionConic.length(
      section,
      axisScale,
      5e-8,
    );
    return { lengthMm: fine, differenceMm: Math.abs(fine - coarse) };
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
    return AutoMovieViewSectionRange.create(box, departures);
  }

  /**
   * Actual source section of a requested finite girth, or its explicit reach diagnostic.
   *
   * @evidence contracts/common.md#principled-implementation An actual valid ellipse candidate whose measured residual passes is accepted directly. Otherwise Illinois on an admitted local or complete-reach bracket proposes a common shoulder, whose actual source validity and original1e-6 residual are checked before success. Local refusal falls back to complete reach; an outside request retains its original endpoint and diagnostic.
   * @evidence contracts/common.md#clear-and-simple-design One result carries a nullable actual section and named reach, shape or unresolved-residual diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No girth scaling, null-to-endpoint success or unchecked last estimate hides a failed solve.
   * @evidence contracts/common.md#meaningful-documentation States retained-endpoint and no-finite-range behavior.
   * @evidence contracts/performance.md#efficient-algorithms One native ellipse measurement can complete the request; otherwise at most100 Illinois iterations follow an admitted two-candidate local bracket or the unchanged bounded complete reach search. Failed local solving permits one complete-reach retry.
   * @evidence contracts/performance.md#reuse-equivalent-work The call-owned numeric trial map reuses identical shoulder measurements and the selected actual source; it retains no foreign algebra callbacks or cross-input state. Complete endpoint geometry remains the original range owner's result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the selected section and diagnostics survive; rejected candidates are invocation-local.
   */
  export function solve(
    producer: string,
    box: IBox,
    girth: number,
    departures: Quarters<number> = [0, 0, 0, 0],
  ): ISolved {
    const e: Quarters<number> = box.extents;
    const W: number = e[0] + e[2];
    const D: number = e[1] + e[3];
    const family: AutoMovieViewSectionRange.IFamily =
      AutoMovieViewSectionRange.nearby(box, departures, girth);
    if (family.accepted !== undefined)
      return { section: completed(family.accepted.source), diagnostics: [] };
    let local: boolean = family.range !== null;
    let reach: IRange | null = family.range ?? range(box, departures);

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
      const r: number | null = AutoMovieIllinois.root(
        (x: number): number => {
          const trial: AutoMovieViewSectionRange.ITrial = family.at(x);
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
      const value: Measured | null =
        r === null || !Number.isFinite(r) ? null : family.at(r).source;
      const failure: string | null =
        value === null
          ? "no finite bracketed shoulder estimate"
          : AutoMovieViewSectionConic.fault(value);
      const residual: number = value === null ? NaN : value.girth - girth;
      const section: ISection | null = value === null ? null : completed(value);
      const refused: boolean =
        localRefusal ||
        failure !== null ||
        !Number.isFinite(residual) ||
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
}

/** Accepted measured girth residual, in source length units (kernel millimetres). */
const GIRTH_TOLERANCE: number = AutoMovieViewSectionRange.TOLERANCE;

/** Bounded Illinois residual evaluations. */
const ITERATIONS: number = 100;
