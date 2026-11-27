import type { IAutoMovieProductionSoundAnalysis } from "../production/IAutoMovieProductionSoundAnalysis";
import type { IAutoMovieRenderedProductionSound } from "../production/IAutoMovieRenderedProductionSound";
import type { IAutoMovieDialogueLipSync } from "./IAutoMovieDialogueLipSync";
import type { IAutoMovieControlRecord } from "./IAutoMovieControlRecord";
import type { IAutoMovieDeliveredCutEntry } from "./IAutoMovieDeliveredCutEntry";
import type { IAutoMovieDeliveryContentAudit } from "./IAutoMovieDeliveryContentAudit";
import type { IAutoMovieInspectionDiagnostics } from "./IAutoMovieInspectionDiagnostics";
import type { IAutoMovieRenderedFrameReceipt } from "./IAutoMovieRenderedFrameReceipt";

/**
 * Successful sequential beauty capture and encoding receipts.
 * renderDrawnVideo returns after the host encoder resolves, with one
 * receipt per written frame, the actual encoder arguments, and an audit when
 * the subject supplied diagnostics. Failed drawing/writing/encoding rejects
 * without returning partial success; prior files remain host-owned.
 */
export interface IAutoMovieDrawnVideoResult {
  /** The subject's frames, in order, each with its second, file and pixel hash. */
  frames: IAutoMovieRenderedFrameReceipt[];

  /** The arguments the encoder ran with. */
  args: string[];

  /** The exact frame rate commissioned to the encoder. */
  frameRate: IAutoMovieDeliveryContentAudit.Ratio;

  /**
   * Findings and coverage against the full output schedule, when the subject
   * supplied diagnostics.
   */
  diagnostics?: IAutoMovieInspectionDiagnostics.IAudit;

  /** The soundtrack mixed from the subject's sound list, when it declared one. */
  sound?: IAutoMovieDrawnVideoResult.ISound;

  /**
   * One row per entry of the subject's cut, in entry order, with the output
   * frames each entry is live in; absent when the subject supplied no cut.
   */
  cut?: IAutoMovieDeliveredCutEntry[];

  /**
   * The control channels drawn beside the film, one per requested pass in
   * request order, with each frame file's digest; absent when none was asked.
   */
  controls?: IAutoMovieControlRecord.IChannel[];
}

/** Companion types of the drawn video's result. */
export namespace IAutoMovieDrawnVideoResult {
  /**
   * Identity and measurements of the soundtrack the render mixed from a sound
   * list and handed to the encoder.
   */
  export interface ISound {
    /** The soundtrack WAVE file the encoder read. */
    file: string;

    /** `sha256:` digest of that file's bytes. */
    sha256: string;

    /**
     * Each adopted line's id with its admitted receipt's PCM digest, in list
     * order.
     */
    receipts: {
      /** Line id. */
      line: string;

      /** `sha256:` digest of the line's samples. */
      pcmDigest: string;
    }[];

    /** Measurements of the mixed master before 16-bit quantization. */
    analysis: IAutoMovieProductionSoundAnalysis;

    /**
     * The loudness targets the mix applied (the production's, or EBU R 128),
     * the limiter ceiling, each line's gain and the master stage; the delivery
     * audit checks the decoded file against `loudness.intent`.
     */
    loudness: IAutoMovieRenderedProductionSound.ILoudness;

    /**
     * Each adopted line's lip-sync entry in list order; a "fail" verdict blocks
     * publication.
     */
    lipSync: IAutoMovieDialogueLipSync[];
  }
}
