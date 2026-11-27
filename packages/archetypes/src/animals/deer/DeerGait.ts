import { AutoMovieArchetypeEquineGait } from "../AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import { DeerCohorts } from "./DeerCohorts";
import { DeerGaitData } from "./internal/DeerGaitData";

/*
 * An observed sika walking clock, with explicit construction-only pose data.
 *
 * Catavitello, Ivanenko and Lacquaniti (2018), eLife 7:e38190, Table 1 and
 * Figure 2–figure supplement 2 source data B/C/D, recorded three sika deer
 * freely walking in Nara, Japan, at 0.78 m/s: six hindlimb and six forelimb
 * strides. Published numerical tables were joined by Cervusnippon row name,
 * because B/C/D have different row populations and ordering.
 * https://doi.org/10.7554/eLife.38190
 * https://cdn.elifesciences.org/articles/38190/elife-38190-fig2-figsupp2-data1-v2.zip
 *
 * D gives the mean stride period in seconds, C the fore/hind stance
 * percentages, and B both fore onsets relative to the camera-facing hindlimb.
 * The stance seconds below combine that common representative period and each
 * reported fraction; they are not directly reported mean stance times. Values
 * are averaged over strides then animals. Unreported stride SD is left unknown:
 * zero deviation means authored deterministic variation.
 *
 * The camera-facing side is assigned to model left and its fore onset rebased
 * to zero. Both measured fore delays are preserved; the opposite hind contact
 * is authored half a stride later under the paper's roughly symmetric walk
 * description. The Boso body reference and the Nara timing observations come
 * from separate populations. Absolute timing leaves the observed clock
 * unscaled. Fold, lift, bob and top-joint follow remain named horse
 * construction proxies, and nod is authored zero. A sika's faster rotary gallop
 * needs independent timing and phase data; this walking-only table does not
 * substitute the horse's transverse gallop.
 */
export namespace DeerGait {
  /*
   * One measured walking point with no invented faster-gait clock or stride
   * spread.
   */
  export const TABLE: AutoMovieArchetypeQuadrupedGait.ITable = {
    order: ["walk"],
    gaits: {
      walk: {
        ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: DeerGaitData.OPPOSITE_FORE_PHASE - DeerGaitData.FORE_PHASE,
          leftHind: 1 - DeerGaitData.FORE_PHASE,
          rightHind: 0.5 - DeerGaitData.FORE_PHASE,
        },
        rows: [
          {
            speed: 0.78,
            stride: DeerGaitData.STRIDE,
            deviation: 0,
            stance: DeerGaitData.STRIDE * DeerGaitData.FORE_DUTY,
            hindStance: DeerGaitData.STRIDE * DeerGaitData.HIND_DUTY,
          },
        ],
      },
    },
    reference: DeerCohorts.MEASURES[DeerCohorts.DEFAULT].withers,
    scaling: "absolute",
    hysteresis: 0,
    follow: AutoMovieArchetypeEquineGait.FOLLOW,
  };
}
