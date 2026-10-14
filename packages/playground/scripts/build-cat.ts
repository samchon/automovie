import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_CAT } from "../src/DEFAULT_CAT";
import { buildCat } from "../src/buildCat";

/**
 * Serialize the default stick-cat AST to `.shots/cat/cat.glb` with the existing Node exporter. This writes a static rest model and does not read the file back or inspect its appearance. Builder/export/filesystem failures reject the invocation; the CLI reports them and sets exitCode 1.
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildCat> = buildCat(DEFAULT_CAT);
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  // This output is a derivative of the viewer's authored model.
  const dir: string = resolve(import.meta.dirname, "../../../.shots/cat");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "cat.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
