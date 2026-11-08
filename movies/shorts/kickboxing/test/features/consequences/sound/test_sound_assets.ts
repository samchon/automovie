import assert from "node:assert/strict";
import { open } from "node:fs/promises";
import path from "node:path";

import { SoundAssets } from "../../../../src/consequences/sound/SoundAssets";

/**
 * The asset length table matches the files it describes.
 *
 * Scenarios: each asset's WAV header (the first 44 bytes, no decode) gives
 * its data bytes over its byte rate, which equals the table's seconds; every
 * id has a path; every audible length is positive and within its file.
 */
export async function test_sound_assets(): Promise<void> {
  const root: string = path.resolve(import.meta.dirname, "../../../..");
  for (const [id, audible] of Object.entries(SoundAssets.audible))
    assert.ok(audible > 0 && audible <= SoundAssets.seconds[id]!, id);
  for (const id of SoundAssets.ids) {
    const file = await open(path.join(root, SoundAssets.paths[id]!), "r");
    try {
      const header: Buffer = Buffer.alloc(44);
      await file.read(header, 0, 44, 0);
      assert.equal(header.toString("ascii", 0, 4), "RIFF", id);
      assert.equal(header.toString("ascii", 36, 40), "data", id);
      const seconds: number =
        header.readUInt32LE(40) / header.readUInt32LE(28);
      assert.ok(
        Math.abs(seconds - SoundAssets.seconds[id]!) < 1e-6,
        `${id}: ${seconds} s in the header`,
      );
    } finally {
      await file.close();
    }
  }
}
