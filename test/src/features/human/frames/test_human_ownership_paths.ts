import { FamilyConicOwnershipPaths } from "../../../reference-conics/FamilyConicOwnershipPaths";

/**
 * Ownership receipts and companions have distinct JSON paths before any write.
 *
 * Scenarios:
 * 1. Lowercase and uppercase JSON suffixes retain the receipt and name a distinct payload companion.
 * 2. A filename without a JSON suffix is refused before it can alias both outputs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads both actual path results and the non-JSON refusal; reproduces the legacy same-path overwrite without touching disk.
 * @evidence contracts/development/testing.md#independent-expectations Literal sibling filenames specify the independent expected paths; Windows path equality ignores case.
 * @evidence contracts/development/testing.md#distinguishing-cases A working lowercase name accompanies uppercase and missing-suffix cases, with all findings gathered before failure.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous string-only CPU unit with no filesystem, reference, constructor or process.
 * @evidence contracts/development/common.md#meaningful-documentation Names the overwrite condition and the two numbered input cases.
 */
export function test_human_ownership_paths(): void {
  const failures: string[] = [];
  for (const input of [
    {
      path: "D:\\evidence\\before.json",
      companion: "D:\\evidence\\before.payload.json",
    },
    {
      path: "D:\\evidence\\before.JSON",
      companion: "D:\\evidence\\before.payload.json",
    },
  ]) {
    const result: ReturnType<typeof FamilyConicOwnershipPaths> =
      FamilyConicOwnershipPaths(input.path);
    if (
      result.receipt !== input.path ||
      result.companion !== input.companion ||
      result.receipt.toLowerCase() === result.companion.toLowerCase()
    )
      failures.push(input.path + ": " + JSON.stringify(result));
  }
  let refused: boolean = false;
  try {
    FamilyConicOwnershipPaths("D:\\evidence\\before");
  } catch (error: unknown) {
    refused = error instanceof Error && error.message.includes("JSON suffix");
  }
  if (!refused) failures.push("a missing JSON suffix was accepted");
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
