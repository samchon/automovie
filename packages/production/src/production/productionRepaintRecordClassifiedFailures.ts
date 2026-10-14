import { AutoMovieRepaintRecordFailureClass } from "./AutoMovieRepaintRecordFailureClass";

/** Module-owned failure vocabulary shared by constructor and collector classification checks. Internal consumers must preserve this Set; no public root export or runtime freeze is introduced. */
export const productionRepaintRecordClassifiedFailures: Set<AutoMovieRepaintRecordFailureClass> = new Set<AutoMovieRepaintRecordFailureClass>([
  "absent",
  "schema-invalid",
  "identity-invalid",
  "stale",
  "unsafe-locator",
  "unavailable",
  "render-corrupt",
]);
