import { AutoMovieArchetypeEquineGait } from "../AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import { OX_BODY_MEASURES } from "./constants/OX_BODY_MEASURES";
import * as OxGaitData from "./internal/OxGaitData";

/*
 * An ox walk with one observed species-specific speed and clock.
 *
 * Catavitello, Ivanenko and Lacquaniti (2018), eLife 7:e38190, Table 1 and
 * Figure 2–figure supplement 2 source data B/C/D, observed two Bos taurus at
 * 0.71 m/s, with six hindlimb and five forelimb strides. D supplies the mean
 * period in seconds; C supplies fore/hind stance percentages; B gives the two
 * fore touchdown delays relative to the camera-facing hindlimb.
 * https://doi.org/10.7554/eLife.38190
 * https://cdn.elifesciences.org/articles/38190/elife-38190-fig2-figsupp2-data1-v2.zip
 *
 * The original readme names every variable. Each MATLAB table has explicit
 * species row names; B/C/D have 36/48/54 rows, so their row numbers differ. The
 * stance seconds below are a representative period times its reported fraction,
 * not separately reported mean stance times. Source means first average
 * strides, then animals. No stride SD is supplied in these tables; zero
 * deviation declares an authored deterministic clock, not zero variance.
 *
 * Assign the camera-facing pair to model left and rebase its fore contact to
 * zero. Both observed fore delays are retained. The opposite hind contact is
 * authored at half a stride because the source describes roughly symmetric
 * gaits but publishes no separate contralateral-hind phase here. The gait
 * cohort is distinct from the Kathani body reference. Absolute scaling
 * preserves the observed clock without inventing a shared experimental height.
 * Horse fold, clearance, bob and top-joint follow are explicit construction
 * proxies. Neck nod is authored zero; faster ox gaits and a continuous speed
 * range remain unsupported by this walking point.
 */
export namespace OxGait {
  /*
   * The observed walk point; zero timing spread is an authored deterministic
   * choice.
   */
  export const TABLE: AutoMovieArchetypeQuadrupedGait.ITable = {
    order: ["walk"],
    gaits: {
      walk: {
        ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: OxGaitData.OPPOSITE_FORE_PHASE - OxGaitData.FORE_PHASE,
          leftHind: 1 - OxGaitData.FORE_PHASE,
          rightHind: 0.5 - OxGaitData.FORE_PHASE,
        },
        rows: [
          {
            speed: 0.71,
            stride: OxGaitData.STRIDE,
            deviation: 0,
            stance: OxGaitData.STRIDE * OxGaitData.FORE_DUTY,
            hindStance: OxGaitData.STRIDE * OxGaitData.HIND_DUTY,
          },
        ],
      },
    },
    reference: OX_BODY_MEASURES.withers,
    scaling: "absolute",
    hysteresis: 0,
    follow: AutoMovieArchetypeEquineGait.FOLLOW,
  };
}
