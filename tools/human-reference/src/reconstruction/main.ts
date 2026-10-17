import { loft } from "./loft.ts";

/**
 * Runs one manifest-bound reconstruction into an explicitly owned private directory.
 *
 * @evidence contracts/common.md#principled-implementation Requires explicit immutable-input and candidate-output paths before invoking the engine adapter.
 * @evidence contracts/common.md#clear-and-simple-design The entry point parses two required options and delegates geometry ownership to the adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing options fail without selecting a reference-mesh fallback or implicit output.
 * @evidence contracts/common.md#meaningful-documentation States the manifest-bound invocation and output ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Argument lookup is bounded by the small command line; surface work belongs to the engine.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This entry point owns no compilation or geometry cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It creates no persistent handles or retained evaluation state.
 */
export function main(arguments_: string[]): void {
  const value = (flag: string): string => {
    const index: number = arguments_.indexOf(flag);
    if (index < 0 || !arguments_[index + 1])
      throw new Error(`Required argument: ${flag}`);
    return arguments_[index + 1];
  };
  loft(value("--manifest"), value("--output"));
}

main(process.argv.slice(2));
