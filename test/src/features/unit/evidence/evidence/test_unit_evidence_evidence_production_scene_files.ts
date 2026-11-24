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

import { ProductionWorkflowFixture } from "../../../internal/ProductionWorkflowFixture";

/**
 * Native selectors reach a short's scene files and plain settings files.
 *
 * Scenarios:
 * 1. A short's two scene files in its film folder and a plain settings file each contribute their actual H2, while a screenplay file outside a film folder is not a scene.
 * 2. Long work's scene files in their part and episode folders are selected as scene files too.
 * 3. An exact first-part pilot excludes the short's film folder and selects only the scene files of its named part.
 */
export async function test_unit_evidence_evidence_production_scene_files(): Promise<void> {
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
