import type { AutoMovieRecoveryCurveData } from "../../typings/AutoMovieRecoveryCurveData";
import type { AutoMovieRecoveryCurveFormat } from "../../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoveryCurveFit } from "../curve/IAutoMovieRecoveryCurveFit";
import type { IAutoMovieRecoveryContourResumePolicy } from "./IAutoMovieRecoveryContourResumePolicy";
import type { IAutoMovieRecoverySlabs } from "./IAutoMovieRecoverySlabs";

/** Additive failed-contour patches and opaque references to original artifacts.
 * Original source lineages retain their original publication addresses. A
 * successful target references this result's fits array instead. Consumers
 * commit the new patch bytes separately and resolve the two namespaces in an
 * explicit ledger; this result never overwrites an original curve collection.
 *
 * @evidence contracts/common.md#principled-implementation Every patch keeps its verified original raw contour address, artifact-bound actual policy, exact-source face bound, observed edge bound and original physical fitted phase with independent residual diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Original cut bindings, unchanged symbolic publications, requested target outcomes and newly fitted coefficient payloads have separate named fields and index spaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original high-degree, rational, phase and derivative data remain external byte references. New cubics arise only from failed raw targets; bounds do not claim tolerance success or a smooth surface error certificate.
 * @evidence contracts/common.md#meaningful-documentation Documents millimetres, physical widths, index ownership, caller hash/policy verification and complete versus partial requested-patch meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result performs no fit or conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result owns no preparation or persistent cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns new source-free coefficients and copied metadata; original artifact lifetime remains the caller's responsibility.
 */
export interface IAutoMovieRecoveryContourResume<
  Format extends AutoMovieRecoveryCurveFormat = "bezier",
> {
  /** New acquisition/patch identity, distinct from the original artifact. */
  name: string;

  /** Caller-verified original source byte commitment; not hashed by this API. */
  sourceIdentity: string;

  /** Caller-verified registration, selection and original triangle-ordinal commitment. */
  sourceSelectionIdentity: string;

  /** Original caller axis before normalization. */
  axis: IAutoMovieRecoverySlabs["axis"];

  /** Original caller frame reference before projection. */
  reference: IAutoMovieRecoverySlabs["reference"];

  /** Actual normalized zero-origin physical frame shared by all recuts. */
  frame: IAutoMovieRecoverySlabs["frame"];

  /** Independently verified binding scope; original curve geometry remains caller-attested. */
  bindingAuthority: "raw-cut-addresses-and-closure-only";

  /** Source/artifact hashing, registration and actual original policy remain caller obligations. */
  callerBindingRequired: true;

  /** Original coefficient payloads were neither supplied nor read. */
  originalCurveCoefficientsRead: false;

  /** Complete same-order recut ledger retaining original publication addresses, including targeted failures. */
  sections: IAutoMovieRecoverySlabs["sections"];

  /** Untargeted original publications, retained as artifact references without coefficient traversal. */
  preservedOriginals: Array<{
    /** Original signed physical plane coordinate, millimetres. */
    coordinateMm: number;

    /** Original raw cutter ordinal, independent of loop/report and new patch indices. */
    originalRawContourIndex: number;

    /** Byte commitment of the untouched original coefficient artifact, verified by the caller. */
    observationIdentity: string;

    /** Original symbolic curve address or explicit failed/contact classification. */
    publication: IAutoMovieRecoverySlabs["sections"][number]["sourceLineage"][number]["publication"];
  }>;

  /** New patch-local fits only, in successful-target order. Actual physical h and derivative units are preserved by the official algebraic converter. */
  fits: AutoMovieRecoveryCurveData<IAutoMovieRecoveryCurveFit, Format>[];

  /** Requested raw targets in input order. Complete means all requested patches met their original tolerance, independently of unresolved untargeted publications. */
  targets: Array<{
    /** Original signed physical plane coordinate, millimetres. */
    coordinateMm: number;

    /** Original raw cutter ordinal; never a new coefficient index. */
    originalRawContourIndex: number;

    /** Caller-verified original artifact byte identity. */
    observationIdentity: string;

    /** Unchanged original failed-publication diagnostic. */
    previousFailureDiagnostic: string;

    /** Caller-attested actual policy used by the committed original artifact. */
    originalPolicy: IAutoMovieRecoveryContourResumePolicy;

    /** Actual raw cut closure, not inferred from its earlier failed fit. */
    closed: boolean;

    /** Raw point count N; closed cuts omit a repeated endpoint. */
    actualObservationCount: number;

    /** Actual cutter edge count E, N for a closed cut and N minus one for a nonempty open cut. Contacts have zero edges. */
    actualRawEdgeCount: number;

    /** Distinct original triangles F that emitted this raw contour's exact cutter edges or contacts. */
    exactSourceFaceCount: number;

    /** Conservative preplan span bound 3F; broad endpoint-star incidence is not used. */
    plannedSpanUpperBound: number;

    /** New adaptive budget E; zero means a degenerate target is not fitted. */
    maxSpans: number;

    /** New patch address and material-side winding when fitted; otherwise the explicit failure. Diagnostics retain unmet tolerance and open-domain limitations. */
    outcome:
      | {
          kind: "fitted";
          patchCurveIndex: number;
          winding?: 1 | -1;
          diagnostics: string[];
        }
      | { kind: "failed"; diagnostic: string; diagnostics: string[] };
  }>;
}
