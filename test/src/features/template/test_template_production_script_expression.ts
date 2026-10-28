import { createEvidenceConfig } from "@automovie/evidence";
import {
  type IProductionConfigProps,
  type IProductionPassValidation,
  analyzeProductionPass,
  createPackageContract,
  createPackagePopulationContract,
  createProductionConfig,
} from "@automovie/evidence/narrative";
import type { IEvidenceClaim } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { parseProductionCheckArgs } from "../../../../packages/evidence/src/internal/parseProductionCheckArgs";
import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Scripts finish expression and content in the same construction graph.
 *
 * Scenarios:
 * 1. Missing unit expression answers block construction despite valid content.
 * 2. Restoring unit answers alone leaves missing population obligations blocking.
 * 3. Restoring both answers permits structural approval without a scripts revision.
 * 4. Retired naturalness settings, pass requests and source tuples are refused.
 * 5. Language and work expression duties stay on construction, not a retired final pass.
 * 6. CLI parsing and explicit custom scopes reject every ineligible naturalness owner.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates real Markdown through the public native pass analyzer while removing and restoring distinct expression answers, then checks runtime refusals for obsolete configuration, custom scopes, pass requests and actual command arguments.
 * @evidence contracts/testing.md#independent-expectations The lifecycle requires script unit expression and population duties during construction, independently of screenplay revision; a missing answer must block rather than be deferred to a frozen edition. Fixture certification supplies native fingerprints, not creative approval.
 * @evidence contracts/testing.md#distinguishing-cases Complete content with missing unit and population expression answers distinguishes each requirement from graph-wide failure; restored answers establish the valid boundary. Language duties are checked separately at unit and population level. Work helpers admit draft expression but reject final scripts, and facade/default admission rejects a disabled legacy key. Both tuple booleans cannot preserve a retired route. Existing routing, lineage, protected-input and transfer tests cover adjacent ownership boundaries.
 * @evidence contracts/testing.md#execution-ownership The exported asynchronous entry evaluates public APIs in process and owns its temporary files under finally, without an installed consumer, subprocess, browser, GPU or replacement of a foreign method.
 */
export async function test_template_production_script_expression(): Promise<void> {
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
    const inspect: () => Promise<IProductionPassValidation> =
      async (): Promise<IProductionPassValidation> => {
        await ProductionWorkflowFixture.certify(root, props);
        return analyzeProductionPass(
          createProductionConfig(props),
          path.join(root, "evidence.config.ts"),
          { layer: "scripts", pass: "construction" },
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
    assert.equal((await inspect()).rereadReady, false);

    fs.writeFileSync(unit, unitBody);
    assert.equal((await inspect()).rereadReady, false);
    fs.writeFileSync(population, populationBody);
    const complete: IProductionPassValidation = await inspect();
    assert.equal(
      complete.approvalStructureReady,
      true,
      JSON.stringify(complete.scope.issues),
    );
    assert.ok(
      complete.scope.requiredPasses.every(
        (key: { layer: string; pass: string }): boolean =>
          key.layer !== "scripts" || key.pass === "construction",
      ),
    );

    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/language/naturalness/scripts.md",
      "# Language\n\n## Idiom {#idiom}\n\nUse the scene's adopted idiom.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/language/naturalness/obligations/scripts.md",
      "# Language population\n\n## Voices {#voices}\n\nCompare voices across the population.\n",
    );
    assert.equal((await inspect()).rereadReady, false);
    fs.appendFileSync(
      unit,
      "\n## @evidence language/naturalness/scripts.md#idiom\n\nThe adopted idiom belongs to the scene.\n",
    );
    assert.equal((await inspect()).rereadReady, false);
    fs.appendFileSync(
      population,
      "\n## @evidence language/naturalness/obligations/scripts.md#voices\n\nCompared the complete voice population.\n",
    );
    assert.equal((await inspect()).approvalStructureReady, true);

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
          ".agents/skills/contracts/story/work/naturalness/scripts.md",
          "# Work\n\n## Expression {#expression}\n\nRealize the adopted expression.\n",
        );
        ProductionWorkflowFixture.write(
          root,
          ".agents/skills/contracts/story/work/obligations/expression-scripts.md",
          "# Work population\n\n## Expression {#expression}\n\nCompare the adopted expression.\n",
        );
        const claims: IEvidenceClaim[] = [...unitClaim(), ...populationClaim()];
        props.claims = claims;
        props.gate.claimScopes = claims.map(
          (
            claim: IEvidenceClaim,
          ): { name: string; layer: "scripts"; pass: "construction" } => {
            const name: string | undefined = claim.name;
            assert.ok(name);
            return { name, layer: "scripts", pass: "construction" };
          },
        );
        assert.equal((await inspect()).rereadReady, false);
        fs.appendFileSync(
          unit,
          "\n## @evidence work/naturalness/scripts.md#expression\n\nThe scene realizes its adopted expression.\n",
        );
        fs.appendFileSync(
          population,
          "\n## @evidence work/obligations/expression-scripts.md#expression\n\nCompared the complete expression.\n",
        );
        const adopted: IProductionPassValidation = await inspect();
        assert.equal(
          adopted.approvalStructureReady,
          true,
          JSON.stringify({
            issues: adopted.scope.issues,
            diagnostics: adopted.analysis.report.diagnostics,
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
    const obsoleteScope: IProductionConfigProps =
      ProductionWorkflowFixture.props(root);
    obsoleteScope.claims = createPackageContract({
      document: "work/naturalness/scripts.md",
      layers: { scripts: "disabled" },
      narrativeScope: { mode: "complete-work" },
      reason: "carry the adopted expression",
      symbol: "h2",
    });
    const obsoleteName: string | undefined = obsoleteScope.claims[0].name;
    assert.ok(obsoleteName);
    obsoleteScope.gate.claimScopes = [
      {
        name: obsoleteName,
        layer: "scripts",
        pass: "naturalness",
      },
    ];
    assert.throws(
      (): unknown => createProductionConfig(obsoleteScope),
      /only screenplay|scripts.*construction/i,
    );
    for (const layer of ["settings", "treatments", "scripts", "screenplay"]) {
      assert.deepEqual(
        parseProductionCheckArgs(["--layer", layer, "--pass", "construction"]),
        { layer, pass: "construction" },
      );
      const parse: () => unknown = (): unknown =>
        parseProductionCheckArgs(["--layer", layer, "--pass", "naturalness"]);
      if (layer === "screenplay")
        assert.deepEqual(parse(), { layer, pass: "naturalness" });
      else assert.throws(parse, /only screenplay/i);
    }
    for (const flag of [false, true]) {
      const tuple: IProductionConfigProps =
        ProductionWorkflowFixture.props(root);
      Object.assign(tuple.construction, { screenplay: ["disabled", flag] });
      assert.throws(
        (): unknown => createProductionConfig(tuple),
        /stage|tuple/i,
      );
    }
    await assert.rejects(
      analyzeProductionPass(
        createProductionConfig(props),
        path.join(root, "evidence.config.ts"),
        { layer: "scripts", pass: "naturalness" },
      ),
      /only screenplay|scripts.*construction/i,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
