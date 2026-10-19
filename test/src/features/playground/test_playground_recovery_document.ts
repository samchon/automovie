import { TestValidator } from "@nestia/e2e";

import { readRecoveryViewerDocument } from "../../../../packages/playground/src/recovery/readRecoveryViewerDocument";

/**
 * Inspection file and HTTP readers preserve bounded original UTF-8 documents.
 *
 * Scenarios:
 * 1. Native File and streamed Response retain multibyte text and a leading BOM.
 * 2. Invalid UTF-8, oversized lengths, extra bytes and truncated bodies refuse.
 * 3. Admission and HTTP failures cancel their own readable stream.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads real native File, Response and ReadableStream objects, checks exact returned text and observes the stream's own cancellation callback when admission fails.
 * @evidence contracts/testing.md#independent-expectations Explicit encoded byte sequences establish exact Unicode and BOM identity; the declared byte limit and HTTP lengths independently determine refusal instead of comparing private loader state.
 * @evidence contracts/testing.md#distinguishing-cases Covers known and absent lengths, multibyte UTF-8, BOM preservation, malformed UTF-8, empty/oversized admission, extra/truncated payloads and non-success HTTP status. No large payload must be allocated to test declared-size admission.
 * @evidence contracts/testing.md#execution-ownership This portable asynchronous test owns native in-memory files and streams only; it opens no disk file or network socket, replaces no foreign method and starts no browser or renderer.
 */
export async function test_playground_recovery_document(): Promise<void> {
  const text: string = '\uFEFF{"label":"곡선\u{1F30D}"}';
  const bytes: Uint8Array<ArrayBuffer> = new TextEncoder().encode(text);
  TestValidator.equals(
    "file preserves exact Unicode and BOM",
    await readRecoveryViewerDocument(new File([bytes], "recipe.json")),
    text,
  );
  TestValidator.equals(
    "unknown HTTP length preserves exact bytes",
    await readRecoveryViewerDocument(new Response(bytes)),
    text,
  );
  TestValidator.equals(
    "known HTTP length preserves exact bytes",
    await readRecoveryViewerDocument(
      new Response(bytes, { headers: { "content-length": String(bytes.length) } }),
    ),
    text,
  );
  const variants: Response[] = [
    new Response(new Uint8Array([0xff])),
    new Response(bytes, { headers: { "content-length": "0" } }),
    new Response(bytes, { headers: { "content-length": String(bytes.length - 1) } }),
    new Response(bytes, { headers: { "content-length": String(bytes.length + 1) } }),
  ];
  for (const source of variants) {
    let refused: boolean = false;
    try {
      await readRecoveryViewerDocument(source);
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid original bytes refuse", refused);
  }
  for (const status of [200, 404]) {
    let cancelled: boolean = false;
    const stream: ReadableStream<Uint8Array> = new ReadableStream({
      start(controller: ReadableStreamDefaultController<Uint8Array>): void {
        controller.enqueue(bytes);
      },
      cancel(): void {
        cancelled = true;
      },
    });
    let refused: boolean = false;
    try {
      await readRecoveryViewerDocument(
        new Response(stream, {
          status,
          headers: { "content-length": String(16 * 1024 * 1024 + 1) },
        }),
      );
    } catch {
      refused = true;
    }
    TestValidator.predicate(
      "failed admission releases its incoming stream",
      refused && cancelled && !stream.locked,
    );
  }
}
