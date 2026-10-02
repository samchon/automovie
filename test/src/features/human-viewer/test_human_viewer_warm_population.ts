import { TestValidator } from "@nestia/e2e";

import { publishedHumanViewerWarmDocuments } from "../../../scripts/human-viewer/publishedHumanViewerWarmDocuments";

/**
 * Automatic warming admits only the published faces and standard body probes.
 *
 * Scenarios:
 * 1. Face and body entries retain their identity and order.
 * 2. Assembled people and local face/body inputs stay explicit requests.
 * 3. Empty registration produces no automatic work.
 */
export const test_human_viewer_warm_population = (): void => {
  const documents: { id: string; domain: "face" | "body" | "person" }[] = [
    { id: "connected-reference", domain: "face" },
    { id: "body:neutral", domain: "body" },
    { id: "person:connected-reference", domain: "person" },
    { id: "file:local-face", domain: "face" },
    { id: "file:local-body", domain: "body" },
  ];
  const warmed = publishedHumanViewerWarmDocuments(documents);
  TestValidator.equals("published population", warmed.map((entry) => entry.id),
    ["connected-reference", "body:neutral"]);
  TestValidator.predicate("caller entries preserved", warmed[0] === documents[0] && warmed[1] === documents[1]);
  TestValidator.equals("registration unchanged", documents.length, 5);
  TestValidator.equals("empty population", publishedHumanViewerWarmDocuments([]), []);
};
