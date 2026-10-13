import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildKnight } from "../src/buildKnight";

/**
 * Generate `knight.glb` from the knight rider AST. Same `exportModelToGLB`
 * round-trip as the other builders (`pnpm build:knight`).
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildKnight> = buildKnight();
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  const dir: string = resolve(__dirname, "../../../.shots/knight");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "knight.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(__filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
