import type { IAutoMovieModelCrossing } from "@automovie/engine";

import type { IAutoMovieHumanBodyAnatomicalInspection } from "../anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "../anatomy/generated/IAutoMovieHumanBodyExteriorCandidateBuild";
import type { IAutoMovieHumanBodyFootSupport } from "../structures/IAutoMovieHumanBodyFootSupport";
import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { IConnectedBodyFemoralHeads } from "./IConnectedBodyFemoralHeads";
import type { IConnectedBodyMeasuredAnatomy } from "./IConnectedBodyMeasuredAnatomy";
import type { IConnectedBodyRigReading } from "./IConnectedBodyRigReading";
import type { IConnectedBodyUnavailableAnatomy } from "./IConnectedBodyUnavailableAnatomy";

/**
 * Numerical preview buffers and available observations from one evaluation. Packed mesh buffers are newly owned by this reply, while model metadata and some extras borrow the completed build until worker transport clones them. Optional reports depend on the selected runtime; null can mean not requested, no applicable target, or a contact read superseded by a newer request.
 *
 * Articular and exterior candidate runtimes attach their distinct report without claiming resolved clinical skin. A body runtime can return a completed model with null contacts after supersession, so the transport's request identity remains responsible for choosing which reply to display.
 *
 * @evidence contracts/common.md#principled-implementation The preview discriminator packages the actual static build and producer-specific observations, preserving separate measured, unavailable and candidate representations.
 * @evidence contracts/common.md#clear-and-simple-design Shared model transport coexists with optional owning reports; individual numerical readers keep their refusal and measurement semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null is not a healthy-contact certificate, candidate buffers do not certify clinical anatomy, and stale reply selection stays with request-aware transport.
 * @evidence contracts/common.md#meaningful-documentation The prose describes buffer versus metadata ownership, runtime-specific reports and not-requested or superseded null states.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This reply interface executes no packing, crossings or candidate construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type implements no accepted-build reuse or transaction ordering.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Producers and worker transport own buffer retention and transfer, outside this erased declaration.
 *
 * @author Samchon
 */
export interface IConnectedBodyPreviewResult {
  /** Reply kind. */
  operation: "preview";

  /** Transferable preview model. */
  model: ConnectedBodyModel;

  /** Body contact output, or null when omitted, unsupported by this runtime, or superseded during reading. */
  crossings: IAutoMovieModelCrossing[] | null;

  /** Humeral-head fit or refusal; null when omitted, unsupported, or contact work was superseded. */
  anatomy:
    | IConnectedBodyMeasuredAnatomy
    | IConnectedBodyUnavailableAnatomy
    | null;

  /** Requested femoral radius fits without acquisition metadata; null for no radius, omitted anatomy or superseded contacts, and absent in other runtime variants. */
  femoralHeads?: IConnectedBodyFemoralHeads | null;

  /** Available foot ground gaps; null when anatomy is omitted or no plane/ground witness exists, with missing foot regions omitted from the array. */
  groundSupport?: IAutoMovieHumanBodyFootSupport[] | null;

  /** Producer-specific build records, borrowed until structured worker transport clones them. */
  extras: Record<string, unknown>;

  /** Returned rest/posed placement readings from this same construction. */
  rigReading?: IConnectedBodyRigReading;

  /** Candidate-only numerical inspection; legacy body previews omit it. */
  anatomicalRequest?: IAutoMovieHumanBodyAnatomicalInspection;

  /** Actual source-conditioned exterior; never a resolved clinical skin. */
  exteriorCandidate?: IAutoMovieHumanBodyExteriorCandidateBuild["exterior"];
}
