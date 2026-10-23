import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  type IProductionConfigProps,
  type IProductionPassValidation,
  analyzeProductionPass,
  createProductionConfig,
  stripNaturalnessComments,
  verifyEvidenceMetadataRewrite,
} from "../../../../packages/template/scaffold/workflow/index";
import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Revision transfer requires the exact comment-free working text and preserves bytes.
 *
 * Scenarios:
 * 1. Removing HTML comments preserves BOM, CRLF, punctuation and non-comment text.
 * 2. A changed working scene stays pending until that text reaches the body.
 * 3. A metadata-only rewrite accepts evidence edits but rejects changed body bytes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls stripNaturalnessComments, full analyzeProductionPass and verifyEvidenceMetadataRewrite on real files, asserting exact retained bytes, pending transfer before promotion and refusal of a body change disguised as metadata maintenance.
 * @evidence contracts/testing.md#independent-expectations An explicit Buffer literal states the exact comment-free result, including BOM and CRLF. Independently authored old and revised action determine pending transfer, and the metadata operation's declared ownership permits only its evidence annotation.
 * @evidence contracts/testing.md#distinguishing-cases BOM and CRLF survive removal of one complete comment; mismatched and matched body snapshots distinguish transfer state. An evidence-only edit passes and a neighboring punctuation edit fails. This test does not issue literary approval or execute the promotion CLI.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_revision_bytes entry owns all temporary files and native evidence evaluations in-process, with cleanup in finally and no subprocess, installed consumer, browser or GPU.
 */
export async function test_template_production_revision_bytes(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const working: string =
      "\uFEFF# Arrival\r\n\r\n## Door {#door}\r\n<!--\r\nA revision note.\r\n-->\r\nThe guest opens the door.\r\n";
    const promoted: Buffer = Buffer.from(
      "\uFEFF# Arrival\r\n\r\n## Door {#door}\r\n\r\nThe guest opens the door.\r\n",
    );
    assert.deepEqual(stripNaturalnessComments(Buffer.from(working)), promoted);

    ProductionWorkflowFixture.populate(root);
    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/001-scene.md",
      promoted.toString("utf8").replace("opens", "locks"),
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/revision/screenplay/001-part/001-scene.md",
      promoted.toString("utf8").replace("opens", "locks"),
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/naturalness/screenplay/001-part/001-scene.md",
      working,
    );
    const props: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      "short",
    );
    props.location = path.join(os.tmpdir(), path.basename(root));
    props.construction.screenplay = "evidence";
    props.naturalness.screenplay = "evidence";
    const pending: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(pending.pendingNaturalnessTransfers.length, 1);
    assert.equal(pending.approvalStructureReady, false);
    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/001-scene.md",
      promoted.toString("utf8"),
    );
    const transferred: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.deepEqual(transferred.pendingNaturalnessTransfers, []);
    assert.equal(transferred.approvalStructureReady, false);

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
