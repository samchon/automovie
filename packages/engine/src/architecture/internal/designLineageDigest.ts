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

import { autoMovieRenderDigest } from "../../render/internal/autoMovieRenderDigest";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
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
 * Every field of the lineage, its subjects, revisions, phases, lifecycles,
 * variants with their changes, decisions and derived artifacts is serialized,
 * except a derived artifact's asset citations: on a valid lineage a citation
 * exists for exactly the inputs that carry imported bytes, at exactly the
 * digests those subjects declare, so both facts are already in the subject and
 * derived lines. Citation facts are derivable; citation ordering is ignored
 * even though a valid record can reorder that array.
 *
 * @param lineage Lineage to digest.
 * @returns A `sha256:` digest of the canonical serialization; an invalid
 *   lineage throws an `Error` instead.
 */
export function designLineageDigest(lineage: IAutoMovieDesignLineage): string {
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
    ).map((subject: IAutoMovieDesignSubject): string =>
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
    ).map((revision: IAutoMovieDesignRevision): string =>
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
    ).map((phase: IAutoMovieDesignPhase): string =>
      designLineageRecord(
        "phase",
        phase.id,
        phase.label,
        ...[...phase.requires].sort(AutoMovieEngineText.compareCodeUnits),
      ),
    ),
    ...sortedBy(
      lineage.lifecycles,
      (lifecycle: IAutoMovieDesignLifecycle): string => lifecycle.subject,
    ).map((lifecycle: IAutoMovieDesignLifecycle): string =>
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
    ).flatMap((variant: IAutoMovieDesignVariant): string[] => [
      designLineageRecord("variant", variant.id, variant.label, variant.base),
      ...sortedBy(
        variant.changes,
        (change: IAutoMovieDesignChange): string => change.id,
      ).map((change: IAutoMovieDesignChange): string =>
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
    ]),
    ...sortedBy(
      lineage.decisions,
      (decision: IAutoMovieDesignDecision): string => decision.id,
    ).map((decision: IAutoMovieDesignDecision): string =>
      designLineageRecord(
        "decision",
        decision.id,
        decision.question,
        decision.selected ?? "",
        ...[...decision.options].sort(AutoMovieEngineText.compareCodeUnits),
      ),
    ),
    ...sortedBy(
      lineage.derived,
      (artifact: IAutoMovieDerivedArtifact): string => artifact.id,
    ).map((artifact: IAutoMovieDerivedArtifact): string =>
      designLineageRecord(
        "derived",
        artifact.id,
        artifact.kind,
        artifact.digest,
        artifact.stamp.revision,
        artifact.stamp.variant ?? "",
        artifact.stamp.phase ?? "",
        artifact.stamp.configuration,
        ...[...artifact.inputs].sort(AutoMovieEngineText.compareCodeUnits),
      ),
    ),
  ];
  return autoMovieRenderDigest(lines.join("\n"));
}

/** A code-unit-sorted copy of one collection, keyed by one string field. */
const sortedBy: <T>(items: readonly T[], key: (item: T) => string) => T[] = <T>(
  items: readonly T[],
  key: (item: T) => string,
): T[] =>
  [...items].sort((left: T, right: T): number =>
    AutoMovieEngineText.compareCodeUnits(key(left), key(right)),
  );
