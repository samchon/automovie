import {
  IAutoMovieDesignLineage,
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
 * Ids are compared exactly. Findings are returned with `$input.subjects[i]` or
 * `$input.derived[i]` paths and nothing throws; the lineage's own consistency
 * is {@link validateDesignLineage}'s to check.
 *
 * @evidence contracts/common.md#principled-implementation Puts the published ids in a set and tests each declared subject for membership and each derived artifact id for non-membership, the two directions in which a lineage can misname its host.
 * @evidence contracts/common.md#clear-and-simple-design Takes the published ids as a flat list instead of any graph type, so the production builder can pass buildings, elements, spaces, boundaries, openings, connectors, models and asset consumers from one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unannotated host ids are allowed by the additive-lineage contract, and no id prefix or graph is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States why the binding is separate, the additive rule, both refusals, the exact comparison, and the returned paths.
 * @evidence contracts/performance.md#cost-and-resources O(K + S + A) for K published ids, S subjects and A derived artifacts, dominated by building the set; the production builder holds a set, spreads it into an array per lineage and this rebuilds the set each call, so L lineages pay O(L × K) of avoidable copying, and nothing is retained.
 */
export const validateDesignLineageBinding = (props: {
  /** Lineage whose subjects and derived ids are checked. */
  lineage: IAutoMovieDesignLineage;

  /** Every stable id the host graphs publish, in any order, duplicates allowed. */
  known: readonly string[];
}): IAutoMovieValidation => {
  const { lineage, known } = props;
  const out = new ViolationCollector();
  const root = "$input";
  const published = new Set(known);
  lineage.subjects.forEach((subject, index) => {
    if (!published.has(subject.id))
      out.push(
        "type",
        `${root}.subjects[${index}].id`,
        `lineage subject "${subject.id}" resolves to no published identity`,
        subject.id,
      );
  });
  lineage.derived.forEach((artifact, index) => {
    if (published.has(artifact.id))
      out.push(
        "type",
        `${root}.derived[${index}].id`,
        `derived artifact "${artifact.id}" collides with a published design identity`,
        artifact.id,
      );
  });
  return out.toValidation();
};
