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
