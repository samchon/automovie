import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import type { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";

/**
 * Recomputable identity of one exact render-plan generation and runtime.
 *
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Preserves the complete runtime closure that produced a publication.
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Preserves the exact plan provenance beside delivered bytes.
 * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Makes publication identity structured and independently recomputable.
 * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-publication-preconditions Supplies the candidate identity checked at publication boundaries.
 */
export interface IAutoMovieProductionPublicationIdentity {
  /**
   * Closed identity protocol.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Versions the identity whose changes invalidate prior outputs.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Closes the recomputation protocol.
   */
  protocolVersion: "automovie.production-publication.v4";
  /**
   * Persisted render-plan schema.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Invalidates publications across plan-schema changes.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Identifies the plan projection being recomputed.
   */
  planVersion: 4;
  /**
   * Production namespace whose plan produced the publication.
   * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Joins delivery provenance to its production.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Prevents cross-production adoption.
   */
  productionId: string;
  /**
   * Exact builder input used by the plan.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Invalidates delivery after builder-input change.
   * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-publication-preconditions Supplies the input precondition.
   */
  compileFingerprint: AutoMovieContentDigest;
  /**
   * Exact builder-owned edit used by the plan.
   * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Records the editorial generation.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Binds the package to one edit.
   */
  editFingerprint: AutoMovieContentDigest;
  /**
   * Complete installed capture, dialogue, and encoder closure.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Preserves runtime identity.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Makes runtime provenance inspectable.
   */
  runtimeIdentity: {
    /** Render-runtime identity protocol. */
    protocolVersion: "automovie.production-render-runtime.v3";
    /** Digest of declared viewer, capture, asset, and package inputs. */
    sourceDigest: AutoMovieContentDigest;
    /** Final-byte dialogue generation, or null for a silent plan. */
    dialogueRuntimeIdentity: AutoMovieContentDigest | null;
    /** Exact browser and graphics capture closure. */
    capture: IAutoMovieCaptureRuntimeIdentity;
    /** Exact encoder closure and arguments. */
    encoder: {
      /** Encoder package name. */
      package: string;
      /** Encoder package version. */
      version: string;
      /** Digest of the installed executable closure. */
      closureDigest: AutoMovieContentDigest;
      /** Closed video codec. */
      codec: "h264";
      /** Every byte-affecting encoder argument. */
      arguments: {
        /** Constant-rate-factor analogue. */
        quantizationParameter: number;
        /** Encoder speed setting. */
        speed: number;
        /** Key-frame period in frames. */
        groupOfPictures: number;
      };
    };
  };
  /**
   * Proxy or final policy, compared only with the same tier.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Makes tier-policy change invalidate that tier.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-publication-retention Keeps proxy and final histories independent.
   */
  tier: {
    /** Independent proxy or final publication family. */
    kind: "proxy" | "final";
    /** Output raster multiplier. */
    resolutionScale: number;
    /** Source-frame sampling interval. */
    frameStep: number;
  };
  /**
   * Compiler-owned full-rate format.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Includes source format in invalidation.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Records the source picture contract.
   */
  sourceFrameFormat: IAutoMovieProductionDesign["frameFormat"];
  /**
   * Exact tier output format.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Includes output format in invalidation.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Records the delivered picture contract.
   */
  frameFormat: IAutoMovieProductionDesign["frameFormat"];
  /**
   * Tier output frame count.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Includes extent in invalidation.
   * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-publication-preconditions Records the complete planned extent.
   */
  totalFrames: number;
  /**
   * Maximum planned chunk span.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Includes chunking policy in identity.
   * @evidence specifications/execution-and-recovery/artifacts-and-atomic-publication.md#execution-publication-preconditions Records the candidate plan partition.
   */
  chunkFrames: number;
  /**
   * Canonical chunk identity projection in plan order.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-missing-artifact-refusal Requires the complete chunk population.
   * @evidence specifications/validation-and-diagnostics/partial-artifacts-and-refusal.md#validation-resume-verified-artifacts Allows reuse only from verified chunks.
   */
  chunks: Array<{
    /** Stable operational slot. */
    slot: string;
    /** Content-addressed chunk identity. */
    id: AutoMovieContentDigest;
    /** Owning deliverable. */
    deliverable: string;
    /** Moving-image deliverable class. */
    kind: "feature" | "guide-pass";
    /** Beauty or structural render pass. */
    pass: AutoMovieGuidePass;
    /** Inclusive output-frame boundary. */
    frameStart: number;
    /** Exclusive output-frame boundary. */
    frameEndExclusive: number;
    /** Digest of the complete exact frame mapping. */
    frames: AutoMovieContentDigest;
  }>;
  /**
   * Canonical identities of every non-video publication track.
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-artifact-invalidation Includes every track dependency in invalidation.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Completes package provenance beyond picture chunks.
   */
  tracks: {
    /** Canonical caption-track digest. */
    captions: AutoMovieContentDigest;
    /** Canonical dialogue-track digest. */
    audio: AutoMovieContentDigest;
    /** Canonical source-audio inventory digest. */
    audioAssets: AutoMovieContentDigest;
    /** Canonical film-effect runtime digest. */
    effects: AutoMovieContentDigest;
  };
  /**
   * Digest of the canonical identity fields above.
   * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Makes provenance compactly comparable.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Requires independent recomputation from structured fields.
   */
  fingerprint: AutoMovieContentDigest;
}
