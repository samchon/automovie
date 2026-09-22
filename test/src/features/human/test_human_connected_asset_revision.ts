import { readConnectedAssetRevision } from "@automovie/playground/src/human/connectedAsset";
import { TestValidator } from "@nestia/e2e";
import { gzipSync } from "node:zlib";

/**
 * A byte stream served in fixed-size chunks that counts how many were pulled
 * and whether the consumer cancelled it, so a test can tell an early close
 * from a stream read to its end.
 */
const source = (bytes: Uint8Array, chunk: number) => {
  const state = { pulled: 0, cancelled: false };
  const total = Math.ceil(bytes.length / chunk);
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>(
    {
      pull: (controller) => {
        if (state.pulled === total) {
          controller.close();
          return;
        }
        controller.enqueue(
          bytes.slice(state.pulled * chunk, (state.pulled + 1) * chunk),
        );
        ++state.pulled;
      },
      cancel: () => {
        state.cancelled = true;
      },
    },
    // no chunk is pulled ahead of a read, so the count is what the reader took
    { highWaterMark: 0 },
  );
  return { state, total, body };
};
const read = (
  body: ReadableStream<Uint8Array<ArrayBuffer>> | null,
  ok = true,
) =>
  readConnectedAssetRevision({
    read: async () => ({ ok, status: ok ? 200 : 404, body }),
  });
const refused = async (
  title: string,
  run: () => Promise<string>,
  expected: RegExp,
): Promise<void> => {
  let message = "";
  try {
    await run();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(title + ": " + message, expected.test(message));
};
const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

/**
 * The revision reader takes a basis's id off the head of its stream, closes
 * the stream before the rest of the asset arrives, and refuses a stream that
 * is not a basis, so a page can name a basis revision without loading it.
 *
 * Scenarios:
 * 1. A plain stream served one byte at a time yields the id, the escape in it
 *    decoded, and is cancelled after a fraction of its chunks.
 * 2. The gzip of the same asset served one byte at a time, so the magic is
 *    split across chunks, yields the id through inflation; whitespace around
 *    the field is admitted.
 * 3. An HTTP refusal is reported without reading the body, and a response
 *    without a body is refused.
 * 4. An empty stream is refused as empty; a stream that ends before the
 *    field completes, or after a single byte, is refused as not opening with
 *    an id; an object whose first field is not `id` is refused the same way
 *    after reading to its end, so a later id field does not count.
 * 5. A head longer than the examined bound without the field is refused
 *    before the stream ends.
 * 6. A gzip head that does not inflate and a plain head that is not UTF-8
 *    are each refused with that reason, and a transport that fails after
 *    the magic with a bare string reason is reported with that string.
 */
export const test_human_connected_asset_revision = async (): Promise<void> => {
  const rest = ',"channels":[' + '"x",'.repeat(4000) + '"y"]}';
  const plain = source(encode('{"id":"basis\\"1"' + rest), 1);
  TestValidator.equals("plain id", await read(plain.body), 'basis"1');
  TestValidator.predicate(
    "plain stream closed early: " + plain.state.pulled + "/" + plain.total,
    plain.state.cancelled && plain.state.pulled < plain.total / 2,
  );
  // one byte at a time splits the gzip magic itself across chunks; when the
  // inflater first emits output is the runtime's scheduling (Node's inflates
  // after the whole small input), so early closure is pinned on the plain path
  const stored = source(gzipSync(encode(' {\n "id" : "basis/2"' + rest)), 1);
  TestValidator.equals("gzip id", await read(stored.body), "basis/2");
  const unread = source(encode('{"id":"x"}'), 1);
  await refused("HTTP refusal", () => read(unread.body, false), /404/u);
  TestValidator.equals("no body read after refusal", unread.state.pulled, 0);
  await refused("absent body", () => read(null), /no body/u);
  await refused(
    "empty stream",
    () => read(source(encode(""), 1).body),
    /empty/u,
  );
  await refused(
    "ended before the field",
    () => read(source(encode('{"id":"bas'), 1).body),
    /does not open with an id/u,
  );
  await refused(
    "a single byte ends before the magic could complete",
    () => read(source(encode("{"), 1).body),
    /does not open with an id/u,
  );
  const later = source(encode('{"name":"n","id":"x"}'), 1);
  await refused(
    "id is not the first field",
    () => read(later.body),
    /does not open with an id/u,
  );
  TestValidator.equals("read to its end", later.state.pulled, later.total);
  const long = source(encode('{"id":"' + "a".repeat(70000)), 1000);
  await refused(
    "beyond the examined bound",
    () => read(long.body),
    /does not open with an id/u,
  );
  TestValidator.predicate(
    "refused before the end: " + long.state.pulled + "/" + long.total,
    long.state.cancelled && long.state.pulled < long.total,
  );
  await refused(
    "corrupt gzip",
    () =>
      read(source(new Uint8Array([0x1f, 0x8b, 0x08, 0, 0x41, 0x42]), 2).body),
    /could not be inflated/u,
  );
  await refused(
    "not UTF-8",
    () => read(source(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]), 4).body),
    /not UTF-8/u,
  );
  // a transport that hands over the magic, then fails on the next read with
  // a bare string as its reason (erroring while the magic is still queued
  // would discard it and fail before the head was ever seen)
  let pulls = 0;
  const broken = new ReadableStream<Uint8Array<ArrayBuffer>>(
    {
      pull: (controller) => {
        if (pulls++ === 0) controller.enqueue(new Uint8Array([0x1f, 0x8b]));
        else controller.error("connection reset");
      },
    },
    { highWaterMark: 0 },
  );
  await refused(
    "transport failure while inflating",
    () => read(broken),
    /could not be inflated: connection reset/u,
  );
};
