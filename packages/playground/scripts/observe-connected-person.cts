/* eslint-disable no-console */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type Download, type Page, chromium } from "playwright-core";

import { DEFAULT_CHROME_EXECUTABLE } from "./chromeExecutable";

/**
 * Drive the real connected person editor through a list of user actions and
 * record what the page shows after each one. It is an observation tool of the
 * product path: it asserts nothing and holds no expected value. The record is
 * read by a person or compared with another record of the same steps.
 *
 * Usage, from `packages/playground` with the page already served:
 *
 *   pnpm observe:person -- <record.json> [base=URL] [head=URL body=URL]
 *     [wait=SECONDS] [note=TEXT] <step>...
 *
 * `head` and `body` select a caller-owned typed source pair, as the page's own
 * source form does. Each step is one action, run in order:
 *
 * - `load=FILE` opens a person document through Load document;
 * - `text=FILE` puts the file's text in Complete document and applies it;
 * - `set=PATH:NUMBER` applies one input catalogue row, and `remove=PATH`
 *   removes it; `PATH` is the row's document path with `/` between segments;
 * - `click=undo|redo|reset|discard|save|glb` presses that toolbar button.;
 * - `wait` does nothing and records the page once it has settled.
 *
 * After each step the tool waits until the status line no longer says an
 * intent is pending, at most `wait` seconds, and records the status line and
 * its state, which buttons are disabled, the working document text, the
 * admission report as displayed, the files the page downloaded (saved beside
 * the record with their SHA-256) and the time the step took. The first entry
 * is the page as it stands once its controls are mounted, before the first
 * build settles; pass a step right away to act during that build.
 *
 * Set `CHROME` to the browser to launch; a GPU-backed Chromium is needed for
 * the page to draw. The record states the renderer the page reported.
 */
interface IPersonPageState {
  status: string | null;
  state: string | null;
  disabled: Record<string, boolean>;
  document: string | null;
  admission: string | null;
  unapplied: string | null;
}

interface IPersonDownload {
  name: string;
  bytes: number;
  sha256: string;
}

interface IPersonObservation extends IPersonPageState {
  step: string;
  at: string;
  settledAfterMs: number;
  settled: boolean;
  downloads: IPersonDownload[];
}

interface IPersonRecord {
  url: string;
  note: string | null;
  started: string;
  finished: string | null;
  renderer: string | null;
  pageErrors: string[];
  failure: string | null;
  observations: IPersonObservation[];
}

const BUTTONS = ["undo", "redo", "reset", "discard", "save", "glb"] as const;

const readState = (page: Page): Promise<IPersonPageState> =>
  page.evaluate((buttons: readonly string[]): IPersonPageState => {
    const text = (selector: string): string | null => document.querySelector(selector)?.textContent ?? null;
    const status = document.querySelector<HTMLElement>("#person-status");
    return {
      status: status?.textContent ?? null,
      state: status?.dataset.state ?? null,
      disabled: Object.fromEntries(
        buttons.map((name) => [name, document.querySelector<HTMLButtonElement>("#person-" + name)?.disabled ?? true]),
      ),
      document: document.querySelector<HTMLTextAreaElement>("#document-json")?.value ?? null,
      admission: text("#admission-report pre"),
      unapplied: text("#document-unapplied"),
    };
  }, BUTTONS);

const settle = async (page: Page, seconds: number): Promise<IPersonPageState & Pick<IPersonObservation, "settled">> => {
  const limit = Date.now() + seconds * 1000;
  // let the click's own status change land before the first read
  await page.waitForTimeout(400);
  for (;;) {
    const state = await readState(page);
    if (state.state !== null && state.state !== "building") return { ...state, settled: true };
    if (Date.now() > limit) return { ...state, settled: false };
    await page.waitForTimeout(700);
  }
};

const act = async (page: Page, step: string): Promise<void> => {
  const cut = step.indexOf("=");
  const kind = cut < 0 ? step : step.slice(0, cut);
  const value = cut < 0 ? "" : step.slice(cut + 1);
  if (kind === "load") {
    await page.locator("#person-file").setInputFiles(value);
    return;
  }
  if (kind === "text") {
    const text = fs.readFileSync(value, "utf8");
    await page.evaluate((next: string) => {
      const area = document.querySelector<HTMLTextAreaElement>("#document-json")!;
      area.closest("details")!.open = true;
      area.value = next;
      area.dispatchEvent(new Event("input", { bubbles: true }));
    }, text);
    await page.locator("#document-apply").click();
    return;
  }
  if (kind === "set" || kind === "remove") {
    const colon = kind === "set" ? value.lastIndexOf(":") : value.length;
    const row = value.slice(0, colon);
    const leaf = row.split("/").at(-1)!.split(".").at(-1)!;
    await page
      .locator('[data-role="input-catalogue"] input[type=search]')
      .fill(leaf.replace(/([a-z])([A-Z])/gu, "$1 $2").replace(/(Mm|Degrees)$/u, ""));
    const target = page.locator('[data-path="' + row + '"]');
    if (kind === "set") await target.locator("input[type=number]").fill(value.slice(colon + 1));
    await target.locator("button", { hasText: kind === "set" ? "Apply" : "Remove" }).click();
    return;
  }
  if (kind === "click" && (BUTTONS as readonly string[]).includes(value)) {
    await page.locator("#person-" + value).click();
    return;
  }
  throw new Error("Unknown step: " + step);
};

const main = async (): Promise<void> => {
  const [out, ...rest] = process.argv.slice(2).filter((one) => one !== "--");
  if (out === undefined) throw new Error("Usage: observe-connected-person <record.json> [key=value...] <step>...");
  const options = new Map<string, string>();
  const steps: string[] = [];
  for (const one of rest) {
    const key = one.split("=")[0];
    if (["base", "head", "body", "wait", "note"].includes(key)) options.set(key, one.slice(key.length + 1));
    else steps.push(one);
  }
  const source = new URLSearchParams();
  if (options.has("head")) source.set("headSource", options.get("head")!);
  if (options.has("body")) source.set("bodySource", options.get("body")!);
  const query = source.toString();
  const url = (options.get("base") ?? "http://127.0.0.1:5173") + "/connected-person.html" + (query === "" ? "" : "?" + query);
  const seconds = Number(options.get("wait") ?? "240");
  const record: IPersonRecord = {
    url,
    note: options.get("note") ?? null,
    started: new Date().toISOString(),
    finished: null,
    renderer: null,
    pageErrors: [],
    failure: null,
    observations: [],
  };
  const directory = path.dirname(path.resolve(out));
  const stem = path.basename(out).replace(/\.json$/u, "");
  const save = (): void => fs.writeFileSync(out, JSON.stringify(record, null, 2));
  const browser = await chromium.launch({
    executablePath: DEFAULT_CHROME_EXECUTABLE,
    headless: true,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
    const page = await context.newPage();
    page.on("pageerror", (error) => record.pageErrors.push(String(error.stack ?? error).slice(0, 900)));
    const saved: Promise<IPersonDownload>[] = [];
    page.on("download", (download: Download) => {
      saved.push(
        (async (): Promise<IPersonDownload> => {
          const file = path.join(directory, stem + "-" + saved.length + "-" + download.suggestedFilename());
          await download.saveAs(file);
          const bytes = fs.readFileSync(file);
          return { name: download.suggestedFilename(), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
        })(),
      );
    });
    let taken = 0;
    const observe = async (step: string, started: number, state: IPersonPageState, settled: boolean): Promise<void> => {
      // a file the page is still writing belongs to this step
      await page.waitForTimeout(1500);
      const downloads = await Promise.all(saved.slice(taken));
      taken = saved.length;
      record.observations.push({ step, at: new Date().toISOString(), settledAfterMs: Date.now() - started, settled, downloads, ...state });
      save();
    };
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator("#person-file").waitFor({ state: "attached", timeout: 180_000 });
    await observe("mounted", Date.now(), await readState(page), false);
    if (steps.length === 0) steps.push("wait");
    for (const step of steps) {
      const started = Date.now();
      if (step !== "wait") await act(page, step);
      // an export leaves the status untouched; give its download the same patience
      const before = saved.length;
      const { settled, ...state } = await settle(page, seconds);
      if (step === "click=glb") {
        const limit = Date.now() + seconds * 1000;
        while (saved.length === before && Date.now() < limit) await page.waitForTimeout(1000);
      }
      await observe(step, started, step === "click=glb" ? await readState(page) : state, settled);
    }
    record.renderer = await page.evaluate((): string | null => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      return gl === null || gl === undefined ? null : String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    });
  } catch (error) {
    record.failure = String(error instanceof Error ? (error.stack ?? error.message) : error).slice(0, 1500);
  } finally {
    record.finished = new Date().toISOString();
    save();
    await browser.close();
  }
  console.log(out);
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
