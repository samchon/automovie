import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one os coxae (ilium, ischium and pubis).
 *
 * A coxal bone is a pelvic component, not a second copy inside each hip. Its
 * acetabulum receives the femoral head; its posterior ilium carries gluteal
 * origins. A measured volume or acetabular diameter does not reconstruct its
 * 3D surface or establish a tendon attachment. The latter requires an
 * independently resolved bone shape and named landmarks. No user-authored
 * vertex or contour is part of this measurement contract.
 *
 * Terminology: FIPAT Terminologia Anatomica 2, os coxae (hip bone).
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Its quantities are the osseous ones of one os coxae, kept apart from soft tissue and from the neighbouring bones the comment names.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of the bone's optional quantities, each a shared value type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that a coxal bone is a pelvic component and not a second copy inside each hip, that a volume or acetabular diameter does not reconstruct the surface or a tendon attachment, and that no user vertex or contour is part of the contract.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one bone, one os coxae, composed by `IAutoMovieHumanBodyPelvisMeasurements.leftCoxalBone` and `rightCoxalBone`; the comment names the neighbouring bones and articular surfaces it does not own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Each quantity carries its unit in its value type: millimetres for lengths and millilitres for volumes; the declaration has no frame of its own and converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named quantity of one named part, a target or an imaging observation with its own unit; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve, strand or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCoxalBoneMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Segmented volume of this one bone, excluding the opposite side. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Diameter of its articular acetabulum, independent of the femoral head. */
    acetabularDiameter?: IAutoMovieHumanBodyAnatomicalLength;
  }>;
