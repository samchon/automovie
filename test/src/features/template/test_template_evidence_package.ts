import {
  createEngineeringClaims,
  createEvidenceConfig,
} from "@automovie/evidence";
import { scaffoldAssetDirectory } from "@automovie/template";
import {
  EvidenceChecker,
  type IEvidenceCheckAnalysis,
  type IEvidenceConfig,
  createEvidenceConfigPlan,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * The package's one-object factory keeps coding ordinary and narrative explicit.
 *
 * Scenarios:
 * 1. Actual default source/test claims reject missing answers and accept complete answers beside unfinished narrative.
 * 2. A reviewed short evaluates its native graph through the public configuration.
 * 3. An additional ordinary native claim exposes its missing answer.
 * 4. Default claim objects remain independent across calls.
 * 5. An omitted outline stage follows activated settings and rejects an unanswered outline principle.
 * 6. The actual shipped starter passes its unchanged default engineering graph.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates the public configuration's real source/test and narrative claims through native Evidence, preserving engineering selection, additional claim coverage and outline stage inheritance; also checks the shipped scaffold's actual source and tests under those same default claims, rejecting annotations on unsupported hosts.
 * @evidence contracts/testing.md#independent-expectations Four explicitly authored engineering answers satisfy the shipped two-question source/test checklists; an unrelated unfinished story creates no engineering obligation. The starter must meet its own exported type/function defaults without annotations on private helpers or a numeric constant. Established one-scene fixtures supply reviewed content; removing the outline principle answer must fail when its omitted stage inherits active settings, just as an added unanswered work question must block a ready short pass.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts missing and complete engineering answers, coding and explicit narrative, additional native requirements, inherited outline stages, relative location rejection and independent default objects. The actual shipped starter covers private callbacks and an exported numeric constant beside selected public functions without widening the selectors.
 * @evidence contracts/testing.md#execution-ownership Runs in-process through workspace source exports, reads the shipped scaffold without modifying it and owns temporary authored data beneath the existing monorepo cache so normal ancestor dependency resolution finds already linked compiler packages. It installs no consumer, starts no process/browser/GPU, and removes its owned fixtures in finally.
 */
export async function test_template_evidence_package(): Promise<void> {
  const scaffold: string = scaffoldAssetDirectory();
  const starter: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
    createEvidenceConfigPlan(
      createEvidenceConfig({ location: scaffold }),
      path.join(scaffold, "evidence.config.ts"),
    ),
  );
  assert.equal(
    starter.report.success,
    true,
    JSON.stringify(starter.report.diagnostics),
  );

  const cache: string = path.resolve(
    __dirname,
    "../../../../packages/template/.cache",
  );
  fs.mkdirSync(cache, { recursive: true });
  const root: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(cache, "evidence-package-")),
  );
  try {
    const coding: string = path.join(root, "coding");
    const narrative: string = path.join(root, "narrative");
    const long: string = path.join(root, "long");
    for (const location of [coding, narrative, long]) {
      fs.mkdirSync(location);
      for (const file of ["common.md", "testing.md"])
        ProductionWorkflowFixture.write(
          location,
          `.agents/skills/contracts/${file}`,
          fs.readFileSync(
            path.resolve(
              __dirname,
              "../../../../packages/template/scaffold/.agents/skills/contracts",
              file,
            ),
            "utf8",
          ),
        );
    }
    ProductionWorkflowFixture.write(
      coding,
      "src/add.ts",
      "export function add(a: number, b: number): number { return a + b; }\n",
    );
    ProductionWorkflowFixture.write(
      coding,
      "test/test_add.ts",
      "export function test_add(): void {}\n",
    );
    ProductionWorkflowFixture.write(
      coding,
      "docs/body/screenplay/unfinished.md",
      "The story is unfinished.\n",
    );
    const config: IEvidenceConfig = createEvidenceConfig({ location: coding });
    const configFile: string = path.join(coding, "evidence.config.ts");
    const missing: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(config, configFile),
    );
    assert.equal(missing.report.success, false);
    ProductionWorkflowFixture.write(
      coding,
      "src/add.ts",
      [
        "/** Adds caller-supplied numbers without retained state.",
        " * @evidence contracts/common.md#implementation-and-ownership Numeric addition has no resource lifetime or consumer-specific compensation; callers own finite-range requirements.",
        " * @evidence contracts/common.md#authoring-interface Accepts two numbers and returns their numeric sum with no hidden controls.",
        " */",
        "export function add(a: number, b: number): number { return a + b; }",
      ].join("\n"),
    );
    ProductionWorkflowFixture.write(
      coding,
      "test/test_add.ts",
      [
        "import { add } from '../src/add';",
        "",
        "/** Pins the sum of two small integers through the actual source function.",
        " * @evidence contracts/testing.md#observable-behavior Calls add and rejects a result other than three; this arithmetic unit case requires no host.",
        " * @evidence contracts/testing.md#independent-cases Elementary arithmetic supplies three independently; this case owns two positive integer inputs and leaves numeric limits to other checks.",
        " */",
        "export function test_add(): void { if (add(1, 2) !== 3) throw new Error('sum'); }",
      ].join("\n"),
    );
    const answered: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(config, configFile),
    );
    assert.equal(
      answered.report.success,
      true,
      JSON.stringify(answered.report.diagnostics),
    );
    config.claims[0].files.push("do-not-share.ts");
    assert.ok(!createEngineeringClaims()[0].files.includes("do-not-share.ts"));
    assert.ok(
      !createEvidenceConfig({ location: coding }).claims[0].files.includes(
        "do-not-share.ts",
      ),
    );
    assert.throws(
      (): IEvidenceConfig => createEvidenceConfig({ location: "." }),
      /absolute/i,
    );

    ProductionWorkflowFixture.complete(narrative, "short");
    const selected: IEvidenceConfig = createEvidenceConfig({
      location: narrative,
      narrative: {
        mode: "short",
        construction: { screenplay: "evidence" },
        naturalness: { screenplay: "evidence" },
      },
    });
    await ProductionWorkflowFixture.certify(narrative, selected);
    const ready: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(narrative, selected.claims);
    assert.equal(
      ready.report.success,
      true,
      JSON.stringify(ready.report.diagnostics),
    );
    ProductionWorkflowFixture.write(
      narrative,
      ".agents/skills/contracts/story/work/extra/cues.md",
      "# Additional work\n\n## Fixed cue {#fixed-cue}\n\nEstablish the commissioned cue.\n",
    );
    const extended: IEvidenceConfig = createEvidenceConfig({
      location: narrative,
      narrative: {
        mode: "short",
        construction: { screenplay: "evidence" },
        claims: [
          {
            name: "commissioned cue",
            type: "markdown",
            root: "docs/body",
            files: ["screenplay/001-part/001-scene.md"],
            symbol: "h2",
            reference: {
              type: "markdown",
              root: ".agents/skills/contracts/story/work/extra",
              files: ["cues.md"],
              symbol: "h2",
              checklist: true,
            },
          },
        ],
      },
    });
    const blocked: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(narrative, extended.claims);
    assert.equal(blocked.report.success, false);
    assert.ok(
      blocked.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-checklist-missing",
      ),
    );

    // Settings activation must activate an omitted outline through the public facade.
    ProductionWorkflowFixture.complete(long, "long");
    ProductionWorkflowFixture.write(
      long,
      ".agents/skills/contracts/story/work/discovery/results.md",
      "<!--\n@evidenceExclude shared/discovery/common.md#scope The settings fixture needs no additional common rule.\n@evidenceExclude shared/discovery/settings.md#scope The settings fixture needs no additional canon rule.\n-->\n# Discovery\n\nOnly settings is submitted.\n",
    );
    const settings: IEvidenceConfig = createEvidenceConfig({
      location: long,
      narrative: { mode: "long", construction: { settings: "evidence" } },
    });
    await ProductionWorkflowFixture.certify(long, settings);
    const settingsFile: string = path.join(long, "evidence.config.ts");
    const complete: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(settings, settingsFile),
    );
    assert.equal(
      complete.report.success,
      true,
      JSON.stringify(complete.report.diagnostics),
    );
    ProductionWorkflowFixture.write(
      long,
      "docs/evidence/construction/units/settings/outline/index.md",
      "# docs/body/settings/outline/index.md#canon\n\nThe required principle answer is missing.\n",
    );
    const unanswered: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(settings, settingsFile),
    );
    assert.equal(unanswered.report.success, false);
    assert.ok(
      unanswered.report.diagnostics.some(
        (
          diagnostic: IEvidenceCheckAnalysis["report"]["diagnostics"][number],
        ): boolean =>
          diagnostic.code === "graph-checklist-missing" &&
          diagnostic.claim ===
            settings.claims.findIndex(
              (claim: IEvidenceConfig["claims"][number]): boolean =>
                claim.name ===
                "settings outline parts answer their own principle checklist",
            ),
      ),
      JSON.stringify(unanswered.report.diagnostics),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
