import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_HORSE } from "../src/DEFAULT_HORSE";
import { buildHorse } from "../src/buildHorse";

/**
 * Generate `horse.glb` from the stick-horse AST (the mount). Same
 * `exportModelToGLB` round-trip as the other builders (`pnpm build:horse`).
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildHorse> = buildHorse(DEFAULT_HORSE);
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  const dir: string = resolve(__dirname, "../../../.shots/knight");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "horse.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(__filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
