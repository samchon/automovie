import path from "node:path";

import { FamilyConicCaptureTransportFiles as Files } from "./FamilyConicCaptureTransportFiles";

/** Read-only transport command; outputs must be a new directory under human/.shots. */
namespace FamilyConicCaptureTransportCommand {
  /**
   * Require exact absolute metadata inputs; no model or renderer is loaded.
   *
   * @evidence contracts/development/implementation.md#principled-implementation One absolute RootInputs path and new absolute output path select read-only recorded-input transport.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure CLI validation precedes Files.run; the command imports no model or renderer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No field, law, solver or output fallback is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms CLI work is linear in argument count; Files.run owns sequential metadata byte work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The command uses the one shared transport file/admission owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The awaited operation leaves no background process; failures set the Node exit code.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states exact metadata paths and new human/.shots output scope.
   */
  export async function main(): Promise<void> {
    const args: string[] = process.argv.slice(2);
    const option: (key: string) => string = (key: string): string => {
      const found: string[] = args.filter(
        (arg: string): boolean => arg === key || arg.startsWith(key + "="),
      );
      if (
        found.length !== 1 ||
        found[0] === key ||
        !path.isAbsolute(found[0]!.slice(key.length + 1))
      )
        throw new Error(key + " requires one absolute path");
      return found[0]!.slice(key.length + 1);
    };
    const root: string = path.resolve(
      process.cwd(),
      process.cwd().toLowerCase().endsWith("test") ? ".." : ".",
    );
    await Files.run(root, option("--root-inputs"), option("--out"));
  }
}
void FamilyConicCaptureTransportCommand.main().catch((error: unknown): void => {
  process.stderr.write(
    (error instanceof Error ? (error.stack ?? error.message) : String(error)) +
      "\n",
  );
  process.exitCode = 1;
});
