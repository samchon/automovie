import { AutoMovieSubjectReviewDescription, IAutoMovieCaptureRuntimeIdentity, IAutoMovieDiagnostic, IAutoMovieSubjectReviewCoverage, IAutoMovieSubjectReviewTarget, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { IAutoMovieSubjectInspectionPlanRecord } from "./IAutoMovieSubjectInspectionPlanRecord";
import { IAutoMovieSubjectInspectionView } from "./IAutoMovieSubjectInspectionView";

/**
 * Return the resolved current subject, exact plan, captured prefix, coverage and inspection diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Result fields distinguish unresolved state, plan context, current host metadata, per-view captures and whole inspected status.
 * @evidence contracts/common.md#clear-and-simple-design The service returns one coherent report while engine coverage and physical persistence keep their own responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No product caller currently uses the service; deliveryEvidence false is a typed lane distinction, not a guarantee against arbitrary external byte reuse.
 * @evidence contracts/common.md#meaningful-documentation Partial failures can carry a plan/prefix without coverage, and null runtime/revision means those observations were unavailable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Capture, plan/hash, journal and coverage work execute in the service/helper owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same resolved description and plan supply result and coverage without rebuilding an expected subject.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains arrays/descriptions from the sweep; disk artifacts and host resources have independent, unbounded/external lifetimes.
 *
 * @author Samchon
 */
export interface IAutoMovieInspectSubject {
  /**
   * True only when every planned viewpoint produced a verified observation.
   */
  inspected: boolean;

  /**
   * Production namespace the request resolved against.
   */
  productionId: string;

  /**
   * Compiled artifact and stable subject id that were opened.
   */
  target: IAutoMovieSubjectReviewTarget;

  /**
   * Revision of the compiled artifact the subject was read from, or null.
   */
  revision: string | null;

  /** Exact ordered current plan identity, or null before a plan exists. */
  planIdentity: string | null;

  /** Exact versioned current plan record, or null before a plan exists. */
  planRecord: IAutoMovieSubjectInspectionPlanRecord | null;

  /** Complete actual capture runtime, or null when it was unidentified. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity | null;

  /**
   * Compiled description of the subject, or null when it did not resolve.
   */
  subject: AutoMovieSubjectReviewDescription | null;

  /**
   * Inspection-owned viewpoint plan in deterministic order.
   */
  plan: IAutoMovieSubjectReviewViewpoint[];

  /**
   * One entry per observation the host instrument actually produced.
   */
  views: IAutoMovieSubjectInspectionView[];

  /**
   * Planned against observed coverage, or null when nothing resolved.
   */
  coverage: IAutoMovieSubjectReviewCoverage | null;

  /**
   * Always false in the inspection output; typed consumers requiring true reject this lane.
   */
  deliveryEvidence: false;

  /**
   * Exact refusal diagnostics, empty on success.
   */
  diagnostics: IAutoMovieDiagnostic[];
}

export namespace IAutoMovieInspectSubject {
  /**
   * One subject inspection request.
   *
   * @evidence contracts/common.md#principled-implementation Current namespace, compiled shot/subject and explicit raster/ring options select one inspection request.
   * @evidence contracts/common.md#clear-and-simple-design Optional host namespace selection belongs to serve/context while inspect owns its current subject and viewpoint rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Options request a plan rather than proving it was observed; unavailable host/target/formation frames remain explicit refusals.
   * @evidence contracts/common.md#meaningful-documentation Shot and subject identify current compiled content; service defaults are six azimuths, twenty-degree elevation and factor 1.25 with production raster bounds.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace resolution and status/plan/capture work execute in serve/inspect owners, not this erased request schema.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same admitted input drives plan and draw dimensions; this type implements no host or result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller and in-flight service own request lifetime; this schema acquires no browser, image or stored history.
   *
   * @author Samchon
   */
  export interface IProps {
    /**
     * Optional production namespace; required when the host has no default.
     */
    productionId?: string;

    /**
     * Compiled shot artifact that owns the stable subject id.
     */
    shot: string;

    /**
     * Stable namespaced subject id, such as `element:hall-oriel-2`.
     */
    subject: string;

    /**
     * Evenly spaced azimuths per elevation ring; six by default.
     */
    azimuthCount?: number;

    /**
     * Elevation rings in degrees, in the order they are walked; `[20]` by default.
     */
    elevationsDeg?: number[];

    /**
     * Positive multiplier on the distance fitting the selected bounds' floored sphere; `1.25` by default. Values below one request tighter framing, and bounds-based fitting does not prove visible subject coverage.
     */
    distanceFactor?: number;

    /**
     * Optional positive integer width no larger than production width.
     */
    width?: number;

    /**
     * Optional positive integer height no larger than production height.
     */
    height?: number;
  }
}
