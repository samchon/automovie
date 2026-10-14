import { IAutoMovieSubjectDescription, IAutoMovieSubjectReviewUnit, type AutoMovieSubjectKind, type IAutoMovieSubjectArtifact, type IAutoMovieSubjectReviewTarget } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveAutoMovieSubjectReviewUnit } from "@automovie/engine";

import { subjectInspectionArtifact } from "../internal/subjectInspectionArtifact";
import { subjectInspectionInstanceSet } from "../internal/subjectInspectionInstanceSet";
import { throwsError } from "../internal/throwsError";

/**
 * Subject review resolves the compiled subject identity instead of rebuilding
 * a parallel element, part, prototype, instance, or space index.
 *
 * Structural subjects are the population this case owns. Subject review also
 * admits the separately compiled formation record, which is not a structural
 * description and carries no prototype, placement, or owner link, so the
 * projection filters that role out instead of asserting fields it never has.
 *
 * Scenarios:
 *
 * 1. Prototype, placed part, compact instance, and space targets retain the
 *    exact description identity, revision, role, and composition links exposed
 *    by compiled-subject inspection.
 * 2. Every resolved unit assigns viewpoint authority to inspection and is
 *    structurally ineligible as delivery evidence.
 * 3. A missing subject fails through the shared compiled-subject resolver
 *    rather than producing an empty review unit.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves four structural subject review targets and asserts exact identity, revision, owner/placement/prototype links and inspection-only authority; substituting another role or admitting a missing subject fails.
 * @evidence contracts/testing.md#independent-expectations Literal authored subject addresses and revision define the expected four records, rather than calling another resolver for the expected array. Filtering formation units cannot hide a wrong role because the full four-record equality still fails on a missing entry; formation review is outside this structural population.
 * @evidence contracts/testing.md#distinguishing-cases Keeps reusable prototype, placed part, compact member and logical space, with their distinct nullable ownership links and missing-id refusal; production parity separately owns the negative delivery-evidence type consumer.
 * @evidence contracts/testing.md#execution-ownership This exported inspection entry is discovered by the normal test runner and directly invokes review-unit source on an in-memory compiled artifact; it checks identity/eligibility, not actual camera coverage or delivered imagery.
 */
export function test_inspection_subject_review_identity(): void {
  const artifact: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    instanceSets: [
      subjectInspectionInstanceSet({
        id: "banner-field",
        model: "solar-oriel-model",
        count: 2,
      }),
    ],
  });
  const ids: string[] = [
    "prototype:guard-rack-west-pole-0-model",
    "element-part:castle/guard-rack-west-pole-0/body",
    "instance:banner-field:slot:000001",
    "space:castle/hall",
  ];
  const units: (IAutoMovieSubjectReviewUnit & {
    description: IAutoMovieSubjectDescription;
  })[] = ids
    .map(
      (subject: string): IAutoMovieSubjectReviewUnit =>
        resolveAutoMovieSubjectReviewUnit(artifact, {
          shot: "inspection-shot",
          subject,
        }),
    )
    .filter(isStructuralSubjectReviewUnit);
  TestValidator.equals(
    "review units preserve the shared compiled-subject identities",
    units.map(
      (
        unit: IAutoMovieSubjectReviewUnit & {
          description: IAutoMovieSubjectDescription;
        },
      ): {
        version: 1;
        target: IAutoMovieSubjectReviewTarget;
        revision: string;
        kind: AutoMovieSubjectKind;
        prototype: string | null;
        placement: string | null;
        owner: string | null;
        viewpointOwner: "inspection";
        deliveryEvidenceEligible: false;
      } => ({
        version: unit.version,
        target: unit.target,
        revision: unit.description.revision,
        kind: unit.description.kind,
        prototype: unit.description.prototype,
        placement: unit.description.placement,
        owner: unit.description.owner,
        viewpointOwner: unit.viewpointOwner,
        deliveryEvidenceEligible: unit.deliveryEvidenceEligible,
      }),
    ),
    [
      {
        version: 1,
        target: {
          shot: "inspection-shot",
          subject: "prototype:guard-rack-west-pole-0-model",
        },
        revision: "sha256:inspection-a",
        kind: "prototype",
        prototype: null,
        placement: null,
        owner: null,
        viewpointOwner: "inspection",
        deliveryEvidenceEligible: false,
      },
      {
        version: 1,
        target: {
          shot: "inspection-shot",
          subject: "element-part:castle/guard-rack-west-pole-0/body",
        },
        revision: "sha256:inspection-a",
        kind: "part",
        prototype: "prototype-part:guard-rack-west-pole-0-model/body",
        placement: "element-part:castle/guard-rack-west-pole-0/body",
        owner: "element:castle/guard-rack-west-pole-0",
        viewpointOwner: "inspection",
        deliveryEvidenceEligible: false,
      },
      {
        version: 1,
        target: {
          shot: "inspection-shot",
          subject: "instance:banner-field:slot:000001",
        },
        revision: "sha256:inspection-a",
        kind: "instance",
        prototype: "prototype:solar-oriel-model",
        placement: "instance:banner-field:slot:000001",
        owner: "instance-set:banner-field",
        viewpointOwner: "inspection",
        deliveryEvidenceEligible: false,
      },
      {
        version: 1,
        target: {
          shot: "inspection-shot",
          subject: "space:castle/hall",
        },
        revision: "sha256:inspection-a",
        kind: "space",
        prototype: null,
        placement: "space:castle/hall",
        owner: null,
        viewpointOwner: "inspection",
        deliveryEvidenceEligible: false,
      },
    ],
  );
  TestValidator.equals(
    "a missing compiled subject cannot become a review unit",
    throwsError(
      (): IAutoMovieSubjectReviewUnit =>
        resolveAutoMovieSubjectReviewUnit(artifact, {
          shot: "inspection-shot",
          subject: "element:castle/missing",
        }),
      "does not exist",
    ),
    true,
  );
}

/**
 * True when a resolved unit carries the shared structural description.
 *
 * Filtering rather than casting keeps the formation role from silently
 * answering a structural-identity assertion: a formation unit drops out of the
 * projected array and the comparison fails on the missing entry.
 */
const isStructuralSubjectReviewUnit: (
  unit: IAutoMovieSubjectReviewUnit,
) => unit is IAutoMovieSubjectReviewUnit & {
  description: IAutoMovieSubjectDescription;
} = (
  unit: IAutoMovieSubjectReviewUnit,
): unit is IAutoMovieSubjectReviewUnit & {
  description: IAutoMovieSubjectDescription;
} => unit.description.kind !== "formation";
