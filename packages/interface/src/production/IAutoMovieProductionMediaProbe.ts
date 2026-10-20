import type { IAutoMovieSemanticMask } from "../render/IAutoMovieSemanticMask";
import { IAutoMovieProductionAudioProbe } from "./IAutoMovieProductionAudioProbe";
import { IAutoMovieProductionPngPicture } from "./IAutoMovieProductionPngPicture";
import type { IAutoMovieProductionSoundEvidence } from "./IAutoMovieProductionSoundEvidence";
import { IAutoMovieProductionVideoProbe } from "./IAutoMovieProductionVideoProbe";
import { IAutoMovieProductionWebVttCue } from "./IAutoMovieProductionWebVttCue";

/**
 * Parser-derived metadata for one renderer-owned output file.
 *
 * @evidence contracts/common.md#principled-implementation Format-specific readers decode PNG, strict UTF-8 WebVTT and MP4 tracks from resident bytes; production admits sound-evidence and self-verifying semantic-mask JSON through its structured ingress before delivery validation compares the facts.
 * @evidence contracts/common.md#clear-and-simple-design The kind union exposes the exact fact set for each media class and composes existing audio and video probe contracts for a feature containing both tracks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared filename or media type alone supplies no facts; malformed bytes, wrong track populations, unequal feature runtimes and invalid sidecar identity refuse rather than being repaired into a probe.
 * @evidence contracts/common.md#meaningful-documentation Defines each parsed media kind, pixel and second units, ordered caption text and cues, complete track facts and byte-grounded JSON sidecar records.
 */
export type IAutoMovieProductionMediaProbe =
  | {
      /** Decoded PNG raster. */
      kind: "png";

      /** Actual pixel width. */
      width: number;

      /** Actual pixel height. */
      height: number;

      /** Complete decoded picture identity. */
      picture: IAutoMovieProductionPngPicture;
    }
  | IAutoMovieProductionVideoProbe
  | IAutoMovieProductionAudioProbe
  | {
      /** Parsed feature delivery with both picture and sound tracks. */
      kind: "feature";

      /** Final video track facts. */
      video: IAutoMovieProductionVideoProbe;

      /** Final audio track facts. */
      audio: IAutoMovieProductionAudioProbe;
    }
  | {
      /** Parsed WebVTT text. */
      kind: "webvtt";

      /** Number of syntactically valid, non-empty cue timing lines. */
      cueCount: number;

      /** Earliest parsed cue start in seconds. */
      firstCueSeconds: number;

      /** Latest parsed cue end in seconds. */
      lastCueSeconds: number;

      /** Canonical cue sequence in delivery order. */
      cues: IAutoMovieProductionWebVttCue[];

      /** Strict UTF-8 canonical WebVTT presentation. */
      text: string;
    }
  | {
      /** Parsed deterministic sound evidence JSON. */
      kind: "sound-evidence";

      /** Complete evidence bound to the current plan, PCM analysis, and audio bytes. */
      evidence: IAutoMovieProductionSoundEvidence;
    }
  | {
      /** Parsed and self-verifying semantic-mask sidecar JSON. */
      kind: "semantic-mask";

      /** Complete canonical palette reopened from resident bytes. */
      mask: IAutoMovieSemanticMask;
    };
