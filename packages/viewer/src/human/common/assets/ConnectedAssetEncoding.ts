/**
 * Byte and stream decoding for caller-selected Human basis assets. Transport
 * content determines gzip decoding; builders retain schema admission.
 */
/**
 * Shared encoding rules for complete payloads and streamed revision reads.
 * Failures preserve transport, gzip and UTF-8 causes across both consumers.
 */
export namespace ConnectedAssetEncoding {


/** The two bytes every gzip member opens with (RFC 1952, ID1 and ID2). */
const GZIP_MAGIC: readonly [number, number] = [0x1f, 0x8b];

const reason = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Whether the bytes are a gzip member; fewer than two bytes never are. */
export const isGzip = (head: Uint8Array): boolean =>
  head.length >= 2 && head[0] === GZIP_MAGIC[0] && head[1] === GZIP_MAGIC[1];

/** Refuse a transport that answered without a payload. */
export const admit = (response: { ok: boolean; status: number }): void => {
  if (!response.ok)
    throw new Error("The connected asset request failed: " + response.status);
};

/** Inflate a gzip byte stream; the failure surfaces on the read that hits it. */
export const inflate = (
  stream: ReadableStream<Uint8Array<ArrayBuffer>>,
): ReadableStream<Uint8Array<ArrayBuffer>> =>
  stream.pipeThrough(new DecompressionStream("gzip"));

/** Name an inflation failure, which the stream reports as a bare read error. */
export const inflated = <T>(read: Promise<T>): Promise<T> =>
  read.catch((error: unknown) => {
    throw new Error("The gzip asset could not be inflated: " + reason(error));
  });

/** Decode UTF-8 strictly; a replacement character would corrupt a document silently. */
export const utf8 = (
  decoder: TextDecoder,
  bytes: Uint8Array,
  options?: { stream: boolean },
): string => {
  try {
    return decoder.decode(bytes, options);
  } catch (error) {
    throw new Error("The asset is not UTF-8 text: " + reason(error));
  }
};
}
