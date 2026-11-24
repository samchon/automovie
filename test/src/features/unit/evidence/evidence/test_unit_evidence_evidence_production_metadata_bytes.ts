import { verifyEvidenceMetadataRewrite } from "@automovie/evidence/internal";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../../../internal/ProductionWorkflowFixture";

/**
 * A metadata-only rewrite preserves authored bytes.
 *
 * Scenarios:
 * 1. A metadata-only rewrite accepts an evidence edit beside a BOM and CRLF line endings, but rejects a changed body byte.
 */
export async function test_unit_evidence_evidence_production_metadata_bytes(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const before: string =
      "\uFEFF# Arrival\r\n<!--\r\n@evidence principles/common.md#scope Original evidence.\r\n-->\r\nThe guest opens the door.\r\n";
    const after: string = before.replace(
      "Original evidence.",
      "Rechecked evidence.",
    );
    ProductionWorkflowFixture.write(root, "before/scene.md", before);
    ProductionWorkflowFixture.write(root, "after/scene.md", after);
    verifyEvidenceMetadataRewrite({
      beforeRoot: path.join(root, "before"),
      afterRoot: path.join(root, "after"),
      ownership: "acknowledgements",
      files: ["scene.md"],
    });
    ProductionWorkflowFixture.write(
      root,
      "after/scene.md",
      after.replace("door.", "door!"),
    );
    assert.throws(
      (): unknown =>
        verifyEvidenceMetadataRewrite({
          beforeRoot: path.join(root, "before"),
          afterRoot: path.join(root, "after"),
          ownership: "acknowledgements",
          files: ["scene.md"],
        }),
      /protected authored bytes changed/i,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
