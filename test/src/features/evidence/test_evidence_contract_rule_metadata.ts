import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieContractRuleMetadata } from "../../../../packages/evidence/src/IAutoMovieContractRuleMetadata";
import { validateMetadata } from "../../../../packages/evidence/src/readAutoMovieContractRulesInternal/validateMetadata.ts";

/**
 * Structured contract routing accepts declared strings and refuses coercible JSON values.
 *
 * Scenarios:
 * 1. Complete string metadata and a digit-only string ID are admitted unchanged.
 * 2. Numeric and array aliases refuse even when String(value) spells a valid token.
 * 3. Unknown fields, unsupported enums and blank required strings refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification The reader's actual metadata validator receives complete records and malformed JSON-shaped values; returned routing fields and thrown refusals distinguish strict admission from string coercion.
 * @evidence contracts/testing.md#independent-expectations The supported closed routing fields require strings, lower-kebab IDs and declared lifecycle/application names; expected records and invalid scalar/array shapes are authored independently from validator code.
 * @evidence contracts/testing.md#distinguishing-cases Numeric ID versus digit-only string ID, singleton arrays versus declared enum strings, unknown keys, unsupported enums and blank timing/source identity cover the owning decisions; Markdown block placement and physical tree reading belong to the reader.
 * @evidence contracts/testing.md#execution-ownership This discoverable portable unit invokes the same internal validator called by the public reader without creating files, installing a consumer or starting a host.
 */
export function test_evidence_contract_rule_metadata(): void {
  const valid: IAutoMovieContractRuleMetadata = {
    id: "route-123",
    status: "active",
    safeApplication: "composition-safe",
    timing: "before authoring",
    sourceIdentity: "authored-revision-1",
  };
  TestValidator.equals("declared string routing", validateMetadata(valid, "contract#route"), valid);
  TestValidator.equals("digit-only string identity", validateMetadata({ ...valid, id: "123" }, "contract#route").id, "123");
  const statuses: readonly IAutoMovieContractRuleMetadata["status"][] = ["active", "hold", "rejected"];
  for (const status of statuses)
    TestValidator.equals("declared lifecycle states", validateMetadata({ ...valid, status }, "contract#route").status, status);
  const applications: readonly IAutoMovieContractRuleMetadata["safeApplication"][] = ["composition-safe", "observation-only", "population-distribution", "post-draft-frequency", "revision-only"];
  for (const safeApplication of applications)
    TestValidator.equals("declared application boundaries", validateMetadata({ ...valid, safeApplication }, "contract#route").safeApplication, safeApplication);
  for (const input of [
    null,
    [],
    {},
    { ...valid, id: 123 },
    { ...valid, id: ["route-123"] },
    { ...valid, status: ["active"] },
    { ...valid, safeApplication: ["composition-safe"] },
    { ...valid, status: "pending" },
    { ...valid, safeApplication: "unknown-boundary" },
    { ...valid, timing: " " },
    { ...valid, sourceIdentity: "" },
    { ...valid, extra: true },
  ]) {
    let refused: boolean = false;
    try {
      validateMetadata(input, "contract#route");
    } catch (error) {
      refused = error instanceof Error;
    }
    TestValidator.predicate("closed string metadata refuses malformed values", refused);
  }
}
