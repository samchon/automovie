/**
 * The grain of an eyebrow in four numbers.
 *
 * A brow's hairs follow one pattern with three fixed stretches: the medial head, where they fan upward; the body, where the hairs of the upper border run down and outward and those of the lower border up and outward until they meet; and the tail, where they keep that converged course. The head is the medial three tenths of the boundary's longitudinal parameter, an authored fixed division rather than a physical arc-length fraction. An author states where the hairs end across the band and how far they sweep toward the tail, for the head and for the rest; the owner builds the direction field from that. No per-hair or per-station value exists.
 *
 * Fractions run across the registered band from its lower boundary, zero, to
 * its upper boundary, one. Sweeps are millimetres of the authored free guide
 * along the band's lateral tangent at its tip. The connected builder lifts
 * that guide through its registered native chart; the final surface-tip
 * displacement is measured separately and is not assumed equal on a warped
 * chart. These controls supply no clinical shaft-length measurement.
 *
 *
 * @evidence contracts/common.md#principled-implementation Four authored values define medial-head fan and body/tail convergence witnesses under the fixed three-tenths head convention.
 * @evidence contracts/common.md#clear-and-simple-design Head tip/sweep and remaining convergence/sweep are expanded by resolvePortraitEyebrowFlowPattern before the shared sampler reads them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The grain is an authored convention, not a measured direction field; chart deformation need not retain the free guide's surface-tip displacement.
 * @evidence contracts/common.md#meaningful-documentation The description distinguishes fractions, millimetre guide sweeps, the fixed head division and absent clinical shaft-length acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyebrowFlowPattern is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyebrowFlowPattern declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyebrowFlowPattern acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowPattern {
  /** Fraction across the band at which hairs rooted at the lower border of the medial head end; hairs rooted at its upper border end at the upper boundary. In [0,1]. */
  headTip: number;

  /** Millimetre lateral bend of medial-head authored guides at their tips. */
  headSweepMm: number;

  /** Fraction across the band at which the hairs of both borders meet along the body and tail. In [0,1]. */
  convergence: number;

  /** Millimetre lateral bend of body and tail authored guides at their tips. */
  sweepMm: number;
}
