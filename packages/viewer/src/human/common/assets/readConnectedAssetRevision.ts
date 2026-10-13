/**
 * Byte and stream decoding for caller-selected Human basis assets. Transport
 * content determines gzip decoding; builders retain schema admission.
 */
import { ConnectedAssetEncoding } from "./ConnectedAssetEncoding.js";
/** Maximum decoded header length; revision lookup never parses a whole basis. */
const REVISION_LIMIT = 65536;
/** A basis opens with its immutable revision id. */
const REVISION = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/u;


/**
 * Read enough of a byte stream to tell gzip from plain bytes, then hand back
 * the verdict with a stream that replays what was read before the rest. A
 * stream that ends without a byte is an empty asset.
 */
async function sniff(source: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<{
  gzip: boolean;
  stream: ReadableStream<Uint8Array<ArrayBuffer>>;
}> {
  const reader = source.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (length < 2) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.length;
  }
  if (length === 0) {
    await reader.cancel();
    throw new Error("The asset is empty.");
  }
  const head = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    head.set(chunk, offset);
    offset += chunk.length;
  }
  return {
    gzip: ConnectedAssetEncoding.isGzip(head),
    stream: new ReadableStream<Uint8Array<ArrayBuffer>>({
      start: (controller) => controller.enqueue(head),
      pull: async (controller) => {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      cancel: () => reader.cancel(),
    }),
  };
}


/**
 * Read the revision of the basis an asset stream carries and close the
 * stream. A basis opens with its immutable `id`, so the value is complete in
 * the first decoded characters; the page reads those, cancels the transfer
 * and never holds or parses the basis, which its worker loads on its own.
 * Refuses a transport failure, an absent body, an empty asset, a gzip that
 * does not inflate, text that is not UTF-8, and a head that does not open
 * with the field within the examined bound.
 */
export async function readConnectedAssetRevision(props: {
  read: () => Promise<{
    ok: boolean;
    status: number;
    body: ReadableStream<Uint8Array<ArrayBuffer>> | null;
  }>;
}): Promise<string> {
  const response = await props.read();
  ConnectedAssetEncoding.admit(response);
  if (response.body === null)
    throw new Error("The connected asset response has no body.");
  const { gzip, stream } = await sniff(response.body);
  const reader = (gzip ? ConnectedAssetEncoding.inflate(stream) : stream).getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  try {
    for (;;) {
      const { done, value } = await (gzip
        ? ConnectedAssetEncoding.inflated(reader.read())
        : reader.read());
      if (done) throw new Error("The asset does not open with an id field.");
      text += ConnectedAssetEncoding.utf8(decoder, value, { stream: true });
      const match = REVISION.exec(text);
      if (match !== null) return JSON.parse(match[1]) as string;
      if (text.length > REVISION_LIMIT) throw new Error("The asset does not open with an id field.");
    }
  } finally {
    // an errored stream rejects its own cancel; the refusal above is the report
    await reader.cancel().catch(() => undefined);
  }
}
