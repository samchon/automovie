import {
  type IProductionConfigProps,
  type IProductionPassValidation,
  analyzeProductionPass,
  classifyProductionPassDiagnostics,
  createProductionConfig,
} from "@automovie/evidence/narrative";
import type {
  IEvidenceCheckAnalysis,
  IEvidenceConfig,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Captured pass decisions survive later filesystem aliases and preserve provided revision indexes.
 *
 * Scenarios:
 * 1. Adding an authored junction cannot reinterpret an already evaluated support population.
 * 2. Retargeting and removing links affect only fresh captures, including authored paths with external physical targets.
 * 3. An absent working index is optional, but a provided index must reach its existing body unchanged outside comments.
 * 4. Missing body targets and changed index identities remain explicit transfer failures.
 * 5. Raw native analyses and another factory config cannot borrow captured provenance.
 *
 * @evidence contracts/testing.md#behavioral-verification Uses complete factory graphs and the public analyze/classify seam, then changes a real directory junction and compares saved decisions while requiring a fresh evaluation to reject the new authored alias. Provided-index cases inspect actual transfer diagnostics and approval state.
 * @evidence contracts/testing.md#independent-expectations The original evaluated graph and path ownership define the saved decision; a newly introduced authored alias belongs only to the next capture. Explicit original and revised index bytes define promotion, while original index headings define its identity.
 * @evidence contracts/testing.md#distinguishing-cases Covers added, removed and retargeted aliases, nested authored links to external physical directories, unbound analyses and mismatched config ownership, absent versus provided working navigation, matching bytes, changed whitespace, changed H1, and a missing target. Existing support-scope cases retain hard-link and broad selector checks. Failures are collected before the test reports the complete round.
 * @evidence contracts/testing.md#execution-ownership Owns temporary production and external-support directories, removes the junction itself before cleanup, and calls real Evidence APIs in-process without installing packages or starting processes, browser hosts, GPUs, or network operations.
 */
export async function test_template_production_snapshot(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  const external: string = ProductionWorkflowFixture.create();
  const alternate: string = ProductionWorkflowFixture.create();
  const errors: string[] = [];
  const linked: string = path.join(root, "docs/body/linked");
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "short",
    );
    await ProductionWorkflowFixture.certify(root, props);
    ProductionWorkflowFixture.write(
      external,
      "source.md",
      "# Support\n\n## State\n<!--\n@evidence requirement.md#scope Supplies the external engineering duty.\n-->\nThe independent support is ready.\n",
    );
    ProductionWorkflowFixture.write(
      external,
      "requirement.md",
      "# Engineering\n\n## Scope {#scope}\n\nSupport remains independent of narrative inputs.\n",
    );
    props.supportClaims = [
      {
        name: "external engineering",
        type: "markdown",
        root: external,
        files: ["source.md"],
        symbol: "h2",
        reference: {
          type: "markdown",
          root: external,
          files: ["requirement.md"],
          symbol: "h2",
          noEvidenceExclude: true,
        },
      },
    ];
    const config: IEvidenceConfig = createProductionConfig(props);
    const first: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(first.approvalStructureReady, true);
    fs.symlinkSync(
      external,
      linked,
      process.platform === "win32" ? "junction" : "dir",
    );
    unchanged(config, first, "added junction", errors);
    await assert.rejects(
      analyzeProductionPass(config, path.join(root, "evidence.config.ts"), {
        layer: "screenplay",
        pass: "naturalness",
      }),
      /support.*authored/iu,
    );
    fs.unlinkSync(linked);
    unchanged(config, first, "removed junction", errors);
    fs.symlinkSync(
      alternate,
      linked,
      process.platform === "win32" ? "junction" : "dir",
    );
    const second: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(second.approvalStructureReady, true);
    fs.unlinkSync(linked);
    fs.symlinkSync(
      external,
      linked,
      process.platform === "win32" ? "junction" : "dir",
    );
    unchanged(config, second, "retargeted junction", errors);
    await assert.rejects(
      analyzeProductionPass(config, path.join(root, "evidence.config.ts"), {
        layer: "screenplay",
        pass: "naturalness",
      }),
      /support.*authored/iu,
    );
    fs.unlinkSync(linked);
    unchanged(config, second, "removed captured junction", errors);
    const fresh: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(fresh.approvalStructureReady, true);
  } catch (error: unknown) {
    errors.push(`support capture: ${String(error)}`);
  } finally {
    if (fs.existsSync(linked)) fs.unlinkSync(linked);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(external, { recursive: true, force: true });
    fs.rmSync(alternate, { recursive: true, force: true });
  }
  const aliased: string = ProductionWorkflowFixture.create();
  const targets: string = ProductionWorkflowFixture.create();
  const bodyDirectory: string = path.join(
    aliased,
    "docs/body/screenplay/001-part",
  );
  const workingDirectory: string = path.join(
    aliased,
    "docs/naturalness/screenplay/001-part",
  );
  const aliases: string[] = [];
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      aliased,
      "short",
    );
    await ProductionWorkflowFixture.certify(aliased, props);
    for (const [directory, name] of [
      [bodyDirectory, "body"],
      [workingDirectory, "working"],
    ] as const) {
      const target: string = path.join(targets, name);
      fs.renameSync(directory, target);
      fs.symlinkSync(
        target,
        directory,
        process.platform === "win32" ? "junction" : "dir",
      );
      aliases.push(directory);
    }
    const config: IEvidenceConfig = createProductionConfig(props);
    const result: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(aliased, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(
      result.approvalStructureReady,
      true,
      JSON.stringify(result.scope.issues),
    );
    assert.deepEqual(result.pendingNaturalnessTransfers, []);
    const rootAlias: string = path.join(targets, "production-root");
    fs.symlinkSync(
      aliased,
      rootAlias,
      process.platform === "win32" ? "junction" : "dir",
    );
    aliases.push(rootAlias);
    const aliasConfig: IEvidenceConfig = createProductionConfig({
      ...props,
      location: rootAlias,
    });
    const aliasResult: IProductionPassValidation = await analyzeProductionPass(
      aliasConfig,
      path.join(aliased, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(
      aliasResult.approvalStructureReady,
      true,
      JSON.stringify(aliasResult.scope.issues),
    );
    const raw: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(aliased, config.claims);
    assert.throws(
      (): IProductionPassValidation =>
        classifyProductionPassDiagnostics(
          config,
          { layer: "screenplay", pass: "naturalness" },
          raw,
        ),
      /captured.*analyzeProductionPass/iu,
    );
    assert.throws(
      (): IProductionPassValidation =>
        classifyProductionPassDiagnostics(
          createProductionConfig(props),
          { layer: "screenplay", pass: "naturalness" },
          result.analysis,
        ),
      /original config/iu,
    );
    fs.unlinkSync(workingDirectory);
    fs.mkdirSync(path.join(targets, "empty"));
    fs.symlinkSync(
      path.join(targets, "empty"),
      workingDirectory,
      process.platform === "win32" ? "junction" : "dir",
    );
    unchanged(config, result, "retargeted working tree", errors);
    const changed: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(aliased, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(changed.approvalStructureReady, false);
  } catch (error: unknown) {
    errors.push(`authored physical/logical aliases: ${String(error)}`);
  } finally {
    for (const directory of aliases)
      if (fs.existsSync(directory)) fs.unlinkSync(directory);
    fs.rmSync(aliased, { recursive: true, force: true });
    fs.rmSync(targets, { recursive: true, force: true });
  }
  const revision: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      revision,
      "short",
    );
    await ProductionWorkflowFixture.certify(revision, props);
    const body: string = "docs/body/screenplay/001-part/index.md";
    const working: string = "docs/naturalness/screenplay/001-part/index.md";
    const original: string = fs.readFileSync(path.join(revision, body), "utf8");
    const baseline: IProductionPassValidation = await inspect(revision, props);
    assert.equal(baseline.approvalStructureReady, true);
    const cases: {
      label: string;
      content: string;
      expected: RegExp | null;
      remove?: boolean;
    }[] = [
      {
        label: "comment-only index",
        content: `${original}<!-- Revision note. -->`,
        expected: null,
      },
      {
        label: "untransferred index bytes",
        content: `${original}\n`,
        expected: /body differs/iu,
      },
      {
        label: "changed index identity",
        content: original.replace("First part", "Other part"),
        expected: /identity|heading/iu,
      },
      {
        label: "missing body index",
        content: original,
        expected: /body.*missing|missing.*body/iu,
        remove: true,
      },
    ];
    for (const scenario of cases) {
      try {
        ProductionWorkflowFixture.write(revision, working, scenario.content);
        if (scenario.remove) fs.rmSync(path.join(revision, body));
        const result: IProductionPassValidation = await inspect(
          revision,
          props,
        );
        if (scenario.expected === null)
          assert.equal(result.approvalStructureReady, true);
        else {
          assert.equal(result.approvalStructureReady, false);
          assert.ok(
            result.pendingNaturalnessTransfers.some(
              (entry: {
                layer: string;
                file: string;
                reason: string;
              }): boolean =>
                entry.file === "001-part/index.md" &&
                scenario.expected!.test(entry.reason),
            ),
            JSON.stringify(result.pendingNaturalnessTransfers),
          );
        }
      } catch (error: unknown) {
        errors.push(`${scenario.label}: ${String(error)}`);
      }
    }
  } catch (error: unknown) {
    errors.push(`revision capture: ${String(error)}`);
  } finally {
    fs.rmSync(revision, { recursive: true, force: true });
  }
  assert.deepEqual(errors, [], errors.join("\n"));
}

/** Evaluates a fresh original factory instance for one explicit revision snapshot. */
async function inspect(
  root: string,
  props: IProductionConfigProps,
): Promise<IProductionPassValidation> {
  return analyzeProductionPass(
    createProductionConfig(props),
    path.join(root, "evidence.config.ts"),
    { layer: "screenplay", pass: "naturalness" },
  );
}

/** Compares a stored decision after filesystem mutation without evaluating files again. */
function unchanged(
  config: IEvidenceConfig,
  before: IProductionPassValidation,
  label: string,
  errors: string[],
): void {
  try {
    const repeated: IProductionPassValidation =
      classifyProductionPassDiagnostics(
        config,
        { layer: "screenplay", pass: "naturalness" },
        before.analysis,
      );
    assert.deepEqual(repeated.scope, before.scope);
    assert.deepEqual(
      repeated.pendingNaturalnessTransfers,
      before.pendingNaturalnessTransfers,
    );
    assert.equal(repeated.approvalStructureReady, true);
  } catch (error: unknown) {
    errors.push(`${label}: ${String(error)}`);
  }
}
