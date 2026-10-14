/**
 * Byte and stream decoding for caller-selected Human basis assets. Transport
 * content determines gzip decoding; builders retain schema admission.
 */
import { ConnectedAssetEncoding } from "./ConnectedAssetEncoding.js";
import { createAutoMovieResourceRetirement } from "../../../createAutoMovieResourceRetirement.js";
/** Refusal threshold for unmatched decoded text; one host chunk may exceed it. */
const REVISION_LIMIT: number = 65536;
/** A basis opens with its immutable revision id. */
const REVISION: RegExp = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/u;


/**
 * Read enough of a byte stream to tell gzip from plain bytes, then hand back
 * the verdict with a stream that replays what was read before the rest. A
 * stream that ends without a byte is an empty asset.
 */
async function sniff(source: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<{
  gzip: boolean;
  stream: ReadableStream<Uint8Array<ArrayBuffer>>;
  close: () => Promise<void>;
}> {
  const reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> = source.getReader();
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): Promise<void> => reader.cancel(),
    (): void => reader.releaseLock(),
  ]);
  try {
  const chunks: Uint8Array[] = [];
  let length: number = 0;
  while (length < 2) {
    const { done, value }: ReadableStreamReadResult<Uint8Array<ArrayBuffer>> = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.length;
  }
  if (length === 0) {
    throw new Error("The asset is empty.");
  }
  const head: Uint8Array<ArrayBuffer> = new Uint8Array(length);
  let offset: number = 0;
  for (const chunk of chunks) {
    head.set(chunk, offset);
    offset += chunk.length;
  }
  return {
    gzip: ConnectedAssetEncoding.isGzip(head),
    close,
    stream: new ReadableStream<Uint8Array<ArrayBuffer>>({
      start: (controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>): void => controller.enqueue(head),
      pull: async (controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>): Promise<void> => {
        try {
          const { done, value }: ReadableStreamReadResult<Uint8Array<ArrayBuffer>> = await reader.read();
          if (done) { controller.close(); await close(); }
          else controller.enqueue(value);
        } catch (error) {
          return createAutoMovieResourceRetirement([close], { error })();
        }
      },
      cancel: close,
    }),
  };
  } catch (error) {
    return createAutoMovieResourceRetirement([close], { error })();
  }
}


/**
 * Read an id-first basis revision from decoded prefix characters and cancel
 * the stream without parsing the complete basis. No maintained caller uses
 * this public adapter in the current tree; it does not establish revision
 * observation in the inspection application.
 * Refuses a transport failure, an absent body, an empty asset, a gzip that
 * does not inflate, text that is not UTF-8, and a head that does not open
 * with the field within the examined bound.
 *
 * @evidence contracts/common.md#principled-implementation Sniffs gzip content, incrementally decodes strict UTF-8 and parses only the first JSON id string matched by the canonical id-first prefix grammar. It does not admit the rest of the basis; malformed escapes still refuse through JSON.parse and missing id refuses at end or beyond the examined prefix limit.
 * @evidence contracts/common.md#clear-and-simple-design The partial header path is separate from complete basis loading and shares encoding decisions with complete decoding. There is no maintained caller of this adapter in the current tree; another runtime host is not introduced to manufacture wiring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The id-first requirement and 65536 decoded-character threshold are supported asset header conventions, not fixture fingerprints. The regex is evaluated before the length check, so one large chunk with a matching id can exceed that threshold; sniffing also retains the host's whole first chunk rather than exactly two bytes.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies partial revision lookup, content decoding, refusals and consumer stream cancellation. The limit concerns examined decoded characters, not a strict compressed-byte or peak-memory cap.
 * @evidence contracts/performance.md#efficient-algorithms Decodes prefix chunks and reruns a prefix regex until id completion. Repeated prefix concatenation/matching can cost more than linear time for fragmented long headers; first chunks and native decompressor buffers determine peak memory beyond the nominal text threshold.
 * @evidence contracts/performance.md#reuse-equivalent-work The read uses one stateful decoder and one native codec for its stream; it deliberately does not reuse a full parsed basis or infer equal generations from an asset URL.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each acquired reader owns a shared cancellation and lock-release completion, covering sniff/read refusal, decompressor/decoder setup failure, returned-stream cancellation and successful header completion. Independent cleanup preserves primary and original release causes rather than claiming physical release after failure; no read timeout is imposed. The returned id stores no native handle.
 */
export async function readConnectedAssetRevision(props: {
  read: () => Promise<{
    ok: boolean;
    status: number;
    body: ReadableStream<Uint8Array<ArrayBuffer>> | null;
  }>;
}): Promise<string> {
  const response: { ok: boolean; status: number; body: ReadableStream<Uint8Array<ArrayBuffer>> | null; } = await props.read();
  ConnectedAssetEncoding.admit(response);
  if (response.body === null)
    throw new Error("The connected asset response has no body.");
  const { gzip, stream, close: closeSource }: { gzip: boolean; stream: ReadableStream<Uint8Array<ArrayBuffer>>; close: () => Promise<void>; } = await sniff(response.body);
  let decoded: ReadableStream<Uint8Array<ArrayBuffer>> = stream;
  let reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> | undefined;
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): Promise<void> => reader === undefined ? decoded.cancel() : reader.cancel(),
    (): void => reader?.releaseLock(),
    closeSource,
  ]);
  let revision: string | undefined;
  try {
    decoded = gzip ? ConnectedAssetEncoding.inflate(stream) : stream;
    reader = decoded.getReader();
    const decoder: TextDecoder = new TextDecoder("utf-8", { fatal: true });
    let text: string = "";
    while (revision === undefined) {
      const { done, value }: ReadableStreamReadResult<Uint8Array<ArrayBuffer>> = await (gzip
        ? ConnectedAssetEncoding.inflated(reader.read())
        : reader.read());
      if (done) throw new Error("The asset does not open with an id field.");
      text += ConnectedAssetEncoding.utf8(decoder, value, { stream: true });
      const match: RegExpExecArray | null = REVISION.exec(text);
      if (match !== null) revision = JSON.parse(match[1]) as string;
      else if (text.length > REVISION_LIMIT) throw new Error("The asset does not open with an id field.");
    }
  } catch (error) {
    return createAutoMovieResourceRetirement([close], { error })();
  }
  await close();
  return revision;
}
