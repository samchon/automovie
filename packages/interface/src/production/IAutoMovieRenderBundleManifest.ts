import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec";
import { IAutoMovieSemanticMaskReceipt } from "../render/IAutoMovieSemanticMaskReceipt";

/**
 * Content-addressed manifest binding verified preview or production PNG frames to a target and capture runtime.
 *
 * @evidence contracts/common.md#principled-implementation Bundle publication records current compile and target-local fingerprints, canonical capture identity, installed dialogue runtime and exact decoded PNG metadata, with semantic-mask sidecar dependencies for mask frames.
 * @evidence contracts/common.md#clear-and-simple-design A target union distinguishes model turntable, shot, sequence and film addressing while shared render specification and frame entries describe the same verified bundle format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Part turntables remain diagnostic and cannot satisfy whole-model review; target-local identity permits unrelated compile changes without pretending that browser, graphics or dialogue runtime differences are equivalent pixels.
 * @evidence contracts/common.md#meaningful-documentation Defines target/view parameters, compile versus target-local and capture identity, dialogue null meaning, bundle-relative frame paths, raster units and complete mask dependencies.
 * @author Samchon
 */
export interface IAutoMovieRenderBundleManifest {
  /** Bundle manifest format. */
  version: 6;

  /** Asset, shot, sequence, or film render target. */
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
         * Absent means the whole model was framed, which is the only form the asset review's required views accept.
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

  /** Compile fingerprint whose bytes were rendered. */
  compileFingerprint: string;

  /**
   * Final-byte dialogue and viseme identity installed before these pixels were drawn, or null when this target consumes no dialogue runtime.
   */
  dialogueRuntimeIdentity: string | null;

  /** Canonical JSON encoding of one validated capture runtime identity. */
  rendererIdentity: string;

  /**
   * Target-local render identity. Unlike the aggregate compile fingerprint, this changes only when this target's compiled bytes or declared viewer, capture, configuration, or asset inputs change. `rendererIdentity` separately distinguishes the browser and graphics backend.
   */
  targetFingerprint: string;

  /** Deterministic render specification. */
  renderSpec: IAutoMovieRenderSpec;

  /** Verified PNG frames in the bundle. */
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
    digest: string;

    /** Pixel width. */
    width: number;

    /** Pixel height. */
    height: number;
  }>;

  /** Complete semantic dependencies of mask frames in this bundle. */
  semanticMasks: IAutoMovieSemanticMaskReceipt[];
}
