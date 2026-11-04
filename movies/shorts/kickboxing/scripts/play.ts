import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

/**
 * Press Play in the real Viewer and watch the clock: logs displayed time, refusals
 * and page errors every half second, optionally recording the page as video.
 *
 * Usage: `ttsx scripts/play.ts <url> <seconds> [videoDir]`.
 */
async function main(): Promise<void> {
  const [url, duration, videoDir] = process.argv.slice(2);
  if (!url || !duration)
    throw new Error("Usage: play <url> <seconds> [videoDir]");
  if (videoDir) await mkdir(videoDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE,
    headless: true,
    args: [
      "--use-angle=d3d11",
      "--enable-gpu",
      "--ignore-gpu-blocklist",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      ...(videoDir
        ? { recordVideo: { dir: videoDir, size: { width: 1280, height: 900 } } }
        : {}),
    });
    const page = await context.newPage();
    page.on("pageerror", (error: Error): void =>
      console.log("pageerror", error.message),
    );
    page.on("console", (message): void => {
      if (message.type() === "error")
        console.log("console.error", message.text().slice(0, 300));
    });
    await page.goto(url, { waitUntil: "commit", timeout: 300_000 });
    await page.waitForFunction(
      (): boolean =>
        (globalThis as unknown as { __kickboxing?: { ready: boolean } })
          .__kickboxing?.ready === true,
      undefined,
      { timeout: 600_000, polling: 500 },
    );
    await page.click("#play");
    const started: number = Date.now();
    while (Date.now() - started < Number(duration) * 1000) {
      await page.waitForTimeout(500);
      const state = await page.evaluate((): unknown => ({
        time: (document.getElementById("time") as HTMLOutputElement).value,
        error:
          (globalThis as unknown as { __kickboxing: { error?: string } })
            .__kickboxing.error ?? null,
        motionMs: (
          globalThis as unknown as {
            __kickboxing: {
              inspect: () => { film?: { lastMotionMs: number } };
            };
          }
        ).__kickboxing.inspect().film?.lastMotionMs,
      }));
      console.log(
        ((Date.now() - started) / 1000).toFixed(1),
        JSON.stringify(state),
      );
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
