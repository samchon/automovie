import { createEvidenceConfig } from "@automovie/evidence";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../../../internal/ProductionWorkflowFixture";

/**
 * Verifies when actual production sources require a review catalog.
 */
export function test_unit_evidence_evidence_film_catalog_layout(): void {
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
