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
 * @evidence contracts/common.md#principled-implementation The builder lays out the anterior pole, then rows minus one rings of columns vertices, then the posterior pole, so a vertex's ring is floor((vertex - 1)/columns) and its station is the ring station of ring + 1, (1 - cos(pi (ring + 1)/rows))/2, with the two poles at zero and one.
 * @evidence contracts/common.md#clear-and-simple-design It is the only reader of the builder's vertex layout outside the builder, replacing a private copy in the component.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and it does not search coordinates for the station.
 * @evidence contracts/common.md#meaningful-documentation The comment states the layout, why the function exists and that it does not validate its argument.
 * @evidence contracts/modeling.md#spatial-conventions The argument is a vertex index and the result is a unitless station from tip to root.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function maps an index and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The station is the shared definition by which the jaw weights the tongue: the component reads it here instead of restating the layout, so the weighting cannot drift from the surface the builder emits.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
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
