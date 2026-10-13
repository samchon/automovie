import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_CAT } from "../src/DEFAULT_CAT";
import { buildCat } from "../src/buildCat";

/**
 * Generate `cat.glb` from the stick-cat AST: the quadruped counterpart to
 * {@link build-stickman}. Same `exportModelToGLB` round-trip: the very model the
 * viewer renders, serialized to a standalone binary glTF at rest. Re-run (`pnpm
 * build:cat`) after changing the cat's proportions.
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildCat> = buildCat(DEFAULT_CAT);
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  // Derived artifact (the viewer renders from the AST), regenerable scratch.
  const dir: string = resolve(__dirname, "../../../.shots/cat");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "cat.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(__filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
