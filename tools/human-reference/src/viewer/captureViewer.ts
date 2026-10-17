import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { writeArtifact } from "../io/writeArtifact.ts";
import type { CaptureView } from "./CaptureView.ts";

interface ViewerPage {
  runtimeManifest: { id: string; inputs: { gate: string; pose: string } };
  inspection?: object;
  uiBusy?: boolean;
  gpu: { renderer: string; vendor: string };
  loadMesh: (gate: string, pose: string) => Promise<unknown>;
  loadLines: (gate: string, region: string, pose: string) => Promise<unknown>;
  setComparison: (mode: boolean) => void;
  setNormalMode: (mode: CaptureView["normalMode"]) => void;
  captureAutoMovieReference: () => {
    dataUrl: string;
    width: number;
    height: number;
    mimeType: string;
  };
  renderView: (
    view: CaptureView & {
      gate: string;
      region: string;
      pose: string;
      view: string;
      note: string;
    },
  ) => Record<string, unknown>;
}
interface CapturePage {
  goto: (url: string) => Promise<unknown>;
  waitForFunction: (
    fn: () => boolean,
    argument: undefined,
    options: { timeout: number },
  ) => Promise<unknown>;
  addStyleTag: (options: { content: string }) => Promise<unknown>;
  evaluate: <Result, Argument>(
    fn: (argument: Argument) => Result | Promise<Result>,
    argument: Argument,
  ) => Promise<Result>;
  screenshot: (options: { path: string }) => Promise<unknown>;
}
interface CaptureBrowser {
  newPage: (options: {
    viewport: { width: number; height: number };
    deviceScaleFactor: number;
  }) => Promise<CapturePage>;
  close: () => Promise<void>;
}

/**
 * Captures one immutable comparison through the original viewer snapshot API on an owned hardware browser page.
 *
 * @evidence contracts/common.md#principled-implementation Loads the declared viewer, admits its hardware renderer and invokes its original composite capture after setting the matched view.
 * @evidence contracts/common.md#clear-and-simple-design Browser acquisition, camera application, image publication and source provenance stay explicit in one capture owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Primary PNG bytes come from captureViewerSnapshot rather than a replacement renderer or copied source shading.
 * @evidence contracts/common.md#meaningful-documentation The comment states dedicated browser ownership, caller-supplied module resolution and preservation of successful frames.
 * @evidence contracts/performance.md#efficient-algorithms Work follows requested views, actual rendering and encoded pixels; one browser page is reused across this job.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the immutable loaded runtime and camera protocol while each image receives its own original draw and encoding effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned browser closes on every exit; successful per-frame artifacts survive later failures and the output directory remains caller-owned.
 */
export async function captureViewer(options: {
  url: string;
  playwright: string;
  output: string;
  views: CaptureView[];
  cameraSource?: { file: string; sha256: string };
  construction?: boolean;
}): Promise<void> {
  const views: CaptureView[] = structuredClone(options.views);
  const origin: URL = new URL(options.url);
  origin.searchParams.set("panels", options.construction ? "4" : "2");
  if (origin.hostname !== "127.0.0.1" || origin.protocol !== "http:")
    throw new Error("Capture requires its local viewer URL");
  for (const view of views) {
    if (!(view.normalMode === "derived" || view.normalMode === "flat"))
      throw new Error("Capture normals must come from each mesh geometry");
    if (
      !/^[A-Za-z0-9_.-]+$/.test(view.name) ||
      !Number.isFinite(view.azimuth) ||
      !Number.isFinite(view.elevation) ||
      (view.span !== undefined &&
        (!Number.isFinite(view.span) || view.span <= 0))
    )
      throw new Error("Invalid capture view");
    if (
      view.focus &&
      (view.focus.length !== 3 ||
        view.focus.some(
          (coordinate: number): boolean => !Number.isFinite(coordinate),
        ))
    )
      throw new Error("Invalid capture focus");
  }
  fs.mkdirSync(options.output, { recursive: true });
  const root: string = fs.realpathSync(options.output);
  const cameraManifest: { path: string; sha256: string } = writeArtifact(
    root,
    "camera-manifest.json",
    { source: options.cameraSource ?? null, views },
  );
  const module: {
    chromium: {
      launch: (options: {
        channel: string;
        headless: boolean;
        args: string[];
      }) => Promise<CaptureBrowser>;
    };
  } = await import(pathToFileURL(path.resolve(options.playwright)).href);
  const browser: CaptureBrowser = await module.chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
  });
  const viewport: { width: number; height: number } = {
    width: options.construction ? 2560 : 1280,
    height: 1080,
  };
  const frames: object[] = [];
  let completed: boolean = false;
  try {
    const page: CapturePage = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
    });
    await page.goto(origin.href);
    await page.waitForFunction(
      (): boolean => {
        const viewer: ViewerPage = window as unknown as ViewerPage;
        return !!viewer.inspection && !viewer.uiBusy;
      },
      undefined,
      { timeout: 120000 },
    );
    await page.addStyleTag({ content: "#tools{display:none}" });
    const runtime: ViewerPage["runtimeManifest"] = await page.evaluate(
      (): ViewerPage["runtimeManifest"] =>
        (window as unknown as ViewerPage).runtimeManifest,
      undefined,
    );
    await page.evaluate(
      async (
        identity: ViewerPage["runtimeManifest"]["inputs"],
      ): Promise<void> => {
        const viewer: ViewerPage = window as unknown as ViewerPage;
        await viewer.loadMesh(identity.gate, identity.pose);
        viewer.setComparison(true);
        await viewer.loadLines(identity.gate, "wholebody", identity.pose);
      },
      runtime.inputs,
    );
    const gpu: ViewerPage["gpu"] = await page.evaluate(
      (): ViewerPage["gpu"] => (window as unknown as ViewerPage).gpu,
      undefined,
    );
    if (
      /software|swiftshader|llvmpipe|basic render/i.test(
        `${gpu.renderer} ${gpu.vendor}`,
      )
    )
      throw new Error("Actual hardware renderer is required");
    for (const view of views) {
      const metadata: Record<string, unknown> = await page.evaluate(
        (request: {
          view: CaptureView;
          identity: ViewerPage["runtimeManifest"]["inputs"];
        }): Record<string, unknown> => {
          const viewer: ViewerPage = window as unknown as ViewerPage;
          viewer.setNormalMode(request.view.normalMode);
          return viewer.renderView({
            ...request.view,
            ...request.identity,
            region: "wholebody",
            view: request.view.name,
            note: "원본(왼쪽) vs 독립 곡선 재생 표면(오른쪽). 생성 곡선은 별도 진단 화면에 표시합니다. 관측 비교이며 최종 Human 완료 증거가 아닙니다.",
          });
        },
        { view, identity: runtime.inputs },
      );
      const image: string = path.join(root, `${view.name}.png`);
      if (fs.existsSync(image))
        throw new Error(`Capture output already exists: ${view.name}`);
      const before: string = new Date().toISOString();
      const snapshot: ReturnType<ViewerPage["captureAutoMovieReference"]> =
        await page.evaluate(
          (): ReturnType<ViewerPage["captureAutoMovieReference"]> =>
            (window as unknown as ViewerPage).captureAutoMovieReference(),
          undefined,
        );
      if (
        !snapshot.dataUrl.startsWith("data:image/png;base64,") ||
        snapshot.mimeType !== "image/png"
      )
        throw new Error("Original viewer capture did not encode PNG");
      fs.writeFileSync(
        image,
        Buffer.from(
          snapshot.dataUrl.slice("data:image/png;base64,".length),
          "base64",
        ),
        { flag: "wx" },
      );
      await page.screenshot({
        path: path.join(root, `${view.name}-context.png`),
      });
      const after: string = new Date().toISOString();
      const frame: object = {
        image,
        view,
        viewport,
        cameraManifest,
        captureBracket: { before, after },
        runtime,
        gpu,
        metadata,
        viewerSnapshot: {
          width: snapshot.width,
          height: snapshot.height,
          mimeType: snapshot.mimeType,
        },
      };
      writeArtifact(root, `${view.name}.json`, frame);
      frames.push(frame);
    }
    completed = true;
  } finally {
    await browser.close();
    writeArtifact(root, "capture-manifest.json", { completed, frames });
  }
}
