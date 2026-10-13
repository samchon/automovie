import { IAutoMovieSemanticMaskReceipt } from "../../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieContentDigest } from "../AutoMovieContentDigest";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";

/** Persisted provenance returned for one verified capture. */
export interface IAutoMovieCaptureReceipt {
  /** Receipt format. */
  version: 2;

  /** Production namespace used to resolve the registry target. */
  productionId: string;

  /** Exact evidence target. */
  target: AutoMovieCaptureTarget;

  /** Current builder-owned target registry fingerprint. */
  compileFingerprint: AutoMovieContentDigest;

  /** Target-local render fingerprint from the verified bundle manifest. */
  targetFingerprint: AutoMovieContentDigest;

  /** Canonical structured capture-runtime identity. */
  rendererIdentity: string;

  /** Content-addressed project-relative render bundle. */
  bundle: string;

  /** Verified PNG digest. */
  outputDigest: AutoMovieContentDigest;

  /** Semantic dependency of a shot mask, or null for every other product. */
  semanticMask: IAutoMovieSemanticMaskReceipt | null;
}
