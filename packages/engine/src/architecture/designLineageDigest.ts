import { AutoMovieContentDigest, IAutoMovieDesignLineage } from "@automovie/interface";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Digest the whole lineage record.
 *
 * Serialization is length-prefixed and sorted by code unit, never by locale and
 * never in authoring order, so the same authored lineage digests identically on
 * Windows and POSIX and after any reshuffle of its arrays. Every separator is
 * written here rather than taken from the platform, which is why no newline
 * convention can reach the bytes.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `designLineageDigest` digests the whole lineage record. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `designLineageDigest` hashes revisions, alternatives, phases, decisions, subjects, and derivation stamps into one stable lineage identity.
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-structured-canonicalization `designLineageDigest` canonicalizes every lineage collection by code-unit identity order and serializes tagged, length-prefixed fields before hashing.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-structured-canonicalization The digest fixes field representation, collection ordering, separators, and SHA-256 input independently of platform, locale, and authoring traversal order.
 */
export const designLineageDigest = (
  lineage: IAutoMovieDesignLineage,
): AutoMovieContentDigest => {
  requireValidLineage(lineage);
  const lines: string[] = [
    record("lineage", lineage.id, String(lineage.version), lineage.head),
    ...[...lineage.subjects]
      .sort((a, b) => compareCodeUnits(a.id, b.id))
      .map((subject) =>
        record("subject", subject.id, subject.graph, subject.digest ?? ""),
      ),
    ...[...lineage.revisions]
      .sort((a, b) => compareCodeUnits(a.id, b.id))
      .map((revision) =>
        record("revision", revision.id, revision.parent ?? "", revision.digest),
      ),
    ...[...lineage.phases]
      .sort((a, b) => compareCodeUnits(a.id, b.id))
      .map((phase) =>
        record(
          "phase",
          phase.id,
          phase.label,
          ...[...phase.requires].sort(compareCodeUnits),
        ),
      ),
    ...[...lineage.lifecycles]
      .sort((a, b) => compareCodeUnits(a.subject, b.subject))
      .map((lifecycle) =>
        record(
          "lifecycle",
          lifecycle.subject,
          lifecycle.introducedIn ?? "",
          lifecycle.removedIn ?? "",
        ),
      ),
    ...[...lineage.variants]
      .sort((a, b) => compareCodeUnits(a.id, b.id))
      .flatMap((variant) => [
        record("variant", variant.id, variant.label, variant.base),
        ...[...variant.changes]
          .sort((a, b) => compareCodeUnits(a.id, b.id))
          .map((change) =>
            record(
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
    ...[...lineage.decisions]
      .sort((a, b) => compareCodeUnits(a.id, b.id))
      .map((decision) =>
        record(
          "decision",
          decision.id,
          decision.question,
          decision.selected ?? "",
          ...[...decision.options].sort(compareCodeUnits),
        ),
      ),
    // An artifact's asset citations are deliberately not digested. This runs
    // only on a validated record, and there a citation exists for exactly the
    // inputs that carry imported bytes, at exactly the digests those subjects
    // declare; both facts are already in the subject and derived lines. Two
    // valid lineages therefore cannot differ in citations without differing in
    // something serialized here, so digesting them would certify nothing new.
    ...[...lineage.derived]
      .sort((a, b) => compareCodeUnits(a.id, b.id))
      .map((artifact) =>
        record(
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

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};

/** Length-prefix every field so no authored text can forge a separator. */
const record = (...fields: readonly string[]): string =>
  fields.map((field) => `${field.length}:${field}`).join("|");
