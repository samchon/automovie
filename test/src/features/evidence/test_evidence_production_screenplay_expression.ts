import type {
  IProductionConfigProps
} from "../../../../packages/evidence/src/narrative/IProductionConfigProps";
import {
  createPackageContract
} from "../../../../packages/evidence/src/narrative/internal/createPackageContract";
import {
  createPackagePopulationContract
} from "../../../../packages/evidence/src/narrative/internal/createPackagePopulationContract";
import {
  createProductionConfig
} from "../../../../packages/evidence/src/narrative/internal/createProductionConfig";
import { AutoMovieTemplateScaffold } from "@automovie/template";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Final expression belongs to screenplay construction on both routes.
 *
 * Scenarios:
 *
 * 1. The installed contracts allow a long script to close without final wording.
 * 2. Ordinary coverage leaves the screenplay's expression incomplete. Restoring
 *    section answers alone still leaves the whole-film comparisons
 *    outstanding.
 * 3. Local language and work questions bind the adopted screenplay respondents.
 * 4. Construction accepts only the supported stage values.
 * 5. A missing bundled screenplay obligation file is diagnosed even when none of
 *    its answers remain.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Installs the scaffold's actual screenplay questions in a native graph and checks the verdict before and after restoring the two sets of answers. The long script has no expression answers throughout.
 * @evidence contracts/development/testing.md#independent-expectations The four wording, fidelity, exchange and rhythm items need section evidence. The three comparisons each need one file respondent. The fixture answers the screenplay's other items independently.
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the draft and final respondents, their checks, the local contracts and the supported stages.
 */
export async function test_evidence_production_screenplay_expression(): Promise<void> {
  const scaffold: Record<string, string> = AutoMovieTemplateScaffold.create({
    kind: "production",
    name: "expression-test",
  });
  for (const mode of ["short", "long"] as const) {
    const root: string = ProductionWorkflowFixture.create();
    try {
      const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
        root,
        mode,
      );
      const scene: string = ProductionWorkflowFixture.scene(mode);
      const unit: string = path.join(
        root,
        "docs/evidence/construction/units/screenplay",
        scene,
      );
      const whole: string = path.join(
        root,
        "docs/evidence/construction/files/screenplay",
        scene,
      );
      const script: string = "scripts/001-part/001-scene.md";
      for (const [respondent, contract, items] of [
        [
          unit,
          "principles/screenplay.md",
          [
            "audiovisual-realization",
            "beat-decisions",
            "performance-timing",
            "speaker-plausibility",
          ],
        ],
        [
          whole,
          "obligations/screenplay.md",
          ["complete-realization", "published-version"],
        ],
        [
          path.join(root, "docs/evidence/construction/units", script),
          "principles/scripts.md",
          ["executable-scene"],
        ],
        [
          path.join(root, "docs/evidence/construction/files", script),
          "obligations/scripts.md",
          ["partition-and-titles", "complete-execution"],
        ],
      ] as const) {
        if (mode === "short" && contract.endsWith("/scripts.md")) continue;
        const file: string = `.agents/skills/contracts/story/${contract}`;
        ProductionWorkflowFixture.write(root, file, scaffold[file]!);
        const body: string = fs.readFileSync(respondent, "utf8");
        fs.writeFileSync(
          respondent,
          body.replace(
            `## @evidence ${contract}#scope`,
            answers(contract, items).trim(),
          ),
        );
      }
      const check = async (...missing: string[]): Promise<void> => {
        await ProductionWorkflowFixture.certify(root, props);
        const { report } = await ProductionWorkflowFixture.evaluate(
          root,
          createProductionConfig(props).claims,
        );
        const messages: string = report.diagnostics
          .map((issue) => issue.message)
          .join("\n");
        assert.equal(report.success, missing.length === 0, messages);
        for (const item of missing)
          assert.ok(
            messages.includes(item),
            `Missing diagnostic for ${item}: ${messages}`,
          );
      };

      if (mode === "long") {
        const discovery: string = path.join(
          root,
          "docs/contracts/work/discovery/results.md",
        );
        const complete: string = fs.readFileSync(discovery, "utf8");
        fs.writeFileSync(
          discovery,
          complete.replace(
            /^@evidenceExclude discovery\/screenplay\.md#.*\n/mu,
            "",
          ),
        );
        props.construction.screenplay = "disabled";
        await check();
        fs.writeFileSync(discovery, complete);
        props.construction.screenplay = "evidence";
      }
      const section = [
        "reads-as-written",
        "expression-fidelity",
        "speech-yield",
        "execution-rhythm",
      ];
      const film = [
        "recurrent-frames",
        "voice-distribution",
        "execution-distribution",
      ];
      await check(...section, ...film);
      fs.appendFileSync(unit, answers("principles/screenplay.md", section));
      await check(...film);
      fs.appendFileSync(whole, answers("obligations/screenplay.md", film));
      await check();
      const obligations: string =
        ".agents/skills/contracts/story/obligations/screenplay.md";
      const previous: string = fs.readFileSync(whole, "utf8");
      fs.unlinkSync(path.join(root, obligations));
      const otherAnswers: string[] = previous
        .split(/(?=^## )/mu)
        .filter(
          (section: string): boolean =>
            !section.startsWith("## @evidence obligations/screenplay.md#"),
        );
      fs.writeFileSync(whole, otherAnswers.join(""));
      await check("obligations/screenplay.md");
      ProductionWorkflowFixture.write(
        root,
        obligations,
        scaffold[obligations]!,
      );
      fs.writeFileSync(whole, previous);
      if (mode === "long") {
        for (const scope of ["language", "work"]) {
          ProductionWorkflowFixture.write(
            root,
            `docs/contracts/${scope}/principles/screenplay.md`,
            "# Wording\n\n## Idiom\n\nRead the exchange in context.\n",
          );
          ProductionWorkflowFixture.write(
            root,
            `docs/contracts/${scope}/obligations/screenplay.md`,
            "# Comparison\n\n## Voices\n\nCompare voices across the film.\n",
          );
        }
        props.claims = [
          ...createPackageContract({
            document: "work/principles/screenplay.md",
            layers: { screenplay: "evidence" },
            narrativeScope: props.narrativeScope,
            reason: "read the exchange",
            symbol: "h2",
          }),
          ...createPackagePopulationContract({
            document: "work/obligations/screenplay.md",
            layers: { screenplay: "evidence" },
            narrativeScope: props.narrativeScope,
            reason: "compare recurring voices",
          }),
        ];
        await check("idiom", "voices");
        for (const scope of ["language", "work"])
          fs.appendFileSync(
            unit,
            answers(`${scope}/principles/screenplay.md`, ["idiom"]),
          );
        await check("voices");
        for (const scope of ["language", "work"])
          fs.appendFileSync(
            whole,
            answers(`${scope}/obligations/screenplay.md`, ["voices"]),
          );
        await check();

        for (const value of [false, true]) {
          Object.assign(props.construction, {
            screenplay: ["disabled", value],
          });
          assert.throws(() => createProductionConfig(props), /stage|tuple/i);
        }
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
}

/** Constructs detached evidence sections with the target address under test. */
function answers(file: string, items: readonly string[]): string {
  return (
    "\n" +
    items
      .map(
        (item: string): string =>
          `## @evidence ${file}#${item}\n\nChecked the selected passage.\n`,
      )
      .join("\n")
  );
}
