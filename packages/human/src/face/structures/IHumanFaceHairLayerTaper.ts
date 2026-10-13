/**
 * Relative ribbon narrowing of a connected numerical hair layer.
 * Density owns ribbon root width; these coefficients do not choose it. The
 * explicit terminal-shaft branch delegates before reading this ribbon taper.
 *
 * @evidence contracts/common.md#principled-implementation The ribbon mesh linearly narrows nominal width toward this tip/root ratio after the stated centreline fraction; actual contact fitting may narrow it further, while terminal shafts bypass this profile.
 * @evidence contracts/common.md#clear-and-simple-design Two relative taper coefficients serve the existing strand mesh rather than adding per-station width inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ratio and onset domains admit a numerical narrowing profile, not a measured individual fibre calibre distribution.
 * @evidence contracts/common.md#meaningful-documentation Members give the [0.05,1] tip ratio and [0,0.95] onset fraction and identify density ownership and the shaft branch's omission of ribbon taper.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Ratio and onset declare a profile but perform no ribbon station selection or width fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The taper record defines no nominal-width cache or repeated mesh-build coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no ribbon rows or shaft geometry; the mesh owner allocates actual buffers.
 * @author Samchon
 */
export interface IHumanFaceHairLayerTaper {
  /** Positive tip/root width ratio in [0.05,1]. */
  tipWidth: number;

  /** Centreline fraction at which taper starts, in [0,0.95]. */
  start: number;
}
