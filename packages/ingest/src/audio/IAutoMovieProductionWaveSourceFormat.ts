/**
 * Exact supported WAVE declaration before processing.
 *
 * These are the file's own facts, read from its format envelope and never inferred from its channel count: an extensible header names its speakers through `dwChannelMask` and its encoding through the full SubFormat GUID, while a legacy header carries the default mono front-center or stereo front-left/front-right semantics and says so in `layout.source`. The literal unions are the decoder's whole supported subset, so a value outside them was refused rather than recorded.
 *
 * @evidence contracts/common.md#principled-implementation Each field mirrors a WAVEFORMATEX or WAVEFORMATEXTENSIBLE field the decoder reads, with the layout source and mask recording whether the speakers came from `dwChannelMask` or from the legacy default.
 * @evidence contracts/common.md#clear-and-simple-design One record keeps the envelope facts apart from the processing lineage, which lets the render plan validate a source identity separately from the conversion applied to it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closed unions constrain each vocabulary independently, while numeric ranges and encoding/precision/channel/layout/GUID relations remain producer invariants checked by the decoder and render wave-identity validator, not guarantees of this erased type.
 * @evidence contracts/common.md#meaningful-documentation The comments state where each fact comes from, which header spelling sets the mask and GUID, and that the literal unions are the supported subset.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface is a type with no runtime code; parsing happens in `decodeProductionAudioAsset`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parsed envelope facts are copied from one decode into one plan identity, so no work exists here to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds a fixed handful of scalars and one GUID string and owns no handle or task.
 */
export interface IAutoMovieProductionWaveSourceFormat {
  /** Media-family discriminant; WAVE is the only decoded family. */
  kind: "wave";

  /** Format-envelope spelling: `wave-format-ex` for a legacy tag, or `wave-format-extensible` for tag `0xFFFE` with a cbSize of at least 22. */
  header: "wave-format-ex" | "wave-format-extensible";

  /** Sample encoding: little-endian signed 16-bit PCM or 32-bit IEEE float. */
  encoding: "pcm-s16le" | "float-f32le";

  /** Bits each encoded channel sample occupies (`wBitsPerSample`). */
  containerBits: 16 | 32;

  /** Meaningful bits inside the container; `wValidBitsPerSample` for an extensible header, otherwise the container size. Always equal to `containerBits`, since partial precision is refused. */
  validBits: 16 | 32;

  /** Source rate in samples per second, before any resampling. */
  sampleRate: number;

  /** Source channel count, before the mono downmix. */
  channels: 1 | 2;

  /** Ordered speaker semantics and where they were declared. */
  layout: {
    /** Mono or stereo, matching `channels`. */
    kind: "mono" | "stereo";

    /** Speakers in channel order. */
    speakers: ["front-center"] | ["front-left", "front-right"];

    /** `channel-mask` when an extensible header declared the speakers, `legacy-default` when a legacy header implied them. */
    source: "legacy-default" | "channel-mask";

    /** The declared `dwChannelMask` (`0x4` mono, `0x3` stereo), or `null` for a legacy header, which has none. */
    mask: number | null;
  };

  /** Lowercase canonical SubFormat GUID text of an extensible header, or `null` for a legacy header, which has none. */
  subFormatGuid: string | null;
}
