import type { IAutoMoviePhysicalPlayback } from "./IAutoMoviePhysicalPlayback";

/**
 * Allocation budgets and owned archive admission results for solver-free
 * playback decoding.
 */
export namespace IAutoMovieDecodePhysicalPlayback {
  /**
   * Explicit allocation limits for admitting a physical playback archive.
   *
   * Every limit is a positive safe integer; frame count includes frame zero and
   * segment count is per frame. decodePhysicalPlayback checks bytes before
   * copying, then checks header frame and segment counts before scanning
   * records. Exceeding any bound rejects the decode promise; these are caller
   * limits, not defaults or declared archive sizes.
   */
  export type IBudget = {
    /**
     * Maximum complete archive size in bytes, including metadata, alignment and
     * digest.
     */
    maximumBytes: number;

    /**
     * Maximum stored frames, including the initial frame: duration times rate
     * plus one.
     */
    maximumFrames: number;

    /**
     * Maximum unique body/bone records in each frame; an admitted archive has
     * at least one.
     */
    maximumSegments: number;
  };

  /**
   * Asynchronous admission result carrying an owned archive and its decoded
   * metadata.
   *
   * Offset addresses the first eight-byte-aligned Float64 record in bytes;
   * header identifies the complete sampled performance. decodePhysicalPlayback
   * copies source bytes and recursively freezes header records; the returned
   * byte array remains mutable and is transferred to the playback reader.
   * Malformed records, incompatible identity or protocol, bad digest and
   * exceeded budgets reject the promise; WebCrypto and fatal UTF-8/JSON
   * decoding errors also propagate.
   */
  export type IResult = Promise<{
    /**
     * Owned copy of the complete admitted archive; mutable Uint8Array storage
     * must be preserved while a playback reader uses it.
     */
    bytes: Uint8Array<ArrayBuffer>;

    /**
     * Parsed metadata recursively frozen after admission; no native solver
     * snapshot is included.
     */
    header: IAutoMoviePhysicalPlayback.IHeader;

    /**
     * Byte offset of the first pose record, rounded up to a multiple of eight
     * after the header.
     */
    offset: number;
  }>;
}
