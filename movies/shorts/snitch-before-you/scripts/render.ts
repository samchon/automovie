import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import config from "../render.config";
import { type IAutoMovieViewerVideoResult } from "../src/integrations/render/node/IAutoMovieViewerVideoResult";
import { renderViewerVideo } from "../src/integrations/render/node/renderViewerVideo";

/**
 * Export the running viewer once and retain its actual capture/encode observations.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Render owns exact-time capture, one encode and cleanup. This command checks the actual served immutable HTML/JS before and after capture, retains the scene's actual model inputs through public prepare, and guards current production source identities. The observed Human source epoch is distinct from any later workspace library changes.
 * @evidence contracts/common.md#authoring-interface Serve the retained motion-bundle-dynamics-clearance with Vite preview on5206, set CHROME_PATH to installed Chrome, then pnpm render. The documented capture URL must serve the admitted HTML/JS bytes. Old667-source outputs are retained separately; the report proves this current-source revision only.
 */
export async function render(): Promise<void> {
  if (config.chromeExecutable.length === 0)
    throw new Error(
      "Set CHROME_PATH to an installed Chrome or Chromium executable",
    );
  const inputs: string[] = [
    "src/main.ts",
    "src/createProduction.ts",
    "src/createFlightScene.ts",
    "src/createRider.ts",
    "src/supportingPlayerDesign.ts",
    "src/createBroom.ts",
    "src/humanParameters.ts",
    "src/sampleFlight.ts",
    "src/sampleWholeFlight.ts",
    "src/sampleReleasedBroom.ts",
    "src/sampleBroomPath.ts",
    "src/sampleSupportingPath.ts",
    "src/createBallFlights.ts",
    "src/flightActions.ts",
    "src/ridingPose.ts",
    "src/riderMassProxy.ts",
    "src/motionPhase.ts",
    "src/shaftPoint.ts",
    "src/durationSeconds.ts",
    "scripts/render.ts",
    "render.config.ts",
    "index.html",
    "docs/body/screenplay/snitch-before-you.md",
  ];
  const before: Record<string, string> = await identities();
  const bundle: { files: { path: string; sha256: string }[] } = JSON.parse(
    await readFile("docs/analysis/motion-dynamics-bundle.json", "utf8"),
  );
  const servedBefore: Record<string, string> = await servedIdentities();
  let runtimeInputs: unknown;
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    ...config,
    prepare: async (page): Promise<{ audioMix?: string }> => {
      runtimeInputs = await page.evaluate((): unknown => {
        const canvas: HTMLCanvasElement | null =
          document.querySelector("#view");
        return {
          diagnostics: Reflect.get(window, "__motionDiagnostics") as unknown,
          readiness: {
            clock: document.querySelector<HTMLOutputElement>("#clock")?.value,
            width: canvas?.width,
            height: canvas?.height,
            seek: typeof Reflect.get(window, "__afSeek"),
            contextLost: canvas?.getContext("webgl2")?.isContextLost(),
            loadedMs: performance
              .getEntriesByType("navigation")
              .map(
                (entry: PerformanceEntry): number =>
                  (entry as PerformanceNavigationTiming)
                    .domContentLoadedEventEnd,
              )[0],
          },
        };
      }, undefined);
      const observed = runtimeInputs as {
        diagnostics: {
          scope?: string;
          implementationRevision?: string;
          riders?: number;
          brooms?: number;
        };
        readiness: {
          clock?: string;
          width?: number;
          height?: number;
          seek?: string;
          contextLost?: boolean;
        };
      };
      const actual = observed.diagnostics;
      if (
        actual?.scope !== "whole 0–60 second motion hint" ||
        actual.implementationRevision !==
          "visible-action-completion-held-root-clearance" ||
        actual.riders !== 14 ||
        actual.brooms !== 14
      )
        throw new Error(
          "Capture did not enter the admitted whole fourteen-rider scene revision",
        );
      const ready = observed.readiness;
      if (
        ready.clock !== "0.00 / 60.00 s" ||
        ready.width !== 720 ||
        ready.height !== 1280 ||
        ready.seek !== "function" ||
        ready.contextLost !== false
      )
        throw new Error(
          "Frozen capture page is not ready at the admitted clock/raster/context",
        );
      return {};
    },
    onProgress: (progress: {
      index: number;
      timeSeconds: number;
      bytes: number;
    }): void => {
      if (progress.index % 150 === 0) console.log(progress);
    },
  });
  const after: Record<string, string> = await identities();
  const servedAfter: Record<string, string> = await servedIdentities();
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error(
      "Production source changed during whole capture; output is not an admitted stable revision",
    );
  if (JSON.stringify(servedBefore) !== JSON.stringify(servedAfter))
    throw new Error("Served bundle changed during whole capture");
  await writeFile(
    "docs/analysis/motion-dynamics-capture.json",
    JSON.stringify(
      {
        ...result,
        captureUrl: config.url,
        servedBundle: servedBefore,
        actualInitialScene: runtimeInputs,
        productionSourceInputs: before,
        soundtrack: "none; silent motion hint",
      },
      null,
      2,
    ),
  );

  /** Bind the actual scene/camera/clock and canon bytes on both sides of capture. */
  async function identities(): Promise<Record<string, string>> {
    const values: [string, string][] = await Promise.all(
      inputs.map(
        async (path: string): Promise<[string, string]> => [
          path,
          createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        ],
      ),
    );
    return Object.fromEntries(values);
  }

  /** Match real HTTP bytes to the retained fixed bundle, not a development URL. */
  async function servedIdentities(): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const file of bundle.files) {
      const url: string =
        file.path === "index.html"
          ? config.url
          : new URL(file.path, config.url).toString();
      const response: Response = await fetch(url);
      if (!response.ok)
        throw new Error(`Frozen capture asset unavailable: ${response.status}`);
      const digest: string = createHash("sha256")
        .update(Buffer.from(await response.arrayBuffer()))
        .digest("hex");
      if (digest !== file.sha256)
        throw new Error(
          `Served capture asset differs from the admitted bundle: ${file.path}`,
        );
      result[file.path] = digest;
    }
    return result;
  }
}
void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
