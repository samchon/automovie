import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { IAutoMovieProductionMediaProbe } from "../IAutoMovieProductionMediaProbe";
import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";
import { IAutoMovieRepaintExecutionPolicy } from "./IAutoMovieRepaintExecutionPolicy";
import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintRequestEvidence } from "./IAutoMovieRepaintRequestEvidence";

/**
 * Retained provenance shape for one repaint candidate; no current product producer admits candidates or commits this receipt.
 *
 * @evidence contracts/common.md#principled-implementation Explicit groups describe source identity, reference digests, adapter identity and output media claims, with optional request, timing, cost and policy records. The erased type binds or verifies none of those supplied values.
 * @evidence contracts/common.md#clear-and-simple-design Source authority, generator context, controls and candidate output occupy distinct groups without embedding a renderer, provider or selection transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The structural-authority literal states the intended boundary; supplied digests and media facts prove neither actual bytes nor bounded attempts, and descriptive generator metadata does not prove rights review.
 * @evidence contracts/common.md#meaningful-documentation Defines version compatibility, intended request/attempt ownership, source and references, optional execution provenance and output byte/media claims, with producer absence explicit.
 * @author Samchon
 */
export interface IAutoMovieRepaintReceipt {
  /** Receipt format. */
  version: 3 | 4;

  /** Owning production namespace. */
  productionId: string;

  /** Exact compiled shot id. */
  shot: string;

  /** Current builder registry fingerprint. */
  compileFingerprint: string;

  /** Digest over deterministic source manifest and frame bytes. */
  sourceRenderFingerprint: string;

  /** Immutable identity shared by the transport attempts of one request. */
  requestId?: string;

  /** Host-generated identity of this repaint invocation. */
  attemptId: string;

  /** UTC instant captured immediately before this provider call. */
  startedAt?: string;

  /** UTC instant captured when the validated candidate completed. */
  completedAt?: string;

  /** Metered cost charged to this successful attempt. */
  costUnits?: number;

  /** Complete bounded policy under which the request executed. */
  executionPolicy?: IAutoMovieRepaintExecutionPolicy;

  /** Content-addressed deterministic source bundle. */
  sourceBundle: string;

  /** Structural passes supplied to the adapter. */
  controls: Array<{
    /** Structural pass name. */
    pass: Exclude<AutoMovieGuidePass, "beauty">;

    /** Ordered source-frame digests for this pass. */
    frameDigests: string[];
  }>;

  /** Fixed reference identities supplied to the adapter. */
  references: Array<{
    /** Exact non-collapsible reference role. */
    role: AutoMovieRepaintReferenceRole;

    /** Project-relative manifest path. */
    path: string;

    /** Current byte digest. */
    digest: string;
  }>;

  /** Canonical structured adapter/model identity. */
  adapterIdentity: string;

  /** Authored generator cost/consumer context and optional descriptive metadata retained with the exact candidate bytes. */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;

  /**
   * Authority boundary of the derived appearance.
   *
   * The rendition may be the audience-visible delivery, but it never becomes geometry, motion, contact, camera, timing, or prototype-fidelity truth.
   */
  structuralAuthority: "deterministic-source-only";

  /** Exact generation parameters. */
  parameters: IAutoMovieRepaintParameters;

  /** Stable evidence addresses from which this immutable request was formed. */
  evidence?: IAutoMovieRepaintRequestEvidence;

  /** Claimed rendition output; this type does not reopen or parse its bytes. */
  output: {
    /** Render-root-relative content-addressed path. */
    path: string;

    /** Exact output bytes digest. */
    digest: string;

    /** Exact output byte length. */
    bytes: number;

    /** Parsed media facts. */
    probe: IAutoMovieProductionMediaProbe;
  };
}
