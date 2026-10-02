import { TestValidator } from "@nestia/e2e";

import type { IHumanViewerCompilationStatus } from "../../../scripts/human-viewer/IHumanViewerCompilationStatus";
import { createHumanViewerCompilation } from "../../../scripts/human-viewer/createHumanViewerCompilation";

/**
 * Completion order cannot republish an invalidated compiler generation.
 *
 * Scenarios:
 * 1. A newer compile completes first; late old success serves only its waiting
 *    caller and does not replace the last good fallback or successful report.
 * 2. A late old failure leaves the newer generation's report intact.
 * 3. A current failed generation retains the newer last good module.
 */
export const test_human_viewer_compilation_race = async (): Promise<void> => {
  const pending: { resolve: (files: Record<string, string>) => void;
    reject: (error: Error) => void }[] = [];
  const reports: IHumanViewerCompilationStatus[] = [];
  const owner = createHumanViewerCompilation(() => new Promise((resolve, reject) => {
    pending.push({ resolve, reject });
  }), (report) => reports.push(report), () => "newest-good-time");
  const old = owner.source("module");
  owner.invalidate();
  const latest = owner.source("module");
  pending[1].resolve({ module: "new" });
  TestValidator.equals("new generation", await latest, "new");
  pending[0].resolve({ module: "old" });
  TestValidator.equals("old caller keeps its snapshot", await old, "old");
  TestValidator.equals("only newest report", reports.length, 1);
  owner.invalidate();
  const obsoleteFailure = owner.source("module");
  owner.invalidate();
  const newest = owner.source("module");
  pending[3].resolve({ module: "newer" });
  TestValidator.equals("newer generation", await newest, "newer");
  pending[2].reject(new Error("obsolete failure"));
  TestValidator.equals("obsolete failure uses current good", await obsoleteFailure, "newer");
  TestValidator.equals("obsolete failure does not replace success report", reports.length, 2);
  owner.invalidate();
  const failing = owner.source("module");
  pending[4].reject(new Error("current failure"));
  TestValidator.equals("fallback remains newest", await failing, "newer");
  TestValidator.equals("current failure reported", reports[2], {
    error: "current failure", goodAt: "newest-good-time",
  });
};
