import {
  type IScaffoldPublicationReceipt,
  ScaffoldPublicationError,
  publishFiles,
  writeFiles,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * A populated root is refused before anything is written unless `force` is
 * given, and `force` replaces an existing file in place.
 *
 * Scenarios:
 *
 * 1. A root holding an unrelated file and a file of the map refuses the first
 *    entry without `force`: the receipt is `refused`, its cause names the
 *    non-empty root, and neither a new directory nor new content appears.
 * 2. `writeFiles` on that root throws `ScaffoldPublicationError` carrying the
 *    refused receipt and writes nothing.
 * 3. The same root with `force` completes, replaces the existing file's
 *    content, and leaves the unrelated file unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification The test runs `publishFiles` and `writeFiles` on a populated temporary root and asserts the receipts, the thrown error, and the text on disk, catching a write into a populated root without `force`, a refusal that still wrote files, a missing receipt on the thrown error, or a forced run that skips the replacement or disturbs another file.
 * @evidence contracts/testing.md#independent-expectations Expected text is the literal input or the pre-seeded content, and the `refused` status follows the documented rule that a refusal at the first entry means nothing was created; nothing is read from the implementation to build expectations.
 * @evidence contracts/testing.md#distinguishing-cases The same root is refused without `force` and admitted with it, a file named by the map is replaced while an unrelated file is untouched, and the throwing and receipt forms are both checked on the refusal. A missing root and an empty map are owned by `test_template_scaffold_publication_files`, and candidate validation by `test_template_scaffold_publication_candidate`.
 * @evidence contracts/testing.md#execution-ownership The scenario seeds its populated root as a fresh `mkdtempSync` directory and deletes it in `finally`, so it never touches the repository; the forced run goes through the in-place rewrite and the native create already built into the package, with no child process, and the runner discovers it by its `test_` export in `features/template`.
 */
export function test_template_scaffold_publication_force(): void {
  const temporary: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-scaffold-"),
  );
  try {
    const files: Record<string, string> = {
      "src/index.ts": "export {};\n",
      "README.md": "# new\n",
    };
    const readme: string = path.join(temporary, "README.md");
    const keep: string = path.join(temporary, "keep.txt");
    fs.writeFileSync(readme, "old");
    fs.writeFileSync(keep, "keep");

    const refused: IScaffoldPublicationReceipt = publishFiles(temporary, files);
    TestValidator.equals("populated root refused", refused.status, "refused");
    TestValidator.predicate(
      "refusal names the non-empty root",
      refused.failure?.outcome.status === "refused" &&
        refused.failure.outcome.error instanceof Error &&
        refused.failure.outcome.error.message.includes(
          "target directory is not empty",
        ),
    );
    let thrown: unknown = null;
    try {
      writeFiles(temporary, files);
    } catch (error) {
      thrown = error;
    }
    TestValidator.predicate(
      "writeFiles throws with the refused receipt",
      thrown instanceof ScaffoldPublicationError &&
        thrown.receipt.status === "refused",
    );
    TestValidator.equals(
      "refusals wrote nothing",
      [fs.existsSync(path.join(temporary, "src")), fs.readFileSync(readme, "utf8")],
      [false, "old"],
    );

    const forced: IScaffoldPublicationReceipt = publishFiles(temporary, files, {
      force: true,
    });
    TestValidator.equals("forced publication completes", forced.status, "completed");
    TestValidator.equals(
      "existing file replaced, unrelated file kept",
      [fs.readFileSync(readme, "utf8"), fs.readFileSync(keep, "utf8")],
      ["# new\n", "keep"],
    );
  } finally {
    fs.rmSync(temporary, { force: true, recursive: true });
  }
}
