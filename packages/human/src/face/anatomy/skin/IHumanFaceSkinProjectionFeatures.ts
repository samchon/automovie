import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";

/**
 * Native nearest-feature candidates for one guide chord. A single local scale
 * keeps triangle construction independent of tiny relief widths; reconstruct
 * head-frame positions as origin + scale * projected local position.
 *
 * @evidence contracts/common.md#principled-implementation One guide chord uses a positive metre scale and exact normalized displacement for every retained native candidate; reconstruction restores origin plus scale times affine coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Shared origin, scale and direction belong to the candidate population rather than being independently rounded inside every pair comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalization derives from current finite geometry and is independent of relief width; candidate order follows native features rather than expected ownership results.
 * @evidence contracts/common.md#meaningful-documentation Members state head-frame origin, metre scale, normalized guide direction and deterministic vertex/edge/face population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This population interface executes no broad phase or exact feature enumeration; its producer owns both scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface coordinates no work; its envelope reuses pair resources only within this guide and direction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no handles; candidate population retention is owned by projection compilation.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionFeatures {
  /** Head-frame guide origin, metres. */
  origin: readonly number[];

  /** Positive coordinate normalization in metres. */
  scale: number;

  /** Free guide displacement in normalized coordinates. */
  direction: readonly IHumanExactFraction[];

  /** Actual vertex, edge and face candidates, in deterministic native order. */
  features: readonly IHumanFaceSkinProjectionFeature[];
}
