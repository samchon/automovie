import type { IAutoMovieProductionOpusDescription } from "@automovie/interface";

/**
 * Parse and structurally validate the one Opus `dOps` box of an MP4 audio
 * sample entry.
 *
 * `boxes` is the sample entry's child-box list as mp4box parses it, `codec` its
 * four-character code, and `trackChannels` the `AudioSampleEntry` channel
 * count. The result reports the box as
 * observed; whether it matches the delivery profile is
 * `assertProductionOpusProfile`'s question.
 *
 * Family 0 serializes no stream counts or mapping table and supports mono or
 * stereo, so it reports null counts, an empty mapping and the implied channel
 * order. Families 1 and 255 report their stream counts and ordered mapping
 * with a null channel order, because family 255 defines no speaker meaning and
 * this parser does not expand the family 1 order. `InputSampleRate` is
 * reported but not compared with any track rate, because RFC 7845 makes it the
 * informational rate of the original input.
 *
 * Throws `unsupported-audio-profile.sampleEntry` for a non-Opus code and
 * `malformed-dOps` for anything else RFC 7845 section 5.1 or its MP4
 * encapsulation forbids: not exactly one `dOps` box, a field outside its bit
 * width, an output channel count that differs from the track's, a reserved
 * family, a family 0 box with a mapping or more than two channels, a family 1
 * box with more than eight channels, zero streams, more coupled than total
 * streams, more than 255 decoded channels, or a mapping table that is not one
 * entry per output channel each naming a decoded channel or 255 for silence.
 *
 * @evidence contracts/common.md#principled-implementation Each field is checked against its RFC 7845 section 5.1 bit width, and the relations are the ones that section and the Opus-in-ISOBMFF encapsulation state: family channel limits, N greater than zero, M at most N, M plus N at most 255, one mapping entry per output channel with each entry below M plus N or 255, and `OutputChannelCount` equal to the sample entry's channel count; the informational input rate and an output count below the decoded count are legal and admitted.
 * @evidence contracts/common.md#clear-and-simple-design One function reads the box and returns the interface record, with a local integer reader so every field refusal names its key; comparison with the delivery profile stays in `assertProductionOpusProfile`, so this parser reports what the file says and refuses only what no Opus file may say.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numeric limits are RFC 7845 field widths and family rules rather than fixture values, no file or encoder is special-cased, and a malformed box throws instead of being repaired or defaulted.
 * @evidence contracts/common.md#meaningful-documentation The doc names each argument's source, the split from the profile check, what each family reports and why the channel order is null for nonzero families, why the input rate is not compared, and every refusal with its error prefix.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the child-box count B plus the mapping length C, at most 255: one filter over the boxes and two passes over the mapping, with no allocation beyond the filtered list and the copied mapping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call parses one track's sample entry for one probe and coordinates no phases or requests whose result could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function keeps no reference to the parsed boxes after returning, its result copies the mapping into a new array its caller owns, and it opens no handle or task.
 */
export const productionOpusDescription: (props: {
  boxes: readonly unknown[] | undefined;
  codec: string;
  trackChannels: number;
}) => IAutoMovieProductionOpusDescription = (props: {
  /** Parsed sample-entry children; absence is treated as no dOps box. */
  boxes: readonly unknown[] | undefined;

  /** Sample-entry codec spelling; the Opus family is matched case-insensitively. */
  codec: string;

  /** Channel count read from the enclosing audio sample entry. */
  trackChannels: number;
}): IAutoMovieProductionOpusDescription => {
  if (/^opus(?:\.|$)/i.test(props.codec) === false)
    throw new Error(
      `unsupported-audio-profile.sampleEntry: expected Opus, observed "${props.codec}".`,
    );
  const boxes: Record<string, unknown>[] = (props.boxes ?? []).filter(
    (box: unknown): box is Record<string, unknown> =>
      box !== null &&
      typeof box === "object" &&
      (box as { type?: unknown }).type === "dOps",
  );
  if (boxes.length !== 1)
    throw new Error(
      `malformed-dOps: expected one Opus description, observed ${boxes.length}.`,
    );
  const box: Record<string, unknown> = boxes[0]!;
  const integer: (key: string, minimum: number, maximum: number) => number = (
    key: string,
    minimum: number,
    maximum: number,
  ): number => {
    const value: unknown = box[key];
    if (
      typeof value !== "number" ||
      Number.isSafeInteger(value) === false ||
      value < minimum ||
      value > maximum
    )
      throw new Error(`malformed-dOps.${key}: observed ${String(value)}.`);
    return value;
  };
  const version: number = integer("Version", 0, 255);
  const outputChannelCount: number = integer("OutputChannelCount", 1, 255);
  const preSkip: number = integer("PreSkip", 0, 65_535);
  const inputSampleRate: number = integer("InputSampleRate", 1, 0xffff_ffff);
  const outputGainQ7_8: number = integer("OutputGain", -32_768, 32_767);
  const family: number = integer("ChannelMappingFamily", 0, 255);
  const rawMapping: unknown = box.ChannelMapping;
  if (
    (rawMapping !== undefined || family !== 0) &&
    Array.isArray(rawMapping) === false
  )
    throw new Error(
      "malformed-dOps.ChannelMapping: expected an ordered array.",
    );
  const mapping: number[] = (
    Array.isArray(rawMapping) ? (rawMapping as unknown[]) : []
  ).map((value: unknown, index: number): number => {
    if (
      typeof value !== "number" ||
      Number.isSafeInteger(value) === false ||
      value < 0 ||
      value > 255
    )
      throw new Error(
        `malformed-dOps.ChannelMapping[${index}]: observed ${String(value)}.`,
      );
    return value;
  });
  if (outputChannelCount !== props.trackChannels)
    throw new Error(
      "malformed-dOps: sample description and track channel counts disagree.",
    );
  if (family === 0) {
    if (outputChannelCount > 2 || mapping.length !== 0)
      throw new Error(
        "malformed-dOps.ChannelMappingFamily: family 0 supports mono or stereo and serializes no mapping table.",
      );
    return {
      kind: "opus",
      version,
      outputChannelCount,
      preSkip,
      inputSampleRate,
      outputGainQ7_8,
      channelMapping: {
        family,
        streamCount: null,
        coupledCount: null,
        mapping: [],
        channelOrder:
          outputChannelCount === 2 ? ["front-left", "front-right"] : ["mono"],
      },
    };
  }
  if (family !== 1 && family !== 255)
    throw new Error(
      `malformed-dOps.ChannelMappingFamily: reserved family ${family} is unsupported.`,
    );
  if (family === 1 && outputChannelCount > 8)
    throw new Error(
      `malformed-dOps.ChannelMappingFamily: family 1 supports at most 8 channels, observed ${outputChannelCount}.`,
    );
  const streamCount: number = integer("StreamCount", 1, 255);
  const coupledCount: number = integer("CoupledCount", 0, 255);
  const decodedChannels: number = streamCount + coupledCount;
  if (
    coupledCount > streamCount ||
    decodedChannels > 255 ||
    mapping.length !== outputChannelCount ||
    mapping.some(
      (value: number): boolean => value !== 255 && value >= decodedChannels,
    )
  )
    throw new Error(
      "malformed-dOps.ChannelMapping: stream, coupled, channel, and mapping counts disagree.",
    );
  return {
    kind: "opus",
    version,
    outputChannelCount,
    preSkip,
    inputSampleRate,
    outputGainQ7_8,
    channelMapping: {
      family,
      streamCount,
      coupledCount,
      mapping,
      channelOrder: null,
    },
  };
};
