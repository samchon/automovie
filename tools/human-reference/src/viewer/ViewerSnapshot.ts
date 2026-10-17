import type { ReferenceManifest } from "../io/ReferenceManifest.ts";

/**
 * An admitted manifest and immutable payload strings owned by one local renderer runtime.
 *
 * @evidence contracts/common.md#principled-implementation A manifest-byte hash identifies declared inputs; serialized payloads belong to this one runtime.
 * @evidence contracts/common.md#clear-and-simple-design Frame identity, payload storage, admission time and geometry counts retain separate meanings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts and hashes establish identity and admission, never visual or anatomical correctness.
 * @evidence contracts/common.md#meaningful-documentation Members state private path scope, retained payload ownership, timing and source/generated count roles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data shape selects no traversal or numerical algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data shape coordinates no cache or repeated operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no native handle or running task; its producer owns retained values.
 *
 * @author Samchon
 */
export interface ViewerSnapshot {
  /** Full manifest-byte hash identifies the frame, posture and all named input-byte hashes. */
  id: string;

  /** Paths describe private inputs and are returned only through this local diagnostic server. */
  manifest: ReferenceManifest;

  /** Payload strings are frozen at admission; later file edits cannot alter an active comparison. */
  payloads: Map<string, string>;

  /** Admission time is distinct from image capture time and source generation time. */
  loadedAt: string;

  /** Original and independently generated topology counts remain visible in capture provenance. */
  geometry: {
    source: { vertices: number; triangles: number };
    reconstruction: { vertices: number; triangles: number };
  };
}
