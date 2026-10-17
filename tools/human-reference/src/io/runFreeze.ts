import { parseArgs } from "node:util";

import { freezeInputs } from "./freezeInputs.ts";

/**
 * Publishes a private immutable input run for a producer's subsequent isolated native invocation.
 *
 * @evidence contracts/common.md#principled-implementation Uses the runtime argument parser for explicit manifest and output paths before freezeInputs verifies and publishes the selected data.
 * @evidence contracts/common.md#clear-and-simple-design One command dispatches one input-freeze responsibility and prints its resulting artifact identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default source directory or output identity is inferred; absent arguments fail.
 * @evidence contracts/common.md#meaningful-documentation States the isolated private run purpose; failure text gives both required arguments.
 * @evidence contracts/performance.md#efficient-algorithms Argument parsing scales with CLI text; freezeInputs owns the input-byte copying and verification costs.
 * @evidence contracts/performance.md#reuse-equivalent-work No command cache or in-flight state is retained; freezeInputs validates identical copied bytes before reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one synchronous dispatch and output write, with resource release delegated to the freezing and filesystem owners.
 */
export function runFreeze(): void {
  const args: ReturnType<typeof parseArgs> = parseArgs({
    options: { manifest: { type: "string" }, output: { type: "string" } },
  });
  if (
    !args.values.manifest ||
    !args.values.output ||
    typeof args.values.manifest !== "string" ||
    typeof args.values.output !== "string"
  )
    throw new Error(
      "Use --manifest ABSOLUTE_PATH --output ABSOLUTE_PRIVATE_RUN_DIRECTORY",
    );
  console.log(
    JSON.stringify(freezeInputs(args.values.manifest, args.values.output)),
  );
}

runFreeze();
