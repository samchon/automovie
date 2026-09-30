/**
 * Command line of the review viewer: the playground dev server that shows the
 * face and body editors on a real GPU.
 *
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/viewer/viewer.ts status [--gpu]
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/viewer/viewer.ts ensure
 *   pnpm exec ttsx -P tsconfig.scripts.json scripts/viewer/viewer.ts stop
 *
 * Run from `test/`. `ensure` is the one an agent starts as a session background
 * job: it stays attached to the server it starts, so ending the job ends the
 * server, and the recorded process id lets `stop` end it from another shell.
 * Exit codes are `VIEWER_EXIT` (0 ok, 1 failed, 3 absent, 4 the port is held by
 * another program, 5 the human build is stale, 6 the renderer is software,
 * checked only with `--gpu`). Nothing here opens a window:
 * every child is spawned hidden. The decisions are in `runViewerCommand`; this
 * file is the machine it acts on, thin on purpose because starting, probing
 * and killing real processes cannot be reproduced in a unit test.
 *
 * The record of the started server is `.shots/viewer/server.json` at the
 * repository root, an ignored directory, and nothing this tool writes is
 * committed.
 */
import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { IViewerIo } from "./IViewerIo";
import { classifyViewerResponse } from "./classifyViewerResponse";
import { newestModification } from "./newestModification";
import { parseViewerRecord } from "./parseViewerRecord";
import { runViewerCommand } from "./runViewerCommand";

const PORT = 5173;
const root = path.resolve(__dirname, "../../..");
const human = path.join(root, "packages/human");
const recordFile = path.join(root, ".shots/viewer/server.json");
const windows = process.platform === "win32";

const probe: IViewerIo["probe"] = async () => {
  try {
    const response = await fetch(
      `http://127.0.0.1:${PORT}/connected-body.html`,
      {
        signal: AbortSignal.timeout(3000),
      },
    );
    return classifyViewerResponse({
      status: response.status,
      text: await response.text(),
    });
  } catch (error) {
    const refused =
      (error as { cause?: { code?: string } }).cause?.code === "ECONNREFUSED";
    return refused
      ? classifyViewerResponse(null)
      : classifyViewerResponse({ status: 0, text: null });
  }
};

const pnpm = (args: string[], stdio: "inherit" | "ignore") =>
  spawn("pnpm", args, {
    cwd: root,
    shell: windows,
    windowsHide: true,
    detached: !windows,
    stdio,
  });

const io: IViewerIo = {
  port: PORT,
  probe,
  sourceNewestMs: () => newestModification(path.join(human, "src")),
  builtAtMs: () => {
    const entry = path.join(human, "lib/browser/index.js");
    return fs.existsSync(entry) ? fs.statSync(entry).mtimeMs : null;
  },
  readRecord: () =>
    parseViewerRecord(
      fs.existsSync(recordFile) ? fs.readFileSync(recordFile, "utf8") : null,
    ),
  writeRecord: (record) => {
    fs.mkdirSync(path.dirname(recordFile), { recursive: true });
    fs.writeFileSync(recordFile, JSON.stringify(record) + "\n");
  },
  clearRecord: () => fs.rmSync(recordFile, { force: true }),
  build: () =>
    new Promise((resolve) => {
      pnpm(["--filter", "@automovie/human", "build"], "inherit").on(
        "exit",
        (code) => resolve(code ?? 1),
      );
    }),
  serve: () => {
    const child = pnpm(
      ["--filter", "@automovie/playground", "exec", "vite"],
      "inherit",
    );
    return {
      pid: child.pid ?? 0,
      exited: new Promise((resolve) => {
        child.on("exit", (code) => resolve(code ?? 1));
        // a spawn that fails never exits, so its error ends the wait
        child.on("error", () => resolve(1));
      }),
    };
  },
  waitHealthy: async () => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if ((await probe()).playground) return true;
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }
    return false;
  },
  kill: async (pid) => {
    // the recorded process is the shell that runs pnpm, which runs vite: the
    // whole tree goes, or vite outlives it as an orphan holding the port
    if (windows)
      spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
        windowsHide: true,
      });
    else
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        process.kill(pid, "SIGTERM");
      }
  },
  renderer: async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      channel: "chromium",
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/connected-body.html`, {
        timeout: 120000,
      });
      await page.waitForFunction(
        () =>
          (window as unknown as { __connectedBody?: unknown })
            .__connectedBody !== undefined,
        undefined,
        { timeout: 120000 },
      );
      return await page.evaluate(() =>
        String(
          (
            window as unknown as {
              __connectedBody: { renderer: () => unknown };
            }
          ).__connectedBody.renderer(),
        ),
      );
    } finally {
      await browser.close();
    }
  },
  revision: () => {
    const git = (args: string[]): string =>
      execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    const dirty = git(["status", "--porcelain", "--", "packages"]) !== "";
    return git(["rev-parse", "--short", "HEAD"]) + (dirty ? "+local" : "");
  },
  log: (line) => console.log(line),
};

const command = process.argv[2];
if (command !== "status" && command !== "ensure" && command !== "stop")
  throw new Error("Give one command: status, ensure or stop.");
void runViewerCommand(command, io, {
  gpu: process.argv.includes("--gpu"),
}).then((code) => process.exit(code));
