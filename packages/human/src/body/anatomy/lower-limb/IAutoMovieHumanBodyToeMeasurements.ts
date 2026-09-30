import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * One second-through-fifth toe ray with observed phalangeal variation.
 *
 * The enclosing foot supplies toe number and side; the bones are distinct
 * instances even if a generator shares a code path. Fifth-toe biphalangism is
 * a common normal variant in adult radiographs (Ceynowa et al. 2018,
 * doi:10.1007/s00276-018-2027-z);
 * a two-phalange ray cannot also claim a separate middle bone. Missing
 * pattern is unknown, not automatically triphalangeal. Skin toe length cannot
 * independently determine the joint surfaces or phalangeal volumes.
 *
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` requires at least one specified quantity, and the intersection with a union on `phalangealPattern` makes a biphalangeal toe unable to carry a `middlePhalanx` (`middlePhalanx?: never`) while a triphalangeal or unspecified pattern may. An absent pattern therefore stays unknown instead of defaulting to three phalanges, and no ray can claim a bone its pattern excludes.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of the ray's optional bones and a closed two-value pattern, with the exclusion expressed once in the intersection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the enclosing foot supplies toe number and side, that the bones are distinct instances even when a generator shares a code path, that a two-phalange ray cannot claim a middle bone, that a missing pattern is unknown and not triphalangeal, and that skin toe length cannot determine joint surfaces or volumes; it names the study for the normal variant, and each property states its bone.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one second-to-fifth toe ray, composed by `IAutoMovieHumanBodyFootMeasurements` under `secondToe` to `fifthToe`; the hallux has its own declaration because it has no middle phalanx, and each bone of the ray is its own `IAutoMovieHumanBodySmallBoneMeasurements`.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Each quantity carries its unit in its value type: millimetres for lengths and millilitres for volumes; the declaration has no frame of its own and converts nothing.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are the named bones of the ray and a choice from a closed two-value pattern, each quantity a target or an imaging observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no vertex, curve or surface patch can be supplied through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyToeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Imaging-observed or desired two-/three-phalange arrangement. */
    phalangealPattern?: "biphalangeal" | "triphalangeal";

    /** Same-number metatarsal. */
    metatarsal?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Proximal toe phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Intermediate toe phalanx, absent in the hallux. */
    middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Distal phalanx supporting the nail bed. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }> &
    (
      | {
          readonly phalangealPattern: "biphalangeal";
          readonly middlePhalanx?: never;
        }
      | {
          readonly phalangealPattern?: "triphalangeal";
          readonly middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
        }
    );
