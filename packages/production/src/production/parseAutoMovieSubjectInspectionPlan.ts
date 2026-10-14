
import typia from "typia";
import { IAutoMovieSubjectInspectionPlanRecord } from "./IAutoMovieSubjectInspectionPlanRecord";
import { autoMovieSubjectInspectionPlanIdentity } from "./autoMovieSubjectInspectionPlanIdentity";
import { subjectInspectionIsContentDigest } from "./subjectInspectionIsContentDigest";

/**
 * Admit an exact v2 plan schema and its canonical ordered identity.
 *
 * @evidence contracts/common.md#principled-implementation Strict schema, nonblank context, compile-digest syntax and one pose per viewpoint precede recomputed identity equality.
 * @evidence contracts/common.md#clear-and-simple-design Schema/context admission delegates identity arithmetic to the publisher's same canonical owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching identity does not independently check viewpoint uniqueness, lens physics or actual images; old/malformed versions throw rather than being inferred.
 * @evidence contracts/common.md#meaningful-documentation Returns the original validated record, whose readonly/immutability is not runtime-enforced.
 * @evidence contracts/performance.md#efficient-algorithms Schema traversal plus complete canonical serialization/hash determine cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed record supplies both context checks and identity recomputation without a second schema copy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation/identity temporaries release and the returned record aliases caller input; no file is opened here.
 */
export function parseAutoMovieSubjectInspectionPlan(
  value: unknown
): IAutoMovieSubjectInspectionPlanRecord {
  const validation: typia.IValidation.IFailure | typia.IValidation.ISuccess<IAutoMovieSubjectInspectionPlanRecord> =
    typia.validateEquals<IAutoMovieSubjectInspectionPlanRecord>(value);
  if (validation.success === false)
    throw new Error(
      `Invalid AutoMovie subject-inspection plan: ${validation.errors
        .map((error: typia.IValidation.IError) : string => `${error.path} expects ${error.expected}`)
        .join("; ")}`,
    );
  const plan: IAutoMovieSubjectInspectionPlanRecord = validation.data;
  if (
    plan.productionId.trim().length === 0 ||
    plan.target.shot.trim().length === 0 ||
    plan.target.subject.trim().length === 0 ||
    plan.revision.trim().length === 0 ||
    subjectInspectionIsContentDigest(plan.compileFingerprint) === false ||
    plan.planned.length !== plan.poses.length
  )
    throw new Error(
      "Subject-inspection plan requires non-blank context, a current compile digest, and one pose per ordered viewpoint.",
    );
  if (autoMovieSubjectInspectionPlanIdentity(plan) !== plan.planIdentity)
    throw new Error(
      "Subject-inspection plan identity does not match its exact ordered context and poses.",
    );
  return plan;
}
