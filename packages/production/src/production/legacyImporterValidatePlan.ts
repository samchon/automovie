import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import typia from "typia";
import { legacyImporterPlanFingerprint } from "./legacyImporterPlanFingerprint";
import { legacyImporterIsCanonicalBaseline } from "./legacyImporterIsCanonicalBaseline";

/**
 * Admit exact plan schema, three ordered canonical rollback baselines and a recomputed semantic fingerprint. This established importer predicate does not implement every extra refinement of the separate public plan assertion.
 *
 * @evidence contracts/common.md#principled-implementation typia exact-shape validation precedes fixed src/generated/renders baseline order, canonical sorted baseline checks and shared complete semantic fingerprint equality.
 * @evidence contracts/common.md#clear-and-simple-design Owns the importer's established boolean admission boundary while canonical fingerprinting is shared with the public plan owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stored digest alone proves live bytes; this predicate intentionally retains its existing scope and does not claim the public assertion's additional revision/inventory/case-collision refinements.
 * @evidence contracts/common.md#meaningful-documentation States schema, baseline order, fingerprint recomputation and narrower importer scope; false reports failed predicates, but this wrapper has no catch to convert schema/reflection/canonical-encoding throws into false.
 * @evidence contracts/performance.md#efficient-algorithms Schema traversal, baseline population checks and canonical hashing follow all plan fields and encoded bytes, including canonical key sorting and population-sized temporary encoding.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the canonical fingerprint producer but recomputes it for each admitted value; mutable JSON objects are not cached as valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean and holds decoded input only during admission; schema/encoding temporaries expire and no file or lock is acquired.
 */
export const legacyImporterValidatePlan: (value: unknown) => value is IAutoMovieLegacyImportPlan = (value: unknown): value is IAutoMovieLegacyImportPlan => {
  const validation: typia.IValidation<IAutoMovieLegacyImportPlan> = typia.validateEquals<IAutoMovieLegacyImportPlan>(value);
  if (validation.success === false) return false;
  const plan: IAutoMovieLegacyImportPlan = validation.data;
  return (
    plan.rollbackBaseline.length === 3 &&
    legacyImporterIsCanonicalBaseline(plan.rollbackBaseline[0]!, "src") &&
    legacyImporterIsCanonicalBaseline(plan.rollbackBaseline[1]!, "generated") &&
    legacyImporterIsCanonicalBaseline(plan.rollbackBaseline[2]!, "renders") &&
    plan.fingerprint === legacyImporterPlanFingerprint(plan)
  );
};
