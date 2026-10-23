import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  type IProductionConfigProps,
  type IProductionGateKey,
  type IProductionPassValidation,
  analyzeProductionPass,
  classifyProductionPassDiagnostics,
  createProductionConfig,
} from "../../../../packages/template/scaffold/workflow/index";
import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Protected regular files retain their ownership through external hard links.
 *
 * Scenarios:
 * 1. Independent engineering support remains valid and its stored decision stays immutable.
 * 2. Active files, inactive scripts, disabled descendants and files outside a pilot remain protected.
 * 3. Adopted instructions and work contracts cannot become support hosts or references.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates original factory graphs with real external hard links used separately as support hosts and references; requires explicit authored-input rejection for every protected family and successful approval for independent support. Reclassifying an earlier valid capture after a new protected hard link verifies snapshot isolation.
 * @evidence contracts/testing.md#independent-expectations Support is engineering independent of the entire protected authored tree, so route selection, disabled stages and pilot filtering cannot release file ownership. Hard links share one filesystem object despite different absolute paths; an unrelated file with equal text remains independent.
 * @evidence contracts/testing.md#distinguishing-cases Covers both host and reference selection for active screenplay, short-route scripts, disabled screenplay, a second part outside the pilot, instructions and a work contract. An independent file and a same-text copy distinguish identity from content; the earlier capture remains valid after a later protected alias is added.
 * @evidence contracts/testing.md#execution-ownership Owns three temporary production roots and one external directory, links only files created by this test, removes all roots in finally, and uses public factory/analyze/classify APIs in-process without installation, subprocesses, network or rendering.
 */
export async function test_template_production_support_identity(): Promise<void> {
  const roots: string[] = [
    ProductionWorkflowFixture.create(),
    ProductionWorkflowFixture.create(),
    ProductionWorkflowFixture.create(),
  ];
  const external: string = ProductionWorkflowFixture.create();
  const errors: string[] = [];
  try {
    const short: IProductionConfigProps = ProductionWorkflowFixture.complete(
      roots[0],
      "short",
    );
    const disabled: IProductionConfigProps = ProductionWorkflowFixture.complete(
      roots[1],
      "long",
    );
    const pilot: IProductionConfigProps = ProductionWorkflowFixture.complete(
      roots[2],
      "long",
    );
    pilot.narrativeScope = { mode: "first-part-pilot", part: "001-part" };
    ProductionWorkflowFixture.write(
      roots[2],
      "docs/body/screenplay/002-other/001-scene.md",
      "# Outside pilot\n\n## Later {#later}\n\nA later scene is still authored.\n",
    );
    for (const props of [short, disabled, pilot])
      await ProductionWorkflowFixture.certify(props.location, props);
    disabled.construction.scripts = "disabled";
    disabled.construction.screenplay = "disabled";
    disabled.naturalness.scripts = "disabled";
    disabled.naturalness.screenplay = "disabled";
    ProductionWorkflowFixture.write(
      external,
      "source.md",
      "# Engineering\n\n## State\n<!--\n@evidence requirement.md#scope Supplies independent engineering evidence.\n-->\nThe engineering task is complete.\n",
    );
    ProductionWorkflowFixture.write(
      external,
      "requirement.md",
      "# Engineering duty\n\n## Scope {#scope}\n\nSupport remains independent.\n",
    );
    const support: IEvidenceClaim = {
      type: "markdown",
      root: external,
      files: ["source.md"],
      symbol: "h2",
      reference: {
        type: "markdown",
        root: external,
        files: ["requirement.md"],
        symbol: "h2",
      },
    };
    const independent: IProductionConfigProps = {
      ...short,
      supportClaims: [support],
    };
    const original: IEvidenceConfig = createProductionConfig(independent);
    const saved: IProductionPassValidation = await analyzeProductionPass(
      original,
      path.join(short.location, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(saved.approvalStructureReady, true);
    const cases: {
      name: string;
      props: IProductionConfigProps;
      key: IProductionGateKey;
      file: string;
    }[] = [
      {
        name: "active screenplay",
        props: short,
        key: { layer: "screenplay", pass: "naturalness" },
        file: "docs/body/screenplay/001-part/001-scene.md",
      },
      {
        name: "inactive short scripts",
        props: short,
        key: { layer: "screenplay", pass: "naturalness" },
        file: "docs/body/scripts/001-part/001-scene.md",
      },
      {
        name: "disabled descendant",
        props: disabled,
        key: { layer: "settings", pass: "construction" },
        file: "docs/body/screenplay/001-part/001-scene.md",
      },
      {
        name: "outside pilot",
        props: pilot,
        key: { layer: "screenplay", pass: "naturalness" },
        file: "docs/body/screenplay/002-other/001-scene.md",
      },
      {
        name: "adopted instruction",
        props: short,
        key: { layer: "screenplay", pass: "naturalness" },
        file: "docs/instructions/001-brief.md",
      },
      {
        name: "work contract",
        props: short,
        key: { layer: "screenplay", pass: "naturalness" },
        file: ".agents/skills/contracts/story/work/discovery/results.md",
      },
    ];
    let ordinal: number = 0;
    for (const scenario of cases) {
      const name: string = `linked-${ordinal++}.md`;
      fs.linkSync(
        path.join(scenario.props.location, scenario.file),
        path.join(external, name),
      );
      for (const side of ["host", "reference"] as const) {
        const selected: IEvidenceClaim =
          side === "host"
            ? { ...support, files: [name] }
            : {
                ...support,
                reference: {
                  type: "markdown",
                  root: external,
                  files: [name],
                  symbol: "h2",
                },
              };
        try {
          await assert.rejects(
            analyzeProductionPass(
              createProductionConfig({
                ...scenario.props,
                supportClaims: [selected],
              }),
              path.join(scenario.props.location, "evidence.config.ts"),
              scenario.key,
            ),
            /support.*authored/iu,
          );
        } catch (error: unknown) {
          errors.push(`${scenario.name} ${side}: ${String(error)}`);
        }
      }
    }
    const newlyProtected: string = path.join(
      short.location,
      "docs/instructions/002-linked-support.md",
    );
    fs.linkSync(path.join(external, "source.md"), newlyProtected);
    const repeated: IProductionPassValidation = classifyProductionPassDiagnostics(
      original,
      { layer: "screenplay", pass: "naturalness" },
      saved.analysis,
    );
    assert.equal(repeated.approvalStructureReady, true);
    assert.deepEqual(repeated.scope, saved.scope);
    await assert.rejects(
      analyzeProductionPass(
        original,
        path.join(short.location, "evidence.config.ts"),
        { layer: "screenplay", pass: "naturalness" },
      ),
      /support.*authored/iu,
    );
    fs.unlinkSync(newlyProtected);
    const copied: string = path.join(external, "same-text.md");
    fs.copyFileSync(
      path.join(short.location, "docs/body/scripts/001-part/001-scene.md"),
      copied,
    );
    await assert.doesNotReject(
      analyzeProductionPass(
        createProductionConfig({
          ...short,
          supportClaims: [{ ...support, files: [path.basename(copied)] }],
        }),
        path.join(short.location, "evidence.config.ts"),
        { layer: "screenplay", pass: "naturalness" },
      ),
    );
  } catch (error: unknown) {
    errors.push(`identity setup or independent support: ${String(error)}`);
  } finally {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(external, { recursive: true, force: true });
  }
  assert.deepEqual(errors, [], errors.join("\n"));
}
