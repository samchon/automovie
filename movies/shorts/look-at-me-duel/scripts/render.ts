import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import config from "../render.config";
import { type IAutoMovieViewerVideoResult } from "../src/integrations/render/node/IAutoMovieViewerVideoResult";
import { renderViewerVideo } from "../src/integrations/render/node/renderViewerVideo";
import { motionFileDigest, motionSourceIdentity } from "./motionSourceIdentity";

/**
 * Export the running viewer once and retain its actual capture/encode observations.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Render owns completed seeks, exact1440frames, strict console/raster guards, H264 encode and owned cleanup. This command consumes the sealed whole bake through its immutable production bundle, verifies actual HTTP asset/source identities before and after capture, and prepares the actual complete scene. Scene replay separately checks current generated surfaces and cap/fragment observations. No provider or voice candidate is invoked.
 * @evidence contracts/common.md#authoring-interface Serve the sealed bundle with Vite preview on5283, optionally set VIEWER_URL/CHROME_PATH, then pnpm render. Requires docs/analysis/motion-bundle.json and admitted60second input. Writes output/film.mp4 and the actual capture receipt including silent status, models, frame hashes and source identity. The encoded film still requires full decoded inspection and independent delivery judgment.
 */
export async function render(): Promise<void> {
  if (config.chromeExecutable.length === 0)
    throw new Error(
      "Set CHROME_PATH to an installed Chrome or Chromium executable",
    );
  const bundle: {
    directory: string;
    input: { servedPath: string; sha256: string; models: unknown };
    source: Awaited<ReturnType<typeof motionSourceIdentity>>;
    files: { path: string; sha256: string }[];
  } = JSON.parse(
    await readFile("docs/analysis/motion-bundle.json", "utf8"),
  ) as typeof bundle;
  const before: Awaited<ReturnType<typeof motionSourceIdentity>> =
    await motionSourceIdentity();
  if (JSON.stringify(before) !== JSON.stringify(bundle.source))
    throw new Error(
      "Capture workspace source differs from the sealed whole-film epoch",
    );
  const captureCode: string[] = [
    "scripts/render.ts",
    "scripts/motionSourceIdentity.ts",
    "render.config.ts",
    "index.html",
  ];
  const codeBefore: [string, string][] = await Promise.all(
    captureCode.map(
      async (file: string): Promise<[string, string]> => [
        file,
        await motionFileDigest(file),
      ],
    ),
  );
  const url: URL = new URL(config.url);
  for (const [name, value] of Object.entries({
    capture: "1",
    w: "720",
    h: "1280",
    performanceEnd: "60",
    fixedFilm: "/" + bundle.input.servedPath,
    fixedFilmSha: bundle.input.sha256,
  }))
    url.searchParams.set(name, value);
  /** Verify real served bytes instead of assuming a port contains the sealed revision. */
  async function served(): Promise<Record<string, string>> {
    const values: Record<string, string> = {};
    for (const file of bundle.files) {
      const response: Response = await fetch(
        new URL(file.path === "index.html" ? "/" : "/" + file.path, url),
      );
      if (!response.ok)
        throw new Error(
          `Capture asset unavailable:${file.path}/${response.status}`,
        );
      const hash: string = createHash("sha256")
        .update(Buffer.from(await response.arrayBuffer()))
        .digest("hex");
      if (hash !== file.sha256)
        throw new Error(`Served capture revision mismatch:${file.path}`);
      values[file.path] = hash;
    }
    return values;
  }
  const servedBefore: Record<string, string> = await served();
  let initialScene: unknown;
  await mkdir("output", { recursive: true });
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    ...config,
    url: url.href,
    timeoutMs: 480000,
    maxFrames: 1440,
    maxFrameBytes: 128 * 1024 * 1024,
    prepare: async (page): Promise<Record<string, never>> => {
      initialScene = await page.evaluate(
        async (_argument: null): Promise<object> => {
          const prepare: unknown = Reflect.get(window, "__afPrepare");
          const inspect: unknown = Reflect.get(window, "__duelInspection");
          if (typeof prepare !== "function" || typeof inspect !== "function")
            throw new Error("Whole scene capture ports missing");
          await prepare();
          const scene: {
            prepared: boolean;
            admitted: boolean;
            implementedUntil: number;
            models: unknown;
          } = inspect();
          const canvas: HTMLCanvasElement | null =
            document.querySelector("#view");
          if (
            !scene.prepared ||
            !scene.admitted ||
            scene.implementedUntil !== 60 ||
            canvas?.width !== 720 ||
            canvas?.height !== 1280 ||
            canvas.getContext("webgl2")?.isContextLost() !== false
          )
            throw new Error(
              "Actual whole scene/raster/context is not ready for capture",
            );
          return {
            scene,
            clock: document.querySelector<HTMLOutputElement>("#clock")?.value,
            width: canvas.width,
            height: canvas.height,
          };
        },
        null,
      );
      const actual: { scene: { models: unknown }; clock?: string } =
        initialScene as typeof actual;
      if (
        JSON.stringify(actual.scene.models) !==
          JSON.stringify(bundle.input.models) ||
        actual.clock !== "0.00 / 60.00 s"
      )
        throw new Error(
          "Capture model or initial clock differs from the admitted whole bake",
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
  const after: Awaited<ReturnType<typeof motionSourceIdentity>> =
    await motionSourceIdentity();
  const codeAfter: [string, string][] = await Promise.all(
    captureCode.map(
      async (file: string): Promise<[string, string]> => [
        file,
        await motionFileDigest(file),
      ],
    ),
  );
  const servedAfter: Record<string, string> = await served();
  if (
    JSON.stringify(before) !== JSON.stringify(after) ||
    JSON.stringify(codeBefore) !== JSON.stringify(codeAfter) ||
    JSON.stringify(servedBefore) !== JSON.stringify(servedAfter)
  )
    throw new Error("Capture inputs changed; preserve this unadmitted output");
  await writeFile(
    "docs/analysis/motion-capture.json",
    JSON.stringify(
      {
        ...result,
        captureUrl: url.href,
        bundleDirectory: bundle.directory,
        servedFiles: servedBefore,
        source: before,
        captureCode: codeBefore,
        initialScene,
        soundtrack:
          "none; silent deterministic motion hint with English captions",
        retention: "locally-retained-only; no verified archive",
      },
      null,
      2,
    ) + "\n",
  );
}
void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
