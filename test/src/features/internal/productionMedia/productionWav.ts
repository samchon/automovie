/** Build RIFF/WAVE records from declared fields and signed sample codes. Malformed inputs are authored as data without changing the decoder. */
export const productionWav = (props: {
  /** WAVE format tag; 1 is PCM, 3 is IEEE float, 0xfffe is extensible. */
  formatTag?: number;
  /** Leading tag of an extensible header's sub-format GUID. */
  subFormatTag?: number;
  /** Extensible valid precision; defaults to the container depth. */
  validBitsPerSample?: number;
  /** Extensible extension byte count; defaults to the required 22. */
  extensionBytes?: number;
  /** Extensible speaker mask; defaults to FC mono or FL/FR stereo. */
  channelMask?: number;
  /** Optional replacement for the final fourteen canonical GUID bytes. */
  subFormatGuidTail?: Uint8Array;
  /** Declared bit depth; 32 encodes float samples, anything else int16. */
  bitsPerSample?: number;
  /** Declared channel count; defaults to how many channels were supplied. */
  declaredChannels?: number;
  sampleRate?: number;
  blockAlign?: number;
  averageBytesPerSecond?: number;
  /** One sample array per channel, all of the same length. */
  channels?: readonly (readonly number[])[];
  /** Exact data-chunk payload, replacing the encoded channels. */
  data?: Uint8Array;
  /** Declared "data" chunk size; defaults to the real payload length. */
  declaredDataSize?: number;
  /** Declared "fmt " chunk size; defaults to 16, or 40 when extensible. */
  formatChunkSize?: number;
  /** RIFF form tag; defaults to "WAVE". */
  form?: string;
  /** Write one ignorable metadata chunk ahead of the format chunk. */
  metadata?: boolean;
  omitFormatChunk?: boolean;
  omitDataChunk?: boolean;
  duplicateFormatChunk?: boolean;
  duplicateDataChunk?: boolean;
  /** Omit only the final odd chunk's required word-alignment byte. */
  omitFinalChunkPadding?: boolean;
  /** Raw bytes included in RIFF extent after the final complete chunk. */
  terminalBytes?: Uint8Array;
  declaredRiffSize?: number;
}): Uint8Array => {
  const formatTag = props.formatTag ?? 1;
  const bitsPerSample = props.bitsPerSample ?? 16;
  const channels = props.channels ?? [];
  const declaredChannels = props.declaredChannels ?? channels.length;
  const sampleRate = props.sampleRate ?? 48_000;
  const payload = props.data ?? encodeWavSamples(channels, bitsPerSample);
  const formatChunkSize =
    props.formatChunkSize ?? (formatTag === 0xfffe ? 40 : 16);
  const format = new Uint8Array(formatChunkSize);
  const formatView = new DataView(format.buffer);
  const blockAlign =
    props.blockAlign ?? Math.trunc((declaredChannels * bitsPerSample) / 8);
  // A deliberately short format chunk still carries every declared field that
  // fits in it, so a "too short" case is short and otherwise well formed.
  const put16 = (at: number, value: number): void => {
    if (at + 2 <= formatChunkSize) formatView.setUint16(at, value, true);
  };
  const put32 = (at: number, value: number): void => {
    if (at + 4 <= formatChunkSize) formatView.setUint32(at, value, true);
  };
  put16(0, formatTag);
  put16(2, declaredChannels);
  put32(4, sampleRate);
  put32(8, props.averageBytesPerSecond ?? sampleRate * blockAlign);
  put16(12, blockAlign);
  put16(14, bitsPerSample);
  if (formatTag === 0xfffe) {
    put16(16, props.extensionBytes ?? 22);
    put16(18, props.validBitsPerSample ?? bitsPerSample);
    put32(
      20,
      props.channelMask ?? (declaredChannels === 1 ? 0x0000_0004 : 0x0000_0003),
    );
    put16(24, props.subFormatTag ?? 1);
    const tail =
      props.subFormatGuidTail ??
      Uint8Array.from([
        0, 0, 0, 0, 0x10, 0, 0x80, 0, 0, 0xaa, 0, 0x38, 0x9b, 0x71,
      ]);
    if (formatChunkSize > 26)
      format.set(
        tail.subarray(0, Math.min(tail.length, formatChunkSize - 26)),
        26,
      );
  }
  const chunks: Array<{
    id: string;
    payload: Uint8Array;
    declaredSize?: number;
  }> = [];
  if (props.metadata === true)
    chunks.push({ id: "LIST", payload: Buffer.from("INFOfixture", "utf8") });
  if (props.omitFormatChunk !== true)
    chunks.push({ id: "fmt ", payload: format });
  if (props.duplicateFormatChunk === true)
    chunks.push({ id: "fmt ", payload: format });
  if (props.omitDataChunk !== true)
    chunks.push({
      id: "data",
      payload,
      declaredSize: props.declaredDataSize,
    });
  if (props.duplicateDataChunk === true) chunks.push({ id: "data", payload });
  const padded = (length: number): number => length + (length % 2);
  const terminalBytes = props.terminalBytes ?? new Uint8Array();
  const chunkBytes = (chunk: (typeof chunks)[number], index: number): number =>
    8 +
    (props.omitFinalChunkPadding === true && index === chunks.length - 1
      ? chunk.payload.length
      : padded(chunk.payload.length));
  const riffSize =
    chunks.reduce(
      (total, chunk, index) => total + chunkBytes(chunk, index),
      4,
    ) + terminalBytes.length;
  const bytes = new Uint8Array(8 + riffSize);
  const view = new DataView(bytes.buffer);
  writeWavTag(bytes, 0, "RIFF");
  view.setUint32(4, props.declaredRiffSize ?? riffSize, true);
  writeWavTag(bytes, 8, props.form ?? "WAVE");
  let cursor = 12;
  for (const [index, chunk] of chunks.entries()) {
    writeWavTag(bytes, cursor, chunk.id);
    view.setUint32(
      cursor + 4,
      chunk.declaredSize ?? chunk.payload.length,
      true,
    );
    bytes.set(chunk.payload, cursor + 8);
    cursor += chunkBytes(chunk, index);
  }
  bytes.set(terminalBytes, cursor);
  return bytes;
};

const encodeWavSamples = (
  channels: readonly (readonly number[])[],
  bitsPerSample: number,
): Uint8Array => {
  const frames = channels[0]?.length ?? 0;
  const bytesPerSample = bitsPerSample / 8;
  const payload = new Uint8Array(frames * channels.length * bytesPerSample);
  const view = new DataView(payload.buffer);
  for (let frame = 0; frame < frames; ++frame)
    for (let channel = 0; channel < channels.length; ++channel) {
      const at = (frame * channels.length + channel) * bytesPerSample;
      const value = channels[channel]![frame]!;
      if (bitsPerSample === 32) view.setFloat32(at, value, true);
      else view.setInt16(at, value, true);
    }
  return payload;
};

const writeWavTag = (bytes: Uint8Array, at: number, tag: string): void => {
  for (let index = 0; index < 4; ++index)
    bytes[at + index] = tag.charCodeAt(index);
};
