import type { IAutoMovieLegacyImportPlan, IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";
import typia from "typia";
import { AutoMovieLegacyImportPlanError } from "./AutoMovieLegacyImportPlanError";
import { legacyImportAssertInventory } from "./legacyImportAssertInventory";
import { legacyImportAssertBaseline } from "./legacyImportAssertBaseline";
import { fingerprintAutoMovieLegacyImportPlan } from "./fingerprintAutoMovieLegacyImportPlan";

/**
 * Admit the full plan shape, runtime refinements, baseline and fingerprint.
 *
 * @evidence contracts/common.md#principled-implementation Exact typia shape admission precedes revision, ordered inventory, three canonical baselines and semantic fingerprint checks.
 * @evidence contracts/common.md#clear-and-simple-design Apply and reopen share one assertion returning the original admitted object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest spelling and plan identity do not authenticate resident inventory bytes; stale plans are refused rather than repaired.
 * @evidence contracts/common.md#meaningful-documentation States safe revision, src/generated/renders order, original-object ownership and typed refusals.
 * @evidence contracts/performance.md#efficient-algorithms Scans all inventory/baseline entries and canonically encodes the whole plan; sets and encoded text scale with plan size.
 * @evidence contracts/performance.md#reuse-equivalent-work Validated data feeds semantic checks without a second materialization or mutable-plan verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains its plan; temporary validation/sets/encoding expire on success or throw.
 */
export const assertAutoMovieLegacyImportPlan: (value: unknown) => IAutoMovieLegacyImportPlan = (value: unknown): IAutoMovieLegacyImportPlan => {
    const validation: typia.IValidation<IAutoMovieLegacyImportPlan> = typia.validateEquals<IAutoMovieLegacyImportPlan>(value);
    if (validation.success === false)
        throw new AutoMovieLegacyImportPlanError(`schema mismatch at ${validation.errors[0]!.path}`);
    const plan: IAutoMovieLegacyImportPlan = validation.data;
    if (!Number.isSafeInteger(plan.legacyRevision) || plan.legacyRevision < 0)
        throw new AutoMovieLegacyImportPlanError("legacyRevision must be a non-negative safe integer");
    legacyImportAssertInventory(plan.inventory, "inventory");
    const expected: readonly ["src", "generated", "renders"] = ["src", "generated", "renders"] as const;
    if (plan.rollbackBaseline.length !== expected.length)
        throw new AutoMovieLegacyImportPlanError("rollbackBaseline must contain src, generated and renders exactly once");
    plan.rollbackBaseline.forEach((baseline: IAutoMovieLegacyOwnedDirectoryBaseline, index: number) : void => legacyImportAssertBaseline(baseline, expected[index]!));
    if (plan.fingerprint !== fingerprintAutoMovieLegacyImportPlan(plan))
        throw new AutoMovieLegacyImportPlanError("fingerprint is stale");
    return plan;
};
