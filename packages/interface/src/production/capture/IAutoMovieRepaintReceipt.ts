import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { IAutoMovieProductionMediaProbe } from "../IAutoMovieProductionMediaProbe";
import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";
import { IAutoMovieRepaintExecutionPolicy } from "./IAutoMovieRepaintExecutionPolicy";
import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintRequestEvidence } from "./IAutoMovieRepaintRequestEvidence";

/**
 * Immutable provenance for one admitted repaint candidate; candidate admission is separate from active selection and completed visual review.
 *
 * @evidence contracts/common.md#principled-implementation The host binds current deterministic source, controls, fixed reference digests, exact adapter identity and output media facts to one successful invocation, with version-four request, timing, cost and policy records retained for bounded execution provenance.
 * @evidence contracts/common.md#clear-and-simple-design Source technical authority, generator context, authored controls and candidate output remain distinct receipt groups, allowing guarded selection and sequence review to reference the immutable candidate without mutating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate bytes never become geometry, contact or timing truth; optional legacy execution fields do not imply current bounded-attempt proof, and descriptive generator metadata does not prove rights review.
 * @evidence contracts/common.md#meaningful-documentation Defines version compatibility, request/attempt ownership, source and references, optional execution provenance, deterministic structural authority and verified output byte/media identity.
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

  /** Verified rendition output. */
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
