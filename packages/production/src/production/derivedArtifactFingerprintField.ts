import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";

/**
 * Role and path compose a derivation namespace; missing bytes become an empty payload with the supplied state kind.
 *
 * @evidence contracts/common.md#principled-implementation Role and path compose a derivation namespace; missing bytes become an empty payload with the supplied state kind.
 * @evidence contracts/common.md#clear-and-simple-design Inspection owns the present/absent/unsafe kind while the shared fingerprint encoder owns binary framing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The kind preserves missing-state semantics so empty real files are not substituted for absent observations.
 * @evidence contracts/common.md#meaningful-documentation States borrowed payload ownership for present bytes and a fresh empty array for null.
 * @evidence contracts/performance.md#efficient-algorithms Allocates one field and role text plus a zero-byte array for absence; present payload bytes are not copied.
 * @evidence contracts/performance.md#reuse-equivalent-work The same read buffer is reused by identity composition; no buffer-content equivalence cache is inferred.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's returned field retains its payload until the attempt finishes; this helper acquires no handle or task.
 */
export const derivedArtifactFingerprintField: (role: string, pathValue: string, kind: string, bytes: Uint8Array | null) => IAutoMovieFingerprintField = (role: string, pathValue: string, kind: string, bytes: Uint8Array | null): IAutoMovieFingerprintField => ({
    role: `derived-artifact:${role}:${pathValue}`,
    kind,
    payload: bytes ?? new Uint8Array(),
});
