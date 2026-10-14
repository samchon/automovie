import { nclose } from "../internal/nclose";
import { designLineageDigest } from "../../../../packages/engine/src/architecture/designLineageDigest";
import { designLineageViewDigest } from "../../../../packages/engine/src/architecture/designLineageViewDigest";
import type { IAutoMovieDesignSubject, IAutoMovieDesignLineage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { brokenLineage, lineageDigest, renovationLineage } from "../internal/lineageFixtures";
import { throwsError } from "../internal/predicates";

/**
 * Digest complete lineage content and selected views independently of authored array order.
 *
 * Scenarios:
 * 1. The same fixture digests identically twice; reversing the listed top-level arrays, variant changes, phase prerequisites and artifact inputs preserves its digest.
 * 2. Editing one authored value moves the digest.
 * 3. A view digest replays: the same alternative at the same phase twice is one value.
 * 4. Two alternatives of one revision digest differently, and the base design differs from both.
 * 5. The same alternative at two phases digests differently.
 * 6. Replacing the declared texture digest and all its citation digests changes the tested view without reading a texture file.
 * 7. Two designs whose subject/aspect text concatenates to the same characters without field boundaries digest differently.
 * 8. An unknown alternative or phase is refused rather than digested.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls whole-lineage and selected-view digest functions, observing replay equality, the listed reversals, distinct authored value/base/variant/phase/asset-digest pairs, one field-boundary pair and unknown-selector throws. Order-dependent serialization or omitted selected facts contradict these relations; no stored expected hash or renderer output is compared.
 * @evidence contracts/testing.md#independent-expectations Repeated and reshuffled records must serialize equivalently; explicit authored value/variant/phase/asset changes and an ab+c versus a+bc field-boundary pair supply relations without a stored digest transcript, which tests serialization distinctions rather than universal hash uniqueness.
 * @evidence contracts/testing.md#distinguishing-cases Replay, the existing array reversals, changed content, base/alternative/phase views, replaced-and-requoted declared asset digests, the ab+c versus a+bc pair and unknown selectors retain the original cases. Decision-option/citation permutations, lone-surrogate encoding and universal hash collision freedom are not tested; no external texture bytes or renderer replay is loaded.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_lineage_digest imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_design_lineage_digest(): void {
  const lineage: IAutoMovieDesignLineage = renovationLineage();
  TestValidator.equals("the same authored lineage digests to the same value twice", designLineageDigest(lineage), designLineageDigest(renovationLineage()));

  const shuffled: IAutoMovieDesignLineage = brokenLineage((draft: IAutoMovieDesignLineage): void => {
    draft.subjects.reverse();
    draft.revisions.reverse();
    draft.phases.reverse();
    draft.lifecycles.reverse();
    draft.variants.reverse();
    draft.decisions.reverse();
    draft.derived.reverse();
    for (const variant of draft.variants) variant.changes.reverse();
    for (const phase of draft.phases) phase.requires.reverse();
    for (const artifact of draft.derived) artifact.inputs.reverse();
  });
  TestValidator.equals("reshuffling every authored array leaves the digest unchanged", designLineageDigest(shuffled), designLineageDigest(lineage));
  TestValidator.predicate(
    "editing one authored value moves the digest",
    designLineageDigest(
      brokenLineage((draft: IAutoMovieDesignLineage): void => {
        draft.variants[0]!.changes[0]!.value = "oak-plain-sawn";
      }),
    ) !== designLineageDigest(lineage),
  );

  const warm: string = designLineageViewDigest(lineage, {
    variant: "warm-oak",
    phase: "finishes",
  });
  TestValidator.equals("replaying one alternative at one phase yields the same view digest", designLineageViewDigest(renovationLineage(), {
      variant: "warm-oak",
      phase: "finishes",
    }), warm);
  const cool: string = designLineageViewDigest(lineage, {
    variant: "cool-stone",
    phase: "finishes",
  });
  const base: string = designLineageViewDigest(lineage, {
    variant: null,
    phase: "finishes",
  });
  TestValidator.predicate(
    "the two alternatives and the base design are three distinct views",
    (() : boolean => {
      const observed: number = new Set([warm, cool, base]).size;
      return (
        typeof observed === "number" && nclose(observed, 3)
      );
    })(),
  );
  TestValidator.predicate(
    "the same alternative at an earlier phase is a different view",
    designLineageViewDigest(lineage, {
      variant: "warm-oak",
      phase: "structure",
    }) !== warm,
  );

  TestValidator.predicate(
    "an imported texture's bytes move the view although the design did not",
    designLineageViewDigest(
      brokenLineage((draft: IAutoMovieDesignLineage): void => {
        // Update the declared asset digest and all matching citation metadata
        // together. This test does not replace a file or rebake an output;
        // changing only the subject would leave its old quotes inconsistent.
        const replaced: string = lineageDigest("5d");
        draft.subjects.find((subject: IAutoMovieDesignSubject): boolean => subject.id === "oak-texture")!.digest =
          replaced;
        for (const artifact of draft.derived)
          for (const citation of artifact.assets)
            if (citation.subject === "oak-texture") citation.digest = replaced;
      }),
      { variant: "warm-oak", phase: "finishes" },
    ) !== warm,
  );

  // Concatenation without field boundaries would read these subject/aspect
  // pairs identically: `ab` + `c` against `a` + `bc`.
  const collidable: (subject: string, aspect: string) => IAutoMovieDesignLineage = (
    subject: string,
    aspect: string,
  ): IAutoMovieDesignLineage => ({
    version: 1,
    id: "collide",
    head: "r1",
    subjects: [{ id: subject, graph: "element", digest: null }],
    revisions: [{ id: "r1", parent: null, digest: lineageDigest("0f") }],
    phases: [],
    lifecycles: [{ subject, introducedIn: null, removedIn: null }],
    variants: [
      {
        id: "v1",
        label: "one",
        base: "r1",
        changes: [
          {
            id: "c1",
            subject,
            aspect,
            value: "v",
            rationale: "collision probe",
          },
        ],
      },
    ],
    decisions: [],
    derived: [],
  });
  TestValidator.predicate(
    "authored text cannot forge a field boundary in the digest",
    designLineageViewDigest(collidable("ab", "c"), {
      variant: "v1",
      phase: null,
    }) !==
      designLineageViewDigest(collidable("a", "bc"), {
        variant: "v1",
        phase: null,
      }),
  );

  TestValidator.predicate(
    "an unknown alternative is refused rather than digested",
    throwsError(
      (): string =>
        designLineageViewDigest(lineage, { variant: "brutalist", phase: null }),
      'has no design variant "brutalist"',
    ),
  );
  TestValidator.predicate(
    "an unknown phase is refused rather than digested",
    throwsError(
      (): string =>
        designLineageViewDigest(lineage, {
          variant: "warm-oak",
          phase: "topping-out",
        }),
      'has no construction phase "topping-out"',
    ),
  );
}
