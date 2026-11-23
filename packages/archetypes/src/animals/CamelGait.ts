import { AutoMovieArchetypeCamelBody } from "./AutoMovieArchetypeCamelBody";
import { AutoMovieArchetypeEquineGait } from "./AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";

/**
 * A provisional dromedary walk from an observed Bactrian walking point.
 *
 * Catavitello, Ivanenko and Lacquaniti (2018), eLife 7:e38190, Table 1 and
 * Figure 2–figure supplement 2 source data B/C/D, observed two Bactrian camels
 * at 1.08 m/s, with ten hindlimb and seven forelimb strides. This is lateral
 * walking with separated same-side contacts, not a running pace.
 * https://doi.org/10.7554/eLife.38190
 * https://cdn.elifesciences.org/articles/38190/elife-38190-fig2-figsupp2-data1-v2.zip
 *
 * The readme identifies stride seconds (D), stance percentages (C), and fore
 * touchdown delays relative to the camera-facing hindlimb (B). Values were
 * selected by the Camelusbactrianus row name, not by a shared row index.
 * Multiplying the reported mean period by each reported fraction constructs a
 * representative clock; it is not a newly measured mean stance duration. The
 * source averages strides then animals. Its published tables provide no stride
 * SD, so zero deviation is an authored deterministic variation choice.
 *
 * Map the camera-facing side to model left, rebase its fore touchdown to zero
 * and retain both measured fore phases. The opposite hind touchdown uses an
 * authored half-cycle symmetry assumption, not a measured phase. Transfer from
 * Bactrian camels to AutoMovieArchetypeCamelBody's Mauritanian dromedaries is
 * explicitly provisional. Absolute scaling does not infer a shared reference
 * height. Horse fold, clearance, bob and top-joint follow are construction
 * proxies; neck nod is authored zero. The dromedary's running pace needs its
 * own clock and coincident lateral contacts; this table declares only the
 * observed walking point and supplies no invented pace/trot interval.
 */
export namespace CamelGait {
  /**
   * Figure 2 supplement 2D, Camelusbactrianus row: observed mean period,
   * seconds.
   */
  const STRIDE: number = 1.7333333333333336;

  /** Figure 2 supplement 2C, fore stance percentage divided by 100. */
  const FORE_DUTY: number = 0.7194109095774127;

  /** Figure 2 supplement 2C, hind stance percentage divided by 100. */
  const HIND_DUTY: number = 0.66768111169193;

  /**
   * Figure 2 supplement 2B, camera-facing fore onset as a fraction after its
   * ipsilateral hind.
   */
  const FORE_PHASE: number = 14.293928555816956 / 100;

  /**
   * Figure 2 supplement 2B, opposite fore onset on the same hind-referenced
   * clock.
   */
  const OPPOSITE_FORE_PHASE: number = 0.6425789503922897;

  /**
   * One measured walking point; the remaining camel gait clocks are not
   * measured here.
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
            speed: 1.08,
            stride: STRIDE,
            deviation: 0,
            stance: STRIDE * FORE_DUTY,
            hindStance: STRIDE * HIND_DUTY,
          },
        ],
      },
    },
    reference: AutoMovieArchetypeCamelBody.MEASURES.withers,
    scaling: "absolute",
    hysteresis: 0,
    follow: AutoMovieArchetypeEquineGait.FOLLOW,
  };
}
