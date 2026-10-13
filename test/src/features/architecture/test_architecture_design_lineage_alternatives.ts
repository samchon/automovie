import {
  designLineageCompare,
  designLineageDecisionComparisons,
  designLineageDigest,
  validateDesignLineage,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { brokenLineage, renovationLineage } from "../internal/lineageFixtures";
import { throwsError } from "../internal/predicates";

/**
 *
 * Pin that two interior alternatives are compared without either of them
 * forking the building.
 *
 * An alternative that copies the design destroys the only thing that makes two
 * schemes comparable: the shared identity underneath them. So a variant carries
 * a change set over a common revision, every difference it reports names one
 * subject id both schemes hold, and the subjects neither scheme touches are
 * reported as the common basis rather than silently assumed.
 *
 * A choice does not consume the alternatives it rejected. After the decision is
 * settled, both schemes are still on the record with their changes and their
 * reasons, and the comparison that justified the choice still produces the same
 * answer.
 *
 * Scenarios:
 *
 * 1. Two schemes on one revision differ in material, pattern, lighting, and
 *    layout, and every difference names a subject id both schemes carry. Two
 *    aspects of one subject stay two differences about one identity, never two
 *    subjects.
 * 2. An aspect only one scheme edits reports the other side as null, in both
 *    directions, so a one-sided change is a difference rather than a silence.
 * 3. An aspect both schemes edit to the same value is not a difference, while the
 *    subject still leaves the common basis: agreeing is not the same as not
 *    deciding.
 * 4. The common basis is exactly the subjects neither scheme edits.
 * 5. A decision compares its options pairwise in ascending option order, so a
 *    study reads the same way twice.
 * 6. Recording the selection still validates, keeps the alternatives'
 *    comparison identical, and moves the lineage digest because the record
 *    changed.
 * 7. Two alternatives on different base revisions are refused rather than
 *    compared, and an unknown variant or decision is refused rather than
 *    answered as empty.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `designLineageCompare`, `designLineageDecisionComparisons`, `validateDesignLineage` and `designLineageDigest` over the renovation lineage and asserts the compared revision, the ordered differences with both sides, the common basis, the pairwise decision comparison, validity and comparison after a selection, digest movement and refusals; it catches a one-sided change dropped, two aspects of one subject merged, an agreed aspect reported as a difference, an agreed subject left in the common basis, options compared out of order, a selection that alters the comparison or leaves the digest unchanged, and variants on different revisions compared.
 * @evidence contracts/testing.md#independent-expectations Differences are read off the two fixture variants on `r2`: floor material and pattern, lamp lighting, `room-main` layout only in warm-oak and `window-north` material only in cool-stone, with `wall-north` set to `lime-plaster` by both and so absent; the common basis is the subjects neither variant edits, sorted; the decision pair is the two options in ascending id order with sides mirrored; the digest is compared only for change, never to a stored value, and refusals match phrases naming both variants and revisions.
 * @evidence contracts/testing.md#distinguishing-cases Positive comparison and decision pairs; a one-sided change in each direction; an aspect both sides settle identically; an unsettled and a settled decision; refusals for variants on different base revisions, an unknown variant and an unknown decision; structural validation of variants and decisions is owned by test_architecture_design_lineage_structure_refusals and the digest's stability by test_architecture_design_lineage_digest.
 */
export const test_architecture_design_lineage_alternatives = (): void => {
  const lineage = renovationLineage();
  const comparison = designLineageCompare(lineage, "warm-oak", "cool-stone");

  TestValidator.equals(
    "two interior schemes are compared on the revision they share",
    [comparison.revision, comparison.left, comparison.right],
    ["r2", "warm-oak", "cool-stone"],
  );
  TestValidator.equals(
    "material, lighting, and layout differences all name a shared identity",
    comparison.differences,
    [
      {
        subject: "floor-oak",
        aspect: "material",
        left: "oak-rift-sawn",
        right: "limestone-honed",
      },
      {
        subject: "floor-oak",
        aspect: "pattern",
        left: "herringbone",
        right: "stack-bond",
      },
      {
        subject: "pendant-lamp",
        aspect: "lighting",
        left: "2700K",
        right: "4000K",
      },
      { subject: "room-main", aspect: "layout", left: "open", right: null },
      {
        subject: "window-north",
        aspect: "material",
        left: null,
        right: "bronze-frame",
      },
    ],
  );
  TestValidator.equals(
    "the aspect both schemes settle identically is not reported as a difference",
    comparison.differences.some(
      (difference) => difference.subject === "wall-north",
    ),
    false,
  );
  TestValidator.equals(
    "the common basis is exactly the subjects neither scheme edits",
    comparison.common,
    [
      "door-leaf",
      "oak-texture",
      "opening-door",
      "shoring-frame",
      "wall-south",
      "wall-west",
    ],
  );

  const pairs = designLineageDecisionComparisons(lineage, "d-interior");
  TestValidator.equals(
    "the open decision compares its two options in ascending option order",
    pairs.map((pair) => [pair.left, pair.right]),
    [["cool-stone", "warm-oak"]],
  );
  TestValidator.equals(
    "the pairwise comparison is the mirror of the direct one",
    pairs[0]!.differences,
    [
      {
        subject: "floor-oak",
        aspect: "material",
        left: "limestone-honed",
        right: "oak-rift-sawn",
      },
      {
        subject: "floor-oak",
        aspect: "pattern",
        left: "stack-bond",
        right: "herringbone",
      },
      {
        subject: "pendant-lamp",
        aspect: "lighting",
        left: "4000K",
        right: "2700K",
      },
      { subject: "room-main", aspect: "layout", left: null, right: "open" },
      {
        subject: "window-north",
        aspect: "material",
        left: "bronze-frame",
        right: null,
      },
    ],
  );

  const settled = brokenLineage((draft) => {
    draft.decisions[0]!.selected = "warm-oak";
  });
  TestValidator.equals(
    "a settled decision still validates",
    validateDesignLineage({ lineage: settled }).success,
    true,
  );
  TestValidator.equals(
    "the rejected scheme is still comparable after the choice is made",
    designLineageCompare(settled, "warm-oak", "cool-stone").differences,
    comparison.differences,
  );
  TestValidator.predicate(
    "recording the selection moves the lineage digest",
    designLineageDigest(settled) !== designLineageDigest(lineage),
  );

  TestValidator.predicate(
    "alternatives on different base revisions are refused, not mixed",
    throwsError(
      () => designLineageCompare(lineage, "warm-oak", "legacy-scheme"),
      [
        'cannot compare variant "warm-oak" of revision "r2"',
        'variant "legacy-scheme" of revision "r1"',
      ],
    ),
  );
  TestValidator.predicate(
    "an unknown alternative is refused rather than compared as empty",
    throwsError(
      () => designLineageCompare(lineage, "warm-oak", "brutalist"),
      'has no design variant "brutalist"',
    ),
  );
  TestValidator.predicate(
    "an unknown decision is refused rather than answered with no pairs",
    throwsError(
      () => designLineageDecisionComparisons(lineage, "d-roof"),
      'has no decision "d-roof"',
    ),
  );
};
