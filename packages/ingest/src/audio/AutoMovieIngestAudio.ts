import type {
  IAutoMovieAdmitProductionTtsReceipt,
  IAutoMovieDecodedProductionAudioAsset,
} from "@automovie/interface";

import { admitProductionTtsReceipt as admitReceipt } from "./admitProductionTtsReceipt";
import { decodeProductionAudioAsset as decodeAsset } from "./decodeProductionAudioAsset";

/** Admits production speech receipts and decodes supported audio assets. */
export class AutoMovieIngestAudio {
  /**
   * Decode one admitted WAVE asset to mono samples at the requested rate.
   * @param props Source asset bytes and decode policy.
   * @returns Decoded samples and processing facts.
   */
  public static decodeAsset(
    props: IAutoMovieDecodedProductionAudioAsset.IProps,
  ): IAutoMovieDecodedProductionAudioAsset {
    return decodeAsset(props);
  }

  /**
   * Check a TTS receipt against the exact accompanying audio bytes.
   * @param props Receipt and audio admission inputs.
   * @returns The admitted receipt.
   */
  public static admitReceipt(
    props: IAutoMovieAdmitProductionTtsReceipt.IProps,
  ): IAutoMovieAdmitProductionTtsReceipt.IResult {
    return admitReceipt(props);
  }
}
