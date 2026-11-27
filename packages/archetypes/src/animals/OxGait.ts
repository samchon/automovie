import { AutoMovieArchetypeEquineGait } from "./AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { OX_BODY_MEASURES } from "./ox/constants/OX_BODY_MEASURES";

/**
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
  /** Figure 2 supplement 2D, Bostaurus row: mean stride period, seconds. */
  const STRIDE: number = 1.3083333333333333;

  /** Figure 2 supplement 2C, FLstanceduration percentage divided by 100. */
  const FORE_DUTY: number = 0.7410615271441992;

  /** Figure 2 supplement 2C, HLstanceduration percentage divided by 100. */
  const HIND_DUTY: number = 0.6880389797326112;

  /**
   * Figure 2 supplement 2B, tFL percentage divided by 100, relative to
   * ipsilateral hind touchdown.
   */
  const FORE_PHASE: number = 22.450064886615763 / 100;

  /**
   * Figure 2 supplement 2B, tFLcontr percentage divided by 100, on the same
   * hind-referenced clock.
   */
  const OPPOSITE_FORE_PHASE: number = 0.7169512028591289;

  /**
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
          rightFore: OPPOSITE_FORE_PHASE - FORE_PHASE,
          leftHind: 1 - FORE_PHASE,
          rightHind: 0.5 - FORE_PHASE,
        },
        rows: [
          {
            speed: 0.71,
            stride: STRIDE,
            deviation: 0,
            stance: STRIDE * FORE_DUTY,
            hindStance: STRIDE * HIND_DUTY,
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
