import path from "node:path";

// Native control remains available when this application's checked source fails.
process.env.HUMAN_VIEWER_ROOT = path.resolve(
  import.meta.dirname,
  "../../../../..",
);
await import("@automovie/viewer/human/inspection/human-viewer-control");
