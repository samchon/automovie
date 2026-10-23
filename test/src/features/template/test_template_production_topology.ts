import type {
  IEvidenceCheckAnalysis,
  IEvidenceConfig,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  type IProductionConfigProps,
  type IProductionPassValidation,
  analyzeProductionPass,
  classifyProductionPassDiagnostics,
  createProductionConfig,
  stripNaturalnessComments,
} from "../../../../packages/template/scaffold/workflow/index";
import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Revision lineage preserves authored identities rather than an arbitrary bijection.
 *
 * Scenarios:
 * 1. A complete short has structurally ready construction and expression passes.
 * 2. Renaming the promoted and working H1 cannot preserve frozen construction identity.
 * 3. Native source snapshots, required indexes, numbering, flat events, and parent identity are retained.
 * 4. Exact pilot selection and short entry ignore unrelated downstream or upstream drafts.
 * 5. Swapped file and unit citations cannot disguise an arbitrary lineage bijection.
 * 6. Distinct anchors permit the same visible title without inventing duplicate identities.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real factory and analyzeProductionPass on complete temporary Markdown graphs, distinguishing native coverage success from identity readiness after an H1 edit.
 * @evidence contracts/testing.md#independent-expectations The frozen construction's explicit title defines the revision identity; identical working and promoted replacement titles satisfy transfer but must not silently rename that identity.
 * @evidence contracts/testing.md#distinguishing-cases Tests unchanged, changed-title, missing and stale index, repeated visible titles with distinct anchors, invalid heading, numbering, flat event, exact pilot, unchanged captured snapshot, and swapped-citation cases. Both the title edit and swapped citation retain native graph success while readiness must fail for their actual identity defect.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_topology entry owns its temporary package and removes it in finally; it evaluates actual evidence APIs in-process without installation, network, subprocesses, browsers, or GPUs.
 */
export async function test_template_production_topology(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "short",
    );
    await ProductionWorkflowFixture.certify(root, props);
    const ready: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(ready.approvalStructureReady, true);
    for (const edition of ["body", "naturalness"]) {
      const filename: string = path.join(
        root,
        `docs/${edition}/screenplay/001-part/001-scene.md`,
      );
      fs.writeFileSync(
        filename,
        fs
          .readFileSync(filename, "utf8")
          .replace("# Arrival record", "# Replaced edition"),
        "utf8",
      );
    }
    const renamed: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(renamed.packageSuccess, true);
    assert.equal(renamed.approvalStructureReady, false);
    assert.ok(
      renamed.scope.issues.some((issue: string): boolean =>
        /identity/i.test(issue),
      ),
    );

    for (const edition of ["body", "naturalness"])
      replace(
        root,
        `docs/${edition}/screenplay/001-part/001-scene.md`,
        "# Replaced edition",
        "# Arrival record",
      );
    const config: IEvidenceConfig = createProductionConfig(props);
    const captured: IEvidenceCheckAnalysis = (
      await analyzeProductionPass(
        config,
        path.join(root, "evidence.config.ts"),
        { layer: "screenplay", pass: "naturalness" },
      )
    ).analysis;
    replace(
      root,
      "docs/body/screenplay/001-part/001-scene.md",
      "# Arrival record",
      "# Later mutation",
    );
    const immutable: IProductionPassValidation =
      classifyProductionPassDiagnostics(
        config,
        { layer: "screenplay", pass: "naturalness" },
        captured,
      );
    assert.equal(
      immutable.approvalStructureReady,
      true,
      JSON.stringify({
        issues: immutable.scope.issues,
        diagnostics: immutable.analysis.report.diagnostics,
      }),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  const cases: {
    name: string;
    mode: "long" | "short";
    expected: RegExp | null;
    nativeSuccess?: boolean;
    pass?: "construction" | "naturalness";
    change: (root: string, props: IProductionConfigProps) => void;
  }[] = [
    {
      name: "missing part index",
      mode: "long",
      expected: /requires its index/u,
      change: (root: string): void =>
        fs.rmSync(path.join(root, "docs/body/screenplay/001-part/index.md")),
    },
    {
      name: "one-scene short needs no navigation file",
      mode: "short",
      expected: null,
      change: (root: string): void =>
        fs.rmSync(path.join(root, "docs/body/screenplay/001-part/index.md")),
    },
    {
      name: "stale ordered index",
      mode: "short",
      expected: /ordered scene links/u,
      change: (root: string): void =>
        replace(
          root,
          "docs/body/screenplay/001-part/index.md",
          "001-scene.md",
          "002-absent.md",
        ),
    },
    {
      name: "gapped numbering",
      mode: "short",
      expected: /numbering.*001/u,
      change: (root: string): void =>
        fs.renameSync(
          path.join(root, "docs/body/screenplay/001-part/001-scene.md"),
          path.join(root, "docs/body/screenplay/001-part/002-scene.md"),
        ),
    },
    {
      name: "repeated visible titles retain distinct anchored identities",
      mode: "short",
      expected: null,
      change: (root: string): void => addRepeatedTitle(root),
    },
    {
      name: "unsupported heading",
      mode: "short",
      expected: /no deeper headings/u,
      change: (root: string): void =>
        replace(
          root,
          "docs/body/screenplay/001-part/001-scene.md",
          "The guest opens",
          "##### Hidden subdivision\n\nThe guest opens",
        ),
    },
    {
      name: "example headings remain inert",
      mode: "short",
      expected: null,
      pass: "construction",
      change: (root: string): void => addExamples(root, false),
    },
    {
      name: "real heading after rendered example",
      mode: "short",
      expected: /no deeper headings/u,
      pass: "construction",
      change: (root: string): void => addExamples(root, true),
    },
    {
      name: "flat treatment boundary",
      mode: "long",
      expected: /invalid narrative (?:path|directory)/u,
      change: (root: string): void =>
        ProductionWorkflowFixture.write(
          root,
          "docs/body/treatments/001-hidden/001-event.md",
          "# Hidden event\n\n## Event\n\nA misplaced event.\n",
        ),
    },
    {
      name: "empty scene part",
      mode: "short",
      expected: /requires its index/u,
      change: (root: string): void =>
        fs.mkdirSync(path.join(root, "docs/body/screenplay/002-empty")),
    },
    {
      name: "final parent H1 identity",
      mode: "long",
      expected: /scripts-to-screenplay: identity/u,
      nativeSuccess: true,
      change: (root: string): void => {
        for (const edition of ["body", "revision", "naturalness"])
          replace(
            root,
            `docs/${edition}/screenplay/001-part/001-scene.md`,
            "# Arrival record",
            "# Final rendition",
          );
        replace(
          root,
          "docs/body/screenplay/001-part/index.md",
          "Arrival record",
          "Final rendition",
        );
      },
    },
    {
      name: "short entry ignores imaginary parents",
      mode: "short",
      expected: null,
      change: (root: string): void =>
        ProductionWorkflowFixture.write(
          root,
          "docs/body/scripts/incorrect/deep/draft.md",
          "# An unselected script draft\n",
        ),
    },
    {
      name: "exact pilot ignores other parts",
      mode: "long",
      expected: null,
      change: (root: string, props: IProductionConfigProps): void => {
        props.narrativeScope = { mode: "first-part-pilot", part: "001-part" };
        for (const layer of ["scripts", "screenplay"])
          ProductionWorkflowFixture.write(
            root,
            `docs/body/${layer}/002-outside/invalid-draft.md`,
            "# An unselected later draft\n",
          );
      },
    },
    {
      name: "swapped native lineage edges",
      mode: "short",
      expected: /lineage citation.*exact/u,
      nativeSuccess: true,
      change: (root: string): void => {
        addSecondScene(root);
        for (const [source, target] of [
          ["001-scene", "002-scene"],
          ["002-scene", "001-scene"],
        ])
          replace(
            root,
            `docs/naturalness/screenplay/001-part/${source}.md`,
            `screenplay/001-part/${source}.md`,
            `screenplay/001-part/${target}.md`,
          );
      },
    },
  ];
  const failures: string[] = [];
  for (const scenario of cases) {
    const root: string = ProductionWorkflowFixture.create();
    try {
      const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
        root,
        scenario.mode,
      );
      scenario.change(root, props);
      if (scenario.expected === null || scenario.nativeSuccess === true)
        await ProductionWorkflowFixture.certify(root, props);
      const result: IProductionPassValidation = await analyzeProductionPass(
        createProductionConfig(props),
        path.join(root, "evidence.config.ts"),
        { layer: "screenplay", pass: scenario.pass ?? "naturalness" },
      );
      if (scenario.nativeSuccess !== undefined)
        assert.equal(
          result.packageSuccess,
          scenario.nativeSuccess,
          `${scenario.name}: ${JSON.stringify(result.analysis.report.diagnostics)}`,
        );
      if (scenario.expected === null)
        assert.equal(
          result.approvalStructureReady,
          true,
          `${scenario.name}: ${JSON.stringify({ issues: result.scope.issues, diagnostics: result.analysis.report.diagnostics })}`,
        );
      else {
        assert.equal(result.rereadReady, false, scenario.name);
        assert.ok(
          result.scope.issues.some((issue: string): boolean =>
            scenario.expected!.test(issue),
          ),
          `${scenario.name}: ${JSON.stringify(result.scope.issues)}`,
        );
      }
    } catch (error: unknown) {
      failures.push(
        `${scenario.name}: ${error instanceof Error ? error.stack : String(error)}`,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
  assert.deepEqual(failures, [], failures.join("\n"));
}

/** Changes one explicit fixture string while keeping every neighboring input intact. */
function replace(
  root: string,
  relative: string,
  before: string,
  after: string,
): void {
  const filename: string = path.join(root, relative);
  fs.writeFileSync(
    filename,
    fs.readFileSync(filename, "utf8").replaceAll(before, after),
    "utf8",
  );
}

/** Adds a second fully evidenced scene, leaving each population answer with its first respondent. */
function addSecondScene(root: string): void {
  for (const directory of [
    "body",
    "revision",
    "naturalness",
    "evidence/construction/units",
    "review/draft",
    "review/final",
  ]) {
    const layer: string = directory.startsWith("review/")
      ? "screenplay/round-1"
      : "screenplay";
    const original: string = `docs/${directory}/${layer}/001-part/001-scene.md`;
    const next: string = original.replace("001-scene.md", "002-scene.md");
    const content: string = fs
      .readFileSync(path.join(root, original), "utf8")
      .replaceAll("001-scene.md", "002-scene.md")
      .replace(/^@evidence shared\/naturalness\/obligations\/.*\n/gmu, "");
    ProductionWorkflowFixture.write(root, next, content);
  }
  ProductionWorkflowFixture.write(
    root,
    "docs/body/screenplay/001-part/index.md",
    "# First part\n\n1. [Arrival record](001-scene.md)\n2. [Arrival record](002-scene.md)\n",
  );
}

/** Keeps inert fenced, rendered, and comment examples distinct from a real following heading. */
function addExamples(root: string, includeRealHeading: boolean): void {
  const suffix: string =
    "\n\n```md\n##### Fenced example\n<!-- literal comment opener\n```\n\n<pre>\n<!-- literal markup\n</pre>\n\n<!-- ##### Comment example -->\n" +
    (includeRealHeading ? "\n##### Real subdivision\n" : "");
  for (const edition of ["body", "revision", "naturalness"]) {
    const filename: string = path.join(
      root,
      `docs/${edition}/screenplay/001-part/001-scene.md`,
    );
    fs.appendFileSync(filename, suffix, "utf8");
  }
}

/** Gives two legitimate units the same display label and different stable anchors. */
function addRepeatedTitle(root: string): void {
  const file: string = "001-part/001-scene.md";
  for (const directory of [
    "revision/screenplay",
    "naturalness/screenplay",
    "review/draft/screenplay/round-1",
    "review/final/screenplay/round-1",
  ]) {
    const filename: string = path.join(root, "docs", directory, file);
    const content: string = fs.readFileSync(filename, "utf8");
    const unit: string = content
      .slice(content.indexOf("## Arrival"))
      .replaceAll("{#arrival}", "{#second-arrival}")
      .replaceAll("001-scene.md#arrival", "001-scene.md#second-arrival");
    fs.appendFileSync(filename, `\n${unit}`, "utf8");
  }
  const evidence: string = path.join(
    root,
    "docs/evidence/construction/units/screenplay",
    file,
  );
  fs.appendFileSync(
    evidence,
    `\n${fs.readFileSync(evidence, "utf8").replaceAll("001-scene.md#arrival", "001-scene.md#second-arrival")}`,
    "utf8",
  );
  const working: string = fs.readFileSync(
    path.join(root, "docs/naturalness/screenplay", file),
    "utf8",
  );
  fs.writeFileSync(
    path.join(root, "docs/body/screenplay", file),
    stripNaturalnessComments(Buffer.from(working)),
  );
}
