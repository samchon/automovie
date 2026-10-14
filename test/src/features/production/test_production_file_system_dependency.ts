import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import type { ITestFileSystem } from "../internal/ITestFileSystem";
import type { ITestFileSystemCall } from "../internal/ITestFileSystemCall";

import {
  createTestFileSystem,
  currentTestFileSystem,
  productionTestFileSystem,
  withTestFileSystem,
} from "../internal/testFileSystem";

/**
 * Pin invocation-local production filesystem dispatch across an asynchronous yield without modifying Node's namespace.
 *
 * Scenarios:
 * 1. Two concurrent scoped adapters return their independently authored opposite existsSync responses after a microtask yield.
 * 2. Each adapter records only its own existsSync operation.
 * 3. After both scopes complete, the current dependency is the native Node filesystem namespace.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the real production dispatcher inside concurrent AsyncLocalStorage scopes and asserts routed boolean results, per-adapter operation receipts and native fallback, catching scope leakage or a dispatcher permanently bound to one adapter.
 * @evidence contracts/testing.md#independent-expectations Literal true/false adapters and expected existsSync receipts are authored independently of dispatch, while the fallback oracle is Node's actual namespace identity. The unit does not establish storage correctness of the native methods.
 * @evidence contracts/testing.md#distinguishing-cases Retains two opposite adapters, concurrent asynchronous yields, separate receipts and the unscoped fallback. Nested scopes, synchronous throws and storage fault behavior are not cases of this unit.
 * @evidence contracts/testing.md#execution-ownership This named async unit owns all three portable in-process cases through canonical production context and dispatcher modules. Adapters are caller-owned inputs, no process/browser/GPU or file is opened, and helper leaves register no tests.
 */
export async function test_production_file_system_dependency(): Promise<void> {
    const first: ITestFileSystem = createTestFileSystem({ existsSync: (): boolean => true });
    const second: ITestFileSystem = createTestFileSystem({ existsSync: (): boolean => false });
    const observed: boolean[] = await Promise.all([
      withTestFileSystem(first.fileSystem, async (): Promise<boolean> => {
        await Promise.resolve();
        return productionTestFileSystem().existsSync("isolated-first");
      }),
      withTestFileSystem(second.fileSystem, async (): Promise<boolean> => {
        await Promise.resolve();
        return productionTestFileSystem().existsSync("isolated-second");
      }),
    ]);
    TestValidator.equals(
      "concurrent filesystem dependencies remain isolated",
      observed,
      [true, false],
    );
    TestValidator.equals(
      "each adapter records only its own calls",
      {
        first: first.calls().map((call: ITestFileSystemCall): string => call.operation),
        second: second.calls().map((call: ITestFileSystemCall): string => call.operation),
      },
      {
        first: ["existsSync"],
        second: ["existsSync"],
      },
    );
    TestValidator.equals(
      "production uses the native filesystem outside an injected invocation",
      currentTestFileSystem(),
      fs,
    );
}
