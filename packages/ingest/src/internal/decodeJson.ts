

/**
 * Decode strict UTF-8 JSON and refuse duplicate decoded member names.
 *
 * JSON.parse admits syntax before an iterative container/name scan rejects escaped-equivalent duplicates without recursion depth limits.
 *
 * @evidence contracts/common.md#principled-implementation JSON.parse admits syntax before an iterative container/name scan rejects escaped-equivalent duplicates without recursion depth limits.
 * @evidence contracts/common.md#clear-and-simple-design UTF-8, syntax and duplicate-member admission form one byte ingress shared by glTF and GLB.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Last-wins duplicate keys cannot hide a competing loader interpretation, and invalid UTF-8 is not repaired.
 * @evidence contracts/common.md#meaningful-documentation Prose names strict decoding, escape-equivalent duplication, iterative depth behavior and diagnostic wrapping.
 * @evidence contracts/performance.md#efficient-algorithms Text length drives O(N) parsing and duplicate scan; object name sets and scope stack scale with input members and depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Syntax is parsed once and reused by the duplicate scan's valid-text premise; escaped names alone require local JSON string decoding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Text, scope stack and key sets are temporary; only the caller-owned parsed JSON tree survives return.
 * @author Samchon
 */
export const decodeJson: (bytes: Uint8Array) => unknown = (bytes: Uint8Array): unknown => {
  try {
    const text: string = new TextDecoder("utf-8", { fatal: true }).decode(
      bytes,
    );
    const value: unknown = JSON.parse(text);
    assertUniqueJsonObjectMembers(text);
    return value;
  } catch (error) {
    throw new Error(
      `External model JSON is invalid: ${(error as Error).message}.`,
    );
  }
};

/**
 * Refuse decoded-equivalent member names before last-wins JSON can hide one.
 *
 * The scan runs only over text `JSON.parse` has already accepted, so it needs no syntax checks: one pass keeps a stack of open containers, with a name set for each object, and treats the string after `{` or after `,` inside an object as a member name. A name containing an escape is decoded through `JSON.parse`, so an escaped spelling collides with its plain spelling. The stack replaces recursion, so nesting depth never becomes call-stack depth. It lives here rather than reusing the production package's structured JSON ingress because production sits above ingest in the dependency graph; importing its ingress would reverse that package dependency.
 */
const assertUniqueJsonObjectMembers: (text: string) => void = (text: string): void => {
  const scopes: Array<Set<string> | null> = [];
  let expectName: boolean = false;
  let cursor: number = 0;
  while (cursor < text.length) {
    const code: number = text.charCodeAt(cursor);
    if (code === 0x22) {
      const start: number = cursor;
      let escaped: boolean = false;
      ++cursor;
      while (text.charCodeAt(cursor) !== 0x22) {
        if (text.charCodeAt(cursor) === 0x5c) {
          escaped = true;
          ++cursor;
        }
        ++cursor;
      }
      ++cursor;
      if (expectName) {
        const name: string = escaped
          ? (JSON.parse(text.slice(start, cursor)) as string)
          : text.slice(start + 1, cursor - 1);
        const names: Set<string> = scopes[scopes.length - 1]!;
        if (names.has(name))
          throw new Error(`duplicate member ${JSON.stringify(name)}`);
        names.add(name);
        expectName = false;
      }
      continue;
    }
    if (code === 0x7b) {
      scopes.push(new Set<string>());
      expectName = true;
    } else if (code === 0x5b) scopes.push(null);
    else if (code === 0x7d || code === 0x5d) {
      scopes.pop();
      expectName = false;
    }
    else if (code === 0x2c) expectName = scopes[scopes.length - 1] !== null;
    ++cursor;
  }
};
