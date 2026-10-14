import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_HORSE } from "../src/DEFAULT_HORSE";
import { buildHorse } from "../src/buildHorse";

/**
 * Serialize the default stick-horse AST to `.shots/knight/horse.glb` with the existing Node exporter. The caller owns this static rest artifact; no file readback or appearance check occurs here. Failed building, encoding or writing rejects the invocation and the CLI sets exitCode 1.
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildHorse> = buildHorse(DEFAULT_HORSE);
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  const dir: string = resolve(import.meta.dirname, "../../../.shots/knight");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "horse.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
