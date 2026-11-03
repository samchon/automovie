import { TestValidator } from "@nestia/e2e";
import { HumanOnce } from "../internal/HumanOnce";

/**
 * A failed output producer runs once, without hiding its failure from later consumers.
 *
 * Scenarios:
 * 1. Successful producers return one identical immutable output to three consumers.
 * 2. Native Error and RangeError exceptions are rethrown identically, once produced.
 * 3. Separate immutable input identities run separately; undefined success is distinct from failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes actual producer callbacks and counts invocations. Every failed consumer must receive the original thrown Error object, and every successful consumer the identical generated value.
 * @evidence contracts/testing.md#independent-expectations The contract is exactly one synchronous production per immutable test input identity. Expected call count one and object identity follow that contract, without reading any Human generator output or measurement formula.
 * @evidence contracts/testing.md#distinguishing-cases Covers value, Error, RangeError, undefined success and distinct keys. It proves scheduling and failure preservation only; generated anatomy and mutation of public input tables are separate obligations.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous portable CPU test_human_once imports one production-free test cache and TestValidator, never generating a person or starting a host.
 */
export function test_human_once(): void {
  const cache: HumanOnce<object | undefined> = new HumanOnce();
  const output: object = Object.freeze({ input: "first" }); const native: Error = new Error("actual native refusal");
  const domain: RangeError = new RangeError("actual domain refusal");
  const counts: Record<string, number> = { good: 0, error: 0, rangeError: 0, undefinedSuccess: 0 };
  const failures: string[] = [];
  for (let consumer: number = 0; consumer < 3; consumer++) {
    if (cache.read("good", (): object => { counts.good++; return output; }) !== output) failures.push("Successful consumer lost output identity");
    for (const [key, error] of [["error", native], ["rangeError", domain]] as const) {
      let caught: boolean = false;
      try { cache.read(key, (): never => { counts[key]++; throw error; }); }
      catch (observed) { caught = true; if (observed !== error) failures.push(`${key}: consumer ${consumer} received a different failure`); }
      if (!caught) failures.push(`${key}: consumer ${consumer} silently accepted failed generation`);
    }
    if (cache.read("undefinedSuccess", (): undefined => { counts.undefinedSuccess++; return undefined; }) !== undefined) failures.push("Undefined success changed meaning");
  }
  for (const [key, count] of Object.entries(counts)) if (count !== 1) failures.push(`${key}: observed ${count} productions, expected 1`);
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}
