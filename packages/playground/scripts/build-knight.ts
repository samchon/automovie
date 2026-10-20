import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildKnight } from "../src/buildKnight";

/**
 * Serialize the knight rider AST to `.shots/knight/knight.glb` through the existing Node exporter. The returned bytes and their file describe static rest geometry; this operation performs no readback or appearance check. The CLI reports a rejected build/export/write and sets exitCode 1.
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildKnight> = buildKnight();
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  const dir: string = resolve(import.meta.dirname, "../../../.shots/knight");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "knight.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
