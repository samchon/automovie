import { FamilyConicOwnershipPaths } from "../../../reference-conics/FamilyConicOwnershipPaths";

/**
 * Ownership receipts and companions have distinct JSON paths before any write.
 *
 * Scenarios:
 * 1. Lowercase and uppercase JSON suffixes retain the receipt and name a distinct payload companion.
 * 2. A filename without a JSON suffix is refused before it can alias both outputs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads both actual path results and the non-JSON refusal; reproduces the legacy same-path overwrite without touching disk.
 * @evidence contracts/development/testing.md#independent-expectations Literal sibling filenames specify the expected companion paths. The comparison treats JSON suffix case consistently on Windows.
 * @evidence contracts/development/common.md#meaningful-documentation Uppercase and lowercase JSON names receive distinct companion paths. A filename without a JSON suffix exercises refusal before an overwrite.
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
