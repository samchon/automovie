import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAdductorMagnusMeasurements } from "./IAutoMovieHumanBodyAdductorMagnusMeasurements";
import type { IAutoMovieHumanBodyFemurMeasurements } from "./IAutoMovieHumanBodyFemurMeasurements";
import type { IAutoMovieHumanBodyHamstringsMeasurements } from "./IAutoMovieHumanBodyHamstringsMeasurements";
import type { IAutoMovieHumanBodyIliotibialTractMeasurements } from "./IAutoMovieHumanBodyIliotibialTractMeasurements";
import type { IAutoMovieHumanBodyQuadricepsMeasurements } from "./IAutoMovieHumanBodyQuadricepsMeasurements";

/**
 * One thigh's internal femur, distinct from its overlying gluteal muscles.
 *
 * The femoral head participates in the hip but the whole femur has one owner
 * here; the patella belongs at the knee. A hip or thigh girth cannot specify
 * a femoral head radius or neck axis without further evidence.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so one thigh composes the femur, the quadriceps, the hamstrings, adductor magnus and the iliotibial tract without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the thigh owns the internal femur and not the overlying gluteal muscles, that the patella belongs at the knee, and that a hip or thigh girth cannot specify a femoral head radius or neck axis; each member has a one-line property comment.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the femur, the quadriceps, the hamstrings, adductor magnus and the iliotibial tract for one thigh, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The group holds no value of its own and converts nothing: units belong to the member measurement types.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThighMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Full femur including head, neck, shaft and distal condyles. */
    femur?: IAutoMovieHumanBodyFemurMeasurements;

    /** Four-head anterior extensor group. */
    quadriceps?: IAutoMovieHumanBodyQuadricepsMeasurements;

    /** Posterior hip/knee muscles with independent bellies. */
    hamstrings?: IAutoMovieHumanBodyHamstringsMeasurements;

    /** Large separate medial adductor. */
    adductorMagnus?: IAutoMovieHumanBodyAdductorMagnusMeasurements;

    /** Lateral fascial tract receiving superficial gluteal fibres. */
    iliotibialTract?: IAutoMovieHumanBodyIliotibialTractMeasurements;
  }>;
