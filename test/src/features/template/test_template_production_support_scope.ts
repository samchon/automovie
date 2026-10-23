import {
  type IProductionConfigProps,
  analyzeProductionPass,
  createProductionConfig,
} from "@automovie/evidence/narrative";
import {
  type IEvidenceCheckAnalysis,
  type IEvidenceClaim,
  type IEvidenceConfig,
  type IEvidenceConfigPlan,
  createEvidenceConfigPlan,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Support duties cannot smuggle narrative parents around route ownership.
 *
 * Scenarios:
 * 1. A standalone engineering document and common checklist evaluate normally.
 * 2. Selecting settings or adopted instructions as support inputs is refused.
 * 3. Broad selectors, directory links and their physical targets preserve ownership.
 * 4. A hard link outside protected paths retains its active authored source identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates a real support claim and then calls factory and pass analysis with authored host, authored reference, adopted instruction, broad selector, directory-link and hard-link variants, asserting explicit refusal instead of bypassing route ownership. The hard-link declaration is admitted before captured native source identity rejects it.
 * @evidence contracts/testing.md#independent-expectations Support is independent engineering coverage and cannot own narrative documents or adopted user instructions; explicitly authored settings and instruction paths supply forbidden dependencies. The ordinary support case proves that the boundary does not disable valid non-narrative evidence.
 * @evidence contracts/testing.md#distinguishing-cases A valid engineering scope is contrasted with direct host, direct reference, adopted instruction, broad-glob and linked authoring access. An external path is allowed before linking it into authored content, then its direct physical host and reference are refused. A hard link remains outside every protected path yet shares an active authored source identity. Full narrative pass closure, stale review and global support diagnostics are covered separately.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_support_scope entry owns both temporary roots and its directory link, verifies the link's kind and owned target before unlinking it, and then removes both roots in finally. All factory and native checker cases run in-process without a host process, browser, GPU or installation.
 */
export async function test_template_production_support_scope(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  const external: string = ProductionWorkflowFixture.create();
  const link: string = path.join(root, "docs/body/linked");
  let linked: boolean = false;
  try {
    ProductionWorkflowFixture.populate(root);
    ProductionWorkflowFixture.write(
      root,
      "checks/source.md",
      "# Source\n\n## State\n<!--\n@evidence common.md#scope Implements the selected task.\n-->\nThe task is complete.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/common.md",
      "# Common\n\n## Scope {#scope}\n\nImplement the requested task.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/instructions/001-brief.md",
      "# Brief\n\n## Scope {#scope}\n\nKeep the user's chosen ending.\n",
    );
    const support: IEvidenceClaim = {
      name: "engineering",
      type: "markdown",
      files: ["checks/source.md"],
      symbol: "h2",
      reference: {
        type: "markdown",
        root: ".agents/skills/contracts",
        files: ["common.md"],
        symbol: "h2",
        checklist: true,
      },
    };
    const asset: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      "asset",
    );
    asset.supportClaims = [support];
    const config: IEvidenceConfig = createProductionConfig(asset);
    const valid: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(
      valid.report.success,
      true,
      JSON.stringify(valid.report.diagnostics),
    );

    const variants: IEvidenceClaim[] = [
      { ...support, files: ["docs/body/settings/*.md"] },
      {
        ...support,
        reference: {
          type: "markdown",
          files: ["docs/body/settings/*.md"],
          symbol: "h2",
        },
      },
      {
        ...support,
        reference: {
          type: "markdown",
          files: ["docs/instructions/*.md"],
          symbol: "h2",
        },
      },
      { ...support, files: ["docs/**/*.md"] },
    ];
    for (const claim of variants) {
      const props: IProductionConfigProps = ProductionWorkflowFixture.props(
        root,
        "short",
      );
      props.construction.screenplay = "evidence";
      props.supportClaims = [claim];
      await assert.rejects(
        async (): Promise<unknown> =>
          analyzeProductionPass(
            createProductionConfig(props),
            path.join(root, "evidence.config.ts"),
            { layer: "screenplay", pass: "construction" },
          ),
        /support|authored|narrative|scope/i,
      );
    }

    ProductionWorkflowFixture.write(
      external,
      "source.md",
      "# Source\n\n## State\n\nA linked authoring source.\n",
    );
    const unlinked: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      "asset",
    );
    unlinked.supportClaims = [
      { ...support, root: external, files: ["source.md"] },
    ];
    assert.doesNotThrow(
      (): IEvidenceConfigPlan =>
        createEvidenceConfigPlan(
          createProductionConfig(unlinked),
          path.join(root, "evidence.config.ts"),
        ),
    );
    fs.symlinkSync(
      external,
      link,
      process.platform === "win32" ? "junction" : "dir",
    );
    linked = true;
    const aliases: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      "short",
    );
    aliases.construction.screenplay = "evidence";
    aliases.supportClaims = [{ ...support, files: ["docs/body/linked/*.md"] }];
    await assert.rejects(
      async (): Promise<unknown> =>
        analyzeProductionPass(
          createProductionConfig(aliases),
          path.join(root, "evidence.config.ts"),
          { layer: "screenplay", pass: "construction" },
        ),
      /support|authored|narrative|scope/i,
    );
    const physical: IEvidenceClaim[] = [
      { ...support, root: external, files: ["source.md"] },
      {
        ...support,
        reference: {
          type: "markdown",
          root: external,
          files: ["source.md"],
          symbol: "h2",
        },
      },
    ];
    for (const claim of physical) {
      const props: IProductionConfigProps = ProductionWorkflowFixture.props(
        root,
        "short",
      );
      props.construction.screenplay = "evidence";
      props.supportClaims = [claim];
      await assert.rejects(
        async (): Promise<unknown> =>
          analyzeProductionPass(
            createProductionConfig(props),
            path.join(root, "evidence.config.ts"),
            { layer: "screenplay", pass: "construction" },
          ),
        /support|authored|narrative|scope/i,
      );
    }

    // Remove the directory alias so only the hard link's identity can expose it.
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.equal(
      fs.realpathSync.native(link),
      fs.realpathSync.native(external),
    );
    fs.unlinkSync(link);
    linked = false;
    const hardLink: string = path.join(external, "hard-linked-source.md");
    fs.linkSync(path.join(root, "docs/body/settings/001-event.md"), hardLink);
    const hard: IProductionConfigProps = ProductionWorkflowFixture.props(root);
    hard.construction.settings = "evidence";
    hard.supportClaims = [
      { ...support, root: external, files: [path.basename(hardLink)] },
    ];
    const hardConfig: IEvidenceConfig = createProductionConfig(hard);
    await assert.rejects(
      analyzeProductionPass(hardConfig, path.join(root, "evidence.config.ts"), {
        layer: "settings",
        pass: "construction",
      }),
      /support.*inventory.*authored/i,
    );
  } finally {
    if (linked) {
      assert.ok(fs.lstatSync(link).isSymbolicLink());
      assert.equal(
        fs.realpathSync.native(link),
        fs.realpathSync.native(external),
      );
      fs.unlinkSync(link);
    }
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(external, { recursive: true, force: true });
  }
}
