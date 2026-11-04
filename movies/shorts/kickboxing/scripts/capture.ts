import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

/**
 * Capture review stills of the running Viewer at chosen film seconds.
 *
 * Usage: `ttsx scripts/capture.ts <url> <outDir> <shot...>` where each shot is
 * `seconds` (delivered camera) or `seconds@x,y,z:tx,ty,tz` (inspection camera).
 * The Viewer's own completed-seek hook places the film, so stills show exactly
 * what playback and export draw at that second.
 */
async function main(): Promise<void> {
  const [url, out, ...shots] = process.argv.slice(2);
  if (!url || !out) throw new Error("Usage: capture <url> <outDir> <shot...>");
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE,
    headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    page.on("pageerror", (error: Error): void =>
      console.error("pageerror", error.message),
    );
    await page.goto(
      `${url}${url.includes("?") ? "&" : "?"}cap=1&w=1280&h=720`,
      {
        waitUntil: "commit",
        timeout: 300_000,
      },
    );
    await page.waitForFunction(
      (): boolean => {
        const host = (
          globalThis as unknown as {
            __kickboxing?: { ready: boolean; error?: string };
          }
        ).__kickboxing;
        if (host?.error) throw new Error(host.error);
        return host?.ready === true;
      },
      undefined,
      { timeout: 600_000, polling: 500 },
    );
    let index: number = 0;
    for (const shot of shots) {
      const [time, view] = shot.split("@") as [string, string | undefined];
      await page.evaluate(async (t: number): Promise<void> => {
        await (
          globalThis as unknown as { __afSeek: (t: number) => Promise<void> }
        ).__afSeek(t);
      }, Number(time));
      if (view)
        await page.evaluate((v: string): void => {
          (
            globalThis as unknown as { __kickboxingView: (v: string) => void }
          ).__kickboxingView(v);
        }, view);
      const file: string = path.join(
        out,
        `${String(index++).padStart(2, "0")}-t${Number(time).toFixed(2)}${view ? "-close" : ""}.png`,
      );
      await writeFile(file, await page.locator("#view").screenshot());
    }
    const inspection: unknown = await page.evaluate((): unknown =>
      (
        globalThis as unknown as { __kickboxing: { inspect: () => unknown } }
      ).__kickboxing.inspect(),
    );
    await writeFile(
      path.join(out, "inspect.json"),
      JSON.stringify(inspection, null, 2),
    );
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
