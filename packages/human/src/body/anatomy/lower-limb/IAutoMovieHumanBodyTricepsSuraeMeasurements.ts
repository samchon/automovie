import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements } from "./IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements";
import type { IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements } from "./IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements";
import type { IAutoMovieHumanBodySoleusMeasurements } from "./IAutoMovieHumanBodySoleusMeasurements";

/**
 * Calf plantarflexor group converging on the calcaneal tendon.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so the triceps surae composes the medial and lateral gastrocnemius heads and the soleus without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the calf plantarflexors converge on the calcaneal tendon; each member has a one-line property comment saying which cross the knee.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the medial and lateral gastrocnemius heads and the soleus for the triceps surae, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The group holds no value of its own and converts nothing: units belong to the member measurement types.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTricepsSuraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial gastrocnemius crossing knee and ankle. */
    gastrocnemiusMedialHead?: IAutoMovieHumanBodyGastrocnemiusMedialHeadMeasurements;

    /** Lateral gastrocnemius crossing knee and ankle. */
    gastrocnemiusLateralHead?: IAutoMovieHumanBodyGastrocnemiusLateralHeadMeasurements;

    /** Deep soleus crossing the ankle but not knee. */
    soleus?: IAutoMovieHumanBodySoleusMeasurements;
  }>;
