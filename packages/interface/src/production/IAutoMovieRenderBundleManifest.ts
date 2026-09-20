import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec";
import { IAutoMovieSemanticMaskReceipt } from "../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Content-addressed manifest for preview and production frames.
 *
 * @evidence requirements/acceptance/evidence-and-freshness.md#acceptance-current-historical-evidence Separates current evidence from historical: a bundle is addressed by the target fingerprint it was drawn at, so a previous version's frames remain readable for comparison while never standing in for the current verdict.
 * @evidence specifications/review-and-acceptance/evidence-freshness-and-completeness.md#acceptance-system-current-historical-evidence Types the fingerprint boundary that decides which committed frames are current for a target.
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `IAutoMovieRenderBundleManifest` as the portable data boundary for the agent content supply refusal requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `IAutoMovieRenderBundleManifest` for the spec authoring tool content side effect invariant system contract.
 */
export interface IAutoMovieRenderBundleManifest {
  /**
   * Bundle manifest format.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `version` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `version` for the spec authoring tool content side effect invariant system contract.
   */
  version: 6;

  /**
   * Asset, shot, sequence, or film render target.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `target` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `target` for the spec authoring tool content side effect invariant system contract.
   */
  target:
    | {
        /** Isolated compiled model turntable. */
        kind: "asset";

        /** Model-recipe id. */
        id: string;

        /** Finite turntable azimuth in degrees. */
        angleDeg: number;

        /** Finite camera elevation in degrees. */
        elevationDeg: number;

        /** Rest or required extreme-range rig pose. */
        pose: "rest" | "rom-extremes";

        /**
         * Compiled part the turntable framed, when it framed one.
         *
         * Absent means the whole model was framed, which is the only form the
         * asset review's required views accept.
         */
        part?: string;
      }
    | {
        /** Shot target. */
        kind: "shot";

        /** Shot id. */
        id: string;
      }
    | {
        /** Authored treatment sequence. */
        kind: "sequence";

        /** Stable treatment-sequence id. */
        id: string;
      }
    | {
        /** Film target. */
        kind: "film";

        /** Film id. */
        id: string;
      };

  /**
   * Compile fingerprint whose bytes were rendered.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `compileFingerprint` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `compileFingerprint` for the spec authoring tool content side effect invariant system contract.
   */
  compileFingerprint: AutoMovieContentDigest;

  /**
   * Final-byte dialogue and viseme identity installed before these pixels were
   * drawn, or null when this target consumes no dialogue runtime.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `dialogueRuntimeIdentity` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `dialogueRuntimeIdentity` for the spec authoring tool content side effect invariant system contract.
   */
  dialogueRuntimeIdentity: AutoMovieContentDigest | null;

  /**
   * Canonical JSON encoding of one validated capture runtime identity.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `rendererIdentity` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `rendererIdentity` for the spec authoring tool content side effect invariant system contract.
   */
  rendererIdentity: string;

  /**
   * Target-local render identity. Unlike the aggregate compile fingerprint,
   * this changes only when this target's compiled bytes or declared viewer,
   * capture, configuration, or asset inputs change. `rendererIdentity`
   * separately distinguishes the browser and graphics backend.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `targetFingerprint` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `targetFingerprint` for the spec authoring tool content side effect invariant system contract.
   */
  targetFingerprint: AutoMovieContentDigest;

  /**
   * Deterministic render specification.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `renderSpec` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `renderSpec` for the spec authoring tool content side effect invariant system contract.
   */
  renderSpec: IAutoMovieRenderSpec;

  /**
   * Verified PNG frames in the bundle.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-content-supply-refusal Exposes `frames` as the portable data boundary for the agent content supply refusal requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-content-side-effect-invariant Types `frames` for the spec authoring tool content side effect invariant system contract.
   */
  frames: Array<{
    /** Zero-based frame index. */
    index: number;

    /** Frame time in seconds. */
    time: number;

    /** Render pass. */
    pass: AutoMovieGuidePass;

    /** Bundle-relative PNG path. */
    path: string;

    /** Raw PNG digest. */
    digest: AutoMovieContentDigest;

    /** Pixel width. */
    width: number;

    /** Pixel height. */
    height: number;
  }>;

  /** Complete semantic dependencies of mask frames in this bundle. */
  semanticMasks: IAutoMovieSemanticMaskReceipt[];
}
