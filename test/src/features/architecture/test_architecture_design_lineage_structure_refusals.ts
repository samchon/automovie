import {
  validateDesignLineage,
  validateDesignLineageBinding,
} from "@automovie/engine";
import type {
  IAutoMovieDesignLifecycle,
  IAutoMovieDesignLineage,
  IAutoMovieDesignSubject,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  lineageDigest,
  refusesLineage as refuses,
  renovationLineage,
} from "../internal/lineageFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Validate lineage identity, revision ancestry, phase/lifecycle relations and binding to published identities.
 *
 * Scenarios:
 * 1. The coherent fixture validates before the existing targeted structural and binding mutations are evaluated.
 * 2. A blank identity or a wrong schema version is refused.
 * 3. Subject identities must be unique, non-blank, graph-labelled, and carry either a well-formed digest or none at all.
 * 4. A lineage with no revision, a dangling revision parent, a malformed revision digest, a revision cycle, and a dangling head are all refused, while a revision history twenty thousand ancestors deep validates without exhausting the call stack.
 * 5. A phase requiring nothing that exists, requiring the same phase twice, or requiring itself around a cycle is refused.
 * 6. A lifecycle about an unknown subject, a second lifecycle for one subject, a dangling introducing or removing phase, and a subject with no lifecycle at all are refused.
 * 7. A subject removed in a phase that does not follow the one that installed it is refused, including the incomparable-branch case where neither phase precedes the other.
 * 8. Binding accepts a lineage whose subjects all resolve, refuses one that names an identity nothing published, refuses a derived artifact squatting on a published identity, and does not complain about published identities the lineage simply does not track.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateDesignLineage and host-id binding on the authored fixture, requiring clean controls, targeted type/range path membership and successful admission after adding 20000 revision ancestors. Missing coverage, cyclic references, invalid removal order or artifact/host identity collisions change these Booleans; the deep case has no timing or allocation assertion.
 * @evidence contracts/testing.md#independent-expectations Literal mutation paths and prerequisite relations determine refusals, including removal in the introducing phase or an incomparable sibling. The explicit published list contains all subject ids plus untracked wall-east; removing opening-door or adding artifact id render-lobby fixes the binding expectations. A hand-constructed 20000-ancestor chain demands completion without stack overflow, while path membership permits other findings and does not prove asymptotic performance or inspect host geometry/bytes.
 * @evidence contracts/testing.md#distinguishing-cases Valid and blank/duplicate/dangling records, revision/phase cycles, deep ancestry, incomplete lifecycle coverage, incomparable removal, missing host identities, artifact squatting and untracked published identities preserve the cases; host geometry and content bytes are not inspected.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_lineage_structure_refusals imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_design_lineage_structure_refusals(): void {
  const published: string[] = [
    ...renovationLineage().subjects.map(
      (subject: IAutoMovieDesignSubject): string => subject.id,
    ),
    "wall-east",
  ];

  TestValidator.equals(
    "identity, revision, phase, and lifecycle refusals",
    namedFacts([
      [
        "the coherent renovation lineage validates",
        (): boolean =>
          validateDesignLineage({ lineage: renovationLineage() }).success,
      ],
      [
        "a blank lineage id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.id = "  ";
          }, "$input.id"),
      ],
      [
        "an unknown schema version is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            (draft as { version: number }).version = 2;
          }, "$input.version"),
      ],
      [
        "a blank subject id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.subjects[0]!.id = "";
          }, "$input.subjects[0].id"),
      ],
      [
        "a duplicated subject id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.subjects.push({
              id: "wall-north",
              graph: "element",
              digest: null,
            });
          }, "$input.subjects[11].id"),
      ],
      [
        "a subject with no graph label is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.subjects[0]!.graph = " ";
          }, "$input.subjects[0].graph"),
      ],
      [
        "a malformed subject digest is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.subjects[10]!.digest = "sha256:not-hex";
          }, "$input.subjects[10].digest"),
      ],
      [
        "a lineage recording no revision at all is refused",
        (): boolean =>
          refuses(
            (draft: IAutoMovieDesignLineage): void => {
              draft.revisions = [];
            },
            "$input.revisions",
            "range",
          ),
      ],
      [
        "a dangling revision parent is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.revisions[0]!.parent = "r0";
          }, "$input.revisions[0].parent"),
      ],
      [
        "a malformed revision digest is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.revisions[1]!.digest = "sha256:2B2B";
          }, "$input.revisions[1].digest"),
      ],
      [
        "a revision that supersedes its own successor is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.revisions[0]!.parent = "r2";
          }, "$input.revisions[0].parent"),
      ],
      [
        "a revision history deeper than the call stack still validates",
        (): boolean => {
          const lineage: IAutoMovieDesignLineage = renovationLineage();
          const depth: 20000 = 20_000;
          lineage.revisions[0]!.parent = "ancestor-0";
          for (let index: number = 0; index < depth; ++index)
            lineage.revisions.push({
              id: `ancestor-${index}`,
              parent: index + 1 === depth ? null : `ancestor-${index + 1}`,
              digest: lineageDigest("ad"),
            });
          return validateDesignLineage({ lineage }).success;
        },
      ],
      [
        "a head naming no recorded revision is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.head = "r9";
          }, "$input.head"),
      ],
      [
        "a phase with no label is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.phases[0]!.label = "";
          }, "$input.phases[0].label"),
      ],
      [
        "a prerequisite naming no phase is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.phases[3]!.requires = ["ghost"];
          }, "$input.phases[3].requires[0]"),
      ],
      [
        "the same prerequisite twice is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.phases[3]!.requires = ["strip", "strip"];
          }, "$input.phases[3].requires[1]"),
      ],
      [
        "a construction plan that requires itself around a cycle is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.phases[0]!.requires = ["finishes"];
          }, "$input.phases"),
      ],
      [
        "a lifecycle about an unknown subject is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles[0]!.subject = "wall-east";
          }, "$input.lifecycles[0].subject"),
      ],
      [
        "a second lifecycle for one subject is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles.push({
              subject: "wall-north",
              introducedIn: null,
              removedIn: "strip",
            });
          }, "$input.lifecycles[11].subject"),
      ],
      [
        "a dangling introducing phase is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles[3]!.introducedIn = "ghost";
          }, "$input.lifecycles[3].introducedIn"),
      ],
      [
        "a dangling removing phase is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles[3]!.removedIn = "ghost";
          }, "$input.lifecycles[3].removedIn"),
      ],
      [
        "a subject with no lifecycle at all is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles = draft.lifecycles.filter(
              (lifecycle: IAutoMovieDesignLifecycle): boolean =>
                lifecycle.subject !== "wall-west",
            );
          }, "$input.subjects[2].id"),
      ],
      [
        "removing a subject in the very phase that installs it is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles[3]!.removedIn = "shore";
          }, "$input.lifecycles[3].removedIn"),
      ],
      [
        "removing a subject on a branch that never follows its installation is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.lifecycles[3]!.removedIn = "strip";
          }, "$input.lifecycles[3].removedIn"),
      ],
      [
        "a prerequisite chain that dead-ends still reports the ordering defect",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.phases[3]!.requires = ["ghost"];
          }, "$input.lifecycles[3].removedIn"),
      ],
    ]),
    {
      "the coherent renovation lineage validates": true,
      "a blank lineage id is refused": true,
      "an unknown schema version is refused": true,
      "a blank subject id is refused": true,
      "a duplicated subject id is refused": true,
      "a subject with no graph label is refused": true,
      "a malformed subject digest is refused": true,
      "a lineage recording no revision at all is refused": true,
      "a dangling revision parent is refused": true,
      "a malformed revision digest is refused": true,
      "a revision that supersedes its own successor is refused": true,
      "a revision history deeper than the call stack still validates": true,
      "a head naming no recorded revision is refused": true,
      "a phase with no label is refused": true,
      "a prerequisite naming no phase is refused": true,
      "the same prerequisite twice is refused": true,
      "a construction plan that requires itself around a cycle is refused": true,
      "a lifecycle about an unknown subject is refused": true,
      "a second lifecycle for one subject is refused": true,
      "a dangling introducing phase is refused": true,
      "a dangling removing phase is refused": true,
      "a subject with no lifecycle at all is refused": true,
      "removing a subject in the very phase that installs it is refused": true,
      "removing a subject on a branch that never follows its installation is refused": true,
      "a prerequisite chain that dead-ends still reports the ordering defect": true,
    },
  );

  TestValidator.equals(
    "binding checks the host graphs the lineage cannot see from inside",
    namedFacts([
      // `published` also carries `wall-east`, which the lineage never tracks,
      // so this clean binding is also the case that an untracked published
      // identity is not a defect.
      [
        "a lineage whose subjects all resolve binds cleanly",
        (): boolean =>
          validateDesignLineageBinding({
            lineage: renovationLineage(),
            known: published,
          }).success,
      ],
      [
        "a subject resolving to nothing published is refused",
        (): boolean =>
          hasViolation(
            validateDesignLineageBinding({
              lineage: renovationLineage(),
              known: published.filter(
                (id: string): boolean => id !== "opening-door",
              ),
            }),
            "type",
            "$input.subjects[5].id",
          ),
      ],
      [
        "a derived artifact squatting on a published identity is refused",
        (): boolean =>
          hasViolation(
            validateDesignLineageBinding({
              lineage: renovationLineage(),
              known: [...published, "render-lobby"],
            }),
            "type",
            "$input.derived[6].id",
          ),
      ],
    ]),
    {
      "a lineage whose subjects all resolve binds cleanly": true,
      "a subject resolving to nothing published is refused": true,
      "a derived artifact squatting on a published identity is refused": true,
    },
  );
}
