/**
 * Exact supported WAVE declaration before processing.
 *
 * These are the file's own facts, read from its format envelope and never
 * inferred from its channel count: an extensible header names its speakers
 * through `dwChannelMask` and its encoding through the full SubFormat GUID,
 * while a legacy header carries the default mono front-center or stereo
 * front-left/front-right semantics and says so in `layout.source`.
 */
export interface IAutoMovieProductionWaveSourceFormat {
  /** Media-family discriminant. */
  kind: "wave";
  /** Legacy or extensible format-envelope spelling. */
  header: "wave-format-ex" | "wave-format-extensible";
  /** Exact supported expanded-sample encoding. */
  encoding: "pcm-s16le" | "float-f32le";
  /** Bits allocated to each encoded channel sample. */
  containerBits: 16 | 32;
  /** Meaningful bits declared inside the container sample. */
  validBits: 16 | 32;
  /** Source sample clock before resampling. */
  sampleRate: number;
  /** Source channel count before downmix. */
  channels: 1 | 2;
  /** Ordered speaker semantics and their declaration source. */
  layout: {
    kind: "mono" | "stereo";
    speakers: ["front-center"] | ["front-left", "front-right"];
    source: "legacy-default" | "channel-mask";
    mask: number | null;
  };
  /** Canonical extensible SubFormat GUID, absent for legacy headers. */
  subFormatGuid: string | null;
}
