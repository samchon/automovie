import { createEvidenceConfig } from "@automovie/evidence";
import { createEngineeringClaims } from "@automovie/evidence/internal";
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
 * 1. Actual default source/test claims reject missing answers and accept complete answers beside unfinished narrative; a type answering implementation items instead of design fails.
 * 2. A reviewed short evaluates its native graph through the public configuration.
 * 3. An additional ordinary native claim exposes its missing answer.
 * 4. Default claim objects remain independent across calls.
 * 5. An omitted outline stage follows activated settings and rejects an unanswered outline principle.
 * 6. Enabled research and behavior stages require each study's detached answers and each law's answers, and a law must cite its study.
 * 7. An enabled composition stage requires every screenplay beat realized: a scene citing one of two beats fails, and citing their scene covers both.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public configuration's real source/test and narrative claims through native Evidence, preserving engineering selection, additional claim coverage and outline stage inheritance.
 * @evidence contracts/development/testing.md#independent-expectations Explicitly authored answers satisfy the shipped common, design, implementation and testing checklists for one interface, one function and one test; an unrelated unfinished story creates no engineering obligation. Established one-scene fixtures supply reviewed content; removing the outline principle answer must fail when its omitted stage inherits active settings, just as an added unanswered work question must block a ready short pass.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts missing and complete engineering answers, a type answering the design checklist against one answering the implementation checklist, coding and explicit narrative, additional native requirements, inherited outline stages, relative location rejection, independent default objects, a law's answers with and without its study citation, and a scene citing one beat against one citing the whole scene.
 * @evidence contracts/development/testing.md#execution-ownership Runs in-process through workspace source exports with temporary files beneath the existing monorepo cache so normal ancestor dependency resolution finds already linked compiler packages. It installs no consumer, starts no process/browser/GPU, and removes its owned fixtures in finally.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
 */
export async function test_evidence_package(): Promise<void> {
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
    const production: string = path.join(root, "production");
    for (const location of [coding, narrative, long, production]) {
      fs.mkdirSync(location);
      for (const [file, owner] of [
        ["development/common.md", "../../../../.agents/skills/contracts"],
        ["development/design.md", "../../../../.agents/skills/contracts"],
        ["development/testing.md", "../../../../.agents/skills/contracts"],
        [
          "development/implementation.md",
          "../../../../.agents/skills/contracts",
        ],
      ] as const)
        ProductionWorkflowFixture.write(
          location,
          `.agents/skills/contracts/${file}`,
          fs.readFileSync(path.resolve(__dirname, owner, file), "utf8"),
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
      "src/IPoint.ts",
      "export interface IPoint { x: number; }\n",
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
        " * @evidence contracts/development/implementation.md#principled-implementation The language's numeric addition returns the sum; callers own finite-range requirements.",
        " * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression with no state or option.",
        " * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No input or caller is special-cased.",
        " * @evidence contracts/development/implementation.md#efficient-algorithms One addition costs constant time.",
        " * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call computes from its two numbers alone.",
        " * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is allocated or retained.",
        " * @evidence contracts/development/common.md#meaningful-documentation The comment states that the inputs come from the caller and nothing is retained.",
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
        " * @evidence contracts/development/common.md#meaningful-documentation The comment names the one scenario, the sum of two small integers.",
        " * @evidence contracts/development/testing.md#behavioral-verification Calls add and rejects a result other than three.",
        " * @evidence contracts/development/testing.md#independent-expectations Elementary arithmetic supplies three independently of the implementation.",
        " * @evidence contracts/development/testing.md#distinguishing-cases This case owns two positive integers and leaves numeric limits to other checks.",
        " * @evidence contracts/development/testing.md#execution-ownership A pure unit case with in-memory numbers; it starts no host.",
        " */",
        "export function test_add(): void { if (add(1, 2) !== 3) throw new Error('sum'); }",
      ].join("\n"),
    );
    const point = (contract: string, anchors: string[]): string =>
      [
        "/** A point on the horizontal axis.",
        " * @evidence contracts/development/common.md#meaningful-documentation The comment names the axis and the member's unit.",
        ...anchors.map(
          (anchor: string): string =>
            ` * @evidence contracts/development/${contract}.md#${anchor} The interface holds one coordinate.`,
        ),
        " */",
        "export interface IPoint {",
        "  /** Horizontal coordinate in meters. */",
        "  x: number;",
        "}",
      ].join("\n");
    ProductionWorkflowFixture.write(
      coding,
      "src/IPoint.ts",
      point("design", [
        "principled-representation",
        "minimal-and-owned-surface",
        "prohibited-design-shortcuts",
      ]),
    );
    const answered: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(config, configFile),
    );
    assert.equal(
      answered.report.success,
      true,
      JSON.stringify(answered.report.diagnostics),
    );
    ProductionWorkflowFixture.write(
      coding,
      "src/IPoint.ts",
      point("implementation", [
        "principled-implementation",
        "clear-and-simple-structure",
        "prohibited-implementation-shortcuts",
      ]),
    );
    const misfiled: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(config, configFile),
    );
    assert.equal(misfiled.report.success, false);
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
        construction: { brief: "evidence", screenplay: "evidence" },
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
      "docs/contracts/work/extra/cues.md",
      "# Additional work\n\n## Fixed cue {#fixed-cue}\n\nEstablish the commissioned cue.\n",
    );
    const extended: IEvidenceConfig = createEvidenceConfig({
      location: narrative,
      narrative: {
        mode: "short",
        construction: { brief: "evidence", screenplay: "evidence" },
        claims: [
          {
            name: "commissioned cue",
            type: "markdown",
            root: "docs/body",
            files: ["screenplay/001-part/001-scene.md"],
            symbol: "h2",
            reference: {
              type: "markdown",
              root: "docs/contracts/work/extra",
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
      "docs/contracts/work/discovery/results.md",
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

    // A study answers the story research principles; a law answers the
    // behaviors contract and must cite the study it follows.
    for (const file of [
      "development/behaviors.md",
      "development/composition.md",
      "story/shared/principles/research.md",
    ])
      ProductionWorkflowFixture.write(
        production,
        `.agents/skills/contracts/${file}`,
        fs.readFileSync(
          path.resolve(
            __dirname,
            "../../../../packages/template/scaffold/instructions/.agents/skills/contracts",
            file,
          ),
          "utf8",
        ),
      );
    ProductionWorkflowFixture.write(
      production,
      "docs/research/index.md",
      "# Research\n\n- [Lead step](footwork/lead-step.md)\n",
    );
    ProductionWorkflowFixture.write(
      production,
      "docs/research/footwork/lead-step.md",
      "# Lead step\n\nA lead step covers half a stance length before the rear foot follows.\n",
    );
    ProductionWorkflowFixture.write(
      production,
      "docs/evidence/construction/files/research/footwork/lead-step.md",
      [
        "# docs/research/footwork/lead-step.md",
        "",
        "## @evidence shared/principles/research.md#depicted-practice",
        "",
        "The study gives the lead step's length and the rear foot's follow.",
        "",
        "## @evidence shared/principles/research.md#traceable-sources",
        "",
        "The step length is a direct observation of a retained clip.",
        "",
      ].join("\n"),
    );
    const implementation: string[] = [
      " * @evidence contracts/development/implementation.md#principled-implementation The method follows its cited source.",
      " * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression with no state.",
      " * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is tuned or special-cased.",
      " * @evidence contracts/development/implementation.md#efficient-algorithms One operation costs constant time.",
      " * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call computes from its arguments alone.",
      " * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is allocated or retained.",
    ];
    const step = (citation: string[]): string =>
      [
        "/** Lead step length for a stance width, in meters.",
        " * @evidence contracts/development/common.md#meaningful-documentation The comment names the quantity and its unit.",
        ...implementation,
        " * @evidence contracts/development/behaviors.md#studied-laws The half-stance step is the study's observed value.",
        " * @evidence contracts/development/behaviors.md#relational-goals The length is relative to the performer's own stance.",
        " * @evidence contracts/development/behaviors.md#deterministic-evaluation The result depends only on its argument.",
        ...citation,
        " */",
        "export function stepLength(stance: number): number { return stance / 2; }",
      ].join("\n");
    ProductionWorkflowFixture.write(
      production,
      "src/laws/footwork/stepLength.ts",
      step([]),
    );
    const staged: IEvidenceConfig = createEvidenceConfig({
      location: production,
      research: "evidence",
      development: { behaviors: "evidence" },
    });
    const stagedFile: string = path.join(production, "evidence.config.ts");
    const uncited: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(staged, stagedFile),
    );
    assert.equal(uncited.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/laws/footwork/stepLength.ts",
      step([
        " * @evidence docs/research/footwork/lead-step.md The lead step covers half a stance length.",
      ]),
    );
    const cited: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(staged, stagedFile),
    );
    assert.equal(
      cited.report.success,
      true,
      JSON.stringify(cited.report.diagnostics),
    );

    // A scene must realize every screenplay scene and beat, citing a beat or
    // its whole scene; a film must deliver its screenplay file.
    ProductionWorkflowFixture.write(
      production,
      "docs/body/screenplay/bout.md",
      "# Bout\n\n## Ring {#s01}\n\n### Feint {#s01-b01}\n\nA feints.\n\n### Kick {#s01-b02}\n\nA kicks.\n",
    );
    const compose = (name: string, citation: string): string =>
      [
        `/** Composes ${name}.`,
        " * @evidence contracts/development/common.md#meaningful-documentation The comment names what is composed.",
        ...implementation,
        " * @evidence contracts/development/composition.md#screenplay-realization The cited decisions are composed.",
        " * @evidence contracts/development/composition.md#composition-only Only capabilities are combined.",
        " * @evidence contracts/development/composition.md#living-scene Every presence keeps its role behavior.",
        citation,
        " */",
        `export function ${name}(): string { return "${name}"; }`,
      ].join("\n");
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      compose(
        "bout",
        " * @evidence docs/body/screenplay/bout.md The film delivers the bout.",
      ),
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/bout/ring/ring.ts",
      compose(
        "ring",
        " * @evidence docs/body/screenplay/bout.md#s01-b01 The scene realizes the feint.",
      ),
    );
    const composed: IEvidenceConfig = createEvidenceConfig({
      location: production,
      research: "evidence",
      development: { behaviors: "evidence", composition: "evidence" },
    });
    const partial: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(composed, stagedFile),
    );
    assert.equal(partial.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/bout/ring/ring.ts",
      compose(
        "ring",
        " * @evidence docs/body/screenplay/bout.md#s01 The scene realizes both beats.",
      ),
    );
    const whole: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(composed, stagedFile),
    );
    assert.equal(
      whole.report.success,
      true,
      JSON.stringify(whole.report.diagnostics),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
