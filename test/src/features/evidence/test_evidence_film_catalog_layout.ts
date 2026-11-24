import { createEvidenceConfig } from "@automovie/evidence";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Verifies when actual production sources require a review catalog.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public configuration against a starter, a nested film and a case directory before adding a real case.
 * @evidence contracts/development/testing.md#independent-expectations A starter and registry can exist before production begins. An authored film needs both catalog files and an executable case under the documented layout.
 * @evidence contracts/development/testing.md#distinguishing-cases A directory and a declaration share the source suffix without supplying a scene or case. A nested production film has the same duty as a top-level one.
 * @evidence contracts/development/testing.md#execution-ownership All files live in a dedicated temporary production removed after the public configuration calls.
 * @evidence contracts/development/common.md#meaningful-documentation Names the submitted sources and the layout each configuration is expected to accept.
 */
export function test_evidence_film_catalog_layout(): void {
  const root: string = ProductionWorkflowFixture.create();
  const check = (): IEvidenceConfig =>
    createEvidenceConfig({
      location: root,
      development: { composition: "evidence" },
    });
  try {
    fs.mkdirSync(path.join(root, "src/composition/scenes/empty.ts"), {
      recursive: true,
    });
    for (const file of ["starter.ts", "index.ts", "types.d.ts"])
      ProductionWorkflowFixture.write(
        root,
        `src/composition/films/${file}`,
        "export {};\n",
      );
    assert.doesNotThrow(check);

    ProductionWorkflowFixture.write(
      root,
      "src/composition/films/playoffs/final.ts",
      "export function final() {}\n",
    );
    assert.throws(
      check,
      /Missing: src\/composition\/films\/catalog\.ts, docs\/acceptance\/catalog\.md, src\/composition\/scenes\/catalog/,
    );
    ProductionWorkflowFixture.write(
      root,
      "src/composition/films/catalog.ts",
      "export function catalog() {}\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/acceptance/catalog.md",
      "# Catalog\n",
    );
    const cases: string = "src/composition/scenes/catalog";
    fs.mkdirSync(path.join(root, cases, "empty.ts"), { recursive: true });
    ProductionWorkflowFixture.write(
      root,
      `${cases}/types.d.ts`,
      "export {};\n",
    );
    assert.throws(check, /Missing: src\/composition\/scenes\/catalog/);
    ProductionWorkflowFixture.write(
      root,
      `${cases}/step/case.ts`,
      "export function step() {}\n",
    );
    assert.doesNotThrow(check);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
