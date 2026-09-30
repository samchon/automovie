import { TestValidator } from "@nestia/e2e";

import {
  VIEWER_EXIT,
  runViewerCommand,
} from "../../../scripts/viewer/runViewerCommand";
import { createViewerIoFixture } from "../internal/createViewerIoFixture";

/**
 * `ensure` makes the viewer ready with the fewest effects.
 *
 * Scenarios:
 * 1. Healthy and fresh: ok, and no build, no second server.
 * 2. Healthy but stale: rebuilds and does not restart; a failing build gives
 *    the failed exit code.
 * 3. Absent and fresh: starts the server, records it, waits for health, stays
 *    attached until it exits; a clean exit is ok and clears the record, a
 *    failing exit is failed.
 * 4. Absent and stale: builds before it starts; a failing build starts nothing.
 * 5. Absent, and the server never answers: it is killed, the record cleared,
 *    failed.
 * 6. Another program holds the port: the foreign exit code and no effect.
 * 7. A server that could not be started (no process id): failed, nothing is
 *    recorded or waited for, and nothing is killed, because signalling process
 *    zero would reach the caller's own process group.
 */
export const test_viewer_command_ensure = async (): Promise<void> => {
  const healthy = createViewerIoFixture({
    probe: { open: true, playground: true },
  });
  TestValidator.equals(
    "healthy",
    await runViewerCommand("ensure", healthy.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("no effect", healthy.calls, []);

  const staleRunning = createViewerIoFixture({
    probe: { open: true, playground: true },
    sourceNewestMs: 300,
  });
  TestValidator.equals(
    "stale and running",
    await runViewerCommand("ensure", staleRunning.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("rebuild only", staleRunning.calls, ["build"]);

  const brokenBuild = createViewerIoFixture({
    probe: { open: true, playground: true },
    sourceNewestMs: 300,
    buildCode: 2,
  });
  TestValidator.equals(
    "failed rebuild",
    await runViewerCommand("ensure", brokenBuild.io),
    VIEWER_EXIT.failed,
  );

  const started = createViewerIoFixture();
  TestValidator.equals(
    "started",
    await runViewerCommand("ensure", started.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("start sequence", started.calls, [
    "serve",
    "write",
    "wait",
    "clear",
  ]);
  TestValidator.predicate(
    "report names the process",
    started.lines.some((line) => line.includes("process 4242")),
  );

  const crashed = createViewerIoFixture({ exitCode: 3 });
  TestValidator.equals(
    "server crashed",
    await runViewerCommand("ensure", crashed.io),
    VIEWER_EXIT.failed,
  );

  const stale = createViewerIoFixture({ builtAtMs: null });
  TestValidator.equals(
    "absent and stale",
    await runViewerCommand("ensure", stale.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("build before serve", stale.calls, [
    "build",
    "serve",
    "write",
    "wait",
    "clear",
  ]);

  const noBuild = createViewerIoFixture({ builtAtMs: null, buildCode: 1 });
  TestValidator.equals(
    "absent, build fails",
    await runViewerCommand("ensure", noBuild.io),
    VIEWER_EXIT.failed,
  );
  TestValidator.equals("nothing started", noBuild.calls, ["build"]);

  const silent = createViewerIoFixture({ healthy: false });
  TestValidator.equals(
    "never answers",
    await runViewerCommand("ensure", silent.io),
    VIEWER_EXIT.failed,
  );
  TestValidator.equals("killed and cleared", silent.calls, [
    "serve",
    "write",
    "wait",
    "kill 4242",
    "clear",
  ]);

  const unstartable = createViewerIoFixture({ servePid: 0 });
  TestValidator.equals(
    "no process id",
    await runViewerCommand("ensure", unstartable.io),
    VIEWER_EXIT.failed,
  );
  TestValidator.equals(
    "nothing recorded, waited for or killed",
    unstartable.calls,
    ["serve"],
  );

  const foreign = createViewerIoFixture({
    probe: { open: true, playground: false },
  });
  TestValidator.equals(
    "foreign",
    await runViewerCommand("ensure", foreign.io),
    VIEWER_EXIT.foreign,
  );
  TestValidator.equals("no effect when foreign", foreign.calls, []);
};
