import type { IHumanViewerPacketIdentities } from "./IHumanViewerPacketIdentities";

const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const STRUCTURE = [0x22, 0x7b, 0x7d, 0x5b, 0x5d] as const;

/**
 * Read a large JSON packet's identities from its inflated text without
 * building the object tree: the top-level `id` string and, for each top-level
 * member whose value is an object opening with an `id` string, that id. A
 * person candidate packet or a published generation view is a few hundred
 * megabytes of text, almost all of it numbers; parsing it into objects took
 * seconds of the server's event loop. The scan visits only structural bytes,
 * quotes and brackets, which it finds with native searches, and tracks
 * nesting and string state. An `id` that is not a string never lets a later
 * key or a nested string stand in for it. A malformed packet or a missing
 * top-level id refuses with the reason; which members a caller requires is
 * the caller's decision.
 *
 * @evidence contracts/common.md#principled-implementation Reads identities from the JSON token structure (depth and string state), never from a text pattern that could match inside a nested value.
 * @evidence contracts/common.md#clear-and-simple-design One scan serves every large packet; required members and memoization stay with the callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a malformed packet or non-string id instead of guessing an identity.
 * @evidence contracts/common.md#meaningful-documentation States what is read, why no object tree is built and what refuses.
 */
export function scanHumanViewerPacketIdentities(
  text: Buffer,
): IHumanViewerPacketIdentities {
  // The next position of each structural byte, advanced lazily.
  const next = STRUCTURE.map((byte) => text.indexOf(byte, 0));
  const nearest = (from: number): number => {
    let best = -1;
    for (let index = 0; index < STRUCTURE.length; ++index) {
      if (next[index] !== -1 && next[index]! < from)
        next[index] = text.indexOf(STRUCTURE[index]!, from);
      if (next[index] !== -1 && (best === -1 || next[index]! < best))
        best = next[index]!;
    }
    return best;
  };
  /** The end quote of the string opening at `start`, skipping escaped quotes. */
  const close = (start: number): number => {
    for (
      let at = text.indexOf(QUOTE, start + 1);
      at !== -1;
      at = text.indexOf(QUOTE, at + 1)
    ) {
      let slashes = 0;
      while (text[at - 1 - slashes] === BACKSLASH) ++slashes;
      if (slashes % 2 === 0) return at;
    }
    throw new Error("A packet ends inside a string");
  };
  /** The first byte of the value whose key string ends at `end`. */
  const opening = (end: number): number | undefined => {
    let after = end + 1;
    while (after < text.length && text[after] !== 0x3a) ++after;
    ++after;
    while (
      after < text.length &&
      (text[after] === 0x20 ||
        text[after] === 0x0a ||
        text[after] === 0x0d ||
        text[after] === 0x09)
    )
      ++after;
    return text[after];
  };
  const keys: string[] = [];
  const identities = new Map<string, string>();
  let depth = 0;
  // `key` is the top-level member being read; `first` holds the state of its
  // object's first member: awaiting its key, awaiting its value, or done.
  let key: string | null = null;
  let valueNext = false;
  let first: "key" | "value" | null = null;
  for (let at = nearest(0); at !== -1; ) {
    const byte = text[at]!;
    if (byte === QUOTE) {
      const end = close(at);
      const value = JSON.parse(text.toString("utf8", at, end + 1)) as string;
      if (depth === 1) {
        if (key !== null && valueNext) {
          if (key === "id") identities.set("id", value);
          key = null;
          valueNext = false;
        } else {
          keys.push(value);
          // A number or literal value has no structural byte of its own, so
          // its kind is read from the byte after the colon. The packet id
          // must be a string; any other value kind would let a nested string
          // stand in for it.
          const kind = opening(end);
          if (value === "id" && kind !== QUOTE)
            throw new Error("A packet needs a string id");
          if (kind === QUOTE || kind === 0x7b || kind === 0x5b) {
            key = value;
            valueNext = true;
          }
        }
      } else if (depth === 2 && key !== null && first === "key") {
        // Only a string value of the first member is an identity; a number,
        // literal, object or array leaves the identity missing, never lets
        // the next key stand in for it.
        first = value === "id" && opening(end) === QUOTE ? "value" : null;
      } else if (depth === 2 && key !== null && first === "value") {
        identities.set(key, value);
        first = null;
      }
      at = nearest(end + 1);
      continue;
    }
    if (byte === 0x7b || byte === 0x5b) {
      ++depth;
      if (depth === 2 && key !== null && valueNext) {
        first = byte === 0x7b ? "key" : null;
        valueNext = false;
      } else if (depth === 2) first = null;
    } else {
      if (--depth < 0) throw new Error("A packet closes more than it opens");
      if (depth === 1) key = null;
      if (depth === 2 && first === "value") first = null;
    }
    at = nearest(at + 1);
  }
  if (depth !== 0) throw new Error("A packet is not closed");
  if (keys[0] !== "id") throw new Error("A packet must open with its id");
  const id = identities.get("id");
  if (id === undefined || id === "")
    throw new Error("A packet needs a string id");
  identities.delete("id");
  return { id, members: Object.fromEntries(identities) };
}
