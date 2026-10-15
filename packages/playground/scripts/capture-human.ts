/* eslint-disable no-console */
import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Browser, type Page, chromium } from "playwright-core";

import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";

/** Renderer strings of software rasterizers, which do not count as hardware. */
const SOFTWARE: RegExp = /swiftshader|llvmpipe|software|basic render|warp/i;

/** One person to capture. */
interface IPerson {
  /** Capture name, the prefix of every file. */
  name: string;

  /** Traits to convert, as `IAutoMovieHumanTraits`. */
  traits?: unknown;

  /** Multiplier on the converter's median stature for these traits. */
  statureScale?: number;

  /** Path of a saved session file to resume instead of traits. */
  session?: string;

  /** Views to capture; omitted, all eight. */
  views?: string[];

  /** Scales to capture; omitted, `whole` and `close`. */
  scales?: string[];

  /** Bone a close-up frames with its descendants; omitted, `head`. */
  focus?: string;

  /** Part ids to hide. */
  hidden?: string[];
}

/**
 * Capture the Human page's preset views for one or more people on a hardware WebGL renderer.
 *
 * Usage: `pnpm human:capture -- [--people people.json] [--name n] [--views front,left] [--scales whole,close] [--focus head] [--base url] [--chrome path]`. Without `--people` it captures the page's default person under `--name`. Each person is loaded through the page's own `window.__automovieHuman` API, the same documents and admission the controls use, and captured by the page's capture action, which writes PNGs to `.shots/output` and metadata (source commit, document hash, renderer, views) to `.shots/captures/<name>.json`. The run refuses a software renderer. A dev server at `--base` is reused, or one is started for the run and stopped after.
 */
const main = async (): Promise<void> => {
  const flags: Map<string, string> = new Map();
  const argv: string[] = process.argv.slice(2).filter((a: string): boolean => a !== "--");
  for (let i: number = 0; i < argv.length; i += 2) flags.set(argv[i]!.replace(/^--/, ""), argv[i + 1] ?? "");
  const base: string = (flags.get("base") ?? "http://127.0.0.1:5173").replace(/\/+$/, "");
  const list = (key: string): string[] | undefined => flags.get(key)?.split(",").filter((s: string): boolean => s.length !== 0);
  const people: IPerson[] = flags.has("people")
    ? (JSON.parse(fs.readFileSync(flags.get("people")!, "utf8")) as IPerson[])
    : [{ name: flags.get("name") ?? "human" }];
  for (const person of people) {
    person.views ??= list("views");
    person.scales ??= list("scales");
    person.focus ??= flags.get("focus");
  }

  const server: ChildProcess | null = (await responds(base)) ? null : await startServer(base);
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      executablePath: flags.get("chrome") ?? process.env.CHROME ?? DEFAULT_CHROME_EXECUTABLE,
      headless: true,
    });
    const page: Page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    page.on("pageerror", (error: Error): void => console.error(`page error: ${error.message}`));
    await page.goto(`${base}/human.html`);
    await page.waitForFunction(
      (): boolean => ((window as any).__automovieHuman?.frames() ?? 0) > 0,
      null,
      { timeout: 60_000 },
    );
    const renderer: string = await page.evaluate((): string => (window as any).__automovieHuman.renderer);
    console.log(`renderer: ${renderer}`);
    if (SOFTWARE.test(renderer)) throw new Error(`refusing a software renderer: ${renderer}`);
    for (const person of people) {
      const loaded: boolean = await page.evaluate(
        (p: { person: IPerson; session: unknown }): boolean => {
          const api: any = (window as any).__automovieHuman;
          const ok: boolean =
            p.session !== null
              ? api.load(p.session)
              : p.person.traits !== undefined
                ? api.loadTraits({ traits: p.person.traits, statureScale: p.person.statureScale })
                : true;
          api.setHidden(p.person.hidden ?? []);
          return ok;
        },
        {
          person,
          session: person.session === undefined ? null : JSON.parse(fs.readFileSync(person.session, "utf8")),
        },
      );
      if (!loaded) throw new Error(`${person.name} refused:\n${await page.evaluate((): string => (window as any).__automovieHuman.error())}`);
      const result: { files: string[]; metadata: string } = await page.evaluate(
        (p: IPerson): Promise<{ files: string[]; metadata: string }> =>
          (window as any).__automovieHuman.capture({ name: p.name, views: p.views, scales: p.scales, focus: p.focus }),
        person,
      );
      console.log(`${person.name}: ${result.files.length} views, metadata ${path.relative(process.cwd(), result.metadata)}`);
      for (const file of result.files) console.log(`  ${file}`);
    }
  } finally {
    await browser?.close();
    server?.kill();
  }
};

/** Whether a server answers at the base URL. */
const responds = async (base: string): Promise<boolean> => {
  try {
    return (await fetch(`${base}/human.html`)).ok;
  } catch {
    return false;
  }
};

/** Start the playground's dev server on the base URL's port and wait until it answers. The package is an ES module, so its directory comes from `import.meta.url`; `__dirname` does not exist there. */
const startServer = async (base: string): Promise<ChildProcess> => {
  const root: string = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const child: ChildProcess = spawn(
    process.execPath,
    [
      path.join(root, "node_modules", "vite", "bin", "vite.js"),
      "--clearScreen",
      "false",
      "--port",
      new URL(base).port || "80",
      "--strictPort",
    ],
    { cwd: root, stdio: "ignore" },
  );
  for (let i: number = 0; i < 120; ++i) {
    if (await responds(base)) return child;
    await new Promise((resolve: (value: unknown) => void): void => {
      setTimeout(resolve, 500);
    });
  }
  child.kill();
  throw new Error(`dev server did not answer at ${base}`);
};

main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
