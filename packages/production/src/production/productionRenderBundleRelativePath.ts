import type { IAutoMovieRenderBundleManifest } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Derive the canonical render-root-relative address of one bundle identity.
 *
 * @evidence contracts/common.md#principled-implementation Uses target kind and reversible encoded ID, target fingerprint and a canonical SHA-256 of target/dialogue runtime/renderer identity/render specification; changing capture metadata moves the bundle even when its selected target input is unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Oracle publication proposes this path and project bundle publication/reopening check the same derivation; source-frame facts and actual byte admission remain with their own receipt owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No production or target ID receives a special directory; the supplied target fingerprint is assumed already admitted, and removing its sha256 prefix here is formatting rather than digest validation.
 * @evidence contracts/common.md#meaningful-documentation Defines path domains and consumers, including the separately guarded target fingerprint; the helper returns a relative address and creates no directory or publication.
 * @evidence contracts/performance.md#efficient-algorithms Cost is canonical serialization and SHA-256 over B selected metadata bytes, including canonical object-key sorting, plus ID encoding and result assembly; no frame population or image payload is read. Temporary storage scales with encoded metadata and ID.
 * @evidence contracts/performance.md#reuse-equivalent-work Publication and reopening share one derivation and canonical JSON/hash owners; no stored path is accepted without deriving its current expected identity, and no cache assumes mutable manifest fields equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canonical metadata buffers are temporary and the relative path transfers to the caller; the helper retains no manifest, frame bytes, file handle or task.
 */
export function productionRenderBundleRelativePath(manifest: Pick<IAutoMovieRenderBundleManifest, "target" | "dialogueRuntimeIdentity" | "rendererIdentity" | "targetFingerprint" | "renderSpec">): string {
  const renderSpecFingerprint: string = digestAutoMovieBytes(canonicalAutoMovieJsonBytes({
    target: manifest.target,
    dialogueRuntimeIdentity: manifest.dialogueRuntimeIdentity,
    rendererIdentity: manifest.rendererIdentity,
    renderSpec: manifest.renderSpec,
  }));
  return [
    `${manifest.target.kind}-${encodeAutoMoviePathSegment(manifest.target.id)}`,
    manifest.targetFingerprint.slice("sha256:".length),
    renderSpecFingerprint.slice("sha256:".length),
  ].join("/");
}
