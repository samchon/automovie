import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";
import type { IAutoMovieCaptureRuntimeIdentity } from "./IAutoMovieCaptureRuntimeIdentity";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";

/**
 * Recomputable identity of one exact render-plan generation and byte-affecting runtime closure.
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON hashing binds compile and edit identity, installed capture and encoder closure, tier projection, complete chunk frame mappings and non-video track digests; semantic admission verifies an exact per-deliverable partition before recomputing the fingerprint.
 * @evidence contracts/common.md#clear-and-simple-design Groups runtime, tier, formats, chunk projection and track identity so publication can be compared with the current plan without embedding full source bytes or every frame record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A self-consistent identity alone is insufficient: final validation compares the current final-tier plan, and malformed digests, duplicate slots, gaps, overlaps and foreign pass/kind pairings refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines protocol epochs, current compile/edit and runtime identities, independent tier family, full-rate versus output formats, half-open chunk boundaries and canonical fingerprint coverage.
 * @author Samchon
 */
export interface IAutoMovieProductionPublicationIdentity {
  /** Closed identity protocol. */
  protocolVersion: "automovie.production-publication.v4";

  /** Persisted render-plan schema. */
  planVersion: 4;

  /** Production namespace whose plan produced the publication. */
  productionId: string;

  /** Exact builder input used by the plan. */
  compileFingerprint: string;

  /** Exact builder-owned edit used by the plan. */
  editFingerprint: string;

  /** Complete installed capture, dialogue, and encoder closure. */
  runtimeIdentity: {
    /** Render-runtime identity protocol. */
    protocolVersion: "automovie.production-render-runtime.v3";

    /** Digest of declared viewer, capture, asset, and package inputs. */
    sourceDigest: string;

    /** Final-byte dialogue generation, or null for a silent plan. */
    dialogueRuntimeIdentity: string | null;

    /** Exact browser and graphics capture closure. */
    capture: IAutoMovieCaptureRuntimeIdentity;

    /** Exact encoder closure and arguments. */
    encoder: {
      /** Encoder package name. */
      package: string;

      /** Encoder package version. */
      version: string;

      /** Digest of the installed executable closure. */
      closureDigest: string;

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
    id: string;

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
    frames: string;
  }>;

  /** Canonical identities of every non-video publication track. */
  tracks: {
    /** Canonical caption-track digest. */
    captions: string;

    /** Canonical dialogue-track digest. */
    audio: string;

    /** Canonical source-audio inventory digest. */
    audioAssets: string;

    /** Canonical film-effect runtime digest. */
    effects: string;
  };

  /** Digest of the canonical identity fields above. */
  fingerprint: string;
}
