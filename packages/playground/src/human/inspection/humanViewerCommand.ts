import path from "node:path";
import { fileURLToPath } from "node:url";

// Mount this application's pages and examples into the Viewer-owned command.
process.env.HUMAN_VIEWER_ROOT = path.resolve(
  import.meta.dirname,
  "../../../../..",
);
process.env.HUMAN_VIEWER_APPLICATION = fileURLToPath(
  new URL("./humanViewerApplication.ts", import.meta.url),
);
await import("@automovie/viewer/human/inspection/human-shot");
