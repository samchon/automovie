import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicDeviationCapture as Deviation } from "./FamilyConicDeviationCapture";
import { FamilyConicNativeCapture as Native } from "./FamilyConicNativeCapture";
import { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";
import path from "node:path";

/**
 * Legacy deviation capture is unchanged when native options are absent.
 * --cases=<artifact> --case=<id> --preflight=<per-case-report> captures Figure and
 * Deviation together from one admitted case context under packages/human/.shots.
 */
namespace FamilyConicDeviation {
  /**
   * Admit exact native inputs and select source-only observation, shared full capture, or the absent-option legacy body.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Input.read checks exact case, fields and source/preflight identities before explicit source-only selection or a shared native consumer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Input admission precedes one of three existing callable bodies; only absent native options choose legacy output.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Partial flags and unavailable inputs fail without fallback, another solver or a forced alias.
   * @evidence contracts/development/implementation.md#efficient-algorithms CLI and fingerprint admission precede the selected operation; only one consumer lifetime runs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The native callable owns one shared source/mesh context for Figure and Deviation instead of independent generation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited consumers settle before main returns and the top-level handler records failure without a background task.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states exact input admission, absent-option legacy selection and explicit observation scope.
   */
  export async function main(): Promise<void> {
    const input: Input.IInput | null = await Input.read(
      path.resolve(process.cwd(), ".."),
      process.argv.slice(2),
    );
    const sourceOnly: boolean = Source.requested(
      process.argv.slice(2),
      input !== null,
    );
    if (input === null) await Deviation.run();
    else if (sourceOnly) await Source.run(input);
    else await Native.run(input);
  }
}

void FamilyConicDeviation.main().catch((error: unknown): void => {
  process.stderr.write(
    (error instanceof Error ? (error.stack ?? error.message) : String(error)) +
      "\n",
  );
  process.exitCode = 1;
});
