import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { IGripPreparationInput, IGripPreparationResult } from "../test/fixtures/grip-preflight";

/** Minimal installed public Playwright port for one owned math-preparation page. */
interface Driver {
  chromium: { launch: (options: { executablePath: string; headless: boolean }) => Promise<{
    newPage: () => Promise<{ goto: (url: string, options: { timeout: number }) => Promise<unknown>; evaluate: <T, A>(task: (argument: A) => Promise<T>, argument: A) => Promise<T> }>;
    close: () => Promise<void>;
  }> };
}

/** Preserve actual source bytes used by this local implementation round. */
async function hashes(directory: string, prefix: string = ""): Promise<Record<string, string>> {
  const rows: Record<string, string> = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative: string = prefix + entry.name; const absolute: string = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(rows, await hashes(absolute, relative + "/"));
    else if (entry.isFile()) rows[relative] = createHash("sha256").update(await fs.readFile(absolute)).digest("hex");
  }
  return rows;
}

/**
 * Run actual same-model grip/known-foot preparation without rebaking the film.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the installed public Playwright driver in an isolated owned Chrome and the tracked dedicated fixture. All actual model/native/geometry outputs and source maps before/after are written before returning failure. The fixture invokes the same production factories, never an alternate rig or hidden model. No normal Play, visual approval, whole-movie preparation or generated media is claimed. Only its own browser is closed.
 * @evidence contracts/common.md#authoring-interface Arguments are owned output directory, retained input JSON and optional fixture URL. The output must remain within this production. CHROME_PATH may select the existing executable. A ten-minute finite operation deadline is independent of tool transport; input bytes/digest and actual result are retained. Both actor/model populations and the entire exit plus retained failure neighbours are collected before failure. No secret, install, remote generator or payment is used.
 */
export async function inspectGripPreparation(): Promise<void> {
  const root: string = fileURLToPath(new URL("../", import.meta.url));
  const output: string = path.resolve(root, process.argv[2] ?? ".cache/motion-departure/grip-preflight");
  const relative: string = path.relative(root, output);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Preparation output must remain inside this production");
  const inputPath: string = path.resolve(root, process.argv[3] ?? ".cache/motion-departure/contact-coupled/unit-preflight-input.json");
  const inputBytes: Buffer = await fs.readFile(inputPath);
  const input: IGripPreparationInput = JSON.parse(inputBytes.toString("utf8")) as IGripPreparationInput;
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "input.json"), inputBytes);
  const sources: () => Promise<object> = async (): Promise<object> => ({ production: await hashes(path.join(root, "src")), human: await hashes(fileURLToPath(new URL("../../../../packages/human/src/", import.meta.url))), fixture: await hashes(path.join(root, "test/fixtures")) });
  const before: object = await sources(); await fs.writeFile(path.join(output, "source-before.json"), JSON.stringify(before, null, 2));
  const installed: NodeJS.Require = createRequire(new URL("../../../../packages/human/package.json", import.meta.url));
  const driver: Driver = installed("playwright-core") as Driver;
  const browser: Awaited<ReturnType<Driver["chromium"]["launch"]>> = await driver.chromium.launch({ executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE, headless: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const page: Awaited<ReturnType<typeof browser.newPage>> = await browser.newPage();
    await page.goto(process.argv[4] ?? "http://127.0.0.1:5187/test/fixtures/grip-preflight.html", { timeout: 120000 });
    const result: IGripPreparationResult = await Promise.race([
      page.evaluate(async (payload: IGripPreparationInput): Promise<IGripPreparationResult> => {
        const endpoint: string = "/test/fixtures/grip-preflight.ts";
        const implementation: typeof import("../test/fixtures/grip-preflight") = await import(endpoint);
        return implementation.run(payload);
      }, input),
      new Promise<never>((_: (value: never) => void, reject: (reason: Error) => void): void => { timer = setTimeout((): void => { reject(new Error("Same-model preparation exceeded ten minutes")); }, 600000); }),
    ]);
    await fs.writeFile(path.join(output, "result.json"), JSON.stringify(result, null, 2));
    const after: object = await sources(); await fs.writeFile(path.join(output, "source-after.json"), JSON.stringify(after, null, 2));
    const sourceUnchanged: boolean = JSON.stringify(before) === JSON.stringify(after);
    const summary: object = { admitted: result.admitted, sourceUnchanged, elapsedMs: result.elapsedMs, inputPath, inputSha256: createHash("sha256").update(inputBytes).digest("hex"), models: result.models.map((model: IGripPreparationResult["models"][number]): object => ({ person: model.person, admitted: model.profile.admitted, layouts: model.profile.attempts.length, accepted: model.profile.attempts.filter((attempt): boolean => attempt.accepted).length })), exitCases: result.exit.length, errors: result.errors, scope: "Same-model implementation preparation only; not film/Viewer/encoded acceptance" };
    await fs.writeFile(path.join(output, "summary.json"), JSON.stringify(summary, null, 2));
    console.log(summary);
    if (!result.admitted || !sourceUnchanged) process.exitCode = 1;
  } finally { if (timer !== undefined) clearTimeout(timer); await browser.close(); }
}

void inspectGripPreparation().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
