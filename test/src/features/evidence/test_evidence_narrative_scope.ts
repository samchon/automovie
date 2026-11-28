import { AutoMovieEvidenceConfig } from "@automovie/evidence";
import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Selects complete work or the exact long pilot at the public entry.
 *
 * Scenarios:
 *
 * 1. A short's default and explicit complete scopes select its film scenes.
 * 2. A long pilot selects only its named part. Long complete work selects both.
 * 3. The direct screenplay route adds only its supplied narrative claim.
 * 4. Untyped options with an incompatible or invalid scope are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the short, long, direct and malformed options and the selection or refusal each proves.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieEvidenceConfig.create` with fixture paths and checks each screenplay claim's file patterns. Uses Reflect.apply to exercise how JavaScript callers reach the API with invalid options.
 * @evidence contracts/development/testing.md#independent-expectations The short file is directly in its film folder and the two long files differ only in part directory. Expected matches follow the mode and exact first-part name. An invalid scope must throw even when all construction layers are disabled.
 */
export function test_evidence_narrative_scope(): void {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const shortScene: string = "screenplay/arrival/001-door.md";
    const pilotScene: string = "screenplay/001-arrival/001-door/001-open.md";
    const laterScene: string = "screenplay/002-arrival/001-door/001-open.md";
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/principles/screenplay.md",
      "# Principle\n\n## Scope\n\nRead each scene.\n",
    );

    for (const scope of [undefined, { mode: "complete-work" } as const]) {
      const config: IEvidenceConfig = AutoMovieEvidenceConfig.create({
        location: root,
        narrative: {
          mode: "short",
          construction: { screenplay: "evidence" },
          scope,
        },
      });
      assert.equal(selectsScene(config, shortScene), true);
    }

    const pilot: IEvidenceConfig = AutoMovieEvidenceConfig.create({
      location: root,
      narrative: {
        mode: "long",
        construction: { screenplay: "evidence" },
        scope: { mode: "first-part-pilot", part: "001-arrival" },
      },
    });
    assert.equal(selectsScene(pilot, pilotScene), true);
    assert.equal(selectsScene(pilot, laterScene), false);
    const long: IEvidenceConfig = AutoMovieEvidenceConfig.create({
      location: root,
      narrative: { mode: "long", construction: { screenplay: "evidence" } },
    });
    assert.equal(selectsScene(long, pilotScene), true);
    assert.equal(selectsScene(long, laterScene), true);

    const custom: IEvidenceClaim = {
      name: "Direct screenplay question",
      type: "markdown",
      files: [shortScene],
      symbol: "h2",
      reference: { type: "markdown", files: ["rule.md"], symbol: "h2" },
    };
    assert.deepEqual(
      AutoMovieEvidenceConfig.create({
        location: root,
        narrative: { mode: "none", claims: [custom] },
      }).claims,
      [...AutoMovieEvidenceConfig.create({ location: root }).claims, custom],
    );

    for (const [mode, scope, message] of [
      ["short", { mode: "first-part-pilot", part: "001-arrival" }, /long/],
      ["long", { mode: "first-part-pilot", part: "002-arrival" }, /001-/],
      ["long", { mode: "other" }, /scope/i],
      ["long", null, /scope/i],
      ["none", { mode: "complete-work" }, /scope/i],
    ] as const)
      assert.throws(
        () =>
          Reflect.apply(AutoMovieEvidenceConfig.create, undefined, [
            { location: root, narrative: { mode, scope } },
          ]),
        message,
      );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}

function selectsScene(config: IEvidenceConfig, file: string): boolean {
  return config.claims.some(
    (claim: IEvidenceClaim): boolean =>
      claim.name?.startsWith("screenplay H2 units") === true &&
      claim.disabled !== true &&
      claim.files.some((pattern: string): boolean =>
        path.posix.matchesGlob(file, pattern),
      ),
  );
}
