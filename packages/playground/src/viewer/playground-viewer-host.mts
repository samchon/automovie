/**
 * Attached normal Playground host entry. Its owning session keeps the process
 * alive; source edits never restart it or replace a completed browser display.
 */
import { startPlaygroundViewerHost } from "./startPlaygroundViewerHost.mjs";

void startPlaygroundViewerHost().catch((cause: unknown) => {
  console.error(cause);
  process.exitCode = 1;
});
