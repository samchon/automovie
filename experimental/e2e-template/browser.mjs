// Exercise the installed SDK in both browser module graphs. Node imports and
// a successful bundle alone miss CJS initialization and Node-only entry points.
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { createRequire } from "node:module";
import * as path from "node:path";

const root = path.resolve(process.argv[2]);
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("playwright-core");
process.env.VITE_CJS_IGNORE_WARNING = "true";
const vite = require("vite");
const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const failures = [];
try {
  for (const mode of ["development", "built"]) {
    let server;
    let page;
    const errors = [];
    try {
      server =
        mode === "development"
          ? await vite.createServer({
              root,
              server: { host: "127.0.0.1", port: 0, strictPort: true },
            })
          : await vite.preview({
              root,
              preview: { host: "127.0.0.1", port: 0, strictPort: true },
            });
      if (mode === "development") await server.listen();
      page = await browser.newPage();
      page.on("pageerror", (error) =>
        errors.push(error.stack ?? error.message),
      );
      await page.goto(server.resolvedUrls.local[0], {
        waitUntil: "load",
        timeout: 30_000,
      });
      await page.waitForFunction(
        () => document.documentElement.dataset.sdkSmoke === "ready",
        undefined,
        { timeout: 30_000 },
      );
      await page
        .getByRole("button", { name: "Play", exact: true })
        .waitFor({ timeout: 30_000 });
      const readout = page
        .locator("output", { hasText: /\d+\.\d+ \/ \d+\.\d+ s/u })
        .first();
      const before = await readout.innerText();
      await page.getByRole("button", { name: "Play", exact: true }).click();
      await page.waitForFunction(
        (previous) =>
          [...document.querySelectorAll("output")].some(
            (output) =>
              /\d+\.\d+ \/ \d+\.\d+ s/u.test(output.textContent) &&
              output.textContent !== previous,
          ),
        before,
        { timeout: 5_000 },
      );
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      assert.deepEqual(errors, [], "no browser errors");
      console.log(
        `${mode}: installed SDK initialized; inspector Play and Pause work`,
      );
    } catch (error) {
      failures.push(`${mode}: ${error.stack ?? error}\n${errors.join("\n")}`);
    } finally {
      await page?.close();
      if (mode === "development") await server?.close();
      else if (server)
        await new Promise((resolve, reject) =>
          server.httpServer.close((error) =>
            error ? reject(error) : resolve(),
          ),
        );
    }
  }
} finally {
  await browser.close();
}
assert.deepEqual(failures, [], "both installed browser consumers run");

// The capture host builds a separate draw page. Exercise that consumer too,
// then prove an uncaught module error survives without the old 120-second wait.
const { AutoMovieCaptureHost } = require("automovie");
const host = await AutoMovieCaptureHost.open({
  root,
  module: "src/subjects.ts",
  backend: "software",
  env: process.env,
});
try {
  const session = await host.session({ subject: "starter", props: null });
  await session.close();
  console.log("draw page: installed SDK initialized");
} finally {
  await host.close();
}
const scratch = path.join(root, ".cache", "e2e-failed-startup.ts");
await fs.mkdir(path.dirname(scratch), { recursive: true });
await fs.writeFile(
  scratch,
  'throw new Error("e2e uncaught module error");\nexport const subjects = () => ({});\n',
);
let failedHost;
let timer;
try {
  failedHost = await AutoMovieCaptureHost.open({
    root,
    module: scratch,
    backend: "software",
    env: process.env,
  });
  await Promise.race([
    assert.rejects(
      failedHost.session({ subject: null, props: null }),
      (error) =>
        error.cause instanceof Error &&
        error.cause.message === "e2e uncaught module error",
    ),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Draw startup error was hidden by a timeout")),
        30_000,
      );
    }),
  ]);
  console.log("draw startup failure: original script error preserved");
} finally {
  clearTimeout(timer);
  await failedHost?.close();
  await fs.unlink(scratch);
}
