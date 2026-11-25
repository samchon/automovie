import type { IMotionTakeSource } from "./IMotionTakeSource";

/**
 * Reject callable data in an owner input that has no explicit named binding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the owner input and named-binding requirement.
 * @evidence contracts/development/implementation.md#principled-implementation Matches callable values by runtime identity against the trusted module's declarations. No function is serialized or inferred from its nonportable function name.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a binding set, then checks the reachable owner data once. The identity sets prevent duplicate walks and make each bound callable lookup constant time. Every rebuilt input has a fresh set of callable values. Visited objects and binding identities are local to the check.
 */
export function assertMotionTakeBindings(source: IMotionTakeSource): void {
  const bound: Set<unknown> = new Set();
  for (const binding of source.bindings) {
    if (
      typeof binding.value !== "function" ||
      /^(?:npm|install):/u.test(binding.id)
    )
      throw new Error(`take-provider: invalid binding ${binding.id}`);
    bound.add(binding.value);
  }
  const visited: Set<unknown> = new Set();
  // Canonical bodies rebind their lazy internal readers through the installed owner.
  for (const input of Object.values(source.human))
    for (const performer of input.performers) visited.add(performer.body);
  /** Traverse runtime owner data without evaluating property getters. */
  const visit = (value: unknown, field: string): void => {
    if (typeof value === "function") {
      if (!bound.has(value))
        throw new Error(`take-provider: opaque provider at ${field}`);
      return;
    }
    if (
      typeof value !== "object" ||
      value === null ||
      visited.has(value) ||
      ArrayBuffer.isView(value)
    )
      return;
    visited.add(value);
    if (value instanceof Map || value instanceof Set) {
      for (const item of value) visit(item, `${field}[]`);
      return;
    }
    for (const key of Reflect.ownKeys(value)) {
      const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(
        value,
        key,
      )!;
      if (descriptor.get || descriptor.set)
        throw new Error(
          `take-provider: opaque accessor at ${field}.${String(key)}`,
        );
      visit(descriptor.value, `${field}.${String(key)}`);
    }
  };
  visit(source.human, "human");
  visit(source.branch?.suffix, "branch.suffix");
}
