/* eslint-disable no-console */
import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Browser, type Page, chromium } from "playwright-core";

import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";

/** Time a page may take to load and draw its first frame, milliseconds: a fresh dev server transforms every module of the page on its first load. */
const COLD_LOAD: number = 300_000;

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

  /**
   * Views to capture, each a preset name or angles; omitted, every preset. The page admits each view and refuses the capture with every finding.
   */
  views?: (
    | string
    | { azimuth: number; elevation: number; margin?: number; focus?: string }
  )[];

  /** Scales to capture; omitted, `whole` and `close`. */
  scales?: string[];

  /** Bone a close-up frames with its descendants; omitted, `head`. */
  focus?: string;

  /** Part ids to hide. */
  hidden?: string[];

  /** Skin assembly, `parts` or `joined`; omitted, the page's current one. */
  assembly?: "parts" | "joined";

  /** Hand generator, the profile's or the swap demonstration's paddle; omitted, the page's current one. */
  hand?: "profile" | "paddle";
}

/**
 * Capture the Human page's views for one or more people on a hardware WebGL renderer.
 *
 * Usage: `pnpm human:capture -- [--people people.json] [--name n] [--views front,left] [--scales whole,close] [--focus head] [--base url] [--chrome path]`. Without `--people` it captures the page's default person under `--name`.
 *
 * Views. Fourteen presets, captured in this order when no views are given: the turntable `front`, `frontLeft`, `left`, `backLeft`, `back`, `backRight`, `right`, `frontRight` (every 45 degrees toward the subject's left); the obliques `frontLeftHigh` and `backRightHigh` (35 degrees above) and `frontRightLow` and `backLeftLow` (25 degrees below); and `top` and `below`. A people file may also give any direction as an object `{"azimuth": 120, "elevation": -15}` in degrees: azimuth 0 is the front, 90 the subject's left, 180 the back, 270 the right; elevation is above the horizontal, -90 to 90. It may add `"margin"` (framing scale, at least 1, 1 touching the frame edge) and `"focus"` (a bone; the view is then captured once, close on that bone, whatever the scales). For example `"views": ["front", {"azimuth": 120, "elevation": -15, "focus": "leftUpperLeg"}]`. An angle view's file is named `az<azimuth>_el<elevation>`, such as `ana-close-leftUpperLeg-az120_el-15.png`. `--views` on the command line takes preset names only. Each person is loaded through the page's own `window.__automovieHuman` API, the same documents and admission the controls use, and captured by the page's capture action, which writes PNGs to `.shots/output` and metadata (source commit, document hash, renderer, views) to `.shots/captures/<name>.json`. The run refuses a software renderer. A dev server at `--base` is reused, or one is started for the run and stopped after; pass a free port to get a fresh one. A started server is a snapshot: it neither watches files nor reloads the page, so another edit or build cannot interrupt the run, and it serves the code as it stood when it started. Its first load transforms every module of the page, so the page may take minutes to draw its first frame.
 */
const main = async (): Promise<void> => {
  const flags: Map<string, string> = new Map();
  const argv: string[] = process.argv
    .slice(2)
    .filter((a: string): boolean => a !== "--");
  for (let i: number = 0; i < argv.length; i += 2)
    flags.set(argv[i]!.replace(/^--/, ""), argv[i + 1] ?? "");
  const base: string = (flags.get("base") ?? "http://127.0.0.1:5173").replace(
    /\/+$/,
    "",
  );
  const list = (key: string): string[] | undefined =>
    flags
      .get(key)
      ?.split(",")
      .filter((s: string): boolean => s.length !== 0);
  const people: IPerson[] = flags.has("people")
    ? (JSON.parse(fs.readFileSync(flags.get("people")!, "utf8")) as IPerson[])
    : [{ name: flags.get("name") ?? "human" }];
  for (const person of people) {
    person.views ??= list("views");
    person.scales ??= list("scales");
    person.focus ??= flags.get("focus");
  }

  const server: ChildProcess | null = (await responds(base))
    ? null
    : await startServer(base);
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      executablePath:
        flags.get("chrome") ?? process.env.CHROME ?? DEFAULT_CHROME_EXECUTABLE,
      headless: true,
    });
    const page: Page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (error: Error): void =>
      console.error(`page error: ${error.message}`),
    );
    const loading: number = Date.now();
    await page.goto(`${base}/human.html`, {
      timeout: COLD_LOAD,
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      (): boolean => ((window as any).__automovieHuman?.frames() ?? 0) > 0,
      null,
      { timeout: COLD_LOAD },
    );
    console.log(`page ready in ${((Date.now() - loading) / 1000).toFixed(1)} s`);
    const renderer: string = await page.evaluate(
      (): string => (window as any).__automovieHuman.renderer,
    );
    console.log(`renderer: ${renderer}`);
    if (SOFTWARE.test(renderer))
      throw new Error(`refusing a software renderer: ${renderer}`);
    for (const person of people) {
      const loaded: boolean = await page.evaluate(
        (p: { person: IPerson; session: unknown }): boolean => {
          const api: any = (window as any).__automovieHuman;
          if (p.person.assembly !== undefined)
            api.setAssembly(p.person.assembly);
          if (p.person.hand !== undefined) api.setHand(p.person.hand);
          const ok: boolean =
            p.session !== null
              ? api.load(p.session)
              : p.person.traits !== undefined
                ? api.loadTraits({
                    traits: p.person.traits,
                    statureScale: p.person.statureScale,
                  })
                : true;
          api.setHidden(p.person.hidden ?? []);
          return ok;
        },
        {
          person,
          session:
            person.session === undefined
              ? null
              : JSON.parse(fs.readFileSync(person.session, "utf8")),
        },
      );
      if (!loaded)
        throw new Error(
          `${person.name} refused:\n${await page.evaluate((): string => (window as any).__automovieHuman.error())}`,
        );
      const result: { files: string[]; metadata: string } = await page.evaluate(
        (p: IPerson): Promise<{ files: string[]; metadata: string }> =>
          (window as any).__automovieHuman.capture({
            name: p.name,
            views: p.views,
            scales: p.scales,
            focus: p.focus,
          }),
        person,
      );
      console.log(
        `${person.name}: ${result.files.length} views, metadata ${path.relative(process.cwd(), result.metadata)}`,
      );
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
  const root: string = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
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
    // a snapshot server: no file watching and no hot reload, so another edit or build cannot reload the page during the run
    {
      cwd: root,
      stdio: "ignore",
      env: { ...process.env, AUTOMOVIE_CAPTURE: "1" },
    },
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
