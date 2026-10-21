import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createRecoveryFileVectorTable } from "../../../../packages/recovery/src/node/internal/createRecoveryFileVectorTable";
import { nclose } from "../internal/nclose";

/**
 * Private vector pages preserve logical binary64 rows across eviction and failure.
 * Scenarios:
 * 1. More than three pages retain signed zero, finite extremes and partial tails.
 * 2. Original face/corner reductions match an independent in-memory accumulator.
 * 3. Short transfers progress, copied reads do not mutate storage, finish is final.
 * 4. Failed dirty eviction latches its first thrown value, including undefined.
 * 5. Invalid rows, nonfinite updates and zero-progress reads refuse before reuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Uses actual exclusive files through the product's read/write callbacks, forces eviction with 8197 rows, changes accumulators in repeated-corner order, finishes and decodes every persisted scalar. Separate owned callbacks force short transfers, failed eviction, truncation and invalid input without replacing a foreign method.
 * @evidence contracts/testing.md#independent-expectations Direct Float64Array storage and the explicit ordered cross-product/corner sum are the binary64 reference; persisted length must be exactly 8197 times 24, excluding page padding. Three times 65520 bounds actual allocated page bytes. Object.is distinguishes signed zero and nclose with zero tolerance compares finite scalars. These checks do not prove whole-model topology or universal speedup.
 * @evidence contracts/testing.md#distinguishing-cases Crosses the third-page boundary with a seven-row tail, revisits evicted pages, repeats a face corner, updates the tail, checks exact capacity and one-over refusal, copied reads, idempotent finish, operations after finish, short read/write progress, zero-progress refusal and original Symbol/undefined errors. Existing contour-file tests own public kernel geometry, normal and construction equality, prism/cavity areas and publication failures.
 * @evidence contracts/testing.md#execution-ownership This discoverable portable Node unit calls only the vector-table seam and its own synchronous temporary files/callbacks. It starts no process/browser/GPU/build and cleans only its owned temporary directory after retaining any primary failure.
 */
export function test_geometry_contour_vector_pages(): void {
  const directory: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-vector-pages-"),
  );
  const descriptors: number[] = [];
  const rows: number = 8197;
  const reference: Float64Array = new Float64Array(rows * 3);
  const areaReference: Float64Array = new Float64Array(rows * 3);
  const identity: (operation: () => void) => unknown = (
    operation: () => void,
  ): unknown => {
    try {
      operation();
      return "unexpected-success";
    } catch (error: unknown) {
      return error;
    }
  };
  const same: (actual: number, expected: number) => boolean = (
    actual: number,
    expected: number,
  ): boolean =>
    nclose(actual, expected, 0) &&
    (expected !== 0 || Object.is(actual, expected));
  // I/O callbacks propagate failures received as unknown, including undefined.
  const propagate: (failure: unknown) => never = (failure: unknown): never => {
    throw failure;
  };
  let failed: boolean = false,
    primary: unknown;
  try {
    const create: (
      name: string,
      short: boolean,
    ) => ReturnType<typeof createRecoveryFileVectorTable> = (
      name: string,
      short: boolean,
    ): ReturnType<typeof createRecoveryFileVectorTable> => {
      const descriptor: number = fs.openSync(path.join(directory, name), "wx+");
      descriptors.push(descriptor);
      return createRecoveryFileVectorTable({
        maxRows: rows,
        read: (
          buffer: Buffer,
          offset: number,
          length: number,
          position: number,
        ): number =>
          fs.readSync(
            descriptor,
            buffer,
            offset,
            short ? Math.min(length, 1031) : length,
            position,
          ),
        write: (
          buffer: Buffer,
          offset: number,
          length: number,
          position: number,
        ): number =>
          fs.writeSync(
            descriptor,
            buffer,
            offset,
            short ? Math.min(length, 1031) : length,
            position,
          ),
      });
    };
    const positions: ReturnType<typeof createRecoveryFileVectorTable> = create(
      "positions.bin",
      true,
    );
    const area: ReturnType<typeof createRecoveryFileVectorTable> = create(
      "area.bin",
      false,
    );
    for (let index: number = 0; index < rows; index++) {
      const value: [number, number, number] = [
        index === 0 ? -0 : index / 8,
        (index % 17) / 16,
        (index % 31) - 15,
      ];
      for (let axis: number = 0; axis < 3; axis++)
        reference[index * 3 + axis] = value[axis]!;
      positions.append(value);
      area.append([0, 0, 0]);
    }
    const copy: [number, number, number] = positions.read(0);
    copy[0] = 99;
    TestValidator.predicate(
      "read result is independent and preserves negative zero",
      Object.is(positions.read(0)[0], -0),
    );
    for (const corners of [
      [0, 1, 2],
      [8196, 2731, 5461],
      [7, 7, 8195],
      [5460, 2730, 8190],
      [2, 1, 0],
    ]) {
      const points: number[][] = corners.map((index: number): number[] =>
        Array.from(reference.slice(index * 3, index * 3 + 3)),
      );
      const x: number[] = points[0]!,
        y: number[] = points[1]!,
        z: number[] = points[2]!;
      const cross: number[] = [
        (y[1]! - x[1]!) * (z[2]! - x[2]!) - (y[2]! - x[2]!) * (z[1]! - x[1]!),
        (y[2]! - x[2]!) * (z[0]! - x[0]!) - (y[0]! - x[0]!) * (z[2]! - x[2]!),
        (y[0]! - x[0]!) * (z[1]! - x[1]!) - (y[1]! - x[1]!) * (z[0]! - x[0]!),
      ];
      const loaded: [number, number, number][] = corners.map(
        (index: number): [number, number, number] => positions.read(index),
      );
      TestValidator.predicate(
        "reloaded position rows retain every original scalar",
        loaded.every((point: number[], i: number): boolean =>
          point.every((value: number, axis: number): boolean =>
            same(value, points[i]![axis]!),
          ),
        ),
      );
      for (const index of corners) {
        const previous: [number, number, number] = area.read(index);
        area.update(index, [
          previous[0] + cross[0]!,
          previous[1] + cross[1]!,
          previous[2] + cross[2]!,
        ]);
        for (let axis: number = 0; axis < 3; axis++)
          areaReference[index * 3 + axis]! += cross[axis]!;
      }
    }
    positions.update(rows - 1, [Number.MIN_VALUE, -Number.MAX_VALUE, -0]);
    reference.set([Number.MIN_VALUE, -Number.MAX_VALUE, -0], (rows - 1) * 3);
    for (let index: number = rows - 1; index >= 0; index--)
      TestValidator.predicate(
        "dirty and evicted accumulation rows preserve ordered sums",
        area
          .read(index)
          .every((value: number, axis: number): boolean =>
            same(value, areaReference[index * 3 + axis]!),
          ),
      );
    positions.finish();
    area.finish();
    const completed: ReturnType<typeof positions.statistics> =
      positions.statistics();
    positions.finish();
    TestValidator.equals(
      "idempotent finish performs no extra transfers",
      positions.statistics(),
      completed,
    );
    for (const name of ["positions", "area"] as const) {
      const bytes: Buffer = fs.readFileSync(
        path.join(directory, `${name}.bin`),
      );
      const expected: Float64Array =
        name === "positions" ? reference : areaReference;
      TestValidator.equals(
        "partial tail excludes padding",
        bytes.length,
        rows * 24,
      );
      for (let scalar: number = 0; scalar < expected.length; scalar++)
        TestValidator.predicate(
          "all persisted binary64 values are exact",
          same(bytes.readDoubleLE(scalar * 8), expected[scalar]!),
        );
    }
    for (const table of [positions, area]) {
      TestValidator.equals(
        "three-page high water",
        table.statistics().allocatedPageBytes,
        3 * 65520,
      );
      TestValidator.predicate(
        "finished table refuses subsequent access",
        identity((): void => {
          table.read(0);
        }) instanceof Error,
      );
    }
    TestValidator.predicate(
      "sequential area scans coalesce row IO",
      area.statistics().readTransfers + area.statistics().writeTransfers < rows,
    );
    for (const sentinel of [Symbol("failed-flush"), undefined]) {
      let writes: number = 0;
      const table: ReturnType<typeof createRecoveryFileVectorTable> =
        createRecoveryFileVectorTable({
          maxRows: rows,
          read: (): number => 0,
          write: (): number => {
            writes++;
            if (writes === 1) return 7;
            return propagate(sentinel);
          },
        });
      const observed: unknown = identity((): void => {
        for (let i: number = 0; i < rows; i++) table.append([i, 0, 0]);
      });
      TestValidator.predicate(
        "eviction preserves original thrown value",
        observed === sentinel,
      );
      TestValidator.predicate(
        "finish retains failed eviction identity",
        identity((): void => table.finish()) === sentinel,
      );
      TestValidator.equals(
        "failed owner never attempts another transfer",
        writes,
        2,
      );
    }
    for (const invalid of ["row", "finite", "ceiling", "eof"] as const) {
      const table: ReturnType<typeof createRecoveryFileVectorTable> =
        createRecoveryFileVectorTable({
          maxRows: invalid === "eof" ? rows : 1,
          read: (): number => 0,
          write: (_buffer: Buffer, _offset: number, length: number): number =>
            length,
        });
      table.append([0, 0, 0]);
      const error: unknown = identity((): void => {
        if (invalid === "row") table.read(1);
        else if (invalid === "finite") table.update(0, [1, 2, Infinity]);
        else if (invalid === "ceiling") table.append([1, 2, 3]);
        else {
          for (let index: number = 1; index < rows; index++)
            table.append([index, 0, 0]);
          table.read(0);
        }
      });
      TestValidator.predicate(
        "invalid operation refuses",
        error instanceof Error,
      );
      TestValidator.predicate(
        "failure is terminal",
        identity((): void => table.finish()) === error,
      );
    }
  } catch (error: unknown) {
    failed = true;
    primary = error;
  }
  for (const descriptor of descriptors)
    try {
      fs.closeSync(descriptor);
    } catch (error: unknown) {
      if (!failed) {
        failed = true;
        primary = error;
      }
    }
  try {
    if (
      !path
        .resolve(directory)
        .startsWith(
          path.resolve(os.tmpdir()) + path.sep + "automovie-vector-pages-",
        )
    )
      throw new Error("Owned vector-page temporary containment failed");
    fs.rmSync(directory, { recursive: true, force: false });
  } catch (error: unknown) {
    if (!failed) {
      failed = true;
      primary = error;
    }
  }
  if (failed) throw primary;
}
