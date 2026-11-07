import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { copyBoutPhysicalArchives } from "../../../src/physics/copyBoutPhysicalArchives";

/** The actual build adapter accepts an authored checkout without caches, copies a complete optional pair and refuses an incomplete publication. */
export async function test_physical_bout_cache_build(): Promise<void> {
  const root: string = await mkdtemp(
    path.join(os.tmpdir(), "kickboxing-cache-build-"),
  );
  const source: string = path.join(root, "source");
  const destination: string = path.join(root, "dist");
  try {
    await copyBoutPhysicalArchives(source, destination);
    await mkdir(source);
    await writeFile(path.join(source, "bout.amphys"), "binary fixture");
    await assert.rejects(
      copyBoutPhysicalArchives(source, destination),
      /Incomplete optional physics archive bout/,
    );
    await writeFile(path.join(source, "bout.amphys.json"), "manifest fixture");
    await copyBoutPhysicalArchives(source, destination);
    assert.equal(
      await readFile(path.join(destination, "bout.amphys"), "utf8"),
      "binary fixture",
    );
    assert.equal(
      await readFile(path.join(destination, "bout.amphys.json"), "utf8"),
      "manifest fixture",
    );
    await assert.rejects(
      readFile(path.join(destination, "kinematic.amphys")),
      (error: unknown): boolean =>
        (error as NodeJS.ErrnoException).code === "ENOENT",
    );
  } finally {
    await rm(root, { recursive: true });
  }
}
