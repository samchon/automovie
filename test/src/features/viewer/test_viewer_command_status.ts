import { TestValidator } from "@nestia/e2e";

import {
  VIEWER_EXIT,
  runViewerCommand,
} from "../../../scripts/viewer/runViewerCommand";
import { createViewerIoFixture } from "../internal/createViewerIoFixture";

/**
 * `status` reports without acting.
 *
 * Scenarios:
 * 1. Nothing answers: exit code absent, no effect.
 * 2. The playground answers with a fresh build: ok, and the line names the
 *    revision and "fresh".
 * 3. The playground answers with a stale build: the stale exit code, the
 *    line says STALE and the reason is printed, and nothing is rebuilt.
 * 4. Another program holds the port: the foreign exit code, the line says it
 *    is left alone, and nothing is touched.
 */
export const test_viewer_command_status = async (): Promise<void> => {
  const absent = createViewerIoFixture();
  TestValidator.equals(
    "absent",
    await runViewerCommand("status", absent.io),
    VIEWER_EXIT.absent,
  );
  TestValidator.equals("no effect when absent", absent.calls, []);

  const fresh = createViewerIoFixture({
    probe: { open: true, playground: true },
  });
  TestValidator.equals(
    "fresh",
    await runViewerCommand("status", fresh.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.predicate(
    "report names revision and freshness",
    fresh.lines[0].includes("abc1234") && fresh.lines[0].includes("fresh"),
  );

  const stale = createViewerIoFixture({
    probe: { open: true, playground: true },
    sourceNewestMs: 300,
  });
  TestValidator.equals(
    "stale",
    await runViewerCommand("status", stale.io),
    VIEWER_EXIT.stale,
  );
  TestValidator.predicate(
    "stale line and reason",
    stale.lines[0].includes("STALE") && stale.lines.length === 2,
  );
  TestValidator.equals("status never rebuilds", stale.calls, []);

  const foreign = createViewerIoFixture({
    probe: { open: true, playground: false },
  });
  TestValidator.equals(
    "foreign",
    await runViewerCommand("status", foreign.io),
    VIEWER_EXIT.foreign,
  );
  TestValidator.predicate(
    "foreign is left alone",
    foreign.lines[0].includes("left alone"),
  );
  TestValidator.equals("no effect when foreign", foreign.calls, []);
};
