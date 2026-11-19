import { createEvidenceConfig } from "@automovie/evidence";
import {
  EvidenceChecker,
  type IEvidenceCheckReport,
  type IEvidenceClaim,
  createEvidenceConfigPlan,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Checks the link from a production entity to its brief or settings record.
 *
 * Scenarios:
 * 1. One class citation covers a whole subject file in either story route.
 * 2. Submitting the film also checks the citation. Prose alone and a stale
 *    file reference both fail.
 * 3. Work without submitted entities or film has no subject citation duty.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public config's subject claim through native Evidence on disk, then removes the tag and moves its target.
 * @evidence contracts/development/testing.md#independent-expectations The prop has two facts. A single reference to the file covers it. The world document outside the four entity domains needs no citation.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises both narrative roots, submission by either stage, an inactive stage and an untagged path.
 * @evidence contracts/development/testing.md#execution-ownership Each route owns a temporary checkout and removes it after the check.
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the coverage unit and when verification applies.
 */
export async function test_evidence_entity_canon(): Promise<void> {
  for (const mode of ["short", "long"] as const) {
    const root: string = ProductionWorkflowFixture.create();
    try {
      const layer: string = mode === "short" ? "brief" : "settings";
      const ball: string = `docs/body/${layer}/props/ball.md`;
      const source: string = "src/entities/props/Ball.ts";
      const write = (file: string, body: string): void =>
        ProductionWorkflowFixture.write(root, file, body);
      write(
        ball,
        "# Ball\n\n## Surface\n\n### Red panels\n\n### White seams\n",
      );
      write(`docs/body/${layer}/world/rules.md`, "# Rules\n");
      const name: string = `production entities cite ${layer} subjects`;
      const select = (stage?: "entities" | "composition"): IEvidenceClaim[] =>
        createEvidenceConfig({
          location: root,
          narrative: { mode },
          development: stage && { [stage]: "evidence" },
        }).claims.filter((claim) => claim.name === name);
      const check = async (
        stage: "entities" | "composition",
      ): Promise<IEvidenceCheckReport> => {
        const claims: IEvidenceClaim[] = select(stage);
        assert.equal(claims.length, 1);
        return (
          await EvidenceChecker.evaluate(
            createEvidenceConfigPlan(
              { claims },
              path.join(root, "evidence.config.ts"),
            ),
          )
        ).report;
      };
      assert.equal(select().length, 0);
      const statement: string = `${ball} The ball uses the brief or settings record's red panels.`;
      const entity: string = `export class Ball { readonly panels = "red"; }\n`;
      write(source, `/** ${statement} */\n${entity}`);
      assert.equal((await check("entities")).success, false);
      write(source, `/** @evidence ${statement} */\n${entity}`);
      for (const stage of ["entities", "composition"] as const) {
        const report: IEvidenceCheckReport = await check(stage);
        assert.ok(report.success, JSON.stringify(report.diagnostics));
      }
      fs.renameSync(
        path.join(root, ball),
        path.join(root, `docs/body/${layer}/props/match-ball.md`),
      );
      const stale: IEvidenceCheckReport = await check("entities");
      assert.ok(
        stale.diagnostics.some(
          (d) => d.code === "target-missing-file" && d.target === ball,
        ),
        JSON.stringify(stale.diagnostics),
      );
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  }
}
