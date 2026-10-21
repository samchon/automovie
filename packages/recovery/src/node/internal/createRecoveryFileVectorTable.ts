import type { RecoveryFileVectorTable } from "./RecoveryFileVectorTable";
import type { RecoveryFileVectorTableInput } from "./RecoveryFileVectorTableInput";

/**
 * Keep a private binary64 vector table behind at most three reusable pages.
 * The caller owns its exclusive file and descriptor. Reads return copied triples;
 * writes retain their logical order while private disk flushes may be delayed.
 * Final bytes are meaningful only after finish and successful descriptor close.
 * Failed operations latch their original thrown value and cannot be reused.
 *
 * @evidence contracts/common.md#principled-implementation Complete three-double rows use the original little-endian binary64 encoding. Logical row admission and full-progress transfers distinguish real values from page padding or truncated input.
 * @evidence contracts/common.md#clear-and-simple-design A bounded LRU owns storage while the contour sink keeps numerical order and descriptor/publication ownership. Append, read, update and finish have distinct lifetime states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arithmetic reduction, scalar conversion, new geometry, fabricated row or global cache replaces original logical values. A failed flush cannot recycle its buffer or become a later success.
 * @evidence contracts/common.md#meaningful-documentation States exclusive backing, delayed physical writes, copied triples, terminal failures, idempotent finish and caller close obligations.
 * @evidence contracts/performance.md#efficient-algorithms Each row operation performs constant bounded registry work and three scalar encodings/decodings. A miss transfers at most one complete valid page for reading and one dirty victim for writing; nonlocal workloads can retain worst-case page traffic.
 * @evidence contracts/performance.md#reuse-equivalent-work At most three recent pages reuse their same buffers and headers; repeated logical accesses observe current dirty values without another file transfer. No state escapes into another table or operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The existing 8192-scalar publication quantum yields 2730 vectors and 65520 bytes per page. At most three buffers plus three headers/registry entries and one copied triple are retained; eviction flushes before buffer reuse, and the sink releases the owner after finish/failure and independent descriptor close.
 */
export function createRecoveryFileVectorTable(
  input: RecoveryFileVectorTableInput,
): RecoveryFileVectorTable {
  if (
    !input ||
    !Number.isSafeInteger(input.maxRows) ||
    input.maxRows < 1 ||
    input.maxRows > Math.floor(Number.MAX_SAFE_INTEGER / 24) ||
    typeof input.read !== "function" ||
    typeof input.write !== "function"
  )
    throw new Error("A bounded exclusive binary64 vector table is required");
  /**
   * One erased private page header owns an admitted base row and valid prefix.
   * Valid rows exclude unread padding. The enclosing owner keeps at most three
   * headers/buffers, flushes before reuse and releases them with its table.
   */
  type Page = {
    base: number;
    valid: number;
    dirty: boolean;
    buffer: Buffer;
  };
  const pageRows: number = Math.floor(8192 / 3),
    pageBytes: number = pageRows * 24;
  const pages: Map<number, Page> = new Map();
  let rows: number = 0,
    allocatedPageBytes: number = 0,
    readTransfers: number = 0,
    writeTransfers: number = 0;
  let finished: boolean = false,
    failed: boolean = false,
    primary: unknown;
  const operation: <T>(run: () => T) => T = <T>(run: () => T): T => {
    if (failed) throw primary;
    if (finished) throw new Error("A finished vector table cannot be reused");
    try {
      return run();
    } catch (error: unknown) {
      failed = true;
      primary = error;
      throw error;
    }
  };
  const transfer: (page: Page, writing: boolean) => void = (
    page: Page,
    writing: boolean,
  ): void => {
    const length: number = page.valid * 24;
    let done: number = 0;
    while (done < length) {
      if (writing) writeTransfers++;
      else readTransfers++;
      const count: number = writing
        ? input.write(page.buffer, done, length - done, page.base * 24 + done)
        : input.read(page.buffer, done, length - done, page.base * 24 + done);
      if (!Number.isSafeInteger(count) || count <= 0 || count > length - done)
        throw new Error("Vector table transfer made invalid or zero progress");
      done += count;
    }
  };
  const flush: (page: Page) => void = (page: Page): void => {
    if (!page.dirty) return;
    transfer(page, true);
    page.dirty = false;
  };
  const pageFor: (index: number) => Page = (index: number): Page => {
    const base: number = index - (index % pageRows);
    let page: Page | undefined = pages.get(base);
    if (page) {
      pages.delete(base);
      pages.set(base, page);
      return page;
    }
    if (pages.size < 3) {
      const buffer: Buffer = Buffer.alloc(pageBytes);
      allocatedPageBytes += pageBytes;
      page = { base, valid: 0, dirty: false, buffer };
    } else {
      page = pages.values().next().value;
      if (!page) throw new Error("The vector table lost its owned page");
      flush(page);
      pages.delete(page.base);
      page.base = base;
      page.valid = 0;
      page.dirty = false;
      page.buffer.fill(0);
    }
    page.valid = Math.max(0, Math.min(pageRows, rows - base));
    transfer(page, false);
    pages.set(base, page);
    return page;
  };
  const vector: (value: readonly number[]) => [number, number, number] = (
    value: readonly number[],
  ): [number, number, number] => {
    if (!Array.isArray(value) || value.length !== 3)
      throw new Error("A complete three-scalar vector is required");
    const copy: [number, number, number] = [value[0]!, value[1]!, value[2]!];
    if (!copy.every(Number.isFinite))
      throw new Error("Generated contour table value is not finite");
    return copy;
  };
  const store: (index: number, value: readonly number[]) => void = (
    index: number,
    value: readonly number[],
  ): void => {
    const copy: [number, number, number] = vector(value);
    const page: Page = pageFor(index),
      offset: number = (index - page.base) * 24;
    for (let axis: number = 0; axis < 3; axis++)
      page.buffer.writeDoubleLE(copy[axis]!, offset + axis * 8);
    page.valid = Math.max(page.valid, index - page.base + 1);
    page.dirty = true;
  };
  const existing: (index: number) => void = (index: number): void => {
    if (!Number.isSafeInteger(index) || index < 0 || index >= rows)
      throw new Error("Vector table address is outside its logical rows");
  };
  return {
    append: (value: readonly number[]): void =>
      operation((): void => {
        if (rows >= input.maxRows)
          throw new Error("Vector table row population exceeds its admission");
        store(rows, value);
        rows++;
      }),
    read: (index: number): [number, number, number] =>
      operation((): [number, number, number] => {
        existing(index);
        const page: Page = pageFor(index),
          offset: number = (index - page.base) * 24;
        return [
          page.buffer.readDoubleLE(offset),
          page.buffer.readDoubleLE(offset + 8),
          page.buffer.readDoubleLE(offset + 16),
        ];
      }),
    update: (index: number, value: readonly number[]): void =>
      operation((): void => {
        existing(index);
        store(index, value);
      }),
    finish: (): void => {
      if (failed) throw primary;
      if (finished) return;
      operation((): void => {
        for (const page of pages.values()) flush(page);
        finished = true;
      });
    },
    statistics: (): ReturnType<
      ReturnType<typeof createRecoveryFileVectorTable>["statistics"]
    > => ({
      rows,
      allocatedPageBytes,
      readTransfers,
      writeTransfers,
      finished,
      failed,
    }),
  };
}
