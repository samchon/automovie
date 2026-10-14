import {
  IAutoMovieDerivedArtifact,
  IAutoMovieDesignChange,
  IAutoMovieDesignDecision,
  IAutoMovieDesignLifecycle,
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhase,
  IAutoMovieDesignRevision,
  IAutoMovieDesignSubject,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { designLineageRecord } from "./designLineageRecord";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/**
 * Digest the whole lineage record.
 *
 * Serialization is length-prefixed and sorted by code unit, never by locale and
 * never in authoring order, so the same authored lineage digests identically on
 * Windows and POSIX and after any reshuffle of its arrays. Every separator is
 * written here rather than taken from the platform, which is why no newline
 * convention can reach the bytes.
 *
 * Every field of the lineage, its subjects, revisions, phases, lifecycles, variants with their changes, decisions and derived artifacts is serialized, except a derived artifact's asset citations: on a valid lineage a citation exists for exactly the inputs that carry imported bytes, at exactly the digests those subjects declare, so both facts are already in the subject and derived lines. Citation facts are derivable; citation ordering is ignored even though a valid record can reorder that array.
 *
 * @param lineage Lineage to digest.
 * @returns A `sha256:` digest of the canonical serialization; an invalid lineage throws an `Error` instead.
 *
 * @evidence contracts/common.md#principled-implementation Sorts records/id lists by code unit, encodes length-prefixed UTF-16 lines and hashes their UTF-8 encoding with `autoMovieRenderDigest`. Ordering/newline conventions are explicit. Distinct UTF-16 strings containing lone surrogates can encode to the same replacement bytes; SHA-256 also does not provide a mathematical collision-free identity guarantee.
 * @evidence contracts/common.md#clear-and-simple-design One canonical line per record kind, using the shared line encoder and validation guard rather than private copies; the citation omission is explained where it happens.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no lineage or record; the one omitted field is omitted for every lineage because validation makes it derivable, not to match a fixture.
 * @evidence contracts/common.md#meaningful-documentation States the canonical ordering and why, the separator ownership, which fields are serialized, why citations are not, the digest format, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Pays complete lineage validation, including prerequisite walks and decision-by-artifact fairness, then collection/nested-id sorting, serialization and hashing. Sort comparisons cost their compared code-unit lengths; the serialization-size term includes all nested fields rather than only top-level record count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Digests the record it is handed each call; a cached digest could not prove the caller's mutable record unchanged.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the sorted copies and serialized lines only for the call and returns one digest string.
 */
export const designLineageDigest: (lineage: IAutoMovieDesignLineage) => string = (
  lineage: IAutoMovieDesignLineage,
): string => {
  requireValidDesignLineage(lineage);
  const lines: string[] = [
    designLineageRecord(
      "lineage",
      lineage.id,
      String(lineage.version),
      lineage.head,
    ),
    ...sortedBy(
      lineage.subjects,
      (subject: IAutoMovieDesignSubject): string => subject.id,
    ).map(
      (subject: IAutoMovieDesignSubject): string =>
        designLineageRecord(
          "subject",
          subject.id,
          subject.graph,
          subject.digest ?? "",
        ),
    ),
    ...sortedBy(
      lineage.revisions,
      (revision: IAutoMovieDesignRevision): string => revision.id,
    ).map(
      (revision: IAutoMovieDesignRevision): string =>
        designLineageRecord(
          "revision",
          revision.id,
          revision.parent ?? "",
          revision.digest,
        ),
    ),
    ...sortedBy(
      lineage.phases,
      (phase: IAutoMovieDesignPhase): string => phase.id,
    ).map(
      (phase: IAutoMovieDesignPhase): string =>
        designLineageRecord(
          "phase",
          phase.id,
          phase.label,
          ...[...phase.requires].sort(compareCodeUnits),
        ),
    ),
    ...sortedBy(
      lineage.lifecycles,
      (lifecycle: IAutoMovieDesignLifecycle): string => lifecycle.subject,
    ).map(
      (lifecycle: IAutoMovieDesignLifecycle): string =>
        designLineageRecord(
          "lifecycle",
          lifecycle.subject,
          lifecycle.introducedIn ?? "",
          lifecycle.removedIn ?? "",
        ),
    ),
    ...sortedBy(
      lineage.variants,
      (variant: IAutoMovieDesignVariant): string => variant.id,
    ).flatMap(
      (variant: IAutoMovieDesignVariant): string[] => [
        designLineageRecord("variant", variant.id, variant.label, variant.base),
        ...sortedBy(
          variant.changes,
          (change: IAutoMovieDesignChange): string => change.id,
        ).map(
          (change: IAutoMovieDesignChange): string =>
            designLineageRecord(
              "change",
              variant.id,
              change.id,
              change.subject,
              change.aspect,
              change.value,
              change.rationale,
            ),
        ),
      ],
    ),
    ...sortedBy(
      lineage.decisions,
      (decision: IAutoMovieDesignDecision): string => decision.id,
    ).map(
      (decision: IAutoMovieDesignDecision): string =>
        designLineageRecord(
          "decision",
          decision.id,
          decision.question,
          decision.selected ?? "",
          ...[...decision.options].sort(compareCodeUnits),
        ),
    ),
    ...sortedBy(
      lineage.derived,
      (artifact: IAutoMovieDerivedArtifact): string => artifact.id,
    ).map(
      (artifact: IAutoMovieDerivedArtifact): string =>
        designLineageRecord(
          "derived",
          artifact.id,
          artifact.kind,
          artifact.digest,
          artifact.stamp.revision,
          artifact.stamp.variant ?? "",
          artifact.stamp.phase ?? "",
          artifact.stamp.configuration,
          ...[...artifact.inputs].sort(compareCodeUnits),
        ),
    ),
  ];
  return autoMovieRenderDigest(lines.join("\n"));
};

/** A code-unit-sorted copy of one collection, keyed by one string field. */
const sortedBy: <T>(items: readonly T [ ], key: ( item : T ) => string) => T [ ] = <T,>(items: readonly T[], key: (item: T) => string): T[] =>
  [...items].sort((left: T, right: T): number =>
    compareCodeUnits(key(left), key(right)),
  );
