import type { IAutoMovieCurve64 } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import type { IAutoMovieCurveGrid64 } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurveGrid64.ts";
import type { fitCurve } from "../fit/fitCurve.ts";

/**
 * Groups the private face compiler's curve-family and evidence contracts in one type-only namespace.
 * Coordinates remain in the manifest's source-frame millimetres and topology ownership is explicit.
 *
 * @evidence contracts/common.md#principled-implementation Types distinguish measured paths, optional fitted cubics, evaluated skin and qualification limits without introducing geometry behavior.
 * @evidence contracts/common.md#clear-and-simple-design One erased namespace names the contract shared by the regional adapters and compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source coordinates, reference identities or hidden acceptance defaults are embedded in the types.
 * @evidence contracts/common.md#meaningful-documentation Documents source-frame units, ownership and the distinction between observations and evaluated geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type-only namespace is erased and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type-only namespace coordinates no requests or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type-only namespace owns no runtime resources.
 */
export namespace faceTypes {
  /**
   * A source-frame XYZ position or derivative vector; the containing field distinguishes their units.
   *
   * @evidence contracts/common.md#principled-implementation A fixed three-number tuple preserves the explicit Euclidean coordinate dimension.
   * @evidence contracts/common.md#clear-and-simple-design The same structural tuple is used by source paths and analytic evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The tuple embeds no provider data or body-specific values.
   * @evidence contracts/common.md#meaningful-documentation States frame, coordinate order and derivative-unit ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased tuple type chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased tuple type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An erased tuple type owns no resources.
   */
  export type Point = [number, number, number];

  /**
   * One ordered open source path at a physical family station; an optional producer fit is reused without refitting.
   *
   * @evidence contracts/common.md#principled-implementation Source points and their optional certified cubic fit retain distinct roles at one physical station.
   * @evidence contracts/common.md#clear-and-simple-design A single descriptor feeds both measured and already-fitted regional observations to the compiler.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No original mesh topology or coordinate-weld policy is present.
   * @evidence contracts/common.md#meaningful-documentation States ordering, station meaning and optional fit ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased data interface chooses no processing strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime fit reuse belongs to the compiler, not this interface.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An erased interface retains no arrays itself.
   * @author Samchon
   */
  export interface Section {
    /** Stable observation identifier retained in actual engine construction. */
    id: string;

    /** Physical family coordinate, millimetres or degrees as declared by its producer. */
    station: number;

    /** Ordered open source polyline in the manifest's millimetre frame. */
    points: Point[];

    /** Optional complete open cubic fit with its polygon-only error certificate. */
    fitted?: ReturnType<typeof fitCurve>;
  }
  /**
   * One owned open-section family, ordered by physical station with shared source-arclength knots.
   * Periodic families declare the complete station period; boundaryMeaning records the producer's cut convention.
   *
   * @evidence contracts/common.md#principled-implementation Explicit periodicity, knots and ownership describe the premises of one reproducible regional surface.
   * @evidence contracts/common.md#clear-and-simple-design The contract keeps section geometry, correspondence and boundary conventions together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Limits remain explicit data and no body identity selects different behavior.
   * @evidence contracts/common.md#meaningful-documentation States physical station ordering, source-arclength knots and complete-period semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract specifies no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased contract coordinates no cache or in-flight work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased contract acquires no handles or retained state.
   * @author Samchon
   */
  export interface Family {
    /** Unique regional patch identifier within the candidate model. */
    id: string;

    /** Author responsible for source frame, chart and boundary observations. */
    owner: string;

    /** Whether the station dimension closes into one declared period. */
    periodic: boolean;

    /** Complete positive station period; required when periodic is true. */
    period?: number;

    /** Increasing fit stations; reserved observations are absent from this array. */
    sections: Section[];

    /** Reserved source sections excluded from this fit invocation; prior observation and design mean these are retrospective interpolation diagnostics, not untouched independent validation. */
    heldOutSections?: Section[];

    /** Increasing normalized source-arclength chart waypoints, including zero and one. */
    knots: number[];

    /** Display labels for waypoints; labels alone establish no anatomical correspondence. */
    knotLabels: string[];

    /** Source cut convention and unresolved anatomical interpretation of each boundary. */
    boundaryMeaning: string;

    /** Producer uncertainty and unqualified regions propagated to every candidate. */
    limits: string[];
  }
  /**
   * One actual generating section or surface isocurve, with explicit closure and display classification.
   *
   * @evidence contracts/common.md#principled-implementation Displayed points come from the same surface evaluator rather than unrelated source overlays.
   * @evidence contracts/common.md#clear-and-simple-design Geometry and the minimal renderer classification travel in one line descriptor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure is declared rather than imposed on open paths.
   * @evidence contracts/common.md#meaningful-documentation States actual-construction provenance and closure semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased display descriptor chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased descriptor coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased descriptor owns no resources.
   * @author Samchon
   */
  export interface Line {
    /** Actual generating section or derived guide identifier. */
    name: string;

    /** Whether display connects the final evaluated point to the first. */
    closed: boolean;

    /** Evaluated engine construction converted to source-frame millimetres. */
    points: Point[];

    /** Diagnostic CSS colour, without geometric meaning. */
    color: string;

    /** Display classification distinguishing generating sections and derived guides. */
    cls: string;
  }
  /**
   * One evaluated regional candidate with indexed skin, actual construction and shared boundary derivatives.
   * Boundary vectors are derivatives with respect to normalized section parameter or physical station;
   * qualification records section-only fit bounds separately from unresolved surface and visual acceptance.
   *
   * @evidence contracts/common.md#principled-implementation Separate skin, construction and boundary derivative fields preserve the generating operator's provenance and limits.
   * @evidence contracts/common.md#clear-and-simple-design One result carries all data needed for joint-boundary assembly and actual-viewer inspection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fit bounds and knot residuals cannot implicitly claim injectivity or appearance acceptance.
   * @evidence contracts/common.md#meaningful-documentation States derivative parameter units and distinguishes numeric fit evidence from surface qualification.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output contract chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse belongs to the runtime compiler and serializer, not the interface.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased contract owns no runtime arrays or handles.
   * @author Samchon
   */
  export interface Result {
    /** Stable patch key, also used for the model part and output filename. */
    id: string;

    /** Actual metre-valued engine result consumed by the repository viewer. */
    engine: IAutoMovieCurveGrid64.Result;

    /** Complete millimetre cubic coefficients actually passed to the engine. */
    curves: IAutoMovieCurve64.Cubic[];

    /** Diagnostic serialization of generated positions in millimetres. */
    vertices: Point[];

    /** Engine triangle indices, regrouped without re-tessellation or welding. */
    triangles: [number, number, number][];

    /** Dimensionless engine normals derived from generated triangles. */
    normals: Point[];

    /** Actual engine construction converted to mm; no independent control-point overlay is inferred. */
    construction: { lines: Line[]; points: never[] };

    /** Course-start/end and station-first/last positions in millimetres. */
    boundaries: { start: Point[]; end: Point[]; first: Point[]; last: Point[] };

    /** Analytic boundary partials, mm per normalized course for start/end and mm per station unit for first/last. */
    derivatives: {
      start: Point[];
      end: Point[];
      first: Point[];
      last: Point[];
    };

    /** Separate curve-fit, sampling and unresolved visual qualification observations. */
    qualification: {
      /** Maximum producer polygon-only fitting certificate in mm. */
      maxFitBoundMm: number;

      /** Sampled feature-pin residual in mm after declared curve-domain conversion. */
      maximumKnotResidualMm: number;

      /** Source fitted joins explicitly classified as C0. */
      c0CurveJoins: number;

      /** Smallest nonzero generated triangle area in square mm. */
      minimumTriangleAreaMm2: number;

      /** Compatibility field counting omitted zero-area triangles, not rectangular cells. */
      zeroAreaCells: number;

      /** Retrospective prediction errors on reserved angular source sections; these paths and identities were previously inspected during development, so no untouched independence is claimed. */
      heldOut?: {
        kind: "angular-station";
        sections: number;
        samples: number;
        maximumMm: number;
        rmsMm: number;
        scope: "retrospective-leave-section-out";
        independentOfFittedSections: false;
        untouchedIndependentValidation: false;
        populationIndependent: false;
      };

      /** Actual consumed contract and engine operator chain. */
      method: string;

      /** Explicit correspondence, shape, sampling and assembly gaps; no implicit acceptance. */
      limits: string[];
    };
  }
}
