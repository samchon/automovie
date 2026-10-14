import type { IHumanViewerPacketIdentities } from "./IHumanViewerPacketIdentities.js";

const QUOTE: number = 0x22;
const BACKSLASH: number = 0x5c;
const STRUCTURE: readonly number[] = [0x22, 0x7b, 0x7d, 0x5b, 0x5d];

/**
 * Extract the opening top-level `id` string and each top-level object's opening `id` from inflated packet bytes without building its numerical object tree. Native searches visit structural bytes while nesting and escaped-string state distinguish those identities. Detected depth/string errors and missing ids refuse; this projection does not validate complete JSON grammar, bracket kinds or numerical tokens. The caller selects required identities and the Person/view owner admits complete packet semantics.
 *
 * @evidence contracts/common.md#principled-implementation Uses native structural-byte searches plus nesting/string state to extract the opening packet id and first id members without allocating the complete numerical JSON tree.
 * @evidence contracts/common.md#clear-and-simple-design Identity projection is deliberately separate from the Person/view owner's full JSON schema and construction admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Detected unmatched depth, unterminated strings or missing ids refuse, but the scan is not a complete JSON grammar validator and does not certify every bracket kind or numeric token.
 * @evidence contracts/common.md#meaningful-documentation Documentation states extraction scope, required first-id ordering and the partial structural validation limit.
 * @evidence contracts/performance.md#efficient-algorithms A fixed structural-byte set scans packet bytes with per-string decoding and map entries proportional to top-level identities; no full nested numerical object tree is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work The scanner reads the supplied buffer afresh; sidecar digest/stamp memoization belongs to its caller and is not inferred from matching ids alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns inflated bytes; temporary string/key/map storage grows with scanned strings and top-level identities, then only extracted identity strings escape.
 */
export function scanHumanViewerPacketIdentities(
  text: Buffer,
): IHumanViewerPacketIdentities {
  // The next position of each structural byte, advanced lazily.
  const next: number[] = STRUCTURE.map((byte: number): number =>
    text.indexOf(byte, 0),
  );
  const nearest: (from: number) => number = (from: number): number => {
    let best: number = -1;
    for (let index: number = 0; index < STRUCTURE.length; ++index) {
      if (next[index] !== -1 && next[index]! < from)
        next[index] = text.indexOf(STRUCTURE[index]!, from);
      if (next[index] !== -1 && (best === -1 || next[index]! < best))
        best = next[index]!;
    }
    return best;
  };
  /** The end quote of the string opening at `start`, skipping escaped quotes. */
  const close: (start: number) => number = (start: number): number => {
    for (
      let at: number = text.indexOf(QUOTE, start + 1);
      at !== -1;
      at = text.indexOf(QUOTE, at + 1)
    ) {
      let slashes: number = 0;
      while (text[at - 1 - slashes] === BACKSLASH) ++slashes;
      if (slashes % 2 === 0) return at;
    }
    throw new Error("A packet ends inside a string");
  };
  /** The first byte of the value whose key string ends at `end`. */
  const opening: (end: number) => number | undefined = (
    end: number,
  ): number | undefined => {
    let after: number = end + 1;
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
  const identities: Map<string, string> = new Map();
  let depth: number = 0;
  // `key` is the top-level member being read; `first` holds the state of its
  // object's first member: awaiting its key, awaiting its value, or done.
  let key: string | null = null;
  let valueNext: boolean = false;
  let first: "key" | "value" | null = null;
  for (let at: number = nearest(0); at !== -1; ) {
    const byte: number = text[at]!;
    if (byte === QUOTE) {
      const end: number = close(at);
      const value: string = JSON.parse(
        text.toString("utf8", at, end + 1),
      ) as string;
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
          const kind: number | undefined = opening(end);
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
  const id: string | undefined = identities.get("id");
  if (id === undefined || id === "")
    throw new Error("A packet needs a string id");
  identities.delete("id");
  return { id, members: Object.fromEntries(identities) };
}
