import type { IHumanFaceHairLayerGatherSpread } from "./IHumanFaceHairLayerGatherSpread";

/**
 * Free-tail styling after a connected lock reaches its shared scalp tie.
 * Direction uses the neutral head frame; omitted spread supplies no target
 * cross-section or spread transition.
 *
 * @evidence contracts/common.md#principled-implementation The gather stage normalizes the authored head-frame direction after tie entry and optionally adds the spread derivative while ordinary fall and curl remain active.
 * @evidence contracts/common.md#clear-and-simple-design The tail owns only its axial direction and optional shared cross-section; contact and metric station placement remain with the integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonzero direction is required; omitting spread does not invent a tube radius or imply that the resulting tail clears the scalp.
 * @evidence contracts/common.md#meaningful-documentation The direction is dimensionless in the neutral head frame and optional spread supplies metre-space radius and arc reach.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The tail descriptor performs no direction normalization, radial velocity calculation or collision query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Direction and optional spread contain no evaluated-tail cache or repeated integration coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The layer owns these vector/scalar values; the declaration creates no curve buffers, reader closure or task.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGatherTail {
  /** Nonzero dimensionless direction in the head frame. */
  direction: [number, number, number];

  /** Optional metre-space cross-section target and transition reach. */
  spread?: IHumanFaceHairLayerGatherSpread;
}
