import path from "node:path";

/**
 * Resolve the existing maintained source-module address.
 *
 * @evidence contracts/testing.md#behavioral-verification Uses native path resolution from this relocated directory with one additional parent segment; all eleven existing consumers retain the same resolved production module path.
 * @evidence contracts/testing.md#independent-expectations The repository-relative production directory and the caller's exact filename define the expected address, independently of fixture state or source-status output.
 * @evidence contracts/testing.md#distinguishing-cases Snapshot, composition, evaluation, publication, clearance and refusal-message units reuse this address carrier; it neither enumerates files nor admits a module's contents.
 * @evidence contracts/testing.md#execution-ownership The caller's existing require hook loads that resolved module; this helper performs only path calculation and retains no loaded function.
 */
export const productionModule: (file: string) => string = (file: string): string =>
  path.resolve(
    __dirname,
    "../../../../../packages/production/src/production",
    file,
  );
