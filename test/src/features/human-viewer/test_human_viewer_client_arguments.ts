import { TestValidator } from "@nestia/e2e";
import { parseHumanShotRequest } from "../../../scripts/human-viewer/parseHumanShotRequest";

/**
 * CLI fields retain their values and lifecycle commands cannot capture silently.
 * Scenarios:
 * 1. A sheet query preserves punctuation, spaces and its explicitly local output.
 * 2. Lifecycle and JSON commands accept their supported empty/output-free forms.
 * 3. Unknown commands, repeated fields and malformed output options refuse.
 */
export function test_human_viewer_client_arguments(): void {
  const selected = parseHumanShotRequest(["sheet", "doc=subject & id", "axes=view:front,left;pass:clay", "--output", "local image.png"]);
  const fields = new URLSearchParams(selected.query);
  TestValidator.equals("identity", fields.get("doc"), "subject & id");
  TestValidator.equals("axes", fields.get("axes"), "view:front,left;pass:clay");
  TestValidator.equals("output", selected.output, "local image.png");
  for (const command of ["ensure", "status", "stop", "render", "compare", "warm"] as const)
    TestValidator.equals("command", parseHumanShotRequest([command]).command, command);
  for (const args of [[], ["other"], ["render", "bad"], ["render", "--bad"], ["render", "doc=a", "doc=b"],
    ["render", "--output"], ["render", "--output", ""], ["render", "--output", "--bad"],
    ["render", "--output", "a", "--output", "b"], ["stop", "doc=a"], ["ensure", "--output", "a"], ["warm", "--output", "a"]]) {
    let refused = false;
    try { parseHumanShotRequest(args); } catch { refused = true; }
    TestValidator.predicate("invalid request", refused);
  }
}
