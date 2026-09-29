import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

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
 * @author Samchon
 */
export type IAutoMovieHumanBodyCoxalBoneMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
  /** Segmented volume of this one bone, excluding the opposite side. */
  boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;

  /** Diameter of its articular acetabulum, independent of the femoral head. */
  acetabularDiameter?: IAutoMovieHumanBodyAnatomicalLength;
  }>;
