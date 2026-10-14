import type { AutoMovieProductionDocumentPass } from "../../../../packages/production/src/production/binder/AutoMovieProductionDocumentPass";
import { validateAutoMovieProductionDocumentAncestors } from "../../../../packages/production/src/production/binder/validateAutoMovieProductionDocumentAncestors";
import { TestValidator } from "@nestia/e2e";
import type { Stats } from "node:fs";
import path from "node:path";

/**
 * A final edition must not follow a linked docs ancestor hidden above final.
 *
 * Scenarios:
 * 1. Construction observes docs alone; final observes docs then docs/final.
 * 2. A missing, linked, or non-directory ancestor refuses either selected pass.
 * 3. A normal physical final ancestor remains accepted after each negative.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained ancestor validator with its supplied observation capability and observes requested path order and corrective refusal. Missing, linked and nondirectory observations refuse while physical directory observations remain accepted.
 * @evidence contracts/testing.md#independent-expectations Literal docs and docs/final paths derive from authored pass routing, and the independent observation facts determine refusal without consulting implementation output. This verifies capability semantics rather than native filesystem identity or races.
 * @evidence contracts/testing.md#distinguishing-cases Both one-ancestor construction and two-ancestor final routes run; each expected ancestor receives missing/link/file negatives followed by valid acceptance, preserving adjacent valid ancestors and call order.
 * @evidence contracts/testing.md#execution-ownership The named async unit directly exercises a portable supplied-capability seam without replacing globals or starting a host. This function owns all cases and no dynamic registry installs additional tests.
 */
export async function test_production_document_ancestor_boundary(): Promise<void> {
    const root: string = path.resolve("production");
    const docs: string = path.join(root, "docs");
    for (const pass of [
      "construction",
      "final",
    ] as const satisfies readonly AutoMovieProductionDocumentPass[]) {
      const expected: string[] =
        pass === "final" ? [docs, path.join(docs, "final")] : [docs];
      const observed: string[] = [];
      await validateAutoMovieProductionDocumentAncestors(
        root,
        pass,
        async (directory: string): Promise<Pick<Stats, "isSymbolicLink" | "isDirectory">> => {
          observed.push(directory);
          return { isSymbolicLink: (): boolean => false, isDirectory: (): boolean => true };
        },
      );
      TestValidator.equals(
        `${pass} checks its complete ancestor chain`,
        observed,
        expected,
      );
      for (const failed of expected)
        for (const defect of ["missing", "link", "file"] as const) {
          const result: string = await validateAutoMovieProductionDocumentAncestors(
            root,
            pass,
            async (directory: string): Promise<Pick<Stats, "isSymbolicLink" | "isDirectory">> => {
              if (directory === failed && defect === "missing")
                throw new Error("Absent directory");
              return {
                isSymbolicLink: (): boolean => directory === failed && defect === "link",
                isDirectory: (): boolean => directory !== failed || defect !== "file",
              };
            },
          )
            .then((): string => "accepted")
            .catch((error: unknown): string => String(error));
          TestValidator.predicate(
            `${pass} refuses ${defect} at ${failed}`,
            result.includes(
              `${failed}: authored docs must be one physical directory.`,
            ),
          );
        }
      await validateAutoMovieProductionDocumentAncestors(
        root,
        pass,
        async (): Promise<Pick<Stats, "isSymbolicLink" | "isDirectory">> => ({ isSymbolicLink: (): boolean => false, isDirectory: (): boolean => true }),
      );
    }
}
