import {
  IAutoMovieDerivedArtifact,
  IAutoMovieDesignLineage,
  IAutoMovieDesignSubject,
  type IAutoMovieValidateDesignLineageBinding,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
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
 */
export function validateDesignLineageBinding(
  props: IAutoMovieValidateDesignLineageBinding.IProps,
): IAutoMovieValidation {
  const lineage: IAutoMovieDesignLineage = props.lineage;
  const known: readonly string[] = props.known;
  const out: IAutoMovieViolationCollector = new ViolationCollector();
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
}
