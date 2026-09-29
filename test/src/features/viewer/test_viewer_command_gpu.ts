import { TestValidator } from "@nestia/e2e";

import {
  VIEWER_EXIT,
  runViewerCommand,
} from "../../../scripts/viewer/runViewerCommand";
import { createViewerIoFixture } from "../internal/createViewerIoFixture";

/**
 * `status --gpu` reads the renderer string and refuses a software rasterizer.
 *
 * Scenarios:
 * 1. Without the option the browser is never launched (no `renderer` call).
 * 2. A real device passes: ok, and the renderer string is printed.
 * 3. A software rasterizer gives the software exit code, the string and the
 *    reason are printed, and it outranks a fresh build.
 * 4. An empty answer is refused with "(none)" printed.
 * 5. A stale build with a real device still gives the stale exit code, so
 *    the GPU check does not hide staleness.
 * 6. Nothing serving: the check is not attempted, exit code absent.
 */
export const test_viewer_command_gpu = async (): Promise<void> => {
  const plain = createViewerIoFixture({
    probe: { open: true, playground: true },
  });
  await runViewerCommand("status", plain.io);
  TestValidator.equals("no browser without the option", plain.calls, []);

  const real = createViewerIoFixture({
    probe: { open: true, playground: true },
  });
  TestValidator.equals(
    "real device",
    await runViewerCommand("status", real.io, { gpu: true }),
    VIEWER_EXIT.ok,
  );
  TestValidator.predicate(
    "renderer printed",
    real.lines.some((line) => line.includes("AMD Radeon 780M")),
  );

  const software = createViewerIoFixture({
    probe: { open: true, playground: true },
    renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
  });
  TestValidator.equals(
    "software",
    await runViewerCommand("status", software.io, { gpu: true }),
    VIEWER_EXIT.software,
  );
  TestValidator.predicate(
    "software reason printed",
    software.lines.some((line) => line.includes("software rasterizer")),
  );

  const none = createViewerIoFixture({
    probe: { open: true, playground: true },
    renderer: "",
  });
  TestValidator.equals(
    "no string",
    await runViewerCommand("status", none.io, { gpu: true }),
    VIEWER_EXIT.software,
  );
  TestValidator.predicate(
    "none printed",
    none.lines.some((line) => line.includes("(none)")),
  );

  const stale = createViewerIoFixture({
    probe: { open: true, playground: true },
    sourceNewestMs: 300,
  });
  TestValidator.equals(
    "stale build with a real device",
    await runViewerCommand("status", stale.io, { gpu: true }),
    VIEWER_EXIT.stale,
  );

  const absent = createViewerIoFixture();
  TestValidator.equals(
    "absent",
    await runViewerCommand("status", absent.io, { gpu: true }),
    VIEWER_EXIT.absent,
  );
  TestValidator.equals("no browser when absent", absent.calls, []);
};
