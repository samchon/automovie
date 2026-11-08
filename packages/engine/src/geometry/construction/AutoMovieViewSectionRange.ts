import { AutoMovieViewSection } from "./AutoMovieViewSection";
import { AutoMovieViewSectionConic } from "./AutoMovieViewSectionConic";

/** Internal measured source without unused inspection decoration. */
type Measured = ReturnType<typeof AutoMovieViewSectionConic.prepare>;

/**
 * Existing finite native shoulder reach and its numerical source preparation.
 * The public ViewSection range and target solver share this calculation owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States numerical reach rather than a continuous geometric or arclength certificate.
 * @evidence contracts/development/design.md#principled-representation Represents Existing finite native shoulder reach and its numerical source preparation: companion namespace of 6 members (`TOLERANCE`, `ITrial`, `IFamily`, `nearby`, `create`, `measure`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewSectionRange` in packages/engine/src/geometry/construction/AutoMovieViewSectionRange.ts; its surface is the 6 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewSectionRange {
  /** Original accepted native girth residual and reach search scale, in source length units. */
  export const TOLERANCE: number = 1e-6;

  /**
   * One synchronous candidate's unchanged measured source and fault observation.
   *
   * @evidence contracts/development/design.md#principled-representation Carries actual native arclength and original finite/curvature/support admission for exactly one shoulder.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A source and nullable refusal remain distinct from target convergence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused candidate remains refused and never supplies a successful residual.
   * @evidence contracts/development/common.md#meaningful-documentation Source lengths use the supplied box unit; null means this finite source observation passed, not a continuous certificate.
   */
  export interface ITrial {
    /** Actual native source before unused display observations. */
    source: Measured;

    /** Original candidate fault, or null after the existing admission. */
    fault: string | null;
  }

  /**
   * An accepted candidate or actual local bracket, with call-owned numeric trials for one target solve.
   *
   * @evidence contracts/development/design.md#principled-representation An ellipse candidate can be accepted only after its actual native fault and original target residual pass; otherwise a local interval exists only after two admitted source readings surround the target girth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Without an accepted candidate, null range requests the unchanged complete-reach owner; at retains the selected actual candidate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores only numeric native geometry, never public algebra callbacks, another input or fabricated successful data.
   * @evidence contracts/development/common.md#meaningful-documentation Separates a measured residual-satisfying candidate, a target bracket and an unresolved request; neither candidate nor bracket supplies whole finite reach or anatomical acceptance.
   */
  export interface IFamily {
    /** Actual local target bracket; null also permits a separately accepted original candidate. */
    range: AutoMovieViewSection.IRange | null;

    /** Actual ellipse candidate already within the unchanged native target tolerance, without another probe. */
    accepted?: ITrial;

    /**
     * Same-shoulder actual source/admission; original preparation exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Same-shoulder actual source/admission; original preparation exceptions propagate.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Same-shoulder actual source/admission; original preparation exceptions propagate.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    at(shoulder: number): ITrial;
  }

  /**
   * Accept the existing ellipse when its measured residual passes; otherwise try one interior shoulder before requesting distant reach endpoints.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Actual native arclength and finite/curvature/support observations admit each candidate; either the ellipse's original1e-6 residual passes directly or a measured target sign bracket permits Illinois without complete reach preparation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One invocation supplies a directly accepted actual candidate, an optional local bracket and the numeric trial reader; the caller retains complete-reach fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No callback or public algebra effect is cached; invalid shoulders, nonfinite targets and unbracketed targets leave range null, and root-interior refusal triggers the caller's original complete-reach path.
   * @evidence contracts/development/common.md#meaningful-documentation The halfway shoulder is a numerical proposal inside (0,1), not a shape law, target adjustment or assertion of finite admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two initial numeric sources, each with the unchanged bounded length and fault work; the caller retains its100-iteration limit and original1e-6 final residual.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A call-owned Map retains only equal numeric shoulder candidates of this fixed box/departure solve; changing inputs requires a new family.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Numeric sources and diagnostics are released with the synchronous solve, without a global or cross-input cache.
   */
  export function nearby(
    box: AutoMovieViewSection.IBox,
    departures: AutoMovieViewSection.ISection["shoulders"],
    girth: number,
  ): IFamily {
    const trials: Map<number, ITrial> = new Map();

    /** Public generic algebra callbacks never enter this numeric preparation. */
    const at: IFamily["at"] = (shoulder: number): ITrial => {
      const previous: ITrial | undefined = trials.get(shoulder);
      if (previous !== undefined) return previous;
      const source: Measured = measure(
        box,
        departures.map(
          (d: number): number => shoulder + d,
        ) as AutoMovieViewSection.ISection["shoulders"],
      );
      const result: ITrial = {
        source,
        fault: AutoMovieViewSectionConic.fault(source),
      };
      trials.set(shoulder, result);
      return result;
    };
    const allowed: (shoulder: number) => boolean = (
      shoulder: number,
    ): boolean =>
      departures.every(
        (d: number): boolean => shoulder + d > 0 && shoulder + d < 1,
      );
    let range: IFamily["range"] = null;
    const ellipse: number = AutoMovieViewSection.ELLIPSE;
    if (Number.isFinite(girth) && allowed(ellipse)) {
      const anchor: ITrial = at(ellipse);
      if (anchor.fault === null) {
        if (Math.abs(anchor.source.girth - girth) <= TOLERANCE)
          return { range: null, accepted: anchor, at };
        const probe: number =
          girth < anchor.source.girth ? ellipse / 2 : (ellipse + 1) / 2;
        if (allowed(probe)) {
          const other: ITrial = at(probe);
          const low: ITrial = probe < ellipse ? other : anchor;
          const high: ITrial = probe < ellipse ? anchor : other;
          if (
            other.fault === null &&
            low.source.girth <= girth &&
            girth <= high.source.girth
          )
            range = {
              shoulder: probe < ellipse ? [probe, ellipse] : [ellipse, probe],
              girth: [low.source.girth, high.source.girth],
            };
        }
      }
    }
    return { range, at };
  }

  /**
   * Finite admitted common-shoulder reach with original quarter departures.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Bisection from the ellipse shoulder finds each finite source-admission endpoint, then actual-source quadrature measures its girth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nullable range separates failed admission from usable shoulder/girth bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not move extents or hide invalid shoulders; nonfinite endpoint girth gives no claimed range.
   * @evidence contracts/development/common.md#meaningful-documentation States finite numerical reach rather than unrestricted mathematical conic reach.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded binary64 bisection with actual source and native-arclength admission on each candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every admitted range candidate has finite native arclength; this avoids claiming a reach whose endpoint cannot be integrated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary measured-source records are released; the caller owns four scalar bounds.
   */
  export function create(
    box: AutoMovieViewSection.IBox,
    departures: AutoMovieViewSection.ISection["shoulders"] = [0, 0, 0, 0],
  ): AutoMovieViewSection.IRange | null {
    const at: (r: number) => Measured | null = (r: number): Measured | null => {
      const s: AutoMovieViewSection.ISection["shoulders"] = departures.map(
        (d: number): number => r + d,
      ) as AutoMovieViewSection.ISection["shoulders"];
      if (!s.every((x: number): boolean => x > 0 && x < 1)) return null;
      const section: Measured = measure(box, s);
      return AutoMovieViewSectionConic.fault(section) === null ? section : null;
    };
    if (at(AutoMovieViewSection.ELLIPSE) === null) return null;

    // Scale the finite shoulder bracket's bisection count by the box's
    // perimeter. This is a numerical reach search, not a derivative or
    // girth-error certificate; solve checks its actual final residual.
    const e: AutoMovieViewSection.ISection["shoulders"] = box.extents;
    const steps: number = Math.min(
      64,
      Math.max(
        0,
        Math.ceil(Math.log2((2 * (e[0] + e[1] + e[2] + e[3])) / TOLERANCE)),
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
    const lo: number = edge(AutoMovieViewSection.ELLIPSE, 0);
    const hi: number = edge(AutoMovieViewSection.ELLIPSE, 1);
    const shaped: (r: number) => Measured = (r: number): Measured =>
      measure(
        box,
        departures.map(
          (d: number): number => r + d,
        ) as AutoMovieViewSection.ISection["shoulders"],
      );
    const girths: [number, number] = [shaped(lo).girth, shaped(hi).girth];
    return girths.every(Number.isFinite) && girths[0] < girths[1]
      ? { shoulder: [lo, hi], girth: girths }
      : null;
  }

  /**
   * Prepare and measure the identical numeric candidate before admission.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The existing conic preparation and native arclength evaluate the actual box and four shoulders in their original order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measured record is shared by reach, target residual, fault and selected-source publication.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite length and native construction failure remain in the original record; no fallback or alternate integrator is used.
   * @evidence contracts/development/common.md#meaningful-documentation Girth uses source length units, normally calibration millimetres; inspection knots have not been materialized.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four native quarters and the existing bounded native length work; no display samples or diagonal radius queries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller can reuse this actual source for the same numeric shoulder in one immutable solve; this function itself skips no calls or callback effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned source; holds no cache or resource after return.
   */
  export function measure(
    box: AutoMovieViewSection.IBox,
    shoulders: AutoMovieViewSection.ISection["shoulders"],
  ): Measured {
    const value: Measured = AutoMovieViewSectionConic.prepare(box, shoulders);
    value.girth = AutoMovieViewSectionConic.length(value);
    return value;
  }
}
