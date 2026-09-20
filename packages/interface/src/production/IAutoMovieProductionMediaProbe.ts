import type { IAutoMovieSemanticMask } from "../render/IAutoMovieSemanticMask";
import type { IAutoMovieProductionSoundEvidence } from "./IAutoMovieProductionSoundEvidence";
import { IAutoMovieProductionAudioProbe } from "./IAutoMovieProductionAudioProbe";
import { IAutoMovieProductionPngPicture } from "./IAutoMovieProductionPngPicture";
import { IAutoMovieProductionVideoProbe } from "./IAutoMovieProductionVideoProbe";
import { IAutoMovieProductionWebVttCue } from "./IAutoMovieProductionWebVttCue";

/**
 * Parser-derived metadata for one renderer-owned output file.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `IAutoMovieProductionMediaProbe` as the portable data boundary for the diagnostics derived result finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `IAutoMovieProductionMediaProbe` for the validation derived result finding system contract.
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
