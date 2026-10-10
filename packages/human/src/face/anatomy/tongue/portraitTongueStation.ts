import { portraitTongueColumns } from "./portraitTongueColumns";
import { portraitTongueRingStation } from "./portraitTongueRingStation";
import { portraitTongueRows } from "./portraitTongueRows";

/**
 * The longitudinal station of a vertex of `buildPortraitTongue`'s surface: zero
 * at the anterior pole and one at the posterior pole, and
 * `portraitTongueRingStation(ring)` for a vertex on ring `ring` of the sampled
 * rings between them.
 *
 * The surface is laid out as the anterior pole, then `rows - 1` rings of
 * `portraitTongueColumns` vertices from tip to root, then the posterior pole.
 * This function is the one reader of that layout outside the builder, so a
 * consumer that weights a vertex by its station, as the jaw does, cannot drift
 * from the builder's vertex order. It expects an index into a tongue built by
 * that builder and does not validate it.
 *
 * @author Samchon
 */
export const portraitTongueStation = (vertex: number): number =>
  vertex === 0
    ? 0
    : vertex === 1 + (portraitTongueRows - 1) * portraitTongueColumns
      ? 1
      : portraitTongueRingStation(
          Math.floor((vertex - 1) / portraitTongueColumns) + 1,
        );
