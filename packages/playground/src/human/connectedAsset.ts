/**
 * Loading of the connected editors' shipped assets (a body or face basis, the
 * grooms and skins seated on a face basis). Each is committed as gzip JSON and
 * fetched by the page or by a worker. What arrives depends on the server: one
 * that marks `.gz` with `Content-Encoding: gzip` (vite preview) hands the page
 * inflated JSON, one that does not (a plain static server, `file://`) hands it
 * the stored gzip bytes. This module decides by content, never by transport:
 * bytes that open with the gzip magic `1f 8b` are inflated, anything else is
 * read as UTF-8 text, so the same asset decodes the same way under every
 * server. Empty input, a gzip that will not inflate and text that is not UTF-8
 * are refused with the reason rather than passed on as a JSON parse error.
 *
 * Two entry points share that decision. `readConnectedFaceAsset` decodes a
 * whole asset for a worker or page that evaluates it. `readConnectedAssetRevision`
 * reads only the revision of a basis, the string value of the `id` field every
 * basis opens with, from the head of the stream and closes it, which is all a
 * page needs to name the basis a companion document is evaluated against
 * without fetching or parsing the basis itself. Schema, connectivity and
 * endpoint admission belong to the package builder that consumes the payload.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

/** The two bytes every gzip member opens with (RFC 1952, ID1 and ID2). */
const GZIP_MAGIC: readonly [number, number] = [0x1f, 0x8b];
/**
 * How much decoded text the revision reader examines before refusing. A basis
 * opens `{"id":"<revision>"`, a few dozen characters; a head this long that
 * has not produced the field is not a basis.
 */
const REVISION_LIMIT = 65536;
/** The opening object's first field must be `id` with a JSON string value. */
const REVISION = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/u;
const NO_REVISION = "The asset does not open with an id field.";

const reason = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
/** Whether the bytes are a gzip member; fewer than two bytes never are. */
const isGzip = (head: Uint8Array): boolean =>
  head.length >= 2 && head[0] === GZIP_MAGIC[0] && head[1] === GZIP_MAGIC[1];
/** Refuse a transport that answered without a payload. */
const admit = (response: { ok: boolean; status: number }): void => {
  if (!response.ok)
    throw new Error("The connected asset request failed: " + response.status);
};
/** Inflate a gzip byte stream; the failure surfaces on the read that hits it. */
const inflate = (
  stream: ReadableStream<Uint8Array<ArrayBuffer>>,
): ReadableStream<Uint8Array<ArrayBuffer>> =>
  stream.pipeThrough(new DecompressionStream("gzip"));
/** Name an inflation failure, which the stream reports as a bare read error. */
const inflated = <T>(read: Promise<T>): Promise<T> =>
  read.catch((error: unknown) => {
    throw new Error("The gzip asset could not be inflated: " + reason(error));
  });
/** Decode UTF-8 strictly; a replacement character would corrupt a document silently. */
const utf8 = (
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

/**
 * Decode one fetched asset's bytes into its text by content: gzip bytes are
 * inflated, anything else is read as UTF-8. The transport may or may not have
 * inflated the stored gzip already, and the caller cannot tell from the URL,
 * so the magic decides. Refuses empty input, a gzip that does not inflate and
 * text that is not UTF-8, each with its reason.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Reproduces the selected basis from its stored or transport-inflated bytes without a server-specific encoding policy.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Delivers the basis payload's exact text to admission whether or not the transport inflated the gzip.
 */
export async function decodeConnectedAssetText(
  bytes: ArrayBuffer,
): Promise<string> {
  if (bytes.byteLength === 0) throw new Error("The asset is empty.");
  const stored = new Uint8Array(bytes);
  const plain = isGzip(stored)
    ? new Uint8Array(
        await inflated(
          new Response(inflate(new Blob([bytes]).stream())).arrayBuffer(),
        ),
      )
    : stored;
  return utf8(new TextDecoder("utf-8", { fatal: true }), plain);
}

/**
 * Decode the caller-selected gzip JSON asset through explicit IO ports.
 * The browser entry owns fetch; this adapter owns response and JSON failure
 * propagation and decodes by content unless the caller supplies its own
 * decoder. The package builder owns schema, connectivity and endpoint
 * admission. No source URL from a face document is fetched here.
 *
 * The payload type is the caller's, because the editor selects more than one
 * such asset: the immutable basis and the grooms seated on it arrive the same
 * way and differ only in what admits them afterwards. Nothing here inspects the
 * decoded value, so naming a type is a claim the caller makes and its own
 * admission has to keep.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads the application's selected reusable basis independently of any portrait or compact edit document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Delivers the explicitly selected immutable geometry payload to the numerical basis admission boundary.
 */
export async function readConnectedFaceAsset<
  Payload = IAutoMovieHumanFaceBasis,
>(props: {
  read: () => Promise<{
    ok: boolean;
    status: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  }>;
  /** Bytes to text; by content when omitted. */
  decode?: (bytes: ArrayBuffer) => Promise<string>;
}): Promise<Payload> {
  const response = await props.read();
  admit(response);
  const decode = props.decode ?? decodeConnectedAssetText;
  return JSON.parse(await decode(await response.arrayBuffer()));
}

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
  while (length < GZIP_MAGIC.length) {
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
    gzip: isGzip(head),
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
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Names the exact basis revision a companion document must specify without loading the whole basis.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Reads the immutable revision ID the basis opens with so a document can name the basis it is evaluated against.
 */
export async function readConnectedAssetRevision(props: {
  read: () => Promise<{
    ok: boolean;
    status: number;
    body: ReadableStream<Uint8Array<ArrayBuffer>> | null;
  }>;
}): Promise<string> {
  const response = await props.read();
  admit(response);
  if (response.body === null)
    throw new Error("The connected asset response has no body.");
  const { gzip, stream } = await sniff(response.body);
  const reader = (gzip ? inflate(stream) : stream).getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  try {
    for (;;) {
      const { done, value } = await (gzip
        ? inflated(reader.read())
        : reader.read());
      if (done) throw new Error(NO_REVISION);
      text += utf8(decoder, value, { stream: true });
      const match = REVISION.exec(text);
      if (match !== null) return JSON.parse(match[1]) as string;
      if (text.length > REVISION_LIMIT) throw new Error(NO_REVISION);
    }
  } finally {
    // an errored stream rejects its own cancel; the refusal above is the report
    await reader.cancel().catch(() => undefined);
  }
}
