import type { Plane } from "../geometry/Plane.ts";
import type { V3 } from "../geometry/V3.ts";
import type { MidPoint } from "./MidPoint.ts";

/**
 * Native midsagittal source observations, without anatomical horizontal registration.
 *
 * @evidence contracts/common.md#principled-implementation The source plane, ordered profile, geometric proxies and auxiliary-eye height preserve their distinct protocols in one native frame.
 * @evidence contracts/common.md#clear-and-simple-design Profile-relative indexes connect named observations and oral-sheet ranges to their actual source curve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rig-based clip and heuristic extrema are explicit rather than presented as clinical registration or product landmark tables.
 * @evidence contracts/common.md#meaningful-documentation Documents physical coordinates, ordering, clip origin, auxiliary-eye protocol and source-sheet ranges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased frame declaration executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producing observation operation owns runtime profile storage.
 * @author Samchon
 */
export interface HeadFrame {
  /** Highest observed midsagittal source point in native world millimetres. */
  top: V3;
  /** Mean height of the two auxiliary-eyeball bounding-box centres, in millimetres. */
  eyeY: number;
  /** Lower triangle-scope height, 30 mm below the native neck_01 rig marker. */
  clipY: number;
  /** Ordered posterior-inferior to vertex to anterior-inferior, in world millimetres. */
  profile: V3[];
  /** World-X-zero plane, without anatomical horizontal reorientation. */
  plane: Plane;
  /** Vertex position within the ordered source profile. */
  iTop: number;
  /** Named geometric source observations and their individual extraction protocols. */
  mid: Record<string, MidPoint>;
  /** Profile index ranges bounding the observed upper and lower oral sheets. */
  mouth: { upper: [number, number]; lower: [number, number] };
}
