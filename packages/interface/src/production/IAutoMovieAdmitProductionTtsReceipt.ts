import type { IAutoMovieDecodedProductionAudioAsset } from "./IAutoMovieDecodedProductionAudioAsset";
import type { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";

/**
 * Inputs and result of admitting one generated line's receipt against its line
 * and bytes.
 */
export namespace IAutoMovieAdmitProductionTtsReceipt {
  /**
   * One line, its WAVE bytes and its receipt bytes, all borrowed for the
   * synchronous admission.
   *
   * Ingest's `AutoMovieIngestAudio.admitReceipt` refuses, naming the field, a receipt
   * whose `line` or `text` differs from the line, a WAVE file that is not mono
   * 32-bit float at `sourceSampleRate`, a PCM digest or sample count that
   * differs from the bytes, a phoneme chunk that is empty, leaves `[0,
   * sourceSamples]`, or overlaps or precedes the previous chunk, and a stored
   * `cacheKey` that differs from the one recomputed from the receipt.
   */
  export interface IProps {
    /** The line the receipt must belong to. */
    line: IPropsLine;

    /** Path of the WAVE file, used only in refusal messages. */
    pcmPath: string;

    /** Complete WAVE file bytes. */
    pcm: Uint8Array;

    /** Path of the receipt, used only in refusal messages. */
    receiptPath: string;

    /** Complete receipt bytes, UTF-8 JSON. */
    receipt: Uint8Array;

    /**
     * Output rate of the admitted samples in samples per second, a positive
     * safe integer, such as the mixer's 48 000.
     */
    sampleRate: number;
  }

  /** The line object of {@link IProps}. */
  export type IPropsLine = {
    /** Line id, which the receipt's `line` must equal. */
    id: string;

    /** Line text, which the receipt's `text` must equal. */
    text: string;
  };

  /** An admitted receipt with its line decoded at the requested rate. */
  export interface IResult {
    /** The receipt, parsed and admitted. */
    receipt: IAutoMovieProductionTtsReceipt;

    /** The line decoded from its bytes and converted to the requested rate. */
    audio: IAutoMovieDecodedProductionAudioAsset;
  }
}
