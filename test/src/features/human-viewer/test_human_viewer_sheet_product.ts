import { TestValidator } from "@nestia/e2e";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { planHumanViewerSheet } from "../../../scripts/human-viewer/planHumanViewerSheet";

/**
 * A multi-axis review visits the complete Cartesian product in stable order.
 * Scenarios:
 * 1. Two views, two passes and assembled/isolated parts produce eight labelled cells.
 * 2. Wildcard subjects and body states resolve from the actual caller inventory.
 */
export function test_human_viewer_sheet_product(): void {
  const base = parseHumanViewerAddress("doc=a&parts=old");
  const cells = planHumanViewerSheet(base, "view:front,left;pass:clay,normal;part:assembled,eye", ["a"]);
  TestValidator.equals("product", cells.length, 8);
  TestValidator.equals("first", cells[0].address.parts, []);
  TestValidator.equals("last view", cells[7].address.view, "left");
  TestValidator.equals("last pass", cells[7].address.pass, "normal");
  TestValidator.equals("last part", cells[7].address.parts, ["eye"]);
  TestValidator.equals("label", cells[7].label, "view:left • pass:normal • part:eye");
  TestValidator.equals("unchanged input", base.parts, ["old"]);
  TestValidator.equals("subjects", planHumanViewerSheet(base, "subject:*", ["a", "b", "body:neutral"]).map((cell) => cell.address.doc), ["a", "b"]);
  TestValidator.equals("states", planHumanViewerSheet(base, "state:neutral,heavy", ["body:neutral", "body:heavy"]).map((cell) => cell.address.doc), ["body:neutral", "body:heavy"]);
}
