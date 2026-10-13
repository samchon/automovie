import { compareCodeUnits } from "../contentIdentity";
import { AutoMovieDesignDerivationError } from "./AutoMovieDesignDerivationError";
import { assertRelativePath } from "./assertRelativePath";

/**
 * Copy evaluated output bytes and sort by target before comparison.
 *
 * @evidence contracts/common.md#principled-implementation Copies each output byte population, code-unit sorts targets, rejects duplicate target identities and validates every record path.
 * @evidence contracts/common.md#clear-and-simple-design One output normalization feeds both evaluation comparison and final candidate manifest assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed evaluator output remains a premise beyond these checks; this helper does not admit every runtime shape or prove callback purity.
 * @evidence contracts/common.md#meaningful-documentation States independent byte copies, target order, duplicate refusal and lexical record-path admission.
 * @evidence contracts/performance.md#efficient-algorithms Copies b output bytes and n wrappers, adds O(n log n) target comparisons and linear duplicate/path checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Each evaluation gets fresh byte copies so later buffer mutation cannot silently replace the earlier compared population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned copied buffers stay with candidate staging until caller release; shallow wrapper spreads may also retain runtime extra fields. Temporary target Set owns no external resource.
 */
export function canonicalOutputs(
  outputs: readonly { target: string; recordPath: string; bytes: Uint8Array }[],
): readonly { target: string; recordPath: string; bytes: Uint8Array }[] {
  const sorted: { target: string; recordPath: string; bytes: Uint8Array }[] = outputs
    .map((output: { target: string; recordPath: string; bytes: Uint8Array }): { target: string; recordPath: string; bytes: Uint8Array } => ({ ...output, bytes: Buffer.from(output.bytes) }))
    .sort((left: { target: string; recordPath: string; bytes: Uint8Array }, right: { target: string; recordPath: string; bytes: Uint8Array }): number => compareCodeUnits(left.target, right.target));
  if (new Set(sorted.map((output: { target: string; recordPath: string; bytes: Uint8Array }): string => output.target)).size !== sorted.length)
    throw new AutoMovieDesignDerivationError(
      "design-derivation-nondeterministic",
      "Design evaluation returned a duplicate target identity.",
    );
  for (const output of sorted) assertRelativePath(output.recordPath);
  return sorted;
}
