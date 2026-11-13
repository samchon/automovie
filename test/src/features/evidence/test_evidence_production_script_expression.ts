import { createEvidenceConfig } from "@automovie/evidence";
import {
  type IProductionConfigProps,
  createPackageContract,
  createPackagePopulationContract,
  createProductionConfig,
} from "@automovie/evidence/internal";
import type {
  IEvidenceCheckAnalysis,
  IEvidenceClaim,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Scripts finish expression and content in the same construction graph.
 *
 * Scenarios:
 * 1. Missing unit expression answers block construction despite valid content.
 * 2. Restoring unit answers alone leaves missing population obligations blocking.
 * 3. Restoring both answers completes native coverage without a scripts revision.
 * 4. Unsupported script naturalness settings and source tuples are refused.
 * 5. Language and work expression duties stay on construction, not a retired final pass.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates real Markdown through native Evidence while removing and restoring unit and population expression answers; unsupported stage and source tuple options are checked at configuration construction.
 * @evidence contracts/development/testing.md#independent-expectations The lifecycle requires script unit expression and population duties during construction, independently of screenplay revision; a missing answer must block rather than be deferred to a frozen edition. Fixture certification supplies native fingerprints, not creative approval.
 * @evidence contracts/development/testing.md#distinguishing-cases Missing unit and population answers distinguish their independent native duties; restored answers establish complete coverage. Language and work duties exercise the same construction respondents. Unsupported script naturalness settings and both legacy source tuples fail configuration validation.
 * @evidence contracts/development/testing.md#execution-ownership The exported asynchronous entry evaluates public APIs in process and owns its temporary files under finally, without an installed consumer, subprocess, browser, GPU or replacement of a foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
 */
export async function test_evidence_production_script_expression(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "long",
    );
    const unit: string = path.join(
      root,
      "docs/evidence/construction/units/scripts/001-part/001-scene.md",
    );
    const population: string = path.join(
      root,
      "docs/evidence/construction/files/scripts/001-part/001-scene.md",
    );
    const unitBody: string = fs.readFileSync(unit, "utf8");
    const populationBody: string = fs.readFileSync(population, "utf8");
    const inspect: () => Promise<IEvidenceCheckAnalysis> =
      async (): Promise<IEvidenceCheckAnalysis> => {
        await ProductionWorkflowFixture.certify(root, props);
        return ProductionWorkflowFixture.evaluate(
          root,
          createProductionConfig(props).claims,
        );
      };

    fs.writeFileSync(
      unit,
      unitBody.replace(
        /## @evidence shared\/naturalness\/common\.md#scope\n[\s\S]*?(?=## @evidence |$)/g,
        "",
      ),
    );
    fs.writeFileSync(
      population,
      populationBody.replace(
        /## @evidence shared\/naturalness\/obligations\/common\.md#scope\n[\s\S]*?(?=## @evidence |$)/g,
        "",
      ),
    );
    assert.equal((await inspect()).report.success, false);

    fs.writeFileSync(unit, unitBody);
    assert.equal((await inspect()).report.success, false);
    fs.writeFileSync(population, populationBody);
    const complete: IEvidenceCheckAnalysis = await inspect();
    assert.equal(
      complete.report.success,
      true,
      JSON.stringify(complete.report.diagnostics),
    );

    ProductionWorkflowFixture.write(
      root,
      "docs/contracts/language/naturalness/scripts.md",
      "# Language\n\n## Idiom {#idiom}\n\nUse the scene's adopted idiom.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/contracts/language/naturalness/obligations/scripts.md",
      "# Language population\n\n## Voices {#voices}\n\nCompare voices across the population.\n",
    );
    assert.equal((await inspect()).report.success, false);
    fs.appendFileSync(
      unit,
      "\n## @evidence language/naturalness/scripts.md#idiom\n\nThe adopted idiom belongs to the scene.\n",
    );
    assert.equal((await inspect()).report.success, false);
    fs.appendFileSync(
      population,
      "\n## @evidence language/naturalness/obligations/scripts.md#voices\n\nCompared the complete voice population.\n",
    );
    assert.equal((await inspect()).report.success, true);

    for (const pass of ["draft", "final"] as const) {
      const unitClaim: () => IEvidenceClaim[] = (): IEvidenceClaim[] =>
        createPackageContract({
          document: "work/naturalness/scripts.md",
          layers: { scripts: "evidence" },
          pass,
          narrativeScope: { mode: "complete-work" },
          reason: "carry the adopted expression",
          symbol: "h2",
        });
      const populationClaim: () => IEvidenceClaim[] = (): IEvidenceClaim[] =>
        createPackagePopulationContract({
          document: "work/obligations/expression-scripts.md",
          layers: { scripts: "evidence" },
          pass,
          narrativeScope: { mode: "complete-work" },
          reason: "compare the complete expression",
        });
      if (pass === "final") {
        assert.throws(unitClaim, /only screenplay|scripts.*construction/i);
        assert.throws(
          populationClaim,
          /only screenplay|scripts.*construction/i,
        );
      } else {
        ProductionWorkflowFixture.write(
          root,
          "docs/contracts/work/naturalness/scripts.md",
          "# Work\n\n## Expression {#expression}\n\nRealize the adopted expression.\n",
        );
        ProductionWorkflowFixture.write(
          root,
          "docs/contracts/work/obligations/expression-scripts.md",
          "# Work population\n\n## Expression {#expression}\n\nCompare the adopted expression.\n",
        );
        const claims: IEvidenceClaim[] = [...unitClaim(), ...populationClaim()];
        props.claims = claims;
        assert.equal((await inspect()).report.success, false);
        fs.appendFileSync(
          unit,
          "\n## @evidence work/naturalness/scripts.md#expression\n\nThe scene realizes its adopted expression.\n",
        );
        fs.appendFileSync(
          population,
          "\n## @evidence work/obligations/expression-scripts.md#expression\n\nCompared the complete expression.\n",
        );
        const adopted: IEvidenceCheckAnalysis = await inspect();
        assert.equal(
          adopted.report.success,
          true,
          JSON.stringify({
            diagnostics: adopted.report.diagnostics,
          }),
        );
      }
    }

    const legacy: IProductionConfigProps =
      ProductionWorkflowFixture.props(root);
    Object.assign(legacy.naturalness, { scripts: "disabled" });
    assert.throws(
      (): unknown => createProductionConfig(legacy),
      /scripts.*construction|naturalness\.scripts/i,
    );
    assert.throws(
      (): unknown =>
        createEvidenceConfig({
          location: root,
          narrative: {
            mode: "long",
            naturalness: Object.assign(
              { screenplay: "disabled" as const },
              { scripts: "disabled" },
            ),
          },
        }),
      /scripts.*construction|naturalness\.scripts/i,
    );
    for (const flag of [false, true]) {
      const tuple: IProductionConfigProps =
        ProductionWorkflowFixture.props(root);
      Object.assign(tuple.construction, { screenplay: ["disabled", flag] });
      assert.throws(
        (): unknown => createProductionConfig(tuple),
        /stage|tuple/i,
      );
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
