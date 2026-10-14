import type { IAutoMovieDesignLineage, IAutoMovieDesignComparison, IAutoMovieDesignDifference } from "@automovie/interface";
import { designLineageCompare } from "../../../../packages/engine/src/architecture/designLineageCompare";
import { designLineageDecisionComparisons } from "../../../../packages/engine/src/architecture/designLineageDecisionComparisons";
import { designLineageDigest } from "../../../../packages/engine/src/architecture/designLineageDigest";
import { validateDesignLineage } from "../../../../packages/engine/src/architecture/validateDesignLineage";
import { TestValidator } from "@nestia/e2e";
import { brokenLineage, renovationLineage } from "../internal/lineageFixtures";
import { throwsError } from "../internal/predicates";

/**
 * Compare shared-revision alternatives and pairwise decisions while retaining rejected schemes after selection.
 *
 * Scenarios:
 * 1. Two schemes on one revision differ in material, pattern, lighting, and layout, and every difference names a subject id both schemes carry. Two aspects of one subject stay two differences about one identity, never two subjects.
 * 2. An aspect only one scheme edits reports the other side as null, in both directions, so a one-sided change is a difference rather than a silence.
 * 3. An aspect both schemes edit to the same value is not a difference, while the subject still leaves the common basis: agreeing is not the same as not deciding.
 * 4. The common basis is exactly the subjects neither scheme edits.
 * 5. The two-option decision returns its one comparison in ascending option-id order with the expected reversed sides.
 * 6. Recording selection validates, preserves the tested difference list and changes the digest for this authored record pair.
 * 7. Two alternatives on different base revisions are refused rather than compared, and an unknown variant or decision is refused rather than answered as empty.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls designLineageCompare, decision comparisons, validation and digest, observing revision/side ids, complete authored difference/common lists, one decision pair, preserved selected-state differences and refusal fragments. Collapsing two floor aspects, reporting identical plaster as different or discarding a rejected option changes these records; no material or lighting is rendered.
 * @evidence contracts/testing.md#independent-expectations The renovation fixture explicitly changes floor material/pattern, lighting, one-sided layout/window and identical plaster, so differences and untouched common identities are hand-listed; digest assertions compare changed records without a stored hash oracle.
 * @evidence contracts/testing.md#distinguishing-cases Shared and differing bases, one-sided and identical edits, untouched identities, decision option ordering, a settled selection and unknown variant/decision refusal retain the existing cases; the test compares declared change text, not material appearance.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_lineage_alternatives imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_design_lineage_alternatives(): void {
  const lineage: IAutoMovieDesignLineage = renovationLineage();
  const comparison: IAutoMovieDesignComparison = designLineageCompare(lineage, "warm-oak", "cool-stone");

  TestValidator.equals("two interior schemes are compared on the revision they share", [comparison.revision, comparison.left, comparison.right], ["r2", "warm-oak", "cool-stone"]);
  TestValidator.equals("material, lighting, and layout differences all name a shared identity", comparison.differences, [
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
    ]);
  TestValidator.equals(
    "the aspect both schemes settle identically is not reported as a difference",
    comparison.differences.some(
      (difference: IAutoMovieDesignDifference): boolean => difference.subject === "wall-north",
    ),
    false,
  );
  TestValidator.equals("the common basis is exactly the subjects neither scheme edits", comparison.common, [
      "door-leaf",
      "oak-texture",
      "opening-door",
      "shoring-frame",
      "wall-south",
      "wall-west",
    ]);

  const pairs: IAutoMovieDesignComparison[] = designLineageDecisionComparisons(lineage, "d-interior");
  TestValidator.equals("the open decision compares its two options in ascending option order", pairs.map((pair: IAutoMovieDesignComparison): string[] => [pair.left, pair.right]), [["cool-stone", "warm-oak"]]);
  TestValidator.equals("the pairwise comparison is the mirror of the direct one", pairs[0]!.differences, [
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
    ]);

  const settled: IAutoMovieDesignLineage = brokenLineage((draft: IAutoMovieDesignLineage): void => {
    draft.decisions[0]!.selected = "warm-oak";
  });
  TestValidator.equals(
    "a settled decision still validates",
    validateDesignLineage({ lineage: settled }).success,
    true,
  );
  TestValidator.equals("the rejected scheme is still comparable after the choice is made", designLineageCompare(settled, "warm-oak", "cool-stone").differences, comparison.differences);
  TestValidator.predicate(
    "recording the selection moves the lineage digest",
    designLineageDigest(settled) !== designLineageDigest(lineage),
  );

  TestValidator.predicate(
    "alternatives on different base revisions are refused, not mixed",
    throwsError(
      (): IAutoMovieDesignComparison => designLineageCompare(lineage, "warm-oak", "legacy-scheme"),
      [
        'cannot compare variant "warm-oak" of revision "r2"',
        'variant "legacy-scheme" of revision "r1"',
      ],
    ),
  );
  TestValidator.predicate(
    "an unknown alternative is refused rather than compared as empty",
    throwsError(
      (): IAutoMovieDesignComparison => designLineageCompare(lineage, "warm-oak", "brutalist"),
      'has no design variant "brutalist"',
    ),
  );
  TestValidator.predicate(
    "an unknown decision is refused rather than answered with no pairs",
    throwsError(
      (): IAutoMovieDesignComparison[] => designLineageDecisionComparisons(lineage, "d-roof"),
      'has no decision "d-roof"',
    ),
  );
}
