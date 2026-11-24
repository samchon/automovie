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
import { repositoryRoot } from "../internal/repositoryRoot";

/**
 * The package's one-object factory keeps coding ordinary and narrative
 * explicit.
 *
 * Scenarios:
 *
 * 1. Actual default source/test claims reject missing answers and accept complete
 *    answers beside unfinished narrative; a type answering implementation items
 *    instead of design fails.
 * 2. A reviewed short evaluates its native graph through the public configuration.
 * 3. An additional ordinary native claim exposes its missing answer.
 * 4. Default claim objects remain independent across calls.
 * 5. An omitted outline stage follows activated settings and rejects an unanswered
 *    outline principle.
 * 6. Settings closed and returned to disabled while treatments runs keeps its
 *    discovery claim active, so its recorded findings in the shared discovery
 *    record still resolve and the graph passes.
 * 7. Enabled research and behavior stages require each study's detached answers
 *    and each law's answers: a law missing one behaviors answer fails, and the
 *    complete law passes with its study named in prose and no study tag.
 * 8. An enabled composition stage over a film folder of scene files requires every
 *    section and beat realized and every scene file ordered: a scene citing one
 *    of two beats fails, citing its whole scene file covers both, a film
 *    ordering one of two scene files fails until it orders both, and a film
 *    answering the composition checklist instead of the films checklist fails.
 * 9. Narrative mode none adds no instruction relation without instructions or
 *    without composition, and otherwise requires every instruction section
 *    realized: one realized section of two fails, excluding the other fails,
 *    and a film realizing it passes.
 * 10. Film composition reports all three missing catalog inputs together. A catalog
 *     case cannot supply a beat missing from the production scene.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public configuration's real source/test and narrative claims through native Evidence, preserving engineering selection, additional claim coverage, outline stage inheritance, discovery after a closed layer turns disabled and the scene-file composition relations.
 * @evidence contracts/development/testing.md#independent-expectations Explicitly authored answers satisfy the shipped common, design, implementation and testing checklists for one interface, one function and one test; an unrelated unfinished story creates no engineering obligation. Established one-scene fixtures supply reviewed content; removing the outline principle answer must fail when its omitted stage inherits active settings, just as an added unanswered work question must block a ready short pass. The route contract supplies the closed-layer expectation: a layer the user disabled after it closed must not break the layers still running, so its findings in the shared discovery record must still resolve. The layout contract supplies the composition expectations: each scene file maps to one scene composition and the film orders every scene file of its folder.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts missing and complete engineering answers, a type answering the design checklist against one answering the implementation checklist, coding and explicit narrative, additional native requirements, inherited outline stages, a closed disabled settings layer against a running treatments layer, relative location rejection, independent default objects, a law missing one behaviors answer against the complete law that names its study in prose, a scene citing one beat against one citing its whole scene file, a film ordering one scene file against both, and mode none without instructions or composition against with both, then one instruction section realized, the other excluded, and both realized.
 * @evidence contracts/development/testing.md#execution-ownership Runs in-process through workspace source exports with temporary files beneath the existing monorepo cache so normal ancestor dependency resolution finds already linked compiler packages. It installs no consumer, starts no process/browser/GPU, and removes its owned fixtures in finally.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
 */
export async function test_evidence_package(): Promise<void> {
  const repository: string = repositoryRoot();
  const cache: string = path.join(repository, "packages/template/.cache");
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
        ["development/common.md", ".agents/skills/contracts"],
        ["development/design.md", ".agents/skills/contracts"],
        ["development/testing.md", ".agents/skills/contracts"],
        ["development/implementation.md", ".agents/skills/contracts"],
      ] as const)
        ProductionWorkflowFixture.write(
          location,
          `.agents/skills/contracts/${file}`,
          fs.readFileSync(path.join(repository, owner, file), "utf8"),
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
      "docs/body/screenplay/unfinished/001-draft.md",
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
            files: [`screenplay/${ProductionWorkflowFixture.scene("short")}`],
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
      "<!--\n@evidenceExclude discovery/common.md#scope The settings fixture needs no additional common rule.\n@evidenceExclude discovery/settings.md#scope The settings fixture needs no additional canon rule.\n-->\n# Discovery\n\nOnly settings is submitted.\n",
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

    // Settings closes and returns to disabled while treatments runs. The shared
    // discovery record still holds the settings findings, which must keep
    // resolving: the settings discovery claim stays active behind a later
    // running layer, while the settings body claims and its outline turn off.
    ProductionWorkflowFixture.write(
      long,
      "docs/evidence/construction/units/settings/outline/index.md",
      "# docs/body/settings/outline/index.md#canon\n\nThe settings pass has closed.\n",
    );
    ProductionWorkflowFixture.write(
      long,
      "docs/contracts/work/discovery/results.md",
      `<!--\n${["common", "narratives", "settings", "treatments"].map((group: string): string => `@evidenceExclude discovery/${group}.md#scope The fixture needs no additional ${group} rule.`).join("\n")}\n-->\n# Discovery\n\nSettings closed; treatments is submitted.\n`,
    );
    const handed: IEvidenceConfig = createEvidenceConfig({
      location: long,
      narrative: {
        mode: "long",
        construction: {
          index: "disabled",
          settings: "disabled",
          treatments: "evidence",
        },
      },
    });
    const active = (name: string): boolean =>
      handed.claims.some(
        (claim: IEvidenceConfig["claims"][number]): boolean =>
          claim.name === name && claim.disabled !== true,
      );
    assert.ok(
      active(
        "the settings work-specific contract accounts for its open-world discovery duties",
      ),
    );
    assert.ok(
      !active("settings H2 units answer their principle checklists") &&
        !active(
          "the scripts work-specific contract accounts for its open-world discovery duties",
        ),
    );
    await ProductionWorkflowFixture.certify(long, handed);
    const running: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(handed, settingsFile),
    );
    assert.equal(
      running.report.success,
      true,
      JSON.stringify(running.report.diagnostics),
    );

    // The study answers the research principles. The law cites its study
    // inside the behaviors checklist answer.
    for (const file of [
      "development/behaviors.md",
      "development/composition.md",
      "development/films.md",
      "story/principles/research.md",
    ])
      ProductionWorkflowFixture.write(
        production,
        `.agents/skills/contracts/${file}`,
        fs.readFileSync(
          path.join(
            repository,
            "packages/template/scaffold/instructions/.agents/skills/contracts",
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
        "## @evidence principles/research.md#depicted-practice",
        "",
        "The study gives the lead step's length and the rear foot's follow.",
        "",
        "## @evidence principles/research.md#traceable-sources",
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
    const step = (relational: string[]): string =>
      [
        "/** Lead step length for a stance width, in meters.",
        " * @evidence contracts/development/common.md#meaningful-documentation The comment names the quantity and its unit.",
        ...implementation,
        " * @evidence contracts/development/behaviors.md#studied-laws The half-stance step is the value docs/research/footwork/lead-step.md records.",
        " * @evidence contracts/development/behaviors.md#realization-comments The comment ties the half-stance step to docs/research/footwork/lead-step.md and says it takes half the stance width from it.",
        ...relational,
        " * @evidence contracts/development/behaviors.md#deterministic-evaluation The result depends only on its argument.",
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
    const incomplete: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(staged, stagedFile),
    );
    assert.equal(incomplete.report.success, false);

    // The complete law names its study in prose and carries no study tag.
    ProductionWorkflowFixture.write(
      production,
      "src/laws/footwork/stepLength.ts",
      step([
        " * @evidence contracts/development/behaviors.md#relational-goals The length is relative to the performer's own stance.",
      ]),
    );
    const studied: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(staged, stagedFile),
    );
    assert.equal(
      studied.report.success,
      true,
      JSON.stringify(studied.report.diagnostics),
    );

    // The film folder holds one file per scene. A scene composition must
    // realize every section and beat of its scene file, citing a beat or the
    // whole file; the film must order every scene file of its folder.
    ProductionWorkflowFixture.write(
      production,
      "docs/body/screenplay/bout/001-ring.md",
      "# Ring\n\n## Opening {#s01}\n\n### Feint {#s01-b01}\n\nA feints.\n\n### Kick {#s01-b02}\n\nA kicks.\n",
    );
    ProductionWorkflowFixture.write(
      production,
      "docs/body/screenplay/bout/002-count.md",
      "# Count\n\n## Count {#s01}\n\n### Ten {#s01-b01}\n\nThe referee counts ten.\n",
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/bout/002-count/count.ts",
      [
        "/** Composes count.",
        ...implementation,
        " * @evidence contracts/development/composition.md#screenplay-realization The cited decisions are composed.",
        " * @evidence contracts/development/composition.md#composition-only Only capabilities are combined.",
        " * @evidence contracts/development/composition.md#living-scene Every presence keeps its role behavior.",
        " * @evidence contracts/development/composition.md#realization-comments The comment ties each composed value to the screenplay beat it realizes.",
        " * @evidence docs/body/screenplay/bout/002-count.md The scene realizes the count.",
        " */",
        'export function count(): string { return "count"; }',
      ].join("\n"),
    );
    const compose = (name: string, citation: string): string =>
      [
        `/** Composes ${name}.`,
        ...implementation,
        " * @evidence contracts/development/composition.md#screenplay-realization The cited decisions are composed.",
        " * @evidence contracts/development/composition.md#composition-only Only capabilities are combined.",
        " * @evidence contracts/development/composition.md#living-scene Every presence keeps its role behavior.",
        " * @evidence contracts/development/composition.md#realization-comments The comment ties each composed value to the screenplay beat it realizes.",
        citation,
        " */",
        `export function ${name}(): string { return "${name}"; }`,
      ].join("\n");
    // A screenplay film answers the films checklist, not composition.
    const play: (citation: string) => string = (citation: string): string =>
      [
        "/** Plays the bout.",
        ...implementation,
        " * @evidence contracts/development/films.md#scene-order The film plays its cited scene files in screenplay order.",
        " * @evidence contracts/development/films.md#delivery-profile The film takes the profile's raster, frame rate and running time.",
        " * @evidenceExclude contracts/development/films.md#camera-response The film is a motion hint without optics.",
        " * @evidenceExclude contracts/development/films.md#sound-list The film declares no sound list.",
        " * @evidence contracts/development/films.md#realization-comments The comment ties each value to the screenplay or profile entry it takes.",
        " * @evidence contracts/development/films.md#composition-only The film only orders its scenes.",
        citation,
        " */",
        'export function bout(): string { return "bout"; }',
      ].join("\n");
    const film: string[] = [
      " * @evidence docs/body/screenplay/bout/001-ring.md The film opens on the ring.",
      " * @evidence docs/body/screenplay/bout/002-count.md The film ends on the count.",
    ];
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      play(film.join("\n")),
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/bout/001-ring/ring.ts",
      compose(
        "ring",
        " * @evidence docs/body/screenplay/bout/001-ring.md#s01-b01 The scene realizes the feint.",
      ),
    );
    assert.throws(
      (): IEvidenceConfig =>
        createEvidenceConfig({
          location: production,
          development: { composition: "evidence" },
        }),
      /Missing: src\/composition\/films\/catalog\.ts, docs\/acceptance\/catalog\.md, src\/composition\/scenes\/catalog/,
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/catalog.ts",
      compose("catalog", ""),
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/catalog/step/case.ts",
      compose("step", ""),
    );
    ProductionWorkflowFixture.write(
      production,
      "docs/acceptance/catalog.md",
      "# Reviewed cases\n\n## Step\n\nFoot support observed in the catalog.\n",
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
    // A showcase cannot supply the actual scene's missing beat.
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/catalog/step/case.ts",
      compose(
        "step",
        " * @evidence docs/body/screenplay/bout/001-ring.md#s01-b02 The catalog exhibits this action.",
      ),
    );
    const showcaseOnly: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(composed, stagedFile),
    );
    assert.equal(showcaseOnly.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/catalog/step/case.ts",
      compose("step", ""),
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/bout/001-ring/ring.ts",
      compose(
        "ring",
        " * @evidence docs/body/screenplay/bout/001-ring.md The scene realizes its whole scene file.",
      ),
    );
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      play(film[0]),
    );
    const unordered: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(composed, stagedFile),
    );
    assert.equal(unordered.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      compose("bout", film.join("\n")),
    );
    const sceneChecklist: IEvidenceCheckAnalysis =
      await EvidenceChecker.evaluate(
        createEvidenceConfigPlan(composed, stagedFile),
      );
    assert.equal(sceneChecklist.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      play(film.join("\n")),
    );
    const whole: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(composed, stagedFile),
    );
    assert.equal(
      whole.report.success,
      true,
      JSON.stringify(whole.report.diagnostics),
    );

    // Under narrative mode none, the code must realize every instruction
    // section without exclusion; the scene realizes one and the film the
    // other. Without instructions or without composition there is no relation.
    const relates = (config: IEvidenceConfig): boolean =>
      config.claims.some(
        (claim: IEvidenceConfig["claims"][number]): boolean =>
          claim.name === "the code realizes every instruction section",
      );
    const passless = (): IEvidenceConfig =>
      createEvidenceConfig({
        location: production,
        research: "evidence",
        narrative: { mode: "none" },
        development: { behaviors: "evidence", composition: "evidence" },
      });
    assert.equal(relates(passless()), false);
    ProductionWorkflowFixture.write(
      production,
      "docs/instructions/commission.md",
      "# Commission\n\n## One round {#one-round}\n\nOne round.\n\n## The finish {#finish}\n\nA kick ends it.\n",
    );
    assert.equal(
      relates(
        createEvidenceConfig({
          location: production,
          narrative: { mode: "none" },
        }),
      ),
      false,
    );
    const instructed: IEvidenceConfig = passless();
    ProductionWorkflowFixture.write(
      production,
      "src/composition/scenes/bout/001-ring/ring.ts",
      compose(
        "ring",
        [
          " * @evidence docs/body/screenplay/bout/001-ring.md The scene realizes its whole scene file.",
          " * @evidence docs/instructions/commission.md#finish The kick ends the round.",
        ].join("\n"),
      ),
    );
    const unrealized: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(instructed, stagedFile),
    );
    assert.equal(unrealized.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      play(
        [
          ...film,
          " * @evidenceExclude docs/instructions/commission.md#one-round The film skips the round limit.",
        ].join("\n"),
      ),
    );
    const excluded: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(instructed, stagedFile),
    );
    assert.equal(excluded.report.success, false);
    ProductionWorkflowFixture.write(
      production,
      "src/composition/films/bout.ts",
      play(
        [
          ...film,
          " * @evidence docs/instructions/commission.md#one-round The film runs one round.",
        ].join("\n"),
      ),
    );
    const realized: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(
      createEvidenceConfigPlan(instructed, stagedFile),
    );
    assert.equal(
      realized.report.success,
      true,
      JSON.stringify(realized.report.diagnostics),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
