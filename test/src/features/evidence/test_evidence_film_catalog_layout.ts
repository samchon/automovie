import { createEvidenceConfig } from "@automovie/evidence";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Selects a separate review catalog only when a production adopts it.
 *
 * Scenarios:
 *
 * 1. An ordinary nested film selects composition without a review catalog.
 * 2. Explicit catalog selection reports missing files even before a film exists.
 * 3. An existing catalog enters validation with composition. A file counts as a
 *    case when it publishes a function or a public method it implements.
 * 4. Complete catalog inputs activate its own checklist with or without
 *    composition.
 * 5. An explicit disabled stage omits catalog claims.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Creates the public configuration and reads the claims and refusals the actual project files produce.
 * @evidence contracts/development/testing.md#independent-expectations The documented production paths identify the three inputs. Only the existing catalog markers and an explicit selection start catalog validation.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks a nested ordinary film, three missing inputs, empty placeholders, a completed selection and an explicit disablement. The native coverage graph is exercised by test_evidence_package.
 * @evidence contracts/development/testing.md#execution-ownership Uses an isolated temporary production in process and releases it in finally.
 * @evidence contracts/development/common.md#meaningful-documentation Names the paths and distinct stage rules the test exercises.
 */
export function test_evidence_film_catalog_layout(): void {
  const root: string = ProductionWorkflowFixture.create();
  /** Configure composition and an optional catalog selection. */
  const check = (catalog?: "evidence" | "disabled"): IEvidenceConfig =>
    createEvidenceConfig({
      location: root,
      development: { composition: "evidence", catalog },
    });

  /** Whether the factory activated the catalog checklist. */
  const selected = (config: IEvidenceConfig): boolean =>
    config.claims.some(
      (claim: IEvidenceConfig["claims"][number]): boolean =>
        claim.name === "review catalog",
    );
  try {
    fs.mkdirSync(path.join(root, "src/composition/scenes/empty.ts"), {
      recursive: true,
    });
    for (const file of ["starter.ts", "index.ts", "types.d.ts"])
      ProductionWorkflowFixture.write(
        root,
        `src/composition/films/${file}`,
        "export {};\n",
      );
    assert.equal(selected(check()), false);
    assert.throws(
      (): IEvidenceConfig => check("evidence"),
      /Missing: src\/composition\/films\/catalog\.ts, docs\/acceptance\/catalog\.md, src\/composition\/scenes\/catalog/,
    );

    ProductionWorkflowFixture.write(
      root,
      "src/composition/films/playoffs/final.ts",
      "export function final() {}\n",
    );
    assert.equal(selected(check()), false);
    ProductionWorkflowFixture.write(
      root,
      "src/composition/films/catalog.ts",
      "export function catalog() {}\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/acceptance/catalog.md",
      "# Catalog\n",
    );
    const cases: string = "src/composition/scenes/catalog";
    fs.mkdirSync(path.join(root, cases, "empty.ts"), { recursive: true });
    ProductionWorkflowFixture.write(
      root,
      `${cases}/types.d.ts`,
      "export {};\n",
    );
    assert.throws(check, /src\/composition\/scenes\/catalog/);
    for (const source of [
      "// The case has not been implemented.\n",
      "export {};\n",
      "export type Step = string;\n",
      "export declare function step(): void;\n",
      "const step = () => {}; export type { step };\n",
      "const step = 1; export { step };\n",
      "const step = () => {};\n",
      "export default 1;\n",
      "export class Step { private play() {} }\n",
      'void "prepare the case";\n',
      'import "./setup";\n',
      'export {} from "./setup";\n',
    ]) {
      ProductionWorkflowFixture.write(root, `${cases}/step/case.ts`, source);
      assert.throws(
        (): IEvidenceConfig => check("evidence"),
        /src\/composition\/scenes\/catalog/,
      );
    }
    for (const source of [
      "export function step(stance: number): number { return stance / 2; }\n",
      "export const step = ((stance: number) => stance / 2) satisfies (n: number) => number;\n",
      "const step = (stance: number): number => stance / 2; export { step as lead };\n",
      "const step = (stance: number): number => stance / 2; export default step;\n",
      "export class Step { public static lead(stance: number) { return stance / 2; } }\n",
      "export namespace Step { export function lead(stance: number) { return stance / 2; } }\n",
    ]) {
      ProductionWorkflowFixture.write(root, `${cases}/step/case.ts`, source);
      assert.equal(selected(check()), true, source);
    }
    assert.equal(
      selected(
        createEvidenceConfig({
          location: root,
          development: { catalog: "evidence" },
        }),
      ),
      true,
    );
    assert.equal(selected(check("disabled")), false);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
