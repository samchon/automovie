import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMovieRenderBundleManifest } from "./IAutoMovieRenderBundleManifest";
import { AutoMovieRepaintReferenceRole } from "./capture/AutoMovieRepaintReferenceRole";
import { IAutoMovieRepaintParameters } from "./capture/IAutoMovieRepaintParameters";

/** Host input for one structure-preserving shot repaint. */
export interface IAutoMovieProductionRepaintInput {
  /** Attempt-scoped cancellation boundary. */
  signal: AbortSignal;

  /** Active project root. */
  projectRoot: string;

  /** Active production namespace. */
  productionId: string;

  /** Current builder-owned registry fingerprint. */
  compileFingerprint: AutoMovieContentDigest;

  /** Exact compiled shot id. */
  shot: string;

  /** Verified deterministic source identity and bytes. */
  source: {
    /** Project-relative content-addressed source bundle. */
    bundle: string;

    /** Verified source bundle manifest. */
    manifest: IAutoMovieRenderBundleManifest;

    /** Digest over the verified manifest and frame bytes. */
    fingerprint: AutoMovieContentDigest;

    /** Current decoded source frames. */
    frames: Array<{
      /** Frame index. */
      index: number;

      /** Frame time. */
      time: number;

      /** Beauty or structural pass. */
      pass: AutoMovieGuidePass;

      /** Exact PNG digest. */
      digest: AutoMovieContentDigest;

      /** Raw verified PNG bytes. */
      bytes: Uint8Array;
    }>;

    /** Capture runtime that produced the deterministic controls. */
    captureRuntime: IAutoMovieCaptureRuntimeIdentity;
  };

  /** Verified fixed reference bytes. */
  references: Array<{
    /** Exact non-collapsible role; `character` means identity. */
    role: AutoMovieRepaintReferenceRole;

    /** Project-relative asset-manifest path. */
    path: string;

    /** Current digest. */
    digest: AutoMovieContentDigest;

    /** Current bytes. */
    bytes: Uint8Array;
  }>;

  /** Exact generation controls. */
  parameters: IAutoMovieRepaintParameters;
}
