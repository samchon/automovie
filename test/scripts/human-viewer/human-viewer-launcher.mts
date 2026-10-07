/**
 * `node scripts/human-viewer/human-viewer-launcher.mts` from `test/`: the
 * starting owner of one resident viewer. It runs under plain Node, so it
 * starts at once, before the project type check and build that `ttsx` runs
 * for the server (ten seconds to minutes, depending on what changed and on
 * load). It binds the viewer's port immediately and writes the process record,
 * so status, stop and ensure see a starting viewer with an owner from the
 * first moment, and a second `ensure` never starts another server on the same
 * port. Until the server is up it answers `/health` with the starting phase
 * and every other route with 503 and `Retry-After`; it serves no viewer
 * content. It starts the server (`ttsx … server.mts`) as its child, which
 * listens on a free internal port and announces it; from then on every new
 * connection, HTTP or WebSocket, is piped to the server unchanged, and the
 * connections the launcher answered itself are closed. A server that fails to
 * build (a type error) or to start is reported in `/health` and the log, the
 * record is removed and the launcher exits with the server's code, so a
 * viewer with a type error never serves. Starting health advertises the same
 * wire protocol as ready health, so a current client can wait for its own
 * launcher while continuing to refuse incompatible resident servers.
 * `HUMAN_VIEWER_PORT` selects the
 * viewer as everywhere else.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { IHumanViewerRecord } from "./IHumanViewerRecord.ts";
import { humanViewerInstance } from "./humanViewerInstance.ts";
import { humanViewerLaunch } from "./humanViewerLaunch.ts";
import { humanViewerProtocol } from "./humanViewerProtocol.ts";
import { humanViewerStorage } from "./humanViewerStorage.ts";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT);
const instance = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
const record = path.join(storage, instance.record);
/** Output lines kept for the starting `/health`, enough for a type error report. */
const KEPT_LINES = 60;

let phase = "type-checking and building the server";
let since = new Date().toISOString();
let failure: string | null = null;
let upstream: number | null = null;
const output: string[] = [];
const enter = (name: string): void => {
  phase = name;
  since = new Date().toISOString();
  console.log(`LAUNCHER ${since} ${name}`);
};

/** The starting answers: `/health` reports the phase, everything else is refused for now. */
const starting = http.createServer((request, response) => {
  const route = new URL(request.url ?? "/", instance.origin).pathname;
  response.setHeader("Content-Type", "application/json");
  if (route === "/health") {
    response.end(
      JSON.stringify({
        service: "automovie-human-viewer",
        protocol: humanViewerProtocol,
        pid: process.pid,
        port: instance.port,
        storage,
        revision: "",
        renderer: "",
        ready: false,
        errors: failure === null ? [] : [failure],
        sourceError: failure,
        startup: { phase, since },
        launcher: { phase, since, output: output.slice(-KEPT_LINES) },
      }),
    );
    return;
  }
  response.statusCode = 503;
  response.setHeader("Retry-After", "3");
  response.end(
    JSON.stringify({
      error: `The viewer is starting (${phase} since ${since}), retry`,
    }),
  );
});
/** Connections the launcher answers itself, closed when the server takes over. */
const answered = new Set<net.Socket>();
const front = net.createServer((socket) => {
  if (upstream !== null) {
    const back = net.connect(upstream, "127.0.0.1");
    socket.pipe(back).pipe(socket);
    socket.on("error", () => back.destroy());
    back.on("error", () => socket.destroy());
    return;
  }
  answered.add(socket);
  socket.on("close", () => answered.delete(socket));
  starting.emit("connection", socket);
});

let child: ReturnType<typeof spawn> | null = null;
/** Stop the server tree this launcher started and remove the record. */
const stop = (code: number): void => {
  if (child?.pid !== undefined && child.exitCode === null) {
    if (process.platform === "win32")
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    else child.kill("SIGTERM");
  }
  fs.rmSync(record, { force: true });
  process.exit(code);
};
process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));

front.once("error", (error) => {
  console.error(
    `LAUNCHER could not hold port ${instance.port}: ${error.message}`,
  );
  process.exit(1);
});
front.listen(
  instance.port,
  "127.0.0.1",
  () =>
    void (async () => {
      fs.mkdirSync(storage, { recursive: true });
      const owned: IHumanViewerRecord = {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        port: instance.port,
      };
      fs.writeFileSync(record, JSON.stringify(owned));
      enter("type-checking and building the server");
      // A free internal port for the server: the operating system picks one, and
      // the server listens on it strictly, so a port taken meanwhile fails loudly.
      const probe = net.createServer();
      await new Promise<undefined>((resolve) => {
        probe.listen(0, "127.0.0.1", () => resolve(undefined));
      });
      const address = probe.address();
      const internal =
        address !== null && typeof address === "object" ? address.port : 0;
      await new Promise<undefined>((resolve) => {
        probe.close(() => resolve(undefined));
      });
      const require = createRequire(path.join(directory, "server.mts"));
      const ttsx = path.join(
        path.dirname(require.resolve("ttsc/package.json")),
        "lib/launcher/ttsx.js",
      );
      child = spawn(
        process.execPath,
        [
          ttsx,
          "-P",
          path.join(directory, "tsconfig.json"),
          path.join(directory, "server.mts"),
        ],
        {
          cwd: path.join(root, "test"),
          env: {
            ...process.env,
            [humanViewerLaunch.ownerVariable]: String(process.pid),
            [humanViewerLaunch.internalVariable]: String(internal),
          },
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let pending = "";
      const read =
        (target: NodeJS.WriteStream) =>
        (bytes: Buffer): void => {
          target.write(bytes);
          pending += bytes.toString("utf8");
          const lines = pending.split(/\r?\n/);
          pending = lines.pop() ?? "";
          for (const line of lines) {
            output.push(line);
            if (output.length > KEPT_LINES) output.shift();
            if (
              line.startsWith(humanViewerLaunch.upstreamPrefix) &&
              upstream === null
            ) {
              upstream = Number(
                line.slice(humanViewerLaunch.upstreamPrefix.length),
              );
              enter(`serving through the server on internal port ${upstream}`);
              for (const socket of answered) socket.destroy();
              answered.clear();
            } else if (line.startsWith("STARTUP "))
              phase = line.slice("STARTUP ".length).replace(/^\S+ /, "");
          }
        };
      child.stdout!.on("data", read(process.stdout));
      child.stderr!.on("data", read(process.stderr));
      child.once("exit", (code, signal) => {
        const exitCode = code ?? 1;
        if (upstream === null) {
          failure =
            `the server did not start: its build or startup exited with code ${code ?? "none"}` +
            (signal === null ? "" : ` (signal ${signal})`) +
            "; see the output in /health and the log";
          console.error(`LAUNCHER ${new Date().toISOString()} ${failure}`);
        } else
          console.error(
            `LAUNCHER ${new Date().toISOString()} the server exited with code ${code ?? "none"}`,
          );
        child = null;
        stop(exitCode === 0 && upstream === null ? 1 : exitCode);
      });
    })(),
);
