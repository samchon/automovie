import { IAutoMovieDesignLineage, IAutoMovieValidation } from "@automovie/interface";
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
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-source-ownership `validateDesignLineageBinding` keeps tracked design identities distinct from derived artifacts by rejecting missing source-owned subjects and derived ids that collide with them.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-design-graph-ownership `validateDesignLineageBinding` verifies that lineage subjects resolve to published design identities while derived evidence remains outside that source-owned identity set.
 * @evidence requirements/evidence-and-provenance/scope-identity-and-status.md#evidence-subject-record-separation `validateDesignLineageBinding` keeps source-owned subject ids distinct from the lineage record and from derived artifact ids while resolving every tracked subject against its host graph.
 * @evidence specifications/evidence-and-provenance/scope-identity-and-status.md#evp-subject-record-identity-separation The binding check prevents an evidence artifact identity from impersonating the design subject it describes.
 */
export const validateDesignLineageBinding = (props: {
  lineage: IAutoMovieDesignLineage;
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
