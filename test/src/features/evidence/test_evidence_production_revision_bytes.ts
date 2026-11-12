import {
  stripNaturalnessComments,
  verifyEvidenceMetadataRewrite,
} from "@automovie/evidence/internal";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Comment removal and metadata-only rewrites preserve authored bytes.
 *
 * Scenarios:
 * 1. Removing HTML comments preserves BOM, CRLF, punctuation and non-comment text.
 * 2. A metadata-only rewrite accepts evidence edits but rejects changed body bytes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls stripNaturalnessComments and verifyEvidenceMetadataRewrite on real bytes, asserting retained BOM/CRLF and refusal of a body change disguised as metadata maintenance.
 * @evidence contracts/development/testing.md#independent-expectations An explicit Buffer literal states the exact comment-free result, including BOM and CRLF. The metadata operation's declared ownership permits only its evidence annotation.
 * @evidence contracts/development/testing.md#distinguishing-cases BOM and CRLF survive removal of one complete comment; an evidence-only edit passes and a neighboring punctuation edit fails.
 * @evidence contracts/development/testing.md#execution-ownership The exported test_evidence_production_revision_bytes entry owns all temporary files and byte comparisons in-process, with cleanup in finally and no subprocess, installed consumer, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Removing HTML comments preserves BOM, CRLF, punctuation and non-comment text.).
 */
export async function test_evidence_production_revision_bytes(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const working: string =
      "\uFEFF# Arrival\r\n\r\n## Door {#door}\r\n<!--\r\nA revision note.\r\n-->\r\nThe guest opens the door.\r\n";
    const promoted: Buffer = Buffer.from(
      "\uFEFF# Arrival\r\n\r\n## Door {#door}\r\n\r\nThe guest opens the door.\r\n",
    );
    assert.deepEqual(stripNaturalnessComments(Buffer.from(working)), promoted);

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
