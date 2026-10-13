import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import type { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";

/** Recomputable identity of one exact render-plan generation and runtime. */
export interface IAutoMovieProductionPublicationIdentity {
  /** Closed identity protocol. */
  protocolVersion: "automovie.production-publication.v4";

  /** Persisted render-plan schema. */
  planVersion: 4;

  /** Production namespace whose plan produced the publication. */
  productionId: string;

  /** Exact builder input used by the plan. */
  compileFingerprint: AutoMovieContentDigest;

  /** Exact builder-owned edit used by the plan. */
  editFingerprint: AutoMovieContentDigest;

  /** Complete installed capture, dialogue, and encoder closure. */
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

  /** Proxy or final policy, compared only with the same tier. */
  tier: {
    /** Independent proxy or final publication family. */
    kind: "proxy" | "final";

    /** Output raster multiplier. */
    resolutionScale: number;

    /** Source-frame sampling interval. */
    frameStep: number;
  };

  /** Compiler-owned full-rate format. */
  sourceFrameFormat: IAutoMovieProductionDesign["frameFormat"];

  /** Exact tier output format. */
  frameFormat: IAutoMovieProductionDesign["frameFormat"];

  /** Tier output frame count. */
  totalFrames: number;

  /** Maximum planned chunk span. */
  chunkFrames: number;

  /** Canonical chunk identity projection in plan order. */
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

  /** Canonical identities of every non-video publication track. */
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

  /** Digest of the canonical identity fields above. */
  fingerprint: AutoMovieContentDigest;
}
