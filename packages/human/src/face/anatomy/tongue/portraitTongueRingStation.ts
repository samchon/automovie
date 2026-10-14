import { portraitTongueRows } from "./portraitTongueRows";

/**
 * The longitudinal station of a lingual ring: zero at the anterior pole and
 * one at the posterior pole, `(1 - cos(pi * ring / rows)) / 2` for ring
 * `ring` in `[0, rows]`.
 *
 * The rings are spaced by the angle of the closing ellipse and not evenly in
 * length. A rounded pole has a vertical tangent, so evenly spaced rings would
 * join the pole to the first ring by one flat cone and leave a visible nub at
 * the tip of a small tongue; angle spacing puts rings where the outline
 * turns quickest, and gives the mid-body ring the exact station one half.
 * `buildPortraitTongue` places its rings here and `portraitTongueStation`
 * reads them back, so the two share one spacing.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Cosine angle spacing maps ring ordinal to an anterior-zero/posterior-one station and concentrates samples near authored rounded poles.
 * @evidence contracts/common.md#clear-and-simple-design The builder, vertex reader and arch gate share this spacing and portraitTongueRows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Spacing is tessellation rather than measurement; the caller supplies admitted ring ordinals without subject-specific substitution.
 * @evidence contracts/common.md#meaningful-documentation Prose gives equation, bounds, endpoint direction and builder/reader agreement.
 * @evidence contracts/performance.md#efficient-algorithms One cosine and fixed arithmetic cost constant work without scanning rings.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared row count and spacing avoid separate layouts; a persistent scalar cache is unnecessary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned number retains no mesh, task or external resource.
 */
export const portraitTongueRingStation: (ring: number) => number = (ring: number): number =>
  (1 - Math.cos((Math.PI * ring) / portraitTongueRows)) / 2;
