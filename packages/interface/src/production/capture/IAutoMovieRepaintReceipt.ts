import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "../AutoMovieContentDigest";
import { IAutoMovieProductionMediaProbe } from "../IAutoMovieProductionMediaProbe";
import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";
import { IAutoMovieRepaintExecutionPolicy } from "./IAutoMovieRepaintExecutionPolicy";
import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintRequestEvidence } from "./IAutoMovieRepaintRequestEvidence";

/** Immutable provenance for one accepted repaint rendition. */
export interface IAutoMovieRepaintReceipt {
  /** Receipt format. */
  version: 3 | 4;

  /** Owning production namespace. */
  productionId: string;

  /** Exact compiled shot id. */
  shot: string;

  /** Current builder registry fingerprint. */
  compileFingerprint: AutoMovieContentDigest;

  /** Digest over deterministic source manifest and frame bytes. */
  sourceRenderFingerprint: AutoMovieContentDigest;

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
    frameDigests: AutoMovieContentDigest[];
  }>;

  /** Fixed reference identities supplied to the adapter. */
  references: Array<{
    /** Exact non-collapsible reference role. */
    role: AutoMovieRepaintReferenceRole;

    /** Project-relative manifest path. */
    path: string;

    /** Current byte digest. */
    digest: AutoMovieContentDigest;
  }>;

  /** Canonical structured adapter/model identity. */
  adapterIdentity: string;

  /** Reviewed generator adoption retained with the exact rendition bytes. */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;

  /**
   * Authority boundary of the derived appearance.
   *
   * The rendition may be the audience-visible delivery, but it never becomes
   * geometry, motion, contact, camera, timing, or prototype-fidelity truth.
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
    digest: AutoMovieContentDigest;

    /** Exact output byte length. */
    bytes: number;

    /** Parsed media facts. */
    probe: IAutoMovieProductionMediaProbe;
  };
}
