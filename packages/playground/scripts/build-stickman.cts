import { exportModelToGLB } from "@automovie/render/node";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEFAULT_STICKMAN } from "../src/DEFAULT_STICKMAN";
import { buildStickman } from "../src/buildStickman";

/**
 * Generate `stickman.glb` from the stick-figure AST.
 *
 * The canonical demonstration of `@automovie/render/node`'s `exportModelToGLB`
 * round-trip: the same `IAutoMovieModel` the viewer renders is serialized to a
 * standalone binary glTF (rest / T-pose) any glTF tool, or automovie's own
 * ingest, can load. Re-run (`pnpm build:stickman`) after changing the figure's
 * proportions.
 *
 * @author Samchon
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const { model }: ReturnType<typeof buildStickman> = buildStickman(DEFAULT_STICKMAN);
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(model);
  // The glb is a derived artifact: the viewer renders from the AST, so this is
  // regenerable scratch (like the screenshots), not committed source.
  const dir: string = resolve(__dirname, "../../../.shots/human");
  mkdirSync(dir, { recursive: true });
  const out: string = resolve(dir, "stickman.glb");
  writeFileSync(out, glb);
  console.log(`wrote ${out} (${glb.length} bytes)`);
};

if (resolve(process.argv[1] ?? "") === resolve(__filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
