import fs from "node:fs";

import type { ITestFileSystem } from "./ITestFileSystem";
import type { ITestFileSystemCall } from "./ITestFileSystemCall";

/**
 * Create a test-owned adapter without replacing Node methods. Supplied faults and later assignments affect only this Proxy; other properties forward to the native namespace. Each invoked function records its property and arguments before forwarding, including calls that throw.
 *
 * Behavior: The existing production dependency unit uses opposite existsSync adapters through the actual scoped dispatcher and checks that each records only its own operation.
 * Expectation basis: Literal true/false responses and the two existsSync receipts are authored by the unit, not copied from production results; this helper supplies inputs and observations only.
 * Cases: Every call creates separate overrides and receipts. The owning unit covers asynchronous scope isolation and native fallback; this helper adds no scenario, fault policy or native operation.
 * Execution: The portable owning unit retains the adapter for its case. Function wrappers preserve arguments and thrown values through Reflect.apply; unspecified methods can perform their ordinary filesystem effects, so their caller still owns handles and cleanup. Receipt memory grows with calls until the adapter is released.
 */
export const createTestFileSystem: (
  faults?: Partial<typeof fs>,
) => ITestFileSystem = (
  faults: Partial<typeof fs> = {},
): ITestFileSystem => {
  const calls: ITestFileSystemCall[] = [];
  const overrides: Map<PropertyKey, unknown> = new Map<PropertyKey, unknown>(
    Reflect.ownKeys(faults).map((property: PropertyKey): [PropertyKey, unknown] => [
      property,
      Reflect.get(faults, property),
    ]),
  );
  const fileSystem: typeof fs = new Proxy({} as typeof fs, {
    get: (target: typeof fs, property: PropertyKey): unknown => {
      const value: unknown = overrides.has(property)
        ? overrides.get(property)
        : Object.prototype.hasOwnProperty.call(target, property)
          ? Reflect.get(target, property)
          : Reflect.get(fs, property);
      if (typeof value !== "function") return value;
      return (...args: unknown[]): unknown => {
        calls.push({ operation: String(property), arguments: args });
        return Reflect.apply(value, fileSystem, args);
      };
    },
    set: (_target: typeof fs, property: PropertyKey, value: unknown): boolean => {
      overrides.set(property, value);
      return true;
    },
  }) as typeof fs;
  return { fileSystem, calls: (): readonly ITestFileSystemCall[] => [...calls] };
};
