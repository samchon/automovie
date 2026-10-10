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
