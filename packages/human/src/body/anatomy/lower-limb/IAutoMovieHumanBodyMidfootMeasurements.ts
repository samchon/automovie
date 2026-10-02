import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Five tarsal bones distal to talus/calcaneus and proximal to metatarsals.
 *
 * Each named observation belongs to one bone. Longitudinal and transverse
 * foot arches are generated relationships, not a vertex height authored here.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so the midfoot composes the navicular, the cuboid and the three cuneiforms without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that each observation belongs to one bone and that the arches are generated relationships and not a vertex height authored here; each member has a one-line property comment.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the navicular, the cuboid and the three cuneiforms for the midfoot, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The group holds no value of its own and converts nothing: units belong to the member measurement types.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMidfootMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial bone articulating with talar head. */
    navicular?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Lateral bone articulating with calcaneus. */
    cuboid?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Medial cuneiform under first metatarsal. */
    medialCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Intermediate cuneiform under second metatarsal. */
    intermediateCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Lateral cuneiform under third metatarsal. */
    lateralCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
