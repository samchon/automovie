import {
  IAutoMovieDerivedArtifact,
  IAutoMovieDesignLineage,
  IAutoMovieDesignSubject,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Check a lineage against the identities its host graphs actually publish.
 *
 * Self-consistency is not enough: a lineage annotates ids it does not own, so a
 * renamed wall leaves a phase plan quietly talking about nothing. The caller
 * hands over every stable id its graphs publish, which is why this stays a
 * separate function; binding lineage to one named graph would make it useless
 * to the next fold that lands.
 *
 * A host id absent from the lineage is not an error. Lineage is additive, and a
 * production may phase one wing and leave the rest unannotated. The refusals
 * run the other way: a declared subject that resolves to nothing, and a derived
 * artifact id that squats on a design identity.
 *
 * Ids are compared exactly. Findings are returned with `$input.subjects[i].id`
 * or `$input.derived[i].id` paths and nothing throws; the lineage's own
 * consistency is {@link validateDesignLineage}'s to check.
 *
 * @param props.lineage Lineage whose subjects and derived ids are checked.
 * @param props.known Every stable id the host graphs publish.
 * @returns Success, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Set membership by exact string equality is the whole question, since a host identity either is or is not published; the direction of the check follows from lineage being an additive annotation.
 * @evidence contracts/common.md#clear-and-simple-design Kept apart from `validateDesignLineage` because the published id list belongs to the caller's host graphs, which this function names none of, so any graph that publishes ids can bind a lineage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No graph or id is special-cased, and unannotated host ids are allowed by the additive contract rather than tolerated for a fixture.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why binding is separate, what is and is not an error, the exact comparison, the paths, that nothing throws, and which function checks self-consistency.
 * @evidence contracts/performance.md#efficient-algorithms O(K + S + D) for K known ids, S subjects and D derived artifacts: one set build and one lookup per lineage id.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one lineage against one id list per call that coordinates no shared work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The published-id set is local and released on return, bounded by the known-id count; the returned validation holds the findings.
 */
export const validateDesignLineageBinding: (props: {
  /** Lineage whose subjects and derived ids are checked. */ lineage: IAutoMovieDesignLineage;
  /** Every stable id the host graphs publish, in any order, duplicates allowed. */ known: readonly string[];
}) => IAutoMovieValidation = (props: {
  /** Lineage whose subjects and derived ids are checked. */
  lineage: IAutoMovieDesignLineage;

  /** Every stable id the host graphs publish, in any order, duplicates allowed. */
  known: readonly string[];
}): IAutoMovieValidation => {
  const lineage: IAutoMovieDesignLineage = props.lineage;
  const known: readonly string[] = props.known;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";
  const published: Set<string> = new Set(known);
  lineage.subjects.forEach(
    (subject: IAutoMovieDesignSubject, index: number): void => {
      if (!published.has(subject.id))
        out.push(
          "type",
          `${root}.subjects[${index}].id`,
          `lineage subject "${subject.id}" resolves to no published identity`,
          subject.id,
        );
    },
  );
  lineage.derived.forEach(
    (artifact: IAutoMovieDerivedArtifact, index: number): void => {
      if (published.has(artifact.id))
        out.push(
          "type",
          `${root}.derived[${index}].id`,
          `derived artifact "${artifact.id}" collides with a published design identity`,
          artifact.id,
        );
    },
  );
  return out.toValidation();
};
