import { verifyEvidenceMetadataRewrite } from "@automovie/evidence/internal";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * A metadata-only rewrite preserves authored bytes.
 *
 * Scenarios:
 * 1. A metadata-only rewrite accepts an evidence edit beside a BOM and CRLF line endings, but rejects a changed body byte.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls verifyEvidenceMetadataRewrite on real bytes, asserting acceptance of an evidence-only edit and refusal of a body change disguised as metadata maintenance.
 * @evidence contracts/development/testing.md#independent-expectations The metadata operation's declared ownership permits only its evidence annotation, so any other changed byte must be refused.
 * @evidence contracts/development/testing.md#distinguishing-cases An evidence-only edit passes and a neighboring punctuation edit fails, both in a file with a BOM and CRLF line endings.
 * @evidence contracts/development/testing.md#execution-ownership The exported test_evidence_production_metadata_bytes entry owns all temporary files and byte comparisons in-process, with cleanup in finally and no subprocess, installed consumer, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the one numbered scenario it runs, naming the input and the behavior it pins.
 */
export async function test_evidence_production_metadata_bytes(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const before: string =
      "\uFEFF# Arrival\r\n<!--\r\n@evidence shared/principles/common.md#scope Original evidence.\r\n-->\r\nThe guest opens the door.\r\n";
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
