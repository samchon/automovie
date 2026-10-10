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
 */
export const portraitTongueRingStation = (ring: number): number =>
  (1 - Math.cos((Math.PI * ring) / portraitTongueRows)) / 2;
