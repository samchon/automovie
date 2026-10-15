import { IAutoMovieHumanTrunkFeatures } from "./IAutoMovieHumanTrunkFeatures";

/**
 * The trunk's feature curves for the human profile.
 *
 * Placement is conventional, from surface anatomy: the posterior superior iliac spines lie about 40 mm either side of the midline under the dimples of Venus at about the anterior spines' height, the pubic tubercles about 25 mm either side of the midline at about a third of the way from the crotch to the anterior spines, and the inferior pectoral border runs from the sternum at the inframammary fold to the anterior axillary fold just below the axilla. Offsets are zero until the relief stage fits them, so the curves locate the features without moving the surface. Grade: conventional.
 */
export const AUTOMOVIE_HUMAN_TRUNK_FEATURES: IAutoMovieHumanTrunkFeatures = {
  clavicle: { offset: 0, width: 15 },
  pectoral: { offset: 0, width: 20, medial: 12, middle: 0.55, lateral: 0.92, below: 10 },
  iliac: { offset: 0, width: 20, dimple: 40 },
  inguinal: { offset: 0, width: 15, tubercle: 0.3, medial: 25 },
  cleft: { offset: 0, width: 12, apex: 0.6 },
};
