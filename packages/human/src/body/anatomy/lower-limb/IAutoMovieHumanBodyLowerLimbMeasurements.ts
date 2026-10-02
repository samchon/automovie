import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyFootMeasurements } from "./IAutoMovieHumanBodyFootMeasurements";
import type { IAutoMovieHumanBodyKneeMeasurements } from "./IAutoMovieHumanBodyKneeMeasurements";
import type { IAutoMovieHumanBodyLegMeasurements } from "./IAutoMovieHumanBodyLegMeasurements";
import type { IAutoMovieHumanBodyThighMeasurements } from "./IAutoMovieHumanBodyThighMeasurements";

/**
 * One lower limb's thigh, knee, anatomical leg and foot, with one bone owner.
 *
 * The femur meets the pelvic acetabulum, femoral condyles meet tibia/patella,
 * and tibia/fibula meet talus. The group expresses containment of parts;
 * articulations and muscles crossing groups are separate named relations.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so one lower limb composes the thigh, the knee, the leg and the foot without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states which joints meet at which bones, that the group expresses containment of parts, and that articulations and muscles crossing groups are separate named relations.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the thigh, the knee, the leg and the foot for one lower limb, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The group holds no value of its own and converts nothing: units belong to the member measurement types.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLowerLimbMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Femur of this side, independent of pelvic gluteal measurements. */
    thigh?: IAutoMovieHumanBodyThighMeasurements;

    /** Patella and knee-specific anatomy. */
    knee?: IAutoMovieHumanBodyKneeMeasurements;

    /** Tibia and fibula between knee and ankle. */
    leg?: IAutoMovieHumanBodyLegMeasurements;

    /** Talus and calcaneus of the hindfoot. */
    foot?: IAutoMovieHumanBodyFootMeasurements;
  }>;
