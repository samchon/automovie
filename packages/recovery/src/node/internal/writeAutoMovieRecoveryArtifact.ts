import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Atomically publish a plain JSON artifact without one complete serialized string.
 * Arrays, data-only plain records and JSON primitive values retain JSON.stringify ordering and
 * encoding. Nonplain objects are outside this publication contract. Input geometry
 * remains caller-owned; bounded staging does not bound the generating model's memory.
 * Process termination can leave a private temporary file but cannot publish its partial bytes.
 * Optional array sources bind engine-generated plain-array spool files to placeholder array
 * identities. Their complete SHA-256 and bracket bytes are checked while copying only their
 * interiors. Item populations are producer metadata, not a second JSON parsing certificate.
 *
 * @evidence contracts/common.md#principled-implementation Recursive JSON token emission and bounded shallow-array chunks preserve the generating records and numeric values. A same-directory temporary file is closed before a nonoverwriting hard-link publication, and the returned hash covers the written UTF-8 bytes.
 * @evidence contracts/common.md#clear-and-simple-design One publication helper owns encoding, incremental hashing and atomic filesystem transfer; numerical producers and consumers retain all geometry decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry filtering, numeric rounding, field sampling, compression, source fallback or existing-output replacement occurs. Cycles and nonplain objects fail explicitly.
 * @evidence contracts/common.md#meaningful-documentation States supported plain JSON values, encoding authority, immutable publication and the limited staging-memory guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Traversal and UTF-8 writing cost O(N) for the artifact size. Shallow arrays use fixed-size JSON chunks rather than one full serialized array or one filesystem write per number.
 * @evidence contracts/performance.md#reuse-equivalent-work The same emitted chunks supply both the file and its incremental hash; the output needs no reread. Generating array sources are hash-verified during their required copy into each standalone publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staging depends on fixed-size shallow-array chunks and the largest primitive string rather than the complete serialized artifact; nested bulk chunks accept at most sixteen primitives per child. The ancestor set is O(depth), and the caller still owns the complete input object. Finally closes descriptors and removes private temporary files on normal return and thrown exceptions; process termination can leave an unpublished temporary file.
 */
export function writeAutoMovieRecoveryArtifact(
  output: string,
  artifact: object,
  arraySources: ReadonlyMap<
    readonly unknown[],
    readonly { path: string; sha256: string; items: number }[]
  > = new Map(),
): { sha256: string; bytes: number } {
  if (artifact === null || typeof artifact !== "object")
    throw new Error("An artifact root must be a plain data container");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (fs.existsSync(output))
    throw new Error("An immutable artifact already exists");
  const temporary: string = path.join(
    path.dirname(output),
    `.${path.basename(output)}.${process.pid}.${randomUUID()}.tmp`,
  );
  const descriptor: number = fs.openSync(temporary, "wx");
  const hash: ReturnType<typeof createHash> = createHash("sha256");
  const ancestors: WeakSet<object> = new WeakSet();
  let chunks: string[] = [],
    staged: number = 0,
    bytes: number = 0,
    closed: boolean = false;
  const writeBuffer: (buffer: Buffer) => void = (buffer: Buffer): void => {
    let offset: number = 0;
    while (offset < buffer.length) {
      const written: number = fs.writeSync(
        descriptor,
        buffer,
        offset,
        buffer.length - offset,
      );
      if (written <= 0) throw new Error("Artifact write made no progress");
      offset += written;
    }
    hash.update(buffer);
    bytes += buffer.length;
  };
  const flush: () => void = (): void => {
    if (!staged) return;
    writeBuffer(Buffer.from(chunks.join(""), "utf8"));
    chunks = [];
    staged = 0;
  };
  const emit: (token: string) => void = (token: string): void => {
    chunks.push(token);
    staged += token.length;
    if (staged >= 65_536) flush();
  };
  const primitive: (value: unknown) => boolean = (value: unknown): boolean => {
    if (typeof value === "function") {
      for (const owner of [value, Function.prototype, Object.prototype]) {
        const hook: PropertyDescriptor | undefined =
          Object.getOwnPropertyDescriptor(owner, "toJSON");
        if (hook && (!("value" in hook) || typeof hook.value === "function"))
          throw new Error("Custom JSON hooks are outside artifact publication");
      }
    }
    return value === null || typeof value !== "object";
  };
  const admit: (value: object) => void = (value: object): void => {
    const prototype: object | null = Object.getPrototypeOf(value);
    if (
      Array.isArray(value)
        ? prototype !== Array.prototype
        : prototype !== null && prototype !== Object.prototype
    )
      throw new Error(
        "Artifact records and arrays must have plain data prototypes",
      );
    for (const owner of [
      value,
      Object.prototype,
      ...(Array.isArray(value) ? [Array.prototype] : []),
    ]) {
      const hook: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(owner, "toJSON");
      if (hook && (!("value" in hook) || typeof hook.value === "function"))
        throw new Error("Custom JSON hooks are outside artifact publication");
    }
  };
  const ownValue: (value: object, key: string) => unknown = (
    value: object,
    key: string,
  ): unknown => {
    const descriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && !("value" in descriptor))
      throw new Error("Artifact accessors are outside data publication");
    return descriptor?.value as unknown;
  };
  const encode: (value: unknown) => void = (value: unknown): void => {
    if (primitive(value)) {
      emit(JSON.stringify(value) ?? "null");
      return;
    }
    const current: object = value as object;
    if (ancestors.has(current))
      throw new Error("A JSON artifact cannot contain cycles");
    admit(current);
    ancestors.add(current);
    if (Array.isArray(value)) {
      const sources:
        | readonly { path: string; sha256: string; items: number }[]
        | undefined = arraySources.get(value);
      if (sources) {
        emit("[");
        flush();
        let written: boolean = false;
        for (const source of sources) {
          if (
            !Number.isSafeInteger(source.items) ||
            source.items < 0 ||
            !/^[0-9a-f]{64}$/i.test(source.sha256)
          )
            throw new Error("Invalid generating spool binding");
          const handle: number = fs.openSync(source.path, "r");
          try {
            const size: number = fs.fstatSync(handle).size;
            if (size < 2)
              throw new Error(
                "A generating spool must be a complete plain JSON array",
              );
            const sourceHash: ReturnType<typeof createHash> =
                createHash("sha256"),
              buffer: Buffer = Buffer.allocUnsafe(65_536);
            if (source.items && written) writeBuffer(Buffer.from(","));
            let offset: number = 0;
            while (offset < size) {
              const count: number = fs.readSync(
                handle,
                buffer,
                0,
                Math.min(buffer.length, size - offset),
                offset,
              );
              if (!count)
                throw new Error("Generating spool read made no progress");
              const part: Buffer = buffer.subarray(0, count);
              sourceHash.update(part);
              if (
                (offset === 0 && part[0] !== 91) ||
                (offset + count === size && part[count - 1] !== 93)
              )
                throw new Error(
                  "Generating spool brackets do not match its array contract",
                );
              if (source.items)
                writeBuffer(
                  part.subarray(
                    offset === 0 ? 1 : 0,
                    offset + count === size ? count - 1 : count,
                  ),
                );
              offset += count;
            }
            if (
              sourceHash.digest("hex") !== source.sha256 ||
              (!source.items && size !== 2)
            )
              throw new Error("Generating spool byte binding failed");
            written ||= source.items > 0;
          } finally {
            fs.closeSync(handle);
          }
        }
        emit("]");
        ancestors.delete(current);
        return;
      }
      const items: unknown[] = value;
      let bulk: unknown[] = [],
        written: number = 0;
      const flushBulk: () => void = (): void => {
        if (!bulk.length) return;
        if (written) emit(",");
        const token: string = JSON.stringify(bulk);
        emit(token.slice(1, -1));
        written += bulk.length;
        bulk = [];
      };
      emit("[");
      for (let i: number = 0; i < items.length; i++) {
        const item: unknown = ownValue(items, String(i));
        let safe: boolean = primitive(item),
          copy: unknown = item;
        if (
          Array.isArray(item) &&
          item.length <= 16 &&
          !arraySources.has(item)
        ) {
          if (ancestors.has(item))
            throw new Error("A JSON artifact cannot contain cycles");
          admit(item);
          const vector: unknown[] = [];
          safe = true;
          for (let j: number = 0; j < item.length; j++) {
            const component: unknown = ownValue(item, String(j));
            if (!primitive(component)) {
              safe = false;
              break;
            }
            vector.push(component);
          }
          copy = vector;
        }
        if (safe) {
          bulk.push(copy);
          if (bulk.length === 8192) flushBulk();
        } else {
          flushBulk();
          if (written) emit(",");
          encode(item);
          written++;
        }
      }
      flushBulk();
      emit("]");
    } else {
      const record: Record<string, unknown> = current as Record<
        string,
        unknown
      >;
      let fields: number = 0;
      emit("{");
      for (const key of Object.keys(record)) {
        const item: unknown = ownValue(record, key);
        if (
          item === undefined ||
          typeof item === "function" ||
          typeof item === "symbol"
        )
          continue;
        if (fields++) emit(",");
        emit(JSON.stringify(key));
        emit(":");
        encode(item);
      }
      emit("}");
    }
    ancestors.delete(current);
  };
  try {
    encode(artifact);
    flush();
    fs.closeSync(descriptor);
    closed = true;
    fs.linkSync(temporary, output);
    return { sha256: hash.digest("hex"), bytes };
  } finally {
    if (!closed) fs.closeSync(descriptor);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
