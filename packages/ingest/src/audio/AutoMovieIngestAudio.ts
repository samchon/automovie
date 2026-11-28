import type {
  IAutoMovieAdmitProductionTtsReceipt,
  IAutoMovieDecodedProductionAudioAsset,
} from "@automovie/interface";

import { admitProductionTtsReceipt as admitAudioReceipt } from "./internal/admitProductionTtsReceipt";
import { decodeProductionAudioAsset as decodeAudioAsset } from "./internal/decodeProductionAudioAsset";

/** Decodes production audio and admits generated speech receipts. */
export namespace AutoMovieIngestAudio {
  /**
   * Decodes a complete RIFF/WAVE asset to owned mono samples.
   *
   * Accepts 16-bit PCM or 32-bit IEEE float in mono front-center or stereo
   * front-left/front-right. Stereo channels are averaged. For a different
   * positive integer output rate in Hz, resampling returns `round(sourceFrames
   * * sampleRate / sourceSampleRate)` samples. Source duration remains measured
   * in seconds at the original rate.
   *
   * @param props Source bytes, a diagnostic path and the required output rate.
   * @returns Mono samples and the measured source and conversion properties.
   * @throws On unsupported or malformed WAVE data, non-finite source samples,
   *   or an invalid output rate.
   */
  export function decodeAsset(
    props: IAutoMovieDecodedProductionAudioAsset.IProps,
  ): IAutoMovieDecodedProductionAudioAsset {
    return decodeAudioAsset(props);
  }

  /**
   * Admits a version 7 speech receipt against a line and its WAVE bytes.
   *
   * The matching audio must be mono IEEE float at the receipt's original rate.
   * Admission checks the line, frame count, PCM digest, request digest and
   * ordered phoneme intervals before resampling. The returned audio uses the
   * requested positive integer rate in Hz. Receipt intervals retain source
   * sample indices.
   *
   * @param props Line identity, resident receipt and audio bytes, and output
   *   rate.
   * @returns The parsed receipt and owned mono samples.
   * @throws On invalid receipt, line or audio data, mismatched identities, or
   *   an invalid output rate.
   */
  export function admitReceipt(
    props: IAutoMovieAdmitProductionTtsReceipt.IProps,
  ): IAutoMovieAdmitProductionTtsReceipt.IResult {
    return admitAudioReceipt(props);
  }
}
