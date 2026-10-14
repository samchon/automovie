import { fingerprintAutoMovieFields } from "./fingerprintAutoMovieFields";
import { IAutoMovieRenderBundleManifest } from "@automovie/interface";
import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";

/**
 * Fingerprint a verified deterministic render manifest and frame digests.
 *
 * The supplied frame order and paths enter a length-framed protocol/manifest/frame stream. Callers verify actual render bytes first; this composition hashes declared digests and does not read files or reconcile a mismatched frame population.
 *
 * @evidence contracts/common.md#principled-implementation Domain-separated protocol and canonical manifest bytes precede ordered path-labelled digest fields in the shared u64-length-framed SHA-256 stream.
 * @evidence contracts/common.md#clear-and-simple-design The render verifier owns resident media admission; this composer owns only the source identity fields and preserves caller frame order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared frame digests are not a fresh byte observation, and omitted/reordered frame operands are not silently reconstructed from the manifest.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies ordered path/digest inputs, the prior byte-verification premise and fingerprint-only output ownership.
 * @evidence contracts/performance.md#efficient-algorithms Complete manifest canonicalization/key sorting and F frame descriptor/buffer allocations precede hashing all encoded bytes; memory includes the encoded manifest and supplied digest buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing verified digest text is reused without rereading frame media; one shared framing implementation handles all fields and no mutable-input fingerprint cache survives.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoded manifest/frame buffers are local to the synchronous hash and only its digest string escapes; no render bytes, descriptors or tasks are acquired.
 */
export const productionSourceRenderFingerprint: (props: {
    manifest: IAutoMovieRenderBundleManifest;
    frames: readonly {
        path: string;
        digest: string;
    }[];
}) => string = (props: {
  manifest: IAutoMovieRenderBundleManifest;
  frames: readonly {
    path: string;
    digest: string;
  }[];
}): string =>
  fingerprintAutoMovieFields([
    {
      role: "protocol",
      kind: "utf8",
      payload: Buffer.from("automovie.repaint-source.v1", "utf8"),
    },
    {
      role: "manifest",
      kind: "canonical-json",
      payload: canonicalAutoMovieJsonBytes(props.manifest),
    },
    ...props.frames.map((frame: { path: string; digest: string }): IAutoMovieFingerprintField => ({
      role: `frame:${frame.path}`,
      kind: "digest",
      payload: Buffer.from(frame.digest, "utf8"),
    })),
  ]);
