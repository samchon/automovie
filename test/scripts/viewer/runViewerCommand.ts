import type { IViewerIo } from "./IViewerIo";
import { judgeViewerFreshness } from "./judgeViewerFreshness";
import { judgeViewerRenderer } from "./judgeViewerRenderer";

/** The exit codes a caller (an agent or a script) can branch on. */
export const VIEWER_EXIT = {
  ok: 0,
  failed: 1,
  absent: 3,
  foreign: 4,
  stale: 5,
  software: 6,
} as const;

/**
 * Run one viewer command: `status` reports, `ensure` makes the review viewer
 * ready, `stop` ends the server this tool started.
 *
 * The playground's dev server is the only way to see the face and body editors
 * on a real GPU, so it must be cheap to have. `ensure` leaves a healthy, fresh
 * server alone and starts no second process; rebuilds the human browser output
 * when its source is newer (the running server reads the new files on the
 * next page load, so no restart is needed); and, when nothing answers, builds
 * if needed and starts the server and then stays attached to it, which is what
 * lets a session's background job own the server: ending the job ends the
 * server.
 *
 * The port is never taken from another program. A page that is not the
 * playground's, on the port, is reported as foreign and left running, and
 * `stop` acts only on the process id it recorded when it started the server,
 * checked against what the port serves so that a recycled id is not killed.
 * The report names the served revision and the freshness of the build so a
 * capture is never taken from an old one unknowingly.
 *
 * `status` with `gpu` also opens the editor in a browser and reads the
 * renderer string; a software rasterizer fails the check with its own exit
 * code and the reason, so a frame from such a device is never taken for a GPU
 * frame. The check is opt-in because it launches a browser.
 *
 * @param command What to do.
 * @param io Reads and effects, injected.
 * @param options `gpu`: check the renderer as well (`status` only).
 * @returns A `VIEWER_EXIT` code.
 */
export async function runViewerCommand(
  command: "status" | "ensure" | "stop",
  io: IViewerIo,
  options: { gpu?: boolean } = {},
): Promise<number> {
  const probe = await io.probe();
  const freshness = (): { fresh: boolean; reason: string } =>
    judgeViewerFreshness(io.sourceNewestMs(), io.builtAtMs());
  if (probe.open && !probe.playground) {
    io.log(
      `viewer: port ${io.port} is held by another program; it is left alone.`,
    );
    return VIEWER_EXIT.foreign;
  }

  if (command === "status") {
    if (!probe.open) {
      io.log(`viewer: absent on port ${io.port}.`);
      return VIEWER_EXIT.absent;
    }
    const built = freshness();
    io.log(
      `viewer: serving on port ${io.port}, revision ${io.revision()}, human build ${built.fresh ? "fresh" : "STALE"}.`,
    );
    if (!built.fresh) io.log(built.reason);
    if (options.gpu === true) {
      const renderer = await io.renderer();
      const verdict = judgeViewerRenderer(renderer);
      io.log(`viewer: renderer ${renderer === "" ? "(none)" : renderer}`);
      if (!verdict.real) {
        io.log(verdict.reason);
        return VIEWER_EXIT.software;
      }
    }
    return built.fresh ? VIEWER_EXIT.ok : VIEWER_EXIT.stale;
  }

  if (command === "stop") {
    const record = io.readRecord();
    if (record === null) {
      io.log(
        probe.open
          ? "viewer: a server is running that this tool did not start; it is left alone."
          : "viewer: already stopped.",
      );
      return probe.open ? VIEWER_EXIT.foreign : VIEWER_EXIT.ok;
    }
    // nothing answers, so the recorded process is gone and its id may already
    // belong to an unrelated program: forget it and kill nothing
    if (!probe.open) {
      io.clearRecord();
      io.log("viewer: the recorded server is no longer running; record cleared.");
      return VIEWER_EXIT.ok;
    }
    await io.kill(record.pid);
    io.clearRecord();
    io.log(`viewer: stopped process ${record.pid} and its children.`);
    return VIEWER_EXIT.ok;
  }

  // ensure
  const built = freshness();
  if (!built.fresh) {
    io.log(`viewer: ${built.reason} Rebuilding.`);
    const code = await io.build();
    if (code !== 0) {
      io.log(`viewer: the human build failed with exit code ${code}.`);
      return VIEWER_EXIT.failed;
    }
  }
  if (probe.open) {
    io.log(
      `viewer: already serving on port ${io.port}, revision ${io.revision()}, human build fresh.`,
    );
    return VIEWER_EXIT.ok;
  }
  const server = io.serve();
  io.writeRecord({ pid: server.pid, startedAt: new Date().toISOString() });
  if (!(await io.waitHealthy())) {
    await io.kill(server.pid);
    io.clearRecord();
    io.log(`viewer: the server did not answer on port ${io.port}.`);
    return VIEWER_EXIT.failed;
  }
  io.log(
    `viewer: serving on port ${io.port}, revision ${io.revision()}, human build fresh, process ${server.pid}.`,
  );
  const code = await server.exited;
  io.clearRecord();
  io.log(`viewer: the server exited with code ${code}.`);
  return code === 0 ? VIEWER_EXIT.ok : VIEWER_EXIT.failed;
}
