import { mkdir, writeFile } from "node:fs/promises";

import config from "../render.config";
import type { IPerformancePoseFrame } from "../src/IPerformancePoseFrame";
import type { IPerformancePreparation } from "../src/IPerformancePreparation";
import { type IAutoMovieViewerVideoResult } from "../src/integrations/render/node/IAutoMovieViewerVideoResult";
import { renderViewerVideo } from "../src/integrations/render/node/renderViewerVideo";

/**
 * Export actual prepared Human frames through the installed public Render host.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Render owns exact-time browser capture, strict console/frame admission, H264 encoding and scratch cleanup. Preparation calls only this production's own readiness API, retains every actual solved state and refuses missing/failing frames. The command cannot export an unfinished held tail. A technical report is separate from moving visual acceptance.
 * @evidence contracts/common.md#authoring-interface Run the Viewer or its frozen production preview and set VIEWER_URL/CHROME_PATH as needed. Optional --duration seconds and --name semantic-name export a contiguous opening probe. Default is the whole 60-second film; unsupported extents fail. Outputs and reports are local retained artifacts, never public URLs.
 */
export async function render(): Promise<void> {
  const args: string[] = process.argv.slice(2);
  let duration: number = config.durationSeconds;
  let name: string = "film";
  for (let index: number = 0; index < args.length; index += 2) {
    if (args[index] === "--duration") duration = Number(args[index + 1]);
    else if (args[index] === "--name") name = args[index + 1] ?? "";
    else throw new Error("Unknown render argument: " + args[index]);
  }
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > config.durationSeconds ||
    !Number.isSafeInteger(duration * config.spec.frameFormat.fps) ||
    !/^[a-z][a-z0-9-]*$/.test(name)
  )
    throw new Error("Invalid render duration or semantic name");
  const chrome: string =
    config.chromeExecutable ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe";
  await mkdir("output", { recursive: true });
  await mkdir("docs/analysis/motion", { recursive: true });
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    ...config,
    chromeExecutable: chrome,
    durationSeconds: duration,
    outputPath: "output/" + name + ".mp4",
    timeoutMs: 900000,
    prepare: async (page): Promise<{}> => {
      const receipt: {
        preparation: IPerformancePreparation;
        frames: IPerformancePoseFrame[];
        state: object;
        models: object;
      } = (await page.evaluate(async (through: number) => {
        const host: Window & {
          __afWarm?: (seconds: number) => Promise<IPerformancePreparation>;
          __afExportFrames?: () => IPerformancePoseFrame[];
          __afExportModels?: () => object;
          __afInspect?: () => { implementedThrough?: number };
        } = window;
        if (
          !host.__afWarm ||
          !host.__afInspect ||
          !host.__afExportFrames ||
          (host.__afInspect().implementedThrough ?? 0) < through
        )
          throw new Error(
            "The actual controller has not implemented the requested render extent",
          );
        const preparation: IPerformancePreparation =
          await host.__afWarm(through);
        return {
          preparation,
          frames: host.__afExportFrames(),
          state: host.__afInspect(),
          models: host.__afExportModels?.() ?? {},
        };
      }, duration)) as {
        preparation: IPerformancePreparation;
        frames: IPerformancePoseFrame[];
        state: object;
        models: object;
      };
      await writeFile(
        "output/" + name + "-human-frames.json",
        JSON.stringify(receipt, null, 2),
      );
      if (receipt.preparation.failures.length !== 0)
        throw new Error(JSON.stringify(receipt.preparation.failures));
      const indices: Set<number> = new Set(
        receipt.frames.map(
          (frame: IPerformancePoseFrame): number => frame.index,
        ),
      );
      for (
        let index: number = 0;
        index < duration * config.spec.frameFormat.fps;
        index++
      )
        if (!indices.has(index))
          throw new Error("Missing prepared Human frame: " + index);
      return {};
    },
    onProgress: (progress: {
      index: number;
      timeSeconds: number;
      bytes: number;
    }): void => {
      if (progress.index % 120 === 0) console.log(progress);
    },
  });
  await writeFile(
    "output/" + name + "-capture-report.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
}
void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
