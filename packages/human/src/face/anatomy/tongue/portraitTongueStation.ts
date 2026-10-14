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
 *
 * @evidence contracts/common.md#principled-implementation Pole identities and integer division recover the builder's ring ordinal and shared cosine station from its native vertex ordering.
 * @evidence contracts/common.md#clear-and-simple-design One layout reader supplies jaw weighting without duplicating tongue spacing in the component.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only vertices of buildPortraitTongue's actual mesh satisfy this unvalidated ordinal premise; it maps no arbitrary mesh or anatomical registration.
 * @evidence contracts/common.md#meaningful-documentation Prose gives pole/ring ordering, endpoint meaning and the caller's valid-index obligation.
 * @evidence contracts/performance.md#efficient-algorithms Endpoint comparisons, division and one shared station call take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Row/column constants and ring-station implementation match the builder; no mesh scan or result cache is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One scalar is returned without retaining mesh buffers, callbacks or handles.
 */
export const portraitTongueStation: (vertex: number) => number = (vertex: number): number =>
  vertex === 0
    ? 0
    : vertex === 1 + (portraitTongueRows - 1) * portraitTongueColumns
      ? 1
      : portraitTongueRingStation(
          Math.floor((vertex - 1) / portraitTongueColumns) + 1,
        );
