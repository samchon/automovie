import {
  createNarrativeUnitFiles,
  createSettingsFiles,
} from "@automovie/evidence/internal";
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
 * Native selectors reach a short's scene files and plain settings files.
 *
 * Scenarios:
 * 1. A short's two scene files in its film folder and a plain settings file each contribute their actual H2, while a screenplay file outside a film folder is not a scene.
 * 2. Long work's scene files in their part and episode folders are selected as scene files too.
 * 3. An exact first-part pilot excludes the short's film folder and selects only the scene files of its named part.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs public selector output through actual native source capture and Markdown extraction, observing selected sources and H2 units.
 * @evidence contracts/development/testing.md#independent-expectations The document layout puts each scene in its own file inside a film folder, a short's `<film>/` or long work's `NNN-part/NNN-episode/`, so each authored scene file contributes its one H2 and a file directly under the screenplay folder contributes none; the pilot requests only 001-bout.
 * @evidence contracts/development/testing.md#distinguishing-cases A short film folder, a long episode folder and a stray top-level file distinguish complete-work selection, and a pilot distinguishes its named part from other folders.
 * @evidence contracts/development/testing.md#execution-ownership This exported test evaluates native Evidence in process, owns its unique temporary files and removes them in finally. It starts no installation, subprocess, browser or GPU and replaces no foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A short's two scene files in its film folder and a plain settings file each contribute their actual H2, while a screenplay file outside a film folder is not a scene.).
 */
export async function test_evidence_production_scene_files(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const body: string =
      "# One scene\n\n## Exchange {#s01}\n\nThe fighters exchange.\n";
    for (const file of [
      "short/screenplay/bout/001-ring.md",
      "short/screenplay/bout/002-count.md",
      "short/screenplay/stray.md",
      "long/screenplay/001-bout/001-round/001-exchange.md",
      "long/screenplay/002-rematch/001-round/001-exchange.md",
    ])
      ProductionWorkflowFixture.write(root, file, body);
    ProductionWorkflowFixture.write(
      root,
      "short/settings/fighter.md",
      "# Fighter\n\n## Stance\n\nAn adult orthodox fighter.\n",
    );
    const complete: string[] = createNarrativeUnitFiles({
      layer: "screenplay",
      scope: { mode: "complete-work" },
    });
    const pilot: string[] = createNarrativeUnitFiles({
      layer: "screenplay",
      scope: { mode: "first-part-pilot", part: "001-bout" },
    });
    const h2 = (inventory: IEvidenceInventory): number =>
      inventory.units.filter(
        (unit: IEvidenceUnit): boolean => unit.symbol === "h2",
      ).length;

    const short: IEvidenceInventory = await capture(root, "short", [
      ...complete,
      ...createSettingsFiles(),
    ]);
    assert.equal(short.sources.length, 3);
    assert.equal(h2(short), 3);
    const long: IEvidenceInventory = await capture(root, "long", complete);
    assert.equal(long.sources.length, 2);
    assert.equal(h2(long), 2);

    assert.equal((await capture(root, "short", pilot)).sources.length, 0);
    const part: IEvidenceInventory = await capture(root, "long", pilot);
    assert.equal(part.sources.length, 1);
    assert.equal(h2(part), 1);
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
