import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyGluteusMaximusMeasurements } from "./IAutoMovieHumanBodyGluteusMaximusMeasurements";
import type { IAutoMovieHumanBodyGluteusMediusMeasurements } from "./IAutoMovieHumanBodyGluteusMediusMeasurements";
import type { IAutoMovieHumanBodyGluteusMinimusMeasurements } from "./IAutoMovieHumanBodyGluteusMinimusMeasurements";
import type { IAutoMovieHumanBodyIliopsoasMeasurements } from "./IAutoMovieHumanBodyIliopsoasMeasurements";

/**
 * One side's target or observed hip anatomy and separately named tissues.
 *
 * This pelvic-region group owns three gluteal muscles. The femur belongs to
 * the corresponding lower limb, while coxal bone and shared sacrum belong
 * to the enclosing pelvis. Muscles attach across those ownership boundaries;
 * a generator must resolve the bone surfaces and
 * named tendon sites rather than copying them into this group. Omission of a
 * part's measurement permits only a domain-checked prior or an explicit
 * unavailable result. It never means zero bone or zero muscle.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so one side's hip region composes the three gluteal muscles and the iliopsoas without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the femur belongs to the lower limb and the coxal bone and sacrum to the enclosing pelvis, that muscles attach across those boundaries, and that omission means a domain-checked prior or an explicit unavailable result and never zero.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the three gluteal muscles and the iliopsoas for one side's hip region, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The group holds no value of its own and converts nothing: units belong to the member measurement types.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHipMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superficial gluteal muscle, the largest of the three. */
    gluteusMaximus?: IAutoMovieHumanBodyGluteusMaximusMeasurements;

    /** Gluteal muscle deep to maximus, inserting on the greater trochanter. */
    gluteusMedius?: IAutoMovieHumanBodyGluteusMediusMeasurements;

    /** Deepest gluteal muscle, inserting on the anterior greater trochanter. */
    gluteusMinimus?: IAutoMovieHumanBodyGluteusMinimusMeasurements;

    /** Lumbar/iliac hip flexors with a separately measured combined CT label. */
    iliopsoas?: IAutoMovieHumanBodyIliopsoasMeasurements;
  }>;
