import type { IAutoMovieHumanBodyAtlasSource } from "./IAutoMovieHumanBodyAtlasSource";

/**
 * Whether a source record is complete enough to stand as a part's provenance.
 *
 * A record is complete when every text it carries is nonempty and the digest of the consumed file is a SHA-256. A substitution is a nested receipt of the file the part is named for; when present, its text and its digest are held to the same rule, so a mirrored part cannot pass with an empty account of the file it set aside. The builder, the static writer's reader and the atlas inspection all ask this one question, because a record one of them admits and another refuses would make export depend on which path a part took. The digest of the compiled mesh is a different identity and stays with each caller.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty source/substitution text and raw 64-hex SHA256 forms establish syntactic completeness, without remote-byte verification or legal interpretation.
 * @evidence contracts/common.md#clear-and-simple-design Builder, inspection and static reader share one predicate while compiled-mesh digests remain resource-owner responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mirrored records must include replaced-file accounts; complete provenance is neither clinical registration nor cryptographic verification.
 * @evidence contracts/common.md#meaningful-documentation The prose separates consumed bytes, nested unused-file receipts and compiled-mesh identity.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-schema text scanning and anchored digest checks follow O(F) text volume, with shallow temporary field arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Provenance consumers reuse one completeness rule; mutable caller records are rechecked rather than identity-cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rest-field/text arrays die after the boolean; no URI fetch, license document or payload is retained.
 */
export function isHumanBodyAtlasSourceRecorded(
  source: IAutoMovieHumanBodyAtlasSource,
): boolean {
  const { substitution, ...consumed }: IAutoMovieHumanBodyAtlasSource = source;
  const digest: RegExp = /^[a-fA-F0-9]{64}$/;
  return (
    [...Object.values(consumed), ...Object.values(substitution ?? {})].every(
      (text: string): boolean => text.trim() !== "",
    ) &&
    digest.test(source.sha256) &&
    (substitution === undefined || digest.test(substitution.replacedSha256))
  );
}
