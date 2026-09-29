import { serializeHumanBodyBasisDocument } from "@automovie/human";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";

/**
 * Only an explicit contact check reads the posed internal articular heads.
 *
 * Scenarios:
 * 1. An ordinary preview of the analytic shoulder rig has no anatomy read.
 * 2. Explicit contact checking of its valid skin returns both directly
 *    measured heads even outside the adult CT stature domain, with signed
 *    metric distances from the posed skin.
 */
export const test_human_body_resident_anatomy = async (): Promise<void> => {
  const { basis, document } = humanBodyShoulderFixture();
  document.humeralHeads = {
    leftRadiusMillimetres: 23,
    rightRadiusMillimetres: 25,
  };
  const runtime = createConnectedBodyRuntime(basis);
  const text = serializeHumanBodyBasisDocument(document);
  const ordinary = await runtime({ operation: "preview", document: text, measure: false });
  if (ordinary.operation !== "preview") throw new Error("Expected preview.");
  TestValidator.equals("ordinary edit skips internal read", ordinary.anatomy, null);
  const checked = await runtime({ operation: "preview", document: text, measure: true, anatomy: true });
  if (checked.operation !== "preview") throw new Error("Expected preview.");
  TestValidator.equals("analytic skin has no crossings", checked.crossings, []);
  if (checked.anatomy?.status !== "measured")
    throw new Error("Expected measured articular heads on the valid analytic skin.");
  TestValidator.equals("both observed radii reach worker", checked.anatomy.heads.map((head) => [head.bone, head.radiusMetres, head.source]), [["leftUpperArm", 0.023, "measured"], ["rightUpperArm", 0.025, "measured"]]);
  TestValidator.predicate("metric skin distances remain finite", checked.anatomy.heads.every((head) => Number.isFinite(head.nearestMetres) && Number.isFinite(head.clearanceMetres)));
};
