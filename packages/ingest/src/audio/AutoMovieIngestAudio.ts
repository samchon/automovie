import type {
  IAutoMovieAdmitProductionTtsReceipt,
  IAutoMovieDecodedProductionAudioAsset,
} from "@automovie/interface";

import { admitProductionTtsReceipt as admitAudioReceipt } from "./internal/admitProductionTtsReceipt";
import { decodeProductionAudioAsset as decodeAudioAsset } from "./internal/decodeProductionAudioAsset";

/** Admits production speech receipts and decodes supported audio assets. */
export namespace AutoMovieIngestAudio {
  /**
   * Decode one admitted WAVE asset to mono samples at the requested rate.
   * @param props Source asset bytes and decode policy.
   * @returns Decoded samples and processing facts.
   */
  export function decodeAsset(
    props: IAutoMovieDecodedProductionAudioAsset.IProps,
  ): IAutoMovieDecodedProductionAudioAsset {
    return decodeAudioAsset(props);
  }

  /**
   * Check a TTS receipt against the exact accompanying audio bytes.
   * @param props Receipt and audio admission inputs.
   * @returns The admitted receipt.
   */
  export function admitReceipt(
    props: IAutoMovieAdmitProductionTtsReceipt.IProps,
  ): IAutoMovieAdmitProductionTtsReceipt.IResult {
    return admitAudioReceipt(props);
  }
}
