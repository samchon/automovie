import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec";
import { IAutoMovieSemanticMaskReceipt } from "../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** Content-addressed manifest for preview and production frames. */
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

  /** Compile fingerprint whose bytes were rendered. */
  compileFingerprint: AutoMovieContentDigest;

  /**
   * Final-byte dialogue and viseme identity installed before these pixels were
   * drawn, or null when this target consumes no dialogue runtime.
   */
  dialogueRuntimeIdentity: AutoMovieContentDigest | null;

  /** Canonical JSON encoding of one validated capture runtime identity. */
  rendererIdentity: string;

  /**
   * Target-local render identity. Unlike the aggregate compile fingerprint,
   * this changes only when this target's compiled bytes or declared viewer,
   * capture, configuration, or asset inputs change. `rendererIdentity`
   * separately distinguishes the browser and graphics backend.
   */
  targetFingerprint: AutoMovieContentDigest;

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
    digest: AutoMovieContentDigest;

    /** Pixel width. */
    width: number;

    /** Pixel height. */
    height: number;
  }>;

  /** Complete semantic dependencies of mask frames in this bundle. */
  semanticMasks: IAutoMovieSemanticMaskReceipt[];
}
