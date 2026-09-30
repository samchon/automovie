import { TestValidator } from "@nestia/e2e";

import {
  VIEWER_EXIT,
  runViewerCommand,
} from "../../../scripts/viewer/runViewerCommand";
import { createViewerIoFixture } from "../internal/createViewerIoFixture";

/**
 * `stop` ends only the server this tool recorded, and only while it answers.
 *
 * Scenarios:
 * 1. No record and nothing listening: already stopped, ok, nothing killed.
 * 2. No record but the playground is running (started elsewhere): the foreign
 *    exit code and nothing killed, because the tool does not own it.
 * 3. A record and the playground answering: the recorded process is killed,
 *    the record cleared, ok.
 * 4. Negative twin: a record but nothing answering (the server is gone and its
 *    process id may belong to something else now): the record is cleared and
 *    nothing is killed.
 * 5. Another program holding the port, with a record: nothing is killed and
 *    the record is untouched.
 */
export const test_viewer_command_stop = async (): Promise<void> => {
  const none = createViewerIoFixture();
  TestValidator.equals(
    "already stopped",
    await runViewerCommand("stop", none.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("nothing killed", none.calls, []);

  const unowned = createViewerIoFixture({
    probe: { open: true, playground: true },
  });
  TestValidator.equals(
    "not ours",
    await runViewerCommand("stop", unowned.io),
    VIEWER_EXIT.foreign,
  );
  TestValidator.equals("unowned server not killed", unowned.calls, []);

  const record = { pid: 777, startedAt: "t" };
  const owned = createViewerIoFixture({
    probe: { open: true, playground: true },
    record,
  });
  TestValidator.equals(
    "stopped",
    await runViewerCommand("stop", owned.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("killed then cleared", owned.calls, [
    "kill 777",
    "clear",
  ]);
  TestValidator.equals("record gone", owned.record(), null);

  const gone = createViewerIoFixture({ record });
  TestValidator.equals(
    "gone server",
    await runViewerCommand("stop", gone.io),
    VIEWER_EXIT.ok,
  );
  TestValidator.equals("record cleared, no kill", gone.calls, ["clear"]);

  const foreign = createViewerIoFixture({
    probe: { open: true, playground: false },
    record,
  });
  TestValidator.equals(
    "foreign with a record",
    await runViewerCommand("stop", foreign.io),
    VIEWER_EXIT.foreign,
  );
  TestValidator.equals(
    "nothing killed, record kept",
    [foreign.calls, foreign.record()],
    [[], record],
  );
};
