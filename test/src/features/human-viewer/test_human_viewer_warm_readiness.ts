import { TestValidator } from "@nestia/e2e";

import { createHumanViewerWarmReadiness } from "../../../scripts/human-viewer/createHumanViewerWarmReadiness";
import { throwsError } from "../internal/predicates";

/**
 * GPU admission and source readiness may arrive in either order.
 *
 * Scenarios:
 * 1. Source before GPU submits nothing until hardware admission.
 * 2. GPU before source submits nothing until source admission.
 * 3. Duplicate events do not duplicate work; a newer source submits once,
 *    and an empty identity refuses before affecting readiness.
 */
export const test_human_viewer_warm_readiness = (): void => {
  const submitted: string[] = [];
  const first = createHumanViewerWarmReadiness((revision) => { submitted.push(revision); });
  first.source("one");
  TestValidator.equals("source alone is not capture-ready", submitted, []);
  first.hardware();
  TestValidator.equals("both prerequisites", submitted, ["one"]);
  first.hardware(); first.source("one");
  TestValidator.equals("duplicate readiness", submitted, ["one"]);
  first.source("two");
  TestValidator.equals("new source", submitted, ["one", "two"]);
  TestValidator.predicate("identity admission", throwsError(() => first.source(""), "source identity"));
  TestValidator.equals("invalid identity does not submit", submitted, ["one", "two"]);
  const second: string[] = [];
  const reversed = createHumanViewerWarmReadiness((revision) => { second.push(revision); });
  reversed.hardware();
  TestValidator.equals("hardware alone is not capture-ready", second, []);
  reversed.source("ready");
  TestValidator.equals("reversed order", second, ["ready"]);
};
