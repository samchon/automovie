import { HUMAN_CAPTURE_PEOPLE } from "@automovie/human/capture";
import path from "node:path";

import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicFigureCapture as Figure } from "./FamilyConicFigureCapture";
import { FamilyConicNativeCapture as Native } from "./FamilyConicNativeCapture";
import { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";

/**
 * Legacy figure capture is unchanged when native options are absent.
 * --cases=<artifact> --case=<id> --preflight=<per-case-report> captures Figure
 * and Deviation together from one admitted case context under
 * packages/human/.shots. --empty-probes writes the capture figure's placed and
 * unplaced probes to JSON on stdout without realizing or drawing the skin.
 */
namespace FamilyConicFigure {
  /**
   * Report declared empty probes or admit exact native inputs before selecting
   * a figure capture.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Input.read checks exact case, fields and source/preflight identities before explicit source-only selection or a shared native consumer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The standalone probe flag selects the capture subject's declaration directly. Other calls retain native admission and existing capture selection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Partial flags and unavailable inputs fail without fallback, another solver or a forced alias.
   * @evidence contracts/development/implementation.md#efficient-algorithms Probe placement skips mesh realization. Other calls admit CLI and fingerprints before one selected capture consumer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The native callable owns one shared source/mesh context for Figure and Deviation instead of independent generation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited consumers settle before main returns and the top-level handler records failure without a background task.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states exact input admission, absent-option legacy selection and explicit observation scope.
   */
  export async function main(): Promise<void> {
    const args: string[] = process.argv.slice(2);
    if (args.includes("--empty-probes")) {
      if (args.length !== 1)
        throw new Error("--empty-probes takes no other capture options");
      process.stdout.write(
        JSON.stringify(HUMAN_CAPTURE_PEOPLE.f1!.probes(), null, 2) + "\n",
      );
      return;
    }
    const input: Input.IInput | null = await Input.read(
      path.resolve(process.cwd(), ".."),
      args,
    );
    const sourceOnly: boolean = Source.requested(args, input !== null);
    if (input === null) await Figure.run();
    else if (sourceOnly) await Source.run(input);
    else await Native.run(input);
  }
}

void FamilyConicFigure.main().catch((error: unknown): void => {
  process.stderr.write(
    (error instanceof Error ? (error.stack ?? error.message) : String(error)) +
      "\n",
  );
  process.exitCode = 1;
});
