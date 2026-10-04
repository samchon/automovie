import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar";

const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const STRUCTURE = [0x22, 0x7b, 0x7d, 0x5b, 0x5d] as const;

/**
 * Read a person candidate packet's identities from its inflated JSON text
 * without building the object tree. The packet opens with its `id` and holds
 * whole `face` and `body` bases, a few hundred megabytes of text, almost all of it
 * numbers; parsing it into objects took seconds of the server's event loop.
 * The scan visits only structural bytes, quotes and brackets, which it finds
 * with native searches, tracks nesting and string state, and keeps the
 * top-level keys in order, the top-level `id` string and each top-level
 * object's first member, which must be its `id` string. The packet's other
 * members (head skin, band targets and whatever the generation type adds)
 * are not the viewer's to judge: the Person owner admits the whole packet
 * when the worker builds from it, and its refusal reaches the render. A
 * malformed packet or a missing identity refuses here with the reason.
 *
 * @evidence contracts/common.md#principled-implementation Reads identities from the JSON token structure (depth and string state), never from a text pattern that could match inside a nested value.
 * @evidence contracts/common.md#clear-and-simple-design One scan owns packet admission; reading, inflating and memoization stay with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses an incomplete packet instead of guessing its identities, and keeps no copy of the generation schema.
 * @evidence contracts/common.md#meaningful-documentation States the packet layout, why no object tree is built and what refuses.
 */
export function readHumanViewerPersonSidecar(text: Buffer): IHumanViewerPersonSidecar {
  // The next position of each structural byte, advanced lazily.
  const next = STRUCTURE.map((byte) => text.indexOf(byte, 0));
  const nearest = (from: number): number => {
    let best = -1;
    for (let index = 0; index < STRUCTURE.length; ++index) {
      if (next[index] !== -1 && next[index]! < from) next[index] = text.indexOf(STRUCTURE[index]!, from);
      if (next[index] !== -1 && (best === -1 || next[index]! < best)) best = next[index]!;
    }
    return best;
  };
  /** The end quote of the string opening at `start`, skipping escaped quotes. */
  const close = (start: number): number => {
    for (let at = text.indexOf(QUOTE, start + 1); at !== -1; at = text.indexOf(QUOTE, at + 1)) {
      let slashes = 0;
      while (text[at - 1 - slashes] === BACKSLASH) ++slashes;
      if (slashes % 2 === 0) return at;
    }
    throw new Error("A person packet ends inside a string");
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
          // it is recognized here; only strings and objects are identities.
          let after = end + 1;
          while (after < text.length && text[after] !== 0x3a) ++after;
          ++after;
          while (after < text.length && (text[after] === 0x20 || text[after] === 0x0a ||
            text[after] === 0x0d || text[after] === 0x09)) ++after;
          const opening = text[after];
          if (opening === QUOTE || opening === 0x7b || opening === 0x5b) {
            key = value;
            valueNext = true;
          } else if (value === "id") throw new Error("A person packet needs a string id");
        }
      } else if (depth === 2 && key !== null && first === "key") {
        first = value === "id" ? "value" : null;
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
      if (--depth < 0) throw new Error("A person packet closes more than it opens");
      if (depth === 1) key = null;
      if (depth === 2 && first === "value") first = null;
    }
    at = nearest(at + 1);
  }
  if (depth !== 0) throw new Error("A person packet is not closed");
  if (keys[0] !== "id") throw new Error("A person packet must open with its id");
  const identity = (member: string): string => {
    const value = identities.get(member);
    if (value === undefined || value === "")
      throw new Error(`A person packet needs a ${member} basis that opens with its id`);
    return value;
  };
  const id = identities.get("id");
  if (id === undefined || id === "") throw new Error("A person packet needs a string id");
  return { id, face: identity("face"), body: identity("body") };
}
