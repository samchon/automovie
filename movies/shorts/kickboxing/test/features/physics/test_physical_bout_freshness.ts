import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { boutPhysicalSourceIdentity } from "../../../src/physics/boutPhysicalSourceIdentity";
import { readBoutPhysicalManifest } from "../../../src/physics/readBoutPhysicalManifest";

/** The browser's source-only gate changes for phase logic, relation policy, numerical resources and actual native bytes, without modifying maintained files during the test. */
export async function test_physical_bout_freshness(): Promise<void> {
  const snapshot: Map<string, Uint8Array> = new Map();
  const baseline: string = await boutPhysicalSourceIdentity(
    async (file: string): Promise<Uint8Array> => {
      const bytes: Uint8Array = await readFile(file);
      snapshot.set(file, bytes);
      return bytes;
    },
  );
  for (const suffix of [
    "src/runtime/FilmEvents.ts",
    "motion/AutoMovieEnvelope.ts",
    "math/quadraticKernelBytes.json",
    "@dimforge/rapier3d-compat/package.json",
    "dist/rapier.mjs",
  ]) {
    const changed: string | undefined = [...snapshot.keys()].find(
      (file: string): boolean => file.replaceAll("\\", "/").endsWith(suffix),
    );
    assert.ok(changed, `numerical freshness closure is missing ${suffix}`);
    const current: string = await boutPhysicalSourceIdentity(
      async (file: string): Promise<Uint8Array> => {
        const bytes: Uint8Array | undefined = snapshot.get(file);
        assert.ok(bytes, `source snapshot changed during the test: ${file}`);
        if (file !== changed) return bytes;
        const amended: Uint8Array = new Uint8Array(bytes.length + 1);
        amended.set(bytes);
        amended[bytes.length] = 10;
        return amended;
      },
    );
    assert.notEqual(current, baseline);
    assert.throws(
      (): readBoutPhysicalManifest.IManifest =>
        readBoutPhysicalManifest(
          { sourceIdentity: baseline, mode: "simulated" },
          current,
        ),
      /physics is stale/,
    );
  }
}
