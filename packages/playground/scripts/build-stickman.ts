import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_STICKMAN } from "../src/DEFAULT_STICKMAN";
import { buildStickman } from "../src/buildStickman";

/**
 * Serialize the default stick-figure AST to `.shots/human/stickman.glb` through `@automovie/render/node`. The exporter writes static rest geometry, with its documented skin/texture omissions; this script performs no import round trip or visual verification. Build/export/write failures reject and the CLI reports the exact cause while setting exitCode 1.
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildStickman> =
    buildStickman(DEFAULT_STICKMAN);
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  // The glb is a derived artifact: the viewer renders from the AST, so this is
  // regenerable scratch (like the screenshots), not committed source.
  const dir: string = resolve(import.meta.dirname, "../../../.shots/human");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "stickman.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
