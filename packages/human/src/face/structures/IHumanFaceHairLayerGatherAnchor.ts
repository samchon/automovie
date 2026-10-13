/**
 * Angular ray locating one connected hair tie on its shared neutral scalp chart.
 * The current scalp supplies the actual hit, not a saved point or vertex.
 *
 * @evidence contracts/common.md#principled-implementation Polar and azimuth angles define a neutral-chart ray whose native triangle hit is transferred to the current scalp by represented barycentric correspondence.
 * @evidence contracts/common.md#clear-and-simple-design The anchor carries two angular coefficients; domain admission and current hit resolution belong to the shared anchor resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing resident domain hit refuses instead of substituting a person-specific coordinate or nearest unrelated sample.
 * @evidence contracts/common.md#meaningful-documentation The polar origin is +Y and azimuth runs from +Z toward +X, both in radians; the prose identifies current-surface ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two angular values perform no native raycast or barycentric transfer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The anchor carries no query cache or topology invalidation policy; its resolver owns current-source evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no scalp mesh or resident triangle handle; the layer owns the angular record.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGatherAnchor {
  /** Polar angle from +Y, radians. */
  polar: number;

  /** Azimuth from +Z toward +X, radians. */
  azimuth: number;
}
