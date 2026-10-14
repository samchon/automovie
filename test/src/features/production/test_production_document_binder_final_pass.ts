import { AutoMovieProductionBinder } from "../../../../packages/production/src/production/AutoMovieProductionBinder";
import type { AutoMovieProductionDocumentPass } from "../../../../packages/production/src/production/binder/AutoMovieProductionDocumentPass";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { throwsError } from "../internal/predicates";

/**
 * The reader binder resolves the final screenplay tree explicitly.
 *
 * Scenarios:
 * 1. Final exposes a distinct source and filename; construction remains the API default.
 * 2. A non-screenplay final pass and an unknown runtime pass are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Constructs the public binder and observes pass, source and filename; unsupported pass/layer combinations must throw while valid final and default construction routes remain usable.
 * @evidence contracts/testing.md#independent-expectations Expected paths come from the authored docs/final/screenplays and docs/screenplays contract, and literal filename spellings independently pin the title/pass/layer projection. This does not prove filesystem publication.
 * @evidence contracts/testing.md#distinguishing-cases Explicit final and omitted construction pass are positive neighbors; final scripts and an unknown runtime pass are negative boundaries. Physical ancestor and Markdown/publication behavior belong to their owning tests.
 * @evidence contracts/testing.md#execution-ownership This portable unit is discovered through its named export and calls the maintained constructor directly; it installs no application consumer, filesystem host or dynamic registry.
 */
export function test_production_document_binder_final_pass(): void {
  const root: string = path.resolve("production");
  const binder: AutoMovieProductionBinder = new AutoMovieProductionBinder({
    root,
    title: "Reader Edition",
    layer: "screenplays",
    pass: "final",
  });
  TestValidator.equals(
    "a final edition exposes its exact authored source and output identity",
    {
      pass: binder.pass,
      source: binder.source,
      filename: binder.filename,
    },
    {
      pass: "final",
      source: path.join(root, "docs", "final", "screenplays"),
      filename: "reader-edition-final-screenplays.md",
    },
  );
  const construction: AutoMovieProductionBinder = new AutoMovieProductionBinder({
    root,
    title: "Working Edition",
    layer: "screenplays",
  });
  TestValidator.equals(
    "the API default remains the construction tree",
    {
      pass: construction.pass,
      source: construction.source,
      filename: construction.filename,
    },
    {
      pass: "construction",
      source: path.join(root, "docs", "screenplays"),
      filename: "working-edition-screenplays.md",
    },
  );
  TestValidator.predicate(
    "non-screenplay final passes are refused",
    throwsError(
      (): AutoMovieProductionBinder =>
        new AutoMovieProductionBinder({
          root,
          title: "Invalid",
          layer: "scripts",
          pass: "final",
        }),
    ),
  );
  TestValidator.predicate(
    "unknown runtime passes are refused",
    throwsError(
      (): AutoMovieProductionBinder =>
        new AutoMovieProductionBinder({
          root,
          title: "Invalid",
          layer: "screenplays",
          pass: "unknown" as AutoMovieProductionDocumentPass,
        }),
    ),
  );
}
