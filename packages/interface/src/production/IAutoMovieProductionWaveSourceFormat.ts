/**
 * Exact supported WAVE declaration before processing.
 *
 * These are the file's own facts, read from its format envelope and never
 * inferred from its channel count: an extensible header names its speakers
 * through `dwChannelMask` and its encoding through the full SubFormat GUID,
 * while a legacy header carries the default mono front-center or stereo
 * front-left/front-right semantics and says so in `layout.source`. The literal
 * unions are the decoder's whole supported subset, so a value outside them was
 * refused rather than recorded.
 */
export interface IAutoMovieProductionWaveSourceFormat {
  /** Media-family discriminant; WAVE is the only decoded family. */
  kind: "wave";

  /**
   * Format-envelope spelling: `wave-format-ex` for a legacy tag, or
   * `wave-format-extensible` for tag `0xFFFE` with a cbSize of at least 22.
   */
  header: "wave-format-ex" | "wave-format-extensible";

  /** Sample encoding: little-endian signed 16-bit PCM or 32-bit IEEE float. */
  encoding: "pcm-s16le" | "float-f32le";

  /** Bits each encoded channel sample occupies (`wBitsPerSample`). */
  containerBits: 16 | 32;

  /**
   * Meaningful bits inside the container; `wValidBitsPerSample` for an
   * extensible header, otherwise the container size. Always equal to
   * `containerBits`, since partial precision is refused.
   */
  validBits: 16 | 32;

  /**
   * Positive unsigned 32-bit source samples per second, admitted by the ingest
   * WAVE decoder before resampling.
   */
  sampleRate: number;

  /** Source channel count, before the mono downmix. */
  channels: 1 | 2;

  /** Ordered speaker semantics and where they were declared. */
  layout: {
    /** Mono or stereo, matching `channels`. */
    kind: "mono" | "stereo";

    /** Speakers in channel order. */
    speakers: ["front-center"] | ["front-left", "front-right"];

    /**
     * `channel-mask` when an extensible header declared the speakers,
     * `legacy-default` when a legacy header implied them.
     */
    source: "legacy-default" | "channel-mask";

    /**
     * The declared `dwChannelMask` (`0x4` mono, `0x3` stereo), or `null` for a
     * legacy header, which has none.
     */
    mask: number | null;
  };

  /**
   * Lowercase canonical SubFormat GUID text of an extensible header, or `null`
   * for a legacy header, which has none.
   */
  subFormatGuid: string | null;
}
