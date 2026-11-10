import {
  createNarrativeUnitFiles,
  createSettingsFiles,
} from "@automovie/evidence";
import {
  EvidenceMarkdownAdapter,
  EvidenceSourceLoader,
  type IEvidenceInventory,
  type IEvidenceUnit,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Native selectors reach flat screenplays and plain settings files.
 *
 * Scenarios:
 * 1. A flat screenplay and a plain settings file each contribute their actual H2.
 * 2. An exact first-part pilot excludes flat work and selects its named part.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs public selector output through actual native source capture and Markdown extraction, observing selected sources and H2 units.
 * @evidence contracts/development/testing.md#independent-expectations The explicitly authored flat scene and settings each contain one H2; the pilot requests only 001-bout and therefore selects no flat file.
 * @evidence contracts/development/testing.md#distinguishing-cases Flat and partitioned inputs distinguish complete-work selection from an exact pilot; the selected part contains one scene and no invented outline requirement.
 * @evidence contracts/development/testing.md#execution-ownership This exported test evaluates native Evidence in process, owns its unique temporary files and removes them in finally. It starts no installation, subprocess, browser or GPU and replaces no foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A flat screenplay and a plain settings file each contribute their actual H2.).
 */

export async function test_template_production_flat_short(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const body: string =
      "# One scene\n\n## Exchange\n\nThe fighters exchange.\n";
    ProductionWorkflowFixture.write(root, "flat/screenplay/scene.md", body);
    ProductionWorkflowFixture.write(
      root,
      "flat/settings/fighter.md",
      "# Fighter\n\n## Stance\n\nAn adult orthodox fighter.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "partitioned/screenplay/001-bout/001-exchange.md",
      body,
    );
    const flat: IEvidenceInventory = await capture(root, "flat", [
      ...createNarrativeUnitFiles("screenplay", { mode: "complete-work" }),
      ...createSettingsFiles(),
    ]);
    assert.equal(flat.sources.length, 2);
    assert.equal(
      flat.units.filter((unit: IEvidenceUnit): boolean => unit.symbol === "h2")
        .length,
      2,
    );
    const excluded: IEvidenceInventory = await capture(
      root,
      "flat",
      createNarrativeUnitFiles("screenplay", {
        mode: "first-part-pilot",
        part: "001-bout",
      }),
    );
    assert.equal(excluded.sources.length, 0);
    const pilot: IEvidenceInventory = await capture(
      root,
      "partitioned",
      createNarrativeUnitFiles("screenplay", {
        mode: "first-part-pilot",
        part: "001-bout",
      }),
    );
    assert.equal(pilot.sources.length, 1);
    assert.equal(
      pilot.units.filter((unit: IEvidenceUnit): boolean => unit.symbol === "h2")
        .length,
      1,
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}

/** Captures selected source bytes through the native Markdown adapter. */
async function capture(
  root: string,
  edition: string,
  files: string[],
): Promise<IEvidenceInventory> {
  return new EvidenceMarkdownAdapter().analyze(
    await EvidenceSourceLoader.glob(path.join(root, "evidence.config.ts"), {
      root: path.join(root, edition),
      files,
    }),
  );
}
