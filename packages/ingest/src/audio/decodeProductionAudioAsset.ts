import type { IAutoMovieDecodedProductionAudioAsset } from "./IAutoMovieDecodedProductionAudioAsset";

/**
 * Decode one complete supported RIFF/WAVE file into finite mono samples at a
 * requested rate.
 *
 * The parser walks the RIFF chunks by id, requires the declared RIFF extent,
 * `nBlockAlign`, and `nAvgBytesPerSec` to agree with the format fields, and
 * refuses a duplicate `fmt ` or `data` chunk, an odd chunk without its pad
 * byte, and terminal bytes too short for a chunk header. An extensible header
 * follows the Microsoft WAVEFORMATEXTENSIBLE contract
 * (https://learn.microsoft.com/en-us/windows/win32/api/mmreg/ns-mmreg-waveformatextensible):
 * "The cbSize member must be at least 22", `wValidBitsPerSample` "can be any
 * value not exceeding the container size", "the channels specified in
 * dwChannelMask must be present in the prescribed order (from least
 * significant bit up)" with SPEAKER_FRONT_LEFT `0x1`, SPEAKER_FRONT_RIGHT
 * `0x2`, and SPEAKER_FRONT_CENTER `0x4`, and "the number of bits set in
 * dwChannelMask should be the same as the number of channels". The SubFormat
 * is admitted only when every byte after its leading 16-bit tag equals the
 * `xxxxxxxx-0000-0010-8000-00aa00389b71` template that Ksmedia.h's
 * `IS_VALID_WAVEFORMATEX_GUID` compares
 * (https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/converting-between-format-tags-and-subformat-guids),
 * so a vendor GUID whose low word happens to read as PCM is not decoded as
 * PCM.
 *
 * The supported subset is deliberately narrow: 16-bit PCM in a 16-bit
 * container, 32-bit IEEE float in a 32-bit container, mono front-center, and
 * stereo front-left/front-right. A legal declaration outside it, such as 20
 * valid bits in a 24-bit container or a front-left/front-center pair, is
 * refused as unsupported by field rather than misread as the nearest
 * supported layout. Every decoded sample is checked finite before the mono
 * fold and before any resampling, so a NaN or infinity in one channel refuses
 * the whole asset at its frame and channel instead of averaging into a
 * plausible number.
 *
 * PCM codes scale by 1/32768, so -32768 reads as exactly -1 and 32767 just
 * under 1. Stereo folds to the mean of its two channels. A source at another
 * rate is resampled by linear interpolation between neighboring source
 * samples, holding the last sample past the end, to `round(frames * rate /
 * sourceRate)` samples. No low-pass filter runs first, so downsampling a source
 * with content above the target Nyquist frequency aliases it.
 *
 * Every refusal throws `Audio asset "<path>" [<reason>] <message>`, where the
 * reason names the field, such as `riff-size`, `block-align`, or
 * `unsupported-wave-layout`.
 *
 * @param props.path Asset path, used only in refusal messages.
 * @param props.bytes Complete file bytes; they are only read.
 * @param props.sampleRate Output rate in samples per second; a positive safe
 *   integer.
 * @returns The source facts as declared and new mono samples the caller owns.
 *
 * @evidence contracts/common.md#principled-implementation Chunks are found by id in RIFF order with the even-byte pad rule, the format fields are checked against WAVEFORMATEXTENSIBLE's own consistency rules and the KSDATAFORMAT GUID template, samples scale by 1/32768 or read as IEEE floats, and resampling is two-tap linear interpolation; that interpolation has no anti-alias filter, which the documentation states as the remaining limitation when a source is downsampled.
 * @evidence contracts/common.md#clear-and-simple-design One linear pass validates the container, a second folds frames to mono, and a third resamples only when the rates differ; the refusal helper, chunk record and hex formatters are private to this file because nothing else parses WAVE, and the package exports no consumer in the repository besides the tests, which is an open wiring gap rather than a hidden one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No file, path or rate is special-cased: every unsupported declaration throws with a field-named reason instead of decoding as the nearest supported layout, and the only constants are the WAVE format tags, speaker masks and GUID tail the Microsoft contract defines.
 * @evidence contracts/common.md#meaningful-documentation The documentation cites the WAVEFORMATEXTENSIBLE rules it enforces, lists the supported subset, gives the PCM scale, stereo fold, resampled length and aliasing limitation, and states the refusal message shape and parameter units.
 * @evidence contracts/performance.md#efficient-algorithms Time and space are linear in source frames times channels plus output samples; each sample is read once through one `DataView`, the mono buffer is reused as the result when no resampling is needed, and the chunk walk visits each chunk header once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The decoder is a pure function of one call's bytes and rate and coordinates no work across requests; any caching of decoded assets would belong to its caller.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns only the mono buffer and, when resampling, the output buffer, both released to the garbage collector except the one returned to the caller; it keeps no reference to the input bytes in its result and holds no handle or task.
 * @author Samchon
 */
export const decodeProductionAudioAsset = (props: {
  path: string;
  bytes: Uint8Array;
  sampleRate: number;
}): IAutoMovieDecodedProductionAudioAsset => {
  if (Number.isSafeInteger(props.sampleRate) === false || props.sampleRate <= 0)
    fail(
      props.path,
      "decode-rate",
      `cannot be decoded at ${props.sampleRate} Hz: a decode target rate is a positive whole number of samples per second.`,
    );
  const bytes: Uint8Array = props.bytes;
  if (bytes.byteLength < 12)
    fail(
      props.path,
      "riff-header",
      `is ${bytes.byteLength} bytes, too short to carry a RIFF/WAVE header. ${SUPPORTED_AUDIO}`,
    );
  const view: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const riff: string = asciiTag(bytes, 0);
  const form: string = asciiTag(bytes, 8);
  if (riff !== "RIFF" || form !== "WAVE")
    fail(
      props.path,
      "riff-form",
      `is not a RIFF/WAVE container: it begins "${riff}" (${leadingHex(bytes)}) and declares form "${form}". ${SUPPORTED_AUDIO}`,
    );
  const declaredRiffBytes: number = view.getUint32(4, true) + 8;
  if (declaredRiffBytes !== bytes.byteLength)
    fail(
      props.path,
      "riff-size",
      `declares a RIFF extent of ${declaredRiffBytes} bytes but contains ${bytes.byteLength} bytes.`,
    );

  let cursor: number = 12;
  let format: IChunk | null = null;
  let data: IChunk | null = null;
  while (cursor < bytes.byteLength) {
    if (cursor + 8 > bytes.byteLength)
      fail(
        props.path,
        "chunk-header",
        `has ${bytes.byteLength - cursor} terminal RIFF bytes that cannot carry a chunk header.`,
      );
    const id: string = asciiTag(bytes, cursor);
    const size: number = view.getUint32(cursor + 4, true);
    const body: number = cursor + 8;
    const paddedEnd: number = body + size + (size % 2);
    if (paddedEnd > bytes.byteLength)
      fail(
        props.path,
        "chunk-extent",
        `is a truncated RIFF/WAVE container: its "${id}" chunk declares ${size} bytes but only ${bytes.byteLength - body} remain.`,
      );
    if (id === "fmt ") {
      if (format !== null)
        fail(
          props.path,
          "duplicate-fmt",
          'has more than one RIFF/WAVE "fmt " chunk.',
        );
      format = { offset: body, size };
    } else if (id === "data") {
      if (data !== null)
        fail(
          props.path,
          "duplicate-data",
          'has more than one RIFF/WAVE "data" chunk.',
        );
      data = { offset: body, size };
    }
    cursor = paddedEnd;
  }
  if (format === null)
    return fail(
      props.path,
      "missing-fmt",
      `has no RIFF/WAVE "fmt " chunk. ${SUPPORTED_AUDIO}`,
    );
  if (format.size < 16)
    fail(
      props.path,
      "fmt-size",
      `has a "fmt " chunk of ${format.size} bytes; a WAVE format chunk is at least 16 bytes.`,
    );

  const declaredTag: number = view.getUint16(format.offset, true);
  const channels: number = view.getUint16(format.offset + 2, true);
  const sourceSampleRate: number = view.getUint32(format.offset + 4, true);
  const averageBytesPerSecond: number = view.getUint32(
    format.offset + 8,
    true,
  );
  const blockAlign: number = view.getUint16(format.offset + 12, true);
  const containerBits: number = view.getUint16(format.offset + 14, true);
  const extensible: boolean = declaredTag === WAVE_FORMAT_EXTENSIBLE;
  let sampleTag: number = declaredTag;
  let validBits: number = containerBits;
  let channelMask: number | null = null;
  let subFormatGuid: string | null = null;
  if (extensible) {
    if (format.size < 18)
      fail(
        props.path,
        "extensible.cbSize",
        `declares an extensible WAVE format in a "fmt " chunk of ${format.size} bytes, which cannot carry cbSize.`,
      );
    const extensionBytes: number = view.getUint16(format.offset + 16, true);
    if (extensionBytes < 22)
      fail(
        props.path,
        "extensible.cbSize",
        `declares extensible cbSize ${extensionBytes}; at least 22 bytes are required.`,
      );
    if (18 + extensionBytes > format.size)
      fail(
        props.path,
        "extensible.truncated",
        `declares ${extensionBytes} extensible bytes but its "fmt " chunk carries only ${format.size - 18}.`,
      );
    validBits = view.getUint16(format.offset + 18, true);
    channelMask = view.getUint32(format.offset + 20, true);
    sampleTag = view.getUint16(format.offset + 24, true);
    const guidBytes: Uint8Array = bytes.subarray(
      format.offset + 24,
      format.offset + 40,
    );
    subFormatGuid = waveGuid(guidBytes);
    if (
      SUBFORMAT_TAIL.some(
        (byte: number, index: number): boolean =>
          guidBytes[index + 2] !== byte,
      )
    )
      fail(
        props.path,
        "unsupported-wave-subformat",
        `carries unsupported extensible SubFormat ${subFormatGuid}. ${SUPPORTED_AUDIO}`,
      );
    if (sampleTag !== WAVE_FORMAT_PCM && sampleTag !== WAVE_FORMAT_FLOAT)
      fail(
        props.path,
        "unsupported-wave-subformat",
        `carries unsupported extensible SubFormat ${subFormatGuid}. ${SUPPORTED_AUDIO}`,
      );
    if (validBits === 0 || validBits > containerBits)
      fail(
        props.path,
        "extensible.valid-bits",
        `declares ${validBits} valid bits in a ${containerBits}-bit container.`,
      );
  }

  const float: boolean =
    sampleTag === WAVE_FORMAT_FLOAT && containerBits === 32;
  const pcm: boolean = sampleTag === WAVE_FORMAT_PCM && containerBits === 16;
  if (float === false && pcm === false)
    fail(
      props.path,
      "unsupported-wave-precision",
      `carries WAVE sample format 0x${hex4(sampleTag)} at ${containerBits} bits per sample. ${SUPPORTED_AUDIO}`,
    );
  if (validBits !== containerBits)
    fail(
      props.path,
      "unsupported-wave-precision",
      `carries ${validBits} valid bits in a ${containerBits}-bit container. ${SUPPORTED_AUDIO}`,
    );
  if (channels !== 1 && channels !== 2)
    fail(
      props.path,
      "unsupported-wave-channels",
      `declares ${channels} channels. ${SUPPORTED_AUDIO}`,
    );
  if (sourceSampleRate === 0)
    fail(
      props.path,
      "sample-rate",
      "declares a sample rate of 0 Hz; a WAV asset states a positive rate.",
    );
  const bytesPerSample: number = containerBits / 8;
  const expectedBlockAlign: number = channels * bytesPerSample;
  if (blockAlign !== expectedBlockAlign)
    fail(
      props.path,
      "block-align",
      `declares nBlockAlign ${blockAlign}, expected ${expectedBlockAlign} for ${channels} channels at ${containerBits} bits.`,
    );
  const expectedAverageBytesPerSecond: number = sourceSampleRate * blockAlign;
  if (averageBytesPerSecond !== expectedAverageBytesPerSecond)
    fail(
      props.path,
      "average-bytes-per-second",
      `declares nAvgBytesPerSec ${averageBytesPerSecond}, expected ${expectedAverageBytesPerSecond}.`,
    );

  const speakers: ["front-center"] | ["front-left", "front-right"] =
    channels === 1 ? ["front-center"] : ["front-left", "front-right"];
  if (channelMask !== null) {
    if (channelMask === 0)
      fail(
        props.path,
        "unsupported-wave-layout",
        `declares unsupported channel mask ${hex8(channelMask)}. ${SUPPORTED_AUDIO}`,
      );
    const count: number = bitCount(channelMask);
    if (count !== channels)
      fail(
        props.path,
        "wave-channel-mask-count",
        `declares ${channels} channels but channel mask ${hex8(channelMask)} names ${count}.`,
      );
    const supportedMask: number = channels === 1 ? MONO_MASK : STEREO_MASK;
    if (channelMask !== supportedMask)
      fail(
        props.path,
        "unsupported-wave-layout",
        `declares unsupported channel mask ${hex8(channelMask)}. ${SUPPORTED_AUDIO}`,
      );
  }
  if (data === null)
    return fail(
      props.path,
      "missing-data",
      `has no RIFF/WAVE "data" chunk. ${SUPPORTED_AUDIO}`,
    );
  if (data.size % blockAlign !== 0)
    fail(
      props.path,
      "data-frame",
      `has a "data" chunk of ${data.size} bytes, which is not a whole number of ${channels}-channel ${containerBits}-bit sample frames.`,
    );
  const sourceFrames: number = data.size / blockAlign;
  if (sourceFrames === 0)
    fail(
      props.path,
      "empty-data",
      "carries no sample frames; a declared cue asset has to contain the sound it is cued for.",
    );

  const mono: Float32Array = new Float32Array(sourceFrames);
  for (let frame: number = 0; frame < sourceFrames; ++frame) {
    // A mono sample is stored as read, so a float source's -0 stays -0.
    let sum: number = 0;
    let monoSample: number = 0;
    for (let channel: number = 0; channel < channels; ++channel) {
      const at: number =
        data.offset + (frame * channels + channel) * bytesPerSample;
      const sample: number = float
        ? view.getFloat32(at, true)
        : view.getInt16(at, true) / 32_768;
      if (Number.isFinite(sample) === false)
        fail(
          props.path,
          "non-finite-pcm",
          `contains a non-finite PCM sample at frame ${frame}, channel ${channel}.`,
        );
      if (channels === 1) monoSample = sample;
      else sum += sample;
    }
    mono[frame] = channels === 1 ? monoSample : sum / channels;
  }
  const resampling: boolean = sourceSampleRate !== props.sampleRate;
  const samples: Float32Array = resampling
    ? resampleMono(mono, sourceSampleRate, props.sampleRate)
    : mono;
  return {
    sourceSampleRate,
    sourceChannels: channels,
    sourceFrames,
    durationSeconds: sourceFrames / sourceSampleRate,
    sourceFormat: {
      kind: "wave",
      header: extensible ? "wave-format-extensible" : "wave-format-ex",
      encoding: float ? "float-f32le" : "pcm-s16le",
      containerBits: containerBits as 16 | 32,
      validBits: validBits as 16 | 32,
      sampleRate: sourceSampleRate,
      channels: channels as 1 | 2,
      layout: {
        kind: channels === 1 ? "mono" : "stereo",
        speakers,
        source: extensible ? "channel-mask" : "legacy-default",
        mask: channelMask,
      },
      subFormatGuid,
    },
    processing: {
      kind:
        channels === 1
          ? resampling
            ? "resample"
            : "copy"
          : resampling
            ? "downmix-resample"
            : "downmix",
      outputChannels: 1,
      outputSampleRate: props.sampleRate,
      matrix: channels === 1 ? [[1]] : [[0.5, 0.5]],
    },
    samples,
  };
};

/** One RIFF chunk body: its byte offset in the file and its declared size. */
interface IChunk {
  offset: number;
  size: number;
}

/** Current deterministic source subset accepted by the production decoder. */
const SUPPORTED_AUDIO: string =
  'Supported audio assets are RIFF/WAVE ("*.wav") containers carrying 16-bit PCM or 32-bit IEEE float samples, mono front-center or stereo front-left/front-right.';

const WAVE_FORMAT_PCM: number = 0x0001;

const WAVE_FORMAT_FLOAT: number = 0x0003;

const WAVE_FORMAT_EXTENSIBLE: number = 0xfffe;

/** SPEAKER_FRONT_CENTER. */
const MONO_MASK: number = 0x0000_0004;

/** SPEAKER_FRONT_LEFT | SPEAKER_FRONT_RIGHT. */
const STEREO_MASK: number = 0x0000_0003;

/** SubFormat GUID bytes 2 through 15 shared by every `WAVE_FORMAT_*` GUID. */
const SUBFORMAT_TAIL: Uint8Array = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b,
  0x71,
]);

/**
 * Throw the decoder's refusal. The explicit function type on the constant is
 * what lets TypeScript narrow after a statement call, so callers need no
 * non-null assertion.
 */
const fail: (asset: string, reason: string, message: string) => never = (
  asset: string,
  reason: string,
  message: string,
): never => {
  throw new Error(`Audio asset "${asset}" [${reason}] ${message}`);
};

const resampleMono = (
  source: Float32Array,
  from: number,
  to: number,
): Float32Array => {
  const length: number = Math.round((source.length * to) / from);
  const output: Float32Array = new Float32Array(length);
  const step: number = from / to;
  for (let index: number = 0; index < length; ++index) {
    const position: number = index * step;
    const left: number = Math.floor(position);
    const right: number = Math.min(source.length - 1, left + 1);
    const weight: number = position - left;
    output[index] = source[left]! * (1 - weight) + source[right]! * weight;
  }
  return output;
};

const asciiTag = (bytes: Uint8Array, offset: number): string => {
  let text: string = "";
  for (let index: number = offset; index < offset + 4; ++index) {
    const byte: number = bytes[index]!;
    text += byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : ".";
  }
  return text;
};

const leadingHex = (bytes: Uint8Array): string => `0x${hexBytes(bytes, 0, 4)}`;

/**
 * Canonical GUID text: the first three fields are little-endian in the file,
 * the last two are byte strings.
 */
const waveGuid = (bytes: Uint8Array): string =>
  `${hexBytes(bytes, 3, -1)}-${hexBytes(bytes, 5, 3)}-${hexBytes(bytes, 7, 5)}-${hexBytes(bytes, 8, 10)}-${hexBytes(bytes, 10, 16)}`;

/** Hex digits of `bytes[from]` toward `to` (exclusive), in either direction. */
const hexBytes = (bytes: Uint8Array, from: number, to: number): string => {
  const direction: number = to > from ? 1 : -1;
  let text: string = "";
  for (let index: number = from; index !== to; index += direction)
    text += bytes[index]!.toString(16).padStart(2, "0");
  return text;
};

const bitCount = (value: number): number => {
  let remaining: number = value >>> 0;
  let count: number = 0;
  while (remaining !== 0) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
};

const hex4 = (value: number): string => value.toString(16).padStart(4, "0");

const hex8 = (value: number): string =>
  `0x${(value >>> 0).toString(16).padStart(8, "0")}`;
