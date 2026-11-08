import { AutoMovieHumanHeadLandmarks } from "../AutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadNeckCurves } from "./AutoMovieHumanHeadNeckCurves";

/** Original neck placement and its two measured courses, before any cranial caliper, head mass or guide preparation. */
export namespace AutoMovieHumanHeadNeckLayout {
  /** The same placed layout and original neck declarations, with observed stage costs. */
  export interface IOutput {
    /** Existing head datums plus the original lower-neck curves, calibration mm. */
    readonly layout: IAutoMovieHumanHeadLayout;

    /** Independently available normal source and unresolved lower-family inputs. */
    readonly definition: AutoMovieHumanHeadNeckCurves.IDefinition | null;

    /** Successful lower closure owned by this exact definition; absent before that explicit request. */
    readonly lowerClosure?: {
      /** Same actual normal declaration and lower constraint inputs. */
      readonly definition: AutoMovieHumanHeadNeckCurves.IDefinition;

      /** Identical lower source published in layout.neck.curves. */
      readonly curves: AutoMovieHumanHeadNeckCurves.IOutput;
    };

    /** Synchronous elapsed observations, excluding later head work and lazy queries. */
    readonly milliseconds: Readonly<{
      /** Existing selected-tragion placement, elapsed ms. */
      placement: number;

      /** Complete unchanged normal/base-neck solves and source declarations, elapsed ms. */
      neckOriginal: number;

      /** Actual normal/native/base subintervals and query counts, or null without a supplied base course. */
      neckWork: Readonly<AutoMovieHumanHeadNeckCurves.IWork> | null;
    }>;
  }

  /**
   * Share the identical original arguments between a neck-only and full-head consumer.
   *
   * The existing placement and NeckCurves owner retain every public target,
   * root/quadrature decision, source parameter and failure. This does not
   * prepare a substitute head or postpone work needed by either neck course.
   * A new immutable input owns a fresh preparation; no cross-input cache exists.
   * Bottom, spacing and optional tragion use the input layout's calibration mm;
   * omitted bottom retains y0 and omitted tragion retains the input placement.
   */
  export function create(
    input: IAutoMovieHumanHeadLayout,
    bottom: number | undefined,
    spacing: number,
    tragion?: number,
  ): IOutput {
    return close(define(input, bottom, spacing, tragion));
  }

  /** Resolve placement and the normal original without requesting the separate base constraint. */
  export function define(
    input: IAutoMovieHumanHeadLayout,
    bottom: number | undefined,
    spacing: number,
    tragion?: number,
  ): IOutput {
    const started: number = performance.now();
    const placed: IAutoMovieHumanHeadLayout =
      tragion === undefined
        ? input
        : AutoMovieHumanHeadLandmarks.atTragion(input, tragion);
    const placementDone: number = performance.now();
    const neckWork: AutoMovieHumanHeadNeckCurves.IWork = {
      normalSection: 0, normalAdmission: 0, normalMetric: 0, normalTrials: 0,
      baseSolve: 0, baseMeasurements: 0, baseFixedQueries: 0, baseRadiusQueries: 0,
      baseAffineEvaluations: 0, baseNativeEvaluations: 0, baseNativeReused: 0,
    };
    const definition: AutoMovieHumanHeadNeckCurves.IDefinition | null =
      placed.neck.base === undefined ? null : AutoMovieHumanHeadNeckCurves.define({
                neck: placed.neck,
                base: placed.neck.base,
                bottom: bottom ?? placed.y0,
                menton: placed.menton,
                cranialCentre: placed.centre,
                tragion: placed.landmarks.tragion[1],
                crown: placed.vertex,
                spacing,
              }, neckWork);
    return {
      layout: placed,
      definition,
      milliseconds: {
        placement: placementDone - started,
        neckOriginal: performance.now() - placementDone,
        neckWork: placed.neck.base === undefined ? null : neckWork,
      },
    };
  }

  /** Explicitly close the lower family; a refusal leaves the caller's independent definition intact. */
  export function close(prepared: IOutput): IOutput {
    if (prepared.lowerClosure !== undefined) {
      if (prepared.lowerClosure.definition !== prepared.definition ||
          prepared.lowerClosure.curves !== prepared.layout.neck.curves)
        throw new Error("Neck lower closure belongs to a different generating definition");
      return prepared;
    }
    if (prepared.definition === null) return prepared;
    const started: number = performance.now();
    const work: AutoMovieHumanHeadNeckCurves.IWork = { ...prepared.milliseconds.neckWork! };
    const curves: AutoMovieHumanHeadNeckCurves.IOutput = AutoMovieHumanHeadNeckCurves.close(prepared.definition, work);
    return { ...prepared,
      lowerClosure: { definition: prepared.definition, curves },
      layout: { ...prepared.layout, neck: { ...prepared.layout.neck, curves } },
      milliseconds: { ...prepared.milliseconds,
        neckOriginal: prepared.milliseconds.neckOriginal + performance.now() - started,
        neckWork: work },
    };
  }
}
