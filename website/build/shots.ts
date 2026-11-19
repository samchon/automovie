// Take screenshots of pages with a headless browser, for looking at the site.
//
//   pnpm run shots [--width 1440] [--height 900] [--dark] [--wait 4000]
//     [--full] [--scroll] [--reduced] [--expect <css>]... name=url [name=url ...]
//
// Each page is opened headless, left `--wait` milliseconds after its load
// event so the 3D view has drawn, and saved as `.shots/<name>.png`, which git
// ignores. Console errors, failed requests and `--expect` selectors that
// match nothing are printed per page, and the process exits 1 when any page
// had one. `--scroll` scrolls each page to its end and back first, so what
// a page reveals on scrolling is drawn in a `--full` screenshot.
import fs from "node:fs";
import path from "node:path";
import {
  type Browser,
  type BrowserContext,
  type Page,
  chromium,
} from "playwright-core";

/** What the command line asks for. */
interface IOptions {
  /** Viewport width, pixels. */
  width: number;

  /** Viewport height, pixels. */
  height: number;

  /** Whether the browser prefers the dark colour scheme. */
  dark: boolean;

  /** Milliseconds waited after the load event. */
  wait: number;

  /** Whether the whole scrolled page is saved, not the viewport alone. */
  full: boolean;

  /** Whether each page is scrolled to its end and back before the screenshot. */
  scroll: boolean;

  /** Whether the browser asks for reduced motion. */
  reduced: boolean;

  /** Selectors each page must match at least once. */
  expect: string[];
}

const options: IOptions = {
  width: 1440,
  height: 900,
  dark: false,
  wait: 4000,
  full: false,
  scroll: false,
  reduced: false,
  expect: [],
};
const pages: { name: string; url: string }[] = [];
const argv: string[] = process.argv.slice(2);
for (let i: number = 0; i < argv.length; i++) {
  const arg: string = argv[i]!;
  if (arg === "--dark") options.dark = true;
  else if (arg === "--full") options.full = true;
  else if (arg === "--scroll") options.scroll = true;
  else if (arg === "--reduced") options.reduced = true;
  else if (arg === "--width") options.width = Number(argv[++i]);
  else if (arg === "--height") options.height = Number(argv[++i]);
  else if (arg === "--wait") options.wait = Number(argv[++i]);
  else if (arg === "--expect") options.expect.push(argv[++i]!);
  else {
    const at: number = arg.indexOf("=");
    pages.push({ name: arg.slice(0, at), url: arg.slice(at + 1) });
  }
}

const main = async (): Promise<void> => {
  const out: string = path.resolve(__dirname, "..", ".shots");
  fs.mkdirSync(out, { recursive: true });
  const browser: Browser = await chromium.launch({
    headless: true,

    // A software WebGL backend, so the 3D views draw without a GPU.
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  let failed: boolean = false;
  try {
    for (const { name, url } of pages) {
      const context: BrowserContext = await browser.newContext({
        viewport: { width: options.width, height: options.height },
        colorScheme: options.dark ? "dark" : "light",
        reducedMotion: options.reduced ? "reduce" : "no-preference",
      });
      const page: Page = await context.newPage();
      const problems: string[] = [];
      page.on("console", (message): void => {
        if (message.type() === "error")
          problems.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error: Error): void => {
        problems.push(`error: ${error.message}`);
      });
      page.on("requestfailed", (request): void => {
        problems.push(
          `failed: ${request.url()} ${request.failure()?.errorText ?? ""}`,
        );
      });
      page.on("response", (response): void => {
        if (response.status() >= 400)
          problems.push(`status ${response.status()}: ${response.url()}`);
      });
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
      await page.waitForTimeout(options.wait);
      if (options.scroll) {
        const height: number = await page.evaluate(
          (): number => document.documentElement.scrollHeight,
        );
        for (let y: number = 0; y < height; y += options.height / 2) {
          await page.evaluate((top: number): void => window.scrollTo(0, top), y);
          await page.waitForTimeout(250);
        }
        await page.evaluate((): void => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      }
      for (const selector of options.expect)
        if ((await page.locator(selector).count()) === 0)
          problems.push(`missing: ${selector}`);
      const file: string = path.join(out, `${name}.png`);
      await page.screenshot({ path: file, fullPage: options.full });
      console.log(`${name}: ${file}`);
      for (const problem of problems) console.log(`  ${problem}`);
      if (problems.length !== 0) failed = true;
      await context.close();
    }
  } finally {
    await browser.close();
  }
  process.exit(failed ? 1 : 0);
};
void main();
