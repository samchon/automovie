import { IAutoMovieHumanLipForm } from "./IAutoMovieHumanLipForm";

/** Physical lip-loop form shared by the head and its pigmentation boundary. */
export const AUTOMOVIE_HUMAN_LIP_FORM: IAutoMovieHumanLipForm = {
  orbicularis: 0.5,
  /** Crista philtri 13.3 and 11.8 mm apart over mouths of 50.9 and 48.1 mm (3D Facial Norms; Weinberg et al. 2016, https://doi.org/10.1597/15-199; summary https://www.facebase.org/resources/human/facial_norms/summary/tdfn_gui_summary.csv). Grade: derived. */
  philtrum: 0.26,
  /** Finite commissure edge, millimetres; conventional. */
  commissure: 0.5,
  meeting: { back: 1.5, open: 0.25, narrow: 0.97 },
  pocket: { back: 8, open: 2.5, narrow: 0.85 },
};
