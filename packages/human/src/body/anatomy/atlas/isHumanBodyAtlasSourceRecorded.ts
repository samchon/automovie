import type { IAutoMovieHumanBodyAtlasSource } from "./IAutoMovieHumanBodyAtlasSource";

/**
 * Whether a source record is complete enough to stand as a part's provenance.
 *
 * A record is complete when every text it carries is nonempty and the digest
 * of the consumed file is a SHA-256. A substitution is a nested receipt of
 * the file the part is named for; when present, its text and its digest are
 * held to the same rule, so a mirrored part cannot pass with an empty account
 * of the file it set aside. The builder, the static writer's reader and the
 * atlas inspection all ask this one question, because a record one of them
 * admits and another refuses would make export depend on which path a part
 * took. The digest of the compiled mesh is a different identity and stays
 * with each caller.
 *
 * @evidence contracts/common.md#principled-implementation The predicate separates the record's own texts from its nested receipt before testing them, so adding a structured field cannot silently escape or break the text rule.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns the completeness rule its three consumers previously each spelled out.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source, licence or member is special-cased; every record is held to the same texts and digests.
 * @evidence contracts/common.md#meaningful-documentation States what complete means, why a substitution is included and why the compiled digest is not.
 * @evidence contracts/anatomy.md#anatomical-source A part's geometry is admitted only with the location, digest, licence, attribution, identity and acquisition account of the file it came from, and of the file it replaced.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The predicate defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The predicate consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The predicate emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record carries no coordinates.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The predicate builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The predicate owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is offline provenance, not an authoring input.
 */
export function isHumanBodyAtlasSourceRecorded(
  source: IAutoMovieHumanBodyAtlasSource,
): boolean {
  const { substitution, ...consumed } = source;
  const digest = /^[a-fA-F0-9]{64}$/;
  return (
    [...Object.values(consumed), ...Object.values(substitution ?? {})].every(
      (text) => text.trim() !== "",
    ) &&
    digest.test(source.sha256) &&
    (substitution === undefined || digest.test(substitution.replacedSha256))
  );
}
