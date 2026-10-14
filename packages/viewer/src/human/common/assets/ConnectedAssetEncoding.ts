/**
 * Byte and stream decoding for caller-selected Human basis assets. Transport
 * content determines gzip decoding; builders retain schema admission.
 */
/**
 * Shared encoding rules for complete payloads and streamed revision reads.
 * Failures keep transport/codec context and message text; codec wrappers create
 * a contextual Error whose cause preserves the original rejection value.
 *
 * @evidence contracts/common.md#principled-implementation Groups response success admission, RFC gzip magic sniffing, platform stream decompression and TextDecoder error context. Current consumers supply fatal UTF-8 decoders; magic sniffing is only format selection, not full gzip validation.
 * @evidence contracts/common.md#clear-and-simple-design Complete text and partial revision consumers share one encoding owner while retaining their own accumulation, JSON admission and stream cancellation responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual bytes select gzip rather than URL spelling, and failures stay rejected. Contextual Errors keep the original value as cause rather than replacing it with text alone; wrapper identity differs from original identity.
 * @evidence contracts/common.md#meaningful-documentation Each member distinguishes status versus payload admission, sniff versus full codec validation, caller decoder configuration and error-context limits.
 * @evidence contracts/performance.md#efficient-algorithms Status/sniff operations are constant work; native inflation/UTF-8 decoding scales with processed bytes. Full accumulation and repeated revision-prefix matching costs remain with those consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical format and error conventions are shared, but each stream has its own stateful codec/decoder. No matching URL or header turns separate transport effects into one cached read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The namespace stores only fixed helpers and magic bytes. Consumers own readers, decoder state, accumulated bytes and cancellation, with no timeout or byte cap imposed by these helpers.
 */
export namespace ConnectedAssetEncoding {
  /** The two bytes every gzip member opens with (RFC 1952, ID1 and ID2). */
  const GZIP_MAGIC: readonly [number, number] = [0x1f, 0x8b];

  const reason: (error: unknown) => string = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  /**
   * Whether the bytes begin with the RFC 1952 gzip magic; not full gzip admission.
   * See https://www.rfc-editor.org/rfc/rfc1952#section-2.3.1.
   *
   * @evidence contracts/common.md#principled-implementation Checks ID1 0x1f and ID2 0x8b only when two bytes are available. These are the read RFC 1952 header identifiers; the native decompressor, not this predicate, validates the remaining gzip stream.
   * @evidence contracts/common.md#clear-and-simple-design The same two-byte content sniff supports complete decoding and streamed revision inspection instead of guessing encoding from a URL suffix.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Transport-decoded plain payloads remain plain even if the URL names gzip. Matching magic is not presented as proof of a valid compression method, trailer or checksum.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes header sniffing from full admission and links the actual primary format definition.
   * @evidence contracts/performance.md#efficient-algorithms Reads at most two bytes in constant time without copying or scanning the payload.
   * @evidence contracts/performance.md#reuse-equivalent-work Both byte and stream consumers share the same format decision; the function retains no URL-to-encoding cache that could become stale after transport decoding.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the supplied bytes and returns a boolean; no stream reader, decoded buffer or native task is retained.
   */
  export const isGzip: (head: Uint8Array) => boolean = (
    head: Uint8Array,
  ): boolean =>
    head.length >= 2 && head[0] === GZIP_MAGIC[0] && head[1] === GZIP_MAGIC[1];

  /**
   * Refuse an unsuccessful transport status; payload presence is checked by consumers.
   *
   * @evidence contracts/common.md#principled-implementation Uses the supplied ok flag as transport authority and includes status in the refusal. It does not infer success from content or inspect response bodies.
   * @evidence contracts/common.md#clear-and-simple-design A common status gate is separate from complete-byte and streamed-body decoding, each of which owns its own empty/body checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No status or asset URL is accepted through a fixture exception. A true ok flag still requires payload and schema admission downstream.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the status-only role rather than falsely claiming body presence is established.
   * @evidence contracts/performance.md#efficient-algorithms Reads two response fields and creates an error only on failure, constant work independent of asset bytes.
   * @evidence contracts/performance.md#reuse-equivalent-work Both asset consumers reuse the gate for their actual response; matching status on a different request does not reuse transport effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows response metadata and retains no body or task; response cancellation remains with the owning transport consumer.
   */
  export const admit: (response: {
    ok: boolean;
    status: number;
  }) => void = (response: { ok: boolean; status: number }): void => {
    if (!response.ok)
      throw new Error("The connected asset request failed: " + response.status);
  };

  /**
   * Pipe gzip bytes through the host DecompressionStream; reads carry decoding failures.
   *
   * @evidence contracts/common.md#principled-implementation Uses the platform gzip decompressor and native stream backpressure. Runtime availability and supported gzip format are host premises; constructor failures are synchronous and decode failures surface through reads.
   * @evidence contracts/common.md#clear-and-simple-design One adapter exposes the decompressed stream while leaving full accumulation or bounded header inspection to the consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate gzip implementation or URL-based bypass is selected. Header sniffing does not suppress native format errors.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the native codec, stream output and read-time error propagation rather than promising complete content admission at pipe creation.
   * @evidence contracts/performance.md#efficient-algorithms Native inflation scales with compressed and decoded bytes and can stream under backpressure; consumers that accumulate a full Response still retain the full output.
   * @evidence contracts/performance.md#reuse-equivalent-work One pipe owns one stream's stateful decode; independent streams cannot share a decompressor merely because their first bytes match.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Native pipe state retains codec/input buffers until completion, failure or consumer cancellation. No decoded byte cap or timeout is imposed by this adapter.
   */
  export const inflate: (
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
  ) => ReadableStream<Uint8Array<ArrayBuffer>> = (
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
  ): ReadableStream<Uint8Array<ArrayBuffer>> =>
    stream.pipeThrough(new DecompressionStream("gzip"));

  /**
   * Add gzip operation context to one failed native read while preserving its text.
   *
   * @evidence contracts/common.md#principled-implementation A promise catch adds gzip context and retains the original rejection value in Error.cause; successful T is forwarded unchanged, while the contextual wrapper has its own Error identity.
   * @evidence contracts/common.md#clear-and-simple-design Contextual failure naming is shared by complete asset accumulation and streamed reads without owning either consumer's decode loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed read remains rejected instead of returning an empty document; String conversion of arbitrary causes follows the existing reason helper and can itself throw for hostile objects.
   * @evidence contracts/common.md#meaningful-documentation The comment states contextual error text and the retained original cause; the supplied read is not automatically canceled and the wrapper is distinct from the original error.
   * @evidence contracts/performance.md#efficient-algorithms Adds one promise continuation and message conversion on rejection, with no extra payload copy on fulfillment.
   * @evidence contracts/performance.md#reuse-equivalent-work Each stateful read has its own continuation; this function does not cache decoded results or retry the failed stream.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The continuation retains its read promise until settlement. Reader cancellation and codec release remain with the stream consumer; a permanently pending read has no timeout here.
   */
  export const inflated: <T>(read: Promise<T>) => Promise<T> = <T>(
    read: Promise<T>,
  ): Promise<T> =>
    read.catch((error: unknown): never => {
      throw new Error(
        "The gzip asset could not be inflated: " + reason(error),
        { cause: error },
      );
    });

  /**
   * Decode bytes with the supplied strict UTF-8 decoder and optional streaming state.
   *
   * @evidence contracts/common.md#principled-implementation Delegates decode to TextDecoder and names errors as invalid UTF-8 with their original value in Error.cause. Current consumers construct utf-8 decoders with fatal true; this function itself accepts any decoder and cannot establish its encoding or fatal setting.
   * @evidence contracts/common.md#clear-and-simple-design The shared decode operation supports both complete payloads and incremental revision text, leaving decoder construction and final-stream handling with the caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Current strict consumers refuse malformed bytes instead of substituting replacement characters. Passing a permissive/custom decoder changes that premise rather than being a hidden special case here.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies supplied decoder authority and optional stateful streaming, avoiding a claim that this signature forces strictness.
   * @evidence contracts/performance.md#efficient-algorithms Native decode work scales with input bytes and produced text; incremental mode preserves only decoder boundary state rather than repeatedly decoding the entire prefix.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller reuses one decoder through its stream; different inputs or streams cannot reuse output solely because an earlier prefix matched.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned strings transfer to the consumer; the supplied decoder and stream remain caller-owned. This helper retains no byte buffer after the call and imposes no decoded text limit.
   */
  export const utf8: (
    decoder: TextDecoder,
    bytes: Uint8Array,
    options?: { stream: boolean },
  ) => string = (
    decoder: TextDecoder,
    bytes: Uint8Array,
    options?: { stream: boolean },
  ): string => {
    try {
      return decoder.decode(bytes, options);
    } catch (error) {
      throw new Error("The asset is not UTF-8 text: " + reason(error), {
        cause: error,
      });
    }
  };
}
