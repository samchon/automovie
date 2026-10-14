import type { AutoMovieExternalModelIngestProfile } from "./AutoMovieExternalModelIngestProfile";
import { AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES } from "./AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES";

/**
 * Whether an untyped selection, such as a command-line or manifest value, names one supported ingest profile exactly.
 *
 * Only an exact element of the frozen profile list passes, so `toString` and other inherited names are refused.
 *
 * @param value Candidate selection of any type.
 * @returns `true` when `value` is one of the profile literals.
 *
 * @evidence contracts/common.md#principled-implementation Exact membership in the four-element frozen registry-derived list admits only supported profile literals, including no inherited object names.
 * @evidence contracts/common.md#clear-and-simple-design The byte inspector delegates profile admission to this guard, which consumes the single frozen list derived from the closed typed registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The guard does no trimming or case folding, so a near-miss spelling is refused rather than accepted.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the intended untyped inputs, the exact-match rule, and the inherited-name refusal.
 * @evidence contracts/performance.md#efficient-algorithms One type check and at most four literal comparisons per call require constant time without allocating another profile inventory.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time check has nothing worth reusing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard retains nothing and reads a module constant.
 * @author Samchon
 */
export const isAutoMovieExternalModelIngestProfile: (value: unknown) => value is AutoMovieExternalModelIngestProfile = (
  value: unknown,
): value is AutoMovieExternalModelIngestProfile =>
  typeof value === "string" && AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES.includes(value as AutoMovieExternalModelIngestProfile);
